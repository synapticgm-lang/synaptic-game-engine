/**
 * WS-5 Wave D+: PYOA Replay Scaffolding
 * 
 * Complete replay system with:
 * - Seed-stable branching for deterministic replay
 * - Speedrun mode support
 * - Ending count tracking
 * - Deterministic crisis selection
 * - Replay validation
 */

import type { GameState } from './types';
import type { BibleId, CrisisId, Turn } from './pyoaTypes';

// ============================================================================
// REPLAY STATE
// ============================================================================

export interface PyoaReplayState {
  /** Seed for deterministic replay */
  seed: string;
  
  /** Manifest version for schema compatibility */
  manifestVersion: string;
  
  /** Crisis selection history (ordered) */
  crisisHistory: readonly CrisisId[];
  
  /** Choice history (ordered fork IDs) */
  choiceHistory: readonly string[];
  
  /** Turn timestamps for each choice */
  turnTimestamps: readonly Turn[];
  
  /** Ending count tracker */
  endingCounts: Readonly<Record<string, number>>;
  
  /** Total runs completed */
  runsCompleted: number;
  
  /** Speedrun mode enabled */
  speedrunMode: boolean;
}

/**
 * Initialize replay state
 */
export function initReplayState(seed: string): PyoaReplayState {
  return {
    seed,
    manifestVersion: '1.0.0',
    crisisHistory: [],
    choiceHistory: [],
    turnTimestamps: [],
    endingCounts: {},
    runsCompleted: 0,
    speedrunMode: false,
  };
}

// ============================================================================
// SEEDED RANDOM
// ============================================================================

/**
 * Seeded random number generator
 * 
 * Uses LCG (Linear Congruential Generator) for deterministic randomness
 */
export class SeededRandom {
  private state: number;
  
  constructor(seed: string) {
    // Convert seed string to number
    this.state = this.hashSeed(seed);
  }
  
  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Get next random number [0, 1)
   */
  next(): number {
    // LCG parameters (from Numerical Recipes)
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    this.state = (a * this.state + c) % m;
    return this.state / m;
  }
  
  /**
   * Get random integer [0, max)
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
  
  /**
   * Pick random element from array
   */
  pick<T>(array: readonly T[]): T {
    return array[this.nextInt(array.length)];
  }
  
  /**
   * Shuffle array deterministically
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// ============================================================================
// DETERMINISTIC CRISIS SELECTION
// ============================================================================

/**
 * Select crisis deterministically based on seed
 */
export function selectCrisisDeterministic(
  eligibleCrises: readonly CrisisId[],
  replayState: PyoaReplayState,
  turnOffset: number
): CrisisId | null {
  if (eligibleCrises.length === 0) return null;
  
  // Create seeded random from base seed + turn offset
  const turnSeed = `${replayState.seed}-crisis-${turnOffset}`;
  const rng = new SeededRandom(turnSeed);
  
  return rng.pick(eligibleCrises);
}

/**
 * Record crisis selection
 */
export function recordCrisisSelection(
  replayState: PyoaReplayState,
  crisisId: CrisisId,
  turn: Turn
): PyoaReplayState {
  return {
    ...replayState,
    crisisHistory: [...replayState.crisisHistory, crisisId],
    turnTimestamps: [...replayState.turnTimestamps, turn],
  };
}

/**
 * Record fork choice
 */
export function recordForkChoice(
  replayState: PyoaReplayState,
  forkId: string,
  turn: Turn
): PyoaReplayState {
  return {
    ...replayState,
    choiceHistory: [...replayState.choiceHistory, forkId],
  };
}

// ============================================================================
// ENDING TRACKING
// ============================================================================

/**
 * Record ending reached
 */
export function recordEndingReached(
  replayState: PyoaReplayState,
  endingId: string
): PyoaReplayState {
  const endingCounts = { ...replayState.endingCounts };
  endingCounts[endingId] = (endingCounts[endingId] ?? 0) + 1;
  
  return {
    ...replayState,
    endingCounts,
    runsCompleted: replayState.runsCompleted + 1,
  };
}

/**
 * Get ending statistics
 */
export interface EndingStatistics {
  totalRuns: number;
  uniqueEndingsReached: number;
  endingCounts: Readonly<Record<string, number>>;
  mostCommonEnding: string | null;
  rareEndings: readonly string[];
}

/**
 * Calculate ending statistics
 */
export function getEndingStatistics(
  replayState: PyoaReplayState,
  totalPossibleEndings: number
): EndingStatistics {
  const endingCounts = replayState.endingCounts;
  const entries = Object.entries(endingCounts);
  
  const sortedByCount = entries.sort((a, b) => b[1] - a[1]);
  const mostCommon = sortedByCount[0]?.[0] ?? null;
  const rareEndings = entries.filter(([_, count]) => count === 1).map(([id, _]) => id);
  
  return {
    totalRuns: replayState.runsCompleted,
    uniqueEndingsReached: Object.keys(endingCounts).length,
    endingCounts,
    mostCommonEnding: mostCommon,
    rareEndings,
  };
}

// ============================================================================
// SPEEDRUN MODE
// ============================================================================

export interface SpeedrunConfig {
  /** Target turn count */
  targetTurns: number;
  
