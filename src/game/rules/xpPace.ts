/**
 * XP-D1 — one pace table for LitRPG and Story RPG character XP.
 * The AI never sets these numbers. Tabletop (dnd) and PYOA do not use this module.
 */
import type { EngineMode, Quest } from '../types';
import type { MilestoneKind } from '../xpRules';

/** Level 1 → 2 bar stays 150; after that ×1.25 per step. */
export const L1_BAR = 150;
export const BAR_GROWTH = 1.25;

/** Soft skill practice cap: 2 × characterLevel + 3 (L1 → 5, L10 → 23, L24+ → 50). */
export const SKILL_SOFT_CAP_BASE = 3;
export const SKILL_SOFT_CAP_PER_LEVEL = 2;
export const SKILL_SOFT_CAP_MAX = 50;

/** Grey floor share when content is far below the player. */
export const CONTENT_SCALE_FLOOR = 0.05;
/** Full pay while content is within this many levels of the player. */
export const CONTENT_FULL_GAP = 2;

/** Foe level clamp vs player (same idea as placeAuthority treasure clamp). */
export const FOE_LEVEL_CLAMP = 3;
/** Tougher-foe bonus: +10% per level above, capped. */
export const TOUGH_FOE_BONUS_PER_LEVEL = 0.1;
export const TOUGH_FOE_BONUS_CAP = 1.3;

/** Quest / fight farm ladder: 100% → 50% → 25% → 10% floor. */
export const REPEAT_SHARES = [1, 0.5, 0.25, 0.1] as const;

/**
 * Units of bar needed for one level (calibrated by xpPace.test.ts).
 * LitRPG L1 = 3 keeps quest-step ≈ 50 and First Steps ≈ 75 at the L1 unit.
 * Story RPG matches L1, then ceil(1.5 × LitRPG) from L2.
 */
/**
 * Tuned by xpPace.test.ts — engaged mix (~2.5 quest events per fight) lands L3–9 in 15–25 turns.
 * A2: complete back to 3 units; L2+ units raised so spans stay in band under frequent completes.
 */
const LITRPG_UNITS_PER_LEVEL: ReadonlyArray<{ maxLevel: number; units: number }> = [
  { maxLevel: 1, units: 3 },
  { maxLevel: 2, units: 8 },
  { maxLevel: 3, units: 10 },
  { maxLevel: 4, units: 11 },
  { maxLevel: 6, units: 13 },
  { maxLevel: 9, units: 15 },
  { maxLevel: 14, units: 22 },
  { maxLevel: 19, units: 26 },
  { maxLevel: Number.POSITIVE_INFINITY, units: 30 },
];

/** Award sizes in units of xpUnit (L1 unit = 50). Fractions allowed; pay rounds to whole XP. */
export const XP_UNIT_AWARDS: Readonly<Record<MilestoneKind, number>> = {
  encounter: 1,
  miniBoss: 2,
  boss: 4,
  dungeonCleared: 3,
  dungeonEntry: 0.5,
  roomCleared: 0.5,
  questStep: 1,
  /** L1 snapshot; L2+ uses QUEST_COMPLETE_UNITS_L2_PLUS so quest share stays 60–70%. */
  questComplete: 3,
  significantPerson: 0.5,
  significantPlace: 0.5,
  achievement: 1.5,
  deed: 0,
};

/**
 * XP-D1 OPEN4 — L2+ retune (rite / L1 untouched; unitsPerLevel gaps keep growing):
 * - on-level fight ≈ 14% of the L2 bar; 4–6 wins / 50 turns → fight share ~20% (band 15–30%)
 * - quest step / complete lift less than fight so quest share stays 55–80% and L2→L3 ≈ 15–25
 * OPEN3 live was ~3–4 XP/turn post-rite with 1–2 fights; engaged OPEN4 targets ~8–12 XP/turn.
 */
