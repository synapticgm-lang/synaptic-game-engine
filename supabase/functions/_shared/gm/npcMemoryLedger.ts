import type { GameState } from './types.ts';
import type { NpcKeyMoment } from './types/crossPackageContracts.ts';
// MEMORY LEDGER
// One entry shape for arcDirector.npcMemories: npcId + keyMoments + memories + lastUpdated + dedupeKeys.
// Social rows (npcName / facts / lastSeenTurn) and keyMoments-only saves are the other shape.
export interface KeyMoment {
  id: string;
  npcId?: string;
  actorId: string;
  turn: number;
  category: string;
  summary?: string;
  fact?: string;
  retention?: string;
  topicId?: string;
  factionId?: string;
}
export interface NpcMemoryLedger {
  npcId: string;
  keyMoments: NpcKeyMoment[];
  memories: KeyMoment[];
  lastUpdated: number;
  dedupeKeys: string[];
}
function momentFromKey(km: NpcKeyMoment): KeyMoment {
  const data = km.data ?? {};
  return {
    id: km.id,
    npcId: km.npcId,
    actorId: typeof data.actorId === 'string' ? data.actorId : km.npcId,
    turn: km.turn,
    category: km.category,
    retention: km.retention,
    summary: typeof data.summary === 'string' ? data.summary : km.category,
    topicId: typeof data.topicId === 'string' ? data.topicId : undefined,
    factionId: typeof data.factionId === 'string' ? data.factionId : undefined,
  };
}
export function normalizeLedgerEntry(raw: unknown): NpcMemoryLedger {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const npcId =
    typeof row.npcId === 'string' && row.npcId
      ? row.npcId
      : typeof row.npcName === 'string' && row.npcName
        ? row.npcName
        : 'npc';
  const keyMoments: NpcKeyMoment[] = [];
  if (Array.isArray(row.keyMoments)) {
    for (const km of row.keyMoments) {
      if (km && typeof km === 'object') keyMoments.push(km as NpcKeyMoment);
    }
  }
  const memories: KeyMoment[] = [];
  if (Array.isArray(row.memories)) {
    for (const m of row.memories) {
      if (m && typeof m === 'object' && typeof (m as KeyMoment).id === 'string') memories.push(m as KeyMoment);
    }
  }
  if (memories.length === 0) {
    for (const km of keyMoments) memories.push(momentFromKey(km));
  }
  if (keyMoments.length === 0) {
    for (const m of memories) {
      keyMoments.push({
        id: m.id,
        npcId: m.npcId || npcId,
        category: (m.category || 'witness') as NpcKeyMoment['category'],
        turn: m.turn,
        data: {
          summary: m.summary,
          topicId: m.topicId,
          factionId: m.factionId,
          actorId: m.actorId,
        },
        provenance: 'direct',
        visibility: 'private',
        retention: (m.retention || 'campaign') as NpcKeyMoment['retention'],
      });
    }
  }
  const lastUpdated =
    typeof row.lastUpdated === 'number'
      ? row.lastUpdated
      : typeof row.lastSeenTurn === 'number'
        ? row.lastSeenTurn
        : 0;
  return {
    npcId,
    keyMoments,
    memories,
    lastUpdated,
    dedupeKeys: dedupeList(row.dedupeKeys),
  };
}
function dedupeList(keys: unknown): string[] {
  if (Array.isArray(keys)) return keys.filter((k): k is string => typeof k === 'string');
  if (keys instanceof Set) return Array.from(keys).filter((k): k is string => typeof k === 'string');
  return [];
}
// ENHANCED KEY MOMENT SCHEMA (Wave B)
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
export type KnowledgeChannel =
  | 'direct_participant'  // Actor in the event
  | 'witnessed'           // Present and observed
  | 'told_by_trusted'     // Reliable source reported
  | 'faction_broadcast'   // Leadership announcement
  | 'hub_gossip'         // Local rumor (delayed, degraded)
  | 'public_announcement' // World event
  | 'system_authority';   // Game mechanics
export type VisibilityScope =
  | 'private'             // Only actor knows
  | 'witnessed'           // Present NPCs saw
  | 'faction'             // Faction-wide eventually
  | 'hub'                 // Local gossip spreads
  | 'public';             // World knowledge
