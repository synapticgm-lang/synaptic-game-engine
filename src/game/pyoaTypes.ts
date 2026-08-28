/**
 * WS-5 Wave 1 — PYOA Branch Persistence Receipt Types
 * 
 * Based on: Manus WS-5 Complete Package
 * Status: Immutable receipt-based ledger for PYOA crisis resolution
 */

export type BibleId = 'thornferry-road' | 'vesper-glass-cipher' | 'erebus-9';
export type CrisisId = `${BibleId}:${string}`;
export type ForkId = `${CrisisId}:${string}`;
export type FactId = `${BibleId}.${string}` | `global.${string}`;
export type EndingId = `${BibleId}:ending:${string}`;
export type ConsequenceId = `${CrisisId}:consequence:${string}`;
export type ConvergenceId = `${BibleId}:convergence:${string}`;
export type ReceiptId = string;
export type RunId = string;
export type Turn = number;

export interface TurnWindow {
  readonly earliest: Turn;
  readonly target: Turn;
  readonly latest: Turn;
}

export interface ResourceDelta {
  readonly resource: 'health' | 'supplies' | 'coin' | 'time' | 'heat' | 'morale' | 'intel' | 'integrity' | 'oxygen' | 'power';
  readonly amount: number;
}

export interface RelationshipDelta {
  readonly actorId: string;
  readonly amount: number;
}

export interface FactWrite {
  readonly factId: FactId;
  readonly value: boolean | number | string;
  readonly visibility: 'known' | 'veiled' | 'hidden';
  readonly journalText?: string;
}

export interface FactPredicate {
  readonly factId: FactId;
  readonly op: 'exists' | 'absent' | 'eq' | 'neq' | 'gte' | 'lte';
  readonly value?: boolean | number | string;
}

export interface PredicateGroup {
  readonly all?: readonly FactPredicate[];
  readonly any?: readonly FactPredicate[];
  readonly none?: readonly FactPredicate[];
}

export interface ExclusiveFactGroup {
  readonly id: string;
  readonly mode: 'at-most-one' | 'exactly-one-after-crisis';
  readonly members: readonly FactId[];
  readonly ownerCrisisId?: CrisisId;
  readonly description: string;
}

export interface ForkSpec {
  readonly id: ForkId;
  readonly label: string;
  readonly journalLabel: string;
  readonly writes: readonly FactWrite[];
  readonly requires?: PredicateGroup;
  readonly costs: {
    readonly resources: readonly ResourceDelta[];
    readonly relationships: readonly RelationshipDelta[];
  };
  readonly immediateBeat: string;
  readonly locks: readonly ForkId[];
  readonly schedules: readonly DelayedConsequenceTemplate[];
  readonly endingAffinity: readonly EndingId[];
}

export interface CrisisSpec {
  readonly schemaVersion: 1;
  readonly id: CrisisId;
  readonly bibleId: BibleId;
  readonly title: string;
  readonly archetype:
    | 'charter'
    | 'trust-test'
    | 'triage'
    | 'revelation'
    | 'alliance'
    | 'sacrifice'
    | 'final-confrontation';
  readonly telegraph: string;
  readonly window: TurnWindow;
  readonly prerequisites: PredicateGroup;
  readonly forks: readonly ForkSpec[];
  readonly convergence?: ConvergenceId;
  readonly oncePerRun: true;
  readonly journalHint: string;
}

export type ConsequenceType =
  | 'reveal'
  | 'betrayal'
  | 'reward'
  | 'penalty'
  | 'crisis_unlock'
  | 'relationship_shift'
  | 'world_state'
  | 'ending_unlock';

export interface DelayedConsequenceTemplate {
  readonly key: string;
  readonly delayTurns: number;
  readonly type: ConsequenceType;
  readonly payload: {
    readonly writes?: readonly FactWrite[];
    readonly resourceDeltas?: readonly ResourceDelta[];
    readonly relationshipDeltas?: readonly RelationshipDelta[];
    readonly unlockCrisisId?: CrisisId;
    readonly unlockEndingId?: EndingId;
    readonly narrativeBeat: string;
    readonly journalHint: string;
  };
}

export interface DelayedConsequence extends DelayedConsequenceTemplate {
  readonly id: ConsequenceId;
  readonly sourceCrisisId: CrisisId;
  readonly sourceForkId: ForkId;
  readonly committedAtTurn: Turn;
  readonly dueAtTurn: Turn;
  readonly status: 'pending' | 'delivered' | 'cancelled';
  readonly deliveredAtTurn?: Turn;
  readonly deliveryReceiptId?: ReceiptId;
}

export interface BranchLock {
  readonly crisisId: CrisisId;
  readonly chosenForkId: ForkId;
  readonly lockedForkIds: readonly ForkId[];
  readonly lockedAtTurn: Turn;
  readonly receiptId: ReceiptId;
}

export interface FactRecord extends FactWrite {
  readonly sourceReceiptId: ReceiptId;
  readonly writtenAtTurn: Turn;
}

/**
 * WS5-001 — Crisis Receipt
 * 
 * Immutable record of a crisis fork selection with atomic sibling locks.
 * Idempotency key: `${runId}::${crisisId}`
 */
