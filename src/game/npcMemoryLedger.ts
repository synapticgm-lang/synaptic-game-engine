/**
 * WS-2 Wave B: NPC Memory Ledger Integration
 * 
 * Complete key moment schema with provenance, visibility, and retention.
 * Witness-based memory sync and faction broadcast.
 * Memory retrieval patterns for situation packet.
 * 
 * Based on: Manus WS-2 D2–D5 Memory, Lifecycle, Topic, Turnover
 * Tasks: NPC-008, NPC-009, NPC-010, NPC-011, NPC-022, NPC-023, NPC-024
 */

import type { GameState } from './types';
import type { NpcKeyMoment } from './types/crossPackageContracts';

// ============================================================================
// MEMORY LEDGER
// ============================================================================

export interface NpcMemoryLedger {
  /** NPC identifier */
  npcId: string;
  
  /** Key moments (append-only) */
  keyMoments: NpcKeyMoment[];
  
  /** Last updated turn */
  lastUpdated: number;
  
  /** Dedupe keys (prevent duplicate moments) */
  dedupeKeys: Set<string>;
}

// ============================================================================
// ENHANCED KEY MOMENT SCHEMA (Wave B)
// ============================================================================

/**
 * Extended NpcKeyMoment categories for Wave B
 */
export type KeyMomentCategory =
  | 'first_meet'           // First identity-bearing contact
  | 'quest_critical'       // Quest accept/refuse/complete/fail
  | 'faction_change'       // Faction membership/standing change
  | 'betrayal'            // Broken deal, abandonment, defection
  | 'deal'                // Explicit exchange with terms
  | 'favor'               // Aid creating credit/obligation
  | 'revelation'          // Canonical fact first disclosed
  | 'threat'              // Credible harm commitment
  | 'departure'           // Exit, relocation, disappearance
  | 'role_change'         // Role transformation
  | 'relationship_change' // Threshold trust/respect/fear shift
  | 'rescue'              // Release from captivity
  | 'death'               // Confirmed death
  | 'witness';            // Witnessed event

/**
 * Knowledge channel (how NPC learned the fact)
 */
export type KnowledgeChannel =
  | 'direct_participant'  // Actor in the event
  | 'witnessed'           // Present and observed
  | 'told_by_trusted'     // Reliable source reported
  | 'faction_broadcast'   // Leadership announcement
  | 'hub_gossip'         // Local rumor (delayed, degraded)
  | 'public_announcement' // World event
  | 'system_authority';   // Game mechanics

/**
 * Visibility scope (who else can learn this)
 */
export type VisibilityScope =
  | 'private'             // Only actor knows
  | 'witnessed'           // Present NPCs saw
  | 'faction'             // Faction-wide eventually
  | 'hub'                 // Local gossip spreads
  | 'public';             // World knowledge

/**
 * Retention class (when to expire)
 */
export type RetentionClass =
  | 'permanent'           // Never expires (first_meet, death)
  | 'campaign'            // Until campaign ends
  | 'arc'                 // ~50 turns
  | 'scene';              // ~10 turns

// ============================================================================
// KEY MOMENT CREATION (Wave B Enhanced)
// ============================================================================

/**
 * Create deduplication key for key moment
 * 
 * Prevents duplicate moments with same NPC + category + turn window
 */
function createDedupeKey(
  npcId: string,
  category: KeyMomentCategory,
  turn: number,
  data?: Record<string, unknown>
): string {
  // For some categories, include data in dedupe key
  const dataKey = category === 'revelation' && data?.topicId
    ? `-${data.topicId}`
    : category === 'deal' && data?.dealId
    ? `-${data.dealId}`
    : '';
  
  // Round turn to 5-turn window for fuzzy dedupe
  const turnWindow = Math.floor(turn / 5) * 5;
  
  return `${npcId}:${category}:T${turnWindow}${dataKey}`;
}

/**
 * Create key moment with full Wave B schema
 */
