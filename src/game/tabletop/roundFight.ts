/**
 * Tabletop round-by-round fight: the glue between the game state and the shared round engine (rules/roundCombat).
 * One player choice per round, initiative order, SRD stat blocks, every roll on STATUS, death saves at 0 HP.
 * Only for a built tabletop character (engineMode 'dnd' with a SRD sheet); every other mode keeps the
 * one-turn auto-resolve in engineFight.
 */
import type { ActiveEncounter, CombatCondition, GameState, HouseRules, RoundCombatState } from '../types';
import { commitAutoFightLedger } from '../combatAuthority';
import { rollVictoryLoot } from '../combat';
import { profileForEncounter } from '../lootTableRegistry';
import { growWeaponFamiliarity, weaponCategory } from '../checkRules';
import { pushCombatStateTx } from '../stateTx';
import { fightLootClause, weaponInHand } from '../infoSheet';
import { tickEncounterTerminal } from '../encounterTerminalFsm';
import { registerFightRoundRules } from '../fightRoundRules';
import { advanceClock, isRoadFoe, settleRoadMeeting } from '../travelJourney';
import { abilityMod, ARMOR_TABLE, deriveTabletopSheet, hasClassFeature, masteryFor, sneakAttackDice, tabletopArmorClass, WEAPON_DICE, weaponProficient } from './characterBuild';
import { potionHealDice } from '../rules/magicItems';
import { FEATURE_LABEL, featureLeft, featureMax, RAGE_DAMAGE, spendFeature, type FeatureUse } from '../rules/classFeatures';
import type { Rng } from '../rules/dice';
import { turnRng } from '../seededRng';
import { blockWithinXp, statBlockForEncounter, type StatBlock } from '../rules/srdMonsters';
import { encounterXpBudget, foesWithinBudget } from '../xpRules';
import { playRound, rollDeathSave, rollInitiative, type PcProfile, type PcSpell, type RoundAction, type RoundFeatures, type RoundResult } from '../rules/roundCombat';
import { atWillSpells, spellInInput, spendSlot, SPELLS } from '../rules/spells';
import { casterKit, resolveCastRequest, slotsLine } from './spellCasting';
import { buildCombatStatusBlock, combatFacts, deathSaveLine, presentCombatStatus } from '../rules/combatPresenter';
import { payEncounterXp } from '../engineFight';
import { ENCOUNTER_DIFFICULTY, houseRulesOf } from '../rules/houseRules';
import { commitDeath, HOURS_LATER } from '../rules/death';
import { tag } from '../timeline';
import { sidekickOf, sidekickProfile } from '../rules/sidekick';
import { ammoFor, ammoLeft, fitCarry, spendAmmo } from '../rules/encumbrance';
import { carriedCoinLb, gainLootMoney, lootMoneyText } from '../rules/coins';
import { sceneLight, type SceneLight } from '../rules/exploration';
import { exhaustionD20, exhaustionSpeed, weatherRuleOf } from '../rules/travelDay';
import { fightAlly, healingPotion, pcCantripName, pcWeaponName, wearsHeavyArmor } from './combatChips';

export interface RoundFightResult {
  state: GameState;
  receipts: string[];
  facts: string;
  foeAfter?: ActiveEncounter;
  /** No encounter-terminal mandate this turn (the fight goes on, or the PC lies dying with nothing new to settle). */
  noTerminal?: boolean;
}

const ONGOING_HEAD = 'ENGINE OUTCOME (facts — narrate this one round exactly once; the fight is NOT over, end with the foe still fighting):';
const OVER_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once, add no new rounds, the fight is over):';
const DYING_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once; you are on the ground at 0 HP, nobody is fighting you now):';

/** A built tabletop character fights round by round. */
export function usesRoundCombat(state: Pick<GameState, 'engineMode' | 'character'>): boolean {
  return state.engineMode === 'dnd' && !!state.character?.srd;
}

/** At 0 HP and still making death saves. */
export function isDying(state: Pick<GameState, 'engineMode' | 'deathSaves'>): boolean {
  const ds = state.deathSaves;
  return state.engineMode === 'dnd' && !!ds && !ds.dead && !ds.stable;
}

const FLEE = /\b(flee|run(?: away| for it)?|escape|retreat|withdraw|bolt)\b/i;
const ATTACK = /\b(attack|fight|strike|engage|slash|stab|shoot|punch|swing|hit|thrust|cut|charge|lash out|loose an arrow)\b/i;

/** The round action a chip or typed line asks for. Anything else still spends the turn (the foes act). */
export function classifyRoundAction(input: string): RoundAction {
  const s = (input ?? '').toLowerCase();
  if (/\b(drink|quaff|potion)\b|\buse (?:an? |the |my )?(?:item|potion)\b/.test(s)) return 'item';
  if (/\bdisengage\b|\bstep (?:back|away) (?:carefully|out of reach)\b/.test(s)) return 'disengage';
  if (/\bdodge\b|\bfight defensively\b|\bdefensive\b/.test(s)) return 'dodge';
  if (/\bhide\b|\bslip out of sight\b|\bstealth\b/.test(s)) return 'hide';
  if (/\bhelp\b|\bdistract\b|\bassist\b/.test(s)) return 'help';
  if (/\bcast\b|\bfire bolt\b|\bsacred flame\b|\bspell\b/.test(s) || /\s/.test(spellInInput(s) ?? '')) return 'cast';
  if (FLEE.test(s)) return 'flee';
  if (ATTACK.test(s)) return 'attack';
  return 'other';
}

