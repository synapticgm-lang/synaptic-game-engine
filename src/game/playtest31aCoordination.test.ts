/**
 * Coordination Layer Tests
 * 
 * Tests for cross-package coordination (WS-2, WS-4, WS-5):
 * - Receipt ledger (append, query, idempotency)
 * - Exclusive facts registry (mutex validation)
 * - Package coordination (pre-GM sequence)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  appendReceipt,
  getReceipts,
  hasReceipt,
  clearAllReceipts,
  getStoreStats,
} from './receiptLedger';
import {
  assertExclusiveFacts,
  FactConflictError,
  getFactGroups,
} from './exclusiveFactsRegistry';
import { buildIdempotencyKey } from './types/crossPackageContracts';
import type {
  EncounterReceipt,
  CrisisReceipt,
  FactWrite,
} from '../types/crossPackageContracts';

describe('Receipt Ledger', () => {
  beforeEach(() => {
    clearAllReceipts();
  });

  describe('appendReceipt', () => {
    it('should append a receipt to the ledger', () => {
      const receipt: EncounterReceipt = {
        kind: 'encounter',
        receiptId: 'enc-001',
        runId: 'run-123',
        committedAtTurn: 10,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-001'),
        schemaVersion: 1,
        encounterId: 'enc-001',
        templateId: 'litrpg.hub-ambush.ashknife-cell',
        templateVersion: '1.0.0',
        terminal: 'victory',
        exclusiveFacts: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        xpGained: 50,
        loot: ['worn-dagger'],
      };

      const committed = appendReceipt(receipt, 'save-001');

      expect(committed).toEqual(receipt);
      expect(hasReceipt(receipt.idempotencyKey)).toBe(true);
    });

    it('should be idempotent (duplicate key returns existing)', () => {
      const receipt: EncounterReceipt = {
        kind: 'encounter',
        receiptId: 'enc-001',
        runId: 'run-123',
        committedAtTurn: 10,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-001'),
        schemaVersion: 1,
        encounterId: 'enc-001',
        templateId: 'litrpg.hub-ambush.ashknife-cell',
        templateVersion: '1.0.0',
        terminal: 'victory',
        exclusiveFacts: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        xpGained: 50,
        loot: ['worn-dagger'],
      };

      const first = appendReceipt(receipt, 'save-001');
      const second = appendReceipt(receipt, 'save-001');

      expect(first).toEqual(second);
      expect(getReceipts('save-001')).toHaveLength(1);
    });
  });

  describe('getReceipts', () => {
    it('should query receipts by package', () => {
      const ws4Receipt: EncounterReceipt = {
        kind: 'encounter',
        receiptId: 'enc-001',
        runId: 'run-123',
        committedAtTurn: 10,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-001'),
        schemaVersion: 1,
        encounterId: 'enc-001',
        templateId: 'litrpg.hub-ambush.ashknife-cell',
        templateVersion: '1.0.0',
        terminal: 'victory',
        exclusiveFacts: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        xpGained: 50,
        loot: [],
      };

      const ws5Receipt: CrisisReceipt = {
        kind: 'crisis',
        receiptId: 'crisis-001',
        runId: 'run-123',
        committedAtTurn: 15,
        idempotencyKey: buildIdempotencyKey('ws5', 'crisis', 'run-123', 'crisis-001'),
        schemaVersion: 1,
        bibleId: 'thornferry-road',
        crisisId: 'alliance-fork',
        chosenForkId: 'ally-with-faction-a',
        lockedForkIds: ['ally-with-faction-b', 'stay-independent'],
        factWrites: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        scheduledConsequenceIds: [],
        xpGained: 25,
      };

      appendReceipt(ws4Receipt, 'save-001');
      appendReceipt(ws5Receipt, 'save-001');

      const ws4Receipts = getReceipts('save-001', { package: 'ws4' });
      const ws5Receipts = getReceipts('save-001', { package: 'ws5' });

      expect(ws4Receipts).toHaveLength(1);
      expect(ws5Receipts).toHaveLength(1);
      expect(ws4Receipts[0].kind).toBe('encounter');
      expect(ws5Receipts[0].kind).toBe('crisis');
    });

    it('should query receipts by turn range', () => {
      const receipt1: EncounterReceipt = {
        kind: 'encounter',
        receiptId: 'enc-001',
        runId: 'run-123',
        committedAtTurn: 10,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-001'),
        schemaVersion: 1,
        encounterId: 'enc-001',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        terminal: 'victory',
        exclusiveFacts: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        xpGained: 50,
        loot: [],
      };

      const receipt2: EncounterReceipt = {
        ...receipt1,
        receiptId: 'enc-002',
        committedAtTurn: 20,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-002'),
        encounterId: 'enc-002',
      };

      const receipt3: EncounterReceipt = {
        ...receipt1,
        receiptId: 'enc-003',
        committedAtTurn: 30,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-003'),
        encounterId: 'enc-003',
      };

      appendReceipt(receipt1, 'save-001');
      appendReceipt(receipt2, 'save-001');
      appendReceipt(receipt3, 'save-001');

      const afterTurn15 = getReceipts('save-001', { afterTurn: 15 });
      const beforeTurn25 = getReceipts('save-001', { beforeTurn: 25 });

      expect(afterTurn15).toHaveLength(2); // T20, T30
      expect(beforeTurn25).toHaveLength(2); // T10, T20
    });

    it('should sort receipts by turn', () => {
      const receipt1: EncounterReceipt = {
        kind: 'encounter',
        receiptId: 'enc-001',
        runId: 'run-123',
        committedAtTurn: 30,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-001'),
        schemaVersion: 1,
        encounterId: 'enc-001',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        terminal: 'victory',
        exclusiveFacts: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        xpGained: 50,
        loot: [],
      };

      const receipt2: EncounterReceipt = {
        ...receipt1,
        receiptId: 'enc-002',
        committedAtTurn: 10,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-002'),
        encounterId: 'enc-002',
      };

      const receipt3: EncounterReceipt = {
        ...receipt1,
        receiptId: 'enc-003',
        committedAtTurn: 20,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-003'),
        encounterId: 'enc-003',
      };

      // Append in non-chronological order
      appendReceipt(receipt1, 'save-001');
      appendReceipt(receipt2, 'save-001');
      appendReceipt(receipt3, 'save-001');

      const receipts = getReceipts('save-001');

      expect(receipts).toHaveLength(3);
      expect(receipts[0].committedAtTurn).toBe(10);
      expect(receipts[1].committedAtTurn).toBe(20);
      expect(receipts[2].committedAtTurn).toBe(30);
    });
  });

  describe('store stats', () => {
    it('should track receipt counts by package', () => {
      const ws4Receipt: EncounterReceipt = {
        kind: 'encounter',
        receiptId: 'enc-001',
        runId: 'run-123',
        committedAtTurn: 10,
        idempotencyKey: buildIdempotencyKey('ws4', 'encounter', 'run-123', 'enc-001'),
        schemaVersion: 1,
        encounterId: 'enc-001',
        templateId: 'template-1',
        templateVersion: '1.0.0',
        terminal: 'victory',
        exclusiveFacts: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        xpGained: 50,
        loot: [],
      };

      const ws5Receipt: CrisisReceipt = {
        kind: 'crisis',
        receiptId: 'crisis-001',
        runId: 'run-123',
        committedAtTurn: 15,
        idempotencyKey: buildIdempotencyKey('ws5', 'crisis', 'run-123', 'crisis-001'),
        schemaVersion: 1,
        bibleId: 'thornferry-road',
        crisisId: 'alliance-fork',
        chosenForkId: 'ally-with-faction-a',
        lockedForkIds: [],
        factWrites: [],
        resourceDeltas: [],
        relationshipDeltas: [],
        scheduledConsequenceIds: [],
        xpGained: 25,
      };

      appendReceipt(ws4Receipt, 'save-001');
      appendReceipt(ws5Receipt, 'save-001');

      const stats = getStoreStats();

      expect(stats.totalReceipts).toBe(2);
      expect(stats.byPackage.ws4).toBe(1);
      expect(stats.byPackage.ws5).toBe(1);
    });
  });
});

describe('Exclusive Facts Registry', () => {
  describe('assertExclusiveFacts', () => {
    it('should allow non-conflicting facts', () => {
      const currentFacts: string[] = [];
      const proposedWrites: FactWrite[] = [
        {
          factId: 'encounter_victory',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws4',
        },
      ];

      expect(() => {
        assertExclusiveFacts(currentFacts, proposedWrites);
      }).not.toThrow();
    });

    it('should reject conflicting terminal outcomes', () => {
      const currentFacts = ['encounter_victory'];
      const proposedWrites: FactWrite[] = [
        {
          factId: 'encounter_defeat',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws4',
        },
      ];

      expect(() => {
        assertExclusiveFacts(currentFacts, proposedWrites);
      }).toThrow(FactConflictError);
    });

    it('should allow same fact to be written again (idempotent)', () => {
      const currentFacts = ['encounter_victory'];
      const proposedWrites: FactWrite[] = [
        {
          factId: 'encounter_victory',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws4',
        },
      ];

      expect(() => {
        assertExclusiveFacts(currentFacts, proposedWrites);
      }).not.toThrow();
    });

    it('should reject multiple facts in same group in one transaction', () => {
      const currentFacts: string[] = [];
      const proposedWrites: FactWrite[] = [
        {
          factId: 'encounter_victory',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws4',
        },
        {
          factId: 'encounter_defeat',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws4',
        },
      ];

      expect(() => {
        assertExclusiveFacts(currentFacts, proposedWrites);
      }).toThrow(FactConflictError);
    });

    it('should allow facts in different groups', () => {
      const currentFacts: string[] = [];
      const proposedWrites: FactWrite[] = [
        {
          factId: 'encounter_victory',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws4',
        },
        {
          factId: 'allegiance_faction_a',
          value: true,
          visibility: 'public',
          retention: 'permanent',
          source: 'ws5',
        },
      ];

      expect(() => {
        assertExclusiveFacts(currentFacts, proposedWrites);
      }).not.toThrow();
    });
  });

  describe('getFactGroups', () => {
    it('should return groups containing the fact', () => {
      const groups = getFactGroups('encounter_victory');

      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].members).toContain('encounter_victory');
    });

    it('should return empty array for non-exclusive fact', () => {
      const groups = getFactGroups('some-random-fact');

      expect(groups).toHaveLength(0);
    });
  });
});

describe('Package Coordination', () => {
  beforeEach(() => {
    clearAllReceipts();
  });

  it('should validate package integration', () => {
    // This test just ensures that the coordination module loads
    // without throwing errors during validation
    const { validatePackageIntegration } = require('../packageCoordination');
    
    expect(() => {
      validatePackageIntegration();
    }).not.toThrow();
  });
});