export function createKeyMoment(
  npcId: string,
  category: KeyMomentCategory,
  data: Record<string, unknown>,
  state: GameState,
  opts?: {
    provenance?: KnowledgeChannel;
    visibility?: VisibilityScope;
    retention?: RetentionClass;
    witnessNpcIds?: string[];
    factionIds?: string[];
  }
): NpcKeyMoment {
  const id = `km-${npcId}-${category}-${state.turn}-${Math.random().toString(36).slice(2, 8)}`;
  
  // Determine retention based on category
  const retention = opts?.retention ?? getDefaultRetention(category);
  
  // Determine provenance based on category and opts
  const provenance = opts?.provenance ?? 'direct_participant';
  
  // Determine visibility based on category and opts
  const visibility = opts?.visibility ?? getDefaultVisibility(category);
  
  return {
    id,
    npcId,
    category: category as NpcKeyMoment['category'],
    turn: state.turn,
    data: {
      ...data,
      witnessNpcIds: opts?.witnessNpcIds ?? data.witnessNpcIds,
      factionIds: opts?.factionIds ?? data.factionIds,
    },
    provenance: provenance as NpcKeyMoment['provenance'],
    visibility: visibility as NpcKeyMoment['visibility'],
    retention: retention as NpcKeyMoment['retention'],
  };
}

/**
 * Get default retention for category
 */
function getDefaultRetention(category: KeyMomentCategory): RetentionClass {
  switch (category) {
    case 'first_meet':
    case 'death':
    case 'quest_critical':
    case 'betrayal':
    case 'rescue':
      return 'permanent';
    case 'faction_change':
    case 'role_change':
    case 'revelation':
      return 'campaign';
    case 'deal':
    case 'favor':
    case 'threat':
    case 'relationship_change':
      return 'arc';
    case 'departure':
    case 'witness':
      return 'scene';
    default:
      return 'campaign';
  }
}

/**
 * Get default visibility for category
 */
function getDefaultVisibility(category: KeyMomentCategory): VisibilityScope {
  switch (category) {
    case 'first_meet':
    case 'death':
    case 'rescue':
      return 'witnessed';
    case 'faction_change':
      return 'faction';
    case 'revelation':
    case 'threat':
      return 'private';
    case 'betrayal':
    case 'deal':
    case 'favor':
      return 'witnessed';
    case 'departure':
    case 'role_change':
      return 'public';
    default:
      return 'private';
  }
}

/**
 * Append key moment to NPC memory (Wave B with deduplication)
 */
