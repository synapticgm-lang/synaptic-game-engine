/**
 * SynapticGM in-house coin tables (original). The SRD 5.2.1 has no treasure-by-CR tables, so these are our own
 * rows, dice and amounts — not copied from any published table. They are scaled by challenge rating to sit
 * against SRD 5.2.1 equipment prices (a longsword 15 GP, chain mail 75 GP, plate 1,500 GP) and use the SRD coin
 * denominations (rules/coins.ts).
 *
 * Individual: what one creature that carries a purse has on it. Hoard: a lair, a boss's stash, a chest.
 * Each band rolls one d8 for the row; every die is shown on STATUS.
 */
import type { CoinPurse } from '../types';
import { EMPTY_PURSE, addCoins, purseCp } from './coins';

export const COIN_TABLE_SOURCE = 'in-house' as const;

type Coin = keyof CoinPurse;

/** One coin amount: `n`d`die` × `times` of one denomination. */
export interface CoinDice {
  n: number;
  die: number;
  times: number;
  coin: Coin;
}

export interface CoinRow {
  /** Inclusive d8 range for this row. */
  from: number;
  to: number;
  dice: CoinDice[];
}

export interface CoinBand {
  /** Lowest CR (or party level for an unowned stash) the band covers. */
  minCr: number;
  label: string;
  rows: CoinRow[];
}

export interface CoinTable {
  id: 'individual' | 'hoard';
  source: typeof COIN_TABLE_SOURCE;
  bands: CoinBand[];
}

const d = (n: number, die: number, coin: Coin, times = 1): CoinDice => ({ n, die, times, coin });

export const INDIVIDUAL_COINS: CoinTable = {
  id: 'individual',
  source: COIN_TABLE_SOURCE,
  bands: [
    {
      minCr: 0,
      label: 'CR 0–4',
      rows: [
        { from: 1, to: 3, dice: [d(2, 8, 'cp'), d(1, 4, 'sp')] },
        { from: 4, to: 6, dice: [d(2, 6, 'sp')] },
        { from: 7, to: 7, dice: [d(1, 6, 'gp'), d(1, 6, 'sp')] },
        { from: 8, to: 8, dice: [d(2, 4, 'gp')] },
      ],
    },
    {
      minCr: 5,
      label: 'CR 5–10',
      rows: [
        { from: 1, to: 3, dice: [d(4, 8, 'sp')] },
        { from: 4, to: 6, dice: [d(2, 6, 'gp'), d(2, 8, 'sp')] },
        { from: 7, to: 7, dice: [d(3, 8, 'gp')] },
        { from: 8, to: 8, dice: [d(1, 4, 'pp'), d(1, 6, 'gp')] },
      ],
    },
    {
      minCr: 11,
      label: 'CR 11–16',
      rows: [
        { from: 1, to: 3, dice: [d(2, 8, 'sp', 10)] },
        { from: 4, to: 6, dice: [d(3, 8, 'gp', 5)] },
        { from: 7, to: 7, dice: [d(2, 6, 'pp'), d(2, 8, 'gp')] },
        { from: 8, to: 8, dice: [d(3, 6, 'pp')] },
      ],
    },
    {
      minCr: 17,
      label: 'CR 17+',
      rows: [
        { from: 1, to: 3, dice: [d(3, 8, 'gp', 20)] },
        { from: 4, to: 6, dice: [d(2, 10, 'pp', 10)] },
        { from: 7, to: 7, dice: [d(4, 8, 'pp', 10), d(2, 8, 'gp', 20)] },
        { from: 8, to: 8, dice: [d(6, 8, 'pp', 10)] },
      ],
    },
  ],
};

