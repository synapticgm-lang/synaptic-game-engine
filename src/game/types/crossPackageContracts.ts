/**
 * Cross-Package Contracts (WS-2, WS-4, WS-5)
 * 
 * Shared type definitions for coordination between:
 * - WS-2: NPC Lifecycle
 * - WS-4: Encounter Bible
 * - WS-5: PYOA Persistence
 * 
 * These contracts define the integration points without creating
 * implementation coupling. Each package implements its side of the contract.
 */

// ============================================================================
// BASE RECEIPT TYPES
// ============================================================================

/**
 * Base receipt interface that all receipt types extend.
 * Receipts are immutable event records with idempotency guarantees.
 */
export interface BaseReceipt {
  /** Receipt type discriminator */
  kind: string;
  
  /** Unique receipt identifier */
  receiptId: string;
  
  /** Run identifier (campaign instance) */
  runId: string;
  
  /** Turn at which this receipt was committed */
  committedAtTurn: number;
  
  /** Idempotency key (prevents duplicate application) */
  idempotencyKey: string;
  
  /** Schema version for receipt format */
  schemaVersion: number;
}

/**
 * Fact write operation (exclusive facts, branch state, world state)
 */
export interface FactWrite {
  /** Fact identifier */
  factId: string;
  
  /** Fact value (boolean, string, number) */
  value: boolean | string | number;
  
  /** Visibility scope */
  visibility: 'private' | 'public' | 'faction' | 'witness';
  
  /** Retention policy */
  retention: 'permanent' | 'campaign' | 'arc' | 'scene';
  
  /** Source package */
  source: 'ws2' | 'ws4' | 'ws5';
}

/**
 * Resource delta (health, stamina, influence, etc.)
 */
export interface ResourceDelta {
  /** Resource type */
  resourceId: string;
  
  /** Change amount (positive = gain, negative = loss) */
  delta: number;
  
  /** Reason for change */
  reason: string;
}

/**
 * Relationship delta (affection, respect, fear, trust)
 */
export interface RelationshipDelta {
  /** NPC identifier */
  npcId: string;
  
  /** Relationship aspect */
  aspect: 'affection' | 'respect' | 'fear' | 'trust' | 'loyalty';
  
  /** Change amount */
  delta: number;
  
  /** Reason for change */
  reason: string;
}

// ============================================================================
// WS-2: NPC LIFECYCLE RECEIPTS
// ============================================================================

/**
 * NPC turnover receipt (exit, transform, relocate)
 */
export interface NpcTurnoverReceipt extends BaseReceipt {
  kind: 'npc_turnover';
  
  /** NPC identifier */
  npcId: string;
  
  /** Turnover action */
  action: 'exit' | 'transform' | 'relocate' | 'escalate' | 'delegate' | 'replace' | 'remain';
  
  /** Previous role (if transforming) */
  fromRole?: string;
  
  /** New role (if transforming) */
  toRole?: string;
  
  /** Successor NPC ID (if replaced/delegated) */
  successorNpcId?: string;
  
  /** Turnover reason */
  reason: 'debt_satisfied' | 'deadline_missed' | 'player_forced' | 'location_invalid' | 'story_beat';
  
  /** Memory events to preserve */
  inheritedMemoryIds?: readonly string[];
}

/**
 * NPC key moment (memory event)
 */
export interface NpcKeyMoment {
  /** Event ID */
  id: string;
  
  /** NPC actor */
  npcId: string;
  
  /** Event category */
  category: 'first_meet' | 'quest_disposition' | 'betrayal' | 'deal' | 'favor' | 
            'revelation' | 'role_change' | 'death' | 'relationship_change' | 
            'faction_broadcast' | 'gossip' | 'public_announcement' | 'rescue' | 'witness';
  
  /** Turn committed */
  turn: number;
  
  /** Event data */
  data: Record<string, unknown>;
  
  /** Provenance */
  provenance: 'direct' | 'witnessed' | 'trusted_source' | 'public' | 'faction';
  
  /** Visibility scope */
  visibility: 'private' | 'witnessed' | 'faction' | 'hub' | 'public';
  
  /** Retention policy */
  retention: 'permanent' | 'campaign' | 'arc' | 'scene';
}

// ============================================================================
// WS-4: ENCOUNTER BIBLE RECEIPTS
// ============================================================================

/**
 * Encounter receipt (combat, trap, hazard, social challenge)
 */
export interface EncounterReceipt extends BaseReceipt {
  kind: 'encounter';
  
  /** Encounter identifier */
  encounterId: string;
  
