/**
 * 28c — one shared difficulty table (Easy / Standard / Hard), LOOT-RESEARCH.md §5 [design].
 * The player's existing `gmStrictness` setting picks the row: forgiving = Easy, hardcore = Hard.
 * Loot, XP, social and weapon checks all read this table; nothing else scales by difficulty.
 */
import type { GmStrictness } from './types';

export type Difficulty = 'easy' | 'standard' | 'hard';

export interface DifficultyRow {
  label: string;
  /** Extra loot rolls on a boss. */
  lootExtraBossRolls: number;
  /** Rarity tier step for mini-boss / boss loot (Standard: tier+1, Hard: tier+2). */
  bossRarityTierBonus: number;
  /** Pity threshold multiplier (Easy 0.8: T1 50 → 40). */
  pityThresholdScale: number;
  /** Milestone XP multiplier. */
  xpScale: number;
  /** Easy drops the −2 a hostile NPC puts on social checks. */
  socialRemoveHostilePenalty: boolean;
  /** DC shift on every engine check (social included). Replaces the old strictness ±2. */
  checkDcShift: number;
  /** Added to the player's to-hit (BG3 Explorer style). */
  playerToHitBonus: number;
  /** Added to enemy to-hit where enemy attacks are rolled (BG3 Tactician style). */
  enemyToHitBonus: number;
}

export const DIFFICULTY_TABLE: Readonly<Record<Difficulty, DifficultyRow>> = {
  easy: {
    label: 'Easy',
    lootExtraBossRolls: 0,
    bossRarityTierBonus: 1,
    pityThresholdScale: 0.8,
    xpScale: 1,
    socialRemoveHostilePenalty: true,
    checkDcShift: -2,
    playerToHitBonus: 2,
    enemyToHitBonus: 0,
  },
  standard: {
    label: 'Standard',
    lootExtraBossRolls: 0,
    bossRarityTierBonus: 1,
    pityThresholdScale: 1,
    xpScale: 1,
    socialRemoveHostilePenalty: false,
    checkDcShift: 0,
    playerToHitBonus: 0,
    enemyToHitBonus: 0,
  },
  hard: {
    label: 'Hard',
    lootExtraBossRolls: 1,
    bossRarityTierBonus: 2,
    pityThresholdScale: 1,
    xpScale: 1.25,
    socialRemoveHostilePenalty: false,
    checkDcShift: 2,
    playerToHitBonus: 0,
    enemyToHitBonus: 2,
  },
};

export function difficultyFromStrictness(s: GmStrictness | undefined | null): Difficulty {
  if (s === 'forgiving') return 'easy';
  if (s === 'hardcore') return 'hard';
  return 'standard';
}

export function difficultyRow(s: GmStrictness | undefined | null): DifficultyRow {
  return DIFFICULTY_TABLE[difficultyFromStrictness(s)];
}
