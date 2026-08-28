/**
 * WS-6 Wave B: Content Density and Material Deltas
 * 
 * Defines:
 * - Novelty classes (U_UNIQUE, V_REFRESHED, R_STALE, L_LOOP)
 * - Material dimensions (10 dimensions of meaningful change)
 * - Hub qualification (3 of 5 properties required)
 * - Stable semantic IDs for repeat detection
 * - Density targets per mode
 * 
 * Architecture:
 * - Novelty classifier determines content freshness
 * - Material deltas track meaningful vs cosmetic changes
 * - Hub qualification prevents travel-pad inflation
 */

import type { EngineMode } from './types';

// ============================================================================
// Novelty Classes
// ============================================================================

/**
 * Four novelty classes for content classification
 */
export enum NoveltyClass {
  /** First exposure to a content node or semantic family */
  U_UNIQUE = 'U_UNIQUE',
  
  /** Reuse with ≥2 material changes */
  V_REFRESHED = 'V_REFRESHED',
  
  /** Reuse with ≤1 cosmetic change */
  R_STALE = 'R_STALE',
  
  /** Invalid terminal re-entry (defeated boss, closed wing, ended crisis) */
  L_LOOP = 'L_LOOP'
}

/**
 * Novelty credit for density scoring
 */
export function getNoveltyCredit(novelty: NoveltyClass): number {
  switch (novelty) {
    case NoveltyClass.U_UNIQUE: return 1.0;
    case NoveltyClass.V_REFRESHED: return 0.6;
    case NoveltyClass.R_STALE: return 0.0;
    case NoveltyClass.L_LOOP: return 0.0;
  }
}

// ============================================================================
// Material Dimensions
// ============================================================================

/**
 * Ten material dimensions that constitute meaningful change
 */
export enum MaterialDimension {
  /** Location context (different room, building, zone) */
  LOCATION_CONTEXT = 'location_context',
  
  /** Opposition (different enemy, faction, threat) */
  OPPOSITION = 'opposition',
  
  /** Objective (what must be done) */
  OBJECTIVE = 'objective',
  
  /** Tactical affordance (new action/skill/tool available) */
  TACTICAL_AFFORDANCE = 'tactical_affordance',
  
  /** Social leverage (new information, relationship, obligation) */
  SOCIAL_LEVERAGE = 'social_leverage',
  
  /** Reward type (XP, item, faction, quest, unlock) */
  REWARD_TYPE = 'reward_type',
  
  /** Faction state (standing, opportunity, conflict) */
  FACTION_STATE = 'faction_state',
  
  /** Quest state (new objective, completion, failure) */
  QUEST_STATE = 'quest_state',
  
  /** Consequence (durable world/NPC change) */
  CONSEQUENCE = 'consequence',
  
  /** Telegraph/presentation (how stakes are framed) */
  TELEGRAPH = 'telegraph'
}

export interface MaterialDelta {
  dimension: MaterialDimension;
  changed: boolean;
  reason?: string;
}

/**
 * Check if content is refreshed (≥2 material changes)
 */
export function isRefreshed(deltas: MaterialDelta[]): boolean {
  const changedCount = deltas.filter(d => d.changed).length;
  return changedCount >= 2;
}

/**
 * Check if content is stale (≤1 material change)
 */
export function isStale(deltas: MaterialDelta[]): boolean {
  const changedCount = deltas.filter(d => d.changed).length;
  return changedCount <= 1;
}

// ============================================================================
// Semantic IDs
// ============================================================================

/**
 * Semantic family ID (stable across prose regeneration)
 * Examples: "shop:merchant", "combat:bandit", "hub:guild"
 */
export interface SemanticFamilyId {
  category: string; // shop, combat, hub, npc, quest
  family: string;   // merchant, bandit, guild, etc.
}

/**
 * Template ID for encounter/beat tracking
 */
export interface TemplateId {
  familyId: SemanticFamilyId;
  variant: string;  // specific template variation
}

/**
 * Instance ID for repeat detection
 */
