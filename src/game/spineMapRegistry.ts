/**
 * WS-6 Wave B: Spine Map Registry
 * 
 * Loads and validates authoritative spine maps from spine_maps.json.
 * Defines content milestones, density targets, and anti-loop rules per mode and turn band.
 * 
 * Architecture:
 * - 4 modes (LitRPG, DnD, Story RPG, PYOA)
 * - 12 bands (T0-30, T30-100, T100-300 per mode)
 * - Milestone contracts with prerequisites and durable outcomes
 * - Genre telegraphs and anti-loop checks
 */

import type { EngineMode } from './types';
import spineMapData from '../../docs/research/pasted/manus-ws-6-content-density-2026-08-28/spine_maps.json';

// ============================================================================
// Types
// ============================================================================

export interface NoveltyPolicy {
  uniqueFloor: number;
  staleCeiling: number;
  maxStaleRepeatStreak: number;
  durableDeltaEveryTurns: number;
  maxDurableDeltaGap: number;
}

export interface ModeTargets {
  // LitRPG specific
  cumulativeHubsByT100?: [number, number];
  additionalHubsT101T300?: [number, number];
  cumulativeResolvedEncountersByT100?: [number, number];
  additionalResolvedEncountersT101T300?: [number, number];
  cumulativeNamedNpcsByT100?: [number, number];
  meaningfulNamedNpcsByT300?: [number, number];
  levels?: { T25: number; T100: number; T300Minimum: number };
  firstDungeonEnteredBy?: number;

  // DnD specific
  cumulativeFunctionalZonesByT100?: [number, number];
  additionalZonesT101T300?: [number, number];
  challengeScenesPer100Turns?: [number, number];
  nonCombatChallengeScenesPer100Turns?: [number, number];
  combatShareCeiling?: number;
  corePartySize?: [number, number];
  partyBeatEveryTurns?: [number, number];
  majorSetPieceEveryTurns?: [number, number];

  // Story RPG specific
  cumulativeSocialHubsByT100?: [number, number];
  additionalOrRecontextualizedVenuesT101T300?: [number, number];
  socialConfrontationsPer100Turns?: [number, number];
  actionScenesPer100Turns?: [number, number];
  npcTurnoverEventsPer100Turns?: [number, number];
  leverageOrMoralBeatEveryTurns?: [number, number];
  factionShiftEveryTurns?: [number, number];

  // PYOA specific
  cumulativeLocationsOrFramesByT100?: [number, number];
  majorCrisisEveryTurns?: [number, number];
  openingCrisisTurns?: [number, number];
  firstForkTurns?: [number, number];
  cumulativeMeaningfulForksByT100?: [number, number];
  delayedPayoffLatencyTurns?: [number, number];
  endingGateTurns?: [number, number];
  campaignEndBy?: number;
  postEndingRequirement?: string;
}

export interface Profile {
  profileId: string;
  label: string;
  emphasis: string;
  hubTargetByT100?: [number, number];
  requiredDistinctives: string[];
  releaseBlocker?: string;
}

export interface Milestone {
  id: string;
  targetTurns: [number, number];
  requires: string[];
  durableOutcomes: string[];
}

export interface Quantities {
  hubsOrZones?: [number, number];
  questTransitions?: [number, number];
  resolvedEncounters?: [number, number];
  namedNpcIntroductions?: [number, number];
  namedNpcRoleChangesOrExits?: [number, number];
  factionDeltas?: [number, number];
  optionalDiscoveries?: [number, number];
  
  // DnD specific
  dungeonWingsOrExpeditionZones?: [number, number];
  challengeScenes?: [number, number];
  nonCombatChallenges?: [number, number];
  namedNpcIntroductionsOrRoleChanges?: [number, number];
  partyRelationshipDeltas?: [number, number];
  majorSetPieces?: [number, number];

  // Story RPG specific
  socialHubsOrVenues?: [number, number];
  socialConfrontations?: [number, number];
  actionOrCombatScenes?: [number, number];
  leverageTopics?: [number, number];
  moralWeightBeats?: [number, number];
  leverageOrMoralWeightBeats?: [number, number];
  newOrRecontextualizedVenues?: [number, number];
  endingPatterns?: [number, number];

