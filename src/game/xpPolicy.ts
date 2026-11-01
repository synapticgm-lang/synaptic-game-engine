/**
 * Fast XP loop aliases — amounts and curve come from xpRules / xpPace (one owner).
 * Awards are code-owned; STATUS shows the reason. No SNAPSHOT/CRAFT essays.
 */

import type { Character, EngineMode, GameState } from './types';
import { applyCharacterXpGain } from './characterXp';
import { LITRPG_MILESTONE_XP, milestoneXp } from './xpRules';
import { levelBar } from './rules/xpPace';

/** Old key names over the one LitRPG L1 table (xpRules). Drip keys pay 0. */
export const FAST_XP_AWARDS = {
  combatTrash: LITRPG_MILESTONE_XP.encounter,
  combatElite: LITRPG_MILESTONE_XP.miniBoss,
  combatBoss: LITRPG_MILESTONE_XP.boss,
  discoverHub: LITRPG_MILESTONE_XP.significantPlace,
  landmarkInspect: 0,
  npcMeet: LITRPG_MILESTONE_XP.significantPerson,
  questAccept: 0,
  questTick: LITRPG_MILESTONE_XP.questStep,
  questComplete: LITRPG_MILESTONE_XP.questComplete,
  dailyFirstTick: 0,
} as const;

/** Alias of levelBar growth — L1→L2 = 150, then ×1.25 (XP-D1). */
export const FAST_XP_CURVE = {
  L1_to_L2: 150,
  get L2_to_L3() {
    return levelBar('litrpg', 2);
  },
  get L3_to_L4() {
    return levelBar('litrpg', 3);
  },
  multiplier: 1.25,
} as const;

export type CombatXpTier = 'trash' | 'elite' | 'boss';
export type QuestXpStage = 'accept' | 'tick' | 'complete';

export function combatXpAmount(tier: CombatXpTier, mode: EngineMode = 'litrpg', level = 1): number {
  const kind = tier === 'boss' ? 'boss' : tier === 'elite' ? 'miniBoss' : 'encounter';
  return milestoneXp(mode, kind, { level, playerLevel: level }).amount;
}

export function questXpAmount(stage: QuestXpStage, mode: EngineMode = 'litrpg', level = 1): number {
  if (stage === 'accept') return 0;
  const kind = stage === 'complete' ? 'questComplete' : 'questStep';
  return milestoneXp(mode, kind, { level, playerLevel: level }).amount;
}

/** Cumulative XP required to *reach* `level` from 0 (L2 = 150). */
export function xpRequiredForLevel(level: number, mode: EngineMode = 'litrpg'): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) total += levelBar(mode, i);
  return total;
}

export function awardCombatXp(
  state: GameState,
  encounterTier: CombatXpTier
): { state: GameState; xp: number; reason: string } {
  const level = state.character?.level ?? 1;
  const xp = combatXpAmount(encounterTier, state.engineMode, level);
  const applied = applyCharacterXpGain(state.character, xp, state.engineMode);
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
  const level = state.character?.level ?? 1;
  const xp = questXpAmount(stage, state.engineMode, level);
  const applied = applyCharacterXpGain(state.character, xp, state.engineMode);
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
  const needed = state.character?.xpToNext ?? levelBar(state.engineMode, current);
  if (xp < needed) {
    return { leveledUp: false, state };
  }
  const remainderXp = Math.max(0, xp - needed);
  const applied = applyCharacterXpGain(
    { ...(state.character as Character), xp: remainderXp },
    needed,
    state.engineMode
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
