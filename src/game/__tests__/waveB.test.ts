/**
 * Wave B Tests: Turnover, Resolution, Delayed Consequences
 * 
 * Tests for:
 * - WS-2 Wave B: Turnover engine, revival, knowledge sync
 * - WS-4 Wave B: Resolution mechanics, aftermath receipts
 * - WS-5 Wave B: Delayed consequences, ending gates
 */

import { describe, it, expect } from 'vitest';

// WS-2 Wave B
import { 
  decideTurnover, 
  selectFallback, 
  spawnSuccessor,
  createTurnoverReceipt,
  type TurnoverDecision
} from '../npcTurnover';

import {
  reviveTopicVersion,
  isTopicOnCooldown,
  getTopicVersion
} from '../npcTopicFsm';

// WS-4 Wave B
import {
  createSeededRng,
  nextRandom,
  rollD20,
  rollDamage,
  captureHpSnapshot,
  validateHpChanges,
  shouldForceTerminal,
  forceTerminalResolution,
  initFleeProgress,
  attemptFlee,
  initParley,
  attemptParley,
  resolveD20Check,
  evaluateRacingClocks,
  advanceRacingClocks
} from '../encounterResolutionMechanics';

import {
  generateEncounterReceipt,
  createIdempotencyKey,
  hasReceiptBeenApplied,
  markReceiptApplied,
  applyEncounterReceipt,
  reconcileReceiptAgainstLedgers
} from '../encounterAftermath';

// WS-5 Wave B
import {
  deliverEnhancedConsequence,
  enforceT150Deadline,
  checkEndingEligibility,
  getEligibleEndings,
  buildFogOfWarEntry
} from '../pyoaDelayedConsequences';

import type { GameState } from '../types';
import type { NpcLifecycle } from '../npcLifecycleFsm';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn: 10,
    hp: 100,
    maxHp: 100,
    engineMode: 'litrpg',
    currentLocation: 'test_location',
    inventory: {
      items: [],
      equipped: {}
    },
    quests: [],
    arcDirector: {
      npcLifecycles: [],
      npcMemories: [],
      pyoaDelayedConsequences: [],
      appliedReceipts: [],
      topicCooldownLedger: {},
      npcTopics: {}
    },
    ...overrides
  } as GameState;
}

function createMockLifecycle(overrides: Partial<NpcLifecycle> = {}): NpcLifecycle {
  return {
    npcId: 'test_npc',
    role: 'guide',
    state: 'functioning',
    enteredAt: 1,
    lastUpdateTurn: 10,
    debtSatisfied: false,
    deadline: 20,
    currentLocation: 'test_location',
    ...overrides
  };
}

// ============================================================================
// WS-2 Wave B: Turnover Engine Tests
// ============================================================================

describe('WS-2 Wave B: Turnover Engine', () => {
  describe('decideTurnover', () => {
    it('should decide exit on completion', () => {
      const gs = createMockGameState();
      const lifecycle = createMockLifecycle({
        state: 'debt_satisfied',
        debtSatisfied: true
      });
      
      const decision = decideTurnover(gs, lifecycle, 'completion');
      
      expect(decision.action).toBe('exit');
      expect(decision.trigger).toBe('completion');
      expect(decision.reason).toContain('obligation satisfied');
    });
    
    it('should delegate on deadline', () => {
      const gs = createMockGameState({ turn: 20 });
      const lifecycle = createMockLifecycle({
        deadline: 20
      });
      
      const decision = decideTurnover(gs, lifecycle, 'deadline');
      
      expect(decision.action).toBe('delegate');
      expect(decision.trigger).toBe('deadline');
      expect(decision.successorRole).toBe('guide');
    });
    
    it('should remain when no trigger applies', () => {
      const gs = createMockGameState();
      const lifecycle = createMockLifecycle();
      
      const decision = decideTurnover(gs, lifecycle, 'completion');
      
      expect(decision.action).toBe('remain');
    });
  });
  
  describe('selectFallback', () => {
    it('should select successor on deadline', () => {
      const gs = createMockGameState();
      const lifecycle = createMockLifecycle();
      
      const fallback = selectFallback(gs, lifecycle, 'deadline');
      
      expect(fallback.type).toBe('successor');
      expect(fallback.actorId).toBeDefined();
      expect(fallback.successorRole).toBe('guide');
    });
    
    it('should select none on completion', () => {
      const gs = createMockGameState();
      const lifecycle = createMockLifecycle();
      
      const fallback = selectFallback(gs, lifecycle, 'completion');
      
      expect(fallback.type).toBe('none');
    });
  });
  
  describe('spawnSuccessor', () => {
    it('should spawn successor with inherited debt', () => {
      const gs = createMockGameState();
      const lifecycle = createMockLifecycle({
        debtSatisfied: false
      });
      const decision: TurnoverDecision = {
        npcId: 'test_npc',
        action: 'delegate',
        trigger: 'deadline',
        reason: 'Test',
        successorRole: 'guide'
      };
      
      const successor = spawnSuccessor(gs, decision, lifecycle);
      
      expect(successor.actorId).toContain('test_npc_successor');
      expect(successor.role).toBe('guide');
      expect(successor.inheritedDebt).toContain('Inherited from test_npc');
    });
  });
  
  describe('createTurnoverReceipt', () => {
    it('should create valid turnover receipt', () => {
      const lifecycle = createMockLifecycle();
      const decision: TurnoverDecision = {
        npcId: 'test_npc',
        action: 'exit',
        trigger: 'completion',
        reason: 'Test'
      };
      
      const receipt = createTurnoverReceipt(decision, lifecycle);
      
      expect(receipt.kind).toBe('npc_turnover');
      expect(receipt.schemaVersion).toBe(1);
      expect(receipt.npcId).toBe('test_npc');
      expect(receipt.action).toBe('exit');
      expect(receipt.fromState).toBe('functioning');
      expect(receipt.toState).toBe('absent');
    });
  });
});

