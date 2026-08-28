/**
 * WS-7 Wave B: NPC Relationship Tracking
 * 
 * Persistent relationship system with disposition FSM, trust/respect/fear dimensions,
 * milestones, promises, boundaries, and knowledge ledgers.
 */

import type { GameState } from './types';

export type Disposition = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'allied' | 'loyal';

export type RelationshipMilestoneType =
  | 'first_meet'
  | 'favor_granted'
  | 'favor_received'
  | 'promise_made'
  | 'promise_kept'
  | 'promise_broken'
  | 'betrayal'
  | 'forgiveness'
  | 'alliance'
  | 'loyalty'
  | 'romance'
  | 'romance_declined'
  | 'rivalry'
  | 'public_support'
  | 'public_humiliation'
  | 'leverage_used'
  | 'life_saved'
  | 'abandoned';

export type KnowledgeChannel = 'observed' | 'told' | 'rumor' | 'public_record' | 'faction_report';

export interface RelationshipMilestone {
  milestoneId: string;
  type: RelationshipMilestoneType;
  turn: number;
  sourceEventId: string;
  summary: string;
  valence: number; // -100..100
  salience: number; // 0..100
  permanent: boolean;
  relatedNpcIds: string[];
  relatedFactionIds: string[];
  tags: string[];
}

export interface PromiseRecord {
  promiseId: string;
  madeTurn: number;
  dueTurn?: number;
  description: string;
  status: 'open' | 'kept' | 'broken' | 'waived' | 'impossible';
  trustDeltaOnKeep: number;
  trustDeltaOnBreak: number;
  beneficiaries: string[];
  witnesses: string[];
}

export interface NpcKnowledgeFact {
  factId: string;
  proposition: string;
  learnedTurn: number;
  channel: KnowledgeChannel;
  sourceActorId: string;
  confidence: number; // 0..100
  salience: number; // 0..100
  expiryTurn?: number;
  contradictedBy: string[];
  tags: string[];
}

export interface RelationshipBoundary {
  boundaryId: string;
  category: 'consent' | 'privacy' | 'duty' | 'romance' | 'violence' | 'faction';
  statement: string;
  establishedTurn: number;
  active: boolean;
  breachConsequence: string;
}

export interface NpcRelationship {
  schemaVersion: 1;
  npcId: string;
  playerId: string;
  disposition: Disposition;
  trust: number; // -100..100
  respect: number; // 0..100
  fear: number; // 0..100; tracked separately so fear never masquerades as friendship
  intimacy: number; // 0..100; never overrides consent/boundaries
  familiarity: number; // 0..100
  firstMetTurn: number;
  lastInteractionTurn: number;
  milestones: RelationshipMilestone[];
  promises: PromiseRecord[];
  knowledge: NpcKnowledgeFact[];
  boundaries: RelationshipBoundary[];
  roles: string[]; // WS-2 obligation/role IDs
  factionIds: string[];
  availableUnlocks: string[];
  closedPaths: Array<{ pathId: string; reason: string; reopenConditions: string[] }>;
  revision: number;
}

export interface RelationshipEvent {
  eventId: string;
  npcId: string;
  turn: number;
  kind:
    | 'interaction'
    | 'favor'
    | 'promise'
    | 'betrayal'
    | 'repair'
    | 'threat'
    | 'deception_revealed'
    | 'public_act'
    | 'milestone'
    | 'decay_tick';
  trustDelta: number;
  respectDelta: number;
  fearDelta: number;
  intimacyDelta: number;
  familiarityDelta: number;
  milestone?: RelationshipMilestone;
  knowledge?: NpcKnowledgeFact;
  promise?: PromiseRecord;
  notes: string[];
}

const DISPOSITION_INDEX: Record<Disposition, number> = {
  hostile: 0,
  wary: 1,
  neutral: 2,
  friendly: 3,
  allied: 4,
  loyal: 5,
};