export const HOARD_COINS: CoinTable = {
  id: 'hoard',
  source: COIN_TABLE_SOURCE,
  bands: [
    {
      minCr: 0,
      label: 'CR 0–4',
      rows: [
        { from: 1, to: 4, dice: [d(4, 6, 'cp', 10), d(3, 8, 'sp', 10)] },
        { from: 5, to: 7, dice: [d(3, 8, 'sp', 10), d(2, 8, 'gp', 5)] },
        { from: 8, to: 8, dice: [d(4, 6, 'cp', 10), d(3, 8, 'sp', 10), d(2, 8, 'gp', 5)] },
      ],
    },
    {
      minCr: 5,
      label: 'CR 5–10',
      rows: [
        { from: 1, to: 4, dice: [d(3, 8, 'sp', 20), d(4, 8, 'gp', 25)] },
        { from: 5, to: 7, dice: [d(4, 8, 'gp', 25), d(2, 6, 'pp', 5)] },
        { from: 8, to: 8, dice: [d(3, 8, 'sp', 20), d(4, 8, 'gp', 25), d(2, 6, 'pp', 5)] },
      ],
    },
    {
      minCr: 11,
      label: 'CR 11–16',
      rows: [
        { from: 1, to: 4, dice: [d(4, 8, 'gp', 100)] },
        { from: 5, to: 7, dice: [d(4, 8, 'gp', 100), d(3, 8, 'pp', 20)] },
        { from: 8, to: 8, dice: [d(6, 8, 'gp', 100), d(3, 8, 'pp', 20)] },
      ],
    },
    {
      minCr: 17,
      label: 'CR 17+',
      rows: [
        { from: 1, to: 4, dice: [d(6, 8, 'gp', 250)] },
        { from: 5, to: 7, dice: [d(6, 8, 'gp', 250), d(4, 8, 'pp', 100)] },
        { from: 8, to: 8, dice: [d(8, 8, 'gp', 250), d(4, 8, 'pp', 100)] },
      ],
    },
  ],
};

/** A CR as a number: "1/4" → 0.25, "3" → 3; anything unreadable → 0. */
export function crNumber(cr: string | number | null | undefined): number {
  if (typeof cr === 'number') return Number.isFinite(cr) ? Math.max(0, cr) : 0;
  const t = String(cr ?? '').trim();
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (frac) return Number(frac[1]) / Math.max(1, Number(frac[2]));
  const n = Number(t);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function coinBandFor(table: CoinTable, cr: number): CoinBand {
  return [...table.bands].reverse().find((b) => cr >= b.minCr) ?? table.bands[0]!;
}

const LABEL: Record<Coin, string> = { pp: 'PP', gp: 'GP', ep: 'EP', sp: 'SP', cp: 'CP' };

export interface CoinRoll {
  coins: CoinPurse;
  /** Whole GP the coins are worth (the gold ledger). */
  gold: number;
  /** STATUS lines, every die shown. */
  lines: string[];
}

/** Roll a coin table `times` times at `cr`. Every die comes from `rng`; nothing is chosen by the writer. */
export function rollCoinTable(table: CoinTable, cr: number, rng: () => number, times = 1): CoinRoll {
  const band = coinBandFor(table, cr);
  const roll = (sides: number) => 1 + Math.min(sides - 1, Math.floor(rng() * sides));
  let coins: CoinPurse = { ...EMPTY_PURSE };
  const lines: string[] = [];
  const name = table.id === 'hoard' ? 'hoard' : 'individual';
  for (let t = 0; t < Math.max(1, times); t++) {
    const pick = roll(8);
    const row = band.rows.find((r) => pick >= r.from && pick <= r.to) ?? band.rows[0]!;
    const parts: string[] = [];
    for (const c of row.dice) {
      const rolls = Array.from({ length: c.n }, () => roll(c.die));
      const amount = rolls.reduce((s, r) => s + r, 0) * c.times;
      coins = addCoins(coins, { [c.coin]: amount });
      const mult = c.times > 1 ? ` × ${c.times}` : '';
      parts.push(`${c.n}d${c.die}${mult} = ${amount} ${LABEL[c.coin]} [${rolls.join(', ')}]`);
    }
    lines.push(`Coins (SynapticGM ${name} table, ${band.label}): d8 = ${pick}; ${parts.join('; ')}`);
  }
  return { coins, gold: Math.floor(purseCp(coins) / 100), lines };
}