export type RetentionClass =
  | 'permanent'           // Never expires (first_meet, death)
  | 'campaign'            // Until campaign ends
  | 'arc'                 // ~50 turns
  | 'scene';              // ~10 turns
// KEY MOMENT CREATION (Wave B Enhanced)
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
    const known = dedupeList(existing.dedupeKeys);
    if (known.includes(dedupeKey)) {
      // Skip duplicate
      return state;
    }
    const updated = normalizeLedgerEntry({
      npcId,
      keyMoments: [...(existing.keyMoments ?? []), moment].slice(-100),
      lastUpdated: state.turn,
      dedupeKeys: [...known, dedupeKey].slice(-200),
    });
    const stored: NpcMemoryLedger[] = [];
    for (const m of memories) stored.push(m.npcId === npcId ? updated : normalizeLedgerEntry(m));
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcMemories: stored,
      },
    };
  } else {
    const newLedger = normalizeLedgerEntry({
      npcId,
      keyMoments: [moment],
      lastUpdated: state.turn,
      dedupeKeys: [dedupeKey],
    });
    const stored: NpcMemoryLedger[] = [];
    for (const m of memories) stored.push(normalizeLedgerEntry(m));
    stored.push(newLedger);
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcMemories: stored,
      },
    };
  }
}
// WAVE B: WITNESS-BASED MEMORY SYNC
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
function isEligibleWitness(npcId: string, state: GameState): boolean {
  const present = state.sceneFacts?.present ?? [];
  // Must be present
  if (!present.includes(npcId)) return false;
  // Check consciousness (not defeated/unconscious)
  const encounter = state.activeEncounter;
  if (encounter) {
    const enemy = encounter.enemies?.find(e => e.name === npcId);
    if (enemy && enemy.currentHP <= 0) return false;
  }
  // Assume perception and understanding for now
  // (could be enhanced with NPC traits later)
  return true;
}
// WAVE B: FACTION BROADCAST
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
// WAVE B: HUB GOSSIP
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
// KEY MOMENT QUERIES
export function getKeyMoments(
  npcId: string,
  state: GameState
): NpcKeyMoment[] {
  const ledger = (state.arcDirector?.npcMemories ?? []).find(m => m.npcId === npcId);
  return ledger ? normalizeLedgerEntry(ledger).keyMoments : [];
}
export function getRecentKeyMoments(
  npcId: string,
  state: GameState,
  turns: number = 20
): NpcKeyMoment[] {
  const moments = getKeyMoments(npcId, state);
  const cutoff = state.turn - turns;
  return moments.filter(km => km.turn >= cutoff);
}
export function getKeyMomentsByCategory(
  npcId: string,
  category: NpcKeyMoment['category'],
  state: GameState
): NpcKeyMoment[] {
  return getKeyMoments(npcId, state).filter(km => km.category === category);
}
export function hasKeyMoment(
  npcId: string,
  category: NpcKeyMoment['category'],
  state: GameState
): boolean {
  return getKeyMomentsByCategory(npcId, category, state).length > 0;
}
// WAVE B: MEMORY RETRIEVAL PATTERNS
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
// MEMORY CLEANUP (Wave B Enhanced)
export function cleanupOldMemories(state: GameState): GameState {
  const memories = state.arcDirector?.npcMemories ?? [];
  const cleaned: NpcMemoryLedger[] = [];
  for (const raw of memories) {
    const ledger = normalizeLedgerEntry(raw);
    const filtered: NpcKeyMoment[] = [];
    for (const km of ledger.keyMoments) {
      const age = state.turn - km.turn;
      const keep =
        km.retention === 'scene'
          ? age <= 10
          : km.retention === 'arc'
            ? age <= 50
            : true;
      if (keep) filtered.push(km);
    }
    const dedupeKeys: string[] = [];
    for (const km of filtered) {
      const key = createDedupeKey(km.npcId, km.category as KeyMomentCategory, km.turn, km.data);
      if (!dedupeKeys.includes(key)) dedupeKeys.push(key);
    }
    cleaned.push(normalizeLedgerEntry({ npcId: ledger.npcId, keyMoments: filtered, lastUpdated: ledger.lastUpdated, dedupeKeys }));
  }
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      npcMemories: cleaned,
    },
  };
}
// SITUATION PACKET INTEGRATION (Wave B Enhanced)
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
// CONVENIENCE FUNCTIONS (Wave B)
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
