/**
 * Shared rules engine — turn-based combat, one player choice per round.
 * Rules from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode): initiative (DEX check, surprise = Disadvantage),
 * attack = d20 + ability modifier + proficiency vs AC, natural 20 crit (damage dice twice), natural 1 miss,
 * Dodge / Disengage / Hide (each sneaker vs each watcher's Passive Perception; SK-3) / Help, opportunity attacks on leaving reach, saving throws,
 * conditions (checkRules CONDITION_EFFECTS) and death saves.
 * SynapticGM solo design: foes leave a downed PC (no attacks at 0 HP). Disengage only stops opportunity
 * attacks (the fight goes on); escape by Flee (Dash) gets away after the opportunity attacks.
 * This module knows no mode. combatPresenter decides what each mode shows.
 */
import type { AttributeKey, CombatCondition, DeathSaveState, RoundCombatState, RoundFoeState } from '../types';
import { combineAdv, conditionEffect, rollD20WithAdv, type AdvState } from '../checkRules';
import { rollDice, rollDie, type CritRule, type DiceRoll, type Rng } from './dice';
import type { StatBlock } from './srdMonsters';
import { abilityModOf } from './srdMonsters';
import { concentrationDc, SPELLS, spellDice, type SpellDef } from './spells';
import type { WeaponMastery } from './srdGear';

export type RoundAction = 'attack' | 'cast' | 'dodge' | 'disengage' | 'help' | 'hide' | 'item' | 'flee' | 'other';

/** SK-3: each sneaker vs each watcher; one failure is enough to be noticed. */
export function individualStealth(
  sneakers: { name: string; stealthTotal: number }[],
  watchers: { name: string; passivePerception: number }[],
): { noticed: boolean; rows: { sneaker: string; watcher: string; stealthTotal: number; perception: number; seen: boolean }[] } {
  const rows: { sneaker: string; watcher: string; stealthTotal: number; perception: number; seen: boolean }[] = [];
  let noticed = false;
  for (let si = 0; si < sneakers.length; si++) {
    const s = sneakers[si]!;
    for (let wi = 0; wi < watchers.length; wi++) {
      const w = watchers[wi]!;
      const seen = w.passivePerception >= s.stealthTotal;
      if (seen) noticed = true;
      rows.push({ sneaker: s.name, watcher: w.name, stealthTotal: s.stealthTotal, perception: w.passivePerception, seen });
    }
  }
  return { noticed, rows };
}

export interface PcWeapon {
  name: string;
  toHit: number;
  /** Damage dice (e.g. 1d8) and the ability modifier added to it. */
  dice: string;
  mod: number;
  type: string;
  ranged: boolean;
  /** Rogue Sneak Attack dice, used once a turn with Advantage and a Finesse or ranged weapon. */
  sneakAttack?: string;
  finesse?: boolean;
  /** A Strength attack (melee, not finesse-with-DEX): Rage damage, Reckless Attack and Frenzy apply. */
  strBased?: boolean;
  /** SRD 5.2.1 Weapon Mastery property the PC can use with this weapon, and its save DC (8 + mod + PB). */
  mastery?: WeaponMastery;
  masteryDc?: number;
}

export interface PcCantrip {
  name: string;
  kind: 'attack' | 'save';
  toHit: number;
  dc: number;
  save?: AttributeKey;
  dice: string;
  type: string;
  /** A melee spell attack (Chill Touch, Shocking Grasp). */
  melee?: boolean;
  /** A condition a hit or failed save leaves (Vicious Mockery). */
  rider?: string;
  /** Flat damage added to each hit (Warlock Agonizing Blast). */
  damageMod?: number;
}

/** A spell the PC can cast this fight, with the numbers from the sheet. */
export interface PcSpell {
  name: string;
  def: SpellDef;
  toHit: number;
  dc: number;
  /** Spellcasting ability modifier (added to healing). */
  mod: number;
  /** Flat damage added to a cantrip hit (Agonizing Blast). */
  damageMod?: number;
}

export interface PcProfile {
  name: string;
  ac: number;
  /** AC under Mage Armor (13 + DEX, + shield); absent when armor is worn. */
  mageArmorAc?: number;
  /** Levelled spells and extra cantrips, plus the slots left per spell level (index 0 = level 1). */
  spells?: PcSpell[];
  slots?: number[];
  /** Champion Improved Critical: weapon attacks crit on 19–20. */
  improvedCritical?: boolean;
  /** Evoker Potent Cantrip: a missed or saved cantrip still deals half damage. */
  potentCantrip?: boolean;
  /** Life Domain Disciple of Life: healing spells add 2 + the slot level. */
  discipleOfLife?: boolean;
  hp: number;
  maxHp: number;
  speed: number;
  initiativeMod: number;
  saves: Record<AttributeKey, number>;
  stealth: number;
  species: string;
  weapon: PcWeapon;
  cantrip?: PcCantrip;
  potion?: { name: string; heal: string };
  /** An ally beside the PC (Help gives its next attack Advantage). */
  ally?: { name: string; toHit: number; dice: string; type: string };
  /** A sidekick who takes its own turn right after the PC's, and whom foes can attack. */
  sidekick?: SidekickProfile;
  /** Variant encumbrance past STR × 10: Disadvantage on attack rolls and STR / DEX / CON saves. */
  heavilyEncumbered?: boolean;
  /** Worn armor the PC is not trained in: Disadvantage on STR / DEX attacks and saves; the presenter drops spells. */
  untrainedArmor?: string;
  /** Conditions the PC carries outside the fight (e.g. Poisoned). */
  conditions: string[];
  /** Barbarian Rage damage on Strength attacks while raging. */
  rageDamage?: number;
  /** Barbarian Danger Sense: Advantage on DEX saves. */
  dangerSense?: boolean;
  /** Path of the Berserker Frenzy: the first Reckless Strength hit while raging adds 2d6. */
  frenzy?: boolean;
  /** Hunter's Prey (Colossus Slayer): once a turn, +1d8 on a weapon hit against a wounded foe. */
  colossusSlayer?: boolean;
  /** Monk Deflect Attacks: once a round, a melee or ranged hit is reduced by 1d10 + DEX + Monk level. */
  deflect?: { dexMod: number; level: number };
  /** Monk Martial Arts: a bonus Unarmed Strike after the Attack action. */
  bonusStrike?: { name: string; toHit: number; dice: string; mod: number; type: string };
  /** Warlock Eldritch Mind: Advantage on Concentration saves. */
  eldritchMind?: boolean;
}

/** Bonus-action class features the PC uses this round (resolved before the action). */
export interface RoundFeatures {
  rage?: boolean;
  reckless?: boolean;
  innateSorcery?: boolean;
  /** Lay On Hands: HP to restore from the pool. */
  layOnHands?: number;
}

export interface SidekickProfile {
  name: string;
  kind: 'warrior' | 'expert' | 'spellcaster';
  ac: number;
  hp: number;
  maxHp: number;
  toHit: number;
  dice: string;
  type: string;
  /** Spellcaster: one heal per fight on the PC at half HP or less. */
  heal?: string;
  /** Stealth modifier when the sidekick sneaks with the PC (SK-3). */
  stealth?: number;
}

export type CombatEvent =
  | { k: 'initiative'; who: string; d20s: number[]; kept: number; mod: number; total: number; adv: AdvState }
  | { k: 'attack'; attacker: string; target: string; with: string; d20s: number[]; kept: number; adv: AdvState; mod: number; total: number; ac: number; hit: boolean; crit: boolean; nat1: boolean; damage?: DiceRoll; extra?: DiceRoll; sneak?: DiceRoll; type?: string; dealt: number; hpBefore: number; hpAfter: number; maxHp: number; opportunity?: boolean; vulnerable?: boolean; pc: boolean; bless?: number; bane?: number; half?: boolean; spell?: boolean; flank?: boolean; cleave?: boolean; inspiration?: InspirationUse; sidekick?: boolean; bonus?: StrikeBonus[]; reduced?: { label: string; roll?: DiceRoll; amount: number }; mastery?: WeaponMastery }
  | { k: 'save'; who: string; ability: AttributeKey; d20s: number[]; kept: number; adv: AdvState; mod: number; total: number; dc: number; ok: boolean; autoFail?: boolean; why: string; pc: boolean; bless?: number; bane?: number; inspiration?: InspirationUse }
  | { k: 'cast'; who: string; spell: string; slot?: number; concentration?: boolean; detail?: string }
  | { k: 'concentration'; who: string; spell: string; on: false; why: string }
  | { k: 'check'; who: string; label: string; d20s: number[]; kept: number; adv: AdvState; mod: number; total: number; dc: number; ok: boolean; why: string }
  | { k: 'condition'; who: string; name: string; on: boolean; why: string; pc: boolean }
  | { k: 'act'; who: string; action: RoundAction | 'stand' | 'skip' | 'close' | 'feature'; detail: string; pc: boolean }
  | { k: 'heal'; who: string; item: string; roll: DiceRoll; hpBefore: number; hpAfter: number; spell?: boolean; slot?: number; pool?: number }
  | { k: 'extra'; who: string; label: string; amount: number; type: string; hpBefore: number; hpAfter: number; maxHp: number; pc: boolean }
  | { k: 'down'; who: string; pc: boolean; massive?: boolean; sidekick?: boolean }
  | { k: 'fortitude'; who: string };

/** Extra damage a hit carries beyond the weapon or spell dice (Rage, Divine Smite, Hunter's Mark…). */
export interface StrikeBonus {
  label: string;
  roll?: DiceRoll;
  flat?: number;
}

/** Heroic Inspiration spent on this roll: a reroll of a failed d20 (SRD 5.2.1) or Advantage (SRD 5.1). */
export type InspirationUse = { mode: 'reroll'; first: number } | { mode: 'advantage' };

export type RoundOutcome = 'ongoing' | 'victory' | 'escaped' | 'down' | 'dead';

