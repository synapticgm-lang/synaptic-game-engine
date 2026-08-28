/**
 * WS-2 Wave A: NPC Memory Ledger
 * 
 * Key moments storage: first_meet, quest_critical, betrayal, etc.
 * Tracks provenance and visibility for cross-NPC memory sync.
 */

import type { GameState } from './types';
import type { NpcKeyMoment } from './types/crossPackageContracts';

// ============================================================================
// MEMORY LEDGER
// ============================================================================

export interface NpcMemoryLedger {
  /** NPC identifier */
  npcId: string;
  
  /** Key moments */
  keyMoments: NpcKeyMoment[];
  
  /** Last updated turn */
  lastUpdated: number;
}

// ============================================================================
// KEY MOMENT CREATION
// ============================================================================

/**
 * Create key moment
 */
export function createKeyMoment(
  npcId: string,
  category: NpcKeyMoment['category'],
  data: Record<string, unknown>,
  state: GameState,
  opts?: {
    provenance?: NpcKeyMoment['provenance'];
    visibility?: NpcKeyMoment['visibility'];
    retention?: NpcKeyMoment['retention'];
  }
): NpcKeyMoment {
  const id = `km-${npcId}-${category}-${state.turn}`;
  
  return {
    id,
    npcId,
    category,
    turn: state.turn,
    data,
    provenance: opts?.provenance ?? 'direct',
    visibility: opts?.visibility ?? 'private',
    retention: opts?.retention ?? 'campaign',
  };
}

/**
 * Append key moment to NPC memory
 */
export function appendKeyMoment(
  npcId: string,
  moment: NpcKeyMoment,
  state: GameState
): GameState {
  const memories = state.arcDirector?.npcMemories ?? [];
  const existing = memories.find(m => m.npcId === npcId);
  
  if (existing) {
    // Deduplicate: don't add if same category exists in last 5 turns
    const recent = existing.keyMoments.filter(
      km => km.category === moment.category && state.turn - km.turn <= 5
    );
    
    if (recent.length > 0) {
      // Already recorded recently, skip
      return state;
    }
    
    // Append to existing
    const updated: NpcMemoryLedger = {
      ...existing,
      keyMoments: [...existing.keyMoments, moment].slice(-50), // Keep last 50
      lastUpdated: state.turn,
    };
    
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcMemories: memories.map(m => (m.npcId === npcId ? updated : m)),
      },
    };
  } else {
    // Create new memory ledger
    const newLedger: NpcMemoryLedger = {
      npcId,
      keyMoments: [moment],
      lastUpdated: state.turn,
    };
    
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcMemories: [...memories, newLedger],
      },
    };
  }
}

// ============================================================================
// KEY MOMENT QUERIES
// ============================================================================

/**
 * Get key moments for NPC
 */
export function getKeyMoments(
  npcId: string,
  state: GameState
): NpcKeyMoment[] {
  const ledger = (state.arcDirector?.npcMemories ?? []).find(m => m.npcId === npcId);
  return ledger?.keyMoments ?? [];
}

/**
 * Get recent key moments (last N turns)
 */
export function getRecentKeyMoments(
  npcId: string,
  state: GameState,
  turns: number = 20
): NpcKeyMoment[] {
  const moments = getKeyMoments(npcId, state);
  const cutoff = state.turn - turns;
  return moments.filter(km => km.turn >= cutoff);
}

/**
 * Get key moments by category
 */
export function getKeyMomentsByCategory(
  npcId: string,
  category: NpcKeyMoment['category'],
  state: GameState
): NpcKeyMoment[] {
  return getKeyMoments(npcId, state).filter(km => km.category === category);
}

/**
 * Check if key moment exists
 */
export function hasKeyMoment(
  npcId: string,
  category: NpcKeyMoment['category'],
  state: GameState
): boolean {
  return getKeyMomentsByCategory(npcId, category, state).length > 0;
}

// ============================================================================
// CROSS-NPC MEMORY SYNC
// ============================================================================

/**
 * Broadcast key moment to witnesses
 * 
 * When an event is visible to multiple NPCs, create witness memories.
 */
export function broadcastKeyMoment(
  sourceMoment: NpcKeyMoment,
  witnesses: string[],
  state: GameState
): GameState {
  let next = state;
  
  for (const witnessId of witnesses) {
    if (witnessId === sourceMoment.npcId) continue; // Skip source
    
    const witnessMoment = createKeyMoment(
      witnessId,
      'witness',
      {
        witnessedNpc: sourceMoment.npcId,
        witnessedCategory: sourceMoment.category,
        witnessedData: sourceMoment.data,
      },
      state,
      {
        provenance: 'witnessed',
        visibility: sourceMoment.visibility,
        retention: sourceMoment.retention,
      }
    );
    
    next = appendKeyMoment(witnessId, witnessMoment, next);
  }
  
  return next;
}

/**
 * Broadcast to faction
 * 
 * When an event affects faction standing, all faction NPCs learn about it.
 */
