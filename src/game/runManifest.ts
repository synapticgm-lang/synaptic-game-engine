/**
 * Wave 0 — immutable run manifest for eval binding and replay provenance.
 */

import type { EngineMode, GameState } from './types';

export const BUILD_STAMP = '2026-08-29g';

export interface RunManifest {
  buildStamp: string;
  seed: string;
  saveId: string;
  engineMode: EngineMode;
  bibleId?: string | null;
  createdAt: number;
  /** Monotonic event counter for idempotent beat commits. */
  eventSeq: number;
}

export function initRunManifest(state: GameState): RunManifest {
  return {
    buildStamp: BUILD_STAMP,
    seed: state.seed ?? '0',
    saveId: state.saveId,
    engineMode: state.engineMode,
    bibleId: state.campaignBibleId ?? null,
    createdAt: Date.now(),
    eventSeq: 0,
  };
}

/** Ensure manifest exists on save / autoplay metadata. */
export function ensureRunManifest(state: GameState): GameState {
  if (state.runManifest?.buildStamp === BUILD_STAMP) return state;
  const base = state.runManifest ?? initRunManifest(state);
  return {
    ...state,
    runManifest: { ...base, buildStamp: BUILD_STAMP, bibleId: state.campaignBibleId ?? base.bibleId },
  };
}

export function nextEventSeq(state: GameState): { state: GameState; seq: number } {
  const manifest = state.runManifest ?? initRunManifest(state);
  const seq = (manifest.eventSeq ?? 0) + 1;
  return {
    seq,
    state: {
      ...state,
      runManifest: { ...manifest, buildStamp: BUILD_STAMP, eventSeq: seq },
    },
  };
}
