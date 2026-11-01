/**
 * 28a / XP-D1 — Engine-owned XP rules (XP-PLAN.md). The AI never decides XP.
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
import type { Companion, EngineMode, GmStrictness, SummonEntity } from './types.ts';
import { difficultyRow } from './difficultyRules.ts';
import {
  DEED_UNITS,
  contentScale,
  isUnitXpMode,
  unitMilestoneAmount,
  unitsToXp,
  xpUnit,
} from './rules/xpPace.ts';

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

/**
 * LitRPG L1 reference amounts (xpUnit L1 = 50). Live litrpg/rpg pay uses unitMilestoneAmount;
 * this table is the L1 snapshot / FAST_XP + SANDBOX_XP alias surface (one owner via xpPace).
 */
/** L1 snapshot of units × xpUnit (questComplete = 3 units after XP-D1 A2 mix tune). */
export const LITRPG_MILESTONE_XP: Readonly<Record<MilestoneKind, number>> = {
  encounter: 50,
  miniBoss: 100,
  boss: 200,
  dungeonCleared: 150,
  dungeonEntry: 25,
  roomCleared: 25,
  questStep: 50,
  questComplete: 150,
  significantPerson: 25,
  significantPlace: 25,
  achievement: 75,
  deed: 0,
};

/**
 * Story RPG: progress comes from people and deeds (meetings, quest steps, resolved fights), not from
 * reaching a place, so arrivals and walking into a site pay nothing.
 */
export const STORY_RPG_MILESTONE_XP: Readonly<Record<MilestoneKind, number>> = {
  ...LITRPG_MILESTONE_XP,
  significantPlace: 0,
  dungeonEntry: 0,
  achievement: 0,
};

/** 29z1 — a deed the engine already counts: the first one, a count step, the top count step. */
export type DeedStep = 'first' | 'count' | 'capstone';

/**
 * 29z1 / XP-D1 — LitRPG deeds pay fixed units. Tabletop / Story RPG: 0 XP (item-only for RPG).
 */
export function deedXp(mode: EngineMode | undefined, step: DeedStep, opts: MilestoneXpOpts = {}): MilestoneXpResult {
  if (mode !== 'litrpg') return { amount: 0, detail: '' };
  const playerLevel = opts.playerLevel ?? opts.level ?? 1;
  const content = opts.areaLevel ?? playerLevel;
  let amount = unitsToXp(DEED_UNITS[step], xpUnit(mode, playerLevel));
  amount = Math.max(1, Math.round(amount * contentScale(playerLevel, content)));
  const scale = difficultyRow(opts.strictness).xpScale;
  if (scale !== 1 && amount > 0) amount = Math.round(amount * scale);
  return { amount, detail: '' };
}

/** CR a bare number falls back to when nothing else gives one (crToXp only). */
export const DND_DEFAULT_CR = '1/4';

/** D&D fight XP is paid from a CR; a fight with no encounter behind it has none. */
export const NO_CR_XP_REASON = 'no XP: the foe has no challenge rating on its card or an SRD stat block';

/**
 * Fight milestone kind from the encounter's source / name.
 * XP-D1: density-tier "elite" in catalog ids/sources is mid-threat (miniBoss units), not a second flat table.
 * Root of the old flat-80 Story RPG fight: `\belite\b` matched catalog/road sources and paid miniBoss=80.
 */
export function encounterKind(enc: { source?: string; name?: string; miniBoss?: boolean; threatTier?: string }): MilestoneKind {
  if (enc.miniBoss === true || enc.threatTier === 'elite' || enc.threatTier === 'miniboss') return 'miniBoss';
  if (enc.threatTier === 'boss') return 'boss';
  const src = `${enc.source ?? ''} ${enc.name ?? ''}`;
  // Prefer explicit role tokens; bare "elite" in a catalog id still means miniBoss (density role).
  if (/mini[- ]?boss|\belite\b/i.test(src)) return 'miniBoss';
  if (/\bboss\b/i.test(src)) return 'boss';
  return 'encounter';
}

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

