/**
 * 28a — Engine-owned XP rules (XP-PLAN.md). The AI never decides XP.
 *
 * D&D tables (CR→XP, level thresholds): This work includes material taken from the System Reference
 * Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at
 * https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the
 * Creative Commons Attribution 4.0 International License available at
 * https://creativecommons.org/licenses/by/4.0/legalcode.
 *
 * D&D milestone sizes (XP Budget per Character): This work includes material from the System Reference
 * Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.
 * The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at
 * https://creativecommons.org/licenses/by/4.0/legalcode.
 */
import type { EngineMode, GmStrictness } from './types';
import { difficultyRow } from './difficultyRules';

export type MilestoneKind =
  | 'encounter'
  | 'miniBoss'
  | 'boss'
  | 'dungeonCleared'
  | 'questStep'
  | 'questComplete'
  | 'significantPerson'
  | 'significantPlace'
  | 'achievement';

/** SRD 5.1 "Experience Points by Challenge Rating". CR 0 is "0 or 10"; a real threat pays 10. */
export const DND_XP_BY_CR: Readonly<Record<string, number>> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
  '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000,
  '28': 120000, '29': 135000, '30': 155000,
};

/** SRD 5.1 "Character Advancement": total XP for levels 1–20 (index = level − 1). */
export const DND_LEVEL_THRESHOLDS: readonly number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

/** SRD 5.2.1 "XP Budget per Character" as [Low, Moderate, High] for levels 1–20. */
export const DND_XP_BUDGET_PER_CHARACTER: readonly (readonly [number, number, number])[] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100],
  [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];

/** LitRPG and other non-D&D modes: flat milestone amounts (level 2 at 150 on the existing curve). */
export const LITRPG_MILESTONE_XP: Readonly<Record<MilestoneKind, number>> = {
  encounter: 40,
  miniBoss: 80,
  boss: 150,
  dungeonCleared: 100,
  questStep: 50,
  questComplete: 100,
  significantPerson: 25,
  significantPlace: 25,
  achievement: 75,
};

/** CR used when a D&D monster has no `cr` yet (the note says so). */
export const DND_DEFAULT_CR = '1/4';

export function normalizeCr(cr: string | number | undefined | null): string | null {
  if (cr == null || cr === '') return null;
  const s = String(cr).trim();
  if (s === '0.125') return '1/8';
  if (s === '0.25') return '1/4';
  if (s === '0.5') return '1/2';
  return DND_XP_BY_CR[s] != null ? s : null;
}

export function crToXp(cr: string | number | undefined | null): number {
  return DND_XP_BY_CR[normalizeCr(cr) ?? DND_DEFAULT_CR] ?? 50;
}

/** XP needed from the start of `level` to the next level on the 5e thresholds. */
export function dndXpToNext(level: number): number {
  const lvl = Math.max(1, Math.min(20, Math.floor(level || 1)));
  if (lvl >= 20) return 1_000_000;
  return DND_LEVEL_THRESHOLDS[lvl]! - DND_LEVEL_THRESHOLDS[lvl - 1]!;
}

export interface MilestoneXpResult {
  amount: number;
  /** D&D: the maths shown to the player. Other modes: empty (result only). */
  detail: string;
}

/** The one engine rule for every milestone. 28d: scaled by the shared difficulty table (Hard ×1.25). */
export function milestoneXp(
  mode: EngineMode | undefined,
  kind: MilestoneKind,
  opts: { level?: number; partySize?: number; cr?: string | number | null; strictness?: GmStrictness | null } = {}
): MilestoneXpResult {
  const base = milestoneXpBase(mode, kind, opts);
  const row = difficultyRow(opts.strictness);
  if (row.xpScale === 1 || base.amount <= 0) return base;
  const amount = Math.round(base.amount * row.xpScale);
  return {
    amount,
    detail: mode === 'dnd' ? `${base.detail} × ${row.xpScale} (${row.label}) = ${amount}` : base.detail,
  };
}

function milestoneXpBase(
  mode: EngineMode | undefined,
  kind: MilestoneKind,
  opts: { level?: number; partySize?: number; cr?: string | number | null } = {}
): MilestoneXpResult {
  if (mode !== 'dnd') return { amount: LITRPG_MILESTONE_XP[kind] ?? 0, detail: '' };
  if (kind === 'encounter' || kind === 'miniBoss' || kind === 'boss') {
    const party = Math.max(1, Math.floor(opts.partySize ?? 1));
    const given = normalizeCr(opts.cr);
    const cr = given ?? DND_DEFAULT_CR;
    const base = crToXp(cr);
    const amount = Math.floor(base / party);
    return {
      amount,
      detail: `CR ${cr}${given ? '' : ' (no CR on card, default)'} = ${base} XP ÷ ${party} = ${amount}`,
    };
  }
  if (kind === 'achievement') return { amount: 0, detail: '' };
  const lvl = Math.max(1, Math.min(20, Math.floor(opts.level ?? 1)));
  const [low, moderate, high] = DND_XP_BUDGET_PER_CHARACTER[lvl - 1]!;
  const band: [string, number] =
    kind === 'significantPerson' || kind === 'significantPlace'
      ? ['Low', low]
      : kind === 'questStep'
        ? ['Moderate', moderate]
        : ['High', high];
  return { amount: band[1], detail: `level ${lvl} ${band[0]} milestone = ${band[1]} XP` };
}
