/**
 * WS-4 Wave A: Encounter Bible Template Schema
 * 
 * Genre-appropriate encounter templates with full lifecycle:
 * telegraph → stakes → resolution → aftermath
 */

import type { GameState, EngineMode } from './types';

// ============================================================================
// TEMPLATE SCHEMA
// ============================================================================

export interface EncounterTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Bible identifier (which campaign) */
  bibleId: string;
  
  /** Engine mode */
  mode: EngineMode;
  
  /** Template version */
  version: string;
  
  /** Telegraph phase */
  telegraph: EncounterTelegraph;
  
  /** Stakes phase */
  stakes: EncounterStakes;
  
  /** Resolution mechanics */
  resolution: EncounterResolution;
  
  /** Aftermath receipts */
  aftermath: EncounterAftermath;
  
  /** Biome constraints */
  biomeConstraints: BiomeConstraints;
  
  /** Tier range */
  tierRange: [number, number];
  
  /** Density role */
  densityRole: 'trash' | 'elite' | 'miniboss' | 'boss' | 'patrol' | 'ambient';
  
  /** Max spawns per run */
  maxSpawns?: number;
}

// ============================================================================
// TELEGRAPH PHASE
// ============================================================================

export interface EncounterTelegraph {
  /** Telegraph timing */
  timing: 'none' | 'same-turn' | '1-turn-before' | '2-turns-before';
  
  /** Telegraph patterns */
  patterns: TelegraphPattern[];
  
  /** Avoidable? */
  avoidable: boolean;
}

export interface TelegraphPattern {
  /** Pattern type */
  type: 'status' | 'npc' | 'scene' | 'item' | 'faction';
  
  /** Pattern text */
  text: string;
  
  /** Probability (0-1) */
  probability: number;
}

// ============================================================================
// STAKES PHASE
// ============================================================================

export interface EncounterStakes {
  /** Win outcome */
  win: StakeOutcome;
  
  /** Lose outcome */
  lose: StakeOutcome;
  
  /** Flee outcome (if available) */
  flee?: StakeOutcome;
  
  /** Parley outcome (if available) */
  parley?: StakeOutcome;
}

export interface StakeOutcome {
  /** Outcome description */
  description: string;
  
  /** XP range */
  xpRange: [number, number];
  
  /** Resource changes */
  resources?: Array<{
    resourceId: string;
    deltaRange: [number, number];
  }>;
  
  /** Faction deltas */
  factionDeltas?: Record<string, [number, number]>;
  
  /** Quest progress */
  questProgress?: Array<{
    questPattern: string;
    stage: number;
  }>;
  
  /** Loot tables */
  loot?: LootTable[];
}

export interface LootTable {
  /** Loot tier */
  tier: 'trash' | 'common' | 'uncommon' | 'rare' | 'boss';
  
  /** Item patterns */
  items: Array<{
    pattern: string;
    probability: number;
  }>;
}

// ============================================================================
// RESOLUTION MECHANICS
// ============================================================================

export interface EncounterResolution {
  /** Resolution type */
  type: 'combat' | 'skill-check' | 'leverage' | 'crisis' | 'hybrid';
  
  /** Combat resolution (if type=combat) */
  combat?: CombatResolution;
  
  /** Skill check resolution (if type=skill-check) */
  skillCheck?: SkillCheckResolution;
  
  /** Leverage resolution (if type=leverage) */
  leverage?: LeverageResolution;
  
  /** Crisis resolution (if type=crisis) */
  crisis?: CrisisResolution;
}

export interface CombatResolution {
  /** Enemy count */
  enemyCount: [number, number]; // [min, max]
  
  /** Enemy HP range */
  hpRange: [number, number];
  
  /** Flee difficulty */
  fleeDifficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  
  /** Parley difficulty */
  parleyDifficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  
  /** Max engagement turns */
  maxEngagementTurns: number;
}

export interface SkillCheckResolution {
  /** Skill type */
  skill: 'stealth' | 'investigation' | 'athletics' | 'persuasion' | 'arcana' | 'perception';
  
  /** DC range */
  dcRange: [number, number];
  
  /** Partial success available? */
  partialSuccess: boolean;
  
  /** Retry allowed? */
  retryAllowed: boolean;
}

export interface LeverageResolution {
  /** Leverage topic pattern */
  topicPattern: string;
  
  /** NPC vulnerability */
  npcVulnerability?: string;
  
  /** Cost types */
  costTypes: Array<'trust' | 'favor' | 'item' | 'faction'>;
  
  /** Outcomes */
  outcomes: Array<'alliance' | 'enemy' | 'debt_owed' | 'exile'>;
}

