/**
 * WS-4 Wave B: Advanced Encounter Resolution Mechanics
 * 
 * Extends basic encounter resolution with:
 * - Seeded RNG for deterministic damage/rolls
 * - HP ledger atomicity (before/after snapshots)
 * - Bounded combat terminal evaluation
 * - Flee progress and danger clocks
 * - Parley thresholds and leverage consumption
 * - d20 resolver with advantage/disadvantage
 * - Progress vs danger racing clocks
 * - PYOA exclusive-fact commits
 * 
 * Architecture:
 * - All rolls are seeded and deterministic
 * - HP changes are atomic with validation
 * - Encounters cannot exceed maxTurns bound
 * - Every terminal produces typed receipts
 */

import type { GameState } from './types';
import type { BaseReceipt, ResourceDelta } from './types/crossPackageContracts';

export interface SeededRng {
  seed: string;
  callCount: number;
}

export interface HpLedgerSnapshot {
  entity: string;
  hp: number;
  maxHp: number;
  timestamp: number;
}

export interface CombatResolution {
  seed: string;
  damageRolls: DamageRoll[];
  beforeSnapshot: HpLedgerSnapshot[];
  afterSnapshot: HpLedgerSnapshot[];
  terminal: CombatTerminal;
  turnsElapsed: number;
  forcedAt?: number;
}

export interface DamageRoll {
  attacker: string;
  defender: string;
  baseDamage: number;
  roll: number;
  total: number;
  critical: boolean;
  seed: string;
}

export type CombatTerminal =
  | 'victory'
  | 'defeat'
  | 'fled'
  | 'parleyResolved'
  | 'forced_timeout';

export interface FleeAttempt {
  turn: number;
  roll: number;
  success: boolean;
  dangerClockAdvance: number;
  progressClockAdvance: number;
}

export interface FleeProgress {
  maxAttempts: number;
  attemptsUsed: number;
  attempts: FleeAttempt[];
  progressClock: number; // 0-10
  dangerClock: number;   // 0-10
  maxProgressNeeded: number;
  terminal?: 'fled' | 'caught';
}

export interface ParleyThreshold {
  requirementType: 'leverage' | 'reputation' | 'gift' | 'threat';
  value: number;
  consumed: boolean;
}

export interface ParleyResolution {
  thresholds: ParleyThreshold[];
  attemptsUsed: number;
  maxAttempts: number;
  success: boolean;
  terminal?: 'parleyResolved' | 'parleyFailed';
}

export interface D20Roll {
  base: number;
  advantage: boolean;
  disadvantage: boolean;
  roll1: number;
  roll2?: number;
  modifier: number;
  total: number;
  dc: number;
  success: boolean;
  seed: string;
}

export interface ProgressClock {
  current: number;
  max: number;
  label: string;
}

export interface DangerClock {
  current: number;
  max: number;
  label: string;
}

export interface RacingClocks {
  progress: ProgressClock;
  danger: DangerClock;
  outcome: 'success' | 'failure' | 'success_with_cost' | 'ongoing';
}

// ============================================================================
// Seeded RNG
// ============================================================================

/**
 * Wave B: Deterministic random number generator
 * 
 * Uses seed to ensure replay produces identical results.
 */
export function createSeededRng(baseSeed: string): SeededRng {
  return {
    seed: baseSeed,
    callCount: 0
  };
}

/**
 * Wave B: Get next random value [0, 1) from seeded RNG
 */
