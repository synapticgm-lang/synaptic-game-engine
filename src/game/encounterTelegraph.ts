/**
 * WS-4 Wave 1: Encounter Telegraph System
 * 
 * Manages pre-engagement warnings and cues to make encounters legible before commitment.
 */

import type { GameState, EngineMode } from './types';
import telegraphCatalogData from './data/encounters/D6_telegraph_catalog.json';

// ============================================================================
// TELEGRAPH CATALOG SCHEMA
// ============================================================================

export type TelegraphChannel = 'status' | 'npc' | 'scene' | 'item' | 'faction';

export interface TelegraphCatalogEntry {
  id: string;
  channel: TelegraphChannel;
  appliesTo: EngineMode[];
  signalTemplate: string;
  inference: string;
  actionHooks: string[];
  minResponseTurns: number;
  example: string;
}

export interface TelegraphCatalog {
  schemaVersion: string;
  catalogId: string;
  selectionPolicy: {
    preEngagementCoverageTarget: number;
    defaultMinimumChannels: number;
    eliteMinimumChannels: number;
    bossMinimumChannels: number;
    maxSamePatternConsecutive: number;
    surprisePolicy: {
      maximumShare: number;
      requiresSurpriseEligibleTemplate: boolean;
      requiresSuspicionCueOrReactionWindow: boolean;
      openingSeverityCap: string;
    };
  };
  patterns: TelegraphCatalogEntry[];
}

export interface TelegraphPattern {
  type: string;
  text: string;
  probability: number;
}

/** The slice of an encounter template the telegraph needs. */
export interface TelegraphTemplate {
  densityRole?: string;
  tierRange: [number, number];
  telegraph: {
    timing: string;
    patterns: TelegraphPattern[];
    channels?: string[];
    avoidable?: boolean;
  };
}

// ============================================================================
// CATALOG LOADING
// ============================================================================

const CATALOG = telegraphCatalogData as unknown as TelegraphCatalog;

/** Bundled catalog — sync, same data in browser, Node and tests. */
export function getTelegraphCatalog(): TelegraphCatalog {
  return CATALOG;
}

export async function loadTelegraphCatalog(): Promise<TelegraphCatalog> {
  return CATALOG;
}

/** Kept for tests; the catalog is a static import. */
export function clearTelegraphCache(): void {}

// ============================================================================
// CUE SELECTION
// ============================================================================

function minimumChannels(role: string | undefined, catalog: TelegraphCatalog): number {
  if (role === 'elite' || role === 'miniboss') return catalog.selectionPolicy.eliteMinimumChannels;
  if (role === 'boss') return catalog.selectionPolicy.bossMinimumChannels;
  return catalog.selectionPolicy.defaultMinimumChannels;
}

/**
 * Select telegraph cues for a template based on its role and channels.
 * `rotate` picks a different pattern per channel on later spawns.
 */
export function selectTelegraphCues(
  template: TelegraphTemplate,
  mode: EngineMode,
  catalog: TelegraphCatalog,
  rotate = 0
): TelegraphPattern[] {
  const requiredChannels = Array.from(
    new Set(template.telegraph.channels ?? template.telegraph.patterns.map((p) => p.type))
  );
  const minChannels = minimumChannels(template.densityRole, catalog);
  const eligiblePatterns = catalog.patterns.filter(
    (p) => p.appliesTo.includes(mode) && requiredChannels.includes(p.channel)
  );
  if (eligiblePatterns.length === 0) return [];

  const selectedPatterns: TelegraphPattern[] = [];
  for (const channel of requiredChannels) {
    const channelPatterns = eligiblePatterns.filter((p) => p.channel === channel);
    if (channelPatterns.length > 0) {
      const pattern = channelPatterns[Math.abs(rotate) % channelPatterns.length]!;
      selectedPatterns.push({ type: pattern.channel, text: pattern.inference, probability: 1.0 });
    }
  }
  for (const pattern of eligiblePatterns) {
    if (selectedPatterns.length >= minChannels) break;
    if (selectedPatterns.some((p) => p.text === pattern.inference)) continue;
    selectedPatterns.push({ type: pattern.channel, text: pattern.inference, probability: 0.8 });
  }
  return selectedPatterns;
}

/**
 * Build telegraph section for the writer packet.
 */
export function buildTelegraphContext(
  template: TelegraphTemplate | null,
  _state: GameState
): string | null {
  if (!template || !template.telegraph) return null;
  const { timing, patterns } = template.telegraph;
  if (timing === 'none' || !patterns || patterns.length === 0) return null;
  const cueTexts = patterns.map((p) => `[${p.type.toUpperCase()}] ${p.text}`);
  return `TELEGRAPH (${timing}):\n${cueTexts.join('\n')}`;
}

/**
 * Check if a template should be a surprise encounter (no telegraph).
 */
export function isSurpriseEligible(
  template: TelegraphTemplate,
  state: GameState
): boolean {
  if (!template.telegraph.avoidable) return false;
  const turn = state.turn ?? 0;
  if (turn < 5 && template.tierRange[0] > 1) return false;
  return true;
}

const TIER_CHANNELS: Record<string, TelegraphChannel[]> = {
  trash: ['scene'],
  elite: ['scene', 'npc'],
  boss: ['scene', 'npc', 'status'],
};

/** Drought spawn preface — cue lines for a pending encounter of this threat tier. */
export function telegraphForPendingSpawn(
  threatTier: string | undefined,
  state: GameState
): string | null {
  const role = threatTier === 'boss' ? 'boss' : threatTier === 'elite' ? 'elite' : 'trash';
  const channels = TIER_CHANNELS[role]!;
  const template: TelegraphTemplate = {
    densityRole: role,
    tierRange: [1, 1],
    telegraph: { timing: '1-turn-before', patterns: [], channels, avoidable: true },
  };
  const cues = selectTelegraphCues(template, state.engineMode, getTelegraphCatalog(), state.turn ?? 0);
  if (!cues.length) return null;
  return buildTelegraphContext({ ...template, telegraph: { ...template.telegraph, patterns: cues } }, state);
}
