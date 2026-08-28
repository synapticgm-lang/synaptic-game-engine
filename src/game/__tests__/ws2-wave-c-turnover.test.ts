/**
 * WS-2 Wave C: Topic Exhaustion + Turnover Tests
 * 
 * Tests for:
 * - NPC-016: Evidence/contradiction/story-beat topic revival
 * - NPC-017: Topic cooldown ledger
 * - NPC-018: Actor turnover decision engine
 * - NPC-019: Role-specific success/failure actions
 * - NPC-020: Fallback selection and successor spawn
 * - NPC-021: Departure and role-change events
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../types';
import {
  reviveTopicVersion,
  isTopicOnCooldown,
  getTopicVersion,
} from '../npcTopicFsm';
import {
  decideTurnover,
  selectFallback,
  spawnSuccessor,
  createTurnoverReceipt,
} from '../npcTurnover';
import type { NpcLifecycle } from '../npcLifecycleFsm';

describe('WS-2 Wave C: Topic Exhaustion + Turnover', () => {
  
  // ============================================================================
  // NPC-016: Topic Revival
  // ============================================================================
  
  describe('NPC-016: Topic revival with evidence', () => {
    it('revives exhausted topic with new evidence', () => {
      const state: GameState = {
        turn: 50,
        arcDirector: {
          npcTopics: {
            'aldous': ['dialogue:guide-info'], // Exhausted topic
          },
        },
      } as GameState;
      
      const next = reviveTopicVersion(
        state,
        'Aldous',
        'dialogue:guide-info',
        'evidence',
        50
      );
      
      // Topic should be removed from exhausted list
      const npcTopics = next.arcDirector?.npcTopics?.['aldous'] ?? [];
      expect(npcTopics).not.toContain('dialogue:guide-info');
      
      // Version should be recorded
      const version = getTopicVersion('Aldous', 'dialogue:guide-info', next.arcDirector?.topicCooldownLedger);
      expect(version).toBeGreaterThan(0);
    });
    
    it('sets cooldown based on revival reason', () => {
      const state: GameState = { turn: 30 } as GameState;
      
      // Evidence: 8-turn cooldown
      const evidenceState = reviveTopicVersion(state, 'NPC', 'topic1', 'evidence', 30);
      expect(isTopicOnCooldown('NPC', 'topic1', 37, evidenceState.arcDirector?.topicCooldownLedger)).toBe(true);
      expect(isTopicOnCooldown('NPC', 'topic1', 39, evidenceState.arcDirector?.topicCooldownLedger)).toBe(false);
      
      // Contradiction: 12-turn cooldown
      const contradState = reviveTopicVersion(state, 'NPC', 'topic2', 'contradiction', 30);
      expect(isTopicOnCooldown('NPC', 'topic2', 41, contradState.arcDirector?.topicCooldownLedger)).toBe(true);
      expect(isTopicOnCooldown('NPC', 'topic2', 43, contradState.arcDirector?.topicCooldownLedger)).toBe(false);
      
      // Story beat: no cooldown
      const storyState = reviveTopicVersion(state, 'NPC', 'topic3', 'story_beat', 30);
      expect(isTopicOnCooldown('NPC', 'topic3', 31, storyState.arcDirector?.topicCooldownLedger)).toBe(false);
    });
    
    it('increments topic version on revival', () => {
      const state: GameState = { turn: 20 } as GameState;
      
      let next = reviveTopicVersion(state, 'NPC', 'topic', 'evidence', 20);
      expect(getTopicVersion('NPC', 'topic', next.arcDirector?.topicCooldownLedger)).toBe(1);
      
      next = { ...next, turn: 40 };
      next = reviveTopicVersion(next, 'NPC', 'topic', 'contradiction', 40);
      expect(getTopicVersion('NPC', 'topic', next.arcDirector?.topicCooldownLedger)).toBe(2);
    });
  });
  
  // ============================================================================
  // NPC-017: Topic Cooldown
  // ============================================================================
  
  describe('NPC-017: Topic cooldown ledger', () => {
    it('prevents topic re-raise during cooldown', () => {
      const state: GameState = { turn: 10 } as GameState;
      
      const next = reviveTopicVersion(state, 'NPC', 'topic', 'evidence', 10);
      
      // Within cooldown (8 turns)
      expect(isTopicOnCooldown('NPC', 'topic', 15, next.arcDirector?.topicCooldownLedger)).toBe(true);
      
      // After cooldown
      expect(isTopicOnCooldown('NPC', 'topic', 19, next.arcDirector?.topicCooldownLedger)).toBe(false);
    });
    
    it('tracks multiple topics per NPC', () => {
      const state: GameState = { turn: 5 } as GameState;
      
      let next = reviveTopicVersion(state, 'NPC', 'topic1', 'evidence', 5);
      next = reviveTopicVersion(next, 'NPC', 'topic2', 'contradiction', 5);
      
      expect(getTopicVersion('NPC', 'topic1', next.arcDirector?.topicCooldownLedger)).toBe(1);
      expect(getTopicVersion('NPC', 'topic2', next.arcDirector?.topicCooldownLedger)).toBe(1);
    });
  });
  
  // ============================================================================
  // NPC-018: Turnover Decision Engine
  // ============================================================================
  
  describe('NPC-018: Actor turnover decisions', () => {
    it('exits guide after debt satisfied', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'aldous',
        role: 'guide',
        state: 'debt_satisfied',
        enteredAtTurn: 2,
        obligationDeadline: 10,
        debtSatisfied: true,
        satisfiedAtTurn: 8,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 12 } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'completion');
      
      expect(decision.action).toBe('exit');
      expect(decision.trigger).toBe('completion');
      expect(decision.reason).toContain('graceful departure');
    });
    
    it('delegates quest patron on deadline miss', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'patron',
        role: 'quest-patron',
        state: 'functioning',
        enteredAtTurn: 5,
        obligationDeadline: 15,
        debtSatisfied: false,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 20 } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'deadline');
      
      expect(decision.action).toBeOneOf(['delegate', 'exit']);
      expect(decision.trigger).toBe('deadline');
    });
    
    it('relocates merchant after location trigger', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'trader',
        role: 'merchant',
        state: 'functioning',
        enteredAtTurn: 10,
        obligationDeadline: null,
        debtSatisfied: false,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 30, currentLocation: 'new-hub' } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'location');
      
      expect(decision.action).toBe('relocate');
      expect(decision.newLocationId).toBeDefined();
    });
    
    it('transforms informant to ally on story trigger', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'informant',
        role: 'informant',
        state: 'functioning',
        enteredAtTurn: 15,
        obligationDeadline: 25,
        debtSatisfied: false,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 20 } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'transform');
      
      expect(decision.action).toBe('transform');
      expect(decision.transformedIdentity?.newRole).toBe('ally');
    });
  });
  
  // ============================================================================
  // NPC-019: Role-Specific Actions
  // ============================================================================
  
  describe('NPC-019: Role-specific success/failure', () => {
    it('guide exits on completion', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'guide',
        role: 'guide',
        state: 'debt_satisfied',
        enteredAtTurn: 2,
        obligationDeadline: 10,
        debtSatisfied: true,
        satisfiedAtTurn: 8,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 12 } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'completion');
      expect(decision.action).toBe('exit');
    });
    
    it('merchant remains after quota met', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'trader',
        role: 'merchant',
        state: 'debt_satisfied',
        enteredAtTurn: 10,
        obligationDeadline: null,
        debtSatisfied: true,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 25 } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'completion');
      expect(decision.action).toBeOneOf(['remain', 'relocate']);
    });
    
    it('companion remains unless betrayed', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'companion',
        role: 'companion',
        state: 'functioning',
        enteredAtTurn: 20,
        obligationDeadline: null,
        debtSatisfied: false,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 100 } as GameState;
      
      const decision = decideTurnover(state, lifecycle, 'completion');
      expect(decision.action).toBe('remain');
    });
  });
  
  // ============================================================================
  // NPC-020: Fallback Selection
  // ============================================================================
  
  describe('NPC-020: Fallback and successor spawn', () => {
    it('selects successor fallback on deadline', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'patron',
        role: 'quest-patron',
        state: 'functioning',
        enteredAtTurn: 5,
        obligationDeadline: 15,
        debtSatisfied: false,
      } as NpcLifecycle;
      
      const state: GameState = { turn: 20 } as GameState;
      
      const fallback = selectFallback(state, lifecycle, 'deadline');
      
      expect(fallback.type).toBeOneOf(['successor', 'delegate']);
      if (fallback.type === 'successor' || fallback.type === 'delegate') {
        expect(fallback.actorId).toBeDefined();
        expect(fallback.successorRole).toBeDefined();
      }
    });
    
    it('spawns successor with inherited debt', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'patron',
        role: 'quest-patron',
        state: 'functioning',
        enteredAtTurn: 5,
        obligationDeadline: 15,
        debtSatisfied: false,
      } as NpcLifecycle;
      
      const decision = {
        npcId: 'patron',
        action: 'delegate' as const,
        trigger: 'deadline' as const,
        reason: 'Deadline missed',
        successorRole: 'quest-patron' as const,
        fallbackActorId: 'successor-1',
      };
      
      const successor = spawnSuccessor({} as GameState, decision, lifecycle);
      
      expect(successor.actorId).toBe('successor-1');
      expect(successor.role).toBe('quest-patron');
      expect(successor.inheritedDebt).toContain('Inherited from patron');
    });
    
    it('successor has no inherited debt if parent completed', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'guide',
        role: 'guide',
        state: 'debt_satisfied',
        enteredAtTurn: 2,
        obligationDeadline: 10,
        debtSatisfied: true,
        satisfiedAtTurn: 8,
      } as NpcLifecycle;
      
      const decision = {
        npcId: 'guide',
        action: 'delegate' as const,
        trigger: 'completion' as const,
        reason: 'Completed',
        successorRole: 'guide' as const,
      };
      
      const successor = spawnSuccessor({} as GameState, decision, lifecycle);
      expect(successor.inheritedDebt).toBe('none');
    });
  });
  
  // ============================================================================
  // NPC-021: Departure Events
  // ============================================================================
  
  describe('NPC-021: Departure and role-change receipts', () => {
    it('creates turnover receipt for exit', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'guide',
        role: 'guide',
        state: 'debt_satisfied',
        enteredAtTurn: 2,
        obligationDeadline: 10,
        debtSatisfied: true,
        satisfiedAtTurn: 8,
        lastUpdateTurn: 12,
        currentLocation: 'circle',
      } as NpcLifecycle;
      
      const decision = {
        npcId: 'guide',
        action: 'exit' as const,
        trigger: 'completion' as const,
        reason: 'Debt satisfied',
      };
      
      const receipt = createTurnoverReceipt(decision, lifecycle);
      
      expect(receipt.kind).toBe('npc_turnover');
      expect(receipt.npcId).toBe('guide');
      expect(receipt.action).toBe('exit');
      expect(receipt.fromState).toBe('debt_satisfied');
      expect(receipt.toState).toBe('absent');
    });
    
    it('creates receipt with successor spawn', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'patron',
        role: 'quest-patron',
        state: 'functioning',
        enteredAtTurn: 5,
        obligationDeadline: 15,
        debtSatisfied: false,
        lastUpdateTurn: 20,
        currentLocation: 'hub',
      } as NpcLifecycle;
      
      const decision = {
        npcId: 'patron',
        action: 'delegate' as const,
        trigger: 'deadline' as const,
        reason: 'Deadline missed',
        successorRole: 'quest-patron' as const,
        fallbackActorId: 'successor-1',
      };
      
      const successor = {
        actorId: 'successor-1',
        role: 'quest-patron' as const,
        name: 'New Patron',
        inheritedDebt: 'Inherited from patron',
      };
      
      const receipt = createTurnoverReceipt(decision, lifecycle, successor);
      
      expect(receipt.successorSpawned).toBeDefined();
      expect(receipt.successorSpawned?.actorId).toBe('successor-1');
      expect(receipt.successorSpawned?.inheritedDebt).toContain('Inherited');
    });
    
    it('creates receipt with transformation', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'informant',
        role: 'informant',
        state: 'functioning',
        enteredAtTurn: 15,
        obligationDeadline: 25,
        debtSatisfied: false,
        lastUpdateTurn: 22,
        currentLocation: 'district',
      } as NpcLifecycle;
      
      const decision = {
        npcId: 'informant',
        action: 'transform' as const,
        trigger: 'story' as const,
        reason: 'Became ally',
        transformedIdentity: {
          newRole: 'ally' as const,
          newName: 'Trusted Ally',
          backstory: 'Earned trust',
        },
      };
      
      const receipt = createTurnoverReceipt(decision, lifecycle);
      
      expect(receipt.transformation).toBeDefined();
      expect(receipt.transformation?.oldRole).toBe('informant');
      expect(receipt.transformation?.newRole).toBe('ally');
      expect(receipt.toState).toBe('transformed');
    });
    
    it('creates receipt with relocation', () => {
      const lifecycle: NpcLifecycle = {
        npcId: 'merchant',
        role: 'merchant',
        state: 'functioning',
        enteredAtTurn: 10,
        obligationDeadline: null,
        debtSatisfied: false,
        lastUpdateTurn: 30,
        currentLocation: 'old-hub',
      } as NpcLifecycle;
      
      const decision = {
        npcId: 'merchant',
        action: 'relocate' as const,
        trigger: 'location' as const,
        reason: 'Player left area',
        newLocationId: 'new-hub',
      };
      
      const receipt = createTurnoverReceipt(decision, lifecycle);
      
      expect(receipt.locationChange).toBeDefined();
      expect(receipt.locationChange?.from).toBe('old-hub');
      expect(receipt.locationChange?.to).toBe('new-hub');
      expect(receipt.toState).toBe('functioning');
    });
  });
});