  // PYOA specific
  locationsOrFrames?: [number, number];
  majorCrises?: [number, number];
  meaningfulForks?: [number, number];
  exclusiveFacts?: [number, number];
  namedFigureIntroductions?: [number, number];
  relationshipOrAllegianceDeltas?: [number, number];
  delayedPayoffsScheduled?: [number, number];
  namedFigureRoleChangesOrExits?: [number, number];
  delayedPayoffsManifested?: [number, number];
  newLocationsOrFrames?: [number, number];
  meaningfulFinalChoices?: [number, number];
  newExclusiveFacts?: [number, number];

  // LitRPG T100-300 specific
  additionalDungeons?: [number, number];
}

export interface SpineBand {
  bandId: string;
  turns: [number, number];
  purpose: string;
  quantities: Quantities;
  milestones: Milestone[];
  genreTelegraphs: string[];
  antiLoopChecks: string[];
  exitCondition: string;
}

export interface ModeSpineMap {
  mode: string;
  modeTargets: ModeTargets;
  profiles: Profile[];
  bands: SpineBand[];
}

export interface SpineMapData {
  schemaVersion: string;
  commission: string;
  status: string;
  measurementNotes: Record<string, string>;
  sharedNoveltyPolicy: Record<string, NoveltyPolicy>;
  modes: ModeSpineMap[];
}

// ============================================================================
// Registry
// ============================================================================

const SPINE_MAP_VERSION = '1.0.0';
let cachedSpineMap: SpineMapData | null = null;

/**
 * Load spine maps from JSON
 */
export function loadSpineMaps(): SpineMapData {
  if (cachedSpineMap) return cachedSpineMap;
  
  const data = spineMapData as SpineMapData;
  
  if (data.schemaVersion !== SPINE_MAP_VERSION) {
    console.warn(`Spine map version mismatch: expected ${SPINE_MAP_VERSION}, got ${data.schemaVersion}`);
  }
  
  cachedSpineMap = data;
  return data;
}

/**
 * Get spine map for a specific mode
 */
export function getSpineMapForMode(mode: EngineMode): ModeSpineMap | null {
  const data = loadSpineMaps();
  
  const modeMap: Record<EngineMode, string> = {
    litrpg: 'LitRPG',
    dnd: 'DnD',
    rpg: 'Story RPG',
    pyoa: 'PYOA'
  };
  
  const modeName = modeMap[mode];
  return data.modes.find(m => m.mode === modeName) || null;
}

/**
 * Get band for current turn
 */
export function getBandForTurn(mode: EngineMode, turn: number): SpineBand | null {
  const spineMap = getSpineMapForMode(mode);
  if (!spineMap) return null;
  
  return spineMap.bands.find(b => turn >= b.turns[0] && turn <= b.turns[1]) || null;
}

/**
 * Get novelty policy for current turn
 */
export function getNoveltyPolicy(turn: number): NoveltyPolicy | null {
  const data = loadSpineMaps();
  
  if (turn <= 50) return data.sharedNoveltyPolicy['T0-50'];
  if (turn <= 100) return data.sharedNoveltyPolicy['T51-100'];
  return data.sharedNoveltyPolicy['T101-300'];
}

/**
 * Get due milestones for current turn
 */
export function getDueMilestones(
  mode: EngineMode,
  turn: number,
  completedMilestones: string[]
): Milestone[] {
  const band = getBandForTurn(mode, turn);
  if (!band) return [];
  
  return band.milestones.filter(m => {
    // Not already completed
    if (completedMilestones.includes(m.id)) return false;
    
    // Within target window
    if (turn < m.targetTurns[0] || turn > m.targetTurns[1]) return false;
    
    // Prerequisites met
    return m.requires.every(req => completedMilestones.includes(req));
  });
}

/**
 * Get next milestone (earliest due milestone not yet completed)
 */
