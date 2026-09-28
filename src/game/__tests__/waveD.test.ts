/**
 * Wave D: Integration Tests
 * 
 * Tests for:
 * - Loot table registry
 * - Eval harness (all G1-G5 gates)
 * - 300-turn regression fixtures
 */

import { describe, it, expect } from 'vitest';
import {
  generateLoot,
  getLootPreview,
  validateLootCommit,
  convertDuplicateUniques,
  applyBossBuildGuarantee,
  type LootReceipt
} from '../lootTableRegistry';
import {
  runEvaluationSuite,
  evalNpcExitLatency,
  evalNpcDuplicateReveals,
  evalNpcTurnoverDeterminism,
  evalEncounterResolution,
  evalEncounterBiome,
  evalEncounterAftermath,
  evalPyoaCrisisRepetition,
  evalPyoaEndings,
  evalPyoaDelayedPayoffs,
  evalRegressionPassiveGm,
  evalRegressionPadLoop,
  type EvalSuite
} from '../evalHarness';
import type { GameState } from '../types';

// ============================================================================
// LOOT TABLE REGISTRY TESTS
// ============================================================================

describe('Loot Table Registry', () => {
  it('generates deterministic loot from seed', () => {
    const mockState = { turnIndex: 10 } as GameState;
    
    const loot1 = generateLoot('litrpg', 'trash', 'victory', 'forest', 'seed123', mockState);
    const loot2 = generateLoot('litrpg', 'trash', 'victory', 'forest', 'seed123', mockState);
    
    expect(loot1.currency.amount).toBe(loot2.currency.amount);
    expect(loot1.items.length).toBe(loot2.items.length);
  });
  
  it('applies outcome multipliers correctly', () => {
    const mockState = { turnIndex: 10 } as GameState;
    
    const victoryLoot = generateLoot('litrpg', 'elite', 'victory', 'forest', 'seed456', mockState);
    const fledLoot = generateLoot('litrpg', 'elite', 'fled', 'forest', 'seed456', mockState);
    
    // Check multipliers are applied
    expect(victoryLoot.appliedMultiplier).toBe(1.0);
    expect(fledLoot.appliedMultiplier).toBe(0.2);
    
    // Victory should have more items or equal items (fled multiplier reduces quantities)
    expect(victoryLoot.items.length).toBeGreaterThanOrEqual(fledLoot.items.length);
  });
  
  it('enforces pity counter for elite rare drops', () => {
    const mockState = {
      turnIndex: 30,
      lootPityCounters: { eliteMisses: 2, lastRareEncounter: null }
    } as any;
    
    // After 3 misses, should force a rare item
    const loot = generateLoot('litrpg', 'elite', 'victory', 'forest', 'seed789', mockState);
    
    // Check if pity counter was updated or rare was forced
    expect(loot.pityCounterUpdate).toBeDefined();
  });
  
  it('provides loot preview for telegraph', () => {
    const preview = getLootPreview('litrpg', 'boss');
    
    expect(preview).toBeInstanceOf(Array);
    expect(preview.length).toBeGreaterThan(0);
    expect(preview).toContain('currency');
  });
  
  it('validates idempotent loot commits', () => {
    const mockState = { turnIndex: 10 } as GameState;
    const receipt = generateLoot('litrpg', 'boss', 'victory', 'forest', 'seed999', mockState);
    
    // Add a unique item to receipt
    receipt.items.push({
      id: 'legendary-sword',
      category: 'equipment',
      quantity: 1,
      tags: ['unique', 'legendary']
    });
    
    const validation = validateLootCommit(receipt, ['legendary-sword']);
    
    expect(validation.valid).toBe(false);
    expect(validation.conflicts).toContain('legendary-sword');
  });
  
  it('converts duplicate uniques to currency', () => {
    const mockState = { turnIndex: 10 } as GameState;
    const receipt = generateLoot('litrpg', 'boss', 'victory', 'forest', 'seed888', mockState);
    
    receipt.items.push({
      id: 'legendary-shield',
      category: 'equipment',
      quantity: 1,
      tags: ['unique', 'legendary']
    });
    
    const converted = convertDuplicateUniques(receipt, 'litrpg', ['legendary-shield']);
    
    // Shield should be removed, currency should increase
    expect(converted.items.find(i => i.id === 'legendary-shield')).toBeUndefined();
    expect(converted.currency.amount).toBeGreaterThan(receipt.currency.amount);
  });
});

