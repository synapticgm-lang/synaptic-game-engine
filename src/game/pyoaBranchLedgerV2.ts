/**
 * WS-5 Wave 1 — PYOA Branch Ledger Implementation
 * 
 * Based on: Manus WS-5 Complete Package
 * Tasks: WS5-002 through WS5-009
 */

import { nanoid } from 'nanoid';
import type {
  BibleId,
  BranchInvariantError,
  BranchLock,
  BranchReceipt,
  CommitContext,
  CommitResult,
  CrisisId,
  CrisisReceipt,
  CrisisSpec,
  DelayedConsequence,
  ExclusiveFactGroup,
  FactId,
  FactPredicate,
  FactRecord,
  FactWrite,
  ForkId,
  ForkSpec,
  PredicateGroup,
  PyoaBibleCatalog,
  PyoaBranchLedger,
  ReceiptId,
  ResourceDelta,
  RunId,
  Turn,
} from './pyoaTypes';
import { BranchInvariantError as BranchError } from './pyoaTypes';

/**
 * WS5-001 — Initialize empty ledger
 */
export function initPyoaBranchLedger(
  runId: RunId,
  bibleId: BibleId,
  seed: string,
  manifestVersion: string,
): PyoaBranchLedger {
  return {
    schemaVersion: 1,
    runId,
    bibleId,
    seed,
    manifestVersion,
    receipts: [],
    locks: {},
    facts: {},
    consequences: {},
    convergenceReceipts: {},
    endingReceipt: undefined,
  };
}

/**
 * WS5-002 — Compute idempotency key for crisis
 * 
 * Unique constraint: (runId, crisisId)
 */
function computeCrisisIdempotencyKey(runId: RunId, crisisId: CrisisId): string {
  return `${runId}::${crisisId}`;
}

/**
 * WS5-005 — Check if fact write violates exclusive fact group
 */
function checkExclusiveFactConflict(
  factWrites: readonly FactWrite[],
  existingFacts: Readonly<Record<FactId, FactRecord>>,
  exclusiveGroups: readonly ExclusiveFactGroup[],
): { conflict: boolean; groupId?: string; conflictingFacts?: FactId[] } {
  for (const group of exclusiveGroups) {
    const newMemberWrites = factWrites.filter((fw) => group.members.includes(fw.factId));
    const existingMembers = group.members.filter((fid) => existingFacts[fid] !== undefined);

    if (group.mode === 'at-most-one') {
      // At most one member can be set
      const totalSet = newMemberWrites.length + existingMembers.length;
      if (totalSet > 1) {
        return {
          conflict: true,
          groupId: group.id,
          conflictingFacts: [...newMemberWrites.map((fw) => fw.factId), ...existingMembers],
        };
      }
    } else if (group.mode === 'exactly-one-after-crisis') {
      // After owner crisis, exactly one member must be set
      // (This check is deferred until after owner crisis commits)
      const totalSet = newMemberWrites.length + existingMembers.length;
      if (totalSet > 1) {
        return {
          conflict: true,
          groupId: group.id,
          conflictingFacts: [...newMemberWrites.map((fw) => fw.factId), ...existingMembers],
        };
      }
    }
  }

  return { conflict: false };
}

/**
 * WS5-006 — Assert exclusive facts before commit
 */
function assertExclusiveFacts(
  factWrites: readonly FactWrite[],
  existingFacts: Readonly<Record<FactId, FactRecord>>,
  exclusiveGroups: readonly ExclusiveFactGroup[],
): void {
  const { conflict, groupId, conflictingFacts } = checkExclusiveFactConflict(
    factWrites,
    existingFacts,
    exclusiveGroups,
  );

  if (conflict) {
    throw new BranchError(
      'FACT_CONFLICT',
      `Exclusive fact group '${groupId}' violation: ${conflictingFacts?.join(', ')}`,
    );
  }
}

/**
 * WS5-006 — Check if fork prerequisites are satisfied
 */
