/**
 * Shared rules engine — dice. Every mode rolls through here; a mode's presenter decides what is shown.
 * Critical Hit doubles the damage dice, not the modifier (SRD 5.2.1, CC-BY-4.0).
 */
import type { CritRule } from '../types';

export type { CritRule };

export type Rng = () => number;

export interface DiceRoll {
  notation: string;
  dice: number[];
  bonus: number;
  total: number;
  crit: boolean;
  /** Crit variant max-plus-roll: this many leading dice were set to their maximum, not rolled. */
  maxed?: number;
  /** Crit variant double-total: the dice total was doubled. */
  doubled?: boolean;
}

export function parseDice(notation: string): { count: number; sides: number; bonus: number } | null {
  const m = /^\s*(\d*)d(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i.exec(notation ?? '');
  if (!m) return null;
  const bonus = m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0;
  return { count: Math.max(1, Number(m[1] || 1)), sides: Number(m[2]), bonus };
}

export function rollDie(sides: number, rng: Rng): number {
  return Math.floor(rng() * sides) + 1;
}

/** Roll `notation` (e.g. 1d8, 2d6+3) plus `extraBonus`; a crit rolls the dice twice (or per `critRule`). Never below 0. */
export function rollDice(notation: string, rng: Rng, opts: { crit?: boolean; extraBonus?: number; critRule?: CritRule } = {}): DiceRoll {
  const p = parseDice(notation) ?? { count: 1, sides: 4, bonus: 0 };
  const bonus = p.bonus + (opts.extraBonus ?? 0);
  const rule = opts.crit ? opts.critRule ?? 'double-dice' : null;
  if (rule === 'double-total') {
    const dice = Array.from({ length: p.count }, () => rollDie(p.sides, rng));
    const sum = dice.reduce((s, d) => s + d, 0);
    return { notation: `${p.count}d${p.sides}`, dice, bonus, total: Math.max(0, sum * 2 + bonus), crit: true, doubled: true };
  }
  const maxed = rule === 'max-plus-roll' ? p.count : 0;
  const n = p.count * (rule ? 2 : 1);
  const dice = [...Array.from({ length: maxed }, () => p.sides), ...Array.from({ length: n - maxed }, () => rollDie(p.sides, rng))];
  return {
    notation: `${n}d${p.sides}`,
    dice,
    bonus,
    total: Math.max(0, dice.reduce((s, d) => s + d, 0) + bonus),
    crit: !!opts.crit,
    ...(maxed ? { maxed } : {}),
  };
}

export function signed(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`;
}

/** "2d6 (4, 5) + 3 = 12"; crit variants: "1d8 max 8 + 1d8 (3) + 3 = 14", "1d8 (3) ×2 + 3 = 9". */
export function formatDice(r: DiceRoll): string {
  const bonus = r.bonus ? ` ${signed(r.bonus)}` : '';
  if (r.doubled) return `${r.notation} (${r.dice.join(', ')}) ×2${bonus} = ${r.total}`;
  if (r.maxed) {
    const sides = r.notation.split('d')[1];
    const top = r.dice.slice(0, r.maxed);
    return `${r.maxed}d${sides} max ${top.reduce((s, d) => s + d, 0)} + ${r.dice.length - r.maxed}d${sides} (${r.dice.slice(r.maxed).join(', ')})${bonus} = ${r.total}`;
  }
  return `${r.notation} (${r.dice.join(', ')})${bonus} = ${r.total}`;
}
