/**
 * WS-6 Wave C: Exhaustion Curve Tracking
 * 
 * Measures when content becomes repetitive using:
 * - Rolling metrics (UER, ENR, SRR, etc.)
 * - Exhaustion Index (EI) weighted score
 * - Director state (green/yellow/orange/red)
 * - Four-policy autoplay validation
 * 
 * Architecture:
 * - DensityEvent schema tracks every content beat
 * - Novelty classifier determines U/V/R/L per beat
 * - Rolling windows compute metrics over last 20 turns
 * - EI triggers interventions when content exhausted
 */

import type { GameState, EngineMode } from './types';
import {
  NoveltyClass,
  getNoveltyCredit,
  type MaterialDelta,
  isRefreshed,
  isStale,
  type SemanticFamilyId,
  serializeSemanticId,
  type FamilyUsage,
  calculateFamilyConcentration,
  type BeatType
} from './contentDensity';

// ============================================================================
// Density Event Schema
// ============================================================================

/**
 * DensityEvent: append-only log of every content beat
 */
export interface DensityEvent {
  turn: number;
  eventSeq: number;
  beatType: BeatType;
  familyId: string;
  templateId?: string;
  instanceId?: string;
  novelty: NoveltyClass;
  materialDeltas: MaterialDelta[];
  isContentBearing: boolean;
  hasDurableDelta: boolean;
  location: string;
  telegraph?: string;
}

/**
 * Create density event
 */
export function createDensityEvent(
  turn: number,
  eventSeq: number,
  beatType: BeatType,
  familyId: string,
  novelty: NoveltyClass,
  materialDeltas: MaterialDelta[],
  location: string,
  options?: {
    templateId?: string;
    instanceId?: string;
    hasDurableDelta?: boolean;
    telegraph?: string;
  }
): DensityEvent {
  return {
    turn,
    eventSeq,
    beatType,
    familyId,
    templateId: options?.templateId,
    instanceId: options?.instanceId,
    novelty,
    materialDeltas,
    isContentBearing: true,
    hasDurableDelta: options?.hasDurableDelta ?? false,
    location,
    telegraph: options?.telegraph
  };
}

// ============================================================================
// Novelty Classification
// ============================================================================

/**
 * Classify novelty from semantic IDs and material deltas
 */
export function classifyNovelty(
  familyId: string,
  materialDeltas: MaterialDelta[],
  previousUsages: FamilyUsage[],
  terminalNodes: Set<string>
): NoveltyClass {
  // Check for terminal loop
  if (terminalNodes.has(familyId)) {
    return NoveltyClass.L_LOOP;
  }
  
  const usage = previousUsages.find(u => u.familyId === familyId);
  
  // First exposure
  if (!usage || usage.count === 0) {
    return NoveltyClass.U_UNIQUE;
  }
  
  // Reuse - check material changes
  if (isRefreshed(materialDeltas)) {
    return NoveltyClass.V_REFRESHED;
  }
  
  return NoveltyClass.R_STALE;
}

// ============================================================================
// Rolling Metrics
// ============================================================================

/**
 * Rolling metrics over last N turns
 */
export interface RollingMetrics {
  windowSize: number;
  contentBearingBeats: number;
  
  // Core metrics
  UER: number;  // Unique Exposure Rate
  ENR: number;  // Effective Novelty Rate
  SRR: number;  // Stale Repeat Rate
  HRP: number;  // Hub Revisit Pressure
  NRP: number;  // NPC Reappearance Pressure
  FCI: number;  // Family Concentration Index
  NPS: number;  // No-Progress Share
  TCR: number;  // Telegraph Collision Rate
  TLR: number;  // Terminal-Loop Rate
}

/**
 * Calculate rolling metrics from events
 */