describe('WS-2 Wave B: Topic Revival', () => {
  describe('reviveTopicVersion', () => {
    it('should revive exhausted topic with new version', () => {
      const gs = createMockGameState({
        arcDirector: {
          npcTopics: {
            'test-npc': ['ask:betrayal']
          },
          topicCooldownLedger: {}
        }
      });
      
      const nextGs = reviveTopicVersion(gs, 'Test NPC', 'ask:betrayal', 'evidence', 10);
      
      const ledger = nextGs.arcDirector?.topicCooldownLedger ?? {};
      const versions = ledger['test-npc'] ?? [];
      
      expect(versions.length).toBe(1);
      expect(versions[0].topic).toBe('ask:betrayal');
      expect(versions[0].version).toBe(1);
      expect(versions[0].revivalReason).toBe('evidence');
    });
    
    it('should set cooldown based on reason', () => {
      const gs = createMockGameState();
      
      const nextGs = reviveTopicVersion(gs, 'Test NPC', 'ask:test', 'evidence', 10);
      
      const ledger = nextGs.arcDirector?.topicCooldownLedger ?? {};
      const versions = ledger['test-npc'] ?? [];
      
      expect(versions[0].cooldownUntil).toBe(18); // 10 + 8
    });
  });
  
  describe('isTopicOnCooldown', () => {
    it('should detect cooldown', () => {
      const ledger = {
        'test-npc': [{
          topic: 'ask:test',
          version: 1,
          exhaustedAt: 10,
          cooldownUntil: 20
        }]
      };
      
      const onCooldown = isTopicOnCooldown('Test NPC', 'ask:test', 15, ledger);
      
      expect(onCooldown).toBe(true);
    });
    
    it('should return false when cooldown expired', () => {
      const ledger = {
        'test-npc': [{
          topic: 'ask:test',
          version: 1,
          exhaustedAt: 10,
          cooldownUntil: 20
        }]
      };
      
      const onCooldown = isTopicOnCooldown('Test NPC', 'ask:test', 21, ledger);
      
      expect(onCooldown).toBe(false);
    });
  });
});

// ============================================================================
// WS-4 Wave B: Resolution Mechanics Tests
// ============================================================================

describe('WS-4 Wave B: Seeded RNG', () => {
  it('should generate deterministic random values', () => {
    const rng1 = createSeededRng('test_seed');
    const { value: v1, rng: rng2 } = nextRandom(rng1);
    const { value: v2 } = nextRandom(rng2);
    
    // Same seed should produce same sequence
    const rng3 = createSeededRng('test_seed');
    const { value: v3, rng: rng4 } = nextRandom(rng3);
    const { value: v4 } = nextRandom(rng4);
    
    expect(v1).toBe(v3);
    expect(v2).toBe(v4);
  });
  
  it('should roll d20 in range 1-20', () => {
    const rng = createSeededRng('test');
    const rolls: number[] = [];
    
    let currentRng = rng;
    for (let i = 0; i < 100; i++) {
      const { result, rng: nextRng } = rollD20(currentRng);
      rolls.push(result);
      currentRng = nextRng;
    }
    
    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...rolls)).toBeLessThanOrEqual(20);
  });
  
  it('should roll damage with crits', () => {
    const rng = createSeededRng('test');
    const { damage, critical, rng: nextRng } = rollDamage(20, 0.5, rng);
    
    expect(damage).toBeGreaterThan(0);
    expect(typeof critical).toBe('boolean');
  });
});