function checkForkPrerequisites(
  fork: ForkSpec,
  facts: Readonly<Record<FactId, FactRecord>>,
): boolean {
  if (!fork.requires) return true;

  const { all, any, none } = fork.requires;

  if (all) {
    for (const pred of all) {
      if (!evaluatePredicate(pred, facts)) return false;
    }
  }

  if (any) {
    if (!any.some((pred) => evaluatePredicate(pred, facts))) return false;
  }

  if (none) {
    for (const pred of none) {
      if (evaluatePredicate(pred, facts)) return false;
    }
  }

  return true;
}

/**
 * WS5-006 — Evaluate single predicate against facts
 */
function evaluatePredicate(
  pred: FactPredicate,
  facts: Readonly<Record<FactId, FactRecord>>,
): boolean {
  const fact = facts[pred.factId];

  switch (pred.op) {
    case 'exists':
      return fact !== undefined;
    case 'absent':
      return fact === undefined;
    case 'eq':
      return fact?.value === pred.value;
    case 'neq':
      return fact?.value !== pred.value;
    case 'gte':
      return typeof fact?.value === 'number' && typeof pred.value === 'number'
        ? fact.value >= pred.value
        : false;
    case 'lte':
      return typeof fact?.value === 'number' && typeof pred.value === 'number'
        ? fact.value <= pred.value
        : false;
    default:
      return false;
  }
}

/**
 * WS5-006 — Check if resources are sufficient for costs
 */
function checkResourceCosts(
  costs: readonly ResourceDelta[],
  resourceSnapshot: Readonly<Record<string, number>>,
): boolean {
  for (const cost of costs) {
    const current = resourceSnapshot[cost.resource] ?? 0;
    if (cost.amount < 0 && current + cost.amount < 0) {
      return false; // Insufficient resource
    }
  }
  return true;
}

/**
 * WS5-003 — Commit crisis fork atomically
 * 
 * Atomic transaction:
 * 1. Check idempotency (return existing receipt if key exists)
 * 2. Check fork prerequisites
 * 3. Check resource costs
 * 4. Check exclusive fact groups
 * 5. Lock all sibling forks
 * 6. Write facts
 * 7. Schedule consequences
 * 8. Create receipt
 * 9. Update materialized views
 */
