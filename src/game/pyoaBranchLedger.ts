/**
 * B025 — PYOA branch ledger (Millstone Charter paths + ally/betray/solo).
 */

import type { GameState } from './types';

export type PyoaBranchId = 'millstone-charter' | 'solo-road' | 'ally-path' | 'none';

export interface PyoaBranchLedger {
  activeBranch?: PyoaBranchId;
  committedPaths?: string[];
  charterUses?: number;
  branchClosed?: boolean;
}

export function initPyoaBranchLedger(): PyoaBranchLedger {
  return { activeBranch: 'none', committedPaths: [], charterUses: 0, branchClosed: false };
}

export function isPyoaBranchExhausted(state: GameState, branch: PyoaBranchId): boolean {
  const ledger = state.pyoaBranchLedger;
  if (branch === 'millstone-charter') return (ledger?.charterUses ?? 0) >= 3;
  if (branch === 'ally-path' || branch === 'solo-road') {
    return (ledger?.committedPaths ?? []).filter((p) => p.startsWith(branch)).length >= 2;
  }
  return false;
}

/** Commit branch state from player input (B025). */
export function recordPyoaBranchChoice(state: GameState, playerInput: string): GameState {
  if (state.engineMode !== 'pyoa') return state;
  const lower = playerInput.toLowerCase();
  let ledger = state.pyoaBranchLedger ?? initPyoaBranchLedger();

  if (/\b(millstone|charter)\b/.test(lower)) {
    const uses = (ledger.charterUses ?? 0) + 1;
    const path = uses >= 3 ? 'millstone-charter-exhausted' : `millstone-charter-use-${uses}`;
    ledger = {
      ...ledger,
      activeBranch: 'millstone-charter',
      charterUses: uses,
      branchClosed: uses >= 3,
      committedPaths: [...(ledger.committedPaths ?? []), path].slice(-24),
    };
  } else if (/\bbetray\b/.test(lower)) {
    ledger = {
      ...ledger,
      activeBranch: 'solo-road',
      committedPaths: [...(ledger.committedPaths ?? []), 'solo-road:betray'].slice(-24),
    };
  } else if (/\bally\b/.test(lower)) {
    ledger = {
      ...ledger,
      activeBranch: 'ally-path',
      committedPaths: [...(ledger.committedPaths ?? []), 'ally-path:commit'].slice(-24),
    };
  } else if (/\bwalk away\b/.test(lower) && ledger.activeBranch === 'millstone-charter') {
    ledger = {
      ...ledger,
      branchClosed: true,
      committedPaths: [...(ledger.committedPaths ?? []), 'millstone-charter:closed'].slice(-24),
    };
  }

  return { ...state, pyoaBranchLedger: ledger };
}

export function formatPyoaBranchMandate(state: GameState): string | null {
  const ledger = state.pyoaBranchLedger;
  if (!ledger || state.engineMode !== 'pyoa') return null;
  if (ledger.branchClosed) {
    return 'PYOA BRANCH CLOSED: Millstone Charter basin exhausted — advance crisis fork or ending beat.';
  }
  if ((ledger.charterUses ?? 0) >= 2) {
    return 'PYOA BRANCH PRESSURE: Charter path nearly exhausted — force ally/betray/solo lock or crisis.';
  }
  return null;
}