/** SRD 5.2.1 encounter budget: the XP one fight may hold for this party (band 0 Low, 1 Moderate, 2 High). */
export function encounterXpBudget(level: number, partySize: number, band: 0 | 1 | 2): number {
  const lvl = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return DND_XP_BUDGET_PER_CHARACTER[lvl - 1]![band] * Math.max(1, Math.floor(partySize || 1));
}

/**
 * E.3 — CR for a foe whose card gives none and whose name matches no SRD block: the highest CR one character of
 * the foe's level may face (SRD 5.2.1 XP Budget per Character): a common foe on the Low band, a mini-boss or boss
 * on the High band.
 */
export function crForFoeLevel(level: number | undefined, kind: MilestoneKind): string {
  const lvl = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return highestCrWithin(DND_XP_BUDGET_PER_CHARACTER[lvl - 1]![kind === 'encounter' ? 0 : 2]);
}

/** The highest CR whose XP fits in `maxXp` (CR 0 when none does). */
export function highestCrWithin(maxXp: number): string {
  let best = '0';
  for (const [cr, xp] of Object.entries(DND_XP_BY_CR)) if (xp <= maxXp && xp > DND_XP_BY_CR[best]!) best = cr;
  return best;
}

/** How many foes of `cr` fit in the budget: never more than asked for, never fewer than one. */
export function foesWithinBudget(cr: string | number | undefined | null, count: number, budget: number): number {
  return Math.max(1, Math.min(Math.floor(count || 1), Math.floor(budget / crToXp(cr))));
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
  return c.type === 'party' && !c.summon && !c.sidekick;
}

/** Pets, mounts and summons: a separate XP total and level, outside the party split. */
export function keepsOwnXp(c: Companion): boolean {
  return c.summon === true || c.type === 'beast' || c.type === 'mount';
}

const COMPANION_HP_PER_LEVEL = { party: 5, pet: 3 } as const;

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

/** Kept for dnd/pyoa callers and legacy tests; litrpg/rpg use contentScale instead. */
export const OVER_LEVEL_GAP = 6;
export const OVER_LEVEL_SHARE = 0.05;

export function isOverLevel(playerLevel: number | undefined, areaLevel: number | undefined): boolean {
  if (playerLevel == null || areaLevel == null) return false;
  if (!Number.isFinite(playerLevel) || !Number.isFinite(areaLevel)) return false;
  return playerLevel - areaLevel >= OVER_LEVEL_GAP;
}

export function overLevelAmount(amount: number): number {
  if (amount < 1) return 0;
  return Math.max(1, Math.round(amount * OVER_LEVEL_SHARE));
}

export interface MilestoneXpOpts {
  /** D&D budget level (player level, or the area level for a settlement card). */
  level?: number;
  partySize?: number;
  cr?: string | number | null;
  /** D&D encounter: how many foes of that CR were beaten (each pays its CR XP). */
  count?: number;
  strictness?: GmStrictness | null;
  /** Player level for grey / over-level. */
  playerLevel?: number;
  areaLevel?: number;
  /** Fight milestones: the foe's real level (clamped in xpPace). */
  foeLevel?: number;
  /** Quest / milestone content level when known. */
  contentLevel?: number;
  /** Optional repeat-ladder share (1 / 0.5 / 0.25 / 0.1). */
  repeatShare?: number;
}

/** Legacy constants — litrpg/rpg no longer apply these; kept so old imports compile. */
export const LOW_FOE_GAP = 3;
export const LOW_FOE_SHARE = 0.25;

function isFightKind(kind: MilestoneKind): boolean {
  return kind === 'encounter' || kind === 'miniBoss' || kind === 'boss';
}

