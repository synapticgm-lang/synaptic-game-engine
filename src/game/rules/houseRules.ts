/**
 * House rules the shared engine obeys, built from Settings once per turn and read from GameState.houseRules.
 * Cleave and flanking are common optional table rules, not SRD rules; they are off unless the player turns them on.
 * Gritty / heroic rests, variant encumbrance and the crit variants are common optional table rules too.
 */
import type { GameState, HouseRules, Settings } from '../types';
import { levelSidekick } from './sidekick';
import { settlePurse } from './coins';

export const DEFAULT_HOUSE_RULES: HouseRules = {
  secretDeathSaves: false,
  cleave: false,
  flanking: false,
  strictEncumbrance: false,
  combatFrequency: 50,
  socialRoleplay: 50,
  worldBuilding: 50,
  rulesVersion: 'srd-5.2.1',
  statMethod: 'choose',
  startingLevel: 1,
  progression: 'xp',
  diceVisibility: 'open',
  encounterDifficulty: 'normal',
  soloScaling: false,
  sidekick: 'none',
  deathRule: 'srd',
  restVariant: 'standard',
  encumbrance: 'off',
  critRule: 'double-dice',
  // A save with no Settings stamp holds none; Settings turn it on by default.
  heroicInspiration: false,
  travelPace: 'normal',
};

const slider = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

export function houseRulesFromSettings(s: Partial<Settings> | null | undefined): HouseRules {
  const encumbrance = oneOf(s?.ttEncumbrance, ['off', 'capacity', 'variant'] as const, s?.strictEncumbrance === true ? 'capacity' : 'off');
  return {
    secretDeathSaves: s?.secretDeathSaves === true,
    cleave: s?.cleaveMechanics === true,
    flanking: s?.flankingAdvantage === true,
    strictEncumbrance: encumbrance !== 'off',
    combatFrequency: slider(s?.combatFrequency),
    socialRoleplay: slider(s?.socialRoleplay),
    worldBuilding: slider(s?.worldBuilding),
    rulesVersion: oneOf(s?.ttRulesVersion, ['srd-5.2.1', 'srd-5.1'] as const, 'srd-5.2.1'),
    statMethod: oneOf(s?.ttStatMethod, ['choose', 'point-buy', 'standard-array', '4d6'] as const, 'choose'),
    startingLevel: typeof s?.ttStartingLevel === 'number' ? Math.max(1, Math.min(5, Math.round(s.ttStartingLevel))) : 1,
    progression: oneOf(s?.ttProgression, ['xp', 'milestone'] as const, 'xp'),
    diceVisibility: oneOf(s?.ttDiceVisibility, ['open', 'hidden'] as const, 'open'),
    encounterDifficulty: oneOf(s?.ttEncounterDifficulty, ['easy', 'normal', 'hard', 'deadly'] as const, 'normal'),
    soloScaling: s?.ttSoloScaling === true,
    sidekick: oneOf(s?.ttSidekick, ['none', 'warrior', 'expert', 'spellcaster'] as const, 'none'),
    deathRule: oneOf(s?.ttDeathRule, ['srd', 'revive', 'mercy'] as const, 'srd'),
    restVariant: oneOf(s?.ttRestVariant, ['standard', 'gritty', 'heroic'] as const, 'standard'),
    encumbrance,
    critRule: oneOf(s?.ttCritRule, ['double-dice', 'max-plus-roll', 'double-total'] as const, 'double-dice'),
    heroicInspiration: s?.ttHeroicInspiration !== false,
    travelPace: oneOf(s?.ttTravelPace, ['fast', 'normal', 'slow'] as const, 'normal'),
  };
}

export function houseRulesOf(state: Pick<GameState, 'houseRules'> | null | undefined): HouseRules {
  return state?.houseRules ? { ...DEFAULT_HOUSE_RULES, ...state.houseRules } : DEFAULT_HOUSE_RULES;
}

/** Milestone keys that earn Heroic Inspiration (a quest finished, an ending reached). */
const INSPIRING = /^(?:quest-complete|spine-ending):/;

/**
 * Heroic Inspiration earned since the last turn: a finished quest or a reached ending grants it (one held at a time).
 * The first stamp on a save records the old keys without granting.
 */