/** Every number the PC fights with, from the derived sheet (one source with the character sheet). */
export function pcCombatProfile(state: GameState, extraConditions: string[] = []): PcProfile | null {
  const sheet = deriveTabletopSheet(state);
  const srd = state.character.srd;
  if (!sheet || !srd) return null;
  const sc = sheet.scores;
  const pb = sheet.pb;
  const weaponName = pcWeaponName(state);
  const w = WEAPON_DICE[weaponName];
  const str = abilityMod(sc.STR);
  const dex = abilityMod(sc.DEX);
  const level = state.character.level || 1;
  // Monk Martial Arts: DEX may replace STR for Unarmed Strikes and melee weapons, and the Unarmed Strike uses the Martial Arts die.
  const martialArts = hasClassFeature(state.character, /^Martial Arts/);
  const atkMod = !w ? (martialArts ? Math.max(str, dex) : str) : w.ranged ? dex : w.finesse || martialArts ? Math.max(str, dex) : str;
  const strBased = !w?.ranged && atkMod === str && (!w || !w.finesse || str >= dex);
  const prof = !w || weaponProficient(srd.classId, weaponName);
  const mastery = houseRulesOf(state).rulesVersion === 'srd-5.2.1' ? masteryFor(state.character, state.inventory, weaponName) : undefined;
  const cantrip = pcCantripName(state);
  const kit = casterKit(state);
  const castMod = kit?.mod ?? (srd.classId === 'wizard' ? abilityMod(sc.INT) : abilityMod(sc.WIS));
  // Warlock Agonizing Blast: the spellcasting modifier on each damaging cantrip hit.
  const agonizing = hasClassFeature(state.character, /Agonizing Blast/) ? castMod : 0;
  const spells: PcSpell[] = kit
    ? [...kit.cantrips.filter((n) => n !== cantrip), ...kit.prepared, ...atWillSpells(srd.classId).filter((n) => !kit.prepared.includes(n))]
        .map((n) => SPELLS[n]!)
        .filter((d) => d.combat)
        .map((def) => ({ name: def.name, def, toHit: kit.attack, dc: kit.dc, mod: kit.mod, ...(agonizing && def.level === 0 && def.dice ? { damageMod: agonizing } : {}) }))
    : [];
  const cantripDef = cantrip ? SPELLS[cantrip] : undefined;
  const rageDamage = hasClassFeature(state.character, /^Rage$/) ? RAGE_DAMAGE : undefined;
  const armored = (state.inventory ?? []).some((i) => i.equipped && ARMOR_TABLE[i.name]);
  const sideCompanion = sidekickOf(state);
  const sidekick = sideCompanion ? sidekickProfile(sideCompanion, state.character.level || 1) : null;
  const sidekickHpNow = state.roundCombat?.sidekickHp ?? sidekick?.hp ?? 0;
  const ally = sidekick ? (sidekickHpNow > 0 ? { name: sidekick.name } : null) : fightAlly(state);
  const potion = healingPotion(state);
  const saves = Object.fromEntries(sheet.saves.map((s) => [s.key, s.total])) as PcProfile['saves'];
  const profile: PcProfile = {
    name: state.character.name || 'you',
    ac: sheet.ac,
    hp: state.character.hp,
    maxHp: sheet.maxHp,
    speed: sheet.speed,
    ...(sheet.heavilyEncumbered ? { heavilyEncumbered: true } : {}),
    ...(sheet.untrainedArmor ? { untrainedArmor: sheet.untrainedArmor } : {}),
    initiativeMod: sheet.initiative,
    saves,
    stealth: sheet.skills.find((k) => k.skill === 'Stealth')?.total ?? dex,
    species: srd.speciesId,
    weapon: {
      name: weaponName,
      toHit: atkMod + (prof ? pb : 0),
      dice: w?.dice ?? (martialArts ? '1d6' : '1d1'),
      mod: atkMod,
      type: w?.type ?? 'bludgeoning',
      ranged: !!w?.ranged,
      finesse: !!w?.finesse,
      ...(srd.classId === 'rogue' ? { sneakAttack: sneakAttackDice(level) } : {}),
      ...(strBased ? { strBased: true } : {}),
      ...(mastery ? { mastery, masteryDc: 8 + atkMod + pb } : {}),
    },
    ...(kit ? { spells, slots: kit.left } : {}),
    ...(kit && !armored ? { mageArmorAc: tabletopArmorClass(sc.DEX, state.inventory ?? [], true, state.character).ac } : {}),
    ...(hasClassFeature(state.character, /Improved Critical/) ? { improvedCritical: true } : {}),
    ...(hasClassFeature(state.character, /Potent Cantrip/) ? { potentCantrip: true } : {}),
    ...(hasClassFeature(state.character, /Disciple of Life/) ? { discipleOfLife: true } : {}),
    ...(cantrip && cantripDef
      ? {
          cantrip: {
            name: cantrip,
            kind: cantripDef.effect === 'save' ? ('save' as const) : ('attack' as const),
            toHit: castMod + pb,
            dc: 8 + castMod + pb,
            ...(cantripDef.save ? { save: cantripDef.save } : {}),
            dice: cantripDef.dice ?? '1d8',
            type: cantripDef.type ?? 'force',
            ...(cantripDef.melee ? { melee: true } : {}),
            ...(cantripDef.rider ? { rider: cantripDef.rider } : {}),
            ...(agonizing && cantripDef.effect === 'attack' ? { damageMod: agonizing } : {}),
          },
        }
      : {}),
    ...(potion ? { potion: { name: potion.name, heal: potionHealDice(potion.name) } } : {}),
    ...(rageDamage ? { rageDamage } : {}),
    ...(hasClassFeature(state.character, /^Danger Sense/) ? { dangerSense: true } : {}),
    ...(hasClassFeature(state.character, /Frenzy/) ? { frenzy: true } : {}),
    ...(hasClassFeature(state.character, /Colossus Slayer/) ? { colossusSlayer: true } : {}),
    ...(hasClassFeature(state.character, /^Deflect Attacks/) ? { deflect: { dexMod: dex, level } } : {}),
    ...(martialArts && !armored ? { bonusStrike: { name: 'Unarmed Strike', toHit: Math.max(str, dex) + pb, dice: '1d6', mod: Math.max(str, dex), type: 'bludgeoning' } } : {}),
    ...(hasClassFeature(state.character, /Eldritch Mind/) ? { eldritchMind: true } : {}),
    // A sidekick fights with its own numbers; any other companion keeps the provisional +PB+2 to hit, 1d6+2.
    ...(sidekick ? { sidekick } : {}),
    ...(ally && sidekick ? { ally: { name: sidekick.name, toHit: sidekick.toHit, dice: sidekick.dice, type: sidekick.type } } : {}),
    ...(ally && !sidekick ? { ally: { name: ally.name, toHit: pb + 2, dice: '1d6+2', type: 'slashing' } } : {}),
    conditions: [...(state.character.conditions ?? []), ...extraConditions].filter((c) => !/^unconscious$/i.test(c)),
  };
  return withExhaustion(profile, state.character);
}