  /** Template identifier */
  templateId: string;
  
  /** Template version */
  templateVersion: string;
  
  /** Terminal outcome */
  terminal: 'victory' | 'defeat' | 'fled' | 'parleyResolved' | 'forcedFallback';
  
  /** Exclusive facts written */
  exclusiveFacts: readonly FactWrite[];
  
  /** Resource changes */
  resourceDeltas: readonly ResourceDelta[];
  
  /** Relationship changes */
  relationshipDeltas: readonly RelationshipDelta[];
  
  /** XP awarded */
  xpGained: number;
  
  /** Loot gained */
  loot: readonly string[];
  
  /** Faction standing changes */
  factionDeltas?: Record<string, number>;
  
  /** Quest progress */
  questProgress?: Record<string, number>;
  
  /** NPC effects (rescue, betrayal, witness) */
  npcEffects?: readonly EncounterNpcEffect[];
  
  /** Dungeon node cleared (if applicable) */
  clearedNodeId?: string;
}

/**
 * Encounter effect on NPC (for WS-2 integration)
 */
export interface EncounterNpcEffect {
  /** Encounter receipt ID */
  encounterId: string;
  
  /** Receipt ID */
  receiptId: string;
  
  /** Affected NPC */
  npcId: string;
  
  /** Memory category to append */
  memoryCategory: 'rescue' | 'betrayal' | 'witness' | 'favor';
  
  /** Relationship delta */
  relationshipDelta?: number;
  
  /** Role transition (captive → companion) */
  roleTransition?: {
    from: string;
    to: string;
  };
  
  /** Key moment data to append */
  keyMomentData: Partial<NpcKeyMoment>;
}

// ============================================================================
// WS-5: PYOA PERSISTENCE RECEIPTS
// ============================================================================

/**
 * Crisis receipt (PYOA branch fork)
 */
export interface CrisisReceipt extends BaseReceipt {
  kind: 'crisis';
  
  /** Bible identifier */
  bibleId: string;
  
  /** Crisis identifier */
  crisisId: string;
  
  /** Chosen fork */
  chosenForkId: string;
  
  /** Locked sibling forks */
  lockedForkIds: readonly string[];
  
  /** Exclusive facts written */
  factWrites: readonly FactWrite[];
  
  /** Resource deltas */
  resourceDeltas: readonly ResourceDelta[];
  
  /** Relationship deltas */
  relationshipDeltas: readonly RelationshipDelta[];
  
  /** Scheduled consequence IDs */
  scheduledConsequenceIds: readonly string[];
  
  /** XP awarded */
  xpGained: number;
}

/**
 * Delayed consequence (echo, return, reckoning)
 */
export interface DelayedConsequence {
  /** Consequence ID */
  id: string;
  
  /** Source crisis */
  sourceCrisisId: string;
  
  /** Source fork */
  sourceForkId: string;
  
  /** Committed at turn */
  committedAtTurn: number;
  
  /** Due at turn */
  dueAtTurn: number;
  
  /** Status */
  status: 'pending' | 'delivered' | 'cancelled';
  
  /** Consequence type */
  type: 'reveal' | 'betrayal' | 'reward' | 'penalty' | 
        'crisis_unlock' | 'relationship_shift' | 'world_state' | 'ending_unlock';
  
  /** Payload */
  payload: {
    writes?: readonly FactWrite[];
    resourceDeltas?: readonly ResourceDelta[];
    relationshipDeltas?: readonly RelationshipDelta[];
    unlockCrisisId?: string;
    unlockEndingId?: string;
    narrativeBeat: string;
    journalHint: string;
  };
}

/**
 * Convergence receipt (branch merge)
 */
export interface ConvergenceReceipt extends BaseReceipt {
  kind: 'convergence';
  
  /** Bible identifier */
  bibleId: string;
  
  /** Convergence contract ID */
  convergenceId: string;
  
  /** Participating crisis receipts */
  crisisReceiptIds: readonly string[];
  
  /** Provenance preserved */
  provenancePreserved: boolean;
  
  /** Variation recorded */
  variation: string;
}

/**
 * Ending receipt (PYOA terminal)
 */
export interface EndingReceipt extends BaseReceipt {
  kind: 'ending';
  
  /** Bible identifier */
  bibleId: string;
  
  /** Ending identifier */
  endingId: string;
  
  /** Ending class */
  class: 'secret' | 'triumph' | 'transformation' | 'costly-victory' | 'escape' | 'failure';
  
