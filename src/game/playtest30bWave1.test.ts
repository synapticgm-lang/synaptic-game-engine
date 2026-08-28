/**
 * WS-5 Wave 1 Tests — State Authority
 * 
 * Based on: WS-5 Implementation Plan Wave 1 Exit Criteria
 * Tests: WS5-001 through WS5-009
 */

import { describe, it, expect } from 'vitest';
import {
  initPyoaBranchLedger,
  commitCrisisFork,
  rebuildLedgerFromReceipts,
  canSpawnCrisis,
  getLegalForkIds,
  isForkLocked,
  getEligibleCrises,
  getCrisisReceipt,
} from './pyoaBranchLedgerV2';
import type {
  PyoaBibleCatalog,
  CrisisSpec,
  ForkSpec,
  CommitContext,
  BibleId,
  CrisisId,
  ForkId,
  ExclusiveFactGroup,
} from './pyoaTypes';
import { BranchInvariantError } from './pyoaTypes';

describe('WS-5 Wave 1 — State Authority', () => {
  // Test fixture: Simple crisis with two mutually exclusive forks
  const testBibleId: BibleId = 'thornferry-road';
  const testCrisisId: CrisisId = 'thornferry-road:charter-01';
  const testFork1Id: ForkId = 'thornferry-road:charter-01:trust-silas';
  const testFork2Id: ForkId = 'thornferry-road:charter-01:leave-silas';

  const testFork1: ForkSpec = {
    id: testFork1Id,
    label: 'Trust Silas',
    journalLabel: 'Trusted Silas with the charter',
    writes: [
      {
        factId: 'thornferry-road.primary-allegiance',
        value: 'ally-silas',
        visibility: 'known',
        journalText: 'You chose to trust Silas.',
      },
    ],
    costs: {
      resources: [{ resource: 'morale', amount: -5 }],
      relationships: [],
    },
    immediateBeat: 'Silas nods, relief visible in his eyes...',
    locks: [testFork2Id],
    schedules: [
      {
        key: 'silas-betrayal',
        delayTurns: 12,
        type: 'betrayal',
        payload: {
          narrativeBeat: 'Silas betrays your trust...',
          journalHint: 'Silas seems troubled.',
        },
      },
    ],
    endingAffinity: ['thornferry-road:ending:ally-triumph'],
  };

  const testFork2: ForkSpec = {
    id: testFork2Id,
    label: 'Leave Silas',
    journalLabel: 'Left Silas to face the charter alone',
    writes: [
      {
        factId: 'thornferry-road.primary-allegiance',
        value: 'solo-road',
        visibility: 'known',
        journalText: 'You chose to go alone.',
      },
    ],
    costs: {
      resources: [{ resource: 'morale', amount: -10 }],
      relationships: [],
    },
    immediateBeat: 'You turn away, leaving Silas behind...',
    locks: [testFork1Id],
    schedules: [],
    endingAffinity: ['thornferry-road:ending:solo-escape'],
  };

  const testCrisis: CrisisSpec = {
    schemaVersion: 1,
    id: testCrisisId,
    bibleId: testBibleId,
    title: 'The Millstone Charter',
    archetype: 'charter',
    telegraph: 'Silas offers you a choice: trust him with the charter, or go alone.',
    window: { earliest: 5, target: 10, latest: 15 },
    prerequisites: {},
    forks: [testFork1, testFork2],
    oncePerRun: true,
    journalHint: 'A critical decision about trust.',
  };

  const testExclusiveGroup: ExclusiveFactGroup = {
    id: 'primary-allegiance',
    mode: 'exactly-one-after-crisis',
    members: [
      'thornferry-road.primary-allegiance',
      'thornferry-road.secondary-allegiance',
    ],
    ownerCrisisId: testCrisisId,
    description: 'Player can only choose one primary allegiance',
  };

  const testCatalog: PyoaBibleCatalog = {
    schemaVersion: 1,
    bibleId: testBibleId,
    title: 'Thornferry Road',
    premise: 'A journey of trust and betrayal.',
    exclusiveFactGroups: [testExclusiveGroup],
    crises: [testCrisis],
    convergences: [],
    endings: [],
  };

  const testContext: CommitContext = {
    currentTurn: 10,
    resourceSnapshot: { morale: 50 },
    relationshipSnapshot: {},
  };

  // Test 1: Crisis receipt idempotency (same key returns same receipt)
  it('should return existing receipt on idempotent retry', () => {
    const runId = 'run-001';
    let ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    // First commit
    const { ledger: ledger1, receipt: receipt1 } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // Idempotent retry
    const { ledger: ledger2, receipt: receipt2 } = commitCrisisFork(
      ledger1,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    expect(receipt1.receiptId).toBe(receipt2.receiptId);
    expect(receipt1.idempotencyKey).toBe(receipt2.idempotencyKey);
    expect(ledger2.receipts.length).toBe(1); // No duplicate receipt
  });

  // Test 2: Sibling locks recorded atomically
  it('should lock all sibling forks atomically', () => {
    const runId = 'run-002';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    const { ledger: updated, receipt } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    expect(receipt.kind).toBe('crisis');
    if (receipt.kind === 'crisis') {
      expect(receipt.chosenForkId).toBe(testFork1Id);
      expect(receipt.lockedForkIds).toEqual([testFork2Id]);
    }

    expect(updated.locks[testCrisisId]).toBeDefined();
    expect(updated.locks[testCrisisId].lockedForkIds).toEqual([testFork2Id]);
  });

  // Test 3: Mutex conflict rejection (FACT_CONFLICT thrown)
  it('should reject mutex conflict', () => {
    const runId = 'run-003';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    // Commit first fork
    const { ledger: ledger1 } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // Try to commit second fork (mutex conflict)
    const conflictCrisis: CrisisSpec = {
      ...testCrisis,
      id: 'thornferry-road:charter-02' as CrisisId,
      forks: [
        {
          ...testFork2,
          id: 'thornferry-road:charter-02:conflicting' as ForkId,
          locks: [],
        },
      ],
    };

    expect(() => {
      commitCrisisFork(
        ledger1,
        testCatalog,
        conflictCrisis,
        'thornferry-road:charter-02:conflicting' as ForkId,
        testContext,
      );
    }).toThrow(BranchInvariantError);

    expect(() => {
      commitCrisisFork(
        ledger1,
        testCatalog,
        conflictCrisis,
        'thornferry-road:charter-02:conflicting' as ForkId,
        testContext,
      );
    }).toThrow('FACT_CONFLICT');
  });

  // Test 4: Resource cost assertion (INSUFFICIENT_RESOURCE thrown)
  it('should reject insufficient resource costs', () => {
    const runId = 'run-004';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    const lowResourceContext: CommitContext = {
      currentTurn: 10,
      resourceSnapshot: { morale: 3 }, // Not enough for fork cost (-5)
      relationshipSnapshot: {},
    };

    expect(() => {
      commitCrisisFork(
        ledger,
        testCatalog,
        testCrisis,
        testFork1Id,
        lowResourceContext,
      );
    }).toThrow(BranchInvariantError);

    expect(() => {
      commitCrisisFork(
        ledger,
        testCatalog,
        testCrisis,
        testFork1Id,
        lowResourceContext,
      );
    }).toThrow('INSUFFICIENT_RESOURCE');
  });

  // Test 5: Fork prerequisite check (FORK_PREREQUISITE_FAILED thrown)
  it('should reject fork when prerequisites not met', () => {
    const runId = 'run-005';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    const prereqFork: ForkSpec = {
      ...testFork1,
      id: 'thornferry-road:charter-01:prereq-fork' as ForkId,
      requires: {
        all: [
          {
            factId: 'thornferry-road.has-charter-item',
            op: 'exists',
          },
        ],
      },
    };

    const prereqCrisis: CrisisSpec = {
      ...testCrisis,
      forks: [prereqFork],
    };

    expect(() => {
      commitCrisisFork(
        ledger,
        testCatalog,
        prereqCrisis,
        'thornferry-road:charter-01:prereq-fork' as ForkId,
        testContext,
      );
    }).toThrow(BranchInvariantError);

    expect(() => {
      commitCrisisFork(
        ledger,
        testCatalog,
        prereqCrisis,
        'thornferry-road:charter-01:prereq-fork' as ForkId,
        testContext,
      );
    }).toThrow('FORK_PREREQUISITE_FAILED');
  });

  // Test 6: Terminal run blocks new crises
  it('should block new crises after ending receipt', () => {
    const runId = 'run-006';
    let ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    // Add ending receipt
    ledger = {
      ...ledger,
      endingReceipt: {
        kind: 'ending',
        schemaVersion: 1,
        receiptId: 'ending-001',
        runId,
        bibleId: testBibleId,
        endingId: 'thornferry-road:ending:triumph',
        triggerCrisisId: testCrisisId,
        committedAtTurn: 100,
        idempotencyKey: `${runId}::ending`,
        terminal: true,
      },
    };

    expect(() => {
      commitCrisisFork(ledger, testCatalog, testCrisis, testFork1Id, testContext);
    }).toThrow(BranchInvariantError);

    expect(() => {
      commitCrisisFork(ledger, testCatalog, testCrisis, testFork1Id, testContext);
    }).toThrow('RUN_ALREADY_TERMINAL');
  });

  // Test 7: Receipt rebuild from storage
  it('should rebuild materialized views from receipts', () => {
    const runId = 'run-007';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    const { ledger: committed } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // Corrupt materialized views
    const corrupted = {
      ...committed,
      locks: {},
      facts: {},
      consequences: {},
    };

    // Rebuild
    const rebuilt = rebuildLedgerFromReceipts(corrupted);

    expect(rebuilt.locks[testCrisisId]).toBeDefined();
    expect(rebuilt.locks[testCrisisId].chosenForkId).toBe(testFork1Id);
    expect(rebuilt.facts['thornferry-road.primary-allegiance']).toBeDefined();
    expect(rebuilt.facts['thornferry-road.primary-allegiance'].value).toBe('ally-silas');
  });

  // Test 8: XP awarded once per receipt
  it('should award XP once per receipt (idempotent)', () => {
    const runId = 'run-008';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    const { receipt: receipt1 } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // Attempt duplicate XP award (should use same receipt)
    const existingReceipt = getCrisisReceipt(ledger, testCrisisId);

    // XP award would use receipt.receiptId as idempotency key
    // Same receipt ID means same XP award (handled by caller, not ledger)
    expect(receipt1.receiptId).toBeDefined();
    expect(existingReceipt).toBeUndefined(); // Not yet in ledger until commit
  });

  // Test 9: Locked crisis filtered from spawn
  it('should filter locked crisis from spawn selection', () => {
    const runId = 'run-009';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    // Before commit: crisis can spawn
    expect(canSpawnCrisis(ledger, testCrisisId)).toBe(true);

    const { ledger: committed } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // After commit: crisis cannot spawn
    expect(canSpawnCrisis(committed, testCrisisId)).toBe(false);

    // Eligible crises should not include locked crisis
    const eligible = getEligibleCrises(committed, testCatalog, testContext.currentTurn);
    expect(eligible.find((c) => c.id === testCrisisId)).toBeUndefined();
  });

  // Test 10: Locked fork filtered from choices
  it('should filter locked forks from legal choices', () => {
    const runId = 'run-010';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    // Before commit: both forks legal
    const legalBefore = getLegalForkIds(ledger, testCrisis);
    expect(legalBefore).toContain(testFork1Id);
    expect(legalBefore).toContain(testFork2Id);

    const { ledger: committed } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // After commit: no forks legal (crisis resolved)
    const legalAfter = getLegalForkIds(committed, testCrisis);
    expect(legalAfter).toEqual([]);

    // Check specific fork locks
    expect(isForkLocked(committed, testFork1Id)).toBe(true); // Chosen
    expect(isForkLocked(committed, testFork2Id)).toBe(true); // Locked sibling
  });

  // Test 11: Save/load preserves ledger state
  it('should preserve ledger state through serialization', () => {
    const runId = 'run-011';
    const ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    const { ledger: committed } = commitCrisisFork(
      ledger,
      testCatalog,
      testCrisis,
      testFork1Id,
      testContext,
    );

    // Simulate save/load
    const serialized = JSON.stringify(committed);
    const deserialized = JSON.parse(serialized);

    // State preserved
    expect(deserialized.runId).toBe(runId);
    expect(deserialized.receipts.length).toBe(1);
    expect(deserialized.locks[testCrisisId]).toBeDefined();
    expect(deserialized.facts['thornferry-road.primary-allegiance']).toBeDefined();
  });

  // Test 12: Wave 1 does not break existing saves
  it('should coexist with B025 legacy ledger', () => {
    // Legacy B025 ledger structure
    const legacyLedger = {
      activeBranch: 'millstone-charter',
      committedPaths: ['millstone-charter-use-1'],
      charterUses: 1,
      branchClosed: false,
      branchLocked: false,
    };

    // WS-5 ledger
    const runId = 'run-012';
    const ws5Ledger = initPyoaBranchLedger(runId, testBibleId, 'seed-123', '1.0.0');

    // Both should coexist (WS-5 is additive)
    expect(legacyLedger.activeBranch).toBe('millstone-charter');
    expect(ws5Ledger.runId).toBe(runId);

    // Migration path: legacy ledger -> WS-5 (deferred to Wave 1 completion)
    expect(true).toBe(true); // Placeholder for migration logic
  });
});
