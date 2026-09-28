/**
 * 28g — shared recovery and early-fight rules (every mode).
 * HP comes back on rest at a safe hub and partly after a won fight; a defeat never leaves the
 * character stuck at 1 HP. Early enemies (player level 1–3) hit softer, scaled by the difficulty table.
 */
import type { EngineMode, GameState } from './types';
import { difficultyFromStrictness } from './difficultyRules';
import { hubsForBibleId, matchHub } from './outdoorHubs';

export interface RecoveryRow {
  /** Share of max HP restored by rest / wait at a safe hub. */
  restFraction: number;
  /** Share of max HP recovered after a won fight. */
  victoryFraction: number;
  /** A defeat leaves at least this share of max HP (you come to). */
  defeatFraction: number;
}

export const RECOVERY_TABLE: Readonly<Record<EngineMode, RecoveryRow>> = {
  litrpg: { restFraction: 0.5, victoryFraction: 0.25, defeatFraction: 0.25 },
  dnd: { restFraction: 0.5, victoryFraction: 0.1, defeatFraction: 0.25 },
  rpg: { restFraction: 0.5, victoryFraction: 0.2, defeatFraction: 0.25 },
  pyoa: { restFraction: 0.5, victoryFraction: 0.25, defeatFraction: 0.25 },
};

export function recoveryRow(mode: EngineMode | undefined): RecoveryRow {
  return RECOVERY_TABLE[mode ?? 'litrpg'] ?? RECOVERY_TABLE.litrpg;
}

const REST_RE = /\b(rest|wait|sleep|catch (?:your|my) breath|take a breather|recover|ready yourself)\b/i;

/** Rest / wait at a named hub with no live or pending fight and no open dungeon. */
export function isSafeHubRest(state: GameState, input: string): boolean {
  if (!REST_RE.test(input ?? '')) return false;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter || state.activeDungeon) return false;
  return !!matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
}

/** Heal on a safe-hub rest. Receipt for STATUS, or null when nothing changed. */
export function applyRestHeal(state: GameState, input: string): { state: GameState; receipt: string | null } {
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  if (!isSafeHubRest(state, input) || ch.hp >= max) return { state, receipt: null };
  const gain = Math.max(1, Math.ceil(max * recoveryRow(state.engineMode).restFraction));
  const hp = Math.min(max, ch.hp + gain);
  return { state: { ...state, character: { ...ch, hp } }, receipt: `Rest: HP ${ch.hp} → ${hp}` };
}

/** HP after an engine-resolved fight: some recovery on a win, a floor on a defeat. */
export function hpAfterFight(state: GameState, victory: boolean, finalHp: number): number {
  const max = state.character.maxHp || state.character.hp;
  const row = recoveryRow(state.engineMode);
  const base = Math.max(1, finalHp);
  if (victory) return Math.min(max, base + Math.ceil(max * row.victoryFraction));
  return Math.min(max, Math.max(base, Math.ceil(max * row.defeatFraction)));
}

/** Early fights: for player level 1–3 an enemy's attack is capped at 1 + level (Easy −1, Hard +1). */
export function earlyEnemyAttack(state: GameState, baseAttack: number): number {
  const level = state.character.level ?? 1;
  if (level > 3) return baseAttack;
  const d = difficultyFromStrictness(state.gmStrictness);
  const shift = d === 'easy' ? -1 : d === 'hard' ? 1 : 0;
  return Math.max(1, Math.min(baseAttack, 1 + level + shift));
}
