/**
 * WS-2 Wave D+: Cross-NPC Integration
 * 
 * Witness-based memory sync, faction propagation, and cross-NPC conversation tracking.
 * 
 * Based on: Manus WS-2 D7–D8 Retrieval and Cross-NPC Integration
 * Tasks: NPC-022 (witness), NPC-023 (faction), NPC-024 (gossip), NPC-025 (anti-sync),
 *        NPC-026 (relationships), NPC-027 (traits)
 */

import type { GameState } from './types';
import type { NpcKeyMoment } from './types/crossPackageContracts';
import {
  createKeyMoment,
  appendKeyMoment,
  getKeyMoments,
  broadcastKeyMoment,
  broadcastToFaction,
  spreadHubGossip,
} from './npcMemoryLedger';

// ============================================================================
// CROSS-NPC KNOWLEDGE PROPAGATION
// ============================================================================

/**
 * Propagate knowledge from one NPC to another based on rules
 * 
 * Rules:
 * - Direct participants know immediately
 * - Witnesses know if present, conscious, perceptive
 * - Faction members learn via broadcast
 * - Hub NPCs learn via gossip (delayed, degraded)
 * - Denied factions never learn
 */
export function propagateKnowledge(
  sourceMoment: NpcKeyMoment,
  state: GameState
): GameState {
  let next = state;
  
  // 1. Direct participants (already know via source moment)
  // No additional propagation needed
  
  // 2. Witnesses (if event is witnessed)
  if (sourceMoment.visibility === 'witnessed' || sourceMoment.visibility === 'public') {
    const witnesses = state.sceneFacts?.present ?? [];
    const witnessIds = witnesses.filter(w => w !== sourceMoment.npcId);
    
    if (witnessIds.length > 0) {
      next = broadcastKeyMoment(sourceMoment, witnessIds, next);
    }
  }
  
  // 3. Faction broadcast (if event is faction-wide)
  if (sourceMoment.visibility === 'faction' && sourceMoment.data.factionIds) {
    const factionIds = sourceMoment.data.factionIds as string[];
    for (const factionId of factionIds) {
      next = broadcastToFaction(sourceMoment, factionId, next);
    }
  }
  
  // 4. Hub gossip (if event is public at a hub)
  if (sourceMoment.visibility === 'hub' || sourceMoment.visibility === 'public') {
    const hubId = state.location?.name;
    if (hubId) {
      next = spreadHubGossip(sourceMoment, hubId, next);
    }
  }
  
  return next;
}

// ============================================================================
// NPC-025: ANTI-SYNC GATES
// ============================================================================

/**
 * Check if faction is denied knowledge of an event
 * 
 * Deny list overrides propagation unless explicit leak supersedes it.
 */
export function isFactionDenied(
  factionId: string,
  moment: NpcKeyMoment
): boolean {
  const deniedFactions = moment.data.deniedFactionIds as string[] | undefined;
  if (!deniedFactions) return false;
  
  return deniedFactions.includes(factionId);
}

/**
 * Apply anti-sync gates before propagation
 */
export function filterKnowledgeByFaction(
  targetNpcId: string,
  moment: NpcKeyMoment,
  state: GameState
): boolean {
  // Get NPC's faction
  const factionId = state.arcDirector?.npcFactionMemberships?.[targetNpcId];
  if (!factionId) return true; // No faction = allow
  
  // Check if faction is denied
  if (isFactionDenied(factionId, moment)) {
    // Check for explicit leak that supersedes denial
    const leaks = moment.data.leakToFactionIds as string[] | undefined;
    if (leaks?.includes(factionId)) {
      return true; // Leak supersedes denial
    }
    return false; // Denied
  }
  
  return true; // Allowed
}

// ============================================================================
// NPC-026: DIRECTIONAL RELATIONSHIPS
// ============================================================================

/**
 * Relationship aspects tracked per ordered actor pair
 */
export type RelationshipAspect = 
  | 'trust'      // Confidence in reliability
  | 'respect'    // Admiration for capability
  | 'fear'       // Intimidation or threat
  | 'affection'  // Warmth or friendship
  | 'loyalty';   // Commitment to support

/**
 * Directional relationship state
 */
export interface DirectionalRelationship {
  /** Source NPC (who has the feeling) */
  sourceNpcId: string;
  
  /** Target NPC (toward whom the feeling is directed) */
  targetNpcId: string;
  
  /** Relationship aspects (-100 to +100) */
  aspects: Partial<Record<RelationshipAspect, number>>;
  
  /** Last updated turn */
  lastUpdated: number;
}

