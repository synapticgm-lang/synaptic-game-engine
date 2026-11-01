/**
 * Bridge: authored offline PYOA books (six) ↔ GameState.
 * Umbra keeps pyoaSpine for existing tests; all six also carry pyoaBookPlay.
 */

import type { GameState } from './types';
import { isAuthoredPyoaBookId, getPyoaBookCatalogEntry } from './pyoaBookCatalog';
import { loadPyoaBook } from './pyoaBookLoader';
import {
  advancePyoaBookPlay,
  buildPyoaPlayView,
  initPyoaBookPlay,
  PYOA_PICKER_CHIP,
  type PyoaPlayView,
} from './pyoaBookPlay';
import { initUmbraSpine, isAuthoredPyoaBook } from './pyoaSpine';
import { setPlayPhase } from './playPhase';
import type { PyoaBookPlayState } from './pyoaBookTypes';

export { isAuthoredPyoaBook };

export function initAuthoredPyoaGameState(
  state: GameState,
  bibleId: string,
  opts?: { seed?: number }
): GameState {
  const entry = getPyoaBookCatalogEntry(bibleId);
  if (!entry) return state;
  const book = loadPyoaBook(entry.id);
  const play = initPyoaBookPlay(entry.id, {
    seed: opts?.seed,
    book,
  });
  const view = buildPyoaPlayView(play, { book });
  return {
    ...state,
    engineMode: 'pyoa',
    campaignBibleId: entry.bibleId,
    pyoaBookPlay: play,
    // Umbra: keep spine in sync for legacy chip/path tests
    pyoaSpine:
      entry.id === 'umbra-protocol'
        ? initUmbraSpine()
        : state.pyoaSpine,
    openingEstablishment: {
      pending: [],
      answers: { ...(state.openingEstablishment?.answers ?? {}) },
      complete: true,
      sceneWritten: true,
      pickedHook: state.openingEstablishment?.pickedHook,
      pickedHookFallback: state.openingEstablishment?.pickedHookFallback,
      page1: view.pageText,
    },
  };
}

export function authoredPyoaPageText(state: GameState): string | null {
  if (!isAuthoredPyoaBookId(state.campaignBibleId)) return null;
  if (state.pyoaBookPlay) {
    try {
      return buildPyoaPlayView(state.pyoaBookPlay).pageText || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function authoredPyoaChoiceLabels(state: GameState): string[] {
  if (!state.pyoaBookPlay) return [];
  try {
    return buildPyoaPlayView(state.pyoaBookPlay).choices.map((c) => c.label);
  } catch {
    return [];
  }
}

export function authoredPyoaDiceLine(state: GameState): string | undefined {
  if (!state.pyoaBookPlay) return undefined;
  try {
    return buildPyoaPlayView(state.pyoaBookPlay).diceLine;
  } catch {
    return undefined;
  }
}

export function advanceAuthoredPyoa(
  state: GameState,
  playerInput: string
): { state: GameState; view: PyoaPlayView | null } {
  if (!state.pyoaBookPlay || !isAuthoredPyoaBookId(state.campaignBibleId)) {
    return { state, view: null };
  }
  if (playerInput.trim() === PYOA_PICKER_CHIP || /^back to book picker$/i.test(playerInput)) {
    // UI layer should leave play / open New Game; mark ended so chrome unlocks.
    return {
      state: setPlayPhase(state, 'ended'),
      view: buildPyoaPlayView(state.pyoaBookPlay),
    };
  }
  const play = advancePyoaBookPlay(state.pyoaBookPlay, playerInput);
  const view = buildPyoaPlayView(play);
  let next: GameState = { ...state, pyoaBookPlay: play };
  if (view.terminal === 'ending' || view.terminal === 'death') {
    // Death and ending pages stay readable with restart/picker chips; Accept-style close via picker.
    next = { ...next, playPhase: next.playPhase ?? 'live' };
  }
  // Mirror Umbra spine node when both exist
  if (next.pyoaSpine && play.bookId === 'umbra-protocol') {
    next = {
      ...next,
      pyoaSpine: {
        ...next.pyoaSpine,
        currentNodeId: play.currentNodeId,
        visited: play.visited.slice(),
        flags: { ...play.flags },
        endingId: play.endingId ?? null,
      },
    };
  }
  return { state: next, view };
}

export function ensurePyoaBookPlay(state: GameState): GameState {
  if (!isAuthoredPyoaBookId(state.campaignBibleId)) return state;
  if (state.pyoaBookPlay?.currentNodeId) return state;
  return initAuthoredPyoaGameState(state, state.campaignBibleId!);
}

export type { PyoaBookPlayState, PyoaPlayView };