export interface InstanceId {
  templateId: TemplateId;
  instance: number; // nth occurrence
}

/**
 * Generate semantic family ID from content
 */
export function generateSemanticFamilyId(
  category: string,
  family: string
): SemanticFamilyId {
  return {
    category: category.toLowerCase(),
    family: family.toLowerCase()
  };
}

/**
 * Serialize semantic ID for storage
 */
export function serializeSemanticId(id: SemanticFamilyId): string {
  return `${id.category}:${id.family}`;
}

/**
 * Parse semantic ID from string
 */
export function parseSemanticId(str: string): SemanticFamilyId | null {
  const parts = str.split(':');
  if (parts.length !== 2) return null;
  return {
    category: parts[0],
    family: parts[1]
  };
}

// ============================================================================
// Hub Qualification
// ============================================================================

/**
 * Five hub properties (3 of 5 required)
 */
export interface HubProperties {
  /** Named NPCs with roles */
  hasNamedContacts: boolean;
  
  /** Distinct functional services (shop, inn, guild, temple) */
  hasServices: boolean;
  
  /** Quest hooks or faction interactions */
  hasQuestHooks: boolean;
  
  /** Unique environmental identity (not generic room) */
  hasIdentity: boolean;
  
  /** Reachable via travel system */
  hasTravel: boolean;
}

/**
 * Check if location qualifies as a hub (3 of 5 properties)
 */
export function isQualifiedHub(props: HubProperties): boolean {
  const count = Object.values(props).filter(Boolean).length;
  return count >= 3;
}

/**
 * Validate hub properties from game state
 */
export function validateHubProperties(
  locationName: string,
  namedNpcs: string[],
  services: string[],
  questHooks: string[],
  travelExits: string[]
): HubProperties {
  return {
    hasNamedContacts: namedNpcs.length >= 2,
    hasServices: services.length >= 1,
    hasQuestHooks: questHooks.length >= 1,
    hasIdentity: !isGenericLocation(locationName),
    hasTravel: travelExits.length >= 1
  };
}

/**
 * Check if location name is generic (not a hub)
 */
function isGenericLocation(name: string): boolean {
  const generic = [
    /^(a|the|an) (room|corridor|hallway|street|path|road|alley)$/i,
    /^room \d+$/i,
    /^corridor \d+$/i,
    /^street \d+$/i,
    /^unnamed/i,
    /^temporary/i
  ];
  
  return generic.some(re => re.test(name));
}

// ============================================================================
// Density Targets
// ============================================================================

/**
 * Density targets per mode (from spine maps)
 */
export interface DensityTargets {
  mode: EngineMode;
  
  // T100 targets
  hubsByT100: [number, number];
  encountersByT100: [number, number];
  npcsByT100: [number, number];
  
  // T300 targets
  additionalHubsByT300?: [number, number];
  additionalEncountersByT300?: [number, number];
  additionalNpcsByT300?: [number, number];
  
  // Mode-specific
  levelsT300?: number;
  dungeonsT300?: number;
  challengesPer100?: [number, number];
  socialConfrontationsPer100?: [number, number];
  crisisCadence?: number;
}

/**
 * Get density targets for mode
 */
export function getDensityTargets(mode: EngineMode): DensityTargets {
  switch (mode) {
    case 'litrpg':
      return {
        mode,
        hubsByT100: [8, 12],
        encountersByT100: [10, 15],
        npcsByT100: [12, 16],
        additionalHubsByT300: [5, 8],
        additionalEncountersByT300: [20, 30],
        additionalNpcsByT300: [3, 4],
        levelsT300: 10,
        dungeonsT300: 3
      };
      
    case 'dnd':
      return {
        mode,
        hubsByT100: [5, 8],
        encountersByT100: [12, 18],
        npcsByT100: [9, 14],
        additionalHubsByT300: [3, 6],
        challengesPer100: [12, 18]
      };
      
    case 'rpg':
      return {
        mode,
        hubsByT100: [6, 10],
        encountersByT100: [8, 14],
        npcsByT100: [12, 18],
        additionalHubsByT300: [3, 5],
        socialConfrontationsPer100: [8, 14]
      };
      
    case 'pyoa':
      return {
        mode,
        hubsByT100: [4, 7],
        encountersByT100: [5, 8],
        npcsByT100: [6, 12],
        crisisCadence: 35 // Every 30-40 turns
      };
  }
}

