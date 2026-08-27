/**
 * P0.1 - Typed Entity Validator (upgraded from string scrub)
 * 
 * Generate from typed entities → validate referents → regenerate once → 
 * explicit noun fallback with telemetry flag.
 * 
 * Not: Delete `them`, `this place`, `the stranger` after generation.
 * 
 * Target:
 * - themWordHits ≤10 on DnD 300t
 * - stranger body ≤20 on RPG/PYOA
 * - 0 broken-stranger options
 * - Track invalid references per 100 turns + regeneration rate
 */

import type { GameState } from './types';

export interface EntityReference {
  /** The pronoun or vague reference used */
  text: string;
  /** What it should have referred to */
  expected?: string;
  /** Line number or position in the prose */
  position: number;
}

export interface InvalidReferenceReport {
  /** Number of `them` references without clear antecedent */
  themCount: number;
  /** Number of `this place` / `the place` references when location is named */
  thisPlaceCount: number;
  /** Number of `the stranger` / `a stranger` when NPC should be named */
  strangerCount: number;
  /** Number of broken option labels like "Check the stranger" when no stranger exists */
  brokenChoiceCount: number;
  /** All invalid references found */
  references: EntityReference[];
  /** Should prose be regenerated? */
  shouldRegenerate: boolean;
}

export interface TypedEntityContext {
  /** Named NPCs present in the scene */
  presentNpcs: string[];
  /** Named companions */
  companions: string[];
  /** Current location name */
  locationName?: string;
  /** Recent speaker from last turn */
  lastSpeaker?: string;
  /** Props and interactables in the scene */
  sceneObjects: string[];
  /** Inventory item names */
  inventoryItems: string[];
  /** Is this an alone arrival scene? */
  aloneArrival: boolean;
  /** Active encounter enemy name */
  encounterName?: string;
}

/**
 * Extract typed entity context from game state for validation.
 */
export function extractEntityContext(state: GameState): TypedEntityContext {
  const presentNpcs = [...(state.sceneFacts?.present ?? [])];
  const companions = (state.companions ?? []).map(c => c.name).filter(Boolean);
  const locationName = state.currentLocation;
  
  // Recent speaker - look for last NPC who spoke
  const log = state.log ?? [];
  let lastSpeaker: string | undefined;
  for (let i = log.length - 1; i >= Math.max(0, log.length - 3); i--) {
    const entry = log[i];
    if (entry?.role === 'gm' && entry.content) {
      const speakerMatch = entry.content.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:says?|asks?|replies?|tells?|speaks?)/);
      if (speakerMatch) {
        lastSpeaker = speakerMatch[1];
        break;
      }
    }
  }
  
  const sceneObjects = [
    ...(state.sceneFacts?.props ?? []),
    ...(state.locationSheet?.interactables ?? []).map(i => i.name).filter(Boolean),
  ];
  
  const inventoryItems = (state.inventory ?? []).map(i => i.name).filter(Boolean);
  
  const aloneArrival = state.openingEstablishment?.aloneArrival === true;
  
  const encounterName = state.activeEncounter?.name;
  
  return {
    presentNpcs,
    companions,
    locationName,
    lastSpeaker,
    sceneObjects,
    inventoryItems,
    aloneArrival,
    encounterName,
  };
}

/**
 * Validate prose for invalid entity references.
 */
