/**
 * WS-4 Wave C: Encounter Density Governance
 * 
 * Manages encounter spawning density with:
 * - Role budgets (trash, elite, boss quotas per location)
 * - Drought timers (15T hostile LitRPG, 8T interactive DnD)
 * - Saturation guards (max 2 encounters per 5 turns)
 * - Variety scoring (penalize recent-role repeats)
 * - Biome-safe fallbacks
 * 
 * Architecture:
 * - Pre-GM commit checks density state
 * - Legal candidates filtered by biome + density
 * - Telemetry for drought/saturation/content-gap
 */

import type { GameState, EngineMode } from './types';
import type { EncounterTemplate } from './encounterBible';

export interface DensityProfile {
  engineMode: EngineMode;
  locationId: string;
  trashQuota: { min: number; max: number };
  eliteQuota: { min: number; max: number };
  bossQuota: { min: number; max: number };
  droughtTimer: number; // Turns before forced spawn
  saturationWindow: number; // Turns to check for over-spawning
  saturationLimit: number; // Max encounters in window
}

export interface DensityState {
  locationId: string;
  trashEncountered: number;
  eliteEncountered: number;
  bossEncountered: number;
  turnsSinceEncounter: number;
  recentEncounters: EncounterHistory[];
  recentRoles: string[];
}

export interface EncounterHistory {
  encounterId: string;
  templateId: string;
  role: 'trash' | 'elite' | 'boss';
  turn: number;
}

export interface DroughtCheck {
  isDrought: boolean;
  turnsElapsed: number;
  threshold: number;
  reason?: string;
}

export interface SaturationCheck {
  isSaturated: boolean;
  encountersInWindow: number;
  limit: number;
  reason?: string;
}

export interface VarietyScore {
  templateId: string;
  score: number;
  penalties: {
    recentRole: number;
    recentTemplate: number;
  };
}

// ============================================================================
// Density Profile Management
// ============================================================================

/**
 * Wave C: Get density profile for current mode and location
 */
export function getDensityProfile(
  engineMode: EngineMode,
  locationId: string,
  isDungeon: boolean
): DensityProfile {
  if (engineMode === 'litrpg') {
    if (isDungeon) {
      return {
        engineMode,
        locationId,
        trashQuota: { min: 4, max: 6 },
        eliteQuota: { min: 1, max: 2 },
        bossQuota: { min: 1, max: 1 },
        droughtTimer: 15, // Hostile drought
        saturationWindow: 5,
        saturationLimit: 2
      };
    } else {
      return {
        engineMode,
        locationId,
        trashQuota: { min: 2, max: 4 },
        eliteQuota: { min: 0, max: 1 },
        bossQuota: { min: 0, max: 0 },
        droughtTimer: 20,
        saturationWindow: 10,
        saturationLimit: 1
      };
    }
  }
  
  if (engineMode === 'dnd') {
    return {
      engineMode,
      locationId,
      trashQuota: { min: 2, max: 4 },
      eliteQuota: { min: 1, max: 2 },
      bossQuota: { min: 0, max: 1 },
      droughtTimer: 8, // Interactive drought
      saturationWindow: 5,
      saturationLimit: 3
    };
  }
  
  // RPG mode - less dense
  return {
    engineMode,
    locationId,
    trashQuota: { min: 1, max: 2 },
    eliteQuota: { min: 0, max: 1 },
    bossQuota: { min: 0, max: 1 },
    droughtTimer: 25,
    saturationWindow: 10,
    saturationLimit: 1
  };
}

/**
 * Wave C: Get current density state from game state
 */
export function getDensityState(gs: GameState): DensityState {
  const locationId = gs.currentLocation || 'unknown';
  
  // Extract from arc director or build fresh
  const state = gs.arcDirector?.densityState;
  
  if (state && state.locationId === locationId) {
    return state;
  }
  
  // Build fresh state
  return {
    locationId,
    trashEncountered: 0,
    eliteEncountered: 0,
    bossEncountered: 0,
    turnsSinceEncounter: gs.arcDirector?.turnsSinceCombatReceipt ?? 0,
    recentEncounters: [],
    recentRoles: []
  };
}

/**
 * Wave C: Update density state after encounter
 */
