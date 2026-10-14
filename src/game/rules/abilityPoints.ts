/**
 * Shared rules engine — ability points. One engine for the tabletop Ability Score Improvement and LitRPG
 * free stat points: points raise ability scores through `finalScores` (cap 20), a raised CON raises max HP
 * for every level (SRD 5.2.1), and each spend is recorded as `{ level, bonus }` like a sheet's ASI list.
 * Tabletop: the ASI at the class's ASI levels, auto-picked (rules/advancement). LitRPG with no sheet: free
 * points every level-up, which the player spends through the System prompt.
 *
 * LitRPG presenter: a System row of `+1 STR` … chips plus "Let the System choose", a STATUS line per spend and
 * the writer's ENGINE RESULT fact. A housing that hides the level spends them silently by class priority.
 */
import type { AttributeKey, Attributes, Character, GameState } from '../types';
import { ABILITY_KEYS, abilityMod, classDef, finalScores } from '../tabletop/characterBuild';
import { hidesPart } from '../systemHousing';
import { classIdOf, quickStartClass } from './characterClass';
import { rewardBoxPad } from './achievements';

export const ABILITY_SCORE_CAP = 20;
/** Free stat points a LitRPG character with no sheet earns per level-up. */
export const LITRPG_STAT_POINTS_PER_LEVEL = 1;
export const STAT_SYSTEM_CHOICE_CHIP = 'Let the System choose';

export interface AbilityRaise {
  attributes: Attributes;
  /** Points that landed (a score at the cap takes none). */
  applied: Partial<Attributes>;
  before: Partial<Attributes>;
  after: Partial<Attributes>;
}

/** Raise scores by `bonus`, capped at 20 — the same step the tabletop ASI takes. */
export function raiseAbilities(scores: Attributes, bonus: Partial<Attributes>): AbilityRaise {
  const attributes = finalScores(scores, bonus);
  const keys = ABILITY_KEYS.filter((k) => attributes[k] !== scores[k]);
  return {
    attributes,
    applied: Object.fromEntries(keys.map((k) => [k, attributes[k] - scores[k]])) as Partial<Attributes>,
    before: Object.fromEntries(keys.map((k) => [k, scores[k]])) as Partial<Attributes>,
    after: Object.fromEntries(keys.map((k) => [k, attributes[k]])) as Partial<Attributes>,
  };
}

/** Free stat points earned: LitRPG characters with no tabletop sheet, one batch per level above 1. */
export function statPointsEarned(state: Pick<GameState, 'engineMode' | 'character'>): number {
  const c = state.character;
  if (state.engineMode !== 'litrpg' || !c || c.srd) return 0;
  return Math.max(0, (c.level ?? 1) - 1) * LITRPG_STAT_POINTS_PER_LEVEL;
}

function pointsSpent(c: Character | undefined): number {
  return (c?.statAllocations ?? []).reduce(
    (n, a) => n + ABILITY_KEYS.reduce((m, k) => m + (a.bonus[k] ?? 0), 0),
    0
  );
}

export function unspentStatPoints(state: Pick<GameState, 'engineMode' | 'character'>): number {
  return Math.max(0, statPointsEarned(state) - pointsSpent(state.character));
}

function raisable(c: Character): AttributeKey[] {
  return ABILITY_KEYS.filter((k) => (c.attributes?.[k] ?? 10) < ABILITY_SCORE_CAP);
}

export interface StatSpend {
  state: GameState;
  raise: AbilityRaise;
  maxHpBefore: number;
  maxHpAfter: number;
  left: number;
}

/** Spend free points: raise the scores, a CON modifier change moves max and current HP by that change × level. */
export function spendStatPoints(state: GameState, bonus: Partial<Attributes>): StatSpend | null {
  const c = state.character;
  const room = unspentStatPoints(state);
  if (!c || room <= 0) return null;
  const clamped: Partial<Attributes> = {};
  let budget = room;
  for (const k of ABILITY_KEYS) {
    const want = Math.min(bonus[k] ?? 0, budget);
    if (want > 0) {
      clamped[k] = want;
      budget -= want;
    }
  }
  const raise = raiseAbilities(c.attributes, clamped);
  if (!Object.keys(raise.applied).length) return null;
  const level = c.level ?? 1;
  const hpStep = (abilityMod(raise.attributes.CON) - abilityMod(c.attributes.CON)) * level;
  const maxHpBefore = c.maxHp ?? c.hp ?? 0;
  const maxHpAfter = Math.max(1, maxHpBefore + hpStep);
  const character: Character = {
    ...c,
    attributes: raise.attributes,
    maxHp: maxHpAfter,
    hp: Math.max(0, Math.min(maxHpAfter, (c.hp ?? maxHpBefore) + hpStep)),
    statAllocations: [...(c.statAllocations ?? []), { level, bonus: raise.applied }],
  };
  const next = { ...state, character };
  return { state: next, raise, maxHpBefore, maxHpAfter, left: unspentStatPoints(next) };
}

