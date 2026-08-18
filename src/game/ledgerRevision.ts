/**
 * Ledger revision + speculative takes.
 * A commit may only apply if it was planned against the current ledgerRevision.
 * Retry drafts that are not chosen are journaled — they never mutate world truth.
 */

import type { GameState, SpeculativeTake } from './types';

const MAX_SPECULATIVE = 5;

export function currentLedgerRevision(state: GameState | null | undefined): number {
  return Math.max(0, state?.ledgerRevision ?? 0);
}

/** Next revision after a successful accept. */
export function nextLedgerRevision(state: GameState): number {
  return currentLedgerRevision(state) + 1;
}

export function withBumpedLedgerRevision(state: GameState): GameState {
  return {
    ...state,
    ledgerRevision: nextLedgerRevision(state),
  };
}

export function appendSpeculativeTake(
  state: GameState,
  take: Omit<SpeculativeTake, 'id' | 'createdAt'>
): GameState {
  const entry: SpeculativeTake = {
    ...take,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const prev = state.speculativeTakes ?? [];
  return {
    ...state,
    speculativeTakes: [...prev, entry].slice(-MAX_SPECULATIVE),
  };
}

export type RevisionAcceptResult =
  | { ok: true; committed: GameState }
  | { ok: false; reason: string };

/**
 * Accept a proposed state only if it matches the revision it was planned from.
 * On success, bumps ledgerRevision and clears pendingTurn / trims speculative journal.
 */
export function acceptProposedState(
  previous: GameState,
  proposed: GameState,
  expectedRevision?: number
): RevisionAcceptResult {
  const head = currentLedgerRevision(previous);
  const expected = expectedRevision ?? previous.pendingTurn?.expectedRevision ?? head;
  if (expected !== head) {
    return {
      ok: false,
      reason: `Stale proposal (planned at revision ${expected}, ledger is ${head}). Discard and retry.`,
    };
  }
  const committed: GameState = {
    ...proposed,
    pendingTurn: null,
    ledgerRevision: head + 1,
    speculativeTakes: (proposed.speculativeTakes ?? previous.speculativeTakes ?? []).slice(-MAX_SPECULATIVE),
  };
  return { ok: true, committed };
}
