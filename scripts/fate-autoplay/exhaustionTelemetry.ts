/**
 * WS-6 Wave C: Exhaustion Telemetry for Fate Autoplay
 * 
 * Tracks exhaustion metrics during autoplay runs:
 * - Per-turn density events
 * - Rolling metrics windows
 * - Exhaustion Index progression
 * - Family concentration tracking
 * - Terminal loop detection
 */

import type { GameState } from '../../src/game/types';
import type {
  DensityEvent,
  RollingMetrics,
  ContentDensityState
} from '../../src/game/exhaustionCurve';
import {
  calculateRollingMetrics,
  calculateExhaustionIndex,
  getExhaustionState,
  formatExhaustionSummary,
  hasRepeatDominance,
  hasTerminalLoop
} from '../../src/game/exhaustionCurve';
import type { GateResult } from '../../src/game/densityValidation';
import { validateAllGates } from '../../src/game/densityValidation';
import { getBandForTurn } from '../../src/game/spineMapRegistry';
import type { HubProperties } from '../../src/game/contentDensity';
import { isQualifiedHub } from '../../src/game/contentDensity';

// ============================================================================
// Telemetry Schema
// ============================================================================

export interface ExhaustionTelemetry {
  turn: number;
  metrics: RollingMetrics;
  ei: number;
  state: string;
  suppressedFamilies: string[];
  totalEvents: number;
  uniqueFamilies: number;
  terminalLoops: number;
  repeatDominance: boolean;
}

export interface TurnTelemetry {
  turn: number;
  densityEvent?: DensityEvent;
  exhaustion: ExhaustionTelemetry;
  milestones?: string[];
  gateResults?: GateResult[];
}

export interface RunTelemetry {
  runId: string;
  mode: string;
  policy: string;
  seed: number;
  turns: TurnTelemetry[];
  finalGates: GateResult[];
  summary: {
    totalTurns: number;
    totalEvents: number;
    uniqueFamilies: number;
    qualifiedHubs: number;
    encounters: number;
    npcs: number;
    completedMilestones: number;
    finalEI: number;
    finalState: string;
    passed: boolean;
  };
}

// ============================================================================
// Telemetry Collection
// ============================================================================

/**
 * Collect exhaustion telemetry for a single turn
 */
export function collectExhaustionTelemetry(
  state: ContentDensityState,
  turn: number
): ExhaustionTelemetry {
  const events = state.densityEvents.filter(e => e.isContentBearing);
  const metrics = calculateRollingMetrics(events, 20);
  const ei = calculateExhaustionIndex(metrics);
  const exhaustionState = getExhaustionState(ei);
  
  const uniqueFamilies = new Set(events.map(e => e.familyId)).size;
  const terminalLoops = events.filter(e => e.novelty === 'L_LOOP').length;
  
  return {
    turn,
    metrics,
    ei,
    state: exhaustionState,
    suppressedFamilies: state.suppressedFamilies,
    totalEvents: events.length,
    uniqueFamilies,
    terminalLoops,
    repeatDominance: hasRepeatDominance(events, turn, 100)
  };
}

/**
 * Collect turn telemetry
 */
export function collectTurnTelemetry(
  densityState: ContentDensityState,
  turn: number,
  densityEvent?: DensityEvent,
  completedMilestones?: string[]
): TurnTelemetry {
  return {
    turn,
    densityEvent,
    exhaustion: collectExhaustionTelemetry(densityState, turn),
    milestones: completedMilestones
  };
}

/**
 * Generate exhaustion progression chart data
 */
export function generateExhaustionChart(
  telemetry: TurnTelemetry[]
): {
  turns: number[];
  ei: number[];
  uer: number[];
  enr: number[];
  srr: number[];
  fci: number[];
} {
  return {
    turns: telemetry.map(t => t.turn),
    ei: telemetry.map(t => t.exhaustion.ei),
    uer: telemetry.map(t => t.exhaustion.metrics.UER),
    enr: telemetry.map(t => t.exhaustion.metrics.ENR),
    srr: telemetry.map(t => t.exhaustion.metrics.SRR),
    fci: telemetry.map(t => t.exhaustion.metrics.FCI)
  };
}

/**
 * Generate family concentration heatmap
 */
export function generateFamilyHeatmap(
  densityState: ContentDensityState
): Array<{
  familyId: string;
  count: number;
  concentration: number;
  lastTurn: number;
}> {
  const totalEvents = densityState.densityEvents.filter(e => e.isContentBearing).length;
  
  return densityState.familyUsages
    .map(u => ({
      familyId: u.familyId,
      count: u.count,
      concentration: totalEvents > 0 ? u.count / totalEvents : 0,
      lastTurn: u.lastUsedTurn
    }))
    .sort((a, b) => b.concentration - a.concentration);
}

/**
 * Generate milestone timing chart
 */