export function broadcastToFaction(
  sourceMoment: NpcKeyMoment,
  factionId: string,
  state: GameState
): GameState {
  // Get all NPCs with this faction
  const factionNpcs = (state.arcDirector?.npcLifecycles ?? [])
    .filter(lc => {
      // Check if NPC is faction member
      const role = lc.role;
      return (
        role === 'faction_ambassador' ||
        role === 'faction_lieutenant' ||
        role === 'faction_grunt'
      );
    })
    .map(lc => lc.npcId);
  
  return broadcastKeyMoment(sourceMoment, factionNpcs, state);
}

// ============================================================================
// MEMORY CLEANUP
// ============================================================================

/**
 * Clean up old memories based on retention policy
 */
export function cleanupOldMemories(state: GameState): GameState {
  const memories = state.arcDirector?.npcMemories ?? [];
  
  const cleaned = memories.map(ledger => {
    const filtered = ledger.keyMoments.filter(km => {
      switch (km.retention) {
        case 'scene':
          // Scene memories expire after 10 turns
          return state.turn - km.turn <= 10;
        case 'arc':
          // Arc memories expire after 50 turns
          return state.turn - km.turn <= 50;
        case 'campaign':
        case 'permanent':
          // Never expire
          return true;
        default:
          return true;
      }
    });
    
    return {
      ...ledger,
      keyMoments: filtered,
    };
  });
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      npcMemories: cleaned,
    },
  };
}

// ============================================================================
// SITUATION PACKET INTEGRATION
// ============================================================================

/**
 * Build NPC memory section for situation packet
 */
export function buildMemorySituationSection(
  npcId: string,
  state: GameState
): string {
  const moments = getRecentKeyMoments(npcId, state, 30);
  if (moments.length === 0) return '';
  
  const lines: string[] = [`### NPC MEMORY (${npcId})`];
  lines.push('Recent key moments:');
  
  // Group by category
  const grouped = new Map<string, NpcKeyMoment[]>();
  for (const moment of moments) {
    const existing = grouped.get(moment.category) ?? [];
    grouped.set(moment.category, [...existing, moment]);
  }
  
  // Format each category
  for (const [category, categoryMoments] of grouped.entries()) {
    lines.push(`\n**${category.replace(/_/g, ' ')}:**`);
    
    for (const moment of categoryMoments.slice(-3)) {
      // Only show last 3 per category
      const summary = formatKeyMomentSummary(moment);
      lines.push(`- T${moment.turn}: ${summary}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Format key moment as short summary
 */
function formatKeyMomentSummary(moment: NpcKeyMoment): string {
  switch (moment.category) {
    case 'first_meet':
      return 'First meeting with player';
    case 'quest_disposition':
      return `Quest interaction: ${moment.data.questId ?? 'unknown'}`;
    case 'betrayal':
      return `Betrayal: ${moment.data.summary ?? 'player betrayed NPC'}`;
    case 'deal':
      return `Deal made: ${moment.data.summary ?? 'agreement reached'}`;
    case 'favor':
      return `Favor: ${moment.data.summary ?? 'favor exchanged'}`;
    case 'revelation':
      return `Secret revealed: ${moment.data.summary ?? 'information shared'}`;
    case 'role_change':
      return `Role changed: ${moment.data.fromRole} → ${moment.data.toRole}`;
    case 'death':
      return `Death witnessed: ${moment.data.who ?? 'someone'}`;
    case 'relationship_change':
      return `Relationship shift: ${moment.data.direction ?? 'changed'}`;
    case 'faction_broadcast':
      return `Faction news: ${moment.data.summary ?? 'faction event'}`;
    case 'gossip':
      return `Heard gossip: ${moment.data.summary ?? 'rumor'}`;
    case 'public_announcement':
      return `Public: ${moment.data.summary ?? 'announcement'}`;
    case 'rescue':
      return `Rescued by player`;
    case 'witness':
      return `Witnessed: ${moment.data.witnessedCategory ?? 'event'}`;
    default:
      return JSON.stringify(moment.data).slice(0, 60);
  }
}

/**
 * Format memory reference for GM prose
 * 
 * Example: "You betrayed me at the dock" (referencing betrayal moment)
 */
export function formatMemoryReference(
  npcId: string,
  category: NpcKeyMoment['category'],
  state: GameState
): string | null {
  const moments = getKeyMomentsByCategory(npcId, category, state);
  if (moments.length === 0) return null;
  
  const latest = moments[moments.length - 1];
  
  switch (category) {
    case 'betrayal':
      return `You betrayed me${latest.data.location ? ` at ${latest.data.location}` : ''}`;
    case 'deal':
      return `We made a deal${latest.data.location ? ` at ${latest.data.location}` : ''}`;
    case 'favor':
      return `I owe you a favor from ${latest.data.location ?? 'before'}`;
    case 'revelation':
      return `You told me about ${latest.data.topic ?? 'something'}`;
    case 'rescue':
      return 'You saved my life';
    case 'death':
      return `I saw ${latest.data.who ?? 'someone'} die`;
    default:
      return null;
  }
}
