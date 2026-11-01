/**
 * Authored PYOA play runtime: init, choice advance, dice checks, save/resume,
 * ending and death pages (restart / back-to-picker actions).
 */

import { getPyoaBookCatalogEntry } from './pyoaBookCatalog';
import { loadPyoaBook } from './pyoaBookLoader';
import {
  applyLuckPush,
  clampStamina,
  createDiceSheet,
  formatPyoaDiceRoll,
  performPyoaCheck,
} from './pyoaDice2d6';
import type {
  CompiledPyoaBook,
  PyoaBookExit,
  PyoaBookId,
  PyoaBookNode,
  PyoaBookPlayState,
  PyoaDiceSheet,
} from './pyoaBookTypes';
import { playerFacingExits } from './pyoaBookValidate';
import { resolvePyoaPage } from './pyoaCond';

export const PYOA_RESTART_CHIP = 'Start this book again';
export const PYOA_PICKER_CHIP = 'Back to book picker';
export const PYOA_CONTINUE_CHECK_CHIP = 'Continue';
export const PYOA_LUCK_PUSH_CHIP = 'Spend 1 luck';

export type PyoaTerminalKind = 'live' | 'ending' | 'death';

export interface PyoaPlayView {
  book: CompiledPyoaBook;
  state: PyoaBookPlayState;
  node: PyoaBookNode;
  pageText: string;
  choices: Array<{ id: string; label: string }>;
  terminal: PyoaTerminalKind;
  /** Plain dice line for the player when a check just resolved or is pending. */
  diceLine?: string;
}

function newSeed(explicit?: number): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit >>> 0;
  return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
}

function mergeFlags(
  flags: Record<string, string | boolean>,
  setFlags?: Record<string, string | boolean>
): Record<string, string | boolean> {
  if (!setFlags) return flags;
  return { ...flags, ...setFlags };
}

function arriveEffects(
  book: CompiledPyoaBook,
  state: PyoaBookPlayState,
  node: PyoaBookNode
): PyoaBookPlayState {
  let next = { ...state };
  if (book.type !== 'dice' || !next.dice) return next;

  const dice: PyoaDiceSheet = { ...next.dice, keepsakes: [...next.dice.keepsakes] };
  const seen = { ...(next.bottleneckSeen ?? {}) };

  // Reward: +1 STAMINA + grant
  if (node.kind === 'reward' || node.grant) {
    dice.stamina = clampStamina(dice.stamina + 1, dice.staminaMax);
    if (node.grant && !dice.keepsakes.includes(node.grant)) {
      dice.keepsakes.push(node.grant);
    }
  }

  // First bottleneck: +1 LUCK; region-gate also restores STAMINA
  if (node.kind === 'bottleneck' && !seen[node.id]) {
    seen[node.id] = true;
    dice.luck = Math.min(dice.luckMax, dice.luck + 1);
    if (node.role === 'region-gate') {
      dice.stamina = dice.staminaMax;
    }
  }

  next = { ...next, dice, bottleneckSeen: seen };
  return next;
}

function stampTerminal(state: PyoaBookPlayState, node: PyoaBookNode): PyoaBookPlayState {
  if (node.deathId) {
    return { ...state, deathId: node.deathId || node.id, endingId: null, currentNodeId: node.id };
  }
  if (node.endingId || (node.kind === 'ending' && !node.exits.length)) {
    return {
      ...state,
      endingId: node.endingId || node.id,
      deathId: null,
      currentNodeId: node.id,
    };
  }
  return { ...state, currentNodeId: node.id };
}

export function initPyoaBookPlay(
  bookId: string,
  opts?: { seed?: number; statOrder?: string[]; book?: CompiledPyoaBook }
): PyoaBookPlayState {
  const entry = getPyoaBookCatalogEntry(bookId);
  if (!entry) throw new Error(`Unknown PYOA book: ${bookId}`);
  const book = opts?.book ?? loadPyoaBook(entry.id);
  const seed = newSeed(opts?.seed);
  const start = book.startId;
  let state: PyoaBookPlayState = {
    bookId: entry.id,
    type: entry.type,
    currentNodeId: start,
    visited: [start],
    flags: {},
    endingId: null,
    deathId: null,
    seed,
    visitCount: { [start]: 1 },
    pendingRoll: null,
    bottleneckSeen: {},
  };
  if (book.type === 'dice' && book.diceRules) {
    state.dice = createDiceSheet(book.diceRules, { statOrder: opts?.statOrder, seed });
  }
  const node = book.nodes.get(start);
  if (node) state = arriveEffects(book, stampTerminal(state, node), node);
  return state;
}