export function appendKeyMoment(
  npcId: string,
  moment: NpcKeyMoment,
  state: GameState
): GameState {
  const memories = state.arcDirector?.npcMemories ?? [];
  const existing = memories.find(m => m.npcId === npcId);
  
  // Create dedupe key
  const dedupeKey = createDedupeKey(
    npcId,
    moment.category as KeyMomentCategory,
    moment.turn,
    moment.data
  );
  
  if (existing) {
    // Check for duplicate
    if (existing.dedupeKeys?.has(dedupeKey)) {
      // Skip duplicate
      return state;
    }
    
    // Append to existing
    const updated: NpcMemoryLedger = {
      ...existing,
      keyMoments: [...existing.keyMoments, moment].slice(-100), // Keep last 100
      lastUpdated: state.turn,
      dedupeKeys: new Set([...(existing.dedupeKeys ?? []), dedupeKey]),
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
      dedupeKeys: new Set([dedupeKey]),
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
// WAVE B: WITNESS-BASED MEMORY SYNC
// ============================================================================

/**
 * Broadcast key moment to witnesses (Wave B)
 * 
 * When an event is visible to multiple NPCs, create witness memories.
 * Requires presence, consciousness, perception, and understanding.
 */
export function broadcastKeyMoment(
  sourceMoment: NpcKeyMoment,
  witnesses: string[],
  state: GameState
): GameState {
  let next = state;
  
  for (const witnessId of witnesses) {
    if (witnessId === sourceMoment.npcId) continue; // Skip source
    
    // Check witness eligibility (NPC-022)
    if (!isEligibleWitness(witnessId, state)) {
      continue;
    }
    
    const witnessMoment = createKeyMoment(
      witnessId,
      'witness',
      {
        witnessedNpc: sourceMoment.npcId,
        witnessedCategory: sourceMoment.category,
        witnessedData: sourceMoment.data,
        witnessedTurn: sourceMoment.turn,
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
 * Check if NPC is eligible witness (NPC-022)
 * 
 * Requires: presence, consciousness, perception, understanding
 */
function isEligibleWitness(npcId: string, state: GameState): boolean {
  const present = state.sceneFacts?.present ?? [];
  
  // Must be present
  if (!present.includes(npcId)) return false;
  
  // Check consciousness (not defeated/unconscious)
  const encounter = state.activeEncounter;
  if (encounter) {
    const enemy = encounter.enemies.find(e => e.name === npcId);
    if (enemy && enemy.currentHP <= 0) return false;
  }
  
  // Assume perception and understanding for now
  // (could be enhanced with NPC traits later)
  return true;
}

// ============================================================================
// WAVE B: FACTION BROADCAST
// ============================================================================

/**
 * Broadcast to faction (NPC-023)
 * 
 * When an event affects faction standing, all faction NPCs learn about it
 * via leadership broadcast. Requires committed faction event.
 */
export function broadcastToFaction(
  sourceMoment: NpcKeyMoment,
  factionId: string,
  state: GameState
): GameState {
  // Get all NPCs with this faction
  const factionNpcs = (state.arcDirector?.npcLifecycles ?? [])
    .filter(lc => {
      // Check if NPC belongs to faction
      const factionMembership = state.arcDirector?.npcFactionMemberships ?? {};
      return factionMembership[lc.npcId] === factionId;
    })
    .map(lc => lc.npcId);
  
  let next = state;
  
  for (const npcId of factionNpcs) {
    if (npcId === sourceMoment.npcId) continue;
    
    const factionMoment = createKeyMoment(
      npcId,
      'faction_change',
      {
        factionId,
        sourceEvent: sourceMoment.id,
        sourceCategory: sourceMoment.category,
        sourceData: sourceMoment.data,
      },
      state,
      {
        provenance: 'faction_broadcast',
        visibility: 'faction',
        retention: sourceMoment.retention,
      }
    );
    
    next = appendKeyMoment(npcId, factionMoment, next);
  }
  
  return next;
}

// ============================================================================
// WAVE B: HUB GOSSIP
// ============================================================================

/**
 * Spread hub gossip (NPC-024)
 * 
 * Local gossip with delay and confidence decay.
 * Default: 5-turn delay, 0.8 confidence multiplier.
 */
export function spreadHubGossip(
  sourceMoment: NpcKeyMoment,
  hubId: string,
  state: GameState,
  opts?: {
    delay?: number;
    confidence?: number;
  }
): GameState {
  const delay = opts?.delay ?? 5;
  const confidence = opts?.confidence ?? 0.8;
  
  // Get all NPCs at this hub
  const hubNpcs = (state.arcDirector?.npcLifecycles ?? [])
    .filter(lc => {
      // Check if NPC is at hub
      const location = state.location?.name;
      return location === hubId && lc.state === 'functioning';
    })
    .map(lc => lc.npcId);
  
  let next = state;
  
  for (const npcId of hubNpcs) {
    if (npcId === sourceMoment.npcId) continue;
    
    const gossipMoment = createKeyMoment(
      npcId,
      'witness', // Gossip is a type of witness
      {
        gossipSource: sourceMoment.npcId,
        gossipCategory: sourceMoment.category,
        gossipData: sourceMoment.data,
        confidence,
        delay,
      },
      state,
      {
        provenance: 'hub_gossip' as KnowledgeChannel,
        visibility: 'hub',
        retention: 'scene', // Gossip is short-lived
      }
    );
    
    next = appendKeyMoment(npcId, gossipMoment, next);
  }
  
  return next;
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
// WAVE B: MEMORY RETRIEVAL PATTERNS
// ============================================================================

/**
 * Retrieve ranked memories for situation packet (Wave B)
 * 
 * Priority order:
 * 1. Pinned permanent moments (first_meet, death, betrayal, rescue)
 * 2. Unresolved consequences (active threats, pending deals)
 * 3. Active obligations
 * 4. Same-topic events
 * 5. Same-actor events
 * 6. Same-faction events
 * 7. Recent events
 */
export function retrieveRankedMemories(
  npcId: string,
  state: GameState,
  opts?: {
    maxKeyMoments?: number;
    maxRecentMoments?: number;
    currentTopicId?: string;
    relevantActors?: string[];
    relevantFactions?: string[];
  }
): {
  keyMoments: NpcKeyMoment[];
  recentMoments: NpcKeyMoment[];
  mandatoryEventIds: string[];
  forbiddenEventIds: string[];
} {
  const allMoments = getKeyMoments(npcId, state);
  const maxKey = opts?.maxKeyMoments ?? 5;
  const maxRecent = opts?.maxRecentMoments ?? 3;
  
  // 1. Pinned permanent moments
  const pinned = allMoments.filter(km => 
    km.retention === 'permanent' && 
    ['first_meet', 'death', 'betrayal', 'rescue', 'role_change'].includes(km.category as string)
  );
  
  // 2. Unresolved consequences
  const unresolved = allMoments.filter(km =>
    ['threat', 'deal', 'favor'].includes(km.category as string) &&
    !km.data.resolved
  );
  
  // 3. Active obligations
  const obligations = allMoments.filter(km =>
    km.category === 'quest_critical' &&
    km.data.status === 'active'
  );
  
  // 4. Same-topic events
  const sameTopic = opts?.currentTopicId
    ? allMoments.filter(km => km.data.topicId === opts.currentTopicId)
    : [];
  
  // 5. Same-actor events
  const sameActor = opts?.relevantActors
    ? allMoments.filter(km => 
        opts.relevantActors!.some(actor => 
          km.data.actorIds?.includes(actor) || km.data.witnessedNpc === actor
        )
      )
    : [];
  
  // 6. Same-faction events
  const sameFaction = opts?.relevantFactions
    ? allMoments.filter(km =>
        opts.relevantFactions!.some(faction => km.data.factionIds?.includes(faction))
      )
    : [];
  
  // 7. Recent events
  const recent = getRecentKeyMoments(npcId, state, 30);
  
  // Combine and deduplicate
  const seen = new Set<string>();
  const keyMoments: NpcKeyMoment[] = [];
  
  for (const moment of [
    ...pinned,
    ...unresolved,
    ...obligations,
    ...sameTopic,
    ...sameActor,
    ...sameFaction,
  ]) {
    if (!seen.has(moment.id) && keyMoments.length < maxKey) {
      keyMoments.push(moment);
      seen.add(moment.id);
    }
  }
  
  // Add recent moments
  const recentMoments: NpcKeyMoment[] = [];
  for (const moment of recent) {
    if (!seen.has(moment.id) && recentMoments.length < maxRecent) {
      recentMoments.push(moment);
      seen.add(moment.id);
    }
  }
  
  // Mandatory event IDs (must be referenced)
  const mandatoryEventIds = [
    ...pinned.map(m => m.id),
    ...unresolved.map(m => m.id),
  ];
  
  // Forbidden event IDs (must not be mentioned)
  const forbiddenEventIds = allMoments
    .filter(km => km.data.forbidden)
    .map(m => m.id);
  
  return {
    keyMoments,
    recentMoments,
    mandatoryEventIds,
    forbiddenEventIds,
  };
}

// ============================================================================
// MEMORY CLEANUP (Wave B Enhanced)
// ============================================================================

/**
 * Clean up old memories based on retention policy (Wave B)
 * 
 * Permanent: never expires
 * Campaign: until campaign ends
 * Arc: ~50 turns
 * Scene: ~10 turns
 */
export function cleanupOldMemories(state: GameState): GameState {
  const memories = state.arcDirector?.npcMemories ?? [];
  
  const cleaned = memories.map(ledger => {
    const filtered = ledger.keyMoments.filter(km => {
      const age = state.turn - km.turn;
      
      switch (km.retention as RetentionClass) {
        case 'scene':
          return age <= 10;
        case 'arc':
          return age <= 50;
        case 'campaign':
        case 'permanent':
          return true;
        default:
          return true;
      }
    });
    
    // Rebuild dedupe keys
    const dedupeKeys = new Set(
      filtered.map(km => 
        createDedupeKey(
          km.npcId,
          km.category as KeyMomentCategory,
          km.turn,
          km.data
        )
      )
    );
    
    return {
      ...ledger,
      keyMoments: filtered,
      dedupeKeys,
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
// SITUATION PACKET INTEGRATION (Wave B Enhanced)
// ============================================================================

/**
 * Build NPC memory section for situation packet (Wave B)
 * 
 * Includes:
 * - Identity continuity
 * - Key moments (ranked retrieval)
 * - Recent moments
 * - Mandatory evidence IDs
 * - Forbidden event IDs
 */
export function buildMemorySituationSection(
  npcId: string,
  state: GameState,
  opts?: {
    currentTopicId?: string;
    relevantActors?: string[];
    relevantFactions?: string[];
  }
): string {
  const { keyMoments, recentMoments, mandatoryEventIds, forbiddenEventIds } = 
    retrieveRankedMemories(npcId, state, opts);
  
  if (keyMoments.length === 0 && recentMoments.length === 0) return '';
  
  const lines: string[] = [`### NPC MEMORY (${npcId})`];
  
  // Identity continuity
  const firstMeet = getKeyMomentsByCategory(npcId, 'first_meet', state);
  if (firstMeet.length > 0) {
    lines.push(`**First contact:** T${firstMeet[0].turn}`);
  }
  
  // Key moments
  if (keyMoments.length > 0) {
    lines.push('\n**Key moments:**');
    for (const moment of keyMoments) {
      const summary = formatKeyMomentSummary(moment);
      const provenance = moment.provenance === 'direct_participant' ? '' : ` (${moment.provenance})`;
      lines.push(`- T${moment.turn}: ${summary}${provenance}`);
    }
  }
  
  // Recent moments
  if (recentMoments.length > 0) {
    lines.push('\n**Recent interactions:**');
    for (const moment of recentMoments) {
      const summary = formatKeyMomentSummary(moment);
      lines.push(`- T${moment.turn}: ${summary}`);
    }
  }
  
  // Mandatory references
  if (mandatoryEventIds.length > 0) {
    lines.push(`\n**MANDATORY:** Reference these events when relevant: ${mandatoryEventIds.join(', ')}`);
  }
  
  // Forbidden references
  if (forbiddenEventIds.length > 0) {
    lines.push(`\n**FORBIDDEN:** Do not mention these events: ${forbiddenEventIds.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Format key moment as short summary (Wave B Enhanced)
 */
function formatKeyMomentSummary(moment: NpcKeyMoment): string {
  const data = moment.data;
  
  switch (moment.category) {
    case 'first_meet':
      return 'First meeting with player';
    case 'quest_critical':
      return `Quest: ${data.questName ?? 'unknown'} - ${data.status ?? 'disposition recorded'}`;
    case 'betrayal':
      return `Betrayal${data.location ? ` at ${data.location}` : ''}: ${data.summary ?? 'player broke trust'}`;
    case 'deal':
      return `Deal${data.location ? ` at ${data.location}` : ''}: ${data.summary ?? 'agreement reached'}`;
    case 'favor':
      return `Favor: ${data.summary ?? 'player helped NPC'}`;
    case 'revelation':
      return `Revealed: ${data.topic ?? 'secret'} (v${data.version ?? 1})`;
    case 'threat':
      return `Threat: ${data.summary ?? 'consequences warned'}`;
    case 'departure':
      return `Left scene: ${data.reason ?? 'obligation satisfied'}`;
    case 'role_change':
      return `Role changed: ${data.fromRole} → ${data.toRole}`;
    case 'death':
      return `Death: ${data.who ?? 'someone'} died`;
    case 'relationship_change':
      return `Relationship: ${data.aspect ?? 'trust'} ${data.delta > 0 ? 'improved' : 'degraded'}`;
    case 'faction_change':
      return `Faction: ${data.factionId ?? 'unknown'} ${data.change ?? 'standing changed'}`;
    case 'rescue':
      return `Rescued by player`;
    case 'witness':
      return `Witnessed: ${data.witnessedCategory ?? 'event'} by ${data.witnessedNpc ?? 'someone'}`;
    default:
      return data.summary as string ?? JSON.stringify(data).slice(0, 60);
  }
}

/**
 * Format memory reference for GM prose (Wave B Enhanced)
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
  const data = latest.data;
  
  switch (category) {
    case 'betrayal':
      return `You betrayed me${data.location ? ` at ${data.location}` : ''}`;
    case 'deal':
      return `We made a deal${data.location ? ` at ${data.location}` : ''}`;
    case 'favor':
      return `I owe you a favor from ${data.location ?? 'before'}`;
    case 'revelation':
      return `You already know about ${data.topic ?? 'this'}`;
    case 'rescue':
      return 'You saved my life';
    case 'death':
      return `${data.who ?? 'Someone'} is dead`;
    case 'threat':
      return `I warned you about ${data.consequence ?? 'this'}`;
    default:
      return null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS (Wave B)
// ============================================================================

/**
 * Record first meet
 */
export function recordFirstMeet(
  npcId: string,
  state: GameState,
  data?: Record<string, unknown>
): GameState {
  // Check if already recorded
  if (hasKeyMoment(npcId, 'first_meet', state)) {
    return state;
  }
  
  const moment = createKeyMoment(
    npcId,
    'first_meet',
    {
      location: state.location?.name,
      ...data,
    },
    state,
    {
      retention: 'permanent',
      visibility: 'witnessed',
      provenance: 'direct_participant',
    }
  );
  
  return appendKeyMoment(npcId, moment, state);
}

/**
 * Record betrayal
 */
export function recordBetrayal(
  npcId: string,
  summary: string,
  state: GameState,
  data?: Record<string, unknown>
): GameState {
  const moment = createKeyMoment(
    npcId,
    'betrayal',
    {
      summary,
      location: state.location?.name,
      turn: state.turn,
      ...data,
    },
    state,
    {
      retention: 'permanent',
      visibility: 'witnessed',
      provenance: 'direct_participant',
    }
  );
  
  return appendKeyMoment(npcId, moment, state);
}

/**
 * Record deal
 */
export function recordDeal(
  npcId: string,
  summary: string,
  state: GameState,
  data?: Record<string, unknown>
): GameState {
  const moment = createKeyMoment(
    npcId,
    'deal',
    {
      summary,
      location: state.location?.name,
      turn: state.turn,
      resolved: false,
      ...data,
    },
    state,
    {
      retention: 'arc',
      visibility: 'witnessed',
      provenance: 'direct_participant',
    }
  );
  
  return appendKeyMoment(npcId, moment, state);
}

/**
 * Record quest disposition
 */
export function recordQuestDisposition(
  npcId: string,
  questId: string,
  status: 'accepted' | 'refused' | 'completed' | 'failed',
  state: GameState
): GameState {
  const moment = createKeyMoment(
    npcId,
    'quest_critical',
    {
      questId,
      status,
      turn: state.turn,
    },
    state,
    {
      retention: 'permanent',
      visibility: 'public',
      provenance: 'direct_participant',
    }
  );
  
  return appendKeyMoment(npcId, moment, state);
}
