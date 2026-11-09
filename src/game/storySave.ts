/**
 * Optional checkpoints at a story beat. Each point stores a save-file snapshot.
 * Loading one restores that whole game and drops every later turn.
 * PYOA does not use these points.
 */
import type { GameState, StorySavePoint } from './types';
import { saveFileProblem } from './schemas';

export const LOAD_LOSES_LATER = 'Loading this save drops every turn after it.';
const SNAPSHOT_CAP = 48_000;
const POINT_CAP = 3;

function slim(state: GameState): GameState {
  const { storySavePoints: _points, ...rest } = state;
  return {
    ...rest,
    log: (state.log ?? []).slice(-12).map((row) => ({ ...row, content: (row.content ?? '').slice(0, 180) })),
    stateTxLog: (state.stateTxLog ?? []).slice(-12),
  };
}

/** The same shape saveGame stores: character and log, small enough to sit beside an autosave. */
export function storySnapshot(state: GameState): string {
  const full = slim(state);
  const raw = JSON.stringify(full);
  if (!saveFileProblem(full) && raw.length <= SNAPSHOT_CAP) return raw;
  const tighter: GameState = { ...full, log: (full.log ?? []).slice(-4) };
  const again = JSON.stringify(tighter);
  if (!saveFileProblem(tighter) && again.length <= SNAPSHOT_CAP) return again;
  return '';
}

export function markStorySavePoint(state: GameState, beat: string): GameState {
  if (state.engineMode === 'pyoa') return state;
  const snapshot = storySnapshot(state);
  if (!snapshot) return state;
  const point: StorySavePoint = {
    id: `save-${state.turn ?? 0}-${(beat || 'beat').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
    beat: beat.slice(0, 80),
    turn: state.turn ?? 0,
    snapshot,
  };
  return { ...state, storySavePoints: [...(state.storySavePoints ?? []), point].slice(-POINT_CAP) };
}

export function loadStorySavePoint(state: GameState, id: string): { state: GameState; warning: string } {
  const point = (state.storySavePoints ?? []).find((p) => p.id === id);
  if (!point || state.engineMode === 'pyoa') return { state, warning: '' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(point.snapshot);
  } catch {
    return { state, warning: '' };
  }
  if (saveFileProblem(parsed)) return { state, warning: '' };
  return { warning: LOAD_LOSES_LATER, state: parsed as GameState };
}