export function getNextMilestone(
  mode: EngineMode,
  turn: number,
  completedMilestones: string[]
): Milestone | null {
  const band = getBandForTurn(mode, turn);
  if (!band) return null;
  
  const eligible = band.milestones.filter(m => {
    if (completedMilestones.includes(m.id)) return false;
    return m.requires.every(req => completedMilestones.includes(req));
  });
  
  if (eligible.length === 0) return null;
  
  // Sort by target turn (earliest first)
  return eligible.sort((a, b) => a.targetTurns[0] - b.targetTurns[0])[0];
}

/**
 * Check if milestone is overdue
 */
export function isMilestoneOverdue(
  milestone: Milestone,
  turn: number
): boolean {
  return turn > milestone.targetTurns[1];
}

/**
 * Get mode targets for density validation
 */
export function getModeTargets(mode: EngineMode): ModeTargets {
  const spineMap = getSpineMapForMode(mode);
  return spineMap?.modeTargets || {};
}

/**
 * Get profile for a specific bible
 */
export function getProfileForBible(mode: EngineMode, bibleId: string): Profile | null {
  const spineMap = getSpineMapForMode(mode);
  if (!spineMap) return null;
  
  const profileMap: Record<string, string> = {
    'summoned-pact': 'summoned_pact',
    'hero-awakening': 'hero_awakening',
    'blank-canvas': 'blank_canvas',
    'cursed-keep': 'cursed_keep',
    'salt-road': 'salt_road',
    'thornferry': 'thornferry',
    'vesper-glass': 'vesper_glass',
    'cape-district': 'cape_district'
  };
  
  const profileId = profileMap[bibleId];
  return spineMap.profiles.find(p => p.profileId === profileId) || null;
}

/**
 * Validate spine map integrity
 */
export function validateSpineMap(): {
  valid: boolean;
  errors: string[];
} {
  const data = loadSpineMaps();
  const errors: string[] = [];
  
  // Check version
  if (data.schemaVersion !== SPINE_MAP_VERSION) {
    errors.push(`Version mismatch: expected ${SPINE_MAP_VERSION}, got ${data.schemaVersion}`);
  }
  
  // Check modes
  if (data.modes.length !== 4) {
    errors.push(`Expected 4 modes, got ${data.modes.length}`);
  }
  
  // Check bands per mode
  for (const mode of data.modes) {
    if (mode.bands.length !== 3) {
      errors.push(`${mode.mode}: Expected 3 bands, got ${mode.bands.length}`);
    }
    
    // Check band turn ranges
    for (let i = 0; i < mode.bands.length; i++) {
      const band = mode.bands[i];
      const [start, end] = band.turns;
      
      if (start > end) {
        errors.push(`${mode.mode}:${band.bandId}: Invalid turn range [${start}, ${end}]`);
      }
      
      // Check for gaps/overlaps (allow T30-100 to start at T31)
      if (i > 0) {
        const prevEnd = mode.bands[i - 1].turns[1];
        const expectedStart = prevEnd + 1;
        // Allow either adjacent (31 after 30) or inclusive (30 after 30)
        if (start !== expectedStart && start !== prevEnd) {
          errors.push(`${mode.mode}:${band.bandId}: Gap/overlap with previous band (expected ${expectedStart} or ${prevEnd}, got ${start})`);
        }
      }
    }
    
    // Check milestone prerequisites
    for (const band of mode.bands) {
      const milestoneIds = new Set(band.milestones.map(m => m.id));
      
      for (const milestone of band.milestones) {
        for (const req of milestone.requires) {
          if (!milestoneIds.has(req)) {
            // Check previous bands
            const found = mode.bands
              .slice(0, mode.bands.indexOf(band))
              .some(b => b.milestones.some(m => m.id === req));
            
            if (!found) {
              errors.push(`${mode.mode}:${band.bandId}:${milestone.id}: Unknown prerequisite '${req}'`);
            }
          }
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get spine map hash for validation
 */
export function getSpineMapHash(): string {
  const data = loadSpineMaps();
  return `${data.commission}-${data.schemaVersion}`;
}

/**
 * Format milestone for mandate
 */
export function formatMilestoneMandate(milestone: Milestone, turn: number): string {
  const status = isMilestoneOverdue(milestone, turn) ? 'OVERDUE' : 'DUE';
  return `MILESTONE ${status} (${milestone.id}): ${milestone.durableOutcomes.join(', ')}`;
}
