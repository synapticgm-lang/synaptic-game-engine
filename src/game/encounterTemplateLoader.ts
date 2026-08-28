/**
 * WS-4 Wave D: Encounter Template Loader
 * 
 * Loads and registers all 48 encounter templates from data files:
 * - 8 LitRPG templates (D2)
 * - 8 DnD templates (D3)
 * - 8 RPG templates (D4)
 * - 24 PYOA crisis templates (D5)
 * 
 * Related:
 * - encounterBible.ts - Template schema
 * - encounterBiomeMatrix.ts - Biome filtering
 * - data/encounters/*.json - Content catalogs
 */

import type { EncounterTemplate, EngineMode } from './encounterBible';
import litrpgTemplates from './data/encounters/D2_litrpg_encounter_library.json';
import dndTemplates from './data/encounters/D3_dnd_encounter_library.json';
import rpgTemplates from './data/encounters/D4_rpg_encounter_library.json';
import pyoaTemplates from './data/encounters/D5_pyoa_crisis_library.json';

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

interface TemplateLibrary {
  schemaVersion: string;
  libraryId: string;
  mode: EngineMode;
  bibleId?: string;
  templates: any[]; // Raw JSON templates
}

/**
 * In-memory template registry
 */
class EncounterTemplateRegistry {
  private templates: Map<string, EncounterTemplate> = new Map();
  private templatesByMode: Map<EngineMode, EncounterTemplate[]> = new Map();
  private templatesByBible: Map<string, EncounterTemplate[]> = new Map();
  private templatesByRole: Map<string, EncounterTemplate[]> = new Map();
  
  /**
   * Register a single template
   */
  register(template: EncounterTemplate): void {
    this.templates.set(template.id, template);
    
    // Index by mode
    if (!this.templatesByMode.has(template.mode)) {
      this.templatesByMode.set(template.mode, []);
    }
    this.templatesByMode.get(template.mode)!.push(template);
    
    // Index by bible
    if (!this.templatesByBible.has(template.bibleId)) {
      this.templatesByBible.set(template.bibleId, []);
    }
    this.templatesByBible.get(template.bibleId)!.push(template);
    
    // Index by density role
    const role = (template as any).role || 'trash';
    if (!this.templatesByRole.has(role)) {
      this.templatesByRole.set(role, []);
    }
    this.templatesByRole.get(role)!.push(template);
  }
  
  /**
   * Get template by ID
   */
  get(id: string): EncounterTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Get all templates for a mode
   */
  getByMode(mode: EngineMode): EncounterTemplate[] {
    return this.templatesByMode.get(mode) || [];
  }
  
  /**
   * Get all templates for a bible
   */
  getByBible(bibleId: string): EncounterTemplate[] {
    return this.templatesByBible.get(bibleId) || [];
  }
  
  /**
   * Get all templates for a role
   */
  getByRole(role: string): EncounterTemplate[] {
    return this.templatesByRole.get(role) || [];
  }
  
  /**
   * Get all templates
   */
  getAll(): EncounterTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byMode: Record<string, number>;
    byBible: Record<string, number>;
    byRole: Record<string, number>;
  } {
    const byMode: Record<string, number> = {};
    for (const [mode, templates] of this.templatesByMode) {
      byMode[mode] = templates.length;
    }
    
    const byBible: Record<string, number> = {};
    for (const [bible, templates] of this.templatesByBible) {
      byBible[bible] = templates.length;
    }
    
    const byRole: Record<string, number> = {};
    for (const [role, templates] of this.templatesByRole) {
      byRole[role] = templates.length;
    }
    
    return {
      total: this.templates.size,
      byMode,
      byBible,
      byRole
    };
  }
}

// Global registry instance
const ENCOUNTER_REGISTRY = new EncounterTemplateRegistry();

// ============================================================================
// TEMPLATE LOADING
// ============================================================================

/**
 * Convert raw JSON template to typed EncounterTemplate
 */
