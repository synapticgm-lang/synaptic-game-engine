/**
 * WS-6 Wave D: Density Validation Gates
 * 
 * Validates content density against:
 * - G1: Density gate (hub/encounter/NPC counts)
 * - G2: Exhaustion gate (no repeat dominance before T100)
 * - G3: Spine milestone gate (80% hit rate)
 * - G4: FO3-like wedge (60-70% depth index)
 * - G5: Pacing gate (LitRPG level timing)
 * 
 * Architecture:
 * - Each gate has pass/fail criteria
 * - Gates run during autoplay evaluation
 * - Human validation gates (G4, G5) for final sign-off
 */

import type { GameState, EngineMode } from './types';
import type { DensityEvent, RollingMetrics, ContentDensityState } from './exhaustionCurve';
import {
  hasRepeatDominance,
  hasTerminalLoop,
  calculateRollingMetrics,
  calculateExhaustionIndex
} from './exhaustionCurve';
import {
  type DensityTargets,
  getDensityTargets,
  isDensityTargetMet,
  type DepthComponents,
  calculateDepthIndex,
  passesDepthWedge,
  hasCriticallyLowComponent,
  isQualifiedHub,
  type HubProperties
} from './contentDensity';
import type { SpineBand, Milestone } from './spineMapRegistry';
import { getBandForTurn, getNextMilestone, isMilestoneOverdue } from './spineMapRegistry';

// ============================================================================
// Gate Results
// ============================================================================

export interface GateResult {
  gate: string;
  passed: boolean;
  score?: number;
  threshold?: number;
  failures: string[];
  warnings: string[];
  telemetry: Record<string, any>;
}

// ============================================================================
// G1: Density Gate
// ============================================================================

/**
 * G1: Check qualified hub, encounter, and NPC counts
 */
export function validateDensityGate(
  mode: EngineMode,
  turn: number,
  hubs: string[],
  hubProperties: Map<string, HubProperties>,
  encounters: string[],
  npcs: string[]
): GateResult {
  const targets = getDensityTargets(mode);
  const failures: string[] = [];
  const warnings: string[] = [];
  
  // Count qualified hubs (3 of 5 properties)
  const qualifiedHubs = hubs.filter(hub => {
    const props = hubProperties.get(hub);
    return props && isQualifiedHub(props);
  });
  
  // Check T100 targets
  if (turn >= 100) {
    const [minHubs, maxHubs] = targets.hubsByT100;
    if (qualifiedHubs.length < minHubs) {
      failures.push(`Hubs: ${qualifiedHubs.length} < ${minHubs} (target: ${minHubs}-${maxHubs})`);
    } else if (qualifiedHubs.length < minHubs * 0.8) {
      warnings.push(`Hubs: ${qualifiedHubs.length} below 80% of minimum (${minHubs * 0.8})`);
    }
    
    const [minEnc, maxEnc] = targets.encountersByT100;
    if (encounters.length < minEnc) {
      failures.push(`Encounters: ${encounters.length} < ${minEnc} (target: ${minEnc}-${maxEnc})`);
    }
    
    const [minNpc, maxNpc] = targets.npcsByT100;
    if (npcs.length < minNpc) {
      failures.push(`NPCs: ${npcs.length} < ${minNpc} (target: ${minNpc}-${maxNpc})`);
    }
  }
  
  // Check T300 targets
  if (turn >= 300 && targets.additionalHubsByT300) {
    const [addMin, addMax] = targets.additionalHubsByT300;
    const [t100Min, t100Max] = targets.hubsByT100;
    const totalMin = t100Min + addMin;
    
    if (qualifiedHubs.length < totalMin) {
      failures.push(`Hubs T300: ${qualifiedHubs.length} < ${totalMin}`);
    }
  }
  
  return {
    gate: 'G1_DENSITY',
    passed: failures.length === 0,
    failures,
    warnings,
    telemetry: {
      turn,
      qualifiedHubs: qualifiedHubs.length,
      totalHubs: hubs.length,
      encounters: encounters.length,
      npcs: npcs.length,
      targets
    }
  };
}