/** Serialize for save slot / GameState. */
export function serializePyoaBookPlay(state: PyoaBookPlayState): PyoaBookPlayState {
  return JSON.parse(JSON.stringify(state)) as PyoaBookPlayState;
}

/** Resume from a saved blob; re-validates book still loads. */
export function resumePyoaBookPlay(
  saved: PyoaBookPlayState,
  opts?: { book?: CompiledPyoaBook }
): PyoaBookPlayState {
  if (!saved?.bookId || !saved.currentNodeId) {
    throw new Error('Invalid PYOA save: missing bookId or currentNodeId');
  }
  const book = opts?.book ?? loadPyoaBook(saved.bookId);
  if (!book.nodes.has(saved.currentNodeId)) {
    throw new Error(
      `PYOA save points at missing section ${saved.currentNodeId} in ${saved.bookId}`
    );
  }
  return serializePyoaBookPlay({
    ...saved,
    bookId: book.id,
    type: book.type,
    visitCount: { ...(saved.visitCount ?? {}) },
    flags: { ...(saved.flags ?? {}) },
    visited: [...(saved.visited ?? [])],
    bottleneckSeen: { ...(saved.bottleneckSeen ?? {}) },
    dice: saved.dice
      ? {
          ...saved.dice,
          stats: { ...saved.dice.stats },
          keepsakes: [...(saved.dice.keepsakes ?? [])],
        }
      : saved.type === 'dice' && book.diceRules
        ? createDiceSheet(book.diceRules)
        : undefined,
  });
}

export function restartPyoaBookPlay(state: PyoaBookPlayState): PyoaBookPlayState {
  return initPyoaBookPlay(state.bookId, { seed: newSeed() });
}

function bumpVisit(state: PyoaBookPlayState, nodeId: string): PyoaBookPlayState {
  const visitCount = { ...state.visitCount, [nodeId]: (state.visitCount[nodeId] ?? 0) + 1 };
  const visited = state.visited.includes(nodeId) ? state.visited : [...state.visited, nodeId];
  return { ...state, visitCount, visited };
}

function enterNode(
  book: CompiledPyoaBook,
  state: PyoaBookPlayState,
  nodeId: string,
  setFlags?: Record<string, string | boolean>
): PyoaBookPlayState {
  const node = book.nodes.get(nodeId);
  if (!node) throw new Error(`PYOA missing section ${nodeId}`);
  let next = bumpVisit(
    { ...state, flags: mergeFlags(state.flags, setFlags), pendingRoll: null },
    nodeId
  );
  next = stampTerminal(next, node);
  next = arriveEffects(book, next, node);

  // Auto-roll when entering a check section
  if (node.check && book.type === 'dice' && next.dice) {
    const visit = next.visitCount[nodeId] ?? 1;
    const roll = performPyoaCheck({
      seed: next.seed,
      sectionId: nodeId,
      visit,
      stat: node.check.stat,
      target: node.check.target,
      label: node.check.label,
      sheet: next.dice,
    });
    next = { ...next, pendingRoll: roll };
  }
  return next;
}

function resolveCheckToExit(
  book: CompiledPyoaBook,
  state: PyoaBookPlayState
): PyoaBookPlayState {
  const roll = state.pendingRoll;
  if (!roll || !state.dice) return state;
  const node = book.nodes.get(state.currentNodeId);
  if (!node?.check) return { ...state, pendingRoll: null };

  const exit = node.exits.find((e) => e.result === roll.outcome);
  if (!exit) throw new Error(`Check ${node.id} missing ${roll.outcome} exit`);

  let dice = { ...state.dice, keepsakes: [...state.dice.keepsakes] };
  // Mixed with cost: −1 STAMINA
  if (roll.outcome === 'mixed' && exit.cost) {
    dice.stamina = clampStamina(dice.stamina - 1, dice.staminaMax);
  }

  let next: PyoaBookPlayState = { ...state, dice, pendingRoll: null };
  next = enterNode(book, next, exit.to, exit.setFlags);

  // Leaving recovery via cost exit: −2 STAMINA (applied when taking that exit — handled in chooseExit)
  return next;
}

function chooseExit(
  book: CompiledPyoaBook,
  state: PyoaBookPlayState,
  exit: PyoaBookExit
): PyoaBookPlayState {
  let dice = state.dice
    ? { ...state.dice, keepsakes: [...state.dice.keepsakes] }
    : undefined;
  const from = book.nodes.get(state.currentNodeId);
  // Recovery exit cost: −2 STAMINA
  if (dice && from?.kind === 'recovery' && exit.cost) {
    dice.stamina = clampStamina(dice.stamina - 2, dice.staminaMax);
  }
  const base = dice ? { ...state, dice } : state;
  return enterNode(book, base, exit.to, exit.setFlags);
}

