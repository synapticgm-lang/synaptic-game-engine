/**
 * WS-4 Wave A: Encounter Biome Matrix
 * 
 * Biome-appropriate spawn filters (no Keep Wraith on Shattered Coast).
 * Hard-coded filter prevents wrong-bible encounters.
 */

import type { GameState } from './types';
import type { EncounterTemplate } from './encounterBible';

// ============================================================================
// BIOME DETECTION
// ============================================================================

/**
 * Detect biome from location
 */
export function detectBiome(location: string): string {
  const lower = location.toLowerCase();
  
  // Urban
  if (/\b(city|town|settlement|outpost|hub)\b/.test(lower)) {
    if (/\b(ruin|destroyed|abandoned|desolate)\b/.test(lower)) {
      return 'urban_ruin';
    }
    return 'urban';
  }
  
  // Dungeon
  if (/\b(dungeon|crypt|tomb|vault|keep)\b/.test(lower)) {
    return 'dungeon';
  }
  if (/\b(cave|cavern|grotto|underground)\b/.test(lower)) {
    return 'dungeon_natural';
  }
  
  // Wilderness
  if (/\b(forest|woods|jungle)\b/.test(lower)) {
    return 'wilderness';
  }
  if (/\b(swamp|marsh)\b/.test(lower)) {
    return 'wilderness';
  }
  if (/\b(plains|grassland|field|meadow)\b/.test(lower)) {
    return 'wilderness_open';
  }
  if (/\b(mountain|hills|peak|cliff)\b/.test(lower)) {
    return 'wilderness_mountain';
  }
  
  // Coastal
  if (/\b(coast|shore|beach|harbor|dock)\b/.test(lower)) {
    return 'coastal';
  }
  if (/\b(sea|ocean|bay|inlet)\b/.test(lower)) {
    return 'coastal_water';
  }
  
  // Road
  if (/\b(road|path|trail|highway|route)\b/.test(lower)) {
    return 'road';
  }
  
  // Special
  if (/\b(desert|dunes|wasteland|badlands)\b/.test(lower)) {
    return 'desert';
  }
  if (/\b(tundra|ice|snow|frozen)\b/.test(lower)) {
    return 'arctic';
  }
  if (/\b(volcano|lava|ash|crater)\b/.test(lower)) {
    return 'volcanic';
  }
  
  // Default
  return 'unknown';
}

// ============================================================================
// WRONG-BIBLE DETECTION
// ============================================================================

/**
 * Bible-specific encounter exclusions
 * 
 * Hard-coded to prevent wrong-bible spawns like Keep Wraith on Shattered Coast.
 */
export const BIBLE_EXCLUSIONS: Record<string, string[]> = {
  'summoned-pact': [
    'Keep Wraith',        // Cursed Keep only
    'Saltmar Raider',     // Shattered Coast only
    'Salt Road Bandit',   // Salt Road only
  ],
  'cursed-keep': [
    'Pact-Hunter',        // Summoned Pact only
    'Saltmar Raider',     // Shattered Coast only
    'Hub Patrol',         // Urban only
  ],
  'shattered-coast': [
    'Keep Wraith',        // Cursed Keep only
    'Pact-Hunter',        // Summoned Pact only
    'Salt Road Bandit',   // Salt Road only
  ],
  'salt-road-heist': [
    'Keep Wraith',        // Cursed Keep only
    'Pact-Hunter',        // Summoned Pact only
    'Saltmar Raider',     // Shattered Coast only
  ],
};

/**
 * Check if encounter is wrong-bible
 */
export function isWrongBibleEncounter(
  encounterName: string,
  bibleId: string
): boolean {
  const exclusions = BIBLE_EXCLUSIONS[bibleId];
  if (!exclusions) return false;
  
  return exclusions.some(excluded => 
    encounterName.toLowerCase().includes(excluded.toLowerCase())
  );
}

/**
 * Filter out wrong-bible encounters
 */
export function filterWrongBibleEncounters(
  templates: EncounterTemplate[],
  bibleId: string
): EncounterTemplate[] {
  return templates.filter(t => !isWrongBibleEncounter(t.name, bibleId));
}

// ============================================================================
// BIOME VALIDATION
// ============================================================================

/**
 * Validate that encounter matches biome
 */
export function validateEncounterBiome(
  template: EncounterTemplate,
  location: string
): {
  valid: boolean;
  reason?: string;
} {
  const biome = detectBiome(location);
  const constraints = template.biomeConstraints;
  
  // Check excluded biomes
  if (constraints.excludedBiomes) {
    for (const excluded of constraints.excludedBiomes) {
      if (biome === excluded) {
        return {
          valid: false,
          reason: `Encounter excluded from ${biome} biome`,
        };
      }
    }
  }
  
  // Check allowed biomes
  const biomeMatch = constraints.allowedBiomes.includes(biome);
  if (!biomeMatch) {
    return {
      valid: false,
      reason: `Encounter not allowed in ${biome} biome (allowed: ${constraints.allowedBiomes.join(', ')})`,
    };
  }
  
  // Check required locations
  if (constraints.requiredLocations) {
    const locationLower = location.toLowerCase();
    const hasRequired = constraints.requiredLocations.some(req =>
      locationLower.includes(req.toLowerCase())
    );
    
    if (!hasRequired) {
      return {
        valid: false,
        reason: `Encounter requires location type: ${constraints.requiredLocations.join(' or ')}`,
      };
    }
  }
  
  // Check excluded locations
  if (constraints.excludedLocations) {
    const locationLower = location.toLowerCase();
    const hasExcluded = constraints.excludedLocations.some(excl =>
      locationLower.includes(excl.toLowerCase())
    );
    
    if (hasExcluded) {
      return {
        valid: false,
        reason: `Encounter excluded from ${location} type locations`,
      };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// BIOME MATRIX QUERY
// ============================================================================

/**
 * Get valid encounters for biome
 */
export function getValidEncountersForBiome(
  templates: EncounterTemplate[],
  location: string,
  bibleId: string
): EncounterTemplate[] {
  // Filter out wrong-bible first
  let valid = filterWrongBibleEncounters(templates, bibleId);
  
  // Then validate biome
  valid = valid.filter(t => validateEncounterBiome(t, location).valid);
  
  return valid;
}

/**
 * Build biome situation section
 */
export function buildBiomeSituationSection(
  location: string,
  state: GameState
): string {
  const biome = detectBiome(location);
  
  const lines: string[] = ['### BIOME'];
  lines.push(`Current biome: **${biome.replace(/_/g, ' ')}**`);
  lines.push(`Location: ${location}`);
  
  // Add biome-specific notes
  switch (biome) {
    case 'urban':
      lines.push('*Urban area: patrols, merchants, officials*');
      break;
    case 'urban_ruin':
      lines.push('*Ruined urban: ambushes, scavengers, hidden threats*');
      break;
    case 'dungeon':
      lines.push('*Dungeon: structured encounters, traps, boss at end*');
      break;
    case 'coastal':
      lines.push('*Coastal area: maritime threats, smugglers, storms*');
      break;
    case 'road':
      lines.push('*Road: bandits, travelers, random encounters*');
      break;
    case 'wilderness':
      lines.push('*Wilderness: beasts, weather, navigation challenges*');
      break;
  }
  
  return lines.join('\n');
}