/** The System's own pick: one point at a time to the class's first ability under the cap (Quick start class with none). */
export function systemStatPick(state: GameState, points: number): Partial<Attributes> {
  const priority = classDef(classIdOf(state.character) ?? quickStartClass(state)).priority;
  const scores = { ...state.character.attributes };
  const out: Partial<Attributes> = {};
  for (let i = 0; i < points; i++) {
    const k = priority.find((p) => scores[p] < ABILITY_SCORE_CAP);
    if (!k) break;
    scores[k] += 1;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function statChip(k: AttributeKey): string {
  return `+1 ${k}`;
}

function promptBlocked(state: GameState): boolean {
  return state.engineMode !== 'litrpg' || !!state.activeEncounter || !!state.roundCombat || hidesPart(state.systemHousing, 'level');
}

/** The System prompt's chips while points wait: one per ability under the cap, and the System's choice. */
export function statPointPad(state: GameState): string[] | null {
  if (promptBlocked(state) || unspentStatPoints(state) <= 0) return null;
  const open = raisable(state.character);
  return open.length ? [...open.map(statChip), STAT_SYSTEM_CHOICE_CHIP] : null;
}

const ABILITY_WORDS: Record<AttributeKey, string> = {
  STR: 'str(?:ength)?',
  DEX: 'dex(?:terity)?',
  CON: 'con(?:stitution)?',
  INT: 'int(?:elligence)?',
  WIS: 'wis(?:dom)?',
  CHA: 'cha(?:risma)?',
};
const SPEND_VERB = /\b(?:raise|put|add|spend|assign|allocate|increase|boost|invest|pump|level up)\b/i;
const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };

/** The points this line spends while points wait: a chip, "+2 DEX", or a spend verb naming abilities. */
export function statSpendFromInput(state: GameState, input: string): Partial<Attributes> | 'system' | null {
  if (unspentStatPoints(state) <= 0) return null;
  const t = (input ?? '').replace(/\s+/g, ' ').trim().replace(/[.!]+$/, '');
  if (!t) return null;
  if (t.toLowerCase() === STAT_SYSTEM_CHOICE_CHIP.toLowerCase() || /\blet the system (?:choose|pick|decide|spend)\b/i.test(t)) return 'system';
  const plusForm = /^(?:\+\d+\s+[a-z]+(?:\s*(?:,|and)\s*)?)+$/i.test(t);
  if (!plusForm && !SPEND_VERB.test(t)) return null;
  const out: Partial<Attributes> = {};
  for (const k of ABILITY_KEYS) {
    const re = new RegExp(`(?:\\+?(\\d+|a|an|one|two|three|four|five)\\s+(?:(?:stat\\s+)?points?\\s+)?(?:(?:in|into|to|on)\\s+)?(?:my\\s+)?)?\\b${ABILITY_WORDS[k]}\\b`, 'i');
    const m = t.match(re);
    if (!m) continue;
    const raw = (m[1] ?? '1').toLowerCase();
    out[k] = Number(raw) || NUMBER_WORDS[raw] || 1;
  }
  return Object.keys(out).length ? out : null;
}

export interface StatSettle {
  state: GameState;
  receipts: string[];
  fact?: string;
  /** The player's line was the spend (not talk to anyone in the scene). */
  settled: boolean;
}

function raiseText(r: AbilityRaise): string {
  return ABILITY_KEYS.filter((k) => r.applied[k])
    .map((k) => `+${r.applied[k]} ${k} (${r.before[k]} → ${r.after[k]})`)
    .join(', ');
}

/**
 * LitRPG free stat points, before the writer: spend what this line names. A housing that hides the level
 * spends every waiting point silently by class priority. Fights wait. Other modes: nothing.
 */
export function settleStatPoints(state: GameState, input: string): StatSettle {
  const none: StatSettle = { state, receipts: [], settled: false };
  const waiting = unspentStatPoints(state);
  if (state.engineMode !== 'litrpg' || waiting <= 0 || state.activeEncounter || state.roundCombat) return none;
  if (hidesPart(state.systemHousing, 'level')) {
    const spent = spendStatPoints(state, systemStatPick(state, waiting));
    return spent ? { state: spent.state, receipts: [], settled: false } : none;
  }
  const pick = statSpendFromInput(state, input);
  if (!pick) return none;
  const spent = spendStatPoints(state, pick === 'system' ? systemStatPick(state, waiting) : pick);
  if (!spent) return none;
  const hp = spent.maxHpAfter !== spent.maxHpBefore ? ` HP max ${spent.maxHpBefore} → ${spent.maxHpAfter}.` : '';
  const left = spent.left ? ` ${spent.left} point${spent.left > 1 ? 's' : ''} left.` : '';
  const how = pick === 'system' ? 'The System spent' : 'Spent';
  return {
    state: spent.state,
    receipts: [`Stats: ${how} free stat points — ${raiseText(spent.raise)}.${hp}${left}`],
    fact: `The player put free stat points into ${raiseText(spent.raise)}.${hp}`,
    settled: true,
  };
}

export interface SystemPrompt {
  heading: string;
  chips: string[];
}

/** The one System prompt row above the chips: the class offer first, then waiting stat points, then reward boxes. */
export function systemPromptPad(state: GameState, classChips: string[] | null): SystemPrompt | null {
  if (classChips) return { heading: 'System — choose a class', chips: classChips };
  const stats = statPointPad(state);
  if (stats) {
    const n = unspentStatPoints(state);
    return { heading: `System — ${n} stat point${n > 1 ? 's' : ''} to spend`, chips: stats };
  }
  const boxes = rewardBoxPad(state);
  return boxes ? { heading: `System — reward box${boxes.length > 1 ? 'es' : ''} to open`, chips: boxes } : null;
}
