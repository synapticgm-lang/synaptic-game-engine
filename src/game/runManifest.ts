/**
 * Wave 0 — immutable run manifest for eval binding and replay provenance.
 */

import type { EngineMode, GameState } from './types';
import { GENERATED_BUILD_TIME, GENERATED_GIT_SHA } from './buildInfo.generated';

/** Readable hand-edited tag — tests that assert this literal keep passing. */
export const BUILD_STAMP = '2026-10-27a';

function resolveGitSha(): string {
  if (GENERATED_GIT_SHA && GENERATED_GIT_SHA !== 'dev') return GENERATED_GIT_SHA.slice(0, 8);
  try {
    // Vitest / fate-autoplay: fall back to git when define was not injected.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('node:child_process') as typeof import('node:child_process');
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim().slice(0, 8);
  } catch {
    return 'dev';
  }
}

/**
 * T10DIR — visible build id: `<tag>+<sha>` (and optional ISO time in reports).
 * BUILD_STAMP stays the bare tag for literal tests; run reports / HUD use BUILD_ID.
 */
export const BUILD_ID = `${BUILD_STAMP}+${resolveGitSha()}`;
export const BUILD_TIME_ISO = GENERATED_BUILD_TIME || '';

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
    buildStamp: BUILD_ID,
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
  if (state.runManifest?.buildStamp === BUILD_ID) return state;
  const base = state.runManifest ?? initRunManifest(state);
  return {
    ...state,
    runManifest: { ...base, buildStamp: BUILD_ID, bibleId: state.campaignBibleId ?? base.bibleId },
  };
}

export function nextEventSeq(state: GameState): { state: GameState; seq: number } {
  const manifest = state.runManifest ?? initRunManifest(state);
  const seq = (manifest.eventSeq ?? 0) + 1;
  return {
    seq,
    state: {
      ...state,
      runManifest: { ...manifest, buildStamp: BUILD_ID, eventSeq: seq },
    },
  };
}