// ============================================================================
// G2: Exhaustion Gate
// ============================================================================

/**
 * G2: Check exhaustion metrics (no repeat dominance before T100)
 */
export function validateExhaustionGate(
  events: DensityEvent[],
  turn: number
): GateResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  
  // Check terminal loops (hard failure)
  if (hasTerminalLoop(events)) {
    failures.push('Terminal loop detected (defeated boss re-entry)');
  }
  
  // Check repeat dominance before T100
  if (hasRepeatDominance(events, turn, 100)) {
    failures.push('Repeat dominance before T100 (>50% stale in last 20 beats)');
  }
  
  // Calculate metrics
  const metrics = calculateRollingMetrics(events, 20);
  const ei = calculateExhaustionIndex(metrics);
  
  // Check EI threshold
  if (ei >= 65) {
    failures.push(`Exhaustion Index: ${ei.toFixed(1)} >= 65 (exhausted)`);
  } else if (ei >= 50) {
    warnings.push(`Exhaustion Index: ${ei.toFixed(1)} >= 50 (high risk)`);
  }
  
  // Check stale ceiling for current band
  const staleCeiling = turn <= 50 ? 0.05 : turn <= 100 ? 0.15 : 0.25;
  if (metrics.SRR > staleCeiling) {
    warnings.push(`Stale rate: ${(metrics.SRR * 100).toFixed(1)}% > ${staleCeiling * 100}% ceiling`);
  }
  
  // Check unique floor for current band
  const uniqueFloor = turn <= 50 ? 0.80 : turn <= 100 ? 0.60 : 0.40;
  if (metrics.UER < uniqueFloor) {
    warnings.push(`Unique rate: ${(metrics.UER * 100).toFixed(1)}% < ${uniqueFloor * 100}% floor`);
  }
  
  return {
    gate: 'G2_EXHAUSTION',
    passed: failures.length === 0,
    score: ei,
    threshold: 65,
    failures,
    warnings,
    telemetry: {
      turn,
      metrics,
      ei,
      terminalLoops: hasTerminalLoop(events),
      repeatDominance: hasRepeatDominance(events, turn, 100)
    }
  };
}

// ============================================================================
// G3: Spine Milestone Gate
// ============================================================================

/**
 * G3: Check milestone coverage (80% hit rate)
 */
export function validateMilestoneGate(
  mode: EngineMode,
  turn: number,
  completedMilestones: string[],
  band?: SpineBand
): GateResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  
  if (!band) {
    return {
      gate: 'G3_MILESTONES',
      passed: true,
      failures,
      warnings,
      telemetry: { turn, reason: 'No band data available' }
    };
  }
  
  // Check all milestones in band
  const eligible = band.milestones.filter(m => {
    // Prerequisites met
    return m.requires.every(req => completedMilestones.includes(req));
  });
  
  const dueMilestones = eligible.filter(m => turn >= m.targetTurns[0]);
  const overdueMilestones = eligible.filter(m => turn > m.targetTurns[1]);
  const completed = dueMilestones.filter(m => completedMilestones.includes(m.id));
  
  const hitRate = dueMilestones.length > 0 ? completed.length / dueMilestones.length : 1.0;
  
  // Check 80% threshold
  if (hitRate < 0.80) {
    failures.push(`Milestone hit rate: ${(hitRate * 100).toFixed(1)}% < 80%`);
  }
  
  // Check overdue milestones
  for (const milestone of overdueMilestones) {
    if (!completedMilestones.includes(milestone.id)) {
      failures.push(`Milestone overdue: ${milestone.id} (due by T${milestone.targetTurns[1]})`);
    }
  }
  
  return {
    gate: 'G3_MILESTONES',
    passed: failures.length === 0,
    score: hitRate,
    threshold: 0.80,
    failures,
    warnings,
    telemetry: {
      turn,
      bandId: band.bandId,
      eligible: eligible.length,
      due: dueMilestones.length,
      overdue: overdueMilestones.length,
      completed: completed.length,
      hitRate,
      completedMilestones
    }
  };
}