  /** Skip non-essential narrative */
  skipFluff: boolean;
  
  /** Auto-select first choice */
  autoProgress: boolean;
  
  /** Crisis skip threshold (skip if < threshold) */
  crisisSkipThreshold?: number;
}

/**
 * Enable speedrun mode
 */
export function enableSpeedrunMode(
  replayState: PyoaReplayState,
  config: SpeedrunConfig = { targetTurns: 50, skipFluff: true, autoProgress: false }
): PyoaReplayState {
  return {
    ...replayState,
    speedrunMode: true,
  };
}

/**
 * Check if speedrun target reached
 */
export function checkSpeedrunTarget(
  replayState: PyoaReplayState,
  currentTurn: Turn,
  targetTurns: number
): {
  targetReached: boolean;
  turnsRemaining: number;
  onPace: boolean;
} {
  const turnsRemaining = targetTurns - currentTurn;
  const onPace = currentTurn <= targetTurns;
  
  return {
    targetReached: currentTurn >= targetTurns,
    turnsRemaining,
    onPace,
  };
}

// ============================================================================
// REPLAY VALIDATION
// ============================================================================

export interface ReplayValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  divergencePoint?: {
    turn: Turn;
    expected: string;
    actual: string;
  };
}

/**
 * Validate replay against expected sequence
 */