export function generateMilestoneChart(
  mode: string,
  completedMilestones: Array<{ id: string; turn: number; overdue: boolean }>
): Array<{
  milestoneId: string;
  targetStart: number;
  targetEnd: number;
  actualTurn: number;
  overdue: boolean;
}> {
  // This would need spine map data to get target windows
  return completedMilestones.map(m => ({
    milestoneId: m.id,
    targetStart: 0, // Would get from spine map
    targetEnd: 0,   // Would get from spine map
    actualTurn: m.turn,
    overdue: m.overdue
  }));
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate exhaustion report
 */
export function generateExhaustionReport(
  runTelemetry: RunTelemetry
): string {
  const lines: string[] = [];
  
  lines.push(`# Exhaustion Report: ${runTelemetry.runId}`);
  lines.push('');
  lines.push(`Mode: ${runTelemetry.mode}`);
  lines.push(`Policy: ${runTelemetry.policy}`);
  lines.push(`Seed: ${runTelemetry.seed}`);
  lines.push(`Turns: ${runTelemetry.summary.totalTurns}`);
  lines.push('');
  
  // Final metrics
  const finalTurn = runTelemetry.turns[runTelemetry.turns.length - 1];
  if (finalTurn) {
    lines.push('## Final Metrics');
    lines.push('');
    lines.push(`EI: ${finalTurn.exhaustion.ei.toFixed(1)} (${finalTurn.exhaustion.state})`);
    lines.push(`UER: ${(finalTurn.exhaustion.metrics.UER * 100).toFixed(1)}%`);
    lines.push(`ENR: ${(finalTurn.exhaustion.metrics.ENR * 100).toFixed(1)}%`);
    lines.push(`SRR: ${(finalTurn.exhaustion.metrics.SRR * 100).toFixed(1)}%`);
    lines.push(`FCI: ${finalTurn.exhaustion.metrics.FCI.toFixed(3)}`);
    lines.push('');
  }
  
  // Content summary
  lines.push('## Content Summary');
  lines.push('');
  lines.push(`Total Events: ${runTelemetry.summary.totalEvents}`);
  lines.push(`Unique Families: ${runTelemetry.summary.uniqueFamilies}`);
  lines.push(`Qualified Hubs: ${runTelemetry.summary.qualifiedHubs}`);
  lines.push(`Encounters: ${runTelemetry.summary.encounters}`);
  lines.push(`NPCs: ${runTelemetry.summary.npcs}`);
  lines.push(`Milestones: ${runTelemetry.summary.completedMilestones}`);
  lines.push('');
  
  // Gate results
  lines.push('## Gate Results');
  lines.push('');
  for (const gate of runTelemetry.finalGates) {
    lines.push(`### ${gate.gate}: ${gate.passed ? 'PASS' : 'FAIL'}`);
    lines.push('');
    
    if (gate.score !== undefined) {
      lines.push(`Score: ${gate.score.toFixed(2)} / ${gate.threshold}`);
    }
    
    if (gate.failures.length > 0) {
      lines.push('');
      lines.push('**Failures:**');
      for (const failure of gate.failures) {
        lines.push(`- ${failure}`);
      }
    }
    
    if (gate.warnings.length > 0) {
      lines.push('');
      lines.push('**Warnings:**');
      for (const warning of gate.warnings) {
        lines.push(`- ${warning}`);
      }
    }
    
    lines.push('');
  }
  
  // Exhaustion progression
  lines.push('## Exhaustion Progression');
  lines.push('');
  lines.push('| Turn | EI | UER | ENR | SRR | State |');
  lines.push('|------|-----|-----|-----|-----|-------|');
  
  // Sample every 10 turns
  for (let i = 0; i < runTelemetry.turns.length; i += 10) {
    const t = runTelemetry.turns[i];
    if (t) {
      lines.push(
        `| ${t.turn} | ${t.exhaustion.ei.toFixed(1)} | ` +
        `${(t.exhaustion.metrics.UER * 100).toFixed(1)}% | ` +
        `${(t.exhaustion.metrics.ENR * 100).toFixed(1)}% | ` +
        `${(t.exhaustion.metrics.SRR * 100).toFixed(1)}% | ` +
        `${t.exhaustion.state} |`
      );
    }
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Export telemetry to JSON
 */
export function exportTelemetryJSON(
  runTelemetry: RunTelemetry,
  filepath: string
): void {
  const json = JSON.stringify(runTelemetry, null, 2);
  require('fs').writeFileSync(filepath, json, 'utf8');
}

/**
 * Export exhaustion chart CSV
 */
export function exportExhaustionChartCSV(
  telemetry: TurnTelemetry[],
  filepath: string
): void {
  const lines: string[] = [];
  lines.push('turn,ei,uer,enr,srr,fci,state,suppressedFamilies');
  
  for (const t of telemetry) {
    lines.push(
      `${t.turn},` +
      `${t.exhaustion.ei.toFixed(3)},` +
      `${t.exhaustion.metrics.UER.toFixed(3)},` +
      `${t.exhaustion.metrics.ENR.toFixed(3)},` +
      `${t.exhaustion.metrics.SRR.toFixed(3)},` +
      `${t.exhaustion.metrics.FCI.toFixed(3)},` +
      `${t.exhaustion.state},` +
      `${t.exhaustion.suppressedFamilies.length}`
    );
  }
  
  require('fs').writeFileSync(filepath, lines.join('\n'), 'utf8');
}

/**
 * Log exhaustion summary to console
 */
export function logExhaustionSummary(
  turn: number,
  exhaustion: ExhaustionTelemetry
): void {
  console.log(
    `[T${turn.toString().padStart(3, '0')}] ` +
    `EI: ${exhaustion.ei.toFixed(1)} (${exhaustion.state}) | ` +
    `UER: ${(exhaustion.metrics.UER * 100).toFixed(1)}% | ` +
    `SRR: ${(exhaustion.metrics.SRR * 100).toFixed(1)}% | ` +
    `Families: ${exhaustion.uniqueFamilies} | ` +
    `Suppressed: ${exhaustion.suppressedFamilies.length}`
  );
}