export function calculateRollingMetrics(
  events: DensityEvent[],
  windowSize: number = 20
): RollingMetrics {
  // Take last N content-bearing events
  const window = events
    .filter(e => e.isContentBearing)
    .slice(-windowSize);
  
  const N = window.length;
  
  if (N < 5) {
    // Not enough data
    return {
      windowSize,
      contentBearingBeats: N,
      UER: 0,
      ENR: 0,
      SRR: 0,
      HRP: 0,
      NRP: 0,
      FCI: 0,
      NPS: 0,
      TCR: 0,
      TLR: 0
    };
  }
  
  // Count novelty classes
  const U = window.filter(e => e.novelty === NoveltyClass.U_UNIQUE).length;
  const V = window.filter(e => e.novelty === NoveltyClass.V_REFRESHED).length;
  const R = window.filter(e => e.novelty === NoveltyClass.R_STALE).length;
  const L = window.filter(e => e.novelty === NoveltyClass.L_LOOP).length;
  
  // UER: Unique Exposure Rate
  const UER = U / N;
  
  // ENR: Effective Novelty Rate
  const ENR = (U + 0.6 * V) / N;
  
  // SRR: Stale Repeat Rate
  const SRR = (R + L) / N;
  
  // HRP: Hub Revisit Pressure
  const hubEvents = window.filter(e => e.beatType === 'hub');
  const unchangedHubRevisits = hubEvents.filter(e => e.novelty === NoveltyClass.R_STALE).length;
  const HRP = hubEvents.length > 0 ? unchangedHubRevisits / hubEvents.length : 0;
  
  // NRP: NPC Reappearance Pressure
  const npcEvents = window.filter(e => e.beatType === 'npc');
  const unchangedNpcReappears = npcEvents.filter(e => e.novelty === NoveltyClass.R_STALE).length;
  const NRP = npcEvents.length > 0 ? unchangedNpcReappears / npcEvents.length : 0;
  
  // FCI: Family Concentration Index
  const familyCounts = new Map<string, number>();
  for (const event of window) {
    const count = familyCounts.get(event.familyId) || 0;
    familyCounts.set(event.familyId, count + 1);
  }
  const usages: FamilyUsage[] = Array.from(familyCounts.entries()).map(([familyId, count]) => ({
    familyId,
    count,
    lastUsedTurn: window[window.length - 1].turn,
    lastNovelty: window[window.length - 1].novelty
  }));
  const FCI = calculateFamilyConcentration(usages);
  
  // NPS: No-Progress Share
  const noProgressBeats = window.filter(e => !e.hasDurableDelta).length;
  const NPS = noProgressBeats / N;
  
  // TCR: Telegraph Collision Rate
  const telegraphMap = new Map<string, Set<string>>();
  for (const event of window) {
    if (event.telegraph) {
      if (!telegraphMap.has(event.telegraph)) {
        telegraphMap.set(event.telegraph, new Set());
      }
      telegraphMap.get(event.telegraph)!.add(event.familyId);
    }
  }
  let collisions = 0;
  for (const families of telegraphMap.values()) {
    if (families.size > 1) collisions++;
  }
  const TCR = window.length > 0 ? collisions / window.length : 0;
  
  // TLR: Terminal-Loop Rate
  const TLR = L / N;
  
  return {
    windowSize,
    contentBearingBeats: N,
    UER,
    ENR,
    SRR,
    HRP,
    NRP,
    FCI,
    NPS,
    TCR,
    TLR
  };
}

// ============================================================================
// Exhaustion Index
// ============================================================================

/**
 * Calculate Exhaustion Index (0-100)
 * 
 * EI = 100 × (0.25·SRR + 0.15·FCI + 0.10·HRP + 0.10·NRP + 0.20·NPS + 0.10·TCR + 0.10·TLR)
 */
export function calculateExhaustionIndex(metrics: RollingMetrics): number {
  const EI = 100 * (
    0.25 * metrics.SRR +
    0.15 * metrics.FCI +
    0.10 * metrics.HRP +
    0.10 * metrics.NRP +
    0.20 * metrics.NPS +
    0.10 * metrics.TCR +
    0.10 * metrics.TLR
  );
  
  return Math.min(100, Math.max(0, EI));
}

/**
 * Exhaustion state based on EI
 */
export enum ExhaustionState {
  GREEN = 'green',     // 0-34: Healthy
  YELLOW = 'yellow',   // 35-49: Warning
  ORANGE = 'orange',   // 50-64: High risk
  RED = 'red'          // 65-100: Exhausted
}

/**
 * Get exhaustion state from EI
 */
export function getExhaustionState(ei: number): ExhaustionState {
  if (ei >= 65) return ExhaustionState.RED;
  if (ei >= 50) return ExhaustionState.ORANGE;
  if (ei >= 35) return ExhaustionState.YELLOW;
  return ExhaustionState.GREEN;
}

/**
 * Get director action for exhaustion state
 */
export function getDirectorAction(state: ExhaustionState): string {
  switch (state) {
    case ExhaustionState.GREEN:
      return 'Normal selection';
    case ExhaustionState.YELLOW:
      return 'Diversify, schedule payoff';
    case ExhaustionState.ORANGE:
      return 'Force unused content, inject milestone';
    case ExhaustionState.RED:
      return 'Fail trace, force exit/ending';
  }
}

// ============================================================================
// Density State
// ============================================================================

/**
 * Content density state (extends ArcDirector)
 */
export interface ContentDensityState {
  currentBand: string;
  nextDueMilestone: string | null;
  dueTurn: number | null;
  exhaustionPressure: ExhaustionState;
  suppressedFamilies: string[];
  recommendedIntervention: string;
  
  // Event log
  densityEvents: DensityEvent[];
  
  // Terminal nodes (defeated bosses, closed wings, ended crises)
  terminalNodes: Set<string>;
  
  // Family usage tracking
  familyUsages: FamilyUsage[];
  
  // Metrics cache
  lastMetrics?: RollingMetrics;
  lastEI?: number;
}

/**
 * Initialize density state
 */