export function commitCrisisFork(
  ledger: PyoaBranchLedger,
  catalog: PyoaBibleCatalog,
  crisis: CrisisSpec,
  forkId: ForkId,
  context: CommitContext,
): CommitResult {
  // WS5-002 — Check idempotency
  const idempotencyKey = computeCrisisIdempotencyKey(ledger.runId, crisis.id);
  const existing = ledger.receipts.find(
    (r) => r.kind === 'crisis' && r.idempotencyKey === idempotencyKey,
  ) as CrisisReceipt | undefined;

  if (existing) {
    // Idempotent retry — return existing receipt
    return { ledger, receipt: existing };
  }

  // Check terminal
  if (ledger.endingReceipt) {
    throw new BranchError('RUN_ALREADY_TERMINAL', 'Cannot commit crisis after ending');
  }

  // Find fork
  const fork = crisis.forks.find((f) => f.id === forkId);
  if (!fork) {
    throw new BranchError('FORK_NOT_FOUND', `Fork ${forkId} not found in crisis ${crisis.id}`);
  }

  // WS5-006 — Check fork prerequisites
  if (!checkForkPrerequisites(fork, ledger.facts)) {
    throw new BranchError('FORK_PREREQUISITE_FAILED', `Fork ${forkId} prerequisites not met`);
  }

  // WS5-006 — Check resource costs
  if (!checkResourceCosts(fork.costs.resources, context.resourceSnapshot)) {
    throw new BranchError('INSUFFICIENT_RESOURCE', `Fork ${forkId} resource costs not met`);
  }

  // WS5-006 — Check exclusive facts
  assertExclusiveFacts(fork.writes, ledger.facts, catalog.exclusiveFactGroups);

  // Compute locked sibling forks
  const lockedForkIds = crisis.forks.filter((f) => f.id !== forkId).map((f) => f.id);

  // Schedule consequences
  const scheduledConsequenceIds = fork.schedules.map(
    (template) =>
      `${crisis.id}:consequence:${template.key}` as const satisfies `${CrisisId}:consequence:${string}`,
  );

  // Create receipt
  const receiptId: ReceiptId = nanoid();
  const receipt: CrisisReceipt = {
    kind: 'crisis',
    schemaVersion: 1,
    receiptId,
    runId: ledger.runId,
    bibleId: ledger.bibleId,
    crisisId: crisis.id,
    chosenForkId: forkId,
    lockedForkIds,
    factWrites: fork.writes,
    scheduledConsequenceIds,
    resourceDeltas: fork.costs.resources,
    relationshipDeltas: fork.costs.relationships,
    committedAtTurn: context.currentTurn,
    idempotencyKey,
  };

  // Update materialized views
  const newLock: BranchLock = {
    crisisId: crisis.id,
    chosenForkId: forkId,
    lockedForkIds,
    lockedAtTurn: context.currentTurn,
    receiptId,
  };

  const newFacts: Record<FactId, FactRecord> = { ...ledger.facts };
  for (const write of fork.writes) {
    newFacts[write.factId] = {
      ...write,
      sourceReceiptId: receiptId,
      writtenAtTurn: context.currentTurn,
    };
  }

  const newConsequences: Record<string, DelayedConsequence> = { ...ledger.consequences };
  for (const template of fork.schedules) {
    const consequenceId = scheduledConsequenceIds[fork.schedules.indexOf(template)];
    newConsequences[consequenceId] = {
      ...template,
      id: consequenceId,
      sourceCrisisId: crisis.id,
      sourceForkId: forkId,
      committedAtTurn: context.currentTurn,
      dueAtTurn: context.currentTurn + template.delayTurns,
      status: 'pending',
    };
  }

  // Return updated ledger
  const updatedLedger: PyoaBranchLedger = {
    ...ledger,
    receipts: [...ledger.receipts, receipt],
    locks: { ...ledger.locks, [crisis.id]: newLock },
    facts: newFacts,
    consequences: newConsequences,
  };

  return { ledger: updatedLedger, receipt };
}

/**
 * WS5-004 — Rebuild materialized views from receipts
 * 
 * Recovery function that rebuilds locks, facts, consequences from receipts.
 * Used on load or when views are suspected to be corrupted.
 */
export function rebuildLedgerFromReceipts(ledger: PyoaBranchLedger): PyoaBranchLedger {
  const locks: Record<CrisisId, BranchLock> = {};
  const facts: Record<FactId, FactRecord> = {};
  const consequences: Record<string, DelayedConsequence> = {};
  const convergenceReceipts: Partial<Record<string, any>> = {};
  let endingReceipt: any = undefined;

  for (const receipt of ledger.receipts) {
    if (receipt.kind === 'crisis') {
      // Rebuild lock
      locks[receipt.crisisId] = {
        crisisId: receipt.crisisId,
        chosenForkId: receipt.chosenForkId,
        lockedForkIds: receipt.lockedForkIds,
        lockedAtTurn: receipt.committedAtTurn,
        receiptId: receipt.receiptId,
      };

      // Rebuild facts
      for (const write of receipt.factWrites) {
        facts[write.factId] = {
          ...write,
          sourceReceiptId: receipt.receiptId,
          writtenAtTurn: receipt.committedAtTurn,
        };
      }

      // Rebuild scheduled consequences (placeholder - need crisis spec to fully rebuild)
      for (const consId of receipt.scheduledConsequenceIds) {
        if (!consequences[consId]) {
          consequences[consId] = {
            id: consId,
            sourceCrisisId: receipt.crisisId,
            sourceForkId: receipt.chosenForkId,
            committedAtTurn: receipt.committedAtTurn,
            dueAtTurn: receipt.committedAtTurn + 10, // Default delay (need spec for exact)
            status: 'pending',
            key: consId.split(':').pop() ?? '',
            delayTurns: 10,
            type: 'reward',
            payload: {
              narrativeBeat: '',
              journalHint: '',
            },
          };
        }
      }
    } else if (receipt.kind === 'consequence') {
      // Update consequence status
      if (consequences[receipt.consequenceId]) {
        consequences[receipt.consequenceId] = {
          ...consequences[receipt.consequenceId],
          status: 'delivered',
          deliveredAtTurn: receipt.committedAtTurn,
          deliveryReceiptId: receipt.receiptId,
        };
      }

      // Rebuild facts from consequence
      for (const write of receipt.factWrites) {
        facts[write.factId] = {
          ...write,
          sourceReceiptId: receipt.receiptId,
          writtenAtTurn: receipt.committedAtTurn,
        };
      }
    } else if (receipt.kind === 'convergence') {
      convergenceReceipts[receipt.convergenceId] = receipt;
    } else if (receipt.kind === 'ending') {
      endingReceipt = receipt;
    }
  }

  return {
    ...ledger,
    locks,
    facts,
    consequences,
    convergenceReceipts,
    endingReceipt,
  };
}