  /** Terminal facts */
  terminalFacts: readonly FactWrite[];
  
  /** Terminal turn */
  terminalTurn: number;
}

// ============================================================================
// UNIFIED RECEIPT UNION
// ============================================================================

/**
 * Union of all receipt types across packages
 */
export type Receipt = 
  | NpcTurnoverReceipt
  | EncounterReceipt
  | CrisisReceipt
  | ConvergenceReceipt
  | EndingReceipt;

// ============================================================================
// CROSS-PACKAGE TRIGGER CONTRACTS
// ============================================================================

/**
 * NPC → Encounter trigger (WS-2 → WS-4)
 * 
 * NPCs with obligations can trigger encounters.
 * Example: Quest Patron "clear the bandits" → encounter spawn
 */
export interface NpcEncounterTrigger {
  /** NPC identifier */
  npcId: string;
  
  /** Obligation identifier */
  obligationId: string;
  
  /** Encounter role */
  encounterRole: 'ambush' | 'patrol' | 'guard' | 'boss' | 'rescue' | 'escort';
  
  /** Biome constraints */
  biomeConstraints: {
    allowedBiomes?: readonly string[];
    excludedBiomes?: readonly string[];
  };
  
  /** Tier range */
  tierRange: [number, number];
  
  /** Success criteria */
  successCriteria: 'victory' | 'flee' | 'parley' | 'any_terminal';
  
  /** Urgency */
  urgency: 'soft' | 'hard' | 'story-beat';
  
  /** Deadline (turns remaining) */
  deadline?: number;
}

/**
 * NPC → Crisis trigger (WS-2 → WS-5)
 * 
 * NPC betrayals/deals/favors can trigger delayed PYOA crises.
 * Example: Betray merchant at T30 → "The Reckoning" crisis at T80
 */
export interface NpcCrisisTrigger {
  /** Source NPC */
  sourceNpcId: string;
  
  /** Source event */
  sourceEvent: 'betrayal' | 'favor' | 'deal' | 'revelation' | 'death';
  
  /** Crisis identifier */
  crisisId: string;
  
  /** Delay (turns) */
  delayTurns: number;
  
  /** Prerequisites (must be satisfied when due) */
  prerequisites?: PredicateGroup;
  
  /** Urgency pattern */
  urgency: 'echo' | 'return' | 'reckoning';
}

/**
 * Predicate group (for prerequisites and gates)
 */
export interface PredicateGroup {
  mode: 'all' | 'any' | 'none';
  predicates: readonly Predicate[];
}

/**
 * Predicate (fact check, resource check, relationship check)
 */
export interface Predicate {
  kind: 'fact' | 'resource' | 'relationship' | 'turn' | 'location' | 'npc_state';
  target: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value?: boolean | string | number;
}

// ============================================================================
// EXCLUSIVE FACTS REGISTRY
// ============================================================================

/**
 * Exclusive fact group (mutex enforcement)
 */
export interface ExclusiveFactGroup {
  /** Group identifier */
  id: string;
  
  /** Mutex mode */
  mode: 'at-most-one' | 'exactly-one-after-crisis';
  
  /** Member fact IDs */
  members: readonly string[];
  
  /** Owner package */
  ownerPackage: 'ws2' | 'ws4' | 'ws5';
  
  /** Owner crisis (if exactly-one-after-crisis) */
  ownerCrisisId?: string;
  
  /** Description */
  description: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Package identifier
 */
export type PackageId = 'ws2' | 'ws4' | 'ws5';

/**
 * Idempotency key format: `{package}:{kind}:{runId}:{entityId}`
 * 
 * Examples:
 * - WS-2: `ws2:npc_turnover:run-123:npc-aldous`
 * - WS-4: `ws4:encounter:run-123:enc-ambush-07`
 * - WS-5: `ws5:crisis:run-123:crisis-alliance-fork`
 */
export function buildIdempotencyKey(
  packageId: PackageId,
  kind: string,
  runId: string,
  entityId: string
): string {
  return `${packageId}:${kind}:${runId}:${entityId}`;
}

/**
 * Parse idempotency key into components
 */
export function parseIdempotencyKey(key: string): {
  packageId: PackageId;
  kind: string;
  runId: string;
  entityId: string;
} | null {
  const parts = key.split(':');
  if (parts.length !== 4) return null;
  
  const [packageId, kind, runId, entityId] = parts;
  if (!['ws2', 'ws4', 'ws5'].includes(packageId)) return null;
  
  return { packageId: packageId as PackageId, kind, runId, entityId };
}
