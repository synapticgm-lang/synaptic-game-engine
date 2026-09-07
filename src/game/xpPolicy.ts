/**
 * Fast XP loop (02ac Phase 4) — L2 by T25 design curve.
 * Awards are code-owned; STATUS shows the reason. No SNAPSHOT/CRAFT essays.
 */

import type { Character, GameState } from './types';
import { applyCharacterXpGain } from './characterXp';

export const FAST_XP_AWARDS = {
  combatTrash: 25,
  combatElite: 35,
  combatBoss: 50,
  discoverHub: 20,
  landmarkInspect: 5,
  npcMeet: 8,
  questAccept: 15,
  questTick: 20,
  questComplete: 50,
  dailyFirstTick: 20,
} as const;

export const FAST_XP_CURVE = {
  L1_to_L2: 150,
  L2_to_L3: 225,
  L3_to_L4: 340,
  multiplier: 1.5,
} as const;

export type CombatXpTier = 'trash' | 'elite' | 'boss';
export type QuestXpStage = 'accept' | 'tick' | 'complete';

export function combatXpAmount(tier: CombatXpTier): number {
  if (tier === 'boss') return FAST_XP_AWARDS.combatBoss;
  if (tier === 'elite') return FAST_XP_AWARDS.combatElite;
  return FAST_XP_AWARDS.combatTrash;
}

export function questXpAmount(stage: QuestXpStage): number {
  if (stage === 'complete') return FAST_XP_AWARDS.questComplete;
  if (stage === 'accept') return FAST_XP_AWARDS.questAccept;
  return FAST_XP_AWARDS.questTick;
}

/** Cumulative XP required to *reach* `level` from 0 (L2 = 150). */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = FAST_XP_CURVE.L1_to_L2;
  let step = FAST_XP_CURVE.L1_to_L2;
  for (let i = 2; i < level; i++) {
    step = Math.floor(step * FAST_XP_CURVE.multiplier);
    total += step;
  }
  return total;
}

export function awardCombatXp(
  state: GameState,
  encounterTier: CombatXpTier
): { state: GameState; xp: number; reason: string } {
  const xp = combatXpAmount(encounterTier);
  const applied = applyCharacterXpGain(state.character, xp);
  return {
    state: { ...state, character: applied.character },
    xp,
    reason: `combat (${encounterTier})`,
  };
}

export function awardQuestXp(
  state: GameState,
  stage: QuestXpStage
): { state: GameState; xp: number; reason: string } {
  const xp = questXpAmount(stage);
  const applied = applyCharacterXpGain(state.character, xp);
  return {
    state: { ...state, character: applied.character },
    xp,
    reason: `quest (${stage})`,
  };
}

export function checkLevelUp(
  state: GameState
): { leveledUp: boolean; newLevel?: number; state: GameState } {
  const current = state.character?.level ?? 1;
  const xp = state.character?.xp ?? 0;
  const needed = state.character?.xpToNext ?? xpRequiredForLevel(current + 1);
  if (xp < needed) {
    return { leveledUp: false, state };
  }
  // applyCharacterXpGain(0) no-ops — feed the threshold as a gain of 0 by
  // subtracting it from xp first, then awarding `needed`.
  const remainderXp = Math.max(0, xp - needed);
  const applied = applyCharacterXpGain(
    { ...(state.character as Character), xp: remainderXp },
    needed
  );
  if (applied.levelsGained <= 0) {
    return { leveledUp: false, state };
  }
  return {
    leveledUp: true,
    newLevel: applied.character.level,
    state: { ...state, character: applied.character },
  };
}
