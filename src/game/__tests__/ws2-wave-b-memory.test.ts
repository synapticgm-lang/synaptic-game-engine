/**
 * WS-2 Wave B: Memory Ledger Integration Tests
 * 
 * Tests for:
 * - NPC-008: Key moment schema
 * - NPC-009: JSON Schema validation
 * - NPC-010: Append-only ledger
 * - NPC-011: Persist key moments
 * - NPC-022: Witness eligibility
 * - NPC-023: Faction broadcast
 * - NPC-024: Hub gossip
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../types';
import {
  createKeyMoment,
  appendKeyMoment,
  getKeyMoments,
  getRecentKeyMoments,
  hasKeyMoment,
  broadcastKeyMoment,
  broadcastToFaction,
  spreadHubGossip,
  retrieveRankedMemories,
  recordFirstMeet,
  recordBetrayal,
  recordDeal,
  recordQuestDisposition,
  cleanupOldMemories,
} from '../npcMemoryLedger';

describe('WS-2 Wave B: Memory Ledger', () => {
  
  // ============================================================================
  // NPC-008: Key Moment Schema
  // ============================================================================
  
  describe('NPC-008: Key moment creation', () => {
    it('creates key moment with full schema', () => {
      const state: GameState = { turn: 10 } as GameState;
      
      const moment = createKeyMoment(
        'aldous',
        'first_meet',
        { location: 'circle', greeting: 'Welcome' },
        state
      );
      
      expect(moment.id).toMatch(/^km-aldous-first_meet-10-/);
      expect(moment.npcId).toBe('aldous');
      expect(moment.category).toBe('first_meet');
      expect(moment.turn).toBe(10);
      expect(moment.data.location).toBe('circle');
      expect(moment.provenance).toBe('direct_participant');
      expect(moment.visibility).toBe('witnessed');
      expect(moment.retention).toBe('permanent');
    });
    
    it('sets correct retention based on category', () => {
      const state: GameState = { turn: 5 } as GameState;
      
      const permanent = createKeyMoment('npc1', 'first_meet', {}, state);
      expect(permanent.retention).toBe('permanent');
      
      const campaign = createKeyMoment('npc1', 'revelation', {}, state);
      expect(campaign.retention).toBe('campaign');
      
      const arc = createKeyMoment('npc1', 'deal', {}, state);
      expect(arc.retention).toBe('arc');
      
      const scene = createKeyMoment('npc1', 'departure', {}, state);
      expect(scene.retention).toBe('scene');
    });
    
    it('allows custom provenance and visibility', () => {
      const state: GameState = { turn: 15 } as GameState;
      
      const moment = createKeyMoment(
        'oskar',
        'betrayal',
        { summary: 'Betrayed player' },
        state,
        {
          provenance: 'witnessed',
          visibility: 'faction',
          retention: 'permanent',
        }
      );
      
      expect(moment.provenance).toBe('witnessed');
      expect(moment.visibility).toBe('faction');
      expect(moment.retention).toBe('permanent');
    });
  });
  
  // ============================================================================
  // NPC-010: Append-Only Ledger
  // ============================================================================
  
  describe('NPC-010: Append-only ledger', () => {
    it('creates new ledger on first append', () => {
      const state: GameState = { turn: 5 } as GameState;
      
      const moment = createKeyMoment('aldous', 'first_meet', {}, state);
      const next = appendKeyMoment('aldous', moment, state);
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous');
      expect(ledger).toBeDefined();
      expect(ledger?.keyMoments).toHaveLength(1);
      expect(ledger?.keyMoments[0].id).toBe(moment.id);
    });
    
    it('appends to existing ledger', () => {
      const state: GameState = { turn: 10 } as GameState;
      
      const moment1 = createKeyMoment('aldous', 'first_meet', {}, state);
      let next = appendKeyMoment('aldous', moment1, state);
      
      const moment2 = createKeyMoment('aldous', 'deal', { summary: 'Trade agreed' }, next);
      next = appendKeyMoment('aldous', moment2, next);
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous');
      expect(ledger?.keyMoments).toHaveLength(2);
      expect(ledger?.keyMoments[1].category).toBe('deal');
    });
    
    it('deduplicates moments within time window', () => {
      const state: GameState = { turn: 5 } as GameState;
      
      const moment1 = createKeyMoment('aldous', 'first_meet', {}, state);
      let next = appendKeyMoment('aldous', moment1, state);
      
      // Try to append same category within 5-turn window
      const moment2 = createKeyMoment('aldous', 'first_meet', {}, { ...next, turn: 7 });
      next = appendKeyMoment('aldous', moment2, next);
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous');
      expect(ledger?.keyMoments).toHaveLength(1); // Deduplicated
    });
    
    it('caps ledger at 100 moments', () => {
      const state: GameState = { turn: 0 } as GameState;
      let next = state;
      
      // Add 105 moments
      for (let i = 0; i < 105; i++) {
        const moment = createKeyMoment(
          'prolific-npc',
          i % 2 === 0 ? 'witness' : 'deal',
          { index: i },
          { ...next, turn: i }
        );
        next = appendKeyMoment('prolific-npc', moment, next);
      }
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'prolific-npc');
      expect(ledger?.keyMoments.length).toBeLessThanOrEqual(100);
    });
  });
  
  // ============================================================================
  // NPC-011: Persist Key Moments
  // ============================================================================
  
  describe('NPC-011: Persist permanent key moments', () => {
    it('records first meet as permanent', () => {
      const state: GameState = { turn: 2, location: { name: 'Circle' } } as GameState;
      
      const next = recordFirstMeet('aldous', state, { greeting: 'Welcome' });
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous');
      expect(ledger?.keyMoments[0].category).toBe('first_meet');
      expect(ledger?.keyMoments[0].retention).toBe('permanent');
      expect(hasKeyMoment('aldous', 'first_meet', next)).toBe(true);
    });
    
    it('prevents duplicate first meet', () => {
      const state: GameState = { turn: 2 } as GameState;
      
      let next = recordFirstMeet('aldous', state);
      next = recordFirstMeet('aldous', next); // Try again
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous');
      expect(ledger?.keyMoments).toHaveLength(1);
    });
    
    it('records betrayal as permanent', () => {
      const state: GameState = { turn: 50, location: { name: 'Dock' } } as GameState;
      
      const next = recordBetrayal('oskar', 'Betrayed deal', state);
      
      const moment = getKeyMoments('oskar', next).find(m => m.category === 'betrayal');
      expect(moment).toBeDefined();
      expect(moment?.retention).toBe('permanent');
      expect(moment?.data.summary).toBe('Betrayed deal');
      expect(moment?.data.location).toBe('Dock');
    });
    
    it('records deal with unresolved status', () => {
      const state: GameState = { turn: 18, location: { name: 'Market' } } as GameState;
      
      const next = recordDeal('trader', 'Trade 10 herbs for map', state);
      
      const moment = getKeyMoments('trader', next).find(m => m.category === 'deal');
      expect(moment).toBeDefined();
      expect(moment?.retention).toBe('arc');
      expect(moment?.data.resolved).toBe(false);
    });
    
    it('records quest disposition as permanent', () => {
      const state: GameState = { turn: 10 } as GameState;
      
      const next = recordQuestDisposition('patron', 'rescue-mission', 'accepted', state);
      
      const moment = getKeyMoments('patron', next).find(m => m.category === 'quest_critical');
      expect(moment).toBeDefined();
      expect(moment?.retention).toBe('permanent');
      expect(moment?.data.status).toBe('accepted');
      expect(moment?.data.questId).toBe('rescue-mission');
    });
  });
  
  // ============================================================================
  // NPC-022: Witness Eligibility
  // ============================================================================
  
  describe('NPC-022: Witness-based memory sync', () => {
    it('broadcasts to eligible witnesses', () => {
      const state: GameState = {
        turn: 30,
        sceneFacts: {
          present: ['oskar', 'trader', 'guard'],
        },
      } as GameState;
      
      const sourceMoment = createKeyMoment(
        'aldous',
        'betrayal',
        { summary: 'Betrayed player' },
        state
      );
      
      const next = broadcastKeyMoment(sourceMoment, ['oskar', 'trader', 'guard'], state);
      
      // Check each witness got a witness moment
      expect(hasKeyMoment('oskar', 'witness', next)).toBe(true);
      expect(hasKeyMoment('trader', 'witness', next)).toBe(true);
      expect(hasKeyMoment('guard', 'witness', next)).toBe(true);
      
      // Original actor should not have witness moment
      expect(getKeyMoments('aldous', next).find(m => m.category === 'witness')).toBeUndefined();
    });
    
    it('filters out non-present witnesses', () => {
      const state: GameState = {
        turn: 30,
        sceneFacts: {
          present: ['oskar'], // Only oskar present
        },
      } as GameState;
      
      const sourceMoment = createKeyMoment('aldous', 'deal', { summary: 'Trade' }, state);
      
      const next = broadcastKeyMoment(sourceMoment, ['oskar', 'absent-npc'], state);
      
      expect(hasKeyMoment('oskar', 'witness', next)).toBe(true);
      expect(hasKeyMoment('absent-npc', 'witness', next)).toBe(false);
    });
    
    it('witness moment references source event', () => {
      const state: GameState = {
        turn: 35,
        sceneFacts: { present: ['oskar'] },
      } as GameState;
      
      const sourceMoment = createKeyMoment(
        'aldous',
        'betrayal',
        { summary: 'Broke deal' },
        state
      );
      
      const next = broadcastKeyMoment(sourceMoment, ['oskar'], state);
      
      const witnessMoment = getKeyMoments('oskar', next).find(m => m.category === 'witness');
      expect(witnessMoment?.data.witnessedNpc).toBe('aldous');
      expect(witnessMoment?.data.witnessedCategory).toBe('betrayal');
      expect(witnessMoment?.provenance).toBe('witnessed');
    });
  });
  
  // ============================================================================
  // NPC-023: Faction Broadcast
  // ============================================================================
  
  describe('NPC-023: Faction broadcast', () => {
    it('broadcasts to faction members', () => {
      const state: GameState = {
        turn: 40,
        arcDirector: {
          npcLifecycles: [
            { npcId: 'envoy1', role: 'faction-envoy', state: 'functioning' } as any,
            { npcId: 'envoy2', role: 'faction-envoy', state: 'functioning' } as any,
          ],
          npcFactionMemberships: {
            envoy1: 'harbor-union',
            envoy2: 'harbor-union',
          },
        },
      } as GameState;
      
      const sourceMoment = createKeyMoment(
        'leader',
        'faction_change',
        { factionId: 'harbor-union', announcement: 'New policy' },
        state
      );
      
      const next = broadcastToFaction(sourceMoment, 'harbor-union', state);
      
      expect(hasKeyMoment('envoy1', 'faction_change', next)).toBe(true);
      expect(hasKeyMoment('envoy2', 'faction_change', next)).toBe(true);
      
      const envoy1Moment = getKeyMoments('envoy1', next).find(m => m.category === 'faction_change');
      expect(envoy1Moment?.provenance).toBe('faction_broadcast');
    });
  });
  
  // ============================================================================
  // NPC-024: Hub Gossip
  // ============================================================================
  
  describe('NPC-024: Hub gossip with delay', () => {
    it('spreads gossip to hub NPCs', () => {
      const state: GameState = {
        turn: 25,
        location: { name: 'market-hub' },
        arcDirector: {
          npcLifecycles: [
            { npcId: 'merchant1', state: 'functioning' } as any,
            { npcId: 'merchant2', state: 'functioning' } as any,
          ],
        },
      } as GameState;
      
      const sourceMoment = createKeyMoment(
        'source-npc',
        'betrayal',
        { summary: 'Rumor of betrayal' },
        state
      );
      
      const next = spreadHubGossip(sourceMoment, 'market-hub', state, {
        delay: 5,
        confidence: 0.8,
      });
      
      const merchant1Moment = getKeyMoments('merchant1', next).find(m => m.category === 'witness');
      expect(merchant1Moment).toBeDefined();
      expect(merchant1Moment?.provenance).toBe('hub_gossip');
      expect(merchant1Moment?.data.confidence).toBe(0.8);
      expect(merchant1Moment?.data.delay).toBe(5);
    });
  });
  
  // ============================================================================
  // Wave B: Memory Retrieval
  // ============================================================================
  
  describe('Wave B: Ranked memory retrieval', () => {
    it('retrieves ranked memories for situation packet', () => {
      const state: GameState = { turn: 100 } as GameState;
      let next = state;
      
      // Add various moments
      next = recordFirstMeet('aldous', next);
      next = recordBetrayal('aldous', 'Broke trust at T50', { ...next, turn: 50 });
      next = recordDeal('aldous', 'Pending trade', { ...next, turn: 80 });
      
      const { keyMoments, recentMoments, mandatoryEventIds } = retrieveRankedMemories(
        'aldous',
        next,
        { maxKeyMoments: 5, maxRecentMoments: 3 }
      );
      
      // Permanent moments (first_meet, betrayal) should be first
      expect(keyMoments.length).toBeGreaterThan(0);
      expect(keyMoments.some(m => m.category === 'first_meet')).toBe(true);
      expect(keyMoments.some(m => m.category === 'betrayal')).toBe(true);
      
      // Unresolved deal should be in key moments or mandatory
      expect(
        keyMoments.some(m => m.category === 'deal') ||
        mandatoryEventIds.length > 0
      ).toBe(true);
    });
    
    it('respects maxKeyMoments limit', () => {
      const state: GameState = { turn: 100 } as GameState;
      let next = state;
      
      // Add 10 moments
      for (let i = 0; i < 10; i++) {
        const moment = createKeyMoment('npc', 'witness', { index: i }, { ...next, turn: i * 10 });
        next = appendKeyMoment('npc', moment, next);
      }
      
      const { keyMoments, recentMoments } = retrieveRankedMemories('npc', next, {
        maxKeyMoments: 3,
        maxRecentMoments: 2,
      });
      
      expect(keyMoments.length).toBeLessThanOrEqual(3);
      expect(recentMoments.length).toBeLessThanOrEqual(2);
    });
  });
  
  // ============================================================================
  // Memory Cleanup
  // ============================================================================
  
  describe('Memory cleanup by retention', () => {
    it('expires scene memories after 10 turns', () => {
      const state: GameState = { turn: 5 } as GameState;
      
      const moment = createKeyMoment(
        'npc',
        'departure',
        {},
        state,
        { retention: 'scene' }
      );
      let next = appendKeyMoment('npc', moment, state);
      
      // Advance 11 turns
      next = { ...next, turn: 16 };
      next = cleanupOldMemories(next);
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'npc');
      expect(ledger?.keyMoments).toHaveLength(0);
    });
    
    it('keeps permanent memories indefinitely', () => {
      const state: GameState = { turn: 5 } as GameState;
      
      let next = recordFirstMeet('aldous', state);
      
      // Advance 200 turns
      next = { ...next, turn: 205 };
      next = cleanupOldMemories(next);
      
      expect(hasKeyMoment('aldous', 'first_meet', next)).toBe(true);
    });
    
    it('expires arc memories after 50 turns', () => {
      const state: GameState = { turn: 10 } as GameState;
      
      let next = recordDeal('trader', 'Trade agreement', state);
      
      // Advance 51 turns
      next = { ...next, turn: 61 };
      next = cleanupOldMemories(next);
      
      const ledger = next.arcDirector?.npcMemories?.find(m => m.npcId === 'trader');
      expect(ledger?.keyMoments).toHaveLength(0);
    });
  });
  
  // ============================================================================
  // Query Functions
  // ============================================================================
  
  describe('Memory query functions', () => {
    it('gets recent key moments within window', () => {
      const state: GameState = { turn: 50 } as GameState;
      let next = state;
      
      for (let i = 0; i < 30; i++) {
        const moment = createKeyMoment('npc', 'witness', { index: i }, { ...next, turn: 20 + i });
        next = appendKeyMoment('npc', moment, next);
      }
      
      const recent = getRecentKeyMoments('npc', next, 15);
      expect(recent.every(m => m.turn >= 35)).toBe(true); // Turn 50 - 15 = 35
    });
    
    it('checks if key moment exists', () => {
      const state: GameState = { turn: 10 } as GameState;
      
      const next = recordFirstMeet('aldous', state);
      
      expect(hasKeyMoment('aldous', 'first_meet', next)).toBe(true);
      expect(hasKeyMoment('aldous', 'betrayal', next)).toBe(false);
    });
  });
});