export const ENCOUNTER_UNITS_L2_PLUS = 1.15;
export const QUEST_STEP_UNITS_L2_PLUS = 1.0;
export const QUEST_COMPLETE_UNITS_L2_PLUS = 2.4;

/** One XP event may not exceed this share of the current level bar (LitRPG / Story RPG). */
export const XP_EVENT_BAR_CAP = 0.6;
/** After one level-up in a turn, surplus into the next bar is capped at this share. */
export const XP_TURN_SURPLUS_CAP = 0.5;

/** Story RPG zeros (same as prior STORY_RPG_MILESTONE_XP policy). */
export const STORY_RPG_UNIT_ZERO: ReadonlySet<MilestoneKind> = new Set([
  'significantPlace',
  'dungeonEntry',
  'achievement',
  'deed',
]);

/** LitRPG deed steps in units (First Kill / 3 fights / 10 fights). */
export const DEED_UNITS: Readonly<Record<'first' | 'count' | 'capstone', number>> = {
  first: 0.5,
  count: 1,
  capstone: 2,
};

export function isUnitXpMode(mode: EngineMode | undefined): boolean {
  return mode === 'litrpg' || mode === 'rpg';
}

/** XP needed to advance from `level` to level+1. */
export function levelBar(_mode: EngineMode | undefined, level: number): number {
  const lvl = Math.max(1, Math.floor(level || 1));
  if (lvl <= 1) return L1_BAR;
  let bar = L1_BAR;
  for (let i = 1; i < lvl; i++) bar = Math.floor(bar * BAR_GROWTH);
  return Math.max(1, bar);
}

export function unitsPerLevel(mode: EngineMode | undefined, level: number): number {
  const lvl = Math.max(1, Math.floor(level || 1));
  let lit = LITRPG_UNITS_PER_LEVEL[LITRPG_UNITS_PER_LEVEL.length - 1]!.units;
  for (const row of LITRPG_UNITS_PER_LEVEL) {
    if (lvl <= row.maxLevel) {
      lit = row.units;
      break;
    }
  }
  if (mode === 'rpg' && lvl >= 2) return Math.ceil(lit * 1.5);
  return lit;
}

export function xpUnit(mode: EngineMode | undefined, level: number): number {
  const bar = levelBar(mode, level);
  const units = Math.max(1, unitsPerLevel(mode, level));
  return Math.max(1, Math.round(bar / units));
}

/** Grey rule: gap = player − content. Full within ±2 (by gap≤2); linear to floor at G. */
export function greyGap(playerLevel: number): number {
  const L = Math.max(1, Math.floor(playerLevel || 1));
  return 5 + Math.floor(L / 10);
}

export function contentScale(playerLevel: number, contentLevel: number): number {
  const P = Math.max(1, Math.floor(playerLevel || 1));
  const C = Math.max(1, Math.floor(contentLevel || 1));
  const gap = P - C;
  if (gap <= CONTENT_FULL_GAP) return 1;
  const G = greyGap(P);
  if (gap >= G) return CONTENT_SCALE_FLOOR;
  const span = G - CONTENT_FULL_GAP;
  if (span <= 0) return CONTENT_SCALE_FLOOR;
  return Math.max(
    CONTENT_SCALE_FLOOR,
    1 - ((gap - CONTENT_FULL_GAP) * (1 - CONTENT_SCALE_FLOOR)) / span
  );
}

/** Clamp a content/foe level to player ± FOE_LEVEL_CLAMP; missing → player level. */
export function clampContentLevel(playerLevel: number, contentLevel: number | undefined | null): number {
  const P = Math.max(1, Math.floor(playerLevel || 1));
  if (contentLevel == null || !Number.isFinite(contentLevel)) return P;
  const raw = Math.max(1, Math.floor(contentLevel));
  return Math.max(P - FOE_LEVEL_CLAMP, Math.min(P + FOE_LEVEL_CLAMP, raw));
}