describe('WS-4 Wave B: HP Ledger', () => {
  it('should capture HP snapshots', () => {
    const gs = createMockGameState({
      hp: 80,
      maxHp: 100,
      activeEncounter: {
        enemies: [
          { id: 'enemy1', hp: 50, maxHp: 50 }
        ]
      }
    });
    
    const snapshots = captureHpSnapshot(['player', 'enemy1'], gs);
    
    expect(snapshots.length).toBe(2);
    expect(snapshots[0].entity).toBe('player');
    expect(snapshots[0].hp).toBe(80);
    expect(snapshots[1].entity).toBe('enemy1');
    expect(snapshots[1].hp).toBe(50);
  });
  
  it('should validate HP changes', () => {
    const before = [
      { entity: 'player', hp: 100, maxHp: 100, timestamp: 0 }
    ];
    const after = [
      { entity: 'player', hp: 80, maxHp: 100, timestamp: 1 }
    ];
    
    const { valid, errors } = validateHpChanges(before, after);
    
    expect(valid).toBe(true);
    expect(errors.length).toBe(0);
  });
  
  it('should detect HP exceeding max', () => {
    const before = [
      { entity: 'player', hp: 100, maxHp: 100, timestamp: 0 }
    ];
    const after = [
      { entity: 'player', hp: 150, maxHp: 100, timestamp: 1 }
    ];
    
    const { valid, errors } = validateHpChanges(before, after);
    
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('exceeds max');
  });
});

describe('WS-4 Wave B: Forced Terminal', () => {
  it('should force terminal after max turns (LitRPG)', () => {
    const should = shouldForceTerminal(8, 10, 'litrpg');
    
    expect(should).toBe(true);
  });
  
  it('should not force terminal before max turns', () => {
    const should = shouldForceTerminal(5, 10, 'litrpg');
    
    expect(should).toBe(false);
  });
  
  it('should determine outcome based on HP ratios', () => {
    const snapshots = [
      { entity: 'player', hp: 80, maxHp: 100, timestamp: 0 },
      { entity: 'enemy1', hp: 20, maxHp: 50, timestamp: 0 }
    ];
    
    const resolution = forceTerminalResolution(snapshots, 8);
    
    expect(resolution.terminal).toBeDefined();
    expect(['victory', 'defeat', 'forced_timeout']).toContain(resolution.terminal);
  });
});

describe('WS-4 Wave B: Flee Mechanics', () => {
  it('should initialize flee progress', () => {
    const progress = initFleeProgress(3);
    
    expect(progress.maxAttempts).toBe(3);
    expect(progress.attemptsUsed).toBe(0);
    expect(progress.progressClock).toBe(0);
    expect(progress.dangerClock).toBe(0);
  });
  
  it('should advance clocks on flee attempt', () => {
    const progress = initFleeProgress();
    const rng = createSeededRng('test');
    
    const { progress: newProgress, rng: nextRng, terminal } = attemptFlee(progress, 10, rng);
    
    expect(newProgress.attemptsUsed).toBe(1);
    expect(newProgress.attempts.length).toBe(1);
    expect(newProgress.progressClock).toBeGreaterThan(0);
  });
  
  it('should catch player after max attempts', () => {
    const progress = initFleeProgress(2);
    const rng = createSeededRng('test');
    
    let currentRng = rng;
    let currentProgress = progress;
    
    // Use up all attempts
    for (let i = 0; i < 2; i++) {
      const result = attemptFlee(currentProgress, 15, currentRng);
      currentProgress = result.progress;
      currentRng = result.rng;
    }
    
    // One more attempt should fail
    const { terminal } = attemptFlee(currentProgress, 15, currentRng);
    
    expect(terminal).toBe('caught');
  });
});

