import type { GameState, PlayPhase } from './types';
import { failRunScopedQuests } from './questGuards';

/** Whether player input should be blocked. */
export function isPlayInputLocked(state: GameState): boolean {
  return state.playPhase === 'ended' || state.playPhase === 'down';
}

/** Resolve play phase after HP settles on commit. */
export function applyPlayPhaseAfterHp(
  state: GameState,
  hp: number,
  turn: number,
  opts?: { deathTurn?: boolean }
): GameState {
  if (hp > 0) {
    if (state.playPhase === 'down') {
      return { ...state, playPhase: 'live' as PlayPhase };
    }
    return state;
  }

  // Tabletop at 0 HP makes death saves; the run ends on the third failure (or a killing blow).
  if (state.engineMode === 'dnd' && state.deathSaves && !state.deathSaves.dead) {
    return state;
  }

  if (state.engineMode === 'litrpg' && state.playPhase !== 'ended' && !opts?.deathTurn) {
    return { ...state, playPhase: 'down' as PlayPhase };
  }

  let next: GameState = { ...state, playPhase: 'ended' as PlayPhase };
  next = failRunScopedQuests(next, turn);
  return next;
}

export function deathQuestReceipt(state: GameState): string | null {
  const failed = (state.quests ?? []).filter((q) => q.status === 'failed' && q.runScoped);
  if (!failed.length) return null;
  return `Active quests closed (${failed.length}): ${failed.map((q) => q.name).join(', ')}`;
}