export function initContentDensityState(): ContentDensityState {
  return {
    currentBand: 'T0-30',
    nextDueMilestone: null,
    dueTurn: null,
    exhaustionPressure: ExhaustionState.GREEN,
    suppressedFamilies: [],
    recommendedIntervention: 'Normal selection',
    densityEvents: [],
    terminalNodes: new Set(),
    familyUsages: []
  };
}

/**
 * Record density event
 */
export function recordDensityEvent(
  state: ContentDensityState,
  event: DensityEvent
): ContentDensityState {
  const events = [...state.densityEvents, event];
  
  // Update family usage
  const familyUsages = [...state.familyUsages];
  const existing = familyUsages.find(u => u.familyId === event.familyId);
  
  if (existing) {
    existing.count++;
    existing.lastUsedTurn = event.turn;
    existing.lastNovelty = event.novelty;
  } else {
    familyUsages.push({
      familyId: event.familyId,
      count: 1,
      lastUsedTurn: event.turn,
      lastNovelty: event.novelty
    });
  }
  
  // Calculate metrics
  const metrics = calculateRollingMetrics(events, 20);
  const ei = calculateExhaustionIndex(metrics);
  const exhaustionPressure = getExhaustionState(ei);
  
  // Update suppressed families (high concentration)
  const suppressed = familyUsages
    .filter(u => {
      const concentration = u.count / Math.max(20, events.length);
      return concentration > 0.30;
    })
    .map(u => u.familyId);
  
  return {
    ...state,
    densityEvents: events,
    familyUsages,
    exhaustionPressure,
    suppressedFamilies: suppressed,
    recommendedIntervention: getDirectorAction(exhaustionPressure),
    lastMetrics: metrics,
    lastEI: ei
  };
}

/**
 * Mark node as terminal (defeated boss, closed wing, ended crisis)
 */
export function markTerminalNode(
  state: ContentDensityState,
  nodeId: string
): ContentDensityState {
  const terminalNodes = new Set(state.terminalNodes);
  terminalNodes.add(nodeId);
  
  return {
    ...state,
    terminalNodes
  };
}

/**
 * Check if family is suppressed (overused)
 */
export function isFamilySuppressed(
  state: ContentDensityState,
  familyId: string
): boolean {
  return state.suppressedFamilies.includes(familyId);
}

// ============================================================================
// Drought and Durable Delta Tracking
// ============================================================================

/**
 * Check durable delta timing
 */
export function checkDurableDeltaTiming(
  events: DensityEvent[],
  maxGap: number
): {
  lastDurableDeltaTurn: number | null;
  turnsSinceDurableDelta: number;
  isDrought: boolean;
} {
  const contentEvents = events.filter(e => e.isContentBearing);
  
  if (contentEvents.length === 0) {
    return {
      lastDurableDeltaTurn: null,
      turnsSinceDurableDelta: 0,
      isDrought: false
    };
  }
  
  const lastTurn = contentEvents[contentEvents.length - 1].turn;
  
  // Find last durable delta
  for (let i = contentEvents.length - 1; i >= 0; i--) {
    if (contentEvents[i].hasDurableDelta) {
      const gap = lastTurn - contentEvents[i].turn;
      return {
        lastDurableDeltaTurn: contentEvents[i].turn,
        turnsSinceDurableDelta: gap,
        isDrought: gap > maxGap
      };
    }
  }
  
  // No durable delta yet
  return {
    lastDurableDeltaTurn: null,
    turnsSinceDurableDelta: contentEvents.length,
    isDrought: contentEvents.length > maxGap
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if repeat dominance threshold violated
 */
export function hasRepeatDominance(
  events: DensityEvent[],
  turn: number,
  threshold: number = 100
): boolean {
  if (turn > threshold) return false;
  
  const recentEvents = events
    .filter(e => e.isContentBearing && e.turn <= threshold)
    .slice(-20);
  
  if (recentEvents.length < 10) return false;
  
  const staleCount = recentEvents.filter(
    e => e.novelty === NoveltyClass.R_STALE || e.novelty === NoveltyClass.L_LOOP
  ).length;
  
  // More than 50% stale = repeat dominance
  return (staleCount / recentEvents.length) > 0.50;
}

/**
 * Check terminal loop violation
 */
export function hasTerminalLoop(events: DensityEvent[]): boolean {
  return events.some(e => e.novelty === NoveltyClass.L_LOOP);
}

/**
 * Format exhaustion summary for telemetry
 */
export function formatExhaustionSummary(
  state: ContentDensityState
): string {
  const metrics = state.lastMetrics;
  const ei = state.lastEI ?? 0;
  
  if (!metrics) {
    return 'No metrics available';
  }
  
  return [
    `EI: ${ei.toFixed(1)} (${state.exhaustionPressure})`,
    `UER: ${(metrics.UER * 100).toFixed(1)}%`,
    `ENR: ${(metrics.ENR * 100).toFixed(1)}%`,
    `SRR: ${(metrics.SRR * 100).toFixed(1)}%`,
    `Suppressed: ${state.suppressedFamilies.length} families`,
    `Action: ${state.recommendedIntervention}`
  ].join(' | ');
}
