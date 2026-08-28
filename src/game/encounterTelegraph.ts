/**
 * WS-4 Wave 1: Encounter Telegraph System
 * 
 * Manages pre-engagement warnings and cues to make encounters legible before commitment.
 */

import type { GameState, EngineMode } from './types';
import type { EncounterTemplate, TelegraphPattern } from './encounterBible';

// ============================================================================
// TELEGRAPH CATALOG SCHEMA
// ============================================================================

export interface TelegraphCatalogEntry {
  id: string;
  channel: 'status' | 'npc' | 'scene' | 'item' | 'faction';
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

// ============================================================================
// CATALOG LOADING
// ============================================================================

let _catalogCache: TelegraphCatalog | null = null;

/**
 * Load the telegraph catalog from JSON.
 * Cached after first load.
 */
export async function loadTelegraphCatalog(): Promise<TelegraphCatalog> {
  if (_catalogCache) {
    return _catalogCache;
  }

  try {
    const response = await fetch('/data/encounters/D6_telegraph_catalog.json');
    if (!response.ok) {
      throw new Error(`Failed to load telegraph catalog: ${response.statusText}`);
    }
    
    const catalog = await response.json() as TelegraphCatalog;
    _catalogCache = catalog;
    return catalog;
  } catch (error) {
    console.error('Failed to load telegraph catalog:', error);
    // Return a minimal fallback catalog
    return {
      schemaVersion: '1.0.0',
      catalogId: 'ws4.telegraph.fallback',
      selectionPolicy: {
        preEngagementCoverageTarget: 0.8,
        defaultMinimumChannels: 1,
        eliteMinimumChannels: 2,
        bossMinimumChannels: 3,
        maxSamePatternConsecutive: 2,
        surprisePolicy: {
          maximumShare: 0.2,
          requiresSurpriseEligibleTemplate: true,
          requiresSuspicionCueOrReactionWindow: true,
          openingSeverityCap: 'moderate',
        },
      },
      patterns: [],
    };
  }
}

/**
 * Clear the catalog cache (for testing).
 */
export function clearTelegraphCache(): void {
  _catalogCache = null;
}

// ============================================================================
// CUE SELECTION
// ============================================================================

/**
 * Select telegraph cues for a template based on its role and channels.
 */
export function selectTelegraphCues(
  template: EncounterTemplate,
  mode: EngineMode,
  catalog: TelegraphCatalog
): TelegraphPattern[] {
  const { role } = template;
  const requiredChannels = template.telegraph.channels;
  
  // Determine minimum channels based on role
  let minChannels = catalog.selectionPolicy.defaultMinimumChannels;
  if (role === 'elite' || role === 'duel') {
    minChannels = catalog.selectionPolicy.eliteMinimumChannels;
  } else if (role === 'boss' || role === 'raid') {
    minChannels = catalog.selectionPolicy.bossMinimumChannels;
  }
  
  // Filter patterns that match mode and required channels
  const eligiblePatterns = catalog.patterns.filter(
    (p) => p.appliesTo.includes(mode) && requiredChannels.includes(p.channel)
  );
  
  if (eligiblePatterns.length === 0) {
    return [];
  }
  
  // Select patterns ensuring coverage across channels
  const selectedPatterns: TelegraphPattern[] = [];
  const channelCoverage = new Set<string>();
  
  // First, ensure we have at least one pattern per required channel
  for (const channel of requiredChannels) {
    const channelPatterns = eligiblePatterns.filter((p) => p.channel === channel);
    if (channelPatterns.length > 0) {
      // Pick a random pattern for this channel (in Wave 1, just pick first)
      const pattern = channelPatterns[0];
      selectedPatterns.push({
        type: pattern.channel,
        text: pattern.inference,
        probability: 1.0,
      });
      channelCoverage.add(channel);
    }
  }
  
  // If we still need more patterns to meet minimum channels, add more
  while (selectedPatterns.length < minChannels && eligiblePatterns.length > selectedPatterns.length) {
    for (const pattern of eligiblePatterns) {
      if (selectedPatterns.length >= minChannels) break;
      
      // Skip if we already have this pattern
      if (selectedPatterns.some((p) => p.text === pattern.inference)) {
        continue;
      }
      
      selectedPatterns.push({
        type: pattern.channel,
        text: pattern.inference,
        probability: 0.8,
      });
    }
  }
  
  return selectedPatterns;
}

/**
 * Build telegraph section for situation packet.
 */
export function buildTelegraphContext(
  template: EncounterTemplate | null,
  state: GameState
): string | null {
  if (!template || !template.telegraph.required) {
    return null;
  }
  
  const { timing, patterns } = template.telegraph;
  
  if (timing === 'none' || patterns.length === 0) {
    return null;
  }
  
  const cueTexts = patterns.map((p) => `[${p.type.toUpperCase()}] ${p.text}`);
  
  return `TELEGRAPH (${timing}):\n${cueTexts.join('\n')}`;
}

/**
 * Check if a template should be a surprise encounter (no telegraph).
 */
export function isSurpriseEligible(
  template: EncounterTemplate,
  state: GameState
): boolean {
  if (!template.telegraph.avoidable) {
    return false;
  }
  
  // Check if this is an opening encounter (should not be severe surprise)
  const turn = state.turn ?? 0;
  if (turn < 5 && template.tierRange[0] > 1) {
    return false;
  }
  
  return true;
}