// ============================================================================
// G4: FO3-Like Wedge Gate
// ============================================================================

/**
 * G4: Check FO3-like depth index (60-70% target)
 */
export function validateDepthWedge(
  components: DepthComponents,
  playerRatings?: {
    deepEnough: number;  // % rating 4-5 on "deep enough"
    thinGrindy: number;  // % rating 4-5 on "thin/grindy" (reverse-coded)
  }
): GateResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  
  const index = calculateDepthIndex(components);
  
  // Check 60% threshold
  if (!passesDepthWedge(index)) {
    failures.push(`Depth index: ${(index * 100).toFixed(1)}% < 60%`);
  }
  
  // Check critically low components (<45%)
  if (hasCriticallyLowComponent(components)) {
    const low = Object.entries(components)
      .filter(([_, v]) => v < 0.45)
      .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`);
    failures.push(`Critically low components: ${low.join(', ')}`);
  }
  
  // Check player ratings if available
  if (playerRatings) {
    if (playerRatings.deepEnough < 70) {
      failures.push(`Player "deep enough": ${playerRatings.deepEnough}% < 70%`);
    }
    if (playerRatings.thinGrindy > 20) {
      failures.push(`Player "thin/grindy": ${playerRatings.thinGrindy}% > 20%`);
    }
  }
  
  return {
    gate: 'G4_DEPTH_WEDGE',
    passed: failures.length === 0,
    score: index,
    threshold: 0.60,
    failures,
    warnings,
    telemetry: {
      index,
      components,
      playerRatings
    }
  };
}

// ============================================================================
// G5: LitRPG Pacing Gate
// ============================================================================

/**
 * G5: Check LitRPG level timing and XP pacing
 */
export function validateLitRPGPacing(
  mode: EngineMode,
  turn: number,
  level: number,
  dungeonEnteredTurn: number | null,
  playerRatings?: {
    hookClarity: number;        // % rating 4-5
    durableAgency: number;      // % rating 4-5
    combatNaturalness: number;  // % rating 4-5
    socialXpWorth: number;      // % rating 4-5
    l2Tempo: number;            // % satisfied with L2 timing
    grindPressure: number;      // % rating 4-5 (reverse-coded)
    continueDesire: number;     // % rating 4-5 at T40
  }
): GateResult {
  if (mode !== 'litrpg') {
    return {
      gate: 'G5_PACING',
      passed: true,
      failures: [],
      warnings: [],
      telemetry: { reason: 'Not LitRPG mode' }
    };
  }
  
  const failures: string[] = [];
  const warnings: string[] = [];
  
  // Check L2 timing (T15-25)
  if (turn >= 25 && level < 2) {
    failures.push(`Level: ${level} < 2 by T25`);
  } else if (turn >= 30 && level < 2) {
    failures.push(`Level: ${level} < 2 by T30 (late)`);
  }
  
  // Check L5 timing (T85-100)
  if (turn >= 100 && level < 5) {
    failures.push(`Level: ${level} < 5 by T100`);
  }
  
  // Check dungeon entry (T35-50)
  if (turn >= 50 && dungeonEnteredTurn === null) {
    failures.push('No dungeon entry by T50');
  } else if (turn >= 60 && dungeonEnteredTurn === null) {
    failures.push('No dungeon entry by T60 (late)');
  }
  
  // Check player ratings if available
  if (playerRatings) {
    if (playerRatings.hookClarity < 80) {
      failures.push(`Hook clarity: ${playerRatings.hookClarity}% < 80%`);
    }
    if (playerRatings.durableAgency < 80) {
      failures.push(`Durable agency: ${playerRatings.durableAgency}% < 80%`);
    }
    if (playerRatings.combatNaturalness < 80) {
      failures.push(`Combat naturalness: ${playerRatings.combatNaturalness}% < 80%`);
    }
    if (playerRatings.socialXpWorth < 80) {
      failures.push(`Social XP worth: ${playerRatings.socialXpWorth}% < 80%`);
    }
    if (playerRatings.l2Tempo < 80) {
      failures.push(`L2 tempo satisfaction: ${playerRatings.l2Tempo}% < 80%`);
    }
    if (playerRatings.grindPressure > 20) {
      failures.push(`Grind pressure: ${playerRatings.grindPressure}% > 20%`);
    }
    if (playerRatings.continueDesire < 70) {
      warnings.push(`Continue desire at T40: ${playerRatings.continueDesire}% < 70%`);
    }
  }
  
  return {
    gate: 'G5_PACING',
    passed: failures.length === 0,
    failures,
    warnings,
    telemetry: {
      turn,
      level,
      dungeonEnteredTurn,
      playerRatings
    }
  };
}

// ============================================================================
// Combined Validation
// ============================================================================

/**
 * Run all validation gates
 */
export function validateAllGates(
  mode: EngineMode,
  turn: number,
  events: DensityEvent[],
  hubs: string[],
  hubProperties: Map<string, HubProperties>,
  encounters: string[],
  npcs: string[],
  completedMilestones: string[],
  band?: SpineBand,
  level?: number,
  dungeonEnteredTurn?: number | null,
  depthComponents?: DepthComponents,
  playerRatings?: any
): {
  passed: boolean;
  gates: GateResult[];
  summary: string;
} {
  const gates: GateResult[] = [];
  
  // G1: Density
  gates.push(validateDensityGate(mode, turn, hubs, hubProperties, encounters, npcs));
  
  // G2: Exhaustion
  gates.push(validateExhaustionGate(events, turn));
  
  // G3: Milestones
  if (band) {
    gates.push(validateMilestoneGate(mode, turn, completedMilestones, band));
  }
  
  // G4: Depth wedge (if components provided)
  if (depthComponents) {
    gates.push(validateDepthWedge(depthComponents, playerRatings));
  }
  
  // G5: LitRPG pacing (if LitRPG mode)
  if (mode === 'litrpg' && level !== undefined) {
    gates.push(validateLitRPGPacing(mode, turn, level, dungeonEnteredTurn ?? null, playerRatings));
  }
  
  const passed = gates.every(g => g.passed);
  const failedGates = gates.filter(g => !g.passed).map(g => g.gate);
  const totalFailures = gates.reduce((sum, g) => sum + g.failures.length, 0);
  const totalWarnings = gates.reduce((sum, g) => sum + g.warnings.length, 0);
  
  const summary = passed
    ? `All ${gates.length} gates passed`
    : `${failedGates.length} of ${gates.length} gates failed: ${failedGates.join(', ')} (${totalFailures} failures, ${totalWarnings} warnings)`;
  
  return {
    passed,
    gates,
    summary
  };
}

/**
 * Format gate result for logging
 */
export function formatGateResult(result: GateResult): string {
  const lines: string[] = [];
  
  lines.push(`${result.gate}: ${result.passed ? 'PASS' : 'FAIL'}`);
  
  if (result.score !== undefined && result.threshold !== undefined) {
    lines.push(`  Score: ${result.score.toFixed(2)} (threshold: ${result.threshold})`);
  }
  
  if (result.failures.length > 0) {
    lines.push(`  Failures:`);
    for (const failure of result.failures) {
      lines.push(`    - ${failure}`);
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push(`  Warnings:`);
    for (const warning of result.warnings) {
      lines.push(`    - ${warning}`);
    }
  }
  
  return lines.join('\n');
}