/** SRD 5.2.1 Exhaustion: every D20 Test the PC makes is −2 per level, and Speed −5 feet per level. */
function withExhaustion(pc: PcProfile, character: GameState['character']): PcProfile {
  const d20 = exhaustionD20(character);
  if (!d20) return pc;
  const saves = Object.fromEntries(Object.entries(pc.saves).map(([k, v]) => [k, v + d20])) as PcProfile['saves'];
  return {
    ...pc,
    speed: Math.max(0, pc.speed - exhaustionSpeed(character)),
    initiativeMod: pc.initiativeMod + d20,
    saves,
    stealth: pc.stealth + d20,
    weapon: { ...pc.weapon, toHit: pc.weapon.toHit + d20 },
    ...(pc.cantrip ? { cantrip: { ...pc.cantrip, toHit: pc.cantrip.toHit + d20 } } : {}),
    ...(pc.spells ? { spells: pc.spells.map((s) => ({ ...s, toHit: s.toHit + d20 })) } : {}),
    ...(pc.bonusStrike ? { bonusStrike: { ...pc.bonusStrike, toHit: pc.bonusStrike.toHit + d20 } } : {}),
  };
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

interface FoeSetup {
  combat: RoundCombatState;
  blocks: Record<string, StatBlock>;
  labels: Record<string, string>;
  lead: Parameters<typeof playRound>[0]['lead'];
}

function foeIdentity(enc: ActiveEncounter, block: StatBlock, count: number) {
  const ids = Array.from({ length: count }, (_, i) => `f${i + 1}`);
  const logged = block.srd ? block.name : enc.name;
  const statusName = (i: number) => (count === 1 ? logged : `${logged} ${i + 1}`);
  const writerName = (i: number) => (count === 1 ? enc.name : block.srd ? `the ${ORDINAL[i] ?? `${i + 1}th`} ${block.name.toLowerCase()}` : `one of ${enc.name}`);
  return { ids, statusName, writerName };
}

/** Encounter difficulty's to-hit shift on a copy of the block (the stat-block table stays SRD). */
function shiftedBlock(block: StatBlock, shift: number): StatBlock {
  return shift ? { ...block, attack: { ...block.attack, toHit: block.attack.toHit + shift } } : block;
}

/**
 * Foe count and HP under the table's encounter rules: difficulty scales HP and adds a foe to a group on Deadly;
 * solo scaling (no ally beside the PC) sends one foe at level 1, at most four later, at ¾ HP.
 */
export function scaledEncounter(baseCount: number, baseHp: number, house: Pick<HouseRules, 'encounterDifficulty' | 'soloScaling'>, level: number, alone: boolean): { count: number; hp: number; solo: boolean; notes: string[] } {
  const d = ENCOUNTER_DIFFICULTY[house.encounterDifficulty];
  const solo = house.soloScaling && alone;
  let count = baseCount + (baseCount > 1 ? d.extraFoe : 0);
  if (solo) count = level <= 1 ? 1 : Math.min(4, count);
  count = Math.max(1, Math.min(8, count));
  const hp = Math.max(1, Math.round(baseHp * d.hp * (solo ? 0.75 : 1)));
  const notes: string[] = [];
  if (house.encounterDifficulty !== 'normal') {
    notes.push(`Encounter difficulty: ${house.encounterDifficulty} — foe HP ×${d.hp}, foe attacks ${d.toHit >= 0 ? '+' : ''}${d.toHit}${d.extraFoe && baseCount > 1 ? ', one more foe' : ''}`);
  }
  if (solo) notes.push(`Solo scaling: ${count === baseCount ? '' : `${count} of ${baseCount} foes, `}foe HP and damage ×0.75, no save riders`);
  return { count, hp, solo, notes };
}

/** SRD 5.2.1 budget band for the table's difficulty: Easy is Low, Normal Moderate, Hard and Deadly High. */
const BUDGET_BAND: Record<HouseRules['encounterDifficulty'], 0 | 1 | 2> = { easy: 0, normal: 1, hard: 2, deadly: 2 };

function startCombat(enc: ActiveEncounter, pc: PcProfile, rng: Rng, surprised: 'foes' | 'pc' | null, house: HouseRules, level: number): FoeSetup & { notes: string[] } {
  const party = 1 + (pc.ally || pc.sidekick ? 1 : 0);
  const budgetXp = encounterXpBudget(level, party, BUDGET_BAND[house.encounterDifficulty]);
  const srdBase = statBlockForEncounter(enc);
  const base = blockWithinXp(srdBase, budgetXp);
  const shift = ENCOUNTER_DIFFICULTY[house.encounterDifficulty].toHit;
  const block = shiftedBlock(base, shift);
  const asked = Math.max(1, Math.min(8, enc.count ?? 1));
  const scaled = scaledEncounter(asked, base.hp, house, level, !pc.ally && !pc.sidekick);
  const count = foesWithinBudget(base.cr, scaled.count, budgetXp);
  if (base !== srdBase || count < scaled.count) {
    scaled.notes.push(
      `Encounter budget: ${budgetXp} XP for level ${level}${party > 1 ? `, party of ${party}` : ', alone'} — ${count} × CR ${base.cr}${base !== srdBase ? ` (${srdBase.name} weakened from CR ${srdBase.cr})` : ''}`
    );
  }
  const { ids, statusName, writerName } = foeIdentity(enc, block, count);
  // A parked foe comes back as hurt as it was left.
  const share = enc.maxHp > 0 && enc.hp < enc.maxHp ? Math.max(0, enc.hp) / enc.maxHp : 1;
  const foes = ids.map((id, i) => ({ id, name: statusName(i), block }));
  const init = rollInitiative(pc, foes, rng, surprised);
  const blocks = Object.fromEntries(ids.map((id) => [id, block]));
  const labels = Object.fromEntries(ids.map((id, i) => [statusName(i), writerName(i)]));
  const combat: RoundCombatState = {
    encounterName: enc.name,
    round: 1,
    pcInitiative: init.pcInitiative,
    foes: foes.map((f) => {
      const hp = Math.max(1, Math.round(scaled.hp * share));
      return { id: f.id, name: f.name, blockId: block.id, hp, maxHp: scaled.hp, initiative: init.foeInitiative[f.id]!, conditions: [] };
    }),
    pcConditions: [],
    ...(shift ? { foeToHitShift: shift } : {}),
    budgetXp,
    ...(scaled.solo ? { solo: true } : {}),
    ...(pc.sidekick ? { sidekickHp: pc.sidekick.hp } : {}),
  };
  return { combat, blocks, labels, lead: init.events, notes: scaled.notes };
}

/** The fight's light on STATUS when the place is dark: whose light, and who is Blinded (SRD Vision and Light). */
function fightLightNote(light: SceneLight, enc: ActiveEncounter, setup: FoeSetup): string {
  const head = `Light: darkness ${light.why}`;
  if (light.lit) return `${head} — your ${light.lit} lights the fight`;
  const block = Object.values(setup.blocks)[0];
  const foeSees = !!block?.darkvision;
  const you = light.seen === 'dark' ? 'you are Blinded (your attacks Disadvantage, attacks on you Advantage)' : 'you see by Darkvision';
  // The foes as the fight's own log names them: one SRD foe by its stat-block name, a group by the encounter.
  const many = setup.combat.foes.length > 1;
  const who = many ? enc.name : foeIdentity(enc, block, 1).statusName(0);
  const them = foeSees ? `${who} ${many ? 'see' : 'sees'} by Darkvision` : `${who} ${many ? 'are' : 'is'} Blinded`;
  return `${head} — ${you}; ${them}`;
}

function resumeCombat(enc: ActiveEncounter, combat: RoundCombatState): FoeSetup {
  const base = statBlockForEncounter(enc);
  const block = shiftedBlock(combat.budgetXp ? blockWithinXp(base, combat.budgetXp) : base, combat.foeToHitShift ?? 0);
  const blocks = Object.fromEntries(combat.foes.map((f) => [f.id, block.id === f.blockId ? block : { ...block, id: f.blockId }]));
  const count = combat.foes.length;
  const { writerName } = foeIdentity(enc, block, count);
  const labels = Object.fromEntries(combat.foes.map((f, i) => [f.name, writerName(i)]));
  return { combat, blocks, labels, lead: [] };
}

function relabel(facts: string[], labels: Record<string, string>): string[] {
  const names = Object.keys(labels).sort((a, b) => b.length - a.length);
  return facts.map((f) => {
    let out = f;
    for (const n of names) out = out.split(n).join(labels[n]!);
    return out.charAt(0).toUpperCase() + out.slice(1);
  });
}

const roundConditionNames = (c: RoundCombatState | null | undefined) => new Set((c?.pcConditions ?? []).map((x) => x.name));

/** The character's own conditions plus the fight's (what the sheet shows mid-fight). */
function withFightConditions(base: string[], fight: CombatCondition[]): string[] {
  return [...new Set([...base, ...fight.map((c) => c.name)])];
}

function finishFight(state: GameState): GameState {
  const strip = roundConditionNames(state.roundCombat);
  const conditions = (state.character.conditions ?? []).filter((c) => !strip.has(c));
  const skHp = state.roundCombat?.sidekickHp;
  // A knocked-out sidekick gets up at 1 HP when the fight ends.
  const companions = skHp === undefined ? state.companions : (state.companions ?? []).map((c) => (c.sidekick ? { ...c, hp: Math.max(1, Math.min(c.maxHp, skHp)) } : c));
  return { ...state, companions, roundCombat: null, character: { ...state.character, conditions } };
}

function hpLine(before: number, after: number): string {
  return `HP: ${before} → ${after}`;
}

/**
 * Play the next round of the fight with `raw` (the live, pending, parked or road foe).
 * `pre` carries a failed flee/parley check this turn (the foe forces the fight; the PC's action is spent).
 */
export function resolveRoundFight(
  state: GameState,
  working: GameState,
  raw: ActiveEncounter,
  input: string,
  opts: { pre?: 'flee' | 'parley'; surprised?: 'foes' | 'pc' | null; rng?: Rng } = {}
): RoundFightResult | null {
  const rng = opts.rng ?? turnRng(state, 'round');
  const enc = working.activeEncounter ?? raw;
  const live = working.roundCombat && working.roundCombat.encounterName === enc.name ? working.roundCombat : null;
  const baseConditions = (working.character.conditions ?? []).filter((c) => !roundConditionNames(live).has(c));
  const light = sceneLight(working);
  const pc = pcCombatProfile({ ...working, character: { ...working.character, conditions: baseConditions } }, light.seen === 'dark' ? ['Blinded'] : []);
  if (!pc) return null;
  const house = houseRulesOf(working);
  const started = live ? null : startCombat(enc, pc, rng, opts.surprised ?? null, house, working.character.level || 1);
  if (started && light.ambient === 'dark') started.notes.push(fightLightNote(light, enc, started));
  const setup = live ? resumeCombat(enc, live) : started!;
  const asked = classifyRoundAction(input);
  // Facing a foe ("Face the thugs", a road meeting's fight chip) opens the fight with an attack.
  let action: RoundAction = opts.pre ? 'other' : asked === 'other' && !live ? 'attack' : asked;
  const receipts: string[] = [];
  const lead: string[] = [];
  let spell: string | undefined;
  let slotLevel: number | undefined;
  let freeUse: FeatureUse | undefined;
  const feat = roundFeatures(working, live, input, action);
  receipts.push(...feat.notes);
  lead.push(...feat.facts);
  if (action === 'cast') {
    const req = resolveCastRequest({ ...working, roundCombat: live }, input, 'fight');
    if (req?.ok) {
      spell = req.def.name;
      slotLevel = req.slot ?? undefined;
      freeUse = req.free;
    } else if (req) {
      // A spell the engine cannot cast spends nothing; the round goes to a weapon attack instead.
      receipts.push(`Spell: ${req.def.name} — not cast (${req.problem}); no slot spent`);
      lead.push(`You reach for ${req.def.name}, but ${req.problem}, so you attack instead.`);
      action = 'attack';
    }
  }
  const solo = !!setup.combat.solo;
  const inspiration = working.character.heroicInspiration ? (house.rulesVersion === 'srd-5.1' ? 'advantage' as const : 'reroll' as const) : undefined;
  let res: RoundResult = playRound({
    pc, combat: setup.combat, blocks: setup.blocks, action, rng, lead: setup.lead, spell, slotLevel,
    rules: {
      cleave: house.cleave,
      flanking: house.flanking,
      ...(house.critRule !== 'double-dice' ? { critRule: house.critRule } : {}),
      ...(solo ? { foeDamageScale: 0.75, noRiders: true } : {}),
      ...(inspiration ? { inspiration } : {}),
      ...(light.darkness ? { darkness: true } : {}),
      ...(weatherRuleOf(state.journey?.weather).rangedWeapons ? { strongWind: true } : {}),
      ...(house.rulesVersion === 'srd-5.2.1' ? { mastery: true } : {}),
    },
    ...(Object.keys(feat.features).length ? { features: feat.features } : {}),
    ...(freeUse ? { freeCast: true } : {}),
  });
  if (opts.pre) receipts.unshift(`Fight: ${enc.name} forces the fight`);
  receipts.push(...(started?.notes ?? []));
  receipts.push(...presentCombatStatus('dnd', res.events, pc.name, { hiddenFoeRolls: house.diceVisibility === 'hidden' }));
  // TT-X1: engine-only combat status block (initiative / distance / Bloodied / action economy) for STATUS + screen readers.
  const statusBlock = buildCombatStatusBlock({
    combat: res.combat,
    pcName: pc.name,
    pcHp: res.pcHp,
    pcMaxHp: pc.maxHp,
  });
  const statusFacts: NonNullable<RoundCombatState['statusFacts']> = [];
  for (let si = 0; si < statusBlock.initiativeOrder.length; si++) {
    const row = statusBlock.initiativeOrder[si]!;
    if (row.label === 'you') continue;
    statusFacts.push({ gateName: row.gateName, wound: row.wound, distanceFt: row.distanceFt });
  }
  res = { ...res, combat: { ...res.combat, statusFacts } };
  receipts.push(`Combat status:\n${statusBlock.text}`);
  if (res.inspirationSpent) receipts.push('Heroic Inspiration: spent');
  if (res.pcHp !== pc.hp) receipts.push(hpLine(pc.hp, res.pcHp));
  const facts = [...lead, ...relabel(combatFacts(res.events, pc.name), setup.labels)];
  if (opts.pre === 'flee') facts.unshift(`You tried to break away from ${enc.name} and failed; ${enc.name} forced the fight.`);
  if (opts.pre === 'parley') facts.unshift(`You tried to talk ${enc.name} down and failed; ${enc.name} forced the fight.`);

  const liveFoes = res.combat.foes.filter((f) => f.hp > 0);
  const foeHp = liveFoes.reduce((s, f) => s + f.hp, 0);
  const foeMax = liveFoes.reduce((s, f) => s + f.maxHp, 0);
  const block = setup.blocks[res.combat.foes[0]!.id]!;
  // The whole fight reads one ledger: the encounter's HP is the live foes' HP.
  // An SRD block, or one fitted to the budget, carries the CR the fight is really at.
  const blockCr = block.srd || block.cr !== statBlockForEncounter(enc).cr ? block.cr : enc.cr;
  const encNow: ActiveEncounter = { ...enc, hp: foeHp, maxHp: Math.max(foeMax, 1), count: Math.max(1, liveFoes.length), cr: blockCr };
  let potionInv = working.inventory ?? [];
  if (res.potionUsed) {
    const p = healingPotion(working);
    potionInv = potionInv
      .map((i) => (i.id === p?.id ? { ...i, quantity: (i.quantity ?? 1) - 1 } : i))
      .filter((i) => (i.quantity ?? 1) > 0);
  }
  const ammo = house.strictEncumbrance && pc.weapon.ranged ? ammoFor(pc.weapon.name) : null;
  if (ammo) {
    const shots = res.events.filter((e) => e.k === 'attack' && e.pc && !e.spell && !e.cleave && e.d20s.length > 0 && e.with === pc.weapon.name).length;
    if (shots > 0) {
      potionInv = spendAmmo(potionInv, ammo, shots);
      receipts.push(`${ammo}: ${shots} used, ${ammoLeft(potionInv, ammo)} left`);
    }
  }
  let next: GameState = {
    ...working,
    inventory: potionInv,
    activeEncounter: encNow,
    roundCombat: res.combat,
    character: {
      ...working.character,
      hp: res.pcHp,
      conditions: withFightConditions(baseConditions, res.combat.pcConditions),
      ...(res.inspirationSpent ? { heroicInspiration: false } : {}),
    },
  };
  if (res.slotSpent || res.mageArmor) {
    let casting = res.slotSpent ? spendSlot(next.character.casting, res.slotSpent) : next.character.casting ?? { slotsUsed: [] };
    if (res.mageArmor) casting = { ...casting, mageArmor: true };
    next = { ...next, character: { ...next.character, casting } };
    if (res.mageArmor) next = { ...next, character: { ...next.character, armorClass: deriveTabletopSheet(next)?.ac ?? next.character.armorClass } };
    if (res.slotSpent) receipts.push(slotsLine(next)!);
  }
  const spent: Array<[FeatureUse, number]> = [
    ...(res.featuresUsed?.rage ? [['rage', 1] as [FeatureUse, number]] : []),
    ...(res.featuresUsed?.innateSorcery ? [['innateSorcery', 1] as [FeatureUse, number]] : []),
    ...(res.featuresUsed?.layOnHands ? [['layOnHands', res.featuresUsed.layOnHands] as [FeatureUse, number]] : []),
    ...(res.freeCastUsed && freeUse ? [[freeUse, 1] as [FeatureUse, number]] : []),
  ];
  for (const [use, n] of spent) {
    next = { ...next, character: spendFeature(next.character, use, n) };
    receipts.push(featureLine(next.character, use));
  }
  const onRoad = isRoadFoe(state, raw);
  const roundsSoFar = res.round;
  const roundsText = `${roundsSoFar} round${roundsSoFar === 1 ? '' : 's'}`;

  if (res.outcome === 'ongoing') {
    receipts.push(`Fight: round ${res.round} vs ${enc.name} — the fight goes on`);
    return { state: next, receipts, facts: `${ONGOING_HEAD} ${facts.join(' ')}`, noTerminal: true };
  }

  next = finishFight(next);
  next = growWeaponFamiliarity(next, weaponCategory(pc.weapon.name));
  if (res.outcome === 'victory') {
    const down = res.combat.foes.length > 1 ? 'are down' : 'is down';
    next = commitAutoFightLedger(next, { victory: true, finalPlayerHp: res.pcHp });
    next = tag(next, 'died', 'creature', { id: `creature:${enc.name}`, name: enc.name }, 'down');
    const rolled = rollVictoryLoot(working, { name: enc.name, goldReward: enc.goldReward, lootProfile: profileForEncounter(enc), cr: encNow.cr });
    const carry = house.strictEncumbrance ? fitCarry(next.inventory ?? [], rolled.loot, deriveTabletopSheet(next)?.scores.STR ?? 10, carriedCoinLb(next)) : { kept: rolled.loot, left: [] };
    const won = { ...rolled, loot: carry.kept };
    if (carry.left.length) receipts.push(`Left behind (too heavy to carry): ${carry.left.map((l) => l.name).join(', ')}`);
    next = {
      ...next,
      inventory: [...(next.inventory ?? []), ...won.loot],
      lootPity: won.lootPity ? { byTier: { ...(next.lootPity?.byTier ?? {}), [won.lootPity.tier]: won.lootPity.next } } : next.lootPity,
    };
    next = gainLootMoney(next, won.goldGained, won.coinsGained);
    const money = lootMoneyText(won.goldGained, won.coinsGained);
    receipts.push(`Fight: VICTORY vs ${enc.name} in ${roundsText}. The fight is over: ${enc.name} ${down} and cannot fight on.`, `Encounter cleared: ${enc.name} (victory)`);
    next = pushCombatStateTx(next, `Fight vs ${enc.name}: victory in ${roundsText}`, enc.name, 'Engine fight');
    if (onRoad) next = settleRoadMeeting(next, 'victory');
    const xpRaw: ActiveEncounter = { ...raw, cr: blockCr, count: setup.combat.foes.length };
    const paid = payEncounterXp(next, xpRaw, `defeated ${enc.name}`);
    next = paid.state;
    receipts.push(...paid.receipts);
    if (money) receipts.push(`Gold Gained: ${money}`);
    if (won.loot.length) receipts.push(`Loot: ${won.loot.map((l) => `[${l.rarity}] ${l.name}`).join(', ')} — ${fightLootClause(weaponInHand(working))}`);
    receipts.push(...(won.lootLines ?? []));
    // The amount is on STATUS (Gold Gained); the writer only hears that there was coin.
    const bits = [...won.loot.map((l) => l.name), ...(money ? ['some coin'] : [])];
    facts.push(`${cap(enc.name)} ${setup.combat.foes.length > 1 ? 'are all down' : 'went down and stayed down'}.${bits.length ? ` On the body: ${bits.join(', ')}.` : ''}`);
    return { state: next, receipts, facts: `${OVER_HEAD} ${facts.join(' ')}` };
  }

  if (res.outcome === 'escaped') {
    const tick = tickEncounterTerminal(next, input, { fleeSucceeded: true });
    next = tag({ ...tick.state, roundCombat: null }, 'left', 'creature', { id: `creature:${enc.name}`, name: enc.name }, 'fled');
    receipts.push(`Fight: ESCAPED from ${enc.name} after ${roundsText}`, ...tick.receipts);
    if (!tick.receipts.some((r) => /^Encounter cleared:/.test(r))) receipts.push(`Encounter cleared: ${enc.name} (escape)`);
    next = pushCombatStateTx(next, `Fight vs ${enc.name}: escaped after ${roundsText}`, enc.name, 'Engine fight');
    if (onRoad) next = settleRoadMeeting(next, 'escape');
    facts.push(`You got clear of ${enc.name}. Nothing was won or looted.`);
    return { state: next, receipts, facts: `${OVER_HEAD} ${facts.join(' ')}` };
  }

  // Down (death saves) or killed outright.
  const dead = res.outcome === 'dead';
  // The foes leave a downed PC: the encounter ends here and the foe stays at the place (placeThreats).
  const lost = tickEncounterTerminal(next, input, { playerDead: true });
  next = {
    ...lost.state,
    roundCombat: null,
    character: { ...next.character, hp: 0, conditions: [...new Set([...(next.character.conditions ?? []), 'Unconscious'])] },
    deathSaves: { successes: 0, failures: 0 },
  };
  receipts.push(`Fight: DEFEAT vs ${enc.name} in ${roundsText}. The fight is over: you lost it.`, ...lost.receipts);
  next = tag(next, 'failed', 'combat', { id: `combat:${enc.name}`, name: enc.name }, 'downed');
  next = pushCombatStateTx(next, `Fight vs ${enc.name}: defeat in ${roundsText}`, enc.name, 'Engine fight');
  if (onRoad) next = settleRoadMeeting(next, 'defeat');
  if (dead) {
    const end = commitDeath(next, 'danger', rng);
    receipts.push(...end.receipts);
    facts.push(end.fact);
    next = end.state;
  } else facts.push(`${cap(enc.name)} left you where you fell. You are dying and must fight for breath.`);
  return { state: next, receipts, facts: `${OVER_HEAD} ${facts.join(' ')}`, foeAfter: { ...encNow, phase: 'engaged' } };
}

/** "Class feature: Rage — 1 of 2 uses left" / "Class feature: Lay On Hands — 3 of 5 HP left in the pool". */
export function featureLine(c: Pick<GameState['character'], 'srd' | 'level' | 'featureUses'>, use: FeatureUse): string {
  const max = featureMax(c.srd!.classId, c.level ?? 1, use);
  const left = featureLeft(c, use);
  return use === 'layOnHands'
    ? `Class feature: ${FEATURE_LABEL[use]} — ${left} of ${max} HP left in the pool`
    : `Class feature: ${FEATURE_LABEL[use]} — ${left} of ${max} use${max === 1 ? '' : 's'} left`;
}

/** Bonus-action features a line asks for this round: Rage, Reckless Attack, Innate Sorcery, Lay On Hands. */
function roundFeatures(
  state: GameState,
  live: RoundCombatState | null,
  input: string,
  action: RoundAction
): { features: RoundFeatures; notes: string[]; facts: string[] } {
  const s = (input ?? '').toLowerCase();
  const c = state.character;
  const features: RoundFeatures = {};
  const notes: string[] = [];
  const facts: string[] = [];
  if (/\brage\b/.test(s) && featureMax(c.srd!.classId, c.level ?? 1, 'rage') > 0 && !live?.raging) {
    const why = featureLeft(c, 'rage') <= 0 ? 'no uses left until you rest' : wearsHeavyArmor(state) ? 'no Rage in Heavy armor' : action === 'cast' ? 'you cannot cast while raging' : null;
    if (why) {
      notes.push(`Class feature: Rage — not used (${why})`);
      facts.push(`You reach for your rage, but ${why}.`);
    } else features.rage = true;
  }
  if (/\breckless\b/.test(s) && hasClassFeature(c, /^Reckless Attack/)) features.reckless = true;
  if (/\binnate sorcery\b/.test(s) && featureLeft(c, 'innateSorcery') > 0 && !live?.innateSorcery) features.innateSorcery = true;
  if (/\blay on hands\b/.test(s) && featureLeft(c, 'layOnHands') > 0 && c.hp < c.maxHp) {
    features.layOnHands = Math.min(featureLeft(c, 'layOnHands'), c.maxHp - c.hp);
  }
  return { features, notes, facts };
}

/** At 0 HP every turn is one death save until three successes, three failures, or a natural 20. */
export function resolveDeathSaveTurn(state: GameState, rng: Rng = turnRng(state, 'death-save')): RoundFightResult | null {
  if (!isDying(state)) return null;
  const house = houseRulesOf(state);
  // 5.2.1 Heroic Inspiration rerolls a failed death save; under 5.1 it is kept for the next attack or save in a fight.
  const reroll = !!state.character.heroicInspiration && house.rulesVersion === 'srd-5.2.1';
  const r = rollDeathSave(state.deathSaves!, rng, { reroll });
  const secret = house.secretDeathSaves;
  const receipts = [deathSaveLine(r, secret)];
  let next: GameState = { ...state, deathSaves: r.state };
  if (r.rerolled !== undefined) {
    next = { ...next, character: { ...next.character, heroicInspiration: false } };
    receipts.push('Heroic Inspiration: spent');
  }
  if (r.state.dead) {
    const end = commitDeath(next, 'danger', rng, 'Your breath stops. You are dead.');
    return { state: end.state, receipts: [...receipts, ...end.receipts], facts: `${DYING_HEAD} ${end.fact}`, noTerminal: true };
  }
  const conditions = (state.character.conditions ?? []).filter((c) => !/^unconscious$/i.test(c));
  let fact: string;
  if (r.result === 'revived') {
    next = { ...next, deathSaves: null, character: { ...state.character, hp: 1, conditions } };
    receipts.push(hpLine(0, 1));
    fact = 'You surge back to consciousness with a gasp and get up, barely on your feet.';
  } else if (r.state.stable) {
    const woke = advanceClock({ ...next, deathSaves: null, character: { ...state.character, hp: 1, conditions } }, r.hoursToWake ?? 1);
    next = woke.state;
    receipts.push(hpLine(0, 1), `Time: ${woke.note}`);
    fact = `Your breathing steadies; you are stable. ${HOURS_LATER[r.hoursToWake ?? 0] ?? 'Hours'} later you wake, weak but alive.`;
  } else {
    fact = `You lie unconscious on the ground at 0 HP and cannot move, speak or act. ${secret
      ? 'You lie at the edge, neither waking nor slipping away yet.'
      : r.result === 'success' ? 'You cling to life; your breathing holds.' : 'You slip further; your breath falters.'}`;
  }
  return { state: next, receipts, facts: `${DYING_HEAD} ${fact}`, noTerminal: true };
}

// FIGHT2 (John 19:15): tabletop supplies its own fight round rules to the encounter FSM.
// SRD 5.2.1 Combat Step by Step (WotC, CC BY 4.0): "The game organizes the chaos of combat into a cycle of
// rounds and turns... each participant in a battle takes a turn." Every round action is a combat turn, and at
// the cap the foe takes its turn in initiative order through resolveRoundFight (no new damage formula).
registerFightRoundRules('dnd', {
  isCombatTurn: (input) => classifyRoundAction(input) !== 'other',
  capRound: (state, enc, input) => {
    const round = resolveRoundFight(state, state, enc, input || 'Dodge', {});
    return round ? { state: round.state, receipts: round.receipts } : null;
  },
});