export function updateDensityState(
  state: DensityState,
  encounterId: string,
  templateId: string,
  role: 'trash' | 'elite' | 'boss',
  turn: number
): DensityState {
  return {
    ...state,
    trashEncountered: state.trashEncountered + (role === 'trash' ? 1 : 0),
    eliteEncountered: state.eliteEncountered + (role === 'elite' ? 1 : 0),
    bossEncountered: state.bossEncountered + (role === 'boss' ? 1 : 0),
    turnsSinceEncounter: 0,
    recentEncounters: [
      ...state.recentEncounters,
      { encounterId, templateId, role, turn }
    ].slice(-10), // Keep last 10
    recentRoles: [...state.recentRoles, role].slice(-5) // Keep last 5 roles
  };
}

// ============================================================================
// Drought Detection
// ============================================================================

/**
 * Wave C: Check if drought timer has triggered
 */
export function checkDrought(
  profile: DensityProfile,
  state: DensityState
): DroughtCheck {
  const isDrought = state.turnsSinceEncounter >= profile.droughtTimer;
  
  if (isDrought) {
    return {
      isDrought: true,
      turnsElapsed: state.turnsSinceEncounter,
      threshold: profile.droughtTimer,
      reason: `${state.turnsSinceEncounter} turns since last encounter (threshold: ${profile.droughtTimer})`
    };
  }
  
  return {
    isDrought: false,
    turnsElapsed: state.turnsSinceEncounter,
    threshold: profile.droughtTimer
  };
}

// ============================================================================
// Saturation Detection
// ============================================================================

/**
 * Wave C: Check if encounter saturation limit reached
 */
export function checkSaturation(
  profile: DensityProfile,
  state: DensityState,
  currentTurn: number
): SaturationCheck {
  const windowStart = currentTurn - profile.saturationWindow;
  const encountersInWindow = state.recentEncounters.filter(
    e => e.turn >= windowStart
  ).length;
  
  const isSaturated = encountersInWindow >= profile.saturationLimit;
  
  if (isSaturated) {
    return {
      isSaturated: true,
      encountersInWindow,
      limit: profile.saturationLimit,
      reason: `${encountersInWindow} encounters in last ${profile.saturationWindow} turns (limit: ${profile.saturationLimit})`
    };
  }
  
  return {
    isSaturated: false,
    encountersInWindow,
    limit: profile.saturationLimit
  };
}

// ============================================================================
// Role Budget Checks
// ============================================================================

/**
 * Wave C: Check if role quota is available
 */
export function hasRoleQuota(
  profile: DensityProfile,
  state: DensityState,
  role: 'trash' | 'elite' | 'boss'
): boolean {
  switch (role) {
    case 'trash':
      return state.trashEncountered < profile.trashQuota.max;
    case 'elite':
      return state.eliteEncountered < profile.eliteQuota.max;
    case 'boss':
      return state.bossEncountered < profile.bossQuota.max;
    default:
      return false;
  }
}

/**
 * Wave C: Get available roles based on quotas
 */
export function getAvailableRoles(
  profile: DensityProfile,
  state: DensityState
): Array<'trash' | 'elite' | 'boss'> {
  const available: Array<'trash' | 'elite' | 'boss'> = [];
  
  if (hasRoleQuota(profile, state, 'trash')) {
    available.push('trash');
  }
  
  if (hasRoleQuota(profile, state, 'elite')) {
    available.push('elite');
  }
  
  if (hasRoleQuota(profile, state, 'boss')) {
    available.push('boss');
  }
  
  return available;
}

// ============================================================================
// Variety Scoring
// ============================================================================

/**
 * Wave C: Score template variety (penalize repeats)
 */
export function scoreTemplateVariety(
  templateId: string,
  role: 'trash' | 'elite' | 'boss',
  state: DensityState
): VarietyScore {
  let score = 100; // Base score
  const penalties = {
    recentRole: 0,
    recentTemplate: 0
  };
  
  // Penalize recent role repeats
  const recentRoleCounts = state.recentRoles.filter(r => r === role).length;
  penalties.recentRole = recentRoleCounts * 15; // -15 per repeat
  score -= penalties.recentRole;
  
  // Penalize exact template repeats
  const recentTemplateCounts = state.recentEncounters
    .filter(e => e.templateId === templateId)
    .length;
  penalties.recentTemplate = recentTemplateCounts * 30; // -30 per repeat
  score -= penalties.recentTemplate;
  
  return {
    templateId,
    score: Math.max(0, score),
    penalties
  };
}