export interface RoundResult {
  combat: RoundCombatState;
  pcHp: number;
  outcome: RoundOutcome;
  events: Array<CombatEvent & { round: number }>;
  /** A potion was drunk this round. */
  potionUsed?: boolean;
  /** Round number this result played. */
  round: number;
  /** The spell slot level spent this round. */
  slotSpent?: number;
  /** Mage Armor was cast this round. */
  mageArmor?: boolean;
  /** Heroic Inspiration was spent this round. */
  inspirationSpent?: boolean;
  /** A class feature cast the spell with no slot (Favored Enemy, Paladin's Smite). */
  freeCastUsed?: boolean;
  /** Class features started this round (Rage, Innate Sorcery) and Lay On Hands HP spent. */
  featuresUsed?: { rage?: boolean; innateSorcery?: boolean; layOnHands?: number };
}

const has = (list: CombatCondition[], name: string) => list.some((c) => c.name.toLowerCase() === name.toLowerCase());
const effects = (list: CombatCondition[], extra: string[] = []) =>
  [...list.map((c) => c.name), ...extra].map((n) => conditionEffect(n)).filter(Boolean) as NonNullable<ReturnType<typeof conditionEffect>>[];

function attackAdv(attacker: CombatCondition[], target: CombatCondition[], ranged: boolean, extra: AdvState[] = [], attackerExtra: string[] = [], targetExtra: string[] = []): AdvState {
  const a = effects(attacker, attackerExtra).map((e) => e.attacks ?? 'normal');
  const t = effects(target, targetExtra).map((e) => (e.prone ? (ranged ? 'disadvantage' : 'advantage') : e.attacked ?? 'normal'));
  return combineAdv(...a, ...t, ...extra);
}

function canAct(list: CombatCondition[], extra: string[] = []): boolean {
  return !effects(list, extra).some((e) => e.noActions);
}

function speedZero(list: CombatCondition[], extra: string[] = []): boolean {
  return effects(list, extra).some((e) => e.speedZero);
}

/** Initiative: one roll for the PC, one shared roll for identical foes (SRD). Surprised side rolls with Disadvantage. */
export function rollInitiative(
  pc: PcProfile,
  foes: Array<{ id: string; name: string; block: StatBlock }>,
  rng: Rng,
  surprised: 'foes' | 'pc' | null
): { pcInitiative: number; foeInitiative: Record<string, number>; events: CombatEvent[] } {
  const events: CombatEvent[] = [];
  const pcAdv: AdvState = surprised === 'pc' ? 'disadvantage' : 'normal';
  const p = rollD20WithAdv(pcAdv, rng);
  events.push({ k: 'initiative', who: pc.name, d20s: p.d20s, kept: p.kept, mod: pc.initiativeMod, total: p.kept + pc.initiativeMod, adv: pcAdv });
  const byBlock = new Map<string, number>();
  const foeInitiative: Record<string, number> = {};
  const foeAdv: AdvState = surprised === 'foes' ? 'disadvantage' : 'normal';
  for (const f of foes) {
    const key = f.block.id === 'engine' ? f.id : f.block.id;
    if (!byBlock.has(key)) {
      const m = abilityModOf(f.block.scores.DEX);
      const r = rollD20WithAdv(foeAdv, rng);
      byBlock.set(key, r.kept + m);
      events.push({ k: 'initiative', who: foes.length > 1 ? `${f.block.srd ? f.block.name : f.name} ×${foes.filter((o) => (o.block.id === 'engine' ? o.id : o.block.id) === key).length}` : f.name, d20s: r.d20s, kept: r.kept, mod: m, total: r.kept + m, adv: foeAdv });
    }
    foeInitiative[f.id] = byBlock.get(key)!;
  }
  return { pcInitiative: p.kept + pc.initiativeMod, foeInitiative, events };
}

function saveRoll(mod: number, dc: number, conds: CombatCondition[], ability: AttributeKey, rng: Rng, extra: string[] = [], extraAdv: AdvState[] = []) {
  const eff = effects(conds, extra);
  if ((ability === 'STR' || ability === 'DEX') && eff.some((e) => e.autoFailSaves)) {
    return { d20s: [] as number[], kept: 0, adv: 'normal' as AdvState, total: 0, ok: false, autoFail: true };
  }
  const adv = combineAdv(...(ability === 'DEX' ? eff.map((e) => e.dexSaves ?? 'normal') : []), ...extraAdv);
  const r = rollD20WithAdv(adv, rng);
  return { d20s: r.d20s, kept: r.kept, adv, total: r.kept + mod, ok: r.kept + mod >= dc, autoFail: false };
}

interface Ctx {
  pc: PcProfile;
  blocks: Record<string, StatBlock>;
  rng: Rng;
  round: number;
  combat: RoundCombatState;
  pcHp: number;
  events: Array<CombatEvent & { round: number }>;
  outcome: RoundOutcome;
  potionUsed?: boolean;
  /** AC before Shield of Faith (Mage Armor cast mid-fight changes it). */
  acBase: number;
  spell?: string;
  slotLevel?: number;
  slotSpent?: number;
  mageArmor?: boolean;
  inspirationSpent?: boolean;
  rules: RoundRules;
  features: RoundFeatures;
  /** The cast spends no slot (a class feature pays for it). */
  freeCast?: boolean;
  freeCastUsed?: boolean;
  featuresUsed: { rage?: boolean; innateSorcery?: boolean; layOnHands?: number };
  /** Once-a-turn flags for the PC's current turn (incl. TT-X1 action economy). */
  turn: {
    attacked?: boolean;
    frenzy?: boolean;
    colossus?: boolean;
    cleave?: boolean;
    rageStarted?: boolean;
    movementLeft?: number;
    actionUsed?: boolean;
    bonusUsed?: boolean;
    reactionUsed?: boolean;
  };
}

/** Optional table rules the round obeys (from the player's house rules). */
export interface RoundRules {
  /** A melee weapon blow that drops a foe carries its leftover damage into the next foe it would also have hit. */
  cleave?: boolean;
  /** Melee attacks have Advantage when an ally also presses the target (the PC's ally, or a second foe on the PC). */
  flanking?: boolean;
  /** Critical hit damage rule (default: the dice twice). */
  critRule?: CritRule;
  /** Foe damage is multiplied by this (solo scaling ¾), at least 1 on a hit. */
  foeDamageScale?: number;
  /** Foe attacks carry no save-or-condition rider (solo scaling). */
  noRiders?: boolean;
  /** The PC holds Heroic Inspiration: reroll the first failed attack roll or save (5.2.1), or Advantage on the first attack (5.1). */
  inspiration?: 'reroll' | 'advantage';
  /** Darkness and no light carried (SRD Vision and Light): a foe without Darkvision, and the PC's sidekick or ally, have the Blinded condition. The PC's own Blinded comes in on its conditions. */
  darkness?: boolean;
  /** SRD 5.2.1 Weapon Mastery properties apply (off under SRD 5.1). */
  mastery?: boolean;
  /** SRD 5.2.1 Strong Wind: Disadvantage on ranged weapon attack rolls (spell attacks are not weapon attacks). */
  strongWind?: boolean;
}

/** Blinded in the fight's darkness: a foe with no Darkvision, or the PC's sidekick / ally. */
const foeBlind = (ctx: Ctx, block: StatBlock | undefined): string[] => (ctx.rules.darkness && !block?.darkvision ? ['Blinded'] : []);
const allyBlind = (ctx: Ctx): string[] => (ctx.rules.darkness ? ['Blinded'] : []);

function push(ctx: Ctx, e: CombatEvent) {
  ctx.events.push({ ...e, round: ctx.round });
}

function pcAc(ctx: Ctx): number {
  return ctx.acBase + (ctx.combat.concentration === 'Shield of Faith' ? 2 : 0);
}

/** Bless: +1d4 on the PC's attack rolls and saving throws while held. */
function blessRoll(ctx: Ctx): number | undefined {
  return ctx.combat.concentration === 'Bless' ? rollDie(4, ctx.rng) : undefined;
}

/** Bane: a cursed foe subtracts 1d4 from its attack rolls and saving throws. */
function baneRoll(ctx: Ctx, foe: RoundFoeState): number | undefined {
  return has(foe.conditions, 'Bane') ? rollDie(4, ctx.rng) : undefined;
}

/** Concentration ends: every condition the spell left on a foe (Bane, Faerie Fire, Entangle, a Hex mark) ends with it. */
function endConcentration(ctx: Ctx, why: string) {
  const spell = ctx.combat.concentration;
  if (!spell) return;
  ctx.combat = {
    ...ctx.combat,
    concentration: null,
    foes: ctx.combat.foes.map((f) => ({ ...f, conditions: f.conditions.filter((c) => c.source !== spell) })),
  };
  push(ctx, { k: 'concentration', who: ctx.pc.name, spell, on: false, why });
}

/** Damage taken while holding Concentration: CON save, DC 10 or half the damage, or the spell ends. */
function concentrationCheck(ctx: Ctx, damage: number) {
  const spell = ctx.combat.concentration;
  if (!spell || damage <= 0) return;
  if (ctx.pcHp <= 0) {
    endConcentration(ctx, 'you dropped to 0 HP');
    return;
  }
  if (!pcSave(ctx, 'CON', concentrationDc(damage), `to hold ${spell}`, ctx.pc.eldritchMind ? ['advantage'] : [])) endConcentration(ctx, 'failed the CON save');
}

const canReroll = (ctx: Ctx) => ctx.rules.inspiration === 'reroll' && !ctx.inspirationSpent;

/**
 * A PC saving throw: Bless adds 1d4, heavy encumbrance gives STR / DEX / CON Disadvantage, and Heroic Inspiration
 * (SRD 5.2.1) rerolls the first failure.
 */
function pcSave(ctx: Ctx, ability: AttributeKey, dc: number, why: string, adv: AdvState[] = []): boolean {
  const mod = ctx.pc.saves[ability] ?? 0;
  const heavy =
    (!!ctx.pc.heavilyEncumbered && (ability === 'STR' || ability === 'DEX' || ability === 'CON')) ||
    (!!ctx.pc.untrainedArmor && (ability === 'STR' || ability === 'DEX'));
  // Danger Sense: Advantage on DEX saves. Rage: Advantage on STR saves.
  const feature: AdvState[] = [
    ...(ability === 'DEX' && ctx.pc.dangerSense ? ['advantage' as const] : []),
    ...(ability === 'STR' && ctx.combat.raging ? ['advantage' as const] : []),
  ];
  const roll = () => {
    const raw = saveRoll(mod, dc, ctx.combat.pcConditions, ability, ctx.rng, ctx.pc.conditions, [...(heavy ? ['disadvantage' as const] : []), ...feature, ...adv]);
    const bless = raw.autoFail ? undefined : blessRoll(ctx);
    const total = raw.total + (bless ?? 0);
    return { ...raw, bless, total, ok: !raw.autoFail && total >= dc };
  };
  let sv = roll();
  let inspiration: InspirationUse | undefined;
  if (!sv.ok && !sv.autoFail && canReroll(ctx)) {
    inspiration = { mode: 'reroll', first: sv.kept };
    ctx.inspirationSpent = true;
    sv = roll();
  }
  push(ctx, { k: 'save', who: ctx.pc.name, ability, d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod, total: sv.total, dc, ok: sv.ok, autoFail: sv.autoFail, why, pc: true, bless: sv.bless, ...(inspiration ? { inspiration } : {}) });
  return sv.ok;
}

