/**
 * PYOA 2d6 dice engine (DICE-RULES.md).
 * Only the engine rolls; book text never decides a result.
 * Seedable: roll = hash(seed, sectionId, visitCount) → two d6.
 */

import type { PyoaDiceRollView, PyoaDiceRules, PyoaDiceSheet } from './pyoaBookTypes';

export type PyoaCheckOutcome = 'full' | 'mixed' | 'miss';

/** Mulberry32 — small deterministic PRNG from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable hash mix for (seed, sectionId, visit). */
export function pyoaRollSeed(seed: number, sectionId: string, visit: number): number {
  let h = seed >>> 0;
  const s = `${sectionId}#${visit}`;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b1);
    h = (h << 13) | (h >>> 19);
  }
  h ^= visit * 0x85ebca6b;
  return h >>> 0;
}

export function roll2d6(rng: () => number): { die1: number; die2: number } {
  const die1 = 1 + Math.floor(rng() * 6);
  const die2 = 1 + Math.floor(rng() * 6);
  return { die1, die2 };
}

/**
 * Classify a 2d6 + stat vs target.
 * Double six → always full; double one → always miss.
 * Full: total >= target + 2; Mixed: total === target || total === target + 1; else miss.
 */
export function classify2d6Outcome(
  die1: number,
  die2: number,
  statBonus: number,
  target: number
): { total: number; outcome: PyoaCheckOutcome; doubleSix: boolean; doubleOne: boolean } {
  const total = die1 + die2 + statBonus;
  const doubleSix = die1 === 6 && die2 === 6;
  const doubleOne = die1 === 1 && die2 === 1;
  if (doubleSix) return { total, outcome: 'full', doubleSix, doubleOne };
  if (doubleOne) return { total, outcome: 'miss', doubleSix, doubleOne };
  if (total >= target + 2) return { total, outcome: 'full', doubleSix, doubleOne };
  if (total === target || total === target + 1) return { total, outcome: 'mixed', doubleSix, doubleOne };
  return { total, outcome: 'miss', doubleSix, doubleOne };
}

/** Move outcome up one step (miss→mixed→full). Luck push. */
export function bumpOutcome(outcome: PyoaCheckOutcome): PyoaCheckOutcome {
  if (outcome === 'miss') return 'mixed';
  if (outcome === 'mixed') return 'full';
  return 'full';
}

export function formatPyoaDiceRoll(roll: PyoaDiceRollView): string {
  const luck = roll.usedLuck ? ' (luck push)' : '';
  return `2d6 (${roll.die1}, ${roll.die2}) + ${roll.stat} ${roll.statBonus >= 0 ? '+' : ''}${roll.statBonus} = ${roll.total} vs ${roll.target} → ${roll.outcome}${luck}`;
}

export function assignStatSpread(
  statNames: string[],
  spread: number[],
  /** Optional order of assignment; default = book order. */
  order?: string[]
): Record<string, number> {
  const names = order?.length ? order : statNames;
  const stats: Record<string, number> = {};
  for (const n of statNames) stats[n] = 0;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name in stats) stats[name] = spread[i] ?? 0;
  }
  return stats;
}

export function createDiceSheet(
  rules: PyoaDiceRules,
  opts?: { statOrder?: string[]; seed?: number }
): PyoaDiceSheet {
  return {
    stats: assignStatSpread(rules.stats, rules.statSpread, opts?.statOrder),
    stamina: rules.stamina,
    staminaMax: rules.stamina,
    luck: rules.luck,
    luckMax: rules.luckMax,
    keepsakes: [],
  };
}

/**
 * Perform a skill test for a check section. Visit count must already be the
 * visit that is about to resolve (1-based after increment).
 */
export function performPyoaCheck(opts: {
  seed: number;
  sectionId: string;
  visit: number;
  stat: string;
  target: number;
  label: string;
  sheet: PyoaDiceSheet;
}): PyoaDiceRollView {
  const { seed, sectionId, visit, stat, target, label, sheet } = opts;
  let bonus = sheet.stats[stat] ?? 0;
  if (sheet.stamina <= 0) bonus -= 2;
  const rng = mulberry32(pyoaRollSeed(seed, sectionId, visit));
  const { die1, die2 } = roll2d6(rng);
  const classified = classify2d6Outcome(die1, die2, bonus, target);
  return {
    sectionId,
    visit,
    stat,
    target,
    label,
    die1,
    die2,
    statBonus: bonus,
    total: classified.total,
    baseOutcome: classified.outcome,
    outcome: classified.outcome,
    usedLuck: false,
    doubleSix: classified.doubleSix,
    doubleOne: classified.doubleOne,
  };
}

/** Spend 1 luck to bump outcome one step. Returns null if unavailable. */
export function applyLuckPush(
  roll: PyoaDiceRollView,
  sheet: PyoaDiceSheet
): { roll: PyoaDiceRollView; sheet: PyoaDiceSheet } | null {
  if (roll.usedLuck || sheet.luck < 1) return null;
  if (roll.outcome === 'full') return null;
  return {
    roll: {
      ...roll,
      outcome: bumpOutcome(roll.outcome),
      usedLuck: true,
    },
    sheet: { ...sheet, luck: sheet.luck - 1 },
  };
}

export function clampStamina(n: number, max: number): number {
  return Math.max(0, Math.min(max, n));
}