/** Bonus multiplier when the foe is above the player (capped). */
export function toughFoeScale(playerLevel: number, foeLevel: number): number {
  const above = Math.floor(foeLevel) - Math.floor(playerLevel);
  if (above <= 0) return 1;
  return Math.min(TOUGH_FOE_BONUS_CAP, 1 + above * TOUGH_FOE_BONUS_PER_LEVEL);
}

export function skillLevelCap(characterLevel: number): number {
  const L = Math.max(1, Math.floor(characterLevel || 1));
  return Math.min(SKILL_SOFT_CAP_MAX, SKILL_SOFT_CAP_PER_LEVEL * L + SKILL_SOFT_CAP_BASE);
}

/** Round unit × xpUnit; never below 1 when units > 0. */
export function unitsToXp(units: number, unitValue: number): number {
  if (units <= 0 || unitValue <= 0) return 0;
  return Math.max(1, Math.round(units * unitValue));
}

export function unitAwardFor(
  mode: EngineMode | undefined,
  kind: MilestoneKind,
  playerLevel?: number
): number {
  if (mode === 'rpg' && STORY_RPG_UNIT_ZERO.has(kind)) return 0;
  const lvl = Math.max(1, Math.floor(playerLevel ?? 1));
  if (lvl >= 2) {
    if (kind === 'encounter') return ENCOUNTER_UNITS_L2_PLUS;
    if (kind === 'questStep') return QUEST_STEP_UNITS_L2_PLUS;
    if (kind === 'questComplete') return QUEST_COMPLETE_UNITS_L2_PLUS;
  }
  return XP_UNIT_AWARDS[kind] ?? 0;
}

/**
 * LitRPG / Story RPG milestone amount before difficulty xpScale.
 * Fights also take tough-foe bonus; every kind with a content level takes contentScale.
 */
/** Cap a single XP event at XP_EVENT_BAR_CAP of the current bar (LitRPG / Story RPG only). */
export function capXpEventAmount(
  mode: EngineMode | undefined,
  playerLevel: number,
  amount: number
): number {
  if (!isUnitXpMode(mode) || amount <= 0) return amount;
  const bar = levelBar(mode, playerLevel);
  const cap = Math.max(1, Math.floor(bar * XP_EVENT_BAR_CAP));
  return Math.min(amount, cap);
}

export function unitMilestoneAmount(
  mode: EngineMode | undefined,
  kind: MilestoneKind,
  opts: {
    playerLevel?: number;
    contentLevel?: number | null;
    foeLevel?: number | null;
    areaLevel?: number | null;
    /** Settlement flat completes (29r/29s) keep the full unit award; main quest path stays capped. */
    skipEventCap?: boolean;
  } = {}
): number {
  const playerLevel = Math.max(1, Math.floor(opts.playerLevel ?? 1));
  const units = unitAwardFor(mode, kind, playerLevel);
  if (units <= 0) return 0;
  const unit = xpUnit(mode, playerLevel);
  let amount = unitsToXp(units, unit);

  const isFight = kind === 'encounter' || kind === 'miniBoss' || kind === 'boss';
  const rawContent = isFight
    ? (opts.foeLevel ?? opts.contentLevel ?? opts.areaLevel)
    : (opts.contentLevel ?? opts.areaLevel ?? opts.foeLevel);
  // Grey uses the unclamped content level (same idea as old over-level raw area).
  // Tough-foe bonus / missing level use the ±3 clamp.
  const unclamped =
    rawContent == null || !Number.isFinite(rawContent)
      ? playerLevel
      : Math.max(1, Math.floor(rawContent));
  const clamped = clampContentLevel(playerLevel, rawContent);
  amount = Math.max(1, Math.round(amount * contentScale(playerLevel, unclamped)));
  if (isFight) {
    amount = Math.max(1, Math.round(amount * toughFoeScale(playerLevel, clamped)));
  }
  return opts.skipEventCap ? amount : capXpEventAmount(mode, playerLevel, amount);
}