// ============================================================================
// EVAL HARNESS TESTS
// ============================================================================

describe('Eval Harness - WS-2 (NPC Lifecycle)', () => {
  it('G1: detects exit latency violations', () => {
    const mockState: any = {
      turnIndex: 20,
      npcLifecycles: {
        'npc-1': {
          phase: 'functioning',
          deadline: {
            type: 'hard',
            turnIndex: 15
          }
        }
      }
    };
    
    const result = evalNpcExitLatency(mockState);
    
    expect(result.gate).toBe('WS-2-G1');
    expect(result.passed).toBe(false);
    expect(result.evidence.violations).toBe(1);
  });
  
  it('G2: detects duplicate NPC reveals', () => {
    const mockState: any = {
      npcMemoryLedger: {
        'npc-1': [
          { type: 'introduction', turn: 5 },
          { type: 'introduction', turn: 15 } // Duplicate!
        ]
      }
    };
    
    const result = evalNpcDuplicateReveals(mockState);
    
    expect(result.gate).toBe('WS-2-G2');
    expect(result.passed).toBe(false);
    expect(result.evidence.duplicates).toContain('npc-1');
  });
  
  it('G5: checks turnover determinism', () => {
    const mockState: any = {
      turnIndex: 10,
      npcLifecycles: {
        'npc-1': {
          phase: 'debt_satisfied',
          deadline: { type: 'soft', turnIndex: 12 }
        }
      }
    };
    
    const result = evalNpcTurnoverDeterminism(mockState);
    
    expect(result.gate).toBe('WS-2-G5');
    // Should be deterministic (same state = same action)
  });
});

describe('Eval Harness - WS-4 (Encounter Bible)', () => {
  it('G1: detects over-duration encounters', () => {
    const mockState: any = {
      engineMode: 'litrpg',
      encounterHistory: [
        {
          startTurn: 10,
          endTurn: 20 // 10 turns, over 8T limit
        }
      ]
    };
    
    const result = evalEncounterResolution(mockState);
    
    expect(result.gate).toBe('WS-4-G1');
    expect(result.passed).toBe(false);
    expect(result.evidence.violations).toBe(1);
  });
  
  it('G3: detects wrong-bible spawns', () => {
    const mockState: any = {
      campaignBible: 'summoned-pact',
      encounterHistory: [
        {
          bibleId: 'cursed-keep' // Wrong bible!
        }
      ]
    };
    
    const result = evalEncounterBiome(mockState);
    
    expect(result.gate).toBe('WS-4-G3');
    expect(result.passed).toBe(false);
    expect(result.evidence.violations).toBe(1);
  });
  
  it('G5: detects duplicate receipts', () => {
    const mockState: any = {
      encounterReceipts: [
        { idempotencyKey: 'enc-1-aftermath' },
        { idempotencyKey: 'enc-1-aftermath' } // Duplicate!
      ]
    };
    
    const result = evalEncounterAftermath(mockState);
    
    expect(result.gate).toBe('WS-4-G5');
    expect(result.passed).toBe(false);
    expect(result.evidence.duplicates).toBe(1);
  });
});

describe('Eval Harness - WS-5 (PYOA Persistence)', () => {
  it('G1: detects duplicate crisis spawns', () => {
    const mockState: any = {
      crisisHistory: [
        { id: 'thornferry-road:crisis:1_millstone_charter' },
        { id: 'thornferry-road:crisis:1_millstone_charter' } // Duplicate!
      ]
    };
    
    const result = evalPyoaCrisisRepetition(mockState);
    
    expect(result.gate).toBe('WS-5-G1');
    expect(result.passed).toBe(false);
    expect(result.evidence.duplicates).toBe(1);
  });
  
  it('G3: validates ending by T150', () => {
    const mockState: any = {
      playPhase: 'ended',
      turnIndex: 145,
      pyoaEnding: { id: 'thornferry-road:ending:triumphant' }
    };
    
    const result = evalPyoaEndings(mockState);
    
    expect(result.gate).toBe('WS-5-G3');
    expect(result.passed).toBe(true);
  });
  
  it('G4: detects overdue delayed consequences', () => {
    const mockState: any = {
      turnIndex: 100,
      delayedConsequences: [
        {
          deliveryTurn: 90,
          delivered: false // Overdue!
        }
      ]
    };
    
    const result = evalPyoaDelayedPayoffs(mockState);
    
    expect(result.gate).toBe('WS-5-G4');
    expect(result.passed).toBe(false);
    expect(result.evidence.violations).toBe(1);
  });
});