/**
 * Update relationship between two NPCs
 */
export function updateRelationship(
  sourceNpcId: string,
  targetNpcId: string,
  aspect: RelationshipAspect,
  delta: number,
  state: GameState,
  opts?: {
    reason?: string;
    threshold?: number;
  }
): GameState {
  const relationships = state.arcDirector?.npcRelationships ?? [];
  const key = `${sourceNpcId}->${targetNpcId}`;
  
  const existing = relationships.find(
    r => r.sourceNpcId === sourceNpcId && r.targetNpcId === targetNpcId
  );
  
  if (existing) {
    // Update existing relationship
    const currentValue = existing.aspects[aspect] ?? 0;
    const newValue = Math.max(-100, Math.min(100, currentValue + delta));
    
    const updated: DirectionalRelationship = {
      ...existing,
      aspects: {
        ...existing.aspects,
        [aspect]: newValue,
      },
      lastUpdated: state.turn,
    };
    
    // Check if threshold crossed
    const threshold = opts?.threshold ?? 50;
    if (Math.abs(currentValue) < threshold && Math.abs(newValue) >= threshold) {
      // Record relationship change key moment
      const moment = createKeyMoment(
        sourceNpcId,
        'relationship_change',
        {
          targetNpcId,
          aspect,
          delta,
          newValue,
          reason: opts?.reason,
        },
        state,
        {
          retention: 'arc',
          visibility: 'private',
        }
      );
      
      const stateWithMoment = appendKeyMoment(sourceNpcId, moment, state);
      
      return {
        ...stateWithMoment,
        arcDirector: {
          ...stateWithMoment.arcDirector,
          npcRelationships: relationships.map(r =>
            r.sourceNpcId === sourceNpcId && r.targetNpcId === targetNpcId ? updated : r
          ),
        },
      };
    }
    
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcRelationships: relationships.map(r =>
          r.sourceNpcId === sourceNpcId && r.targetNpcId === targetNpcId ? updated : r
        ),
      },
    };
  } else {
    // Create new relationship
    const newRelationship: DirectionalRelationship = {
      sourceNpcId,
      targetNpcId,
      aspects: {
        [aspect]: Math.max(-100, Math.min(100, delta)),
      },
      lastUpdated: state.turn,
    };
    
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcRelationships: [...relationships, newRelationship],
      },
    };
  }
}

/**
 * Get relationship value
 */
export function getRelationshipValue(
  sourceNpcId: string,
  targetNpcId: string,
  aspect: RelationshipAspect,
  state: GameState
): number {
  const relationships = state.arcDirector?.npcRelationships ?? [];
  const rel = relationships.find(
    r => r.sourceNpcId === sourceNpcId && r.targetNpcId === targetNpcId
  );
  
  return rel?.aspects[aspect] ?? 0;
}

// ============================================================================
// NPC-027: TRAIT MODULATION
// ============================================================================

/**
 * Lightweight NPC traits (2-3 per NPC)
 */
export type NpcTrait =
  | 'cautious'       // Risk-averse
  | 'bold'           // Risk-seeking
  | 'loyal'          // Values commitments
  | 'pragmatic'      // Values results
  | 'honorable'      // Values principles
  | 'suspicious'     // Distrusts easily
  | 'trusting'       // Trusts easily
  | 'vengeful'       // Remembers slights
  | 'forgiving'      // Moves past slights
  | 'ambitious'      // Seeks power/status
  | 'content';       // Satisfied with current state

/**
 * Get NPC traits
 */
export function getNpcTraits(
  npcId: string,
  state: GameState
): NpcTrait[] {
  return state.arcDirector?.npcTraits?.[npcId] ?? [];
}

/**
 * Check if NPC has trait
 */
export function hasNpcTrait(
  npcId: string,
  trait: NpcTrait,
  state: GameState
): boolean {
  return getNpcTraits(npcId, state).includes(trait);
}

/**
 * Modulate relationship delta based on traits
 * 
 * Traits affect thresholds and magnitudes but do not override state.
 */