describe('WS-4 Wave B: Parley Mechanics', () => {
  it('should initialize parley with thresholds', () => {
    const parley = initParley(50);
    
    expect(parley.thresholds.length).toBe(1);
    expect(parley.thresholds[0].requirementType).toBe('leverage');
    expect(parley.thresholds[0].value).toBe(50);
  });
  
  it('should resolve parley with sufficient leverage', () => {
    const parley = initParley(50);
    
    const { parley: newParley, terminal } = attemptParley(parley, 50);
    
    expect(terminal).toBe('parleyResolved');
    expect(newParley.success).toBe(true);
  });
  
  it('should fail parley with insufficient leverage', () => {
    const parley = initParley(50);
    
    const { parley: newParley, terminal } = attemptParley(parley, 20);
    
    expect(terminal).toBeUndefined();
    expect(newParley.success).toBe(false);
  });
});

describe('WS-4 Wave B: D20 Resolver', () => {
  it('should resolve d20 check without advantage', () => {
    const rng = createSeededRng('test');
    
    const { roll } = resolveD20Check(15, 2, false, false, rng);
    
    expect(roll.base).toBeGreaterThanOrEqual(1);
    expect(roll.base).toBeLessThanOrEqual(20);
    expect(roll.total).toBe(roll.base + 2);
    expect(roll.dc).toBe(15);
    expect(roll.roll2).toBeUndefined();
  });
  
  it('should resolve d20 check with advantage', () => {
    const rng = createSeededRng('test');
    
    const { roll } = resolveD20Check(15, 2, true, false, rng);
    
    expect(roll.advantage).toBe(true);
    expect(roll.roll2).toBeDefined();
    expect(roll.base).toBe(Math.max(roll.roll1, roll.roll2!));
  });
  
  it('should resolve d20 check with disadvantage', () => {
    const rng = createSeededRng('test');
    
    const { roll } = resolveD20Check(15, 2, false, true, rng);
    
    expect(roll.disadvantage).toBe(true);
    expect(roll.roll2).toBeDefined();
    expect(roll.base).toBe(Math.min(roll.roll1, roll.roll2!));
  });
});

describe('WS-4 Wave B: Racing Clocks', () => {
  it('should detect success when progress fills first', () => {
    const progress = { current: 10, max: 10, label: 'Escape' };
    const danger = { current: 5, max: 10, label: 'Pursuit' };
    
    const outcome = evaluateRacingClocks(progress, danger);
    
    expect(outcome).toBe('success');
  });
  
  it('should detect failure when danger fills first', () => {
    const progress = { current: 5, max: 10, label: 'Escape' };
    const danger = { current: 10, max: 10, label: 'Pursuit' };
    
    const outcome = evaluateRacingClocks(progress, danger);
    
    expect(outcome).toBe('failure');
  });
  
  it('should detect success_with_cost when both fill', () => {
    const progress = { current: 10, max: 10, label: 'Escape' };
    const danger = { current: 10, max: 10, label: 'Pursuit' };
    
    const outcome = evaluateRacingClocks(progress, danger);
    
    expect(outcome).toBe('success_with_cost');
  });
  
  it('should advance both clocks', () => {
    const progress = { current: 3, max: 10, label: 'Escape' };
    const danger = { current: 2, max: 10, label: 'Pursuit' };
    
    const result = advanceRacingClocks(progress, danger, 2, 1);
    
    expect(result.progress.current).toBe(5);
    expect(result.danger.current).toBe(3);
    expect(result.outcome).toBe('ongoing');
  });
});

// ============================================================================
// WS-4 Wave B: Aftermath Tests
// ============================================================================

