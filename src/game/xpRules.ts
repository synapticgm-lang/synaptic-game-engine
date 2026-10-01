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
import type { Companion, EngineMode, GmStrictness, SummonEntity } from './types';
import { difficultyRow } from './difficultyRules';

export type MilestoneKind =
  | 'encounter'
  | 'miniBoss'
  | 'boss'
  | 'dungeonCleared'
  | 'dungeonEntry'
  | 'roomCleared'
  | 'questStep'
  | 'questComplete'
  | 'significantPerson'
  | 'significantPlace'
  | 'achievement'
  | 'deed';

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
  dungeonEntry: 25,
  roomCleared: 30,
  questStep: 50,
  questComplete: 100,
  significantPerson: 25,
  significantPlace: 25,
  achievement: 75,
  /** 29z1 — LitRPG deeds pay through deedXp on the flat kinds; story RPG deeds pay no XP. */
  deed: 0,
};

/** 29z1 — a deed the engine already counts: the first one, a count step, the top count step. */
export type DeedStep = 'first' | 'count' | 'capstone';

/**
 * 29z1 — pay for an engine-seen deed, by mode. LitRPG: significant-place / quest-step / quest-complete
 * amounts. Tabletop: half the level's Low budget (never a level, never the flat 75). Story RPG: 0 XP
 * (its reward is an item, see sandboxXp). Difficulty scale and the over-level cut apply as for any milestone.
 */
export function deedXp(mode: EngineMode | undefined, step: DeedStep, opts: MilestoneXpOpts = {}): MilestoneXpResult {
  if (mode === 'litrpg') {
    return milestoneXp(mode, step === 'first' ? 'significantPlace' : step === 'count' ? 'questStep' : 'questComplete', opts);
  }
  if (mode === 'dnd') return milestoneXp(mode, 'deed', opts);
  return { amount: 0, detail: '' };
}

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

/** Level on the 5e thresholds for a total XP. */
export function dndLevelForXp(xp: number): number {
  let lvl = 1;
  while (lvl < 20 && (xp ?? 0) >= DND_LEVEL_THRESHOLDS[lvl]!) lvl++;
  return lvl;
}

/** A party member splits fight XP with the player. Pets, mounts and summons do not. */
export function takesPartyShare(c: Companion): boolean {
  return c.type === 'party' && !c.summon;
}

/** Pets, mounts and summons: a separate XP total and level, outside the party split. */
export function keepsOwnXp(c: Companion): boolean {
  return c.summon === true || c.type === 'beast' || c.type === 'mount';
}

/** Max HP gained per level from the hidden total. */
const COMPANION_HP_PER_LEVEL = { party: 5, pet: 3 } as const;

/**
 * D&D fight XP for everyone who fought beside the player: each party member gets the same per-member
 * share the player got; pets and summons add the same amount to their own total without counting in
 * the split. A companion with no level starts at level 1. A level-up raises max HP (their powers
 * advance from the hidden total). Caretakers take nothing. The writer never sees these numbers.
 */
export function payCompanionsFightXp(companions: Companion[] | undefined, share: number): Companion[] {
  const list = companions ?? [];
  if (share <= 0) return list;
  return list.map((c) => {
    const party = takesPartyShare(c);
    if (!party && !keepsOwnXp(c)) return c;
    const xp = (c.xp ?? 0) + share;
    const was = c.level ?? 1;
    const level = Math.max(was, dndLevelForXp(xp));
    const gain = (level - was) * (party ? COMPANION_HP_PER_LEVEL.party : COMPANION_HP_PER_LEVEL.pet);
    return { ...c, xp, level, maxHp: c.maxHp + gain, hp: Math.min(c.maxHp + gain, c.hp + gain) };
  });
}

/** Active summons on the sheet: their own hidden total; a level-up raises max HP, attack and defense. */
export function paySummonsFightXp(summons: SummonEntity[] | undefined, share: number): SummonEntity[] | undefined {
  if (!summons?.length || share <= 0) return summons;
  return summons.map((s) => {
    if (!s.active) return s;
    const xp = (s.xp ?? 0) + share;
    const was = s.level ?? 1;
    const level = Math.max(was, dndLevelForXp(xp));
    const up = level - was;
    const hpGain = up * COMPANION_HP_PER_LEVEL.pet;
    return {
      ...s,
      xp,
      level,
      maxHp: s.maxHp + hpGain,
      hp: Math.min(s.maxHp + hpGain, s.hp + hpGain),
      attack: s.attack + up,
      defense: s.defense + up,
    };
  });
}

export interface MilestoneXpResult {
  amount: number;
  /** D&D: the maths shown to the player. Other modes: empty (result only). */
  detail: string;
}

/** 29r — player this many levels above the area: every milestone there pays OVER_LEVEL_SHARE. */
export const OVER_LEVEL_GAP = 6;
export const OVER_LEVEL_SHARE = 0.05;

export function isOverLevel(playerLevel: number | undefined, areaLevel: number | undefined): boolean {
  if (playerLevel == null || areaLevel == null) return false;
  if (!Number.isFinite(playerLevel) || !Number.isFinite(areaLevel)) return false;
  return playerLevel - areaLevel >= OVER_LEVEL_GAP;
}

/** 5 percent, rounded, never zero when the full amount was at least 1. */
export function overLevelAmount(amount: number): number {
  if (amount < 1) return 0;
  return Math.max(1, Math.round(amount * OVER_LEVEL_SHARE));
}

export interface MilestoneXpOpts {
  /** D&D budget level (player level, or the area level for a settlement card). */
  level?: number;
  partySize?: number;
  cr?: string | number | null;
  strictness?: GmStrictness | null;
  /** 29r — player level and unclamped area level for the over-level cut. */
  playerLevel?: number;
  areaLevel?: number;
}

/**
 * The one engine rule for every milestone. 28d: scaled by the shared difficulty table (Hard ×1.25).
 * 29r: then the over-level cut when the player is 6+ levels above the area.
 */
export function milestoneXp(mode: EngineMode | undefined, kind: MilestoneKind, opts: MilestoneXpOpts = {}): MilestoneXpResult {
  const base = milestoneXpBase(mode, kind, opts);
  const row = difficultyRow(opts.strictness);
  let result = base;
  if (row.xpScale !== 1 && base.amount > 0) {
    const amount = Math.round(base.amount * row.xpScale);
    result = {
      amount,
      detail: mode === 'dnd' ? `${base.detail} × ${row.xpScale} (${row.label}) = ${amount}` : base.detail,
    };
  }
  if (result.amount > 0 && isOverLevel(opts.playerLevel, opts.areaLevel)) {
    const amount = overLevelAmount(result.amount);
    result = {
      amount,
      detail:
        mode === 'dnd'
          ? `${result.detail} × 5% (level ${opts.playerLevel} vs area ${opts.areaLevel}) = ${amount}`
          : result.detail,
    };
  }
  return result;
}

function milestoneXpBase(
  mode: EngineMode | undefined,
  kind: MilestoneKind,
  opts: MilestoneXpOpts = {}
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
  if (kind === 'deed') {
    const amount = Math.floor(low / 2);
    return { amount, detail: `level ${lvl} Low milestone ${low} ÷ 2 = ${amount} XP` };
  }
  const band: [string, number] =
    kind === 'significantPerson' || kind === 'significantPlace' || kind === 'dungeonEntry' || kind === 'roomCleared'
      ? ['Low', low]
      : kind === 'questStep'
        ? ['Moderate', moderate]
        : ['High', high];
  return { amount: band[1], detail: `level ${lvl} ${band[0]} milestone = ${band[1]} XP` };
}