export function validateReplay(
  expectedState: PyoaReplayState,
  actualState: PyoaReplayState
): ReplayValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check seed match
  if (expectedState.seed !== actualState.seed) {
    errors.push(`Seed mismatch: expected ${expectedState.seed}, got ${actualState.seed}`);
  }
  
  // Check crisis history
  const minLength = Math.min(
    expectedState.crisisHistory.length,
    actualState.crisisHistory.length
  );
  
  for (let i = 0; i < minLength; i++) {
    const expected = expectedState.crisisHistory[i];
    const actual = actualState.crisisHistory[i];
    
    if (expected !== actual) {
      return {
        valid: false,
        errors: [`Crisis divergence at index ${i}`],
        warnings,
        divergencePoint: {
          turn: expectedState.turnTimestamps[i] ?? 0,
          expected,
          actual,
        },
      };
    }
  }
  
  // Check choice history length
  if (expectedState.choiceHistory.length !== actualState.choiceHistory.length) {
    warnings.push(
      `Choice count mismatch: expected ${expectedState.choiceHistory.length}, got ${actualState.choiceHistory.length}`
    );
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Export replay trace
 */
export interface ReplayTrace {
  seed: string;
  manifestVersion: string;
  bibleId: BibleId;
  crisisSequence: readonly {
    crisisId: CrisisId;
    turn: Turn;
    forkId: string;
  }[];
  endingId: string;
  totalTurns: Turn;
  timestamp: string;
}

/**
 * Build replay trace for export
 */
export function buildReplayTrace(
  replayState: PyoaReplayState,
  bibleId: BibleId,
  endingId: string,
  totalTurns: Turn
): ReplayTrace {
  const crisisSequence = replayState.crisisHistory.map((crisisId, index) => ({
    crisisId,
    turn: replayState.turnTimestamps[index] ?? 0,
    forkId: replayState.choiceHistory[index] ?? 'unknown',
  }));
  
  return {
    seed: replayState.seed,
    manifestVersion: replayState.manifestVersion,
    bibleId,
    crisisSequence,
    endingId,
    totalTurns,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Import replay trace
 */
export function importReplayTrace(trace: ReplayTrace): PyoaReplayState {
  return {
    seed: trace.seed,
    manifestVersion: trace.manifestVersion,
    crisisHistory: trace.crisisSequence.map(c => c.crisisId),
    choiceHistory: trace.crisisSequence.map(c => c.forkId),
    turnTimestamps: trace.crisisSequence.map(c => c.turn),
    endingCounts: { [trace.endingId]: 1 },
    runsCompleted: 1,
    speedrunMode: false,
  };
}

// ============================================================================
// GAME STATE INTEGRATION
// ============================================================================

/**
 * Get or create replay state from game state
 */
export function getReplayState(state: GameState): PyoaReplayState {
  // Check if replay state exists in game state
  const existing = (state as any).pyoaReplayState as PyoaReplayState | undefined;
  
  if (existing) {
    return existing;
  }
  
  // Create new replay state from save seed
  const seed = state.saveId ?? `seed-${Date.now()}`;
  return initReplayState(seed);
}

/**
 * Update replay state in game state
 */
export function updateReplayState(
  state: GameState,
  replayState: PyoaReplayState
): GameState {
  return {
    ...state,
    pyoaReplayState: replayState as any,
  };
}

/**
 * Build replay situation section
 */
export function buildReplaySituationSection(
  replayState: PyoaReplayState,
  currentTurn: Turn
): string {
  const lines: string[] = ['### REPLAY STATE'];
  lines.push(`Seed: ${replayState.seed}`);
  lines.push(`Crises resolved: ${replayState.crisisHistory.length}`);
  lines.push(`Choices made: ${replayState.choiceHistory.length}`);
  
  if (replayState.speedrunMode) {
    lines.push('**Speedrun mode active**');
  }
  
  if (replayState.runsCompleted > 0) {
    lines.push('');
    lines.push(`Completed runs: ${replayState.runsCompleted}`);
    lines.push(`Unique endings: ${Object.keys(replayState.endingCounts).length}`);
  }
  
  return lines.join('\n');
}

// ============================================================================
// DETERMINISTIC SEED DERIVATION
// ============================================================================

/**
 * Derive child seed from parent seed
 */
export function deriveChildSeed(
  parentSeed: string,
  context: string
): string {
  return `${parentSeed}-${context}`;
}

/**
 * Derive crisis seed
 */
export function deriveCrisisSeed(
  baseSeed: string,
  crisisIndex: number
): string {
  return deriveChildSeed(baseSeed, `crisis-${crisisIndex}`);
}

/**
 * Derive fork seed
 */
export function deriveForkSeed(
  crisisSeed: string,
  forkIndex: number
): string {
  return deriveChildSeed(crisisSeed, `fork-${forkIndex}`);
}

// ============================================================================
// REPLAY STATISTICS
// ============================================================================

export interface ReplayStatistics {
  totalSeeds: number;
  averageTurns: number;
  averageCrises: number;
  endingDistribution: Readonly<Record<string, number>>;
  uniquePaths: number;
  deterministicScore: number;
}

/**
 * Calculate replay statistics across multiple runs
 */
export function calculateReplayStatistics(
  traces: readonly ReplayTrace[]
): ReplayStatistics {
  if (traces.length === 0) {
    return {
      totalSeeds: 0,
      averageTurns: 0,
      averageCrises: 0,
      endingDistribution: {},
      uniquePaths: 0,
      deterministicScore: 1.0,
    };
  }
  
  const totalTurns = traces.reduce((sum, t) => sum + t.totalTurns, 0);
  const totalCrises = traces.reduce((sum, t) => sum + t.crisisSequence.length, 0);
  
  const endingDistribution: Record<string, number> = {};
  for (const trace of traces) {
    endingDistribution[trace.endingId] = (endingDistribution[trace.endingId] ?? 0) + 1;
  }
  
  // Count unique paths (by crisis sequence)
  const pathSet = new Set(
    traces.map(t => t.crisisSequence.map(c => c.crisisId).join('->'))
  );
  
  // Calculate deterministic score (same seed should produce same result)
  const seedGroups = new Map<string, ReplayTrace[]>();
  for (const trace of traces) {
    const group = seedGroups.get(trace.seed) ?? [];
    group.push(trace);
    seedGroups.set(trace.seed, group);
  }
  
  let deterministicMatches = 0;
  let deterministicTotal = 0;
  
  for (const group of seedGroups.values()) {
    if (group.length > 1) {
      const firstPath = group[0].crisisSequence.map(c => c.crisisId).join('->');
      for (const trace of group.slice(1)) {
        const path = trace.crisisSequence.map(c => c.crisisId).join('->');
        deterministicTotal++;
        if (path === firstPath) {
          deterministicMatches++;
        }
      }
    }
  }
  
  const deterministicScore = deterministicTotal > 0
    ? deterministicMatches / deterministicTotal
    : 1.0;
  
  return {
    totalSeeds: new Set(traces.map(t => t.seed)).size,
    averageTurns: totalTurns / traces.length,
    averageCrises: totalCrises / traces.length,
    endingDistribution,
    uniquePaths: pathSet.size,
    deterministicScore,
  };
}
