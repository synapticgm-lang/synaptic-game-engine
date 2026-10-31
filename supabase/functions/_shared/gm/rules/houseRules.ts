/**
 * House rules the shared engine obeys, built from Settings once per turn and read from GameState.houseRules.
 * Cleave and flanking are common optional table rules, not SRD rules; they are off unless the player turns them on.
 * Gritty / heroic rests, variant encumbrance and the crit variants are common optional table rules too.
 * TT-H1 — SRD 5.2.1 Heroic Inspiration (Wizards of the Coast LLC, CC BY 4.0): hold at most one;
 * "expend it to reroll any die immediately after rolling it, and you must use the new roll."
 */
import type { GameState, HouseRules, Settings } from '../types.ts';
import { resolveCheckRecord, type CheckResultRecord } from '../checkRules.ts';
import { turnRng } from '../seededRng.ts';
import { levelSidekick } from './sidekick.ts';
import { settlePurse } from './coins.ts';

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
  /** T10PUSH — every tabletop choice point (fights included); free text always allowed. */
  choiceCountLimit: 3,
};

/** Clamp the tabletop choice-count limit (John 31 Oct: min 2, max 6, default 3). */
export function clampChoiceCountLimit(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 3;
  return Math.max(2, Math.min(6, v));
}

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
    // SRD 5.2.1 as written: levels come from CR XP on the advancement table only.
    progression: 'xp',
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
    choiceCountLimit: clampChoiceCountLimit(s?.ttChoiceCountLimit),
  };
}

export function houseRulesOf(state: Pick<GameState, 'houseRules'> | null | undefined): HouseRules {
  return state?.houseRules ? { ...DEFAULT_HOUSE_RULES, ...state.houseRules } : DEFAULT_HOUSE_RULES;
}

/** ONE owner for the player-facing choice-count limit (houseRules on the save). */
export function choiceCountLimitOf(state: Pick<GameState, 'houseRules'> | null | undefined): number {
  return clampChoiceCountLimit(houseRulesOf(state).choiceCountLimit);
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

/** Plain chip label — never rewritten with a skill/difficulty tag (plan §4). */
export const HEROIC_INSPIRATION_REROLL_CHIP = 'Reroll (Heroic Inspiration)';
export const INSPIRATION_AWARD_GAP_TURNS = 20;

export function stampLastCheckResult(state: GameState, rec: CheckResultRecord | null | undefined): GameState {
  if (state.engineMode !== 'dnd' || !rec || rec.auto || !rec.d20s?.length) {
    return rec == null ? { ...state, lastCheckResult: undefined } : state;
  }
  return { ...state, lastCheckResult: rec };
}

export function inspirationRerollPads(state: GameState): string[] {
  if (state.engineMode !== 'dnd' || !houseRulesOf(state).heroicInspiration) return [];
  if (!state.character?.heroicInspiration) return [];
  const rec = state.lastCheckResult;
  if (!rec || rec.auto || !rec.d20s?.length) return [];
  return [HEROIC_INSPIRATION_REROLL_CHIP];
}

/** Spend Inspiration: reroll one die on the stamped CheckResultRecord; new roll stands. */
export function resolveInspirationReroll(
  state: GameState,
  input: string,
): { state: GameState; receipts: string[]; facts: string[] } | null {
  const label = (input ?? '').trim();
  if (!label || label.toLowerCase() !== HEROIC_INSPIRATION_REROLL_CHIP.toLowerCase()) return null;
  if (state.engineMode !== 'dnd' || !houseRulesOf(state).heroicInspiration) return null;
  if (!state.character?.heroicInspiration) return null;
  const prev = state.lastCheckResult;
  if (!prev || prev.auto || !prev.d20s?.length) return null;
  const fresh = resolveCheckRecord({
    label: prev.label,
    mods: prev.mods,
    dc: prev.dc,
    adv: 'normal',
    rng: turnRng(state, 'inspiration-reroll', prev.label, String(state.turn ?? 0)),
    cue: prev.cue,
  });
  const idx = prev.d20s.indexOf(prev.kept);
  const d20s: number[] = [];
  if (prev.d20s.length === 1) d20s.push(fresh.kept);
  else for (let i = 0; i < prev.d20s.length; i++) d20s.push(i === idx ? fresh.kept : prev.d20s[i]!);
  const kept = fresh.kept;
  let modSum = 0;
  for (const m of prev.mods) modSum += m.value;
  const total = kept + modSum;
  const nextRec: CheckResultRecord = {
    ...prev,
    d20s,
    kept,
    total,
    outcome: total >= prev.dc ? 'success' : 'failure',
  };
  const line = `Heroic Inspiration: spent — rerolled d20 ${prev.kept} → ${kept} (${nextRec.outcome})`;
  return {
    state: {
      ...state,
      character: { ...state.character, heroicInspiration: false },
      lastCheckResult: nextRec,
    },
    receipts: [line],
    facts: [line],
  };
}

/** Engine GM award (heroic-act / quest-step). Hold at most one; ~1 per 20 turns. */
export function awardHeroicInspiration(state: GameState, reasonKey: string): { state: GameState; line?: string } {
  if (state.engineMode !== 'dnd' || !houseRulesOf(state).heroicInspiration) return { state };
  if (!reasonKey || !(reasonKey.startsWith('heroic-act:') || reasonKey.startsWith('quest-step:'))) return { state };
  const keys = state.inspirationKeys ?? [];
  if (keys.includes(reasonKey)) return { state };
  const turn = state.turn ?? 0;
  if (state.lastInspirationAwardTurn != null && turn - state.lastInspirationAwardTurn < INSPIRATION_AWARD_GAP_TURNS) {
    return { state };
  }
  const nextKeys = keys.concat(reasonKey);
  if (state.character?.heroicInspiration) {
    return {
      state: { ...state, inspirationKeys: nextKeys, lastInspirationAwardTurn: turn },
      line: 'Heroic Inspiration: already held (heroic act)',
    };
  }
  return {
    state: {
      ...state,
      inspirationKeys: nextKeys,
      lastInspirationAwardTurn: turn,
      character: { ...state.character, heroicInspiration: true },
    },
    line: 'Heroic Inspiration: yours (heroic act)',
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

const RULES_LABEL: Record<HouseRules['rulesVersion'], string> = { 'srd-5.2.1': 'SRD 5.2.1', 'srd-5.1': 'SRD 5.1' };

/** The sheet's table-rules line: rules version, levelling, Heroic Inspiration held or not. */
export function tableRulesLine(state: Pick<GameState, 'houseRules' | 'character'>): string {
  const h = houseRulesOf(state);
  const parts = [`Rules: ${RULES_LABEL[h.rulesVersion]}`, 'Levelling: XP'];
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
