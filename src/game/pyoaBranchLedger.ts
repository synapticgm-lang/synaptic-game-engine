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
  /** 29a mutually exclusive lock id */
  branchLocked?: string | false;
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
      // 29a — charter use commits branch lock (idempotent)
      branchLocked: ledger.branchLocked || 'millstone-commit',
      branchClosed: true,
      committedPaths: [...(ledger.committedPaths ?? []), path, 'locked:millstone-commit'].slice(-24),
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

export type PyoaLockedBranchId =
  | 'help-overseer'
  | 'burn-charter'
  | 'sell-to-pell'
  | 'millstone-commit'
  | 'ally-path'
  | 'solo-road';

/** 29a — crisis activity must lock one mutually exclusive branch. */
export function lockPyoaBranchOnCrisis(state: GameState): GameState {
  if (state.engineMode !== 'pyoa') return state;
  let ledger = state.pyoaBranchLedger ?? initPyoaBranchLedger();
  if (ledger.branchLocked) return state;

  const crisisBeats = (state.arcDirector?.committedBeatIds ?? []).filter((id) =>
    /crisis|branch/i.test(id)
  );
  const crisisCount = crisisBeats.length + (ledger.charterUses ?? 0);
  if (crisisCount < 1 && state.turn < 12) return state;

  // Prefer charter commitment; else force help-overseer by T12 crisis pressure
  let locked: PyoaLockedBranchId = 'help-overseer';
  if ((ledger.charterUses ?? 0) >= 1 || ledger.activeBranch === 'millstone-charter') {
    locked = 'millstone-commit';
  } else if (ledger.activeBranch === 'ally-path') {
    locked = 'ally-path';
  } else if (ledger.activeBranch === 'solo-road') {
    locked = 'solo-road';
  } else if (state.turn >= 12 || crisisCount >= 2) {
    locked = 'help-overseer';
  } else {
    return state;
  }

  ledger = {
    ...ledger,
    branchLocked: locked,
    branchClosed: true,
    activeBranch: locked === 'millstone-commit' ? 'millstone-charter' : ledger.activeBranch,
    committedPaths: [...(ledger.committedPaths ?? []), `locked:${locked}`].slice(-24),
  };
  return { ...state, pyoaBranchLedger: ledger };
}

/** Exhaust Buy time / Call for help into forced fork (29a). */
export function exhaustDelayPads(state: GameState, playerInput: string): GameState {
  if (state.engineMode !== 'pyoa') return state;
  const lower = (playerInput || '').toLowerCase();
  if (!/\b(buy time|call for help|wait)\b/.test(lower)) return state;
  let ledger = state.pyoaBranchLedger ?? initPyoaBranchLedger();
  const delays = (ledger.committedPaths ?? []).filter((p) => p.startsWith('delay:')).length + 1;
  ledger = {
    ...ledger,
    committedPaths: [...(ledger.committedPaths ?? []), `delay:${delays}`].slice(-24),
  };
  if (delays >= 3 && !ledger.branchLocked) {
    ledger = {
      ...ledger,
      branchLocked: 'help-overseer',
      branchClosed: true,
      committedPaths: [...(ledger.committedPaths ?? []), 'locked:help-overseer'].slice(-24),
    };
  }
  return { ...state, pyoaBranchLedger: ledger };
}

export function isPyoaBranchLocked(state: GameState): boolean {
  return !!(state.pyoaBranchLedger?.branchLocked || state.pyoaBranchLedger?.branchClosed);
}

