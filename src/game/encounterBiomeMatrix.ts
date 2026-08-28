/**
 * WS-4 Wave 1: Encounter Biome Matrix
 * 
 * Hard filters encounters by biome/bible to prevent wrong-context spawns
 * (e.g., Keep Wraith on Shattered Coast).
 */

import type { EngineMode } from './types';
import type { EncounterTemplate } from './encounterBible';

// ============================================================================
// BIOME MATRIX SCHEMA
// ============================================================================

export interface BiomeMatrixEntry {
  mode: EngineMode;
  bibleId: string;
  biomeId: string;
  siteTags: string[];
  allowedEncounterTypes: string[];
  allowedActors: string[];
  excludedActors: string[];
  minTier: number;
  maxTier: number;
  droughtFallback: string;
  notes: string;
}

export interface BiomeMatrix {
  version: string;
  entries: BiomeMatrixEntry[];
}

// ============================================================================
// MATRIX LOADING
// ============================================================================

let _matrixCache: BiomeMatrix | null = null;

/**
 * Load the biome spawn matrix from CSV.
 * Cached after first load.
 */
export async function loadBiomeMatrix(): Promise<BiomeMatrix> {
  if (_matrixCache) {
    return _matrixCache;
  }

  try {
    const response = await fetch('/data/encounters/D10_biome_spawn_matrix.csv');
    if (!response.ok) {
      throw new Error(`Failed to load biome matrix: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const matrix = parseBiomeMatrixCsv(csvText);
    _matrixCache = matrix;
    return matrix;
  } catch (error) {
    console.error('Failed to load biome matrix:', error);
    // Return empty matrix as fallback
    return {
      version: '1.0.0',
      entries: [],
    };
  }
}

/**
 * Parse CSV text into BiomeMatrix.
 */
function parseBiomeMatrixCsv(csvText: string): BiomeMatrix {
  const lines = csvText.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const entries: BiomeMatrixEntry[] = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Parse CSV line (basic implementation)
    const parts = parseCsvLine(line);
    
    if (parts.length < 11) continue;
    
    const entry: BiomeMatrixEntry = {
      mode: parts[0] as EngineMode,
      bibleId: parts[1],
      biomeId: parts[2],
      siteTags: parts[3].split('|').map((s) => s.trim()),
      allowedEncounterTypes: parts[4].split('|').map((s) => s.trim()),
      allowedActors: parts[5].split('|').map((s) => s.trim()),
      excludedActors: parts[6].split('|').map((s) => s.trim()),
      minTier: parseInt(parts[7], 10) || 1,
      maxTier: parseInt(parts[8], 10) || 10,
      droughtFallback: parts[9],
      notes: parts[10],
    };
    
    entries.push(entry);
  }
  
  return {
    version: '1.0.0',
    entries,
  };
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let currentPart = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  
  // Add the last part
  if (currentPart) {
    parts.push(currentPart.trim());
  }
  
  return parts;
}

/**
 * Clear the matrix cache (for testing).
 */
export function clearBiomeMatrixCache(): void {
  _matrixCache = null;
}

// ============================================================================
// FILTERING LOGIC
// ============================================================================

/**
 * Filter templates by biome constraints.
 * Returns only templates that are legal for the given biome and bible.
 */
export function filterByBiome(
  templates: EncounterTemplate[],
  bibleId: string,
  biomeId: string,
  mode: EngineMode,
  matrix: BiomeMatrix
): EncounterTemplate[] {
  // Find matching matrix entries
  const matrixEntries = matrix.entries.filter(
    (e) => e.mode === mode && e.bibleId === bibleId && e.biomeId === biomeId
  );
  
  if (matrixEntries.length === 0) {
    // No specific rules for this biome - allow all templates from same bible
    return templates.filter((t) => t.bibleId === bibleId && t.mode === mode);
  }
  
  // Collect all allowed and excluded actors across matching entries
  const allowedActors = new Set<string>();
  const excludedActors = new Set<string>();
  const allowedTypes = new Set<string>();
  let minTier = 1;
  let maxTier = 10;
  
  for (const entry of matrixEntries) {
    entry.allowedActors.forEach((a) => allowedActors.add(a));
    entry.excludedActors.forEach((a) => excludedActors.add(a));
    entry.allowedEncounterTypes.forEach((t) => allowedTypes.add(t));
    minTier = Math.max(minTier, entry.minTier);
    maxTier = Math.min(maxTier, entry.maxTier);
  }
  
  // Filter templates
  return templates.filter((template) => {
    // Must be from the same bible
    if (template.bibleId !== bibleId) {
      return false;
    }
    
    // Must be in tier range
    if (template.tierRange[0] > maxTier || template.tierRange[1] < minTier) {
      return false;
    }
    
    // Check if template contains excluded actors
    for (const excludedActor of excludedActors) {
      if (template.name.toLowerCase().includes(excludedActor.toLowerCase())) {
        return false;
      }
    }
    
    // If allowed types are specified, template must match one
    if (allowedTypes.size > 0) {
      const templateType = template.densityRole;
      // Map density roles to encounter types
      const typeMatch = 
        allowedTypes.has(templateType) ||
        allowedTypes.has(`${templateType}-encounter`) ||
        allowedTypes.has('random-encounter') ||
        allowedTypes.has('combat');
      
      if (!typeMatch) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Check if a specific template is legal for a biome/bible combination.
 */
export function isTemplateLegalForBiome(
  template: EncounterTemplate,
  bibleId: string,
  biomeId: string,
  mode: EngineMode,
  matrix: BiomeMatrix
): { legal: boolean; reason?: string } {
  // Bible mismatch is always illegal
  if (template.bibleId !== bibleId) {
    return { 
      legal: false, 
      reason: `Wrong-bible spawn: ${template.id} is for ${template.bibleId}, not ${bibleId}` 
    };
  }
  
  // Find matching matrix entries
  const matrixEntries = matrix.entries.filter(
    (e) => e.mode === mode && e.bibleId === bibleId && e.biomeId === biomeId
  );
  
  if (matrixEntries.length === 0) {
    // No specific rules - allow if same bible
    return { legal: true };
  }
  
  // Check excluded actors
  for (const entry of matrixEntries) {
    for (const excludedActor of entry.excludedActors) {
      if (template.name.toLowerCase().includes(excludedActor.toLowerCase())) {
        return {
          legal: false,
          reason: `Excluded actor: ${excludedActor} not allowed in ${biomeId}`,
        };
      }
    }
  }
  
  // Check tier range
  for (const entry of matrixEntries) {
    if (template.tierRange[0] > entry.maxTier || template.tierRange[1] < entry.minTier) {
      return {
        legal: false,
        reason: `Tier mismatch: template tier ${template.tierRange[0]}-${template.tierRange[1]} outside ${entry.minTier}-${entry.maxTier}`,
      };
    }
  }
  
  return { legal: true };
}

/**
 * Get drought fallback encounter type for a biome when no legal templates exist.
 */
export function getDroughtFallback(
  bibleId: string,
  biomeId: string,
  mode: EngineMode,
  matrix: BiomeMatrix
): string | null {
  const entry = matrix.entries.find(
    (e) => e.mode === mode && e.bibleId === bibleId && e.biomeId === biomeId
  );
  
  return entry?.droughtFallback ?? null;
}

/**
 * Validate that the matrix prevents known wrong-bible spawns.
 * Used in tests to ensure hard filter catches regression cases.
 */
export function validateWrongBiblePrevention(matrix: BiomeMatrix): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Test case 1: Keep Wraith should be excluded from Summoned Pact biomes
  const summonedPactEntries = matrix.entries.filter(
    (e) => e.bibleId === 'summoned-pact'
  );
  
  for (const entry of summonedPactEntries) {
    if (!entry.excludedActors.some((a) => a.toLowerCase().includes('keep-wraith'))) {
      errors.push(
        `Keep Wraith not excluded from summoned-pact biome: ${entry.biomeId}`
      );
    }
  }
  
  // Test case 2: Summoned Pact actors should be excluded from Cursed Keep
  const cursedKeepEntries = matrix.entries.filter(
    (e) => e.bibleId === 'cursed-keep'
  );
  
  for (const entry of cursedKeepEntries) {
    const hasSummonedPactExclusion = entry.excludedActors.some(
      (a) => a.toLowerCase().includes('summoned') || a.toLowerCase().includes('pact')
    );
    
    if (!hasSummonedPactExclusion) {
      errors.push(
        `Summoned Pact actors not excluded from cursed-keep biome: ${entry.biomeId}`
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