/**
 * Check if density target is met
 */
export function isDensityTargetMet(
  actual: number,
  target: [number, number],
  turn: number,
  targetTurn: number
): boolean {
  // Interpolate target based on current turn
  const [min, max] = target;
  const progress = turn / targetTurn;
  const expectedMin = min * progress;
  
  return actual >= expectedMin;
}

// ============================================================================
// FO3-Like Wedge
// ============================================================================

/**
 * FO3-like depth components (60-70% target)
 */
export interface DepthComponents {
  placeIdentity: number;      // 0-1, weight 20%
  questCausality: number;      // 0-1, weight 20%
  npcReactivity: number;       // 0-1, weight 20%
  encounterDiff: number;       // 0-1, weight 15%
  optionalDiscovery: number;   // 0-1, weight 10%
  progressionPayoff: number;   // 0-1, weight 15%
}

/**
 * Calculate normalized depth index (0-1)
 */
export function calculateDepthIndex(components: DepthComponents): number {
  return (
    components.placeIdentity * 0.20 +
    components.questCausality * 0.20 +
    components.npcReactivity * 0.20 +
    components.encounterDiff * 0.15 +
    components.optionalDiscovery * 0.10 +
    components.progressionPayoff * 0.15
  );
}

/**
 * Check if depth index passes FO3-like wedge (≥0.60)
 */
export function passesDepthWedge(index: number): boolean {
  return index >= 0.60;
}

/**
 * Check if any component is critically low (<0.45)
 */
export function hasCriticallyLowComponent(components: DepthComponents): boolean {
  return Object.values(components).some(v => v < 0.45);
}

// ============================================================================
// Content Family Tracking
// ============================================================================

/**
 * Track content family usage
 */
export interface FamilyUsage {
  familyId: string;
  count: number;
  lastUsedTurn: number;
  lastNovelty: NoveltyClass;
}

/**
 * Check if family is overused (concentration too high)
 */
export function isFamilyOverused(
  usage: FamilyUsage,
  totalBeats: number,
  windowSize: number
): boolean {
  const concentration = usage.count / totalBeats;
  const windowConcentration = usage.count / Math.min(windowSize, totalBeats);
  
  // No family should exceed 20% of total beats
  if (concentration > 0.20) return true;
  
  // No family should exceed 30% of last 20 turns
  if (windowConcentration > 0.30) return true;
  
  return false;
}

/**
 * Calculate family concentration index (Herfindahl)
 */
export function calculateFamilyConcentration(usages: FamilyUsage[]): number {
  const total = usages.reduce((sum, u) => sum + u.count, 0);
  if (total === 0) return 0;
  
  const shares = usages.map(u => u.count / total);
  const herfindahl = shares.reduce((sum, s) => sum + s * s, 0);
  
  // Normalize: 0 = perfect diversity, 1 = single family
  return herfindahl;
}

// ============================================================================
// Beat Classification
// ============================================================================

/**
 * Beat types for density tracking
 */
export enum BeatType {
  ENCOUNTER = 'encounter',
  HUB = 'hub',
  NPC = 'npc',
  QUEST = 'quest',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  CRISIS = 'crisis',
  BRANCH = 'branch'
}

/**
 * Check if beat is content-bearing (not meta/system)
 */
export function isContentBearing(
  beatType: BeatType,
  hasStory: boolean,
  hasDelta: boolean
): boolean {
  // Must have story prose or state delta
  if (!hasStory && !hasDelta) return false;
  
  // All listed types are content-bearing
  return true;
}

/**
 * Get beat family from type and context
 */
export function getBeatFamily(
  beatType: BeatType,
  context: string
): string {
  return `${beatType}:${context}`;
}
