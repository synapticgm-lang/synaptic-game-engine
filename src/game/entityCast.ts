/**
 * entityCast.ts
 * 
 * Builds explicit CAST block enumerating all entities physically present.
 * Prevents LLM from inventing "a figure", "someone nearby", or treating
 * UI labels as character names.
 * 
 * Part of Flash Lite Input Sanitization Architecture (2026-09-02)
 * P0: Strict Entity Isolation via CAST Block
 */

import type { GameState, NpcMemory, Encounter } from './types';
import { isUiLabel } from './narrativeTranslator';

export interface CastMember {
  name: string;
  role: string;
  disposition: string;
  firstSeen: number;
  pinned: boolean;
}

export interface AnonymousGroup {
  type: string;
  count: number | string;
  activity: string;
  alertLevel: string;
}

export interface ThreatEntity {
  name: string;
  level: number;
  hp: string;
  state: string;
}

export interface Cast {
  named: CastMember[];
  anonymous: AnonymousGroup[];
  threats: ThreatEntity[];
  constraints: string[];
}

/**
 * Main function - builds complete CAST block
 * 
 * Now includes hub arrival contacts to prevent madlib injection
 * (2026-09-02c fix for 02b regression)
 */
export function buildEntityCast(state: GameState): string {
  const cast: Cast = {
    named: extractNamedCharacters(state),
    anonymous: extractAnonymousEntities(state),
    threats: extractActiveThreats(state),
    constraints: generateConstraints(state),
  };
  
  return formatCastBlock(cast);
}

/**
 * Extract named characters (NPCs with memory/personality)
 * 
 * Now includes hub arrival contacts to prevent madlib injection
 * (2026-09-02c fix for 02b regression)
 */
function extractNamedCharacters(state: GameState): CastMember[] {
  const present = state.sceneFacts?.present ?? [];
  const memories = state.npcMemories ?? [];
  const pinned = state.openingEstablishment?.pinnedNpcNames ?? [];
  const timeline = state.timeline ?? [];
  
  const named: CastMember[] = [];
  
  for (const token of present) {
    // Skip UI labels
    if (isUiLabel(token)) continue;
    
    // Check if this is a known NPC
    const memory = memories.find(m => m.npcName === token);
    if (memory) {
      named.push({
        name: token,
        role: memory.role ?? 'character',
        disposition: memory.disposition ?? 'neutral',
        firstSeen: findFirstSeenTurn(token, timeline),
        pinned: pinned.includes(token),
      });
    } else if (isProperName(token)) {
      // Looks like a proper name - treat as named even without memory
      named.push({
        name: token,
        role: 'character',
        disposition: 'neutral',
        firstSeen: state.turn ?? 0,
        pinned: pinned.includes(token),
      });
    }
  }
  
  // Add companion if not already in list
  if (state.companion && !named.some(n => n.name === state.companion)) {
    const memory = memories.find(m => m.npcName === state.companion);
    named.push({
      name: state.companion,
      role: memory?.role ?? 'companion',
      disposition: memory?.disposition ?? 'friendly',
      firstSeen: findFirstSeenTurn(state.companion, timeline),
      pinned: false,
    });
  }
  
  // Add hub arrival contact if present (2026-09-02c fix)
  const hubContact = extractHubArrivalContact(state);
  if (hubContact && !named.some(n => n.name === hubContact.name)) {
    named.push(hubContact);
  }
  
  return named;
}

/**
 * Extract hub arrival contact if present
 * 
 * Prevents "Lowmarket Fence" / "Scattered Scale" madlib injection
 * by including hub contacts in the CAST whitelist.
 * 
 * Added 2026-09-02c to fix 02b regression (30+ madlib violations)
 */
function extractHubArrivalContact(state: GameState): CastMember | null {
  // Import locally to avoid circular dependency
  const hubEncounters = require('./hubEncounters');
  const resolved = hubEncounters.resolveHubArrival(state, state.currentLocation);
  
  if (!resolved?.beat.contactName) return null;
  
  return {
    name: resolved.beat.contactName,
    role: resolved.beat.kind === 'social' ? 'hub contact' : 'character',
    disposition: 'neutral',
    firstSeen: state.turn ?? 0,
    pinned: false,
  };
}

/**
 * Extract anonymous entities (crowd, guards, background figures)
 */
function extractAnonymousEntities(state: GameState): AnonymousGroup[] {
  const present = state.sceneFacts?.present ?? [];
  const crowdSize = state.sceneFacts?.crowdCount ?? 0;
  const tension = state.sceneFacts?.tension ?? 'low';
  const groups: AnonymousGroup[] = [];
  
  // Check for faction tokens that indicate guards/patrols
  const hasConsulToken = present.some(p => /consul/i.test(p));
  const hasGuardToken = present.some(p => /guard/i.test(p));
  
  if (hasConsulToken || hasGuardToken) {
    const count = crowdSize > 0 ? crowdSize : '3-4';
    groups.push({
      type: 'Consul faction guards',
      count,
      activity: 'patrol the camp',
      alertLevel: tension,
    });
  }
  
  // Check for generic crowd
  if (crowdSize > 5 && groups.length === 0) {
    groups.push({
      type: 'bystanders',
      count: crowdSize,
      activity: 'going about their business',
      alertLevel: tension,
    });
  }
  
  // Check for other faction indicators
  const factionTokens = present.filter(p => 
    /faction|guild|clan|gang|crew/i.test(p) && !isProperName(p)
  );
  
  for (const token of factionTokens) {
    if (!groups.some(g => g.type.toLowerCase().includes(token.toLowerCase()))) {
      groups.push({
        type: `${token} members`,
        count: '2-3',
        activity: 'observing',
        alertLevel: tension,
      });
    }
  }
  
  return groups;
}

