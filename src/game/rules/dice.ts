/**
 * Shared rules engine — dice. Every mode rolls through here; a mode's presenter decides what is shown.
 * Critical Hit doubles the damage dice, not the modifier (SRD 5.2.1, CC-BY-4.0).
 */
export type Rng = () => number;

export interface DiceRoll {
  notation: string;
  dice: number[];
  bonus: number;
  total: number;
  crit: boolean;
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

/** Roll `notation` (e.g. 1d8, 2d6+3) plus `extraBonus`; a crit rolls the dice twice. Never below 0. */
export function rollDice(notation: string, rng: Rng, opts: { crit?: boolean; extraBonus?: number } = {}): DiceRoll {
  const p = parseDice(notation) ?? { count: 1, sides: 4, bonus: 0 };
  const n = p.count * (opts.crit ? 2 : 1);
  const dice = Array.from({ length: n }, () => rollDie(p.sides, rng));
  const bonus = p.bonus + (opts.extraBonus ?? 0);
  return {
    notation: `${n}d${p.sides}`,
    dice,
    bonus,
    total: Math.max(0, dice.reduce((s, d) => s + d, 0) + bonus),
    crit: !!opts.crit,
  };
}

export function signed(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`;
}

/** "2d6 (4, 5) + 3 = 12" */
export function formatDice(r: DiceRoll): string {
  const bonus = r.bonus ? ` ${signed(r.bonus)}` : '';
  return `${r.notation} (${r.dice.join(', ')})${bonus} = ${r.total}`;
}