export function grantEarnedInspiration<T extends GameState>(state: T): T {
  const keys = (state.sandboxAwardKeys ?? []).filter((k) => INSPIRING.test(k));
  if (!state.inspirationKeys) return { ...state, inspirationKeys: keys };
  const fresh = keys.filter((k) => !state.inspirationKeys!.includes(k));
  if (!fresh.length) return state;
  const on = houseRulesOf(state).heroicInspiration && !!state.character?.srd;
  return {
    ...state,
    inspirationKeys: [...state.inspirationKeys, ...fresh],
    ...(on ? { character: { ...state.character, heroicInspiration: true } } : {}),
  };
}

/** Stamp this turn's Settings onto the state the engine reads. Tabletop only; other modes keep the defaults. */
export function withHouseRules<T extends GameState>(state: T, settings: Partial<Settings> | null | undefined): T {
  if (state.engineMode !== 'dnd') return state;
  const companions = levelSidekick(state.companions, state.character?.level || 1);
  return settlePurse(grantEarnedInspiration({ ...state, houseRules: houseRulesFromSettings(settings), ...(companions !== state.companions ? { companions } : {}) }));
}

/**
 * Whether a carry limit blocks new items. Tabletop reads its stamped Encumbrance rule (the one the fight loot reads);
 * the other modes read the Strict Encumbrance toggle.
 */
export function carryLimitOn(state: Pick<GameState, 'engineMode' | 'houseRules'>, settings: Partial<Settings> | null | undefined): boolean {
  if (state.engineMode === 'dnd') return houseRulesOf(state).strictEncumbrance;
  return settings?.strictEncumbrance === true;
}

/**
 * Turns between drought encounters at this Combat Frequency: 50 keeps the base, 100 halves it, 0 doubles it.
 */
export function scaledCadence(base: number, combatFrequency: number): number {
  const factor = Math.max(0.5, Math.min(2, 50 / Math.max(1, combatFrequency)));
  return Math.max(1, Math.round(base * factor));
}

/** Copies of a pool entry at this slider value: 0–4, with 50 giving 2 (every kind weighs the same). */
export function pillarCopies(value: number): number {
  return Math.max(0, Math.min(4, Math.round(value / 25)));
}

/** Milestone levelling on a sheet character: XP pays nothing; quest-complete, dungeon-clear and endings give a level. */
export function milestoneLevelling(state: Pick<GameState, 'houseRules' | 'character' | 'engineMode'>): boolean {
  return state.engineMode === 'dnd' && !!state.character?.srd && houseRulesOf(state).progression === 'milestone';
}

/** An XP award under the save's rules: 0 under milestone levelling. */
export function xpUnderRules(state: Pick<GameState, 'houseRules' | 'character' | 'engineMode'>, amount: number): number {
  return milestoneLevelling(state) ? 0 : amount;
}

const RULES_LABEL: Record<HouseRules['rulesVersion'], string> = { 'srd-5.2.1': 'SRD 5.2.1', 'srd-5.1': 'SRD 5.1' };

/** The sheet's table-rules line: rules version, levelling, Heroic Inspiration held or not. */
export function tableRulesLine(state: Pick<GameState, 'houseRules' | 'character'>): string {
  const h = houseRulesOf(state);
  const parts = [`Rules: ${RULES_LABEL[h.rulesVersion]}`, h.progression === 'milestone' ? 'Levelling: milestone' : 'Levelling: XP'];
  if (h.heroicInspiration) parts.push(`Heroic Inspiration: ${state.character?.heroicInspiration ? 'yes' : 'no'}`);
  parts.push(`Travel pace: ${h.travelPace}`);
  return parts.join(' · ');
}

/** Rest lengths in hours by variant (standard SRD; gritty and heroic are optional table rules). */
export const REST_HOURS: Record<HouseRules['restVariant'], { short: number; long: number }> = {
  standard: { short: 1, long: 8 },
  gritty: { short: 8, long: 168 },
  heroic: { short: 5 / 60, long: 1 },
};

/** Foe numbers by encounter difficulty: HP multiplier, to-hit shift, extra foes when there is a group. */
export const ENCOUNTER_DIFFICULTY: Record<HouseRules['encounterDifficulty'], { hp: number; toHit: number; extraFoe: number }> = {
  easy: { hp: 0.75, toHit: -1, extraFoe: 0 },
  normal: { hp: 1, toHit: 0, extraFoe: 0 },
  hard: { hp: 1.25, toHit: 1, extraFoe: 0 },
  deadly: { hp: 1.5, toHit: 2, extraFoe: 1 },
};