export function repeatShare(completionIndex: number): number {
  const i = Math.max(0, Math.floor(completionIndex));
  if (i < REPEAT_SHARES.length) return REPEAT_SHARES[i]!;
  return REPEAT_SHARES[REPEAT_SHARES.length - 1]!;
}

function normalizeIdentityPart(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

/**
 * Task key from quest kind/template/objective — not the free-text display name.
 * Prefer leading objective description tokens, then type, then id tail.
 */
export function questTaskKey(quest: Pick<Quest, 'id' | 'name' | 'type' | 'objectives' | 'description'>): string {
  const obj = (quest.objectives ?? []).find((o) => (o.description ?? '').trim())?.description
    ?? quest.description
    ?? '';
  const gather = obj.match(
    /\b(?:gather|collect|fetch|bring|deliver|hunt|clear|kill|escort|find|speak|talk|deliver)\b[\w\s'-]{0,40}/i
  );
  if (gather) return normalizeIdentityPart(gather[0]!);
  if (quest.type && quest.type !== 'side' && quest.type !== 'main') {
    return normalizeIdentityPart(String(quest.type));
  }
  const idTail = (quest.id ?? '').replace(/^.*?(?:quest-|spine-|card-)/i, '');
  if (idTail && idTail !== quest.id) return normalizeIdentityPart(idTail);
  // Stable fallback: first meaningful words of the name (not whole free-text).
  const words = (quest.name ?? '').trim().split(/\s+/).slice(0, 4).join(' ');
  return normalizeIdentityPart(words || quest.id || 'quest');
}

export function questIdentity(
  quest: Pick<Quest, 'id' | 'name' | 'type' | 'objectives' | 'description' | 'giver'>
): string {
  const giver = normalizeIdentityPart(quest.giver ?? 'unknown-giver') || 'unknown-giver';
  return `${giver}::${questTaskKey(quest)}`;
}

export function questCompleteRepeatKey(identity: string, n: number): string {
  return `quest-complete:${identity}:${n}`;
}

/** Same giver+quest step ladder key (100/50/25/10 across repeats). */
export function questStepRepeatKey(identity: string, n: number): string {
  return `quest-step:${identity}:${n}`;
}

export function fightRepeatKey(placeId: string, foeName: string): string {
  return `fight:${normalizeIdentityPart(placeId) || 'here'}:${normalizeIdentityPart(foeName) || 'foe'}`;
}

/** Count prior completions of this identity from sandbox award keys. */
export function countIdentityCompletions(awardKeys: string[] | undefined, identity: string): number {
  const prefix = `quest-complete:${identity}:`;
  let max = -1;
  for (const k of awardKeys ?? []) {
    if (!k.startsWith(prefix)) continue;
    const n = Number(k.slice(prefix.length));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max + 1;
}

/** Count prior same-giver+quest step pays (ladder index for the next step award). */
export function countIdentitySteps(awardKeys: string[] | undefined, identity: string): number {
  const prefix = `quest-step:${identity}:`;
  let max = -1;
  for (const k of awardKeys ?? []) {
    if (!k.startsWith(prefix)) continue;
    const n = Number(k.slice(prefix.length));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max + 1;
}

/** Count prior same-place/same-foe fight pays. */
export function countFightRepeats(awardKeys: string[] | undefined, key: string): number {
  const prefix = `${key}:`;
  let n = 0;
  for (const k of awardKeys ?? []) {
    if (k === key || k.startsWith(prefix)) n += 1;
  }
  return n;
}

/** Quest level: recommendedLevel → area → player, clamped to player ±3. AI cannot raise it. */
export function engineQuestLevel(
  playerLevel: number,
  quest: Pick<Quest, 'recommendedLevel'>,
  areaLevel?: number | null
): number {
  const raw = quest.recommendedLevel ?? areaLevel ?? playerLevel;
  return clampContentLevel(playerLevel, raw);
}
