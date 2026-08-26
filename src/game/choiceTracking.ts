/**
 * Track recent offered choices for deduplication (sliding 10-turn window).
 */

import type { GameState } from './types';

export function trackRecentChoices(
  state: GameState,
  newChoices: string[]
): Array<{ turn: number; choices: string[] }> {
  const existing = state.recentChoices ?? [];
  const updated = [...existing, { turn: state.turn, choices: newChoices }];
  // Keep last 10 turns only
  return updated.slice(-10);
}
