/**
 * Shared rules engine — turn-based combat, one player choice per round.
 * Rules from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode): initiative (DEX check, surprise = Disadvantage),
 * attack = d20 + ability modifier + proficiency vs AC, natural 20 crit (damage dice twice), natural 1 miss,
 * Dodge / Disengage / Hide (DC 15 Stealth) / Help, opportunity attacks on leaving reach, saving throws,
 * conditions (checkRules CONDITION_EFFECTS) and death saves.
 * SynapticGM solo design: foes leave a downed PC (no attacks at 0 HP); escape by Disengage needs the PC's
 * Speed to match the fastest foe, escape by Flee (Dash) always gets away after the opportunity attacks.
 * This module knows no mode. combatPresenter decides what each mode shows.
 */
import type { AttributeKey, CombatCondition, DeathSaveState, RoundCombatState, RoundFoeState } from '../types';
import { combineAdv, conditionEffect, rollD20WithAdv, type AdvState } from '../checkRules';
import { rollDice, rollDie, type DiceRoll, type Rng } from './dice';
import type { StatBlock } from './srdMonsters';
import { abilityModOf } from './srdMonsters';

export type RoundAction = 'attack' | 'cast' | 'dodge' | 'disengage' | 'help' | 'hide' | 'item' | 'flee' | 'other';

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
}

export interface PcCantrip {
  name: string;
  kind: 'attack' | 'save';
  toHit: number;
  dc: number;
  save?: AttributeKey;
  dice: string;
  type: string;
}

export interface PcProfile {
  name: string;
  ac: number;
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
  /** Conditions the PC carries outside the fight (e.g. Poisoned). */
  conditions: string[];
}

export type CombatEvent =
  | { k: 'initiative'; who: string; d20s: number[]; kept: number; mod: number; total: number; adv: AdvState }
  | { k: 'attack'; attacker: string; target: string; with: string; d20s: number[]; kept: number; adv: AdvState; mod: number; total: number; ac: number; hit: boolean; crit: boolean; nat1: boolean; damage?: DiceRoll; extra?: DiceRoll; sneak?: DiceRoll; type?: string; dealt: number; hpBefore: number; hpAfter: number; maxHp: number; opportunity?: boolean; vulnerable?: boolean; pc: boolean }
  | { k: 'save'; who: string; ability: AttributeKey; d20s: number[]; kept: number; adv: AdvState; mod: number; total: number; dc: number; ok: boolean; autoFail?: boolean; why: string; pc: boolean }
  | { k: 'check'; who: string; label: string; d20s: number[]; kept: number; adv: AdvState; mod: number; total: number; dc: number; ok: boolean; why: string }
  | { k: 'condition'; who: string; name: string; on: boolean; why: string; pc: boolean }
  | { k: 'act'; who: string; action: RoundAction | 'stand' | 'skip' | 'close'; detail: string; pc: boolean }
  | { k: 'heal'; who: string; item: string; roll: DiceRoll; hpBefore: number; hpAfter: number }
  | { k: 'down'; who: string; pc: boolean; massive?: boolean }
  | { k: 'fortitude'; who: string };

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

function saveRoll(mod: number, dc: number, conds: CombatCondition[], ability: AttributeKey, rng: Rng, extra: string[] = []) {
  const eff = effects(conds, extra);
  if ((ability === 'STR' || ability === 'DEX') && eff.some((e) => e.autoFailSaves)) {
    return { d20s: [] as number[], kept: 0, adv: 'normal' as AdvState, total: 0, ok: false, autoFail: true };
  }
  const adv = ability === 'DEX' ? combineAdv(...eff.map((e) => e.dexSaves ?? 'normal')) : 'normal';
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
}

function push(ctx: Ctx, e: CombatEvent) {
  ctx.events.push({ ...e, round: ctx.round });
}

function liveFoes(ctx: Ctx): RoundFoeState[] {
  return ctx.combat.foes.filter((f) => f.hp > 0);
}