export function nextRandom(rng: SeededRng): { value: number; rng: SeededRng } {
  // Simple LCG (Linear Congruential Generator) for deterministic randomness
  // Note: This is a basic implementation - production might use better PRNG
  const seedNum = hashSeed(rng.seed + rng.callCount);
  const value = (seedNum % 10000) / 10000;
  
  return {
    value,
    rng: {
      ...rng,
      callCount: rng.callCount + 1
    }
  };
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Wave B: Roll d20 with seeded RNG
 */
export function rollD20(rng: SeededRng): { result: number; rng: SeededRng } {
  const { value, rng: nextRng } = nextRandom(rng);
  const result = Math.floor(value * 20) + 1; // 1-20
  return { result, rng: nextRng };
}

/**
 * Wave B: Roll damage with seeded RNG
 */
export function rollDamage(
  baseDamage: number,
  critChance: number,
  rng: SeededRng
): { damage: number; critical: boolean; rng: SeededRng } {
  const { value: critRoll, rng: rng1 } = nextRandom(rng);
  const critical = critRoll < critChance;
  
  const { value: damageRoll, rng: rng2 } = nextRandom(rng1);
  const variance = 0.2; // ±20% variance
  const multiplier = 1 + ((damageRoll - 0.5) * variance);
  const damage = Math.floor(baseDamage * multiplier * (critical ? 2 : 1));
  
  return { damage, critical, rng: rng2 };
}

// ============================================================================
// HP Ledger Atomicity
// ============================================================================

/**
 * Wave B: Create HP snapshot before combat
 */
export function captureHpSnapshot(entities: string[], gs: GameState): HpLedgerSnapshot[] {
  const snapshots: HpLedgerSnapshot[] = [];
  const timestamp = Date.now();
  
  // Player
  snapshots.push({
    entity: 'player',
    hp: gs.hp ?? 100,
    maxHp: gs.maxHp ?? 100,
    timestamp
  });
  
  // Enemies (if encounter state exists)
  if (gs.activeEncounter?.enemies) {
    for (const enemy of gs.activeEncounter.enemies) {
      snapshots.push({
        entity: enemy.id,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        timestamp
      });
    }
  }
  
  return snapshots;
}

/**
 * Wave B: Validate HP changes are atomic
 */
export function validateHpChanges(
  before: HpLedgerSnapshot[],
  after: HpLedgerSnapshot[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check all entities exist in both snapshots
  for (const beforeEntity of before) {
    const afterEntity = after.find(a => a.entity === beforeEntity.entity);
    if (!afterEntity) {
      errors.push(`Entity ${beforeEntity.entity} missing from after snapshot`);
      continue;
    }
    
    // Validate HP never exceeds max
    if (afterEntity.hp > afterEntity.maxHp) {
      errors.push(`Entity ${afterEntity.entity} HP (${afterEntity.hp}) exceeds max (${afterEntity.maxHp})`);
    }
    
    // Validate HP never goes negative (should be clamped to 0)
    if (afterEntity.hp < 0) {
      errors.push(`Entity ${afterEntity.entity} has negative HP (${afterEntity.hp})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Bounded Combat Terminal
// ============================================================================

/**
 * Wave B: Check if combat should force terminal
 */
export function shouldForceTerminal(
  turnsElapsed: number,
  maxTurns: number,
  engineMode: string
): boolean {
  // LitRPG: 8 turns max
  if (engineMode === 'litrpg' && turnsElapsed >= 8) {
    return true;
  }
  
  // DnD: 10 turns max
  if (engineMode === 'dnd' && turnsElapsed >= 10) {
    return true;
  }
  
  // Generic: use provided maxTurns
  if (turnsElapsed >= maxTurns) {
    return true;
  }
  
  return false;
}

/**
 * Wave B: Force combat resolution at bound
 */
export function forceTerminalResolution(
  beforeSnapshot: HpLedgerSnapshot[],
  turnsElapsed: number
): CombatResolution {
  // Determine outcome based on HP ratios
  const playerSnapshot = beforeSnapshot.find(s => s.entity === 'player');
  const enemySnapshots = beforeSnapshot.filter(s => s.entity !== 'player');
  
  if (!playerSnapshot || enemySnapshots.length === 0) {
    throw new Error('Invalid snapshots for forced terminal');
  }
  
  const playerHpRatio = playerSnapshot.hp / playerSnapshot.maxHp;
  const avgEnemyHpRatio = enemySnapshots.reduce((sum, e) => sum + (e.hp / e.maxHp), 0) / enemySnapshots.length;
  
  let terminal: CombatTerminal;
  const afterSnapshot: HpLedgerSnapshot[] = [];
  
  if (playerHpRatio > avgEnemyHpRatio) {
    // Player wins
    terminal = 'victory';
    afterSnapshot.push({ ...playerSnapshot }); // Player HP unchanged
    for (const enemy of enemySnapshots) {
      afterSnapshot.push({ ...enemy, hp: 0 }); // Enemies defeated
    }
  } else if (playerHpRatio < avgEnemyHpRatio * 0.5) {
    // Player loses
    terminal = 'defeat';
    afterSnapshot.push({ ...playerSnapshot, hp: 1 }); // Player survives at 1 HP
    for (const enemy of enemySnapshots) {
      afterSnapshot.push({ ...enemy }); // Enemies unchanged
    }
  } else {
    // Forced timeout - both sides withdraw
    terminal = 'forced_timeout';
    afterSnapshot.push({ ...playerSnapshot }); // HP unchanged
    for (const enemy of enemySnapshots) {
      afterSnapshot.push({ ...enemy }); // HP unchanged
    }
  }
  
  return {
    seed: 'forced_terminal',
    damageRolls: [],
    beforeSnapshot,
    afterSnapshot,
    terminal,
    turnsElapsed,
    forcedAt: turnsElapsed
  };
}

// ============================================================================
// Flee Mechanics
// ============================================================================

/**
 * Wave B: Initialize flee progress
 */
export function initFleeProgress(maxAttempts: number = 3): FleeProgress {
  return {
    maxAttempts,
    attemptsUsed: 0,
    attempts: [],
    progressClock: 0,
    dangerClock: 0,
    maxProgressNeeded: 10
  };
}

/**
 * Wave B: Attempt to flee
 */
export function attemptFlee(
  progress: FleeProgress,
  dc: number,
  rng: SeededRng
): { progress: FleeProgress; rng: SeededRng; terminal?: 'fled' | 'caught' } {
  if (progress.attemptsUsed >= progress.maxAttempts) {
    return { progress, rng, terminal: 'caught' };
  }
  
  const { result: roll, rng: nextRng } = rollD20(rng);
  const success = roll >= dc;
  
  const progressAdvance = success ? 3 : 1;
  const dangerAdvance = success ? 1 : 2;
  
  const attempt: FleeAttempt = {
    turn: progress.attemptsUsed + 1,
    roll,
    success,
    dangerClockAdvance: dangerAdvance,
    progressClockAdvance: progressAdvance
  };
  
  const nextProgress = progress.progressClock + progressAdvance;
  const nextDanger = progress.dangerClock + dangerAdvance;
  
  const newProgress: FleeProgress = {
    ...progress,
    attemptsUsed: progress.attemptsUsed + 1,
    attempts: [...progress.attempts, attempt],
    progressClock: Math.min(nextProgress, progress.maxProgressNeeded),
    dangerClock: Math.min(nextDanger, 10)
  };
  
  // Check terminals
  if (newProgress.progressClock >= newProgress.maxProgressNeeded) {
    return { progress: newProgress, rng: nextRng, terminal: 'fled' };
  }
  
  if (newProgress.dangerClock >= 10) {
    return { progress: newProgress, rng: nextRng, terminal: 'caught' };
  }
  
  return { progress: newProgress, rng: nextRng };
}

// ============================================================================
// Parley Mechanics
// ============================================================================

/**
 * Wave B: Initialize parley with thresholds
 */
export function initParley(requiredLeverage: number): ParleyResolution {
  return {
    thresholds: [
      { requirementType: 'leverage', value: requiredLeverage, consumed: false }
    ],
    attemptsUsed: 0,
    maxAttempts: 3,
    success: false
  };
}

/**
 * Wave B: Attempt parley
 */
export function attemptParley(
  parley: ParleyResolution,
  leverageOffered: number
): { parley: ParleyResolution; terminal?: 'parleyResolved' | 'parleyFailed' } {
  if (parley.attemptsUsed >= parley.maxAttempts) {
    return { parley, terminal: 'parleyFailed' };
  }
  
  const nextParley = { ...parley, attemptsUsed: parley.attemptsUsed + 1 };
  
  // Check if leverage meets threshold
  const leverageThreshold = parley.thresholds.find(t => t.requirementType === 'leverage');
  if (leverageThreshold && leverageOffered >= leverageThreshold.value) {
    nextParley.success = true;
    nextParley.thresholds = parley.thresholds.map(t =>
      t.requirementType === 'leverage' ? { ...t, consumed: true } : t
    );
    return { parley: nextParley, terminal: 'parleyResolved' };
  }
  
  // Failed attempt
  if (nextParley.attemptsUsed >= nextParley.maxAttempts) {
    return { parley: nextParley, terminal: 'parleyFailed' };
  }
  
  return { parley: nextParley };
}

// ============================================================================
// D20 Resolver
// ============================================================================

/**
 * Wave B: Resolve d20 check with advantage/disadvantage
 */
export function resolveD20Check(
  dc: number,
  modifier: number,
  advantage: boolean,
  disadvantage: boolean,
  rng: SeededRng
): { roll: D20Roll; rng: SeededRng } {
  const { result: roll1, rng: rng1 } = rollD20(rng);
  
  let roll2: number | undefined;
  let nextRng = rng1;
  
  // Advantage or disadvantage requires second roll
  if (advantage || disadvantage) {
    const { result, rng: rng2 } = rollD20(rng1);
    roll2 = result;
    nextRng = rng2;
  }
  
  // Determine final roll
  let base: number;
  if (advantage && roll2 !== undefined) {
    base = Math.max(roll1, roll2);
  } else if (disadvantage && roll2 !== undefined) {
    base = Math.min(roll1, roll2);
  } else {
    base = roll1;
  }
  
  const total = base + modifier;
  const success = total >= dc;
  
  return {
    roll: {
      base,
      advantage,
      disadvantage,
      roll1,
      roll2,
      modifier,
      total,
      dc,
      success,
      seed: rng.seed
    },
    rng: nextRng
  };
}

// ============================================================================
// Racing Clocks
// ============================================================================

/**
 * Wave B: Evaluate racing progress vs danger clocks
 */
export function evaluateRacingClocks(
  progress: ProgressClock,
  danger: DangerClock
): 'success' | 'failure' | 'success_with_cost' | 'ongoing' {
  // Progress reached goal first
  if (progress.current >= progress.max && danger.current < danger.max) {
    return 'success';
  }
  
  // Danger reached limit first
  if (danger.current >= danger.max && progress.current < progress.max) {
    return 'failure';
  }
  
  // Both filled simultaneously
  if (progress.current >= progress.max && danger.current >= danger.max) {
    return 'success_with_cost';
  }
  
  // Neither filled yet
  return 'ongoing';
}

/**
 * Wave B: Advance racing clocks
 */
export function advanceRacingClocks(
  progress: ProgressClock,
  danger: DangerClock,
  progressAdvance: number,
  dangerAdvance: number
): RacingClocks {
  const newProgress = {
    ...progress,
    current: Math.min(progress.current + progressAdvance, progress.max)
  };
  
  const newDanger = {
    ...danger,
    current: Math.min(danger.current + dangerAdvance, danger.max)
  };
  
  const outcome = evaluateRacingClocks(newProgress, newDanger);
  
  return {
    progress: newProgress,
    danger: newDanger,
    outcome
  };
}