export function isLowFoe(playerLevel: number | undefined, foeLevel: number | undefined): boolean {
  if (playerLevel == null || foeLevel == null) return false;
  if (!Number.isFinite(playerLevel) || !Number.isFinite(foeLevel)) return false;
  return playerLevel - foeLevel >= LOW_FOE_GAP;
}

/**
 * Order E / XP-D1 — mode row. LitRPG / Story RPG: difficulty yes; LOW_FOE and OVER_LEVEL off
 * (replaced by contentScale). Tabletop / PYOA rows unchanged.
 */
type Table = Readonly<Record<MilestoneKind, number>> | 'srd' | 'units';
export const MODE_XP: Readonly<Record<EngineMode, { xp: boolean; difficulty: boolean; overLevel: boolean; lowFoe: boolean; table: Table }>> = {
  dnd: { xp: true, difficulty: false, overLevel: false, lowFoe: false, table: 'srd' },
  litrpg: { xp: true, difficulty: true, overLevel: false, lowFoe: false, table: 'units' },
  rpg: { xp: true, difficulty: true, overLevel: false, lowFoe: false, table: 'units' },
  pyoa: { xp: false, difficulty: false, overLevel: false, lowFoe: false, table: LITRPG_MILESTONE_XP },
};

/** The one engine rule for every milestone: the base amount, then the multipliers the mode's row allows. */
export function milestoneXp(mode: EngineMode | undefined, kind: MilestoneKind, opts: MilestoneXpOpts = {}): MilestoneXpResult {
  const rules = MODE_XP[mode ?? 'litrpg'] ?? MODE_XP.litrpg;
  if (!rules.xp) return { amount: 0, detail: '' };
  let result = milestoneXpBase(mode, rules, kind, opts);
  const scale = difficultyRow(opts.strictness).xpScale;
  if (rules.difficulty && scale !== 1 && result.amount > 0) {
    result = { amount: Math.round(result.amount * scale), detail: result.detail };
  }
  if (rules.lowFoe && result.amount > 0 && isFightKind(kind) && isLowFoe(opts.level ?? opts.playerLevel, opts.foeLevel)) {
    result = { amount: Math.round(result.amount * LOW_FOE_SHARE), detail: result.detail };
  }
  if (rules.overLevel && result.amount > 0 && isOverLevel(opts.playerLevel, opts.areaLevel)) {
    result = { amount: overLevelAmount(result.amount), detail: result.detail };
  }
  if (opts.repeatShare != null && opts.repeatShare !== 1 && result.amount > 0) {
    result = { amount: Math.max(1, Math.round(result.amount * opts.repeatShare)), detail: result.detail };
  }
  return result;
}

function milestoneXpBase(
  mode: EngineMode | undefined,
  rules: { table: Table },
  kind: MilestoneKind,
  opts: MilestoneXpOpts
): MilestoneXpResult {
  if (rules.table === 'srd') {
    if (kind === 'encounter' || kind === 'miniBoss' || kind === 'boss') {
      const party = Math.max(1, Math.floor(opts.partySize ?? 1));
      const foes = Math.max(1, Math.floor(opts.count ?? 1));
      const cr = normalizeCr(opts.cr);
      if (!cr) return { amount: 0, detail: NO_CR_XP_REASON };
      const each = crToXp(cr);
      const base = each * foes;
      const amount = Math.floor(base / party);
      return {
        amount,
        detail: `CR ${cr} = ${foes > 1 ? `${each} XP × ${foes} = ` : ''}${base} XP ÷ ${party} = ${amount}`,
      };
    }
    return { amount: 0, detail: '' };
  }
  if (rules.table === 'units' || isUnitXpMode(mode)) {
    const playerLevel = opts.playerLevel ?? opts.level ?? 1;
    const amount = unitMilestoneAmount(mode, kind, {
      playerLevel,
      foeLevel: opts.foeLevel,
      contentLevel: opts.contentLevel,
      areaLevel: opts.areaLevel,
    });
    return { amount, detail: '' };
  }
  return { amount: rules.table[kind] ?? 0, detail: '' };
}
