/**
 * WS-2 Wave C: Topic Exhaustion Tests
 * 
 * Tests for:
 * - NPC-016: Evidence/contradiction/story-beat topic revival
 * - NPC-017: Topic cooldown ledger
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../types';
import {
  reviveTopicVersion,
  isTopicOnCooldown,
  getTopicVersion,
} from '../npcTopicFsm';

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
});