function liveFoes(ctx: Ctx): RoundFoeState[] {
  return ctx.combat.foes.filter((f) => f.hp > 0);
}

function endTurnOf(ctx: Ctx, id: string) {
  const drop = (list: CombatCondition[], who: string, pc: boolean) =>
    list.flatMap((c) => {
      if (c.endsAfterTurnOf !== id) return [c];
      if (c.fresh) return [{ ...c, fresh: false }];
      push(ctx, { k: 'condition', who, name: c.name, on: false, why: 'it wears off', pc });
      return [];
    });
  ctx.combat = {
    ...ctx.combat,
    pcConditions: drop(ctx.combat.pcConditions, ctx.pc.name, true),
    foes: ctx.combat.foes.map((f) => ({ ...f, conditions: drop(f.conditions, f.name, false) })),
  };
}

function damagePc(ctx: Ctx, amount: number) {
  const before = ctx.pcHp;
  ctx.pcHp = Math.max(0, before - amount);
  if (ctx.pcHp === 0 && before > 0) {
    const massive = amount - before >= ctx.pc.maxHp;
    push(ctx, { k: 'down', who: ctx.pc.name, pc: true, massive });
    ctx.outcome = massive ? 'dead' : 'down';
    if (ctx.combat.raging) ctx.combat = { ...ctx.combat, raging: false };
  }
  concentrationCheck(ctx, amount);
}

function foeTurn(ctx: Ctx, foe: RoundFoeState, opportunity = false) {
  const block = ctx.blocks[foe.id]!;
  if (!opportunity) {
    if (!canAct(foe.conditions)) {
      push(ctx, { k: 'act', who: foe.name, action: 'skip', detail: `cannot act (${foe.conditions.map((c) => c.name).join(', ')})`, pc: false });
      endTurnOf(ctx, foe.id);
      return;
    }
    if (ctx.combat.hiddenStealth != null) {
      const m = block.passivePerception - 10;
      const r = rollD20WithAdv('normal', ctx.rng);
      const found = r.kept + m >= ctx.combat.hiddenStealth;
      push(ctx, { k: 'check', who: foe.name, label: 'Perception', d20s: r.d20s, kept: r.kept, adv: 'normal', mod: m, total: r.kept + m, dc: ctx.combat.hiddenStealth, ok: found, why: found ? 'finds you' : 'cannot find you' });
      if (found) unhide(ctx, `${foe.name} found you`);
    }
    if (has(foe.conditions, 'Prone')) {
      foe = { ...foe, conditions: foe.conditions.filter((c) => c.name !== 'Prone') };
      ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === foe.id ? foe : f)) };
      push(ctx, { k: 'act', who: foe.name, action: 'stand', detail: 'stands up (half its Speed)', pc: false });
    }
    const burning = foe.conditions.find((c) => c.name === 'Searing Smite');
    if (burning) {
      foeBurn(ctx, foe, burning);
      foe = ctx.combat.foes.find((f) => f.id === foe.id)!;
      if (foe.hp <= 0) return;
    }
    const held = foe.conditions.find((c) => c.name === 'Restrained' && c.dc != null);
    if (held) {
      // A foe held by a spell spends its action on a Strength (Athletics) check to break free.
      const m = abilityModOf(block.scores.STR);
      const r = rollD20WithAdv('normal', ctx.rng);
      const ok = r.kept + m >= held.dc!;
      push(ctx, { k: 'check', who: foe.name, label: 'Athletics', d20s: r.d20s, kept: r.kept, adv: 'normal', mod: m, total: r.kept + m, dc: held.dc!, ok, why: ok ? 'breaks free' : 'stays caught' });
      if (ok) {
        ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === foe.id ? { ...f, conditions: f.conditions.filter((c) => c !== held) } : f)) };
        push(ctx, { k: 'condition', who: foe.name, name: 'Restrained', on: false, why: 'broke free', pc: false });
      }
      endTurnOf(ctx, foe.id);
      return;
    }
  }
  const atk = block.attack;
  // A sidekick still standing draws every second foe's attack (never an opportunity attack on the fleeing PC).
  if (!opportunity && sidekickUp(ctx) && ctx.combat.foes.findIndex((f) => f.id === foe.id) % 2 === 1) {
    foeAttackSidekick(ctx, foe, block);
    endTurnOf(ctx, foe.id);
    return;
  }
  const pcConds = ctx.combat.pcConditions;
  const flank = !!ctx.rules.flanking && !atk.ranged && liveFoes(ctx).length >= 2;
  // Sap and Vicious Mockery: Disadvantage on the foe's next attack roll, then they are used up.
  const spent = foe.conditions.filter((c) => c.name === 'Sap' || c.name === 'Vicious Mockery');
  const foeExtra: AdvState[] = [
    ...(ctx.combat.dodging ? ['disadvantage' as const] : []),
    ...(flank ? ['advantage' as const] : []),
    ...(ctx.combat.reckless ? ['advantage' as const] : []),
    ...(spent.length ? ['disadvantage' as const] : []),
    ...(ctx.rules.strongWind && atk.ranged ? ['disadvantage' as const] : []),
  ];
  if (spent.length) ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === foe.id ? { ...f, conditions: f.conditions.filter((c) => !spent.includes(c)) } : f)) };
  const adv = attackAdv(foe.conditions, pcConds, !!atk.ranged, foeExtra, foeBlind(ctx, block), ctx.pc.conditions);
  const r = rollD20WithAdv(adv, ctx.rng);
  const bane = baneRoll(ctx, foe);
  const total = r.kept + atk.toHit - (bane ?? 0);
  const nat1 = r.kept === 1;
  const nat20 = r.kept === 20;
  const ac = pcAc(ctx);
  const hit = nat20 || (!nat1 && total >= ac);
  const critAgainst = effects(pcConds).some((e) => e.meleeCritAgainst) && !atk.ranged;
  const crit = hit && (nat20 || critAgainst);
  let dealt = 0;
  let damage: DiceRoll | undefined;
  let extra: DiceRoll | undefined;
  const hpBefore = ctx.pcHp;
  let reduced: { label: string; roll?: DiceRoll; amount: number } | undefined;
  if (hit) {
    damage = rollDice(atk.damage, ctx.rng, { crit, critRule: ctx.rules.critRule });
    extra = atk.extra ? rollDice(atk.extra.dice, ctx.rng, { crit, critRule: ctx.rules.critRule }) : undefined;
    dealt = scaleFoeDamage(ctx, damage.total + (extra?.total ?? 0));
    // Monk Deflect Attacks (once a round), then Rage resistance to bludgeoning, piercing and slashing.
    if (ctx.pc.deflect && !ctx.combat.deflectUsed && dealt > 0 && canAct(ctx.combat.pcConditions, ctx.pc.conditions)) {
      const roll = rollDice('1d10', ctx.rng, { extraBonus: ctx.pc.deflect.dexMod + ctx.pc.deflect.level });
      const amount = Math.min(dealt, roll.total);
      dealt -= amount;
      ctx.combat = { ...ctx.combat, deflectUsed: true };
      reduced = { label: 'Deflect Attacks', roll, amount };
    }
    if (ctx.combat.raging && /^(bludgeoning|piercing|slashing)$/i.test(atk.type) && dealt > 0) {
      const amount = dealt - Math.floor(dealt / 2);
      dealt -= amount;
      reduced = reduced ? { ...reduced, label: `${reduced.label} and Rage resistance`, amount: reduced.amount + amount } : { label: 'Rage resistance', amount };
    }
  }
  const hpAfter = Math.max(0, hpBefore - dealt);
  push(ctx, { k: 'attack', attacker: foe.name, target: ctx.pc.name, with: atk.name, d20s: r.d20s, kept: r.kept, adv, mod: atk.toHit, total, ac, hit, crit, nat1, damage, extra, type: atk.type, dealt, hpBefore, hpAfter, maxHp: ctx.pc.maxHp, opportunity, pc: false, bane, ...(flank ? { flank } : {}), ...(reduced ? { reduced } : {}) });
  if (hit) {
    damagePc(ctx, dealt);
    if (ctx.pcHp > 0 && atk.inflicts && !has(ctx.combat.pcConditions, atk.inflicts)) {
      ctx.combat = { ...ctx.combat, pcConditions: [...ctx.combat.pcConditions, { name: atk.inflicts, source: foe.name }] };
      push(ctx, { k: 'condition', who: ctx.pc.name, name: atk.inflicts, on: true, why: `${foe.name}'s ${atk.name}`, pc: true });
    }
    const rider = ctx.rules.noRiders ? undefined : atk.rider;
    if (ctx.pcHp > 0 && rider) {
      if (rider.immuneSpecies?.includes(ctx.pc.species)) {
        push(ctx, { k: 'condition', who: ctx.pc.name, name: rider.condition, on: false, why: `${ctx.pc.species} immune`, pc: true });
      } else if (!pcSave(ctx, rider.save, rider.dc, `against ${rider.condition}`)) {
        ctx.combat = { ...ctx.combat, pcConditions: [...ctx.combat.pcConditions.filter((c) => c.name !== rider.condition), { name: rider.condition, endsAfterTurnOf: 'pc', source: foe.name }] };
        push(ctx, { k: 'condition', who: ctx.pc.name, name: rider.condition, on: true, why: `${foe.name}'s ${atk.name}`, pc: true });
      }
    }
  }
  if (!opportunity) endTurnOf(ctx, foe.id);
}