/**
 * Wave C: Filter and rank templates by variety
 */
export function rankByVariety(
  templates: EncounterTemplate[],
  state: DensityState
): Array<{ template: EncounterTemplate; varietyScore: VarietyScore }> {
  return templates
    .map(template => ({
      template,
      varietyScore: scoreTemplateVariety(
        template.id,
        template.role as 'trash' | 'elite' | 'boss',
        state
      )
    }))
    .sort((a, b) => b.varietyScore.score - a.varietyScore.score);
}

// ============================================================================
// Density-Aware Selection
// ============================================================================

/**
 * Wave C: Select encounter respecting density constraints
 */
export function selectEncounterWithDensity(
  candidates: EncounterTemplate[],
  profile: DensityProfile,
  state: DensityState,
  currentTurn: number
): {
  template: EncounterTemplate | null;
  reason: string;
  telemetry: {
    drought?: DroughtCheck;
    saturation?: SaturationCheck;
    availableRoles: Array<'trash' | 'elite' | 'boss'>;
    varietyScores?: VarietyScore[];
  };
} {
  // Check drought
  const drought = checkDrought(profile, state);
  
  // Check saturation
  const saturation = checkSaturation(profile, state, currentTurn);
  
  if (saturation.isSaturated && !drought.isDrought) {
    return {
      template: null,
      reason: 'Saturation limit reached; no drought override',
      telemetry: {
        drought,
        saturation,
        availableRoles: []
      }
    };
  }
  
  // Get available roles
  const availableRoles = getAvailableRoles(profile, state);
  
  if (availableRoles.length === 0 && !drought.isDrought) {
    return {
      template: null,
      reason: 'All role quotas exhausted; no drought override',
      telemetry: {
        drought,
        saturation,
        availableRoles
      }
    };
  }
  
  // Filter candidates by available roles
  let filtered = candidates.filter(t =>
    availableRoles.includes(t.densityRole as 'trash' | 'elite' | 'boss')
  );
  
  // If drought and no candidates match roles, allow any role
  if (drought.isDrought && filtered.length === 0) {
    filtered = candidates;
  }
  
  if (filtered.length === 0) {
    return {
      template: null,
      reason: 'No legal candidates for available roles',
      telemetry: {
        drought,
        saturation,
        availableRoles
      }
    };
  }
  
  // Rank by variety
  const ranked = rankByVariety(filtered, state);
  
  return {
    template: ranked[0].template,
    reason: drought.isDrought
      ? `Drought override (${drought.reason})`
      : `Selected from ${filtered.length} candidates`,
    telemetry: {
      drought,
      saturation,
      availableRoles,
      varietyScores: ranked.map(r => r.varietyScore)
    }
  };
}

/**
 * Wave C: Check if should spawn encounter (density + drought)
 */
export function shouldSpawnEncounter(
  gs: GameState,
  profile: DensityProfile,
  state: DensityState
): {
  shouldSpawn: boolean;
  reason: string;
  drought?: DroughtCheck;
  saturation?: SaturationCheck;
} {
  // Don't spawn if already in encounter
  if (gs.activeEncounter) {
    return {
      shouldSpawn: false,
      reason: 'Already in active encounter'
    };
  }
  
  // Don't spawn in PYOA
  if (gs.engineMode === 'pyoa') {
    return {
      shouldSpawn: false,
      reason: 'PYOA mode - no combat encounters'
    };
  }
  
  const drought = checkDrought(profile, state);
  const saturation = checkSaturation(profile, state, gs.turn);
  
  // Drought overrides saturation
  if (drought.isDrought) {
    return {
      shouldSpawn: true,
      reason: `Drought trigger: ${drought.reason}`,
      drought,
      saturation
    };
  }
  
  // Don't spawn if saturated
  if (saturation.isSaturated) {
    return {
      shouldSpawn: false,
      reason: `Saturation guard: ${saturation.reason}`,
      drought,
      saturation
    };
  }
  
  // Spawn if quotas available and no saturation
  const availableRoles = getAvailableRoles(profile, state);
  
  if (availableRoles.length > 0) {
    return {
      shouldSpawn: true,
      reason: `Quota available for roles: ${availableRoles.join(', ')}`,
      drought,
      saturation
    };
  }
  
  return {
    shouldSpawn: false,
    reason: 'No available role quotas',
    drought,
    saturation
  };
}