describe('WS-4 Wave B: Encounter Aftermath', () => {
  it('should generate encounter receipt', () => {
    const gs = createMockGameState();
    
    const receipt = generateEncounterReceipt('test_encounter', 'victory', null, gs);
    
    expect(receipt.kind).toBe('encounter_aftermath');
    expect(receipt.schemaVersion).toBe(1);
    expect(receipt.encounterId).toBe('test_encounter');
    expect(receipt.terminal).toBe('victory');
    expect(receipt.xpAwarded).toBeGreaterThan(0);
  });
  
  it('should create unique idempotency keys', () => {
    const key1 = createIdempotencyKey('enc1', 'victory', 10);
    const key2 = createIdempotencyKey('enc1', 'victory', 10);
    const key3 = createIdempotencyKey('enc1', 'defeat', 10);
    
    expect(key1).toBe(key2); // Same inputs = same key
    expect(key1).not.toBe(key3); // Different terminal = different key
  });
  
  it('should detect applied receipts', () => {
    const gs = createMockGameState({
      arcDirector: {
        appliedReceipts: ['test_key']
      }
    });
    
    const applied = hasReceiptBeenApplied('test_key', gs);
    
    expect(applied).toBe(true);
  });
  
  it('should mark receipt as applied', () => {
    const gs = createMockGameState();
    
    const nextGs = markReceiptApplied('test_key', gs);
    
    const applied = hasReceiptBeenApplied('test_key', nextGs);
    expect(applied).toBe(true);
  });
  
  it('should not apply duplicate receipts', () => {
    const gs = createMockGameState({
      arcDirector: {
        appliedReceipts: ['test_key']
      },
      totalXp: 100
    });
    
    const receipt = generateEncounterReceipt('test', 'victory', null, gs);
    receipt.idempotencyKey = 'test_key';
    
    const { applied, errors } = applyEncounterReceipt(receipt, gs);
    
    expect(applied).toBe(false);
    expect(errors[0]).toContain('already applied');
  });
  
  it('should apply valid receipt', () => {
    const gs = createMockGameState({ totalXp: 0 });
    
    const receipt = generateEncounterReceipt('test', 'victory', null, gs);
    
    const { gs: nextGs, applied, errors } = applyEncounterReceipt(receipt, gs);
    
    expect(applied).toBe(true);
    expect(errors.length).toBe(0);
    expect(nextGs.totalXp).toBeGreaterThan(0);
  });
  
  it('should reconcile receipt against ledgers', () => {
    const gs = createMockGameState();
    const receipt = generateEncounterReceipt('test', 'victory', null, gs);
    
    const reconciliation = reconcileReceiptAgainstLedgers(receipt, gs);
    
    expect(reconciliation.valid).toBe(true);
    expect(reconciliation.errors.length).toBe(0);
  });
});

// ============================================================================
// WS-5 Wave B: Delayed Consequences Tests
// ============================================================================

describe('WS-5 Wave B: Delayed Consequences', () => {
  it('should deliver enhanced consequence', () => {
    const gs = createMockGameState({ hp: 100 });
    const consequence: any = {
      id: 'test',
      type: 'echo',
      payload: {
        narrativeBeat: 'Test echo',
        journalHint: 'Test hint',
        resourceDeltas: [],
        relationshipDeltas: []
      }
    };
    
    const { state, narrative, effects } = deliverEnhancedConsequence(consequence, gs);
    
    expect(narrative).toContain('Echo of your choice');
    expect(effects.length).toBeGreaterThan(0);
  });
  
  it('should enforce T150 deadline', () => {
    const gs = createMockGameState({ turn: 150 });
    
    const { enforced, pendingCount } = enforceT150Deadline(gs);
    
    expect(enforced).toBe(false); // No pending consequences
  });
  
  it('should check ending eligibility', () => {
    const gs = createMockGameState({ turn: 60 });
    
    const gate = checkEndingEligibility('test_ending', gs);
    
    expect(gate.endingId).toBe('test_ending');
    expect(gate.requirements.length).toBeGreaterThan(0);
    expect(typeof gate.eligible).toBe('boolean');
  });
  
  it('should build fog-of-war entries', () => {
    const consequence: any = {
      committedAtTurn: 10,
      dueAtTurn: 50,
      payload: {
        journalHint: 'Test hint',
        narrativeBeat: 'Test narrative'
      }
    };
    
    const { visible, hidden } = buildFogOfWarEntry(consequence, false);
    
    expect(visible).toBeDefined();
    expect(hidden).toBe('[Hidden until delivery]');
  });
  
  it('should reveal fog-of-war when delivered', () => {
    const consequence: any = {
      committedAtTurn: 10,
      dueAtTurn: 50,
      payload: {
        journalHint: 'Test hint',
        narrativeBeat: 'Test narrative'
      }
    };
    
    const { visible, hidden } = buildFogOfWarEntry(consequence, true);
    
    expect(visible).toBe('Test hint');
    expect(hidden).toBe('Test narrative');
  });
});

describe('WS-5 Wave B: Ending Gates', () => {
  it('should filter eligible endings', () => {
    const gs = createMockGameState({ 
      turn: 60,
      bibleId: 'thornferry-road'
    });
    
    const eligible = getEligibleEndings(gs);
    
    expect(Array.isArray(eligible)).toBe(true);
    // Eligibility depends on game state, so we just check structure
    for (const gate of eligible) {
      expect(gate.endingId).toBeDefined();
      expect(gate.eligible).toBe(true);
    }
  });
});