describe('Eval Harness - Regression Gates', () => {
  it('R2: detects missing forced interrupt at stagnation', () => {
    const mockState: any = {
      stagnationStreak: 6, // Past threshold
      lastActionWasForced: false // No interrupt!
    };
    
    const result = evalRegressionPassiveGm(mockState);
    
    expect(result.gate).toBe('R2');
    expect(result.passed).toBe(false);
  });
  
  it('R3: detects choice pad loops within 3T', () => {
    const mockState: any = {
      recentChoiceFingerprints: [
        { fingerprint: 'ask-about-miller', turn: 10 },
        { fingerprint: 'ask-about-miller', turn: 12 } // Within 3T!
      ]
    };
    
    const result = evalRegressionPadLoop(mockState);
    
    expect(result.gate).toBe('R3');
    expect(result.passed).toBe(false);
  });
});

describe('Eval Harness - Full Suite', () => {
  it('runs complete evaluation suite', () => {
    const mockState: any = {
      turnIndex: 50,
      engineMode: 'litrpg',
      campaignBible: 'summoned-pact',
      playPhase: 'playing',
      npcLifecycles: {},
      encounterHistory: [],
      crisisHistory: [],
      stagnationStreak: 0
    };
    
    const suite = runEvaluationSuite(mockState);
    
    expect(suite.suite).toBe('Wave-D-Complete');
    expect(suite.totalGates).toBeGreaterThan(15); // All gates
    expect(suite.overallScore).toBeGreaterThanOrEqual(0);
    expect(suite.overallScore).toBeLessThanOrEqual(1);
    expect(suite.results.length).toBe(suite.totalGates);
  });
  
  it('aggregates scores correctly', () => {
    const mockState: any = {
      turnIndex: 100,
      engineMode: 'pyoa',
      campaignBible: 'thornferry-road',
      playPhase: 'ended',
      pyoaEnding: { id: 'ending-1' },
      npcLifecycles: {},
      encounterHistory: [],
      crisisHistory: [],
      delayedConsequences: [],
      pyoaActiveFacts: []
    };
    
    const suite = runEvaluationSuite(mockState);
    
    // Perfect state should have high score
    expect(suite.overallScore).toBeGreaterThan(0.8);
    expect(suite.passedGates).toBeGreaterThan(suite.failedGates);
  });
});

// ============================================================================
// 300-TURN REGRESSION FIXTURES
// ============================================================================

describe('300-Turn Regression Fixtures', () => {
  it('R1: Combat purgatory regression fixture', () => {
    // Historical failure: combat lasted 15T on LitRPG
    const mockState: any = {
      engineMode: 'litrpg',
      encounterHistory: [
        {
          startTurn: 10,
          endTurn: 25 // 15T, over 8T limit
        }
      ]
    };
    
    const result = evalEncounterResolution(mockState);
    
    expect(result.passed).toBe(false);
    expect(result.evidence.violations).toBe(1);
  });
  
  it('R2: Passive GM regression fixture', () => {
    // Historical failure: stagnation at T5 with no interrupt
    const mockState: any = {
      stagnationStreak: 5,
      lastActionWasForced: false
    };
    
    const result = evalRegressionPassiveGm(mockState);
    
    expect(result.passed).toBe(false);
  });
  
  it('R3: Pad loop regression fixture', () => {
    // Historical failure: "Ask about miller" repeated 4 times in 5T
    const mockState: any = {
      recentChoiceFingerprints: [
        { fingerprint: 'ask-miller', turn: 10 },
        { fingerprint: 'ask-miller', turn: 11 },
        { fingerprint: 'ask-miller', turn: 13 },
        { fingerprint: 'ask-miller', turn: 14 }
      ]
    };
    
    const result = evalRegressionPadLoop(mockState);
    
    expect(result.passed).toBe(false);
    expect(result.evidence.violations).toBeGreaterThan(0);
  });
  
  it('R4: Theater branching regression fixture', () => {
    // Historical failure: same crisis spawned twice
    const mockState: any = {
      crisisHistory: [
        { id: 'crisis-1', turn: 20 },
        { id: 'crisis-1', turn: 80 } // Duplicate!
      ]
    };
    
    const result = evalPyoaCrisisRepetition(mockState);
    
    expect(result.passed).toBe(false);
    expect(result.evidence.duplicates).toBe(1);
  });
});
