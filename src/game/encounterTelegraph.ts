/**
 * WS-4 Wave A: Encounter Telegraph
 * 
 * Warning patterns before engagement (STATUS, NPC, scene, item, faction).
 */

import type { GameState } from './types';
import type { EncounterTemplate, TelegraphPattern } from './encounterBible';

// ============================================================================
// TELEGRAPH GENERATION
// ============================================================================

/**
 * Generate telegraph for encounter
 * 
 * Picks appropriate pattern and format based on timing and type.
 */
export function generateTelegraph(
  template: EncounterTemplate,
  state: GameState,
  seed: number
): {
  type: 'status' | 'npc' | 'scene' | 'item' | 'faction' | 'none';
  text: string;
  timing: 'none' | 'same-turn' | '1-turn-before' | '2-turns-before';
} | null {
  const telegraph = template.telegraph;
  
  if (telegraph.timing === 'none' || telegraph.patterns.length === 0) {
    return null;
  }
  
  // Pick pattern based on seed and probabilities
  const roll = (Math.abs(seed) % 100) / 100;
  let cumulative = 0;
  
  for (const pattern of telegraph.patterns) {
    cumulative += pattern.probability;
    if (roll <= cumulative) {
      return {
        type: pattern.type,
        text: pattern.text,
        timing: telegraph.timing,
      };
    }
  }
  
  // Fallback to first pattern
  return {
    type: telegraph.patterns[0].type,
    text: telegraph.patterns[0].text,
    timing: telegraph.timing,
  };
}

// ============================================================================
// TELEGRAPH FORMATTING
// ============================================================================

/**
 * Format telegraph as STATUS alert
 */
export function formatStatusTelegraph(text: string, encounterName: string): string {
  return `**STATUS ALERT:** ${text}`;
}

/**
 * Format telegraph as NPC warning
 */
export function formatNpcTelegraph(
  text: string,
  npcName: string | null
): string {
  if (!npcName) {
    return `Someone nearby warns: "${text}"`;
  }
  return `${npcName} warns: "${text}"`;
}

/**
 * Format telegraph as scene cue
 */
export function formatSceneTelegraph(text: string): string {
  return text; // Descriptive prose, no prefix
}

/**
 * Format telegraph as item hint
 */
export function formatItemTelegraph(text: string): string {
  return `You notice: ${text}`;
}

/**
 * Format telegraph as faction intel
 */
export function formatFactionTelegraph(text: string, factionName: string): string {
  return `${factionName} intel: ${text}`;
}

// ============================================================================
// TELEGRAPH INTEGRATION
// ============================================================================

/**
 * Build telegraph section for situation packet
 */
export function buildTelegraphSituationSection(
  template: EncounterTemplate,
  state: GameState,
  seed: number
): string {
  const telegraph = generateTelegraph(template, state, seed);
  if (!telegraph) return '';
  
  const lines: string[] = ['### ENCOUNTER TELEGRAPH'];
  
  switch (telegraph.type) {
    case 'status':
      lines.push(formatStatusTelegraph(telegraph.text, template.name));
      break;
    case 'npc':
      const npc = (state.sceneFacts?.present ?? [])[0] ?? null;
      lines.push(formatNpcTelegraph(telegraph.text, npc));
      break;
    case 'scene':
      lines.push(formatSceneTelegraph(telegraph.text));
      break;
    case 'item':
      lines.push(formatItemTelegraph(telegraph.text));
      break;
    case 'faction':
      const faction = Object.keys(state.worldLedger?.factionStandings ?? {})[0] ?? 'Unknown';
      lines.push(formatFactionTelegraph(telegraph.text, faction));
      break;
  }
  
  // Add avoidance note
  if (template.telegraph.avoidable) {
    lines.push('*(This encounter can be avoided if you act carefully)*');
  }
  
  return lines.join('\n');
}

/**
 * Check if player is ignoring telegraphs
 * 
 * If player has seen 3+ telegraphs and hasn't avoided any, flag it.
 */
export function checkTelegraphIgnorance(state: GameState): {
  ignoringTelegraphs: boolean;
  telegraphCount: number;
  avoidedCount: number;
} {
  // This would track telegraph history
  // For Wave A, return stub data
  return {
    ignoringTelegraphs: false,
    telegraphCount: 0,
    avoidedCount: 0,
  };
}
