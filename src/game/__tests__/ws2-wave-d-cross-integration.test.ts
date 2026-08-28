/**
 * WS-2 Wave D+: Cross-NPC Integration Tests
 * 
 * Tests for:
 * - NPC-025: Deny-faction anti-sync gates
 * - NPC-026: Directional relationship projections
 * - NPC-027: Trait modulation
 * - Cross-NPC conversation tracking
 * - Multi-NPC scenarios
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../types';
import type { NpcKeyMoment } from '../types/crossPackageContracts';
import {
  propagateKnowledge,
  isFactionDenied,
  filterKnowledgeByFaction,
  updateRelationship,
  getRelationshipValue,
  getNpcTraits,
  hasNpcTrait,
  modulateRelationshipDelta,
  recordNpcConversation,
  getConversationsForNpc,
  getConversationsBetween,
  buildCrossNpcSituationSection,
} from '../npcCrossIntegration';
import { createKeyMoment } from '../npcMemoryLedger';

describe('WS-2 Wave D+: Cross-NPC Integration', () => {
  
  // ============================================================================
  // Knowledge Propagation
  // ============================================================================
  
  describe('Knowledge propagation rules', () => {
    it('propagates witnessed event to present NPCs', () => {
      const state: GameState = {
        turn: 20,
        sceneFacts: {
          present: ['oskar', 'trader', 'guard'],
        },
        location: { name: 'market' },
      } as GameState;
      
      const moment = createKeyMoment(
        'aldous',
        'betrayal',
        { summary: 'Public betrayal' },
        state,
        { visibility: 'witnessed' }
      );
      
      const next = propagateKnowledge(moment, state);
      
      // All present NPCs should have witness moments
      const oskarMoments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'oskar')?.keyMoments ?? [];
      const traderMoments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'trader')?.keyMoments ?? [];
      
      expect(oskarMoments.some(m => m.category === 'witness')).toBe(true);
      expect(traderMoments.some(m => m.category === 'witness')).toBe(true);
    });
    
    it('propagates faction event to faction members', () => {
      const state: GameState = {
        turn: 30,
        arcDirector: {
          npcLifecycles: [
            { npcId: 'envoy1', role: 'faction-envoy', state: 'functioning' } as any,
            { npcId: 'envoy2', role: 'faction-envoy', state: 'functioning' } as any,
          ],
          npcFactionMemberships: {
            envoy1: 'guild',
            envoy2: 'guild',
          },
        },
      } as GameState;
      
      const moment = createKeyMoment(
        'leader',
        'faction_change',
        { factionIds: ['guild'], announcement: 'Policy change' },
        state,
        { visibility: 'faction' }
      );
      
      const next = propagateKnowledge(moment, state);
      
      const envoy1Moments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'envoy1')?.keyMoments ?? [];
      expect(envoy1Moments.some(m => m.category === 'faction_change')).toBe(true);
    });
    
    it('spreads public event as hub gossip', () => {
      const state: GameState = {
        turn: 25,
        location: { name: 'market' },
        arcDirector: {
          npcLifecycles: [
            { npcId: 'merchant1', state: 'functioning' } as any,
            { npcId: 'merchant2', state: 'functioning' } as any,
          ],
        },
      } as GameState;
      
      const moment = createKeyMoment(
        'herald',
        'revelation',
        { summary: 'Public announcement' },
        state,
        { visibility: 'public' }
      );
      
      const next = propagateKnowledge(moment, state);
      
      const merchant1Moments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'merchant1')?.keyMoments ?? [];
      expect(merchant1Moments.some(m => m.category === 'witness')).toBe(true);
    });
  });
  
  // ============================================================================
  // NPC-025: Anti-Sync Gates
  // ============================================================================
  
  describe('NPC-025: Deny-faction anti-sync', () => {
    it('prevents knowledge spread to denied faction', () => {
      const moment: NpcKeyMoment = {
        id: 'km-1',
        npcId: 'spy',
        category: 'betrayal',
        turn: 40,
        data: {
          summary: 'Secret betrayal',
          deniedFactionIds: ['enemy-faction'],
        },
        provenance: 'direct_participant',
        visibility: 'faction',
        retention: 'permanent',
      };
      
      expect(isFactionDenied('enemy-faction', moment)).toBe(true);
      expect(isFactionDenied('ally-faction', moment)).toBe(false);
    });
    
    it('allows leak to supersede denial', () => {
      const state: GameState = {
        turn: 45,
        arcDirector: {
          npcFactionMemberships: {
            'npc1': 'enemy-faction',
          },
        },
      } as GameState;
      
      const moment: NpcKeyMoment = {
        id: 'km-2',
        npcId: 'spy',
        category: 'revelation',
        turn: 45,
        data: {
          summary: 'Leaked secret',
          deniedFactionIds: ['enemy-faction'],
          leakToFactionIds: ['enemy-faction'], // Explicit leak
        },
        provenance: 'direct_participant',
        visibility: 'faction',
        retention: 'campaign',
      };
      
      expect(filterKnowledgeByFaction('npc1', moment, state)).toBe(true);
    });
    
    it('denies without explicit leak', () => {
      const state: GameState = {
        turn: 45,
        arcDirector: {
          npcFactionMemberships: {
            'enemy-npc': 'enemy-faction',
          },
        },
      } as GameState;
      
      const moment: NpcKeyMoment = {
        id: 'km-3',
        npcId: 'ally',
        category: 'deal',
        turn: 45,
        data: {
          summary: 'Secret deal',
          deniedFactionIds: ['enemy-faction'],
        },
        provenance: 'direct_participant',
        visibility: 'faction',
        retention: 'arc',
      };
      
      expect(filterKnowledgeByFaction('enemy-npc', moment, state)).toBe(false);
    });
  });
  
  // ============================================================================
  // NPC-026: Directional Relationships
  // ============================================================================
  
  describe('NPC-026: Directional relationships', () => {
    it('updates relationship aspect', () => {
      const state: GameState = { turn: 50 } as GameState;
      
      const next = updateRelationship('aldous', 'oskar', 'trust', 30, state);
      
      const value = getRelationshipValue('aldous', 'oskar', 'trust', next);
      expect(value).toBe(30);
    });
    
    it('tracks separate directional values', () => {
      const state: GameState = { turn: 50 } as GameState;
      
      let next = updateRelationship('aldous', 'oskar', 'trust', 40, state);
      next = updateRelationship('oskar', 'aldous', 'trust', -20, next);
      
      // Aldous trusts Oskar (+40)
      expect(getRelationshipValue('aldous', 'oskar', 'trust', next)).toBe(40);
      
      // Oskar distrusts Aldous (-20)
      expect(getRelationshipValue('oskar', 'aldous', 'trust', next)).toBe(-20);
    });
    
    it('clamps values between -100 and +100', () => {
      const state: GameState = { turn: 50 } as GameState;
      
      let next = updateRelationship('npc', 'target', 'fear', 80, state);
      next = updateRelationship('npc', 'target', 'fear', 50, next); // Would be 130
      
      expect(getRelationshipValue('npc', 'target', 'fear', next)).toBe(100);
    });
    
    it('records relationship_change moment on threshold cross', () => {
      const state: GameState = { turn: 60 } as GameState;
      
      let next = updateRelationship('aldous', 'oskar', 'trust', 30, state);
      next = updateRelationship('aldous', 'oskar', 'trust', 25, next, { threshold: 50 });
      
      // Crossed threshold from 30 to 55
      const moments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous')?.keyMoments ?? [];
      expect(moments.some(m => m.category === 'relationship_change')).toBe(true);
    });
    
    it('tracks multiple aspects per pair', () => {
      const state: GameState = { turn: 70 } as GameState;
      
      let next = updateRelationship('npc', 'target', 'trust', 40, state);
      next = updateRelationship('npc', 'target', 'respect', 60, next);
      next = updateRelationship('npc', 'target', 'fear', -10, next);
      
      expect(getRelationshipValue('npc', 'target', 'trust', next)).toBe(40);
      expect(getRelationshipValue('npc', 'target', 'respect', next)).toBe(60);
      expect(getRelationshipValue('npc', 'target', 'fear', next)).toBe(-10);
    });
  });
  
  // ============================================================================
  // NPC-027: Trait Modulation
  // ============================================================================
  
  describe('NPC-027: Trait modulation', () => {
    it('modulates trust delta with trusting trait', () => {
      const state: GameState = {
        turn: 80,
        arcDirector: {
          npcTraits: {
            'trusting-npc': ['trusting'],
          },
        },
      } as GameState;
      
      const modulated = modulateRelationshipDelta('trusting-npc', 'trust', 20, state);
      
      expect(modulated).toBeGreaterThan(20); // Trusting amplifies trust gain
    });
    
    it('reduces trust delta with suspicious trait', () => {
      const state: GameState = {
        turn: 80,
        arcDirector: {
          npcTraits: {
            'suspicious-npc': ['suspicious'],
          },
        },
      } as GameState;
      
      const modulated = modulateRelationshipDelta('suspicious-npc', 'trust', 20, state);
      
      expect(modulated).toBeLessThan(20); // Suspicious reduces trust gain
    });
    
    it('reduces negative delta with forgiving trait', () => {
      const state: GameState = {
        turn: 80,
        arcDirector: {
          npcTraits: {
            'forgiving-npc': ['forgiving'],
          },
        },
      } as GameState;
      
      const modulated = modulateRelationshipDelta('forgiving-npc', 'trust', -30, state);
      
      expect(Math.abs(modulated)).toBeLessThan(30); // Forgiving reduces relationship damage
    });
    
    it('amplifies negative delta with vengeful trait', () => {
      const state: GameState = {
        turn: 80,
        arcDirector: {
          npcTraits: {
            'vengeful-npc': ['vengeful'],
          },
        },
      } as GameState;
      
      const modulated = modulateRelationshipDelta('vengeful-npc', 'loyalty', -20, state);
      
      expect(Math.abs(modulated)).toBeGreaterThan(20); // Vengeful amplifies betrayal
    });
    
    it('checks NPC traits', () => {
      const state: GameState = {
        turn: 90,
        arcDirector: {
          npcTraits: {
            'npc': ['cautious', 'loyal', 'honorable'],
          },
        },
      } as GameState;
      
      expect(hasNpcTrait('npc', 'cautious', state)).toBe(true);
      expect(hasNpcTrait('npc', 'loyal', state)).toBe(true);
      expect(hasNpcTrait('npc', 'bold', state)).toBe(false);
    });
  });
  
  // ============================================================================
  // Cross-NPC Conversation Tracking
  // ============================================================================
  
  describe('Cross-NPC conversation tracking', () => {
    it('records conversation between NPCs', () => {
      const state: GameState = {
        turn: 100,
        sceneFacts: { present: ['aldous', 'oskar', 'witness'] },
      } as GameState;
      
      const next = recordNpcConversation(
        ['aldous', 'oskar'],
        'trade-negotiation',
        'Discussed terms of trade',
        state
      );
      
      const conversations = next.arcDirector?.npcConversations ?? [];
      expect(conversations).toHaveLength(1);
      expect(conversations[0].participants).toEqual(['aldous', 'oskar']);
      expect(conversations[0].topic).toBe('trade-negotiation');
    });
    
    it('records conversation moments for each participant', () => {
      const state: GameState = {
        turn: 105,
        sceneFacts: { present: ['aldous', 'oskar'] },
      } as GameState;
      
      const next = recordNpcConversation(
        ['aldous', 'oskar'],
        'alliance',
        'Agreed to alliance',
        state
      );
      
      const aldousMoments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'aldous')?.keyMoments ?? [];
      const oskarMoments = next.arcDirector?.npcMemories?.find(m => m.npcId === 'oskar')?.keyMoments ?? [];
      
      expect(aldousMoments.some(m => m.category === 'witness' && m.data.topic === 'alliance')).toBe(true);
      expect(oskarMoments.some(m => m.category === 'witness' && m.data.topic === 'alliance')).toBe(true);
    });
    
    it('gets conversations for NPC', () => {
      const state: GameState = { turn: 110 } as GameState;
      
      let next = recordNpcConversation(['aldous', 'oskar'], 'topic1', 'Conversation 1', state);
      next = recordNpcConversation(['aldous', 'trader'], 'topic2', 'Conversation 2', next);
      next = recordNpcConversation(['oskar', 'trader'], 'topic3', 'Conversation 3', next);
      
      const aldousConvs = getConversationsForNpc('aldous', next);
      expect(aldousConvs).toHaveLength(2);
      expect(aldousConvs.every(c => c.participants.includes('aldous'))).toBe(true);
    });
    
    it('gets conversations between two NPCs', () => {
      const state: GameState = { turn: 115 } as GameState;
      
      let next = recordNpcConversation(['aldous', 'oskar'], 'topic1', 'Conv 1', state);
      next = { ...next, turn: 116 };
      next = recordNpcConversation(['aldous', 'oskar'], 'topic2', 'Conv 2', next);
      next = { ...next, turn: 117 };
      next = recordNpcConversation(['aldous', 'trader'], 'topic3', 'Conv 3', next);
      
      const convs = getConversationsBetween('aldous', 'oskar', next);
      expect(convs).toHaveLength(2);
      expect(convs.every(c => c.participants.includes('aldous') && c.participants.includes('oskar'))).toBe(true);
    });
    
    it('caps conversation ledger at 50', () => {
      const state: GameState = { turn: 0 } as GameState;
      let next = state;
      
      // Record 55 conversations
      for (let i = 0; i < 55; i++) {
        next = recordNpcConversation(
          ['npc1', 'npc2'],
          `topic-${i}`,
          `Conversation ${i}`,
          { ...next, turn: i }
        );
      }
      
      const conversations = next.arcDirector?.npcConversations ?? [];
      expect(conversations.length).toBeLessThanOrEqual(50);
    });
  });
  
  // ============================================================================
  // Situation Packet Integration
  // ============================================================================
  
  describe('Cross-NPC situation packet', () => {
    it('builds relationship section', () => {
      const state: GameState = { turn: 120 } as GameState;
      
      let next = updateRelationship('aldous', 'oskar', 'trust', 60, state);
      next = updateRelationship('aldous', 'oskar', 'respect', 40, next);
      next = updateRelationship('aldous', 'trader', 'fear', -30, next);
      
      const section = buildCrossNpcSituationSection('aldous', next);
      
      expect(section).toContain('### NPC RELATIONSHIPS');
      expect(section).toContain('oskar');
      expect(section).toContain('trust');
    });
    
    it('builds conversation section', () => {
      const state: GameState = { turn: 125 } as GameState;
      
      let next = recordNpcConversation(['aldous', 'oskar'], 'deal', 'Trade discussion', state);
      next = { ...next, turn: 126 };
      next = recordNpcConversation(['aldous', 'trader'], 'info', 'Information exchange', next);
      
      const section = buildCrossNpcSituationSection('aldous', next);
      
      expect(section).toContain('### RECENT CONVERSATIONS');
      expect(section).toContain('deal');
      expect(section).toContain('oskar');
    });
    
    it('builds trait section', () => {
      const state: GameState = {
        turn: 130,
        arcDirector: {
          npcTraits: {
            'aldous': ['cautious', 'honorable'],
          },
        },
      } as GameState;
      
      const section = buildCrossNpcSituationSection('aldous', state);
      
      expect(section).toContain('**Traits**');
      expect(section).toContain('cautious');
      expect(section).toContain('honorable');
    });
  });
  
  // ============================================================================
  // Multi-NPC Scenarios
  // ============================================================================
  
  describe('Multi-NPC scenarios', () => {
    it('handles witnessed betrayal affecting multiple NPCs', () => {
      const state: GameState = {
        turn: 140,
        sceneFacts: { present: ['aldous', 'oskar', 'witness1', 'witness2'] },
      } as GameState;
      
      const betrayalMoment = createKeyMoment(
        'aldous',
        'betrayal',
        { summary: 'Broke alliance' },
        state,
        { visibility: 'witnessed' }
      );
      
      const next = propagateKnowledge(betrayalMoment, state);
      
      // All witnesses should have witness moments
      expect(next.arcDirector?.npcMemories?.find(m => m.npcId === 'oskar')?.keyMoments.length).toBeGreaterThan(0);
      expect(next.arcDirector?.npcMemories?.find(m => m.npcId === 'witness1')?.keyMoments.length).toBeGreaterThan(0);
    });
    
    it('tracks relationships after multi-party conversation', () => {
      const state: GameState = {
        turn: 145,
        sceneFacts: { present: ['aldous', 'oskar', 'trader'] },
      } as GameState;
      
      let next = recordNpcConversation(
        ['aldous', 'oskar', 'trader'],
        'alliance',
        'Three-way alliance formed',
        state
      );
      
      // Update relationships based on alliance
      next = updateRelationship('aldous', 'oskar', 'trust', 40, next);
      next = updateRelationship('aldous', 'trader', 'trust', 35, next);
      next = updateRelationship('oskar', 'trader', 'trust', 30, next);
      
      expect(getRelationshipValue('aldous', 'oskar', 'trust', next)).toBe(40);
      expect(getRelationshipValue('aldous', 'trader', 'trust', next)).toBe(35);
      expect(getRelationshipValue('oskar', 'trader', 'trust', next)).toBe(30);
    });
    
    it('handles faction-wide knowledge spread with denial', () => {
      const state: GameState = {
        turn: 150,
        arcDirector: {
          npcLifecycles: [
            { npcId: 'ally1', role: 'faction-envoy', state: 'functioning' } as any,
            { npcId: 'ally2', role: 'faction-envoy', state: 'functioning' } as any,
            { npcId: 'enemy1', role: 'faction-envoy', state: 'functioning' } as any,
          ],
          npcFactionMemberships: {
            ally1: 'guild',
            ally2: 'guild',
            enemy1: 'rival',
          },
        },
      } as GameState;
      
      const moment = createKeyMoment(
        'leader',
        'faction_change',
        {
          factionIds: ['guild'],
          deniedFactionIds: ['rival'],
          summary: 'Secret guild plan',
        },
        state,
        { visibility: 'faction' }
      );
      
      const next = propagateKnowledge(moment, state);
      
      // Guild members should know
      expect(next.arcDirector?.npcMemories?.find(m => m.npcId === 'ally1')?.keyMoments.length).toBeGreaterThan(0);
      
      // Rival should not know (denied)
      expect(filterKnowledgeByFaction('enemy1', moment, state)).toBe(false);
    });
  });
});