function endTurnOf(ctx: Ctx, id: string) {
  const drop = (list: CombatCondition[], who: string, pc: boolean) =>
    list.filter((c) => {
      if (c.endsAfterTurnOf !== id) return true;
      push(ctx, { k: 'condition', who, name: c.name, on: false, why: 'it wears off', pc });
      return false;
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
  }
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
  }
  const atk = block.attack;
  const pcConds = ctx.combat.pcConditions;
  const adv = attackAdv(foe.conditions, pcConds, !!atk.ranged, ctx.combat.dodging ? ['disadvantage'] : [], [], ctx.pc.conditions);
  const r = rollD20WithAdv(adv, ctx.rng);
  const total = r.kept + atk.toHit;
  const nat1 = r.kept === 1;
  const nat20 = r.kept === 20;
  const hit = nat20 || (!nat1 && total >= ctx.pc.ac);
  const critAgainst = effects(pcConds).some((e) => e.meleeCritAgainst) && !atk.ranged;
  const crit = hit && (nat20 || critAgainst);
  let dealt = 0;
  let damage: DiceRoll | undefined;
  let extra: DiceRoll | undefined;
  const hpBefore = ctx.pcHp;
  if (hit) {
    damage = rollDice(atk.damage, ctx.rng, { crit });
    extra = atk.extra ? rollDice(atk.extra.dice, ctx.rng, { crit }) : undefined;
    dealt = damage.total + (extra?.total ?? 0);
  }
  const hpAfter = Math.max(0, hpBefore - dealt);
  push(ctx, { k: 'attack', attacker: foe.name, target: ctx.pc.name, with: atk.name, d20s: r.d20s, kept: r.kept, adv, mod: atk.toHit, total, ac: ctx.pc.ac, hit, crit, nat1, damage, extra, type: atk.type, dealt, hpBefore, hpAfter, maxHp: ctx.pc.maxHp, opportunity, pc: false });
  if (hit) {
    damagePc(ctx, dealt);
    if (ctx.pcHp > 0 && atk.inflicts && !has(ctx.combat.pcConditions, atk.inflicts)) {
      ctx.combat = { ...ctx.combat, pcConditions: [...ctx.combat.pcConditions, { name: atk.inflicts, source: foe.name }] };
      push(ctx, { k: 'condition', who: ctx.pc.name, name: atk.inflicts, on: true, why: `${foe.name}'s ${atk.name}`, pc: true });
    }
    const rider = atk.rider;
    if (ctx.pcHp > 0 && rider) {
      if (rider.immuneSpecies?.includes(ctx.pc.species)) {
        push(ctx, { k: 'condition', who: ctx.pc.name, name: rider.condition, on: false, why: `${ctx.pc.species} immune`, pc: true });
      } else {
        const sv = saveRoll(ctx.pc.saves[rider.save] ?? 0, rider.dc, ctx.combat.pcConditions, rider.save, ctx.rng, ctx.pc.conditions);
        push(ctx, { k: 'save', who: ctx.pc.name, ability: rider.save, d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod: ctx.pc.saves[rider.save] ?? 0, total: sv.total, dc: rider.dc, ok: sv.ok, autoFail: sv.autoFail, why: `against ${rider.condition}`, pc: true });
        if (!sv.ok) {
          ctx.combat = { ...ctx.combat, pcConditions: [...ctx.combat.pcConditions.filter((c) => c.name !== rider.condition), { name: rider.condition, endsAfterTurnOf: 'pc', source: foe.name }] };
          push(ctx, { k: 'condition', who: ctx.pc.name, name: rider.condition, on: true, why: `${foe.name}'s ${atk.name}`, pc: true });
        }
      }
    }
  }
  if (!opportunity) endTurnOf(ctx, foe.id);
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

function pcAttack(ctx: Ctx, target: RoundFoeState, spell: boolean) {
  const w = ctx.pc.weapon;
  const cantrip = ctx.pc.cantrip;
  const hidden = ctx.combat.hiddenStealth != null;
  if (spell && cantrip?.kind === 'save') {
    unhide(ctx, `you cast ${cantrip.name}`);
    const block = ctx.blocks[target.id]!;
    const ability = cantrip.save ?? 'DEX';
    const m = abilityModOf(block.scores[ability]);
    const sv = saveRoll(m, cantrip.dc, target.conditions, ability, ctx.rng);
    push(ctx, { k: 'save', who: target.name, ability, d20s: sv.d20s, kept: sv.kept, adv: sv.adv, mod: m, total: sv.total, dc: cantrip.dc, ok: sv.ok, autoFail: sv.autoFail, why: `against ${cantrip.name}`, pc: false });
    const hpBefore = target.hp;
    if (!sv.ok) {
      const dmg = rollDice(cantrip.dice, ctx.rng);
      const res = damageFoe(ctx, target, dmg.total, cantrip.type, false);
      push(ctx, { k: 'attack', attacker: ctx.pc.name, target: target.name, with: cantrip.name, d20s: [], kept: 0, adv: 'normal', mod: 0, total: 0, ac: 0, hit: true, crit: false, nat1: false, damage: dmg, type: cantrip.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: true });
      for (const e of res.after) push(ctx, e);
      if (res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
    }
    return;
  }
  const ranged = spell ? true : w.ranged;
  const extraAdv: AdvState[] = [];
  if (hidden) extraAdv.push('advantage');
  const adv = attackAdv(ctx.combat.pcConditions, target.conditions, ranged, extraAdv, ctx.pc.conditions);
  const toHit = spell && cantrip ? cantrip.toHit : w.toHit;
  const r = rollD20WithAdv(adv, ctx.rng);
  const total = r.kept + toHit;
  const block = ctx.blocks[target.id]!;
  const nat1 = r.kept === 1;
  const nat20 = r.kept === 20;
  const hit = nat20 || (!nat1 && total >= block.ac);
  const crit = hit && (nat20 || (!ranged && effects(target.conditions).some((e) => e.meleeCritAgainst)));
  if (hidden) unhide(ctx, spell ? `you cast ${cantrip?.name ?? 'a spell'}` : 'you attacked');
  const hpBefore = target.hp;
  let damage: DiceRoll | undefined;
  let sneak: DiceRoll | undefined;
  let res: ReturnType<typeof damageFoe> = { dealt: 0, vulnerable: false, hpAfter: hpBefore, after: [] };
  const type = spell && cantrip ? cantrip.type : w.type;
  if (hit) {
    damage = spell && cantrip ? rollDice(cantrip.dice, ctx.rng, { crit }) : rollDice(w.dice, ctx.rng, { crit, extraBonus: w.mod });
    if (!spell && w.sneakAttack && adv === 'advantage' && (w.finesse || w.ranged)) sneak = rollDice(w.sneakAttack, ctx.rng, { crit });
    res = damageFoe(ctx, target, damage.total + (sneak?.total ?? 0), type, crit);
  }
  push(ctx, { k: 'attack', attacker: ctx.pc.name, target: target.name, with: spell && cantrip ? cantrip.name : w.name, d20s: r.d20s, kept: r.kept, adv, mod: toHit, total, ac: block.ac, hit, crit, nat1, damage, sneak, type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: true });
  for (const e of res.after) push(ctx, e);
  if (hit && res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
}

function allyAttack(ctx: Ctx, target: RoundFoeState) {
  const ally = ctx.pc.ally!;
  const block = ctx.blocks[target.id]!;
  const adv = attackAdv([], target.conditions, false, ['advantage']);
  const r = rollD20WithAdv(adv, ctx.rng);
  const total = r.kept + ally.toHit;
  const hit = r.kept === 20 || (r.kept !== 1 && total >= block.ac);
  const crit = hit && r.kept === 20;
  const hpBefore = target.hp;
  let damage: DiceRoll | undefined;
  let res: ReturnType<typeof damageFoe> = { dealt: 0, vulnerable: false, hpAfter: hpBefore, after: [] };
  if (hit) {
    damage = rollDice(ally.dice, ctx.rng, { crit });
    res = damageFoe(ctx, target, damage.total, ally.type, crit);
  }
  push(ctx, { k: 'attack', attacker: ally.name, target: target.name, with: 'a helped strike', d20s: r.d20s, kept: r.kept, adv, mod: ally.toHit, total, ac: block.ac, hit, crit, nat1: r.kept === 1, damage, type: ally.type, dealt: res.dealt, hpBefore, hpAfter: res.hpAfter, maxHp: target.maxHp, vulnerable: res.vulnerable, pc: false });
  for (const e of res.after) push(ctx, e);
  if (hit && res.hpAfter === 0) push(ctx, { k: 'down', who: target.name, pc: false });
}

function pcTurn(ctx: Ctx, action: RoundAction) {
  const pc = ctx.pc;
  if (has(ctx.combat.pcConditions, 'Prone') && canAct(ctx.combat.pcConditions, pc.conditions)) {
    ctx.combat = { ...ctx.combat, pcConditions: ctx.combat.pcConditions.filter((c) => c.name !== 'Prone') };
    push(ctx, { k: 'act', who: pc.name, action: 'stand', detail: 'stands up (half your Speed)', pc: true });
  }
  ctx.combat = { ...ctx.combat, dodging: false };
  if (!canAct(ctx.combat.pcConditions, pc.conditions)) {
    push(ctx, { k: 'act', who: pc.name, action: 'skip', detail: `cannot act (${ctx.combat.pcConditions.map((c) => c.name).join(', ')})`, pc: true });
    endTurnOf(ctx, 'pc');
    return;
  }
  const target = liveFoes(ctx)[0];
  const foesFastest = Math.max(0, ...liveFoes(ctx).filter((f) => !speedZero(f.conditions)).map((f) => ctx.blocks[f.id]!.speed));
  switch (action) {
    case 'attack':
      if (target) pcAttack(ctx, target, false);
      break;
    case 'cast':
      if (target && pc.cantrip) pcAttack(ctx, target, true);
      else if (target) pcAttack(ctx, target, false);
      break;
    case 'dodge':
      ctx.combat = { ...ctx.combat, dodging: true };
      push(ctx, { k: 'act', who: pc.name, action: 'dodge', detail: 'attacks against you have Disadvantage until your next turn', pc: true });
      break;
    case 'help':
      if (pc.ally && target) {
        push(ctx, { k: 'act', who: pc.name, action: 'help', detail: `distract ${target.name} so ${pc.ally.name} strikes with Advantage`, pc: true });
        allyAttack(ctx, target);
      } else {
        push(ctx, { k: 'act', who: pc.name, action: 'help', detail: 'no ally beside you to help', pc: true });
      }
      break;
    case 'hide': {
      const adv = combineAdv(...effects(ctx.combat.pcConditions, pc.conditions).map((e) => e.checks ?? 'normal'));
      const r = rollD20WithAdv(adv, ctx.rng);
      const ok = r.kept + pc.stealth >= 15;
      push(ctx, { k: 'check', who: pc.name, label: 'Stealth', d20s: r.d20s, kept: r.kept, adv, mod: pc.stealth, total: r.kept + pc.stealth, dc: 15, ok, why: ok ? 'you are hidden' : 'you are seen' });
      if (ok) {
        ctx.combat = { ...ctx.combat, hiddenStealth: r.kept + pc.stealth, pcConditions: [...ctx.combat.pcConditions.filter((c) => c.name !== 'Invisible'), { name: 'Invisible', source: 'Hide' }] };
        push(ctx, { k: 'condition', who: pc.name, name: 'Invisible', on: true, why: 'hidden', pc: true });
      }
      break;
    }
    case 'item': {
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
      if (speedZero(ctx.combat.pcConditions, pc.conditions)) {
        push(ctx, { k: 'act', who: pc.name, action: 'disengage', detail: 'your Speed is 0; you cannot move away', pc: true });
      } else if (pc.speed >= foesFastest) {
        push(ctx, { k: 'act', who: pc.name, action: 'disengage', detail: `you step out of reach (Speed ${pc.speed} vs ${foesFastest}) and get clear with no opportunity attack`, pc: true });
        ctx.outcome = 'escaped';
      } else {
        push(ctx, { k: 'act', who: pc.name, action: 'disengage', detail: `you step back with no opportunity attack, but the foe is faster (Speed ${foesFastest} vs ${pc.speed}) and closes`, pc: true });
      }
      break;
    }
    case 'flee': {
      if (speedZero(ctx.combat.pcConditions, pc.conditions)) {
        push(ctx, { k: 'act', who: pc.name, action: 'flee', detail: 'your Speed is 0; you cannot run', pc: true });
        break;
      }
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
      push(ctx, { k: 'act', who: pc.name, action: 'other', detail: 'no attack this round', pc: true });
  }
  endTurnOf(ctx, 'pc');
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
  };
  const order = [
    { id: 'pc', init: input.combat.pcInitiative, pcFirst: 1 },
    ...input.combat.foes.map((f) => ({ id: f.id, init: f.initiative, pcFirst: 0 })),
  ].sort((a, b) => b.init - a.init || b.pcFirst - a.pcFirst);
  for (const o of order) {
    if (ctx.outcome !== 'ongoing') break;
    if (o.id === 'pc') {
      pcTurn(ctx, input.action);
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
  };
}

export interface DeathSaveResult {
  state: DeathSaveState;
  d20: number;
  result: 'success' | 'failure' | 'two failures' | 'revived';
  /** Hours until a stable PC regains 1 HP (1d4, SRD). */
  hoursToWake?: number;
}

/** One death save at 0 HP: 10+ succeeds, natural 1 is two failures, natural 20 is back up at 1 HP. */
export function rollDeathSave(ds: DeathSaveState, rng: Rng): DeathSaveResult {
  const d20 = rollDie(20, rng);
  if (d20 === 20) return { state: { successes: 0, failures: 0 }, d20, result: 'revived' };
  const failures = ds.failures + (d20 === 1 ? 2 : d20 < 10 ? 1 : 0);
  const successes = ds.successes + (d20 >= 10 ? 1 : 0);
  const state: DeathSaveState = { successes: Math.min(3, successes), failures: Math.min(3, failures) };
  if (state.failures >= 3) state.dead = true;
  else if (state.successes >= 3) state.stable = true;
  const result = d20 === 1 ? 'two failures' : d20 >= 10 ? 'success' : 'failure';
  return { state, d20, result, ...(state.stable ? { hoursToWake: rollDie(4, rng) } : {}) };
}