function normalizeTemplate(raw: any, libraryMode: EngineMode, libraryBibleId?: string): EncounterTemplate {
  // Extract core fields
  const id = raw.id || raw.templateId;
  const name = raw.name || raw.title || 'Unnamed Encounter';
  const mode = raw.mode || libraryMode;
  const bibleId = raw.bibleId || libraryBibleId || 'unknown';
  const version = raw.templateVersion || raw.version || '1.0.0';
  
  // Extract role from template (for density system)
  const role = raw.role || 'trash';
  
  // Build normalized template
  const template: EncounterTemplate = {
    id,
    name,
    bibleId,
    mode,
    version,
    
    // Telegraph phase
    telegraph: {
      timing: raw.telegraph?.responseWindowTurns === 0 ? 'same-turn' : 'none',
      patterns: (raw.telegraph?.cues || []).map((cue: any) => ({
        type: cue.channel || 'scene',
        text: cue.signal || '',
        probability: 1.0
      })),
      avoidable: raw.telegraph?.surpriseEligible === false
    },
    
    // Stakes phase
    stakes: {
      win: {
        description: raw.stakes?.headline || '',
        xp: 0,
        items: []
      },
      lose: {
        description: '',
        xp: 0,
        items: []
      }
    },
    
    // Resolution mechanics
    resolution: {
      type: (raw.stakes?.approaches?.[0]?.method === 'combat') ? 'combat' : 'skill',
      difficulty: 'moderate',
      consequences: []
    },
    
    // Aftermath receipts
    aftermath: {
      receipts: []
    },
    
    // Biome constraints
    biomeConstraints: {
      allowed: raw.biomes || [],
      forbidden: []
    },
    
    // Tier range
    tierRange: [1, 5] as [number, number],
    
    // Density role
    densityRole: role as any,
    
    // Max spawns
    maxSpawns: raw.maxSpawnsPerRun
  };
  
  return template;
}

/**
 * Load templates from a library JSON file
 */
function loadLibrary(library: TemplateLibrary): number {
  let count = 0;
  
  for (const raw of library.templates || []) {
    try {
      const template = normalizeTemplate(raw, library.mode, library.bibleId);
      ENCOUNTER_REGISTRY.register(template);
      count++;
    } catch (error) {
      console.error(`Failed to load template ${raw.id}:`, error);
    }
  }
  
  return count;
}

/**
 * Initialize encounter template registry
 */
export function initializeEncounterTemplates(): {
  loaded: number;
  stats: ReturnType<typeof ENCOUNTER_REGISTRY.getStats>;
} {
  // Load all libraries
  const litrpgCount = loadLibrary(litrpgTemplates as TemplateLibrary);
  const dndCount = loadLibrary(dndTemplates as TemplateLibrary);
  const rpgCount = loadLibrary(rpgTemplates as TemplateLibrary);
  const pyoaCount = loadLibrary(pyoaTemplates as TemplateLibrary);
  
  const totalLoaded = litrpgCount + dndCount + rpgCount + pyoaCount;
  
  return {
    loaded: totalLoaded,
    stats: ENCOUNTER_REGISTRY.getStats()
  };
}

/**
 * Get encounter template registry
 */
export function getEncounterRegistry(): EncounterTemplateRegistry {
  return ENCOUNTER_REGISTRY;
}

/**
 * Select encounter template for spawn
 */
export interface EncounterSelection {
  templateId: string;
  biome: string;
  tier: number;
  mode: EngineMode;
  bibleId: string;
  role: string;
}

export function selectEncounterTemplate(
  selection: EncounterSelection
): EncounterTemplate | null {
  // Get candidates
  let candidates = ENCOUNTER_REGISTRY.getByMode(selection.mode);
  
  // Filter by bible
  if (selection.bibleId) {
    candidates = candidates.filter(t => t.bibleId === selection.bibleId);
  }
  
  // Filter by role
  if (selection.role) {
    candidates = candidates.filter(t => (t as any).role === selection.role);
  }
  
  // Filter by biome
  candidates = candidates.filter(t => {
    const constraints = t.biomeConstraints;
    
    // Check forbidden
    if (constraints.forbidden?.includes(selection.biome)) {
      return false;
    }
    
    // Check allowed (empty = all allowed)
    if (constraints.allowed && constraints.allowed.length > 0) {
      return constraints.allowed.includes(selection.biome);
    }
    
    return true;
  });
  
  // Filter by tier
  candidates = candidates.filter(t => {
    const [minTier, maxTier] = t.tierRange;
    return selection.tier >= minTier && selection.tier <= maxTier;
  });
  
  // Return first match (could implement weighted selection here)
  return candidates[0] || null;
}

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

// Auto-initialize on module load
const initResult = initializeEncounterTemplates();
console.log(`Encounter templates loaded: ${initResult.loaded}`, initResult.stats);
