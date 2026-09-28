/**
 * Wave B Tests: Topic revival, Delayed Consequences
 * 
 * Tests for:
 * - WS-2 Wave B: Topic revival
 * - WS-5 Wave B: Delayed consequences, ending gates
 */

import { describe, it, expect } from 'vitest';

// WS-2 Wave B
import {
  reviveTopicVersion,
  isTopicOnCooldown,
  getTopicVersion
} from '../npcTopicFsm';

// WS-5 Wave B
import {
  deliverEnhancedConsequence,
  enforceT150Deadline,
  checkEndingEligibility,
  getEligibleEndings,
  buildFogOfWarEntry
} from '../pyoaDelayedConsequences';

import type { GameState } from '../types';

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