/** Searing Smite: at the start of its turn the burning foe takes the burn dice, then a CON save ends the fire. */
function foeBurn(ctx: Ctx, foe: RoundFoeState, burning: CombatCondition) {
  const def = SPELLS[burning.source ?? ''] ?? SPELLS['Searing Smite']!;
  const roll = rollDice(def.burn ?? '1d6', ctx.rng);
  const hpBefore = foe.hp;
  const res = damageFoe(ctx, foe, roll.total, def.onHit?.type ?? 'fire', false);
  push(ctx, { k: 'extra', who: foe.name, label: `${def.name} burn ${roll.notation} (${roll.dice.join(', ')})`, amount: res.dealt, type: def.onHit?.type ?? 'fire', hpBefore, hpAfter: res.hpAfter, maxHp: foe.maxHp, pc: false });
  for (const e of res.after) push(ctx, e);
  if (res.hpAfter === 0) {
    push(ctx, { k: 'down', who: foe.name, pc: false });
    return;
  }
  const block = ctx.blocks[foe.id]!;
  const m = abilityModOf(block.scores.CON);
  const dc = burning.dc ?? 10;
  const sv = saveRoll(m, dc, foe.conditions, 'CON', ctx.rng);
  push(ctx, { k: 'save', who: foe.name, ability: 'CON', d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod: m, total: sv.total, dc, ok: sv.ok, autoFail: sv.autoFail, why: `against ${def.name}`, pc: false });
  if (sv.ok) {
    ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === foe.id ? { ...f, conditions: f.conditions.filter((c) => c.name !== 'Searing Smite') } : f)) };
    push(ctx, { k: 'condition', who: foe.name, name: 'Searing Smite', on: false, why: 'the flames go out', pc: false });
  }
}

/** Solo scaling: foe damage × the scale, at least 1 on a hit. */
function scaleFoeDamage(ctx: Ctx, raw: number): number {
  const s = ctx.rules.foeDamageScale;
  return s && s !== 1 && raw > 0 ? Math.max(1, Math.floor(raw * s)) : raw;
}

const sidekickUp = (ctx: Ctx) => !!ctx.pc.sidekick && (ctx.combat.sidekickHp ?? ctx.pc.sidekick.hp) > 0;

function foeAttackSidekick(ctx: Ctx, foe: RoundFoeState, block: StatBlock) {
  const sk = ctx.pc.sidekick!;
  const atk = block.attack;
  const adv = attackAdv(foe.conditions, [], !!atk.ranged, [], foeBlind(ctx, block), allyBlind(ctx));
  const r = rollD20WithAdv(adv, ctx.rng);
  const bane = baneRoll(ctx, foe);
  const total = r.kept + atk.toHit - (bane ?? 0);
  const hit = r.kept === 20 || (r.kept !== 1 && total >= sk.ac);
  const crit = hit && r.kept === 20;
  const hpBefore = ctx.combat.sidekickHp ?? sk.hp;
  let damage: DiceRoll | undefined;
  let dealt = 0;
  if (hit) {
    damage = rollDice(atk.damage, ctx.rng, { crit, critRule: ctx.rules.critRule });
    dealt = scaleFoeDamage(ctx, damage.total);
  }
  const hpAfter = Math.max(0, hpBefore - dealt);
  ctx.combat = { ...ctx.combat, sidekickHp: hpAfter };
  push(ctx, { k: 'attack', attacker: foe.name, target: sk.name, with: atk.name, d20s: r.d20s, kept: r.kept, adv, mod: atk.toHit, total, ac: sk.ac, hit, crit, nat1: r.kept === 1, damage, type: atk.type, dealt, hpBefore, hpAfter, maxHp: sk.maxHp, pc: false, bane });
  if (hit && hpAfter === 0 && hpBefore > 0) push(ctx, { k: 'down', who: sk.name, pc: false, sidekick: true });
}

/** The sidekick's turn, right after the PC's: a Warrior attacks, an Expert Helps (the PC's next attack has Advantage), a Spellcaster heals once or casts. */
function sidekickTurn(ctx: Ctx) {
  const sk = ctx.pc.sidekick;
  if (!sk || !sidekickUp(ctx)) return;
  const target = liveFoes(ctx)[0];
  if (sk.kind === 'spellcaster' && sk.heal && !ctx.combat.sidekickHealUsed && ctx.pcHp > 0 && ctx.pcHp * 2 <= ctx.pc.maxHp) {
    const roll = rollDice(sk.heal, ctx.rng);
    const before = ctx.pcHp;
    ctx.pcHp = Math.min(ctx.pc.maxHp, before + roll.total);
    ctx.combat = { ...ctx.combat, sidekickHealUsed: true };
    push(ctx, { k: 'heal', who: sk.name, item: 'a healing spell', roll, hpBefore: before, hpAfter: ctx.pcHp, spell: true });
    return;
  }
  if (!target) return;
  if (sk.kind === 'expert') {
    ctx.combat = { ...ctx.combat, helped: true };
    push(ctx, { k: 'act', who: sk.name, action: 'help', detail: `distracts ${target.name}; your next attack has Advantage`, pc: false });
    return;
  }
  const block = ctx.blocks[target.id]!;
  const ranged = sk.kind === 'spellcaster';
  const adv = attackAdv([], target.conditions, ranged, [], allyBlind(ctx), foeBlind(ctx, block));
  const r = rollD20WithAdv(adv, ctx.rng);
  const total = r.kept + sk.toHit;
  const hit = r.kept === 20 || (r.kept !== 1 && total >= block.ac);
  const crit = hit && r.kept === 20;
  const hpBefore = target.hp;
  let damage: DiceRoll | undefined;
  let res: ReturnType<typeof damageFoe> = { dealt: 0, vulnerable: false, hpAfter: hpBefore, after: [] };
  if (hit) {
    damage = rollDice(sk.dice, ctx.rng, { crit, critRule: ctx.rules.critRule });
    res = damageFoe(ctx, target, damage.total, sk.type, crit);
  }
  push(ctx, { k: 'attack', attacker: sk.name, target: target.name, with: ranged ? 'Fire Bolt' : 'a weapon', d20s: r.d20s, kept: r.kept, adv, mod: sk.toHit, total, ac: block.ac, hit, crit, nat1: r.kept === 1, damage, type: sk.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: false, sidekick: true });
  for (const e of res.after) push(ctx, e);
  if (hit && res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
}

function unhide(ctx: Ctx, why: string) {
  if (ctx.combat.hiddenStealth == null) return;
  ctx.combat = { ...ctx.combat, hiddenStealth: null, pcConditions: ctx.combat.pcConditions.filter((c) => c.name !== 'Invisible') };
  push(ctx, { k: 'condition', who: ctx.pc.name, name: 'Invisible', on: false, why, pc: true });
}

/** Apply damage to a foe. Undead Fortitude events come back in `after` so they follow the attack that caused them. */
function damageFoe(ctx: Ctx, foe: RoundFoeState, raw: number, type: string, crit: boolean): { dealt: number; vulnerable: boolean; hpAfter: number; after: CombatEvent[] } {
  const after: CombatEvent[] = [];
  const block = ctx.blocks[foe.id]!;
  const vulnerable = !!block.vulnerable?.includes(type);
  const dealt = vulnerable ? raw * 2 : raw;
  let hpAfter = Math.max(0, foe.hp - dealt);
  if (hpAfter === 0 && block.undeadFortitude && type !== 'radiant' && !crit) {
    const dc = 5 + dealt;
    const m = abilityModOf(block.scores.CON);
    const r = rollD20WithAdv('normal', ctx.rng);
    const ok = r.kept + m >= dc;
    after.push({ k: 'save', who: foe.name, ability: 'CON', d20s: r.d20s, kept: r.kept, adv: 'normal', mod: m, total: r.kept + m, dc, ok, why: 'Undead Fortitude', pc: false });
    if (ok) {
      hpAfter = 1;
      after.push({ k: 'fortitude', who: foe.name });
    }
  }
  ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === foe.id ? { ...f, hp: hpAfter } : f)) };
  return { dealt, vulnerable, hpAfter, after };
}

/** A PC attack roll: a weapon, a cantrip or a spell attack. */
interface Strike {
  name: string;
  toHit: number;
  dice: string;
  /** Ability modifier added to weapon damage (not to spell damage). */
  mod?: number;
  type: string;
  ranged: boolean;
  spell: boolean;
  cantrip: boolean;
  finesse?: boolean;
  sneakAttack?: string;
  /** A condition a hit leaves on the target until the end of your next turn. */
  rider?: string;
  strBased?: boolean;
  mastery?: WeaponMastery;
  masteryDc?: number;
  /** Flat damage added to a spell hit (Agonizing Blast). */
  damageMod?: number;
  /** Divine / Searing Smite riding this weapon attack, and the slot level it spends on a hit (null = a free use). */
  smite?: { def: SpellDef; slot: number | null; dc: number };
  /** Cleave's second attack: no ability modifier to damage, no further mastery. */
  cleaveMastery?: boolean;
}

/** A marked target (Guiding Bolt) gives the next attack roll against it Advantage, then the mark is used up. */
function useMark(ctx: Ctx, target: RoundFoeState): boolean {
  if (!has(target.conditions, 'Guiding Bolt')) return false;
  ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === target.id ? { ...f, conditions: f.conditions.filter((c) => c.name !== 'Guiding Bolt') } : f)) };
  return true;
}

/**
 * Leave a condition on a foe. Prone lasts until it stands; a Concentration spell's condition lasts while you
 * concentrate (`held`); anything else ends after your next turn. `dc` is the escape DC (Entangle) or save DC (Searing Smite).
 */
function putRider(ctx: Ctx, target: RoundFoeState, name: string, why: string, opts: { held?: boolean; dc?: number } = {}) {
  const lasting = name === 'Prone' || opts.held ? {} : { endsAfterTurnOf: 'pc', fresh: true };
  ctx.combat = {
    ...ctx.combat,
    foes: ctx.combat.foes.map((f) => (f.id === target.id ? { ...f, conditions: [...f.conditions.filter((c) => c.name !== name), { name, source: why, ...lasting, ...(opts.dc != null ? { dc: opts.dc } : {}) }] } : f)),
  };
  push(ctx, { k: 'condition', who: target.name, name, on: true, why, pc: false });
}