/**
 * Extract active threats (hostile encounters)
 */
function extractActiveThreats(state: GameState): ThreatEntity[] {
  const threats: ThreatEntity[] = [];
  
  if (state.activeEncounter) {
    const enc = state.activeEncounter;
    threats.push({
      name: enc.name,
      level: enc.level ?? 1,
      hp: `${enc.hp}/${enc.maxHp}`,
      state: determineThreatState(enc),
    });
  }
  
  return threats;
}

/**
 * Determine threat state from encounter
 */
function determineThreatState(encounter: Encounter): string {
  const hpPercent = (encounter.hp / encounter.maxHp) * 100;
  
  if (hpPercent >= 80) return 'fresh, aggressive';
  if (hpPercent >= 50) return 'engaged, determined';
  if (hpPercent >= 25) return 'wounded, dangerous';
  return 'severely wounded, desperate';
}

/**
 * Generate binding constraints based on state
 */
function generateConstraints(state: GameState): string[] {
  const constraints: string[] = [
    'Do NOT invent "a figure", "someone nearby", "a merchant", "another guard" or any unlisted entity',
    'If the player wants to interact with someone new, they must travel or search',
  ];
  
  // Alone arrival
  if (state.openingEstablishment?.aloneArrival) {
    constraints.push(
      'ALONE ARRIVAL: No handlers, watchers, or voices outside until ledger establishes presence'
    );
  }
  
  // High security
  if (state.sceneFacts?.tension === 'high') {
    constraints.push(
      'Guards are plural background - not individual named characters unless promoted by ledger'
    );
  }
  
  // UI label constraints
  constraints.push(
    'Do NOT use "Consul" as a character name - this is a faction label',
    'Do NOT use "Heat" as a person - this is a security state variable'
  );
  
  return constraints;
}

/**
 * Format CAST block as XML with all sections
 */
function formatCastBlock(cast: Cast): string {
  const lines = [
    '<CAST>',
    'This is the complete list of entities physically present in this scene.',
    'ONLY entities explicitly listed below may appear, speak, or act in your narration.',
    'You MUST NOT invent additional people, creatures, or speakers beyond this list.',
    '',
  ];
  
  // Named characters
  if (cast.named.length > 0) {
    lines.push('NAMED CHARACTERS (may speak, act, have agency):');
    for (const char of cast.named) {
      const pin = char.pinned ? ' [OPENING PIN - consequential]' : '';
      lines.push(
        `- ${char.name} (${char.role}, ${char.disposition}, present since T${char.firstSeen})${pin}`
      );
    }
    lines.push('');
  }
  
  // Anonymous entities
  if (cast.anonymous.length > 0) {
    lines.push('ANONYMOUS ENTITIES (background only, no individual agency):');
    for (const group of cast.anonymous) {
      lines.push(
        `- ${group.count} ${group.type} (${group.activity}, ${group.alertLevel} alert)`
      );
    }
    lines.push('');
  }
  
  // Active threats
  if (cast.threats.length > 0) {
    lines.push('ACTIVE THREATS:');
    for (const threat of cast.threats) {
      lines.push(
        `- ${threat.name} (Level ${threat.level}, ${threat.hp} HP, ${threat.state})`
      );
    }
    lines.push('');
  } else {
    lines.push('ACTIVE THREATS: None');
    lines.push('');
  }
  
  // Constraints
  lines.push('CONSTRAINTS:');
  for (const constraint of cast.constraints) {
    lines.push(`- ${constraint}`);
  }
  
  lines.push('</CAST>');
  
  return lines.join('\n');
}

/**
 * Find first turn when entity appeared in timeline
 */
function findFirstSeenTurn(entityName: string, timeline: any[]): number {
  for (const entry of timeline) {
    if (entry.sceneFacts?.present?.includes(entityName)) {
      return entry.turn ?? 0;
    }
  }
  return 0;
}

/**
 * Check if token looks like a proper name
 */
function isProperName(token: string): boolean {
  return /^[A-Z][a-z'-]{1,20}$/.test(token);
}

/**
 * Get cast summary for debugging
 */
export function getCastSummary(state: GameState): {
  namedCount: number;
  anonymousCount: number;
  threatsCount: number;
  constraintsCount: number;
} {
  const cast: Cast = {
    named: extractNamedCharacters(state),
    anonymous: extractAnonymousEntities(state),
    threats: extractActiveThreats(state),
    constraints: generateConstraints(state),
  };
  
  return {
    namedCount: cast.named.length,
    anonymousCount: cast.anonymous.length,
    threatsCount: cast.threats.length,
    constraintsCount: cast.constraints.length,
  };
}