/**
 * WS5-008 — Check if crisis can spawn
 * 
 * Blocks resolved crises from respawning.
 */
export function canSpawnCrisis(ledger: PyoaBranchLedger, crisisId: CrisisId): boolean {
  // Terminal runs cannot spawn new crises
  if (ledger.endingReceipt) return false;

  // Crisis already resolved
  if (ledger.locks[crisisId]) return false;

  return true;
}

/**
 * WS5-009 — Filter locked forks
 * 
 * Returns legal fork IDs for a crisis (not locked).
 */
export function getLegalForkIds(ledger: PyoaBranchLedger, crisis: CrisisSpec): ForkId[] {
  const lock = ledger.locks[crisis.id];

  if (!lock) {
    // No lock yet — all forks legal (subject to prerequisites)
    return crisis.forks
      .filter((fork) => checkForkPrerequisites(fork, ledger.facts))
      .map((fork) => fork.id);
  }

  // Crisis already resolved — no legal forks
  return [];
}

/**
 * WS5-009 — Check if fork is locked
 */
export function isForkLocked(ledger: PyoaBranchLedger, forkId: ForkId): boolean {
  const crisisId = forkId.split(':').slice(0, 2).join(':') as CrisisId;
  const lock = ledger.locks[crisisId];

  if (!lock) return false;

  return lock.lockedForkIds.includes(forkId) || lock.chosenForkId === forkId;
}

/**
 * WS5-008 — Get filtered crisis deck (eligible for spawn)
 */
export function getEligibleCrises(
  ledger: PyoaBranchLedger,
  catalog: PyoaBibleCatalog,
  currentTurn: Turn,
): CrisisSpec[] {
  return catalog.crises.filter((crisis) => {
    // Already resolved
    if (!canSpawnCrisis(ledger, crisis.id)) return false;

    // Outside turn window
    if (currentTurn < crisis.window.earliest || currentTurn > crisis.window.latest) return false;

    // Prerequisites not met
    if (!checkForkPrerequisites({ requires: crisis.prerequisites } as ForkSpec, ledger.facts)) {
      return false;
    }

    return true;
  });
}

/**
 * WS5-002 — Get crisis receipt by idempotency key
 */
export function getCrisisReceipt(
  ledger: PyoaBranchLedger,
  crisisId: CrisisId,
): CrisisReceipt | undefined {
  const idempotencyKey = computeCrisisIdempotencyKey(ledger.runId, crisisId);
  return ledger.receipts.find(
    (r) => r.kind === 'crisis' && r.idempotencyKey === idempotencyKey,
  ) as CrisisReceipt | undefined;
}