export interface CrisisResolution {
  /** Crisis forks */
  forks: Array<{
    forkId: string;
    label: string;
    exclusiveFacts: string[];
  }>;
  
  /** Delayed payoff turn offset */
  delayedPayoffOffset: [number, number]; // [min, max]
}

// ============================================================================
// AFTERMATH PHASE
// ============================================================================

export interface EncounterAftermath {
  /** Receipt types */
  receiptTypes: Array<'xp' | 'loot' | 'faction' | 'quest' | 'npc' | 'dungeon'>;
  
  /** Mandatory receipts (always fire) */
  mandatoryReceipts: string[];
  
  /** Optional receipts (conditional) */
  optionalReceipts: Array<{
    receiptType: string;
    condition: string;
  }>;
}

// ============================================================================
// BIOME CONSTRAINTS
// ============================================================================

export interface BiomeConstraints {
  /** Allowed biomes */
  allowedBiomes: string[];
  
  /** Excluded biomes */
  excludedBiomes?: string[];
  
  /** Required location types */
  requiredLocations?: string[];
  
  /** Excluded location types */
  excludedLocations?: string[];
}

/**
 * Biome taxonomy (shared across bibles)
 */
export const BIOME_TAXONOMY = {
  // Urban
  urban: ['city', 'town', 'settlement', 'outpost', 'hub'],
  urban_ruin: ['ruin', 'destroyed', 'abandoned', 'desolate'],
  
  // Dungeon
  dungeon: ['dungeon', 'crypt', 'tomb', 'vault', 'keep'],
  dungeon_natural: ['cave', 'cavern', 'grotto', 'underground'],
  
  // Wilderness
  wilderness: ['forest', 'woods', 'jungle', 'swamp', 'marsh'],
  wilderness_open: ['plains', 'grassland', 'field', 'meadow'],
  wilderness_mountain: ['mountain', 'hills', 'peak', 'cliff'],
  
  // Coastal
  coastal: ['coast', 'shore', 'beach', 'harbor', 'dock'],
  coastal_water: ['sea', 'ocean', 'bay', 'inlet'],
  
  // Road
  road: ['road', 'path', 'trail', 'highway', 'route'],
  
  // Special
  desert: ['desert', 'dunes', 'wasteland', 'badlands'],
  arctic: ['tundra', 'ice', 'snow', 'frozen'],
  volcanic: ['volcano', 'lava', 'ash', 'crater'],
} as const;

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export interface EncounterTemplateRegistry {
  /** All templates */
  templates: EncounterTemplate[];
  
  /** Templates by bible */
  byBible: Map<string, EncounterTemplate[]>;
  
  /** Templates by ID */
  byId: Map<string, EncounterTemplate>;
  
  /** Templates by mode */
  byMode: Map<EngineMode, EncounterTemplate[]>;
  
  /** Registry version */
  version: string;
}

/**
 * Create empty registry
 */
export function createTemplateRegistry(): EncounterTemplateRegistry {
  return {
    templates: [],
    byBible: new Map(),
    byId: new Map(),
    byMode: new Map(),
    version: '1.0.0',
  };
}

/**
 * Register template
 */
export function registerTemplate(
  registry: EncounterTemplateRegistry,
  template: EncounterTemplate
): void {
  // Add to templates array
  registry.templates.push(template);
  
  // By ID
  registry.byId.set(template.id, template);
  
  // By bible
  const bibleTemplates = registry.byBible.get(template.bibleId) ?? [];
  registry.byBible.set(template.bibleId, [...bibleTemplates, template]);
  
  // By mode
  const modeTemplates = registry.byMode.get(template.mode) ?? [];
  registry.byMode.set(template.mode, [...modeTemplates, template]);
}

/**
 * Get templates for bible (optionally filtered by mode)
 */
export function getTemplatesForBible(
  registry: EncounterTemplateRegistry,
  bibleId: string,
  mode?: EngineMode
): EncounterTemplate[] {
  const templates = registry.byBible.get(bibleId) ?? [];
  
  if (mode) {
    return templates.filter(t => t.mode === mode);
  }
  
  return templates;
}

/**
 * Get template by ID
 */
export function getTemplateById(
  registry: EncounterTemplateRegistry,
  templateId: string
): EncounterTemplate | null {
  return registry.byId.get(templateId) ?? null;
}

// ============================================================================
// TEMPLATE FILTERING
// ============================================================================

/**
 * Filter templates by biome
 */