export function modulateRelationshipDelta(
  sourceNpcId: string,
  aspect: RelationshipAspect,
  baseDelta: number,
  state: GameState
): number {
  const traits = getNpcTraits(sourceNpcId, state);
  let multiplier = 1.0;
  
  // Apply trait modulation
  if (aspect === 'trust') {
    if (traits.includes('trusting')) multiplier *= 1.5;
    if (traits.includes('suspicious')) multiplier *= 0.5;
  }
  
  if (aspect === 'fear' || aspect === 'respect') {
    if (traits.includes('cautious')) multiplier *= 1.2;
    if (traits.includes('bold')) multiplier *= 0.8;
  }
  
  if (aspect === 'loyalty') {
    if (traits.includes('loyal')) multiplier *= 1.5;
    if (traits.includes('pragmatic')) multiplier *= 0.8;
  }
  
  if (baseDelta < 0) {
    // Negative deltas (relationship damage)
    if (traits.includes('forgiving')) multiplier *= 0.7;
    if (traits.includes('vengeful')) multiplier *= 1.3;
  }
  
  return Math.round(baseDelta * multiplier);
}

// ============================================================================
// CROSS-NPC CONVERSATION TRACKING
// ============================================================================

/**
 * Track conversation between NPCs
 * 
 * Records who spoke to whom about what topic.
 */
export interface NpcConversation {
  /** Conversation ID */
  id: string;
  
  /** Turn when conversation occurred */
  turn: number;
  
  /** Participants */
  participants: string[];
  
  /** Topic discussed */
  topic: string;
  
  /** Summary */
  summary: string;
  
  /** Witnesses */
  witnesses: string[];
}

/**
 * Record conversation between NPCs
 */
export function recordNpcConversation(
  participants: string[],
  topic: string,
  summary: string,
  state: GameState
): GameState {
  const conversation: NpcConversation = {
    id: `conv-${state.turn}-${participants.join('-')}`,
    turn: state.turn,
    participants,
    topic,
    summary,
    witnesses: state.sceneFacts?.present ?? [],
  };
  
  // Record as key moments for each participant
  let next = state;
  
  for (const npcId of participants) {
    const moment = createKeyMoment(
      npcId,
      'witness',
      {
        conversationId: conversation.id,
        topic,
        summary,
        otherParticipants: participants.filter(p => p !== npcId),
      },
      state,
      {
        provenance: 'direct_participant',
        visibility: 'witnessed',
        retention: 'arc',
      }
    );
    
    next = appendKeyMoment(npcId, moment, next);
  }
  
  // Add to conversation ledger
  const conversations = state.arcDirector?.npcConversations ?? [];
  
  return {
    ...next,
    arcDirector: {
      ...next.arcDirector,
      npcConversations: [...conversations, conversation].slice(-50), // Keep last 50
    },
  };
}

/**
 * Get conversations involving NPC
 */
export function getConversationsForNpc(
  npcId: string,
  state: GameState
): NpcConversation[] {
  const conversations = state.arcDirector?.npcConversations ?? [];
  return conversations.filter(c => c.participants.includes(npcId));
}

/**
 * Get recent conversations between two NPCs
 */
export function getConversationsBetween(
  npcId1: string,
  npcId2: string,
  state: GameState,
  turns: number = 50
): NpcConversation[] {
  const conversations = state.arcDirector?.npcConversations ?? [];
  const cutoff = state.turn - turns;
  
  return conversations.filter(
    c =>
      c.turn >= cutoff &&
      c.participants.includes(npcId1) &&
      c.participants.includes(npcId2)
  );
}

// ============================================================================
// SITUATION PACKET INTEGRATION
// ============================================================================

/**
 * Build cross-NPC section for situation packet
 */
export function buildCrossNpcSituationSection(
  npcId: string,
  state: GameState
): string {
  const lines: string[] = [];
  
  // Relationships
  const relationships = state.arcDirector?.npcRelationships ?? [];
  const outgoing = relationships.filter(r => r.sourceNpcId === npcId);
  
  if (outgoing.length > 0) {
    lines.push('### NPC RELATIONSHIPS');
    for (const rel of outgoing) {
      const aspects = Object.entries(rel.aspects)
        .filter(([_, value]) => Math.abs(value as number) >= 20)
        .map(([aspect, value]) => `${aspect}: ${value}`)
        .join(', ');
      
      if (aspects) {
        lines.push(`- **${rel.targetNpcId}**: ${aspects}`);
      }
    }
  }
  
  // Recent conversations
  const conversations = getConversationsForNpc(npcId, state).slice(-3);
  
  if (conversations.length > 0) {
    lines.push('\n### RECENT CONVERSATIONS');
    for (const conv of conversations) {
      const others = conv.participants.filter(p => p !== npcId).join(', ');
      lines.push(`- T${conv.turn}: ${conv.topic} with ${others}`);
    }
  }
  
  // Traits
  const traits = getNpcTraits(npcId, state);
  
  if (traits.length > 0) {
    lines.push(`\n**Traits**: ${traits.join(', ')}`);
  }
  
  return lines.join('\n');
}