export const TRUST_BANDS: ReadonlyArray<{
  disposition: Disposition;
  minTrust: number;
  minFamiliarity: number;
  requiredMilestones: RelationshipMilestoneType[];
  forbiddenUnrepairedMilestones: RelationshipMilestoneType[];
}> = [
  { disposition: 'hostile', minTrust: -100, minFamiliarity: 0, requiredMilestones: [], forbiddenUnrepairedMilestones: [] },
  { disposition: 'wary', minTrust: -49, minFamiliarity: 0, requiredMilestones: [], forbiddenUnrepairedMilestones: [] },
  { disposition: 'neutral', minTrust: -9, minFamiliarity: 5, requiredMilestones: ['first_meet'], forbiddenUnrepairedMilestones: [] },
  { disposition: 'friendly', minTrust: 20, minFamiliarity: 20, requiredMilestones: ['favor_granted'], forbiddenUnrepairedMilestones: ['betrayal'] },
  { disposition: 'allied', minTrust: 50, minFamiliarity: 40, requiredMilestones: ['alliance'], forbiddenUnrepairedMilestones: ['betrayal', 'promise_broken'] },
  { disposition: 'loyal', minTrust: 75, minFamiliarity: 60, requiredMilestones: ['loyalty'], forbiddenUnrepairedMilestones: ['betrayal', 'promise_broken', 'abandoned'] },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasMilestone(r: NpcRelationship, type: RelationshipMilestoneType): boolean {
  return r.milestones.some((m) => m.type === type);
}

function hasUnrepairedBetrayal(r: NpcRelationship): boolean {
  const betrayal = [...r.milestones].reverse().find((m) => m.type === 'betrayal');
  if (!betrayal) return false;
  const forgiveness = [...r.milestones].reverse().find((m) => m.type === 'forgiveness');
  return !forgiveness || forgiveness.turn < betrayal.turn;
}

function meetsBand(r: NpcRelationship, band: (typeof TRUST_BANDS)[number]): boolean {
  if (r.trust < band.minTrust || r.familiarity < band.minFamiliarity) return false;
  if (!band.requiredMilestones.every((m) => hasMilestone(r, m))) return false;
  if (band.forbiddenUnrepairedMilestones.includes('betrayal') && hasUnrepairedBetrayal(r)) return false;
  if (band.forbiddenUnrepairedMilestones.some((m) => m !== 'betrayal' && hasMilestone(r, m))) return false;
  return true;
}

/**
 * Disposition uses hysteresis: promotion requires thresholds plus milestones; demotion is immediate
 * when trust crosses the lower band's ceiling or a hard breach occurs. This prevents trivial-favor oscillation.
 */
export function deriveDisposition(r: NpcRelationship): Disposition {
  if (r.trust <= -50) return 'hostile';
  if (r.trust <= -10) return 'wary';

  let highest: Disposition = 'neutral';
  for (const band of TRUST_BANDS) {
    if (meetsBand(r, band) && DISPOSITION_INDEX[band.disposition] > DISPOSITION_INDEX[highest]) {
      highest = band.disposition;
    }
  }

  // An active consent or duty breach caps the relationship at wary.
  const breachedBoundary = r.boundaries.some((b) => b.active && r.milestones.some((m) => m.tags.includes(`breach:${b.boundaryId}`)));
  if (breachedBoundary) return 'wary';
  return highest;
}

export function applyRelationshipEvent(
  current: NpcRelationship,
  event: RelationshipEvent,
): NpcRelationship {
  if (event.npcId !== current.npcId) throw new Error('Relationship event targets the wrong NPC');

  const next: NpcRelationship = {
    ...current,
    trust: clamp(current.trust + event.trustDelta, -100, 100),
    respect: clamp(current.respect + event.respectDelta, 0, 100),
    fear: clamp(current.fear + event.fearDelta, 0, 100),
    intimacy: clamp(current.intimacy + event.intimacyDelta, 0, 100),
    familiarity: clamp(current.familiarity + event.familiarityDelta, 0, 100),
    lastInteractionTurn: event.turn,
    milestones: event.milestone ? [...current.milestones, event.milestone] : current.milestones,
    promises: event.promise ? upsertPromise(current.promises, event.promise) : current.promises,
    knowledge: event.knowledge ? upsertKnowledge(current.knowledge, event.knowledge) : current.knowledge,
    revision: current.revision + 1,
  };
  next.disposition = deriveDisposition(next);
  next.availableUnlocks = deriveUnlocks(next);
  return next;
}

function upsertPromise(existing: PromiseRecord[], candidate: PromiseRecord): PromiseRecord[] {
  const without = existing.filter((p) => p.promiseId !== candidate.promiseId);
  return [...without, candidate];
}

function upsertKnowledge(existing: NpcKnowledgeFact[], candidate: NpcKnowledgeFact): NpcKnowledgeFact[] {
  const old = existing.find((f) => f.factId === candidate.factId);
  if (!old) return [...existing, candidate];
  const merged: NpcKnowledgeFact = {
    ...old,
    ...candidate,
    confidence: Math.max(old.confidence, candidate.confidence),
    salience: Math.max(old.salience, candidate.salience),
    contradictedBy: [...new Set([...old.contradictedBy, ...candidate.contradictedBy])],
    tags: [...new Set([...old.tags, ...candidate.tags])],
  };
  return [...existing.filter((f) => f.factId !== candidate.factId), merged];
}

export function deriveUnlocks(r: NpcRelationship): string[] {
  const unlocks = new Set<string>();
  if (DISPOSITION_INDEX[r.disposition] >= DISPOSITION_INDEX.friendly) unlocks.add('npc_optional_quest');
  if (DISPOSITION_INDEX[r.disposition] >= DISPOSITION_INDEX.allied) {
    unlocks.add('npc_crisis_support');
    unlocks.add('npc_private_access');
  }
  if (r.disposition === 'loyal') {
    unlocks.add('npc_deep_secret');
    unlocks.add('npc_sacrifice_option');
  }
  if (r.respect >= 60) unlocks.add('npc_accepts_strategic_disagreement');
  if (r.fear >= 60 && r.trust < 20) unlocks.add('npc_resentful_compliance');
  if (r.intimacy >= 50 && !r.boundaries.some((b) => b.active && b.category === 'romance')) unlocks.add('npc_intimacy_conversation');
  return [...unlocks];
}

/** Permanent by default: only low-salience familiarity and rumor confidence decay. */
export function applyLongAbsence(
  current: NpcRelationship,
  currentTurn: number,
): NpcRelationship {
  const elapsed = Math.max(0, currentTurn - current.lastInteractionTurn);
  if (elapsed < 100) return current;
  const steps = Math.floor(elapsed / 100);
  const knowledge = current.knowledge.map((fact) =>
    fact.channel === 'rumor' && !fact.expiryTurn
      ? { ...fact, confidence: clamp(fact.confidence - 5 * steps, 0, 100) }
      : fact,
  );
  return {
    ...current,
    familiarity: clamp(current.familiarity - 2 * steps, 0, 100),
    knowledge,
    revision: current.revision + 1,
  };
}

export function relationshipUiView(r: NpcRelationship): {
  characterSheet: object;
  journal: object;
} {
  return {
    characterSheet: {
      npcId: r.npcId,
      disposition: r.disposition,
      trust: r.trust,
      respect: r.respect,
      fear: r.fear,
      relationshipTier: r.disposition,
      visibleMilestones: r.milestones.filter((m) => m.salience >= 40).map((m) => ({ type: m.type, summary: m.summary, turn: m.turn })),
      unlocks: r.availableUnlocks,
    },
    journal: {
      npcId: r.npcId,
      promises: r.promises.filter((p) => p.status === 'open'),
      knownBoundaries: r.boundaries.filter((b) => b.active).map((b) => b.statement),
      recentHistory: [...r.milestones].sort((a, b) => b.turn - a.turn).slice(0, 8),
      closedPaths: r.closedPaths,
    },
  };
}

/**
 * Get or create relationship for NPC
 */
export function getOrCreateRelationship(
  state: GameState,
  npcName: string,
  playerId: string = 'player'
): NpcRelationship {
  const relationships = state.arcDirector?.npcRelationships ?? [];
  const existing = relationships.find(r => r.npcName.toLowerCase() === npcName.toLowerCase());
  
  if (existing) {
    return existing as unknown as NpcRelationship;
  }
  
  // Create new relationship
  return {
    schemaVersion: 1,
    npcId: npcName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    playerId,
    disposition: 'neutral',
    trust: 0,
    respect: 0,
    fear: 0,
    intimacy: 0,
    familiarity: 0,
    firstMetTurn: state.turn ?? 0,
    lastInteractionTurn: state.turn ?? 0,
    milestones: [
      {
        milestoneId: `first-meet-${state.turn}`,
        type: 'first_meet',
        turn: state.turn ?? 0,
        sourceEventId: 'initial',
        summary: `First met ${npcName}`,
        valence: 0,
        salience: 50,
        permanent: true,
        relatedNpcIds: [],
        relatedFactionIds: [],
        tags: [],
      }
    ],
    promises: [],
    knowledge: [],
    boundaries: [],
    roles: [],
    factionIds: [],
    availableUnlocks: [],
    closedPaths: [],
    revision: 1,
  };
}

/**
 * Update relationship in game state
 */
export function updateRelationship(
  state: GameState,
  relationship: NpcRelationship
): GameState {
  const relationships = state.arcDirector?.npcRelationships ?? [];
  const updated = relationships.filter((r: any) => r.npcName?.toLowerCase() !== relationship.npcId);
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      npcRelationships: [
        ...updated,
        {
          npcName: relationship.npcId,
          trust: relationship.trust,
          respect: relationship.respect,
          fear: relationship.fear,
          affinity: relationship.trust,
          milestones: relationship.milestones.map(m => ({
            type: m.type,
            turn: m.turn,
            summary: m.summary,
          })),
        }
      ],
    },
  };
}