export function validateEntityReferences(
  prose: string,
  context: TypedEntityContext
): InvalidReferenceReport {
  const references: EntityReference[] = [];
  let themCount = 0;
  let thisPlaceCount = 0;
  let strangerCount = 0;
  
  const lines = prose.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Check for orphan "them" without clear antecedent
    const themMatches = line.match(/\b(them|they|their|theirs)\b/gi);
    if (themMatches) {
      // Check if there's a clear plural antecedent nearby
      const hasPlural = context.presentNpcs.length > 1 
        || /\b(people|crowd|group|handlers?|watchers?|officials?|merchants?)\b/i.test(line);
      
      if (!hasPlural) {
        themCount += themMatches.length;
        references.push({
          text: themMatches[0],
          expected: context.lastSpeaker || context.presentNpcs[0] || 'specific person',
          position: i,
        });
      }
    }
    
    // Check for "this place" / "the place" when location has a name
    if (context.locationName && context.locationName.length > 3) {
      const placeMatches = line.match(/\b(this place|the place|this location)\b/gi);
      if (placeMatches) {
        thisPlaceCount += placeMatches.length;
        references.push({
          text: placeMatches[0],
          expected: context.locationName,
          position: i,
        });
      }
    }
    
    // Check for "the stranger" / "a stranger" when NPC should be named
    const strangerMatches = line.match(/\b(the stranger|a stranger|the figure|a figure|the person|a person)\b/gi);
    if (strangerMatches) {
      // OK if: alone arrival, no NPCs present, or combat with unnamed creature
      const allowedStranger = context.aloneArrival 
        || (context.presentNpcs.length === 0 && !context.encounterName)
        || /\b(unknown|mysterious|cloaked|hooded)\b/i.test(line);
      
      if (!allowedStranger && context.presentNpcs.length > 0) {
        strangerCount += strangerMatches.length;
        references.push({
          text: strangerMatches[0],
          expected: context.presentNpcs[0] || 'named NPC',
          position: i,
        });
      }
    }
  }
  
  // Should regenerate if there are significant invalid references
  const shouldRegenerate = themCount >= 3 || thisPlaceCount >= 2 || strangerCount >= 2;
  
  return {
    themCount,
    thisPlaceCount,
    strangerCount,
    brokenChoiceCount: 0, // Will be filled by choice validator
    references,
    shouldRegenerate,
  };
}

/**
 * Validate a choice option for invalid entity references.
 */
