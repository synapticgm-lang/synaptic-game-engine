/**
 * WS-5 Wave 2 — Delayed Consequences and Liveness
 * 
 * Based on: Manus WS-5 Complete Package
 * Tasks: WS5-010 through WS5-018
 */

import { nanoid } from 'nanoid';
import type {
  BibleId,
  ConsequenceId,
  ConsequenceReceipt,
  CommitContext,
  CommitResult,
  DelayedConsequence,
  FactId,
  FactRecord,
  PyoaBranchLedger,
  ReceiptId,
  RunId,
  Turn,
} from './pyoaTypes';
import { BranchInvariantError } from './pyoaTypes';

/**
 * WS5-011 — Deliver due consequences in deterministic order
 * 
 * Sorts by due turn, then consequence ID for stable ordering.
 * Applies payload atomically and records delivery receipt.
 */
export function deliverDueConsequences(
  ledger: PyoaBranchLedger,
  context: CommitContext,
): PyoaBranchLedger {
  // Terminal runs don't deliver consequences
  if (ledger.endingReceipt) return ledger;

  // Find pending consequences due by current turn
  const due = Object.values(ledger.consequences)
    .filter((c) => c.status === 'pending' && c.dueAtTurn <= context.currentTurn)
    .sort((a, b) => {
      // Sort by due turn, then ID for deterministic order
      if (a.dueAtTurn !== b.dueAtTurn) {
        return a.dueAtTurn - b.dueAtTurn;
      }
      return a.id.localeCompare(b.id);
    });

  let updated = ledger;

  for (const consequence of due) {
    try {
      const { ledger: next } = deliverConsequence(updated, consequence, context);
      updated = next;
    } catch (error) {
      // Log but don't fail entire batch
      console.warn(`Failed to deliver consequence ${consequence.id}:`, error);
    }
  }

  return updated;
}

/**
 * WS5-011 — Deliver single consequence
 * 
 * Idempotent: duplicate delivery returns existing receipt.
 */
function deliverConsequence(
  ledger: PyoaBranchLedger,
  consequence: DelayedConsequence,
  context: CommitContext,
): CommitResult {
  // Check idempotency
  const idempotencyKey = computeConsequenceIdempotencyKey(ledger.runId, consequence.id);
  const existing = ledger.receipts.find(
    (r) => r.kind === 'consequence' && r.idempotencyKey === idempotencyKey,
  ) as ConsequenceReceipt | undefined;

  if (existing) {
    // Already delivered
    return { ledger, receipt: existing };
  }

  // Check terminal
  if (ledger.endingReceipt) {
    throw new BranchInvariantError('RUN_ALREADY_TERMINAL', 'Cannot deliver consequence after ending');
  }

  // Apply payload
  const receiptId: ReceiptId = nanoid();
  const receipt: ConsequenceReceipt = {
    kind: 'consequence',
    schemaVersion: 1,
    receiptId,
    runId: ledger.runId,
    bibleId: ledger.bibleId,
    consequenceId: consequence.id,
    factWrites: consequence.payload.writes ?? [],
    resourceDeltas: consequence.payload.resourceDeltas ?? [],
    relationshipDeltas: consequence.payload.relationshipDeltas ?? [],
    committedAtTurn: context.currentTurn,
    idempotencyKey,
  };

  // Update materialized views
  const newFacts: Record<FactId, FactRecord> = { ...ledger.facts };
  for (const write of receipt.factWrites) {
    newFacts[write.factId] = {
      ...write,
      sourceReceiptId: receiptId,
      writtenAtTurn: context.currentTurn,
    };
  }

  const newConsequences = { ...ledger.consequences };
  newConsequences[consequence.id] = {
    ...consequence,
    status: 'delivered',
    deliveredAtTurn: context.currentTurn,
    deliveryReceiptId: receiptId,
  };

  // Return updated ledger
  const updatedLedger: PyoaBranchLedger = {
    ...ledger,
    receipts: [...ledger.receipts, receipt],
    facts: newFacts,
    consequences: newConsequences,
  };

  return { ledger: updatedLedger, receipt };
}

/**
 * WS5-011 — Compute idempotency key for consequence
 */
function computeConsequenceIdempotencyKey(runId: RunId, consequenceId: ConsequenceId): string {
  return `${runId}::${consequenceId}`;
}

/**
 * WS5-011 — Get overdue consequences (past due but not delivered)
 * 
 * Used for P0 metrics and forced delivery.
 */
export function getOverdueConsequences(
  ledger: PyoaBranchLedger,
  currentTurn: Turn,
): DelayedConsequence[] {
  return Object.values(ledger.consequences).filter(
    (c) => c.status === 'pending' && c.dueAtTurn < currentTurn - 1, // 1 turn grace
  );
}

/**
 * WS5-011 — Check if consequence is deliverable
 */
export function isConsequenceDeliverable(
  ledger: PyoaBranchLedger,
  consequenceId: ConsequenceId,
  currentTurn: Turn,
): boolean {
  const consequence = ledger.consequences[consequenceId];

  if (!consequence) return false;
  if (consequence.status !== 'pending') return false;
  if (consequence.dueAtTurn > currentTurn) return false;
  if (ledger.endingReceipt) return false;

  return true;
}

/**
 * WS5-011 — Cancel consequence (e.g., if source crisis path invalidated)
 */
export function cancelConsequence(
  ledger: PyoaBranchLedger,
  consequenceId: ConsequenceId,
): PyoaBranchLedger {
  const consequence = ledger.consequences[consequenceId];

  if (!consequence) return ledger;
  if (consequence.status !== 'pending') return ledger;

  const newConsequences = { ...ledger.consequences };
  newConsequences[consequenceId] = {
    ...consequence,
    status: 'cancelled',
  };

  return {
    ...ledger,
    consequences: newConsequences,
  };
}

/**
 * WS5-012 — Get all pending consequences due by turn window
 */
export function getPendingConsequencesByWindow(
  ledger: PyoaBranchLedger,
  windowStart: Turn,
  windowEnd: Turn,
): DelayedConsequence[] {
  return Object.values(ledger.consequences).filter(
    (c) =>
      c.status === 'pending' &&
      c.dueAtTurn >= windowStart &&
      c.dueAtTurn <= windowEnd,
  );
}

/**
 * WS5-012 — Format consequence timing band for Journal
 */
export function getConsequenceTimingBand(
  consequence: DelayedConsequence,
  currentTurn: Turn,
): 'soon' | 'later' | 'much later' {
  const remaining = consequence.dueAtTurn - currentTurn;

  if (remaining < 15) return 'soon';
  if (remaining < 50) return 'later';
  return 'much later';
}
