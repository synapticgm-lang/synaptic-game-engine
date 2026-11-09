/**
 * Optional checkpoints at a story beat. Loading one drops every later turn.
 * PYOA does not use these points.
 */
import type { GameState, StorySavePoint } from './types';

export const LOAD_LOSES_LATER = 'Loading this save drops every turn after it.';

export function markStorySavePoint(state: GameState, beat: string): GameState {
  if (state.engineMode === 'pyoa') return state;
  const point: StorySavePoint = {
    id: `save-${state.turn ?? 0}-${(beat || 'beat').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
    beat: beat.slice(0, 80),
    turn: state.turn ?? 0,
    location: state.currentLocation ?? '',
    logTurn: state.turn ?? 0,
  };
  return { ...state, storySavePoints: [...(state.storySavePoints ?? []), point].slice(-12) };
}

export function loadStorySavePoint(state: GameState, id: string): { state: GameState; warning: string } {
  const point = (state.storySavePoints ?? []).find((p) => p.id === id);
  if (!point || state.engineMode === 'pyoa') return { state, warning: '' };
  const log = (state.log ?? []).filter((row) => (row.turn ?? 0) <= point.logTurn);
  return {
    warning: LOAD_LOSES_LATER,
    state: {
      ...state,
      turn: point.turn,
      currentLocation: point.location || state.currentLocation,
      log,
    },
  };
}