export function validateChoiceReference(
  choice: string,
  context: TypedEntityContext
): { valid: boolean; reason?: string } {
  const lower = choice.toLowerCase();
  
  // Check for "Check the stranger" / "Talk to the stranger" when no stranger
  if (/\b(the stranger|a stranger|the figure|a figure)\b/i.test(choice)) {
    if (context.aloneArrival || context.presentNpcs.length === 0) {
      return {
        valid: false,
        reason: 'References stranger/figure when scene has no established NPCs',
      };
    }
  }
  
  // Check for "them" references in choices
  if (/\b(them|their)\b/i.test(choice)) {
    const hasPlural = context.presentNpcs.length > 1;
    if (!hasPlural) {
      return {
        valid: false,
        reason: 'References "them" without plural antecedent',
      };
    }
  }
  
  // Check for "this place" when location is named
  if (/\b(this place|the place)\b/i.test(choice)) {
    if (context.locationName && context.locationName.length > 3) {
      return {
        valid: false,
        reason: `Should use location name: ${context.locationName}`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Rewrite prose to replace invalid references with explicit nouns.
 * This is the fallback when regeneration would be too expensive.
 */
export function rewriteInvalidReferences(
  prose: string,
  context: TypedEntityContext,
  report: InvalidReferenceReport
): string {
  let rewritten = prose;
  
  // Replace "them" with explicit name when there's a single NPC
  if (report.themCount > 0 && context.presentNpcs.length === 1) {
    const npc = context.presentNpcs[0];
    rewritten = rewritten.replace(/\bthey\b/gi, npc);
    rewritten = rewritten.replace(/\bthem\b/gi, npc);
    rewritten = rewritten.replace(/\btheir\b/gi, `${npc}'s`);
  } else if (report.themCount > 0 && context.lastSpeaker) {
    const npc = context.lastSpeaker;
    rewritten = rewritten.replace(/\bthey\b/gi, npc);
    rewritten = rewritten.replace(/\bthem\b/gi, npc);
    rewritten = rewritten.replace(/\btheir\b/gi, `${npc}'s`);
  }
  
  // Replace "this place" with location name
  if (report.thisPlaceCount > 0 && context.locationName) {
    rewritten = rewritten.replace(/\bthis place\b/gi, context.locationName);
    rewritten = rewritten.replace(/\bthe place\b/gi, context.locationName);
  }
  
  // Replace "the stranger" with explicit name
  if (report.strangerCount > 0 && context.presentNpcs.length > 0) {
    const npc = context.presentNpcs[0];
    rewritten = rewritten.replace(/\bthe stranger\b/gi, npc);
    rewritten = rewritten.replace(/\ba stranger\b/gi, npc);
    rewritten = rewritten.replace(/\bthe figure\b/gi, npc);
    rewritten = rewritten.replace(/\ba figure\b/gi, npc);
  }
  
  return rewritten;
}

/**
 * Build a retry block for regeneration with typed entity context.
 */
export function buildEntityRetryBlock(
  context: TypedEntityContext,
  report: InvalidReferenceReport
): string {
  const issues: string[] = [];
  
  if (report.themCount > 0) {
    const expected = context.presentNpcs[0] || context.lastSpeaker || 'a named person';
    issues.push(`- Used "them/they/their" ${report.themCount} times without clear antecedent. Use: ${expected}`);
  }
  
  if (report.thisPlaceCount > 0 && context.locationName) {
    issues.push(`- Used "this place" ${report.thisPlaceCount} times. Use: ${context.locationName}`);
  }
  
  if (report.strangerCount > 0 && context.presentNpcs.length > 0) {
    issues.push(`- Used "stranger/figure" ${report.strangerCount} times. Use: ${context.presentNpcs[0]}`);
  }
  
  const availableEntities = [
    `Present NPCs: ${context.presentNpcs.join(', ') || 'none'}`,
    `Companions: ${context.companions.join(', ') || 'none'}`,
    `Location: ${context.locationName || 'unspecified'}`,
    `Last speaker: ${context.lastSpeaker || 'none'}`,
    context.encounterName ? `Enemy: ${context.encounterName}` : null,
  ].filter(Boolean);
  
  return `=== ENTITY REFERENCE RETRY (BINDING) ===
Your prior reply used vague pronouns instead of explicit nouns.

Invalid references found:
${issues.join('\n')}

AUTHORITY - Available typed entities:
${availableEntities.join('\n')}

REQUIRED: Rewrite with EXPLICIT NOUNS. Never use "them", "they", "this place", or "the stranger" when a specific name is available. When multiple people are present, use "the group" or list names. When location is established, use its name.
================================================`;
}

/**
 * Telemetry for tracking validation metrics.
 */
export interface EntityValidationTelemetry {
  turn: number;
  themCount: number;
  thisPlaceCount: number;
  strangerCount: number;
  brokenChoiceCount: number;
  totalInvalidReferences: number;
  regenerated: boolean;
  rewritten: boolean;
}

/**
 * Track validation metrics for telemetry.
 */
export function trackValidationMetrics(
  state: GameState,
  report: InvalidReferenceReport,
  regenerated: boolean,
  rewritten: boolean
): EntityValidationTelemetry {
  return {
    turn: state.turn,
    themCount: report.themCount,
    thisPlaceCount: report.thisPlaceCount,
    strangerCount: report.strangerCount,
    brokenChoiceCount: report.brokenChoiceCount,
    totalInvalidReferences: report.references.length,
    regenerated,
    rewritten,
  };
}

/**
 * Calculate validation score for a 100-turn window.
 * Returns metrics for Manus acceptance gates.
 */
export function calculateValidationScore(
  telemetry: EntityValidationTelemetry[],
  windowSize: number = 100
): {
  themWordHits: number;
  strangerBodyCount: number;
  thisPlaceCount: number;
  brokenChoiceCount: number;
  invalidReferencesPer100Turns: number;
  regenerationRate: number;
} {
  const recent = telemetry.slice(-windowSize);
  
  const themWordHits = recent.reduce((sum, t) => sum + t.themCount, 0);
  const strangerBodyCount = recent.reduce((sum, t) => sum + t.strangerCount, 0);
  const thisPlaceCount = recent.reduce((sum, t) => sum + t.thisPlaceCount, 0);
  const brokenChoiceCount = recent.reduce((sum, t) => sum + t.brokenChoiceCount, 0);
  const totalInvalidReferences = recent.reduce((sum, t) => sum + t.totalInvalidReferences, 0);
  const regenerationCount = recent.filter(t => t.regenerated).length;
  
  return {
    themWordHits,
    strangerBodyCount,
    thisPlaceCount,
    brokenChoiceCount,
    invalidReferencesPer100Turns: totalInvalidReferences,
    regenerationRate: regenerationCount / Math.max(1, recent.length),
  };
}