/**
 * Apply a player choice label (or special chip) to play state.
 */
export function advancePyoaBookPlay(
  state: PyoaBookPlayState,
  choiceLabel: string,
  opts?: { book?: CompiledPyoaBook }
): PyoaBookPlayState {
  const book = opts?.book ?? loadPyoaBook(state.bookId);
  const label = (choiceLabel ?? '').trim();

  if (label === PYOA_RESTART_CHIP || /^start this book again$/i.test(label)) {
    return restartPyoaBookPlay(state);
  }
  // Picker return is a UI concern; keep state but clear terminal markers for callers that swap UI.
  if (label === PYOA_PICKER_CHIP || /^back to book picker$/i.test(label)) {
    return state;
  }

  // Pending check: luck push or continue
  if (state.pendingRoll && state.dice) {
    if (label === PYOA_LUCK_PUSH_CHIP || /^spend 1 luck$/i.test(label)) {
      const pushed = applyLuckPush(state.pendingRoll, state.dice);
      if (!pushed) return state;
      return { ...state, pendingRoll: pushed.roll, dice: pushed.sheet };
    }
    if (
      label === PYOA_CONTINUE_CHECK_CHIP ||
      /^continue$/i.test(label) ||
      label === state.pendingRoll.label
    ) {
      return resolveCheckToExit(book, state);
    }
  }

  if (state.endingId || state.deathId) {
    return state;
  }

  const node = book.nodes.get(state.currentNodeId);
  if (!node) return state;

  const exits = playerFacingExits(node, state.flags);
  const hit =
    exits.find((e) => e.label === label) ||
    exits.find((e) => e.id === label) ||
    exits.find((e) => e.label.toLowerCase() === label.toLowerCase());
  if (!hit) return state;
  return chooseExit(book, state, hit);
}

export function pyoaTerminalKind(state: PyoaBookPlayState): PyoaTerminalKind {
  if (state.deathId) return 'death';
  if (state.endingId) return 'ending';
  return 'live';
}

export function buildPyoaPlayView(
  state: PyoaBookPlayState,
  opts?: { book?: CompiledPyoaBook }
): PyoaPlayView {
  const book = opts?.book ?? loadPyoaBook(state.bookId);
  const node = book.nodes.get(state.currentNodeId);
  if (!node) {
    throw new Error(`PYOA play at missing node ${state.currentNodeId}`);
  }
  const pageText = resolvePyoaPage(node.page, node.variants, state.flags) || node.page || '';
  const terminal = pyoaTerminalKind(state);

  let choices: Array<{ id: string; label: string }> = [];
  let diceLine: string | undefined;

  if (terminal === 'ending' || terminal === 'death') {
    choices = [
      { id: 'restart', label: PYOA_RESTART_CHIP },
      { id: 'picker', label: PYOA_PICKER_CHIP },
    ];
  } else if (state.pendingRoll) {
    diceLine = formatPyoaDiceRoll(state.pendingRoll);
    choices = [{ id: 'continue-check', label: PYOA_CONTINUE_CHECK_CHIP }];
    if (!state.pendingRoll.usedLuck && (state.dice?.luck ?? 0) > 0 && state.pendingRoll.outcome !== 'full') {
      choices.unshift({ id: 'luck', label: PYOA_LUCK_PUSH_CHIP });
    }
  } else {
    choices = playerFacingExits(node, state.flags).map((e) => ({ id: e.id, label: e.label }));
  }

  return { book, state, node, pageText, choices, terminal, diceLine };
}

/** LocalStorage key for per-book reading progress. */
export function pyoaBookSaveKey(bookId: PyoaBookId | string): string {
  return `synapticgm:pyoa-book:${bookId}`;
}

export function savePyoaBookProgress(
  state: PyoaBookPlayState,
  storage: Pick<Storage, 'setItem'> = globalThis.localStorage
): void {
  if (!storage?.setItem) return;
  storage.setItem(pyoaBookSaveKey(state.bookId), JSON.stringify(serializePyoaBookPlay(state)));
}

export function loadPyoaBookProgress(
  bookId: string,
  storage: Pick<Storage, 'getItem'> = globalThis.localStorage
): PyoaBookPlayState | null {
  if (!storage?.getItem) return null;
  const raw = storage.getItem(pyoaBookSaveKey(bookId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PyoaBookPlayState;
    return resumePyoaBookPlay(parsed);
  } catch {
    return null;
  }
}

export function clearPyoaBookProgress(
  bookId: string,
  storage: Pick<Storage, 'removeItem'> = globalThis.localStorage
): void {
  storage?.removeItem?.(pyoaBookSaveKey(bookId));
}