export function filterTemplatesByBiome(
  templates: EncounterTemplate[],
  location: string,
  biome: string
): EncounterTemplate[] {
  const locationLower = location.toLowerCase();
  const biomeLower = biome.toLowerCase();
  
  return templates.filter(template => {
    const constraints = template.biomeConstraints;
    
    // Check excluded biomes first
    if (constraints.excludedBiomes) {
      for (const excluded of constraints.excludedBiomes) {
        if (biomeLower.includes(excluded.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Check excluded locations
    if (constraints.excludedLocations) {
      for (const excluded of constraints.excludedLocations) {
        if (locationLower.includes(excluded.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Check allowed biomes
    let biomeMatch = false;
    if (constraints.allowedBiomes && Array.isArray(constraints.allowedBiomes)) {
      for (const allowed of constraints.allowedBiomes) {
        if (biomeLower.includes(allowed.toLowerCase())) {
          biomeMatch = true;
          break;
        }
      }
      
      if (!biomeMatch) return false;
    }
    
    // Check required locations
    if (constraints.requiredLocations) {
      let locationMatch = false;
      for (const required of constraints.requiredLocations) {
        if (locationLower.includes(required.toLowerCase())) {
          locationMatch = true;
          break;
        }
      }
      if (!locationMatch) return false;
    }
    
    return true;
  });
}

/**
 * Filter templates by tier
 */
export function filterTemplatesByTier(
  templates: EncounterTemplate[],
  tier: number
): EncounterTemplate[] {
  return templates.filter(t => tier >= t.tierRange[0] && tier <= t.tierRange[1]);
}

/**
 * Filter templates by density role
 */
export function filterTemplatesByDensity(
  templates: EncounterTemplate[],
  role: EncounterTemplate['densityRole']
): EncounterTemplate[] {
  return templates.filter(t => t.densityRole === role);
}

// ============================================================================
// TEMPLATE PICKER
// ============================================================================

/**
 * Pick encounter template
 * 
 * Filters by biome, tier, and density role, then picks one.
 */
export function pickEncounterTemplate(
  registry: EncounterTemplateRegistry,
  state: GameState,
  opts: {
    bibleId: string;
    location: string;
    biome: string;
    tier: number;
    densityRole: EncounterTemplate['densityRole'];
    seed: number;
  }
): EncounterTemplate | null {
  const bibleTemplates = getTemplatesForBible(registry, opts.bibleId);
  if (bibleTemplates.length === 0) return null;
  
  // Filter by biome
  let candidates = filterTemplatesByBiome(bibleTemplates, opts.location, opts.biome);
  if (candidates.length === 0) return null;
  
  // Filter by tier
  candidates = filterTemplatesByTier(candidates, opts.tier);
  if (candidates.length === 0) return null;
  
  // Filter by density role
  candidates = filterTemplatesByDensity(candidates, opts.densityRole);
  if (candidates.length === 0) return null;
  
  // Filter by spawn count
  candidates = candidates.filter(t => {
    if (!t.maxSpawns) return true;
    
    // Count how many times this template has spawned
    const receipts = state.arcDirector?.encounterClearedReceipts ?? [];
    const spawnCount = receipts.filter(r => r.name.includes(t.id)).length;
    
    return spawnCount < t.maxSpawns;
  });
  
  if (candidates.length === 0) return null;
  
  // Seed-stable pick
  const index = Math.abs(opts.seed) % candidates.length;
  return candidates[index];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate template schema
 */
export function validateTemplate(template: EncounterTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Required fields
  if (!template.id) errors.push('Missing template ID');
  if (!template.name) errors.push('Missing template name');
  if (!template.bibleId) errors.push('Missing bible ID');
  if (!template.mode) errors.push('Missing engine mode');
  if (!template.version) errors.push('Missing version');
  
  // Telegraph
  if (!template.telegraph) {
    errors.push('Missing telegraph phase');
  } else if (template.telegraph.patterns.length === 0) {
    errors.push('Telegraph has no patterns');
  }
  
  // Stakes
  if (!template.stakes) {
    errors.push('Missing stakes phase');
  } else {
    if (!template.stakes.win) errors.push('Missing win outcome');
    if (!template.stakes.lose) errors.push('Missing lose outcome');
  }
  
  // Resolution
  if (!template.resolution) {
    errors.push('Missing resolution mechanics');
  } else if (!template.resolution.type) {
    errors.push('Missing resolution type');
  }
  
  // Aftermath
  if (!template.aftermath) {
    errors.push('Missing aftermath phase');
  } else if (!template.aftermath.receiptTypes || template.aftermath.receiptTypes.length === 0) {
    errors.push('Aftermath has no receipt types');
  }
  
  // Biome constraints
  if (!template.biomeConstraints) {
    errors.push('Missing biome constraints');
  } else if (!template.biomeConstraints.allowedBiomes || template.biomeConstraints.allowedBiomes.length === 0) {
    errors.push('No allowed biomes specified');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
