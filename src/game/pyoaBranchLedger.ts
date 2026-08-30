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
  /** B025 — convergence points where branches merge */
  convergencePoints?: Array<{
    turn: number;
    branches: string[];
    stateHash: string;
  }>;
}

export function initPyoaBranchLedger(): PyoaBranchLedger {
  return { 
    activeBranch: 'none', 
    committedPaths: [], 
    charterUses: 0, 
    branchClosed: false,
    convergencePoints: [],
  };
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
  } else if (/\b(risky fork|face the crisis|trust silas|leave silas|smuggler route)\b/.test(lower)) {
    // 29c — crisis fork picks lock a real mutually exclusive branch
    const locked = /\bleave silas\b/.test(lower)
      ? 'solo-road'
      : /\btrust silas|smuggler\b/.test(lower)
        ? 'ally-path'
        : 'help-overseer';
    ledger = {
      ...ledger,
      activeBranch: locked === 'solo-road' ? 'solo-road' : locked === 'ally-path' ? 'ally-path' : ledger.activeBranch,
      branchLocked: ledger.branchLocked || locked,
      branchClosed: true,
      committedPaths: [...(ledger.committedPaths ?? []), `fork:${locked}`, `locked:${locked}`].slice(-24),
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

/** Exhaust Buy time / Call for help / Wait / Inspect into forced fork (29a/29c). */
export function exhaustDelayPads(state: GameState, playerInput: string): GameState {
  if (state.engineMode !== 'pyoa') return state;
  const lower = (playerInput || '').toLowerCase();
  if (!/\b(buy time|call for help|wait|inspect|examine|study)\b/.test(lower)) return state;
  let ledger = state.pyoaBranchLedger ?? initPyoaBranchLedger();
  const delays = (ledger.committedPaths ?? []).filter((p) => p.startsWith('delay:')).length + 1;
  ledger = {
    ...ledger,
    committedPaths: [...(ledger.committedPaths ?? []), `delay:${delays}`].slice(-24),
  };
  // 29c — lock faster on Wait/Inspect stall (2) vs Buy time (3)
  const threshold = /\b(wait|inspect|examine|study)\b/.test(lower) ? 2 : 3;
  if (delays >= threshold && !ledger.branchLocked) {
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

/**
 * 31h — After branch lock, only eligible futures (no Wait-Wait / buy-time delay of the same crisis).
 */
export function eligiblePyoaPadsAfterLock(state: GameState, choice: string): boolean {
  if (!isPyoaBranchLocked(state)) return true;
  const lower = (choice ?? '').toLowerCase();
  // Delay / same-crisis stall pads are never legal after lock
  if (
    /\b(buy time|call for help|wait and watch|^wait$|wait\b|stand around|do nothing|inspect the crisis|study the crisis|delay|stall)\b/i.test(
      lower
    )
  ) {
    return false;
  }
  const locked = String(state.pyoaBranchLedger?.branchLocked ?? '');
  // Locked branch reopen without a new event
  if (locked === 'solo-road' && /\b(trust silas|smuggler|ally with|join (?:them|him|her))\b/i.test(lower)) {
    return false;
  }
  if (locked === 'ally-path' && /\b(leave silas|go alone|solo road|betray)\b/i.test(lower)) {
    return false;
  }
  if (locked === 'millstone-commit' && /\b(burn (?:the )?charter|sell to pell)\b/i.test(lower)) {
    return false;
  }
  // Eligible: face crisis / risky fork / leverage / locked-path advances
  return true;
}

/** B025 — Compute state hash for convergence detection */
function computeBranchStateHash(state: GameState): string {
  // Hash based on key convergence indicators
  const indicators = [
    state.currentLocation ?? '',
    (state.quests ?? []).filter(q => q.status === 'active').map(q => q.id).sort().join(','),
    (state.inventory ?? []).map(i => i.name).sort().join(','),
    (state.character?.level ?? 0).toString(),
    (state.sceneFacts?.present ?? []).sort().join(','),
  ];
  
  // Simple hash (not cryptographic, just for detecting same state)
  const str = indicators.join('::');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/** B025 — Detect if current state has converged with previous branches */
export function detectBranchConvergence(state: GameState): {
  converged: boolean;
  convergencePoint?: {
    turn: number;
    branches: string[];
    stateHash: string;
  };
} {
  if (state.engineMode !== 'pyoa') {
    return { converged: false };
  }
  
  const ledger = state.pyoaBranchLedger ?? initPyoaBranchLedger();
  const currentHash = computeBranchStateHash(state);
  
  // Check previous convergence points
  const existing = (ledger.convergencePoints ?? []).find(
    cp => cp.stateHash === currentHash
  );
  
  if (existing) {
    // Already at a known convergence point
    return { converged: true, convergencePoint: existing };
  }
  
  // Check if current branch state matches historical state
  // (This is a simplified version - full implementation would track per-branch state history)
  const activeBranch = ledger.activeBranch ?? 'none';
  const committedPaths = ledger.committedPaths ?? [];
  
  // Convergence indicators:
  // - Same location after different paths
  // - Same quest state after different choices
  // - Same inventory after different resource paths
  
  // For MVP, detect convergence when:
  // 1. Branch was locked (divergence happened)
  // 2. Current state matches a "canonical" state (e.g., specific quest stage)
  
  if (ledger.branchLocked && committedPaths.length >= 4) {
    const quests = state.quests ?? [];
    const activeQuests = quests.filter(q => q.status === 'active');
    
    // Convergence at key quest stages
    const convergenceQuests = ['circle-price-final', 'thornferry-ending', 'vesper-conclusion'];
    const atConvergence = activeQuests.some(q => 
      convergenceQuests.some(cq => q.id.includes(cq))
    );
    
    if (atConvergence) {
      const convergencePoint = {
        turn: state.turn,
        branches: [activeBranch, ledger.branchLocked].filter(Boolean) as string[],
        stateHash: currentHash,
      };
      return { converged: true, convergencePoint };
    }
  }
  
  return { converged: false };
}

/** B025 — Record convergence point */
export function recordBranchConvergence(
  state: GameState,
  convergencePoint: {
    turn: number;
    branches: string[];
    stateHash: string;
  }
): GameState {
  if (state.engineMode !== 'pyoa') return state;
  
  const ledger = state.pyoaBranchLedger ?? initPyoaBranchLedger();
  const existing = (ledger.convergencePoints ?? []).find(
    cp => cp.stateHash === convergencePoint.stateHash
  );
  
  if (existing) return state; // Already recorded
  
  return {
    ...state,
    pyoaBranchLedger: {
      ...ledger,
      convergencePoints: [
        ...(ledger.convergencePoints ?? []),
        convergencePoint,
      ].slice(-10), // Keep last 10 convergence points
    },
  };
}

/** B025 — Clean up branch-specific memory at convergence */
export function cleanupBranchMemoryAtConvergence(
  state: GameState
): GameState {
  if (state.engineMode !== 'pyoa') return state;
  
  const { converged, convergencePoint } = detectBranchConvergence(state);
  if (!converged || !convergencePoint) return state;
  
  let next = recordBranchConvergence(state, convergencePoint);
  
  // Clean up branch-specific paths that are now irrelevant
  const ledger = next.pyoaBranchLedger ?? initPyoaBranchLedger();
  const committedPaths = ledger.committedPaths ?? [];
  
  // Keep only recent paths (last 8) and convergence markers
  const recentPaths = committedPaths.slice(-8);
  const convergencePaths = committedPaths.filter(p => 
    p.startsWith('locked:') || p.startsWith('convergence:')
  );
  
  const cleanedPaths = [
    ...convergencePaths,
    ...recentPaths,
    `convergence:${convergencePoint.stateHash}`,
  ].slice(-16);
  
  next = {
    ...next,
    pyoaBranchLedger: {
      ...ledger,
      committedPaths: cleanedPaths,
      // Unlock branch after convergence to allow new divergences
      branchLocked: false,
      branchClosed: false,
    },
  };
  
  return next;
}

/** B025 — Format mandate for convergence */
export function formatConvergenceMandate(state: GameState): string | null {
  const { converged, convergencePoint } = detectBranchConvergence(state);
  if (!converged || !convergencePoint) return null;
  
  const branches = convergencePoint.branches.join(' and ');
  return `PYOA CONVERGENCE: Branches (${branches}) have converged to shared state. Branch-specific facts preserved; new divergences available.`;
}