/** Take a condition off a foe (a used-up Vex or Guiding Bolt mark). */
function dropCondition(ctx: Ctx, target: RoundFoeState, name: string) {
  ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === target.id ? { ...f, conditions: f.conditions.filter((c) => c.name !== name) } : f)) };
}

function strike(ctx: Ctx, target: RoundFoeState, s: Strike) {
  // TT-X1 / SRD 5.2.1: ranges and movement are in feet. A melee strike closes to within 5 ft, spending Speed.
  if (!s.ranged) {
    const dist = target.distanceFt ?? 5;
    if (dist > 5) {
      const left = ctx.turn.movementLeft ?? 0;
      const need = dist - 5;
      const spent = need > left ? left : need;
      const nextDist = dist - spent < 5 ? 5 : dist - spent;
      ctx.turn.movementLeft = left - spent;
      const foes: RoundFoeState[] = [];
      for (let i = 0; i < ctx.combat.foes.length; i++) {
        const f = ctx.combat.foes[i]!;
        foes.push(f.id === target.id ? { ...f, distanceFt: nextDist } : f);
      }
      ctx.combat = { ...ctx.combat, foes };
      for (let fi = 0; fi < foes.length; fi++) {
        if (foes[fi]!.id === target.id) {
          target = foes[fi]!;
          break;
        }
      }
    }
  }
  const hidden = ctx.combat.hiddenStealth != null;
  const extraAdv: AdvState[] = [];
  if (hidden) extraAdv.push('advantage');
  if (useMark(ctx, target)) extraAdv.push('advantage');
  const flank = !!ctx.rules.flanking && !s.spell && !s.ranged && !!ctx.pc.ally;
  if (flank) extraAdv.push('advantage');
  if (ctx.combat.helped) {
    extraAdv.push('advantage');
    ctx.combat = { ...ctx.combat, helped: false };
  }
  if (ctx.pc.heavilyEncumbered || ctx.pc.untrainedArmor) extraAdv.push('disadvantage');
  if (ctx.rules.strongWind && s.ranged && !s.spell) extraAdv.push('disadvantage');
  // Reckless Attack (Strength attacks), Vex (next attack on that foe), Faerie Fire (attacks on a lit foe), Innate Sorcery (spell attacks).
  if (ctx.combat.reckless && s.strBased && !s.spell) extraAdv.push('advantage');
  if (has(target.conditions, 'Vex')) {
    extraAdv.push('advantage');
    dropCondition(ctx, target, 'Vex');
  }
  if (has(target.conditions, 'Faerie Fire')) extraAdv.push('advantage');
  if (ctx.combat.innateSorcery && s.spell) extraAdv.push('advantage');
  ctx.turn.attacked = true;
  let inspiration: InspirationUse | undefined;
  if (ctx.rules.inspiration === 'advantage' && !ctx.inspirationSpent) {
    extraAdv.push('advantage');
    ctx.inspirationSpent = true;
    inspiration = { mode: 'advantage' };
  }
  const block = ctx.blocks[target.id]!;
  const adv = attackAdv(ctx.combat.pcConditions, target.conditions, s.ranged, extraAdv, ctx.pc.conditions, foeBlind(ctx, block));
  const critAt = ctx.pc.improvedCritical && !s.spell ? 19 : 20;
  let r = rollD20WithAdv(adv, ctx.rng);
  let bless = blessRoll(ctx);
  const lands = (kept: number, b?: number) => kept >= critAt || (kept !== 1 && kept + s.toHit + (b ?? 0) >= block.ac);
  if (!lands(r.kept, bless) && canReroll(ctx)) {
    inspiration = { mode: 'reroll', first: r.kept };
    ctx.inspirationSpent = true;
    r = rollD20WithAdv(adv, ctx.rng);
    bless = blessRoll(ctx);
  }
  const total = r.kept + s.toHit + (bless ?? 0);
  const nat1 = r.kept === 1;
  const critRoll = r.kept >= critAt;
  const hit = critRoll || (!nat1 && total >= block.ac);
  const crit = hit && (critRoll || (!s.ranged && effects(target.conditions).some((e) => e.meleeCritAgainst)));
  if (hidden) unhide(ctx, s.spell ? `you cast ${s.name}` : 'you attacked');
  const hpBefore = target.hp;
  let damage: DiceRoll | undefined;
  let sneak: DiceRoll | undefined;
  let half = false;
  let res: ReturnType<typeof damageFoe> = { dealt: 0, vulnerable: false, hpAfter: hpBefore, after: [] };
  let bonus: StrikeBonus[] = [];
  if (hit) {
    damage = rollDice(s.dice, ctx.rng, { crit, extraBonus: s.spell ? s.damageMod ?? 0 : s.mod ?? 0, critRule: ctx.rules.critRule });
    if (!s.spell && s.sneakAttack && adv === 'advantage' && (s.finesse || s.ranged)) sneak = rollDice(s.sneakAttack, ctx.rng, { crit, critRule: ctx.rules.critRule });
    bonus = strikeBonuses(ctx, target, s, crit, block);
    const extra = bonus.reduce((sum, b) => sum + (b.roll?.total ?? 0) + (b.flat ?? 0), 0);
    res = damageFoe(ctx, target, damage.total + (sneak?.total ?? 0) + extra, s.type, crit);
  } else if (s.cantrip && ctx.pc.potentCantrip) {
    damage = rollDice(s.dice, ctx.rng);
    half = true;
    res = damageFoe(ctx, target, Math.floor(damage.total / 2), s.type, false);
  }
  push(ctx, { k: 'attack', attacker: ctx.pc.name, target: target.name, with: s.name, d20s: r.d20s, kept: r.kept, adv, mod: s.toHit, total, ac: block.ac, hit, crit, nat1, damage, sneak, type: s.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: true, bless, ...(half ? { half } : {}), ...(s.spell ? { spell: true } : {}), ...(flank ? { flank } : {}), ...(inspiration ? { inspiration } : {}), ...(bonus.length ? { bonus } : {}), ...(s.cleaveMastery ? { mastery: 'Cleave' as const } : {}) });
  for (const e of res.after) push(ctx, e);
  if ((hit || half) && res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
  if (hit && s.rider && res.hpAfter > 0) putRider(ctx, target, s.rider, s.name);
  if (hit && s.smite) smiteLanded(ctx, target, s.smite);
  if (!s.spell && ctx.rules.mastery && s.mastery && !s.cleaveMastery) weaponMastery(ctx, target, s, hit, res.hpAfter);
  if (hit && damage && ctx.rules.cleave && !s.spell && !s.ranged && res.hpAfter === 0) {
    const raw = damage.total + (sneak?.total ?? 0);
    cleaveInto(ctx, s, total, crit, raw - (res.vulnerable ? Math.ceil(hpBefore / 2) : hpBefore));
  }
}

/** Extra damage on a PC hit: Rage, Divine Favor, a Hunter's Mark / Hex mark, a smite, Frenzy, Colossus Slayer. Crits double the dice. */
function strikeBonuses(ctx: Ctx, target: RoundFoeState, s: Strike, crit: boolean, block: StatBlock): StrikeBonus[] {
  const out: StrikeBonus[] = [];
  const roll = (dice: string) => rollDice(dice, ctx.rng, { crit, critRule: ctx.rules.critRule });
  const weapon = !s.spell;
  if (weapon && s.strBased && ctx.combat.raging && ctx.pc.rageDamage) out.push({ label: 'Rage', flat: ctx.pc.rageDamage });
  if (weapon && ctx.combat.divineFavor) out.push({ label: 'Divine Favor', roll: roll(SPELLS['Divine Favor']!.onHit!.dice) });
  const held = ctx.combat.concentration ? SPELLS[ctx.combat.concentration] : undefined;
  if (held?.effect === 'mark' && held.onHit && target.conditions.some((c) => c.name === held.name)) out.push({ label: held.name, roll: roll(held.onHit.dice) });
  if (s.smite) {
    const def = s.smite.def;
    out.push({ label: def.name, roll: roll(spellDice({ ...def, dice: def.onHit!.dice }, Math.max(1, s.smite.slot ?? 1))) });
    if (def.vsUndead && block.kind === 'undead') out.push({ label: `${def.name} (Undead)`, roll: roll(def.vsUndead) });
  }
  if (weapon && s.strBased && ctx.pc.frenzy && ctx.combat.raging && ctx.combat.reckless && !ctx.turn.frenzy) {
    ctx.turn.frenzy = true;
    out.push({ label: 'Frenzy', roll: roll(`${ctx.pc.rageDamage ?? 2}d6`) });
  }
  if (weapon && ctx.pc.colossusSlayer && !ctx.turn.colossus && target.hp < target.maxHp) {
    ctx.turn.colossus = true;
    out.push({ label: 'Colossus Slayer', roll: roll('1d8') });
  }
  return out;
}

/** A smite landed: the slot (or the free use) is spent, and Searing Smite sets the foe burning. */
function smiteLanded(ctx: Ctx, target: RoundFoeState, smite: NonNullable<Strike['smite']>) {
  if (smite.slot) ctx.slotSpent = smite.slot;
  else ctx.freeCastUsed = true;
  push(ctx, { k: 'cast', who: ctx.pc.name, spell: smite.def.name, ...(smite.slot ? { slot: smite.slot } : {}), detail: smite.slot ? undefined : 'no slot' });
  const now = ctx.combat.foes.find((f) => f.id === target.id)!;
  if (smite.def.burn && now.hp > 0) putRider(ctx, now, 'Searing Smite', smite.def.name, { held: true, dc: smite.dc });
}

/**
 * SRD 5.2.1 Weapon Mastery after a weapon attack: Graze (miss → ability modifier damage), Vex (Advantage on your next
 * attack), Sap (the foe's next attack has Disadvantage), Slow (Speed −10), Topple (CON save or Prone), Cleave (a second
 * attack roll on another foe, once a turn). Push and Nick have no effect in this engine.
 */
function weaponMastery(ctx: Ctx, target: RoundFoeState, s: Strike, hit: boolean, hpAfter: number) {
  const m = s.mastery!;
  const now = ctx.combat.foes.find((f) => f.id === target.id)!;
  if (!hit) {
    if (m !== 'Graze' || (s.mod ?? 0) <= 0) return;
    const hpBefore = now.hp;
    const res = damageFoe(ctx, now, s.mod!, s.type, false);
    push(ctx, { k: 'extra', who: now.name, label: `Graze (${s.name})`, amount: res.dealt, type: s.type, hpBefore, hpAfter: res.hpAfter, maxHp: now.maxHp, pc: true });
    for (const e of res.after) push(ctx, e);
    if (res.hpAfter === 0) push(ctx, { k: 'down', who: now.name, pc: false });
    return;
  }
  if (hpAfter <= 0 && m !== 'Cleave') return;
  if (m === 'Vex' || m === 'Sap' || m === 'Slow') {
    putRider(ctx, now, m === 'Slow' ? 'Slowed' : m, `${s.name} mastery`);
  } else if (m === 'Topple') {
    const block = ctx.blocks[now.id]!;
    const mod = abilityModOf(block.scores.CON);
    const dc = s.masteryDc ?? 10;
    const sv = saveRoll(mod, dc, now.conditions, 'CON', ctx.rng);
    push(ctx, { k: 'save', who: now.name, ability: 'CON', d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod, total: sv.total, dc, ok: sv.ok, autoFail: sv.autoFail, why: `against Topple (${s.name})`, pc: false });
    if (!sv.ok) putRider(ctx, now, 'Prone', `Topple (${s.name})`);
  } else if (m === 'Cleave' && !s.ranged && !ctx.turn.cleave) {
    const next = liveFoes(ctx).find((f) => f.id !== target.id);
    if (!next) return;
    ctx.turn.cleave = true;
    strike(ctx, next, { ...s, mod: Math.min(0, s.mod ?? 0), sneakAttack: undefined, smite: undefined, cleaveMastery: true });
  }
}

/** Cleave: the leftover damage of a melee blow that dropped its target goes into the next foe the same roll would hit. */
function cleaveInto(ctx: Ctx, s: Strike, total: number, crit: boolean, leftover: number) {
  if (leftover <= 0) return;
  const next = liveFoes(ctx).find((f) => crit || total >= ctx.blocks[f.id]!.ac);
  if (!next) return;
  const hpBefore = next.hp;
  const res = damageFoe(ctx, next, leftover, s.type, false);
  push(ctx, { k: 'attack', attacker: ctx.pc.name, target: next.name, with: s.name, d20s: [], kept: 0, adv: 'normal', mod: 0, total, ac: ctx.blocks[next.id]!.ac, hit: true, crit: false, nat1: false, type: s.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: next.maxHp, vulnerable: res.vulnerable, pc: true, cleave: true });
  for (const e of res.after) push(ctx, e);
  if (res.hpAfter === 0) push(ctx, { k: 'down', who: next.name, pc: false });
}

/** A saving-throw spell on one or more foes. Damage is rolled once, on the first foe it touches (SRD). */
function saveSpell(
  ctx: Ctx,
  targets: RoundFoeState[],
  s: { name: string; dc: number; save: AttributeKey; dice?: string; type?: string; halfOnSave?: boolean; cantrip: boolean; rider?: string; held?: boolean }
) {
  let dmg: DiceRoll | undefined;
  ctx.turn.attacked = true;
  // Innate Sorcery: +1 to your spell save DC while it lasts.
  if (ctx.combat.innateSorcery) s = { ...s, dc: s.dc + 1 };
  for (const t of targets) {
    const target = ctx.combat.foes.find((f) => f.id === t.id)!;
    if (target.hp <= 0) continue;
    const block = ctx.blocks[target.id]!;
    const m = abilityModOf(block.scores[s.save]);
    const raw = saveRoll(m, s.dc, target.conditions, s.save, ctx.rng);
    const bane = raw.autoFail ? undefined : baneRoll(ctx, target);
    const sv = bane ? { ...raw, total: raw.total - bane, ok: raw.total - bane >= s.dc } : raw;
    push(ctx, { k: 'save', who: target.name, ability: s.save, d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod: m, total: sv.total, dc: s.dc, ok: sv.ok, autoFail: sv.autoFail, why: `against ${s.name}`, pc: false, bane });
    const half = sv.ok && !!s.dice && (s.halfOnSave || (s.cantrip && !!ctx.pc.potentCantrip));
    if (s.dice && (!sv.ok || half)) {
      dmg = dmg ?? rollDice(s.dice, ctx.rng);
      const hpBefore = target.hp;
      const res = damageFoe(ctx, target, half ? Math.floor(dmg.total / 2) : dmg.total, s.type ?? 'force', false);
      push(ctx, { k: 'attack', attacker: ctx.pc.name, target: target.name, with: s.name, d20s: [], kept: 0, adv: 'normal', mod: 0, total: 0, ac: 0, hit: true, crit: false, nat1: false, damage: dmg, type: s.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: true, spell: true, ...(half ? { half } : {}) });
      for (const e of res.after) push(ctx, e);
      if (res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
    }
    const now = ctx.combat.foes.find((f) => f.id === target.id)!;
    if (!sv.ok && s.rider && now.hp > 0) putRider(ctx, now, s.rider, s.name, s.held ? { held: true, ...(s.rider === 'Restrained' ? { dc: s.dc } : {}) } : {});
  }
}

function pcAttack(ctx: Ctx, target: RoundFoeState, spell: boolean) {
  const w = ctx.pc.weapon;
  const cantrip = ctx.pc.cantrip;
  if (spell && cantrip?.kind === 'save') {
    unhide(ctx, `you cast ${cantrip.name}`);
    saveSpell(ctx, [target], { name: cantrip.name, dc: cantrip.dc, save: cantrip.save ?? 'DEX', dice: cantrip.dice, type: cantrip.type, cantrip: true, rider: cantrip.rider });
    return;
  }
  if (spell && cantrip) {
    strike(ctx, target, { name: cantrip.name, toHit: cantrip.toHit, dice: cantrip.dice, type: cantrip.type, ranged: !cantrip.melee, spell: true, cantrip: true, rider: cantrip.rider, damageMod: cantrip.damageMod });
    return;
  }
  strike(ctx, target, weaponStrike(w));
}

const weaponStrike = (w: PcWeapon, smite?: Strike['smite']): Strike => ({
  name: w.name, toHit: w.toHit, dice: w.dice, mod: w.mod, type: w.type, ranged: w.ranged, spell: false, cantrip: false,
  finesse: w.finesse, sneakAttack: w.sneakAttack, strBased: w.strBased, mastery: w.mastery, masteryDc: w.masteryDc, ...(smite ? { smite } : {}),
});

/** Monk Martial Arts: a bonus Unarmed Strike after the Attack action. */
function bonusStrike(ctx: Ctx) {
  const b = ctx.pc.bonusStrike;
  const target = liveFoes(ctx)[0];
  if (!b || !target || ctx.outcome !== 'ongoing') return;
  ctx.turn.bonusUsed = true;
  strike(ctx, target, { name: b.name, toHit: b.toHit, dice: b.dice, mod: b.mod, type: b.type, ranged: false, spell: false, cantrip: false });
}

/** Cast a spell from the PC's list. `slot` is the slot level spent (null for a cantrip). */
function pcCast(ctx: Ctx, sp: PcSpell, slot: number | null, target: RoundFoeState | undefined) {
  const def = sp.def;
  const level = slot ?? 0;
  if (def.concentration && ctx.combat.concentration) endConcentration(ctx, `you cast ${def.name}`);
  if (slot) ctx.slotSpent = slot;
  unhide(ctx, `you cast ${def.name}`);
  const castEv = { k: 'cast' as const, who: ctx.pc.name, spell: def.name, ...(slot ? { slot } : {}), ...(def.concentration ? { concentration: true } : {}) };
  switch (def.effect) {
    case 'attack':
      if (!target) break;
      if (slot) push(ctx, castEv);
      strike(ctx, target, { name: def.name, toHit: sp.toHit, dice: spellDice(def, Math.max(1, level)), type: def.type ?? 'force', ranged: !def.melee, spell: true, cantrip: def.level === 0, rider: def.rider, ...(def.level === 0 && sp.damageMod ? { damageMod: sp.damageMod } : {}) });
      break;
    case 'save': {
      const targets = def.area ? liveFoes(ctx) : target ? [target] : [];
      if (slot) push(ctx, castEv);
      if (def.concentration) ctx.combat = { ...ctx.combat, concentration: def.name };
      saveSpell(ctx, targets, { name: def.name, dc: sp.dc, save: def.save ?? 'DEX', dice: def.dice ? spellDice(def, Math.max(1, level)) : undefined, type: def.type, halfOnSave: def.halfOnSave, cantrip: def.level === 0, rider: def.rider, held: def.concentration });
      break;
    }
    case 'smite': {
      // The smite rides a weapon attack: the slot (or free use) is spent only if the blow lands.
      ctx.slotSpent = undefined;
      if (target) strike(ctx, target, weaponStrike(ctx.pc.weapon, { def, slot: ctx.freeCast ? null : slot, dc: sp.dc }));
      break;
    }
    case 'mark':
    case 'divineFavor': {
      // A Bonus Action spell, then the round's attack: a cantrip if you have one (Hex), else the weapon.
      if (ctx.freeCast) ctx.freeCastUsed = true;
      push(ctx, ctx.freeCast ? { ...castEv, detail: 'no slot' } : castEv);
      if (def.effect === 'mark') {
        ctx.combat = { ...ctx.combat, concentration: def.name };
        if (target) putRider(ctx, target, def.name, def.name, { held: true });
      } else {
        ctx.combat = { ...ctx.combat, divineFavor: true };
      }
      const t = liveFoes(ctx)[0];
      if (t) pcAttack(ctx, t, def.effect === 'mark' && !!ctx.pc.cantrip);
      break;
    }
    case 'missile': {
      push(ctx, castEv);
      let darts = (def.darts ?? 3) + Math.max(0, level - 1);
      const p = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(def.dice ?? '1d4+1')!;
      const perDart = Number(p[3] ?? 0);
      while (darts > 0) {
        const t = liveFoes(ctx)[0];
        if (!t) break;
        const rolls: number[] = [];
        let sum = 0;
        while (darts > 0 && sum < t.hp) {
          const d = rollDie(Number(p[2]), ctx.rng);
          rolls.push(d);
          sum += d + perDart;
          darts -= 1;
        }
        const roll: DiceRoll = { notation: `${rolls.length}d${p[2]}`, dice: rolls, bonus: perDart * rolls.length, total: sum, crit: false };
        const hpBefore = t.hp;
        const res = damageFoe(ctx, t, sum, def.type ?? 'force', false);
        push(ctx, { k: 'attack', attacker: ctx.pc.name, target: t.name, with: def.name, d20s: [], kept: 0, adv: 'normal', mod: 0, total: 0, ac: 0, hit: true, crit: false, nat1: false, damage: roll, type: def.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: t.maxHp, vulnerable: res.vulnerable, pc: true, spell: true });
        for (const e of res.after) push(ctx, e);
        if (res.hpAfter === 0) push(ctx, { k: 'down', who: t.name, pc: false });
      }
      break;
    }
    case 'heal': {
      const bonus = sp.mod + (ctx.pc.discipleOfLife ? 2 + Math.max(1, level) : 0);
      const roll = rollDice(spellDice(def, Math.max(1, level)), ctx.rng, { extraBonus: bonus });
      const before = ctx.pcHp;
      ctx.pcHp = Math.min(ctx.pc.maxHp, before + roll.total);
      push(ctx, { k: 'heal', who: ctx.pc.name, item: def.name, roll, hpBefore: before, hpAfter: ctx.pcHp, spell: true, ...(slot ? { slot } : {}) });
      break;
    }
    case 'bless':
    case 'shieldOfFaith':
      push(ctx, castEv);
      ctx.combat = { ...ctx.combat, concentration: def.name };
      break;
    case 'bane': {
      push(ctx, castEv);
      ctx.combat = { ...ctx.combat, concentration: def.name };
      for (const t of liveFoes(ctx).slice(0, 3)) {
        const block = ctx.blocks[t.id]!;
        const m = abilityModOf(block.scores.CHA);
        const sv = saveRoll(m, sp.dc, t.conditions, 'CHA', ctx.rng);
        push(ctx, { k: 'save', who: t.name, ability: 'CHA', d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod: m, total: sv.total, dc: sp.dc, ok: sv.ok, autoFail: sv.autoFail, why: 'against Bane', pc: false });
        if (!sv.ok) {
          ctx.combat = { ...ctx.combat, foes: ctx.combat.foes.map((f) => (f.id === t.id ? { ...f, conditions: [...f.conditions, { name: 'Bane', source: 'Bane' }] } : f)) };
          push(ctx, { k: 'condition', who: t.name, name: 'Bane', on: true, why: 'your Bane', pc: false });
        }
      }
      break;
    }
    case 'mageArmor':
      push(ctx, castEv);
      if (ctx.pc.mageArmorAc != null) {
        ctx.acBase = ctx.pc.mageArmorAc;
        ctx.mageArmor = true;
      }
      break;
    default:
      push(ctx, castEv);
  }
}

function allyAttack(ctx: Ctx, target: RoundFoeState) {
  const ally = ctx.pc.ally!;
  const block = ctx.blocks[target.id]!;
  const adv = attackAdv([], target.conditions, false, ['advantage'], allyBlind(ctx), foeBlind(ctx, block));
  const r = rollD20WithAdv(adv, ctx.rng);
  const total = r.kept + ally.toHit;
  const hit = r.kept === 20 || (r.kept !== 1 && total >= block.ac);
  const crit = hit && r.kept === 20;
  const hpBefore = target.hp;
  let damage: DiceRoll | undefined;
  let res: ReturnType<typeof damageFoe> = { dealt: 0, vulnerable: false, hpAfter: hpBefore, after: [] };
  if (hit) {
    damage = rollDice(ally.dice, ctx.rng, { crit, critRule: ctx.rules.critRule });
    res = damageFoe(ctx, target, damage.total, ally.type, crit);
  }
  push(ctx, { k: 'attack', attacker: ally.name, target: target.name, with: 'a helped strike', d20s: r.d20s, kept: r.kept, adv, mod: ally.toHit, total, ac: block.ac, hit, crit, nat1: r.kept === 1, damage, type: ally.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: false });
  for (const e of res.after) push(ctx, e);
  if (hit && res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
}

function pcTurn(ctx: Ctx, action: RoundAction) {
  const pc = ctx.pc;
  // SRD 5.2.1: Standing up takes half your Speed (round down).
  let stood = false;
  if (has(ctx.combat.pcConditions, 'Prone') && canAct(ctx.combat.pcConditions, pc.conditions)) {
    ctx.combat = { ...ctx.combat, pcConditions: ctx.combat.pcConditions.filter((c) => c.name !== 'Prone') };
    push(ctx, { k: 'act', who: pc.name, action: 'stand', detail: 'stands up (half your Speed)', pc: true });
    stood = true;
  }
  ctx.combat = { ...ctx.combat, dodging: false, ...(ctx.combat.reckless ? { reckless: false } : {}), ...(ctx.combat.deflectUsed ? { deflectUsed: false } : {}) };
  const speed = speedZero(ctx.combat.pcConditions, pc.conditions) ? 0 : pc.speed;
  ctx.turn = { movementLeft: stood ? Math.floor(speed / 2) : speed };
  if (!canAct(ctx.combat.pcConditions, pc.conditions)) {
    push(ctx, { k: 'act', who: pc.name, action: 'skip', detail: `cannot act (${ctx.combat.pcConditions.map((c) => c.name).join(', ')})`, pc: true });
    endRageIfIdle(ctx);
    ctx.combat = {
      ...ctx.combat,
      pcEconomy: {
        actionAvailable: true,
        bonusAvailable: true,
        movementFt: ctx.turn.movementLeft ?? 0,
        reactionAvailable: true,
      },
    };
    endTurnOf(ctx, 'pc');
    return;
  }
  useFeatures(ctx, action);
  const target = liveFoes(ctx)[0];
  switch (action) {
    case 'attack':
      ctx.turn.actionUsed = true;
      if (target) pcAttack(ctx, target, false);
      if (target) bonusStrike(ctx);
      break;
    case 'cast': {
      ctx.turn.actionUsed = true;
      const sp = ctx.spell && ctx.spell !== pc.cantrip?.name ? pc.spells?.find((s) => s.name === ctx.spell) : undefined;
      if (sp) {
        if (sp.def.bonusAction) {
          ctx.turn.actionUsed = false;
          ctx.turn.bonusUsed = true;
        }
        pcCast(ctx, sp, sp.def.level > 0 && !ctx.freeCast ? ctx.slotLevel ?? 1 : null, target);
      } else if (target && pc.cantrip) pcAttack(ctx, target, true);
      else if (target) pcAttack(ctx, target, false);
      break;
    }
    case 'dodge':
      ctx.turn.actionUsed = true;
      ctx.combat = { ...ctx.combat, dodging: true };
      push(ctx, { k: 'act', who: pc.name, action: 'dodge', detail: 'attacks against you have Disadvantage until your next turn', pc: true });
      break;
    case 'help':
      ctx.turn.actionUsed = true;
      if (pc.ally && target) {
        push(ctx, { k: 'act', who: pc.name, action: 'help', detail: `distract ${target.name} so ${pc.ally.name} strikes with Advantage`, pc: true });
        allyAttack(ctx, target);
      } else {
        push(ctx, { k: 'act', who: pc.name, action: 'help', detail: 'no ally beside you to help', pc: true });
      }
      break;
    case 'hide': {
      ctx.turn.actionUsed = true;
      // SK-3: each sneaker vs each living foe's Passive Perception (SRD has no Group Check). One failure notices.
      const adv = combineAdv(...effects(ctx.combat.pcConditions, pc.conditions).map((e) => e.checks ?? 'normal'));
      const r = rollD20WithAdv(adv, ctx.rng);
      const pcTotal = r.kept + pc.stealth;
      const watchers: { name: string; passivePerception: number }[] = [];
      let dc = 15;
      for (let i = 0; i < ctx.combat.foes.length; i++) {
        const f = ctx.combat.foes[i]!;
        if (f.hp <= 0) continue;
        const pp = ctx.blocks[f.id]?.passivePerception ?? 10;
        watchers.push({ name: f.name, passivePerception: pp });
        if (pp > dc || watchers.length === 1) dc = pp;
      }
      if (!watchers.length) watchers.push({ name: 'the area', passivePerception: 15 });
      const sneakers = [{ name: pc.name, stealthTotal: pcTotal }];
      if (sidekickUp(ctx) && pc.sidekick) {
        const cr = rollD20WithAdv('normal', ctx.rng);
        const mod = pc.sidekick.stealth ?? 0;
        const cTotal = cr.kept + mod;
        sneakers.push({ name: pc.sidekick.name, stealthTotal: cTotal });
        let cSeen = false;
        for (let wi = 0; wi < watchers.length; wi++) {
          if (watchers[wi]!.passivePerception >= cTotal) cSeen = true;
        }
        push(ctx, {
          k: 'check', who: pc.sidekick.name, label: 'Stealth', d20s: cr.d20s, kept: cr.kept, adv: 'normal', mod,
          total: cTotal, dc, ok: !cSeen, why: cSeen ? 'seen' : 'hidden',
        });
      }
      const contest = individualStealth(sneakers, watchers);
      let pcSeen = false;
      for (let i = 0; i < contest.rows.length; i++) {
        const row = contest.rows[i]!;
        if (row.sneaker === pc.name && row.seen) pcSeen = true;
      }
      push(ctx, {
        k: 'check', who: pc.name, label: 'Stealth', d20s: r.d20s, kept: r.kept, adv, mod: pc.stealth,
        total: pcTotal, dc, ok: !pcSeen, why: contest.noticed ? 'you are seen' : 'you are hidden',
      });
      if (!contest.noticed) {
        let floor = sneakers[0]!.stealthTotal;
        for (let i = 1; i < sneakers.length; i++) {
          if (sneakers[i]!.stealthTotal < floor) floor = sneakers[i]!.stealthTotal;
        }
        const conds = [];
        for (let i = 0; i < ctx.combat.pcConditions.length; i++) {
          if (ctx.combat.pcConditions[i]!.name !== 'Invisible') conds.push(ctx.combat.pcConditions[i]!);
        }
        conds.push({ name: 'Invisible' as const, source: 'Hide' });
        ctx.combat = { ...ctx.combat, hiddenStealth: floor, pcConditions: conds };
        push(ctx, { k: 'condition', who: pc.name, name: 'Invisible', on: true, why: 'hidden', pc: true });
      }
      break;
    }
    case 'item': {
      ctx.turn.actionUsed = true;
      if (pc.potion) {
        const roll = rollDice(pc.potion.heal, ctx.rng);
        const before = ctx.pcHp;
        ctx.pcHp = Math.min(pc.maxHp, before + roll.total);
        ctx.potionUsed = true;
        push(ctx, { k: 'heal', who: pc.name, item: pc.potion.name, roll, hpBefore: before, hpAfter: ctx.pcHp });
      } else {
        push(ctx, { k: 'act', who: pc.name, action: 'item', detail: 'nothing to use', pc: true });
      }
      break;
    }
    case 'disengage': {
      ctx.turn.actionUsed = true;
      if (speedZero(ctx.combat.pcConditions, pc.conditions)) {
        push(ctx, { k: 'act', who: pc.name, action: 'disengage', detail: 'your Speed is 0; you cannot move away', pc: true });
      } else {
        // SRD 5.2.1: Disengage only stops opportunity attacks this turn; a foe may follow and attack on its turn.
        push(ctx, { k: 'act', who: pc.name, action: 'disengage', detail: 'you step back with no opportunity attack; the foe may follow and attack on its turn', pc: true });
      }
      break;
    }
    case 'flee': {
      ctx.turn.actionUsed = true;
      if (speedZero(ctx.combat.pcConditions, pc.conditions)) {
        push(ctx, { k: 'act', who: pc.name, action: 'flee', detail: 'your Speed is 0; you cannot run', pc: true });
        break;
      }
      // Dash: the rest of your Speed is spent getting clear.
      ctx.turn.movementLeft = 0;
      push(ctx, { k: 'act', who: pc.name, action: 'flee', detail: 'you Dash out of reach; each foe gets an opportunity attack', pc: true });
      for (const f of liveFoes(ctx)) {
        if (ctx.pcHp <= 0) break;
        if (!canAct(f.conditions)) continue;
        foeTurn(ctx, f, true);
      }
      if (ctx.pcHp > 0) ctx.outcome = 'escaped';
      break;
    }
    default:
      ctx.turn.actionUsed = true;
      push(ctx, { k: 'act', who: pc.name, action: 'other', detail: ctx.featuresUsed.layOnHands ? 'no attack this round (Lay On Hands)' : 'no attack this round', pc: true });
  }
  endRageIfIdle(ctx);
  // TT-X1: stamp remaining action / bonus / movement / reaction for the STATUS block.
  ctx.combat = {
    ...ctx.combat,
    pcEconomy: {
      actionAvailable: !ctx.turn.actionUsed,
      bonusAvailable: !ctx.turn.bonusUsed,
      movementFt: ctx.turn.movementLeft ?? 0,
      reactionAvailable: !ctx.turn.reactionUsed,
    },
  };
  endTurnOf(ctx, 'pc');
}

/** Bonus-action features before the action: Rage, Innate Sorcery, Lay On Hands, Reckless Attack (with an attack). */
function useFeatures(ctx: Ctx, action: RoundAction) {
  const f = ctx.features;
  const pc = ctx.pc;
  if (f.rage && pc.rageDamage && !ctx.combat.raging) {
    if (ctx.combat.concentration) endConcentration(ctx, 'you fly into a rage');
    ctx.combat = { ...ctx.combat, raging: true };
    ctx.featuresUsed.rage = true;
    ctx.turn.rageStarted = true;
    push(ctx, { k: 'act', who: pc.name, action: 'feature', detail: `Rage: +${pc.rageDamage} damage on Strength attacks, Resistance to bludgeoning, piercing and slashing, Advantage on Strength saves`, pc: true });
  }
  if (f.innateSorcery && !ctx.combat.innateSorcery) {
    ctx.combat = { ...ctx.combat, innateSorcery: true };
    ctx.featuresUsed.innateSorcery = true;
    push(ctx, { k: 'act', who: pc.name, action: 'feature', detail: 'Innate Sorcery: spell save DC +1 and Advantage on spell attack rolls for the fight', pc: true });
  }
  if (f.layOnHands && f.layOnHands > 0 && ctx.pcHp < pc.maxHp) {
    const before = ctx.pcHp;
    const amount = Math.min(f.layOnHands, pc.maxHp - before);
    ctx.pcHp = before + amount;
    ctx.featuresUsed.layOnHands = amount;
    const roll: DiceRoll = { notation: `${amount}`, dice: [], bonus: amount, total: amount, crit: false };
    push(ctx, { k: 'heal', who: pc.name, item: 'Lay On Hands', roll, hpBefore: before, hpAfter: ctx.pcHp, pool: amount });
  }
  if (f.reckless && action === 'attack' && pc.weapon.strBased) {
    ctx.combat = { ...ctx.combat, reckless: true };
    push(ctx, { k: 'act', who: pc.name, action: 'feature', detail: 'Reckless Attack: Advantage on Strength attacks this turn; attacks against you have Advantage until your next turn', pc: true });
  }
}

/** Rage ends early on a turn you neither attacked nor forced a save (SRD 5.2.1; it also ends at 0 HP). */
function endRageIfIdle(ctx: Ctx) {
  if (!ctx.combat.raging || ctx.turn.rageStarted || ctx.turn.attacked) return;
  ctx.combat = { ...ctx.combat, raging: false };
  push(ctx, { k: 'act', who: ctx.pc.name, action: 'feature', detail: 'Rage ends: no attack this turn', pc: true });
}

/**
 * Play one round in initiative order with the PC's chosen action.
 * `combat` must already hold initiative (startRoundCombat).
 */
export function playRound(input: {
  pc: PcProfile;
  combat: RoundCombatState;
  blocks: Record<string, StatBlock>;
  action: RoundAction;
  rng: Rng;
  /** Events already rolled this turn (initiative) to keep in order. */
  lead?: CombatEvent[];
  /** Cast: the spell (from pc.spells or the default cantrip) and the slot level to spend. */
  spell?: string;
  slotLevel?: number;
  /** Optional table rules (cleave, flanking). Off when absent. */
  rules?: RoundRules;
  /** Bonus-action class features used this round. */
  features?: RoundFeatures;
  /** A class feature pays for the cast (no slot). */
  freeCast?: boolean;
}): RoundResult {
  const ctx: Ctx = {
    pc: input.pc,
    blocks: input.blocks,
    rng: input.rng,
    round: input.combat.round,
    combat: input.combat,
    pcHp: input.pc.hp,
    events: (input.lead ?? []).map((e) => ({ ...e, round: input.combat.round })),
    outcome: 'ongoing',
    acBase: input.pc.ac,
    spell: input.spell,
    slotLevel: input.slotLevel,
    rules: input.rules ?? {},
    features: input.features ?? {},
    freeCast: input.freeCast,
    featuresUsed: {},
    turn: {},
  };
  const order = [
    { id: 'pc', init: input.combat.pcInitiative, pcFirst: 1 },
    ...input.combat.foes.map((f) => ({ id: f.id, init: f.initiative, pcFirst: 0 })),
  ].sort((a, b) => b.init - a.init || b.pcFirst - a.pcFirst);
  for (const o of order) {
    if (ctx.outcome !== 'ongoing') break;
    if (o.id === 'pc') {
      pcTurn(ctx, input.action);
      if (ctx.outcome === 'ongoing' && input.action !== 'help') sidekickTurn(ctx);
    } else {
      const foe = ctx.combat.foes.find((f) => f.id === o.id)!;
      if (foe.hp > 0) foeTurn(ctx, foe);
    }
    if (ctx.outcome === 'ongoing' && liveFoes(ctx).length === 0) ctx.outcome = 'victory';
  }
  return {
    combat: { ...ctx.combat, round: ctx.combat.round + 1 },
    pcHp: ctx.pcHp,
    outcome: ctx.outcome,
    events: ctx.events,
    potionUsed: ctx.potionUsed,
    round: input.combat.round,
    ...(ctx.slotSpent ? { slotSpent: ctx.slotSpent } : {}),
    ...(ctx.mageArmor ? { mageArmor: true } : {}),
    ...(ctx.inspirationSpent ? { inspirationSpent: true } : {}),
    ...(ctx.freeCastUsed ? { freeCastUsed: true } : {}),
    ...(Object.keys(ctx.featuresUsed).length ? { featuresUsed: ctx.featuresUsed } : {}),
  };
}

export interface DeathSaveResult {
  state: DeathSaveState;
  d20: number;
  result: 'success' | 'failure' | 'two failures' | 'revived';
  /** Hours until a stable PC regains 1 HP (1d4, SRD). */
  hoursToWake?: number;
  /** The failed d20 Heroic Inspiration rerolled (5.2.1). */
  rerolled?: number;
}

/**
 * One death save at 0 HP: 10+ succeeds, natural 1 is two failures, natural 20 is back up at 1 HP.
 * `reroll` spends Heroic Inspiration on a failed d20 (the new roll stands).
 */
export function rollDeathSave(ds: DeathSaveState, rng: Rng, opts: { reroll?: boolean } = {}): DeathSaveResult {
  const first = rollDie(20, rng);
  const rerolled = opts.reroll && first < 10 ? first : undefined;
  const d20 = rerolled !== undefined ? rollDie(20, rng) : first;
  const tag = rerolled !== undefined ? { rerolled } : {};
  if (d20 === 20) return { state: { successes: 0, failures: 0 }, d20, result: 'revived', ...tag };
  const failures = ds.failures + (d20 === 1 ? 2 : d20 < 10 ? 1 : 0);
  const successes = ds.successes + (d20 >= 10 ? 1 : 0);
  const state: DeathSaveState = { successes: Math.min(3, successes), failures: Math.min(3, failures) };
  if (state.failures >= 3) state.dead = true;
  else if (state.successes >= 3) state.stable = true;
  const result = d20 === 1 ? 'two failures' : d20 >= 10 ? 'success' : 'failure';
  return { state, d20, result, ...tag, ...(state.stable ? { hoursToWake: rollDie(4, rng) } : {}) };
}