export interface CrisisReceipt {
  readonly kind: 'crisis';
  readonly schemaVersion: 1;
  readonly receiptId: ReceiptId;
  readonly runId: RunId;
  readonly bibleId: BibleId;
  readonly crisisId: CrisisId;
  readonly chosenForkId: ForkId;
  readonly lockedForkIds: readonly ForkId[];
  readonly factWrites: readonly FactWrite[];
  readonly scheduledConsequenceIds: readonly ConsequenceId[];
  readonly resourceDeltas: readonly ResourceDelta[];
  readonly relationshipDeltas: readonly RelationshipDelta[];
  readonly committedAtTurn: Turn;
  readonly idempotencyKey: string;
}

/**
 * WS5-001 — Consequence Receipt
 * 
 * Immutable record of a delayed consequence delivery.
 * Idempotency key: `${runId}::${consequenceId}`
 */
export interface ConsequenceReceipt {
  readonly kind: 'consequence';
  readonly schemaVersion: 1;
  readonly receiptId: ReceiptId;
  readonly runId: RunId;
  readonly bibleId: BibleId;
  readonly consequenceId: ConsequenceId;
  readonly factWrites: readonly FactWrite[];
  readonly resourceDeltas: readonly ResourceDelta[];
  readonly relationshipDeltas: readonly RelationshipDelta[];
  readonly committedAtTurn: Turn;
  readonly idempotencyKey: string;
}

export interface ConvergenceSpec {
  readonly schemaVersion: 1;
  readonly id: ConvergenceId;
  readonly bibleId: BibleId;
  readonly title: string;
  readonly window: TurnWindow;
  readonly eligibleWhen: PredicateGroup;
  readonly equivalentOn: readonly FactId[];
  readonly preserveProvenanceFacts: readonly FactId[];
  readonly spawnCrisisId: CrisisId;
  readonly oncePerRun: true;
  readonly journalText: string;
}

export interface ConvergenceReceipt {
  readonly kind: 'convergence';
  readonly schemaVersion: 1;
  readonly receiptId: ReceiptId;
  readonly runId: RunId;
  readonly bibleId: BibleId;
  readonly convergenceId: ConvergenceId;
  readonly projectionHash: string;
  readonly preservedFacts: readonly FactId[];
  readonly committedAtTurn: Turn;
  readonly idempotencyKey: string;
}

export interface EndingGateSpec {
  readonly schemaVersion: 1;
  readonly id: EndingId;
  readonly bibleId: BibleId;
  readonly name: string;
  readonly class: 'triumph' | 'costly-victory' | 'escape' | 'transformation' | 'failure' | 'secret';
  readonly priority: number;
  readonly window: TurnWindow;
  readonly prerequisites: PredicateGroup;
  readonly triggerCrisisId: CrisisId;
  readonly terminalWrites: readonly FactWrite[];
  readonly terminalText: string;
  readonly journalTeaser: string;
}

export interface EndingReceipt {
  readonly kind: 'ending';
  readonly schemaVersion: 1;
  readonly receiptId: ReceiptId;
  readonly runId: RunId;
  readonly bibleId: BibleId;
  readonly endingId: EndingId;
  readonly triggerCrisisId: CrisisId;
  readonly committedAtTurn: Turn;
  readonly idempotencyKey: string;
  readonly terminal: true;
}

export type BranchReceipt = CrisisReceipt | ConsequenceReceipt | ConvergenceReceipt | EndingReceipt;

/**
 * WS5-001 — PYOA Branch Ledger
 * 
 * Immutable append-only receipt ledger with materialized projections.
 * Source of truth: receipts array
 * Query optimizations: locks, facts, consequences, convergenceReceipts
 */
export interface PyoaBranchLedger {
  readonly schemaVersion: 1;
  readonly runId: RunId;
  readonly bibleId: BibleId;
  readonly seed: string;
  readonly manifestVersion: string;
  readonly receipts: readonly BranchReceipt[];
  readonly locks: Readonly<Record<CrisisId, BranchLock>>;
  readonly facts: Readonly<Record<FactId, FactRecord>>;
  readonly consequences: Readonly<Record<ConsequenceId, DelayedConsequence>>;
  readonly convergenceReceipts: Readonly<Partial<Record<ConvergenceId, ConvergenceReceipt>>>;
  readonly endingReceipt?: EndingReceipt;
}

export interface CommitContext {
  readonly currentTurn: Turn;
  readonly resourceSnapshot: Readonly<Record<string, number>>;
  readonly relationshipSnapshot: Readonly<Record<string, number>>;
}

export interface CommitResult {
  readonly ledger: PyoaBranchLedger;
  readonly receipt: BranchReceipt;
}

/**
 * WS5-006 — Branch Invariant Errors
 * 
 * Typed errors for transaction failures.
 */
export class BranchInvariantError extends Error {
  constructor(
    readonly code:
      | 'CRISIS_ALREADY_RESOLVED'
      | 'FORK_NOT_FOUND'
      | 'FORK_PREREQUISITE_FAILED'
      | 'FACT_CONFLICT'
      | 'INSUFFICIENT_RESOURCE'
      | 'CONSEQUENCE_ALREADY_DELIVERED'
      | 'CONVERGENCE_NOT_ELIGIBLE'
      | 'ENDING_NOT_ELIGIBLE'
      | 'RUN_ALREADY_TERMINAL',
    message: string,
  ) {
    super(message);
    this.name = 'BranchInvariantError';
  }
}

export interface PyoaBibleCatalog {
  readonly schemaVersion: 1;
  readonly bibleId: BibleId;
  readonly title: string;
  readonly premise: string;
  readonly exclusiveFactGroups: readonly ExclusiveFactGroup[];
  readonly crises: readonly CrisisSpec[];
  readonly convergences: readonly ConvergenceSpec[];
  readonly endings: readonly EndingGateSpec[];
}
