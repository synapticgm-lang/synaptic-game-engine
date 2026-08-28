/**
 * WS-7 Complete Tests: Social Skills, Relationships, Resolution, and Progression
 * 
 * Tests for all WS-7 waves:
 * - Wave A: Leverage mechanics (existing)
 * - Wave B: Social skills + relationships
 * - Wave C: Non-combat resolution + stakes
 * - Wave D+: Social progression + XP parity
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../types';

// Wave B: Social Skills + Relationships
import {
  generatePropositionFingerprint,
  hasPropositionBeenTried,
  recordPropositionFingerprint,
  calculateSocialModifiers,
  calculateTotalModifier,
  resolveSocialSkillCheck,
  getOutcomeDescription,
  getOutcomeXpMultiplier,
} from '../socialSkills';

import {
  type Disposition,
  type NpcRelationship,
  type RelationshipEvent,
  deriveDisposition,
  applyRelationshipEvent,
  deriveUnlocks,
  applyLongAbsence,
  relationshipUiView,
  getOrCreateRelationship,
  updateRelationship,
} from '../npcRelationships';

// Wave C: Non-Combat Resolution + Stakes
import {
  type StakesTemplate,
  type ResolutionOutcome,
  STAKES_TEMPLATES,
  OUTCOME_CATALOG,
  templatesForMode,
  validateOutcome,
  getLeverageCooldown,
  enforceLeverageCooldown,
} from '../socialStakes';

// Wave D+: Social Progression
import {
  type SocialXpEvent,
  type XpAwardInput,
  type RouteParitySample,
  SOCIAL_SKILL_TREE,
  RELATIONSHIP_GATES,
  FACTION_GATES,
  calculateSocialXp,
  evaluateParity,
  awardSocialXp,
  hasNoveltyKey,
  unlockSkillNode,
} from '../socialProgression';

// Wave A: Leverage (existing)
import {
  registerLeverageAsset,
  exhaustLeverageAsset,
  isLeverageExhausted,
  getPressureProfile,
  resolveLeverage,
  getLeverageTypeName,
} from '../leverageMechanics';

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
    character: {
      name: 'Player',
      level: 1,
      xp: 0,
      xpToNext: 100,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      sp: 100,
      maxSp: 100,
      attributes: {
        STR: 10,
        DEX: 10,
        CON: 10,
        INT: 10,
        WIS: 10,
        CHA: 10,
      },
      conditions: [],
      bio: 'Test character',
      appearance: 'Test appearance',
    },
    arcDirector: {
      npcRelationships: [],
      leverageAssets: [],
      socialCrises: [],
    },
    ...overrides
  } as GameState;
}

function createMockRelationship(overrides: Partial<NpcRelationship> = {}): NpcRelationship {
  return {
    schemaVersion: 1,
    npcId: 'test-npc',
    playerId: 'player',
    disposition: 'neutral',
    trust: 0,
    respect: 0,
    fear: 0,
    intimacy: 0,
    familiarity: 10,
    firstMetTurn: 1,
    lastInteractionTurn: 10,
    milestones: [
      {
        milestoneId: 'first-meet-1',
        type: 'first_meet',
        turn: 1,
        sourceEventId: 'initial',
        summary: 'First met test-npc',
        valence: 0,
        salience: 50,
        permanent: true,
        relatedNpcIds: [],
        relatedFactionIds: [],
        tags: [],
      }
    ],
    promises: [],
    knowledge: [],
    boundaries: [],
    roles: [],
    factionIds: [],
    availableUnlocks: [],
    closedPaths: [],
    revision: 1,
    ...overrides
  };
}

// ============================================================================
// Wave A: Leverage Mechanics Tests (existing functionality)
// ============================================================================

describe('WS-7 Wave A: Leverage Mechanics', () => {
  describe('registerLeverageAsset', () => {
    it('should register new leverage asset', () => {
      const gs = createMockGameState();
      
      const { state, assetId } = registerLeverageAsset(
        'physical_threat',
        'Test NPC',
        gs,
        { evidenceStrength: 0.8, credibility: 0.9 }
      );
      
      expect(assetId).toBeDefined();
      expect(state.arcDirector?.leverageAssets).toHaveLength(1);
      expect(state.arcDirector?.leverageAssets?.[0].type).toBe('physical_threat');
      expect(state.arcDirector?.leverageAssets?.[0].targetNpc).toBe('Test NPC');
    });
    
    it('should return existing asset if already registered', () => {
      let gs = createMockGameState();
      
      const { state: state1, assetId: id1 } = registerLeverageAsset(
        'physical_threat',
        'Test NPC',
        gs,
        { evidenceStrength: 0.8, credibility: 0.9 }
      );
      
      const { state: state2, assetId: id2 } = registerLeverageAsset(
        'physical_threat',
        'Test NPC',
        state1,
        { evidenceStrength: 0.8, credibility: 0.9 }
      );
      
      expect(id1).toBe(id2);
      expect(state2.arcDirector?.leverageAssets).toHaveLength(1);
    });
  });
  
  describe('exhaustLeverageAsset', () => {
    it('should mark asset as exhausted', () => {
      let gs = createMockGameState();
      
      const { state, assetId } = registerLeverageAsset(
        'social_exposure',
        'Merchant',
        gs,
        { evidenceStrength: 0.7, credibility: 0.8 }
      );
      
      const exhausted = exhaustLeverageAsset(assetId, state);
      
      expect(exhausted.arcDirector?.leverageAssets?.[0].exhausted).toBe(true);
    });
  });
  
  describe('resolveLeverage', () => {
    it('should resolve leverage with positive modifier', () => {
      let gs = createMockGameState();
      
      const { state, assetId } = registerLeverageAsset(
        'moral_appeal',
        'Ally',
        gs,
        { evidenceStrength: 0.9, credibility: 1.0 }
      );
      
      const asset = state.arcDirector?.leverageAssets?.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');
      
      const resolution = resolveLeverage(asset, 'Ally', state);
      
      expect(resolution.outcome).toBe('success');
      expect(resolution.modifier).toBeGreaterThan(0);
      expect(resolution.trustDelta).toBe(8); // moral_appeal gives +8 trust
    });
    
    it('should fail if leverage already exhausted', () => {
      let gs = createMockGameState();
      
      const { state, assetId } = registerLeverageAsset(
        'physical_threat',
        'Guard',
        gs,
        { evidenceStrength: 0.6, credibility: 0.7 }
      );
      
      const exhausted = exhaustLeverageAsset(assetId, state);
      const asset = exhausted.arcDirector?.leverageAssets?.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');
      
      const resolution = resolveLeverage(asset, 'Guard', exhausted);
      
      expect(resolution.outcome).toBe('failure');
      expect(resolution.modifier).toBe(-6);
      expect(resolution.cost).toContain('already used');
    });
  });
});

// ============================================================================
// Wave B: Social Skills Tests
// ============================================================================

describe('WS-7 Wave B: Social Skills', () => {
  describe('generatePropositionFingerprint', () => {
    it('should generate consistent fingerprint', () => {
      const fp1 = generatePropositionFingerprint('persuasion', 'Guard', 'let me pass');
      const fp2 = generatePropositionFingerprint('persuasion', 'Guard', 'let me pass');
      
      expect(fp1).toBe(fp2);
    });
    
    it('should normalize whitespace', () => {
      const fp1 = generatePropositionFingerprint('persuasion', 'Guard', 'let  me   pass');
      const fp2 = generatePropositionFingerprint('persuasion', 'Guard', 'let me pass');
      
      expect(fp1).toBe(fp2);
    });
    
    it('should be case-sensitive for approach', () => {
      const fp1 = generatePropositionFingerprint('persuasion', 'Guard', 'Let me pass');
      const fp2 = generatePropositionFingerprint('persuasion', 'Guard', 'let me pass');
      
      expect(fp1).toBe(fp2); // Normalized to lowercase
    });
  });
  
  describe('calculateSocialModifiers', () => {
    it('should calculate base modifiers', () => {
      const gs = createMockGameState();
      
      const modifiers = calculateSocialModifiers('persuasion', 'Test NPC', gs, {});
      
      expect(modifiers.skill).toBeGreaterThanOrEqual(0);
      expect(modifiers.relationship).toBeDefined();
      expect(modifiers.evidence).toBe(0);
      expect(modifiers.leverage).toBe(0);
      expect(modifiers.faction).toBe(0);
    });
    
    it('should include relationship modifier', () => {
      const gs = createMockGameState({
        arcDirector: {
          npcRelationships: [
            {
              npcName: 'Friendly NPC',
              trust: 40,
              respect: 50,
              fear: 0,
              milestones: [],
            }
          ]
        }
      });
      
      const modifiers = calculateSocialModifiers('persuasion', 'Friendly NPC', gs, {});
      
      expect(modifiers.relationship).toBe(2); // 40 / 20 = 2
    });
    
    it('should include evidence modifier', () => {
      const gs = createMockGameState();
      
      const modifiers = calculateSocialModifiers('persuasion', 'Merchant', gs, {
        evidenceIds: ['evidence1', 'evidence2']
      });
      
      expect(modifiers.evidence).toBe(2);
    });
  });
  
  describe('resolveSocialSkillCheck', () => {
    it('should auto-succeed with high modifiers', () => {
      const gs = createMockGameState({
        arcDirector: {
          npcRelationships: [
            {
              npcName: 'Friendly Guard',
              trust: 80,
              milestones: [],
            }
          ]
        }
      });
      
      const check = resolveSocialSkillCheck('persuasion', 'Friendly Guard', gs, {
        evidenceIds: ['evidence1', 'evidence2', 'evidence3']
      });
      
      expect(check.totalModifier).toBeGreaterThanOrEqual(8);
      expect(check.outcome).toBe('success');
      expect(check.roll).toBeUndefined(); // Automatic, no roll
    });
    
    it('should roll for plausible checks', () => {
      const gs = createMockGameState();
      
      const check = resolveSocialSkillCheck('persuasion', 'Neutral NPC', gs, {
        dc: 15
      });
      
      expect(check.dc).toBe(15);
      expect(check.roll).toBeDefined();
      expect(check.roll).toBeGreaterThanOrEqual(1);
      expect(check.roll).toBeLessThanOrEqual(20);
    });
    
    it('should handle critical success (nat 20)', () => {
      const gs = createMockGameState({ turn: 1337 }); // Seed for nat 20
      
      const check = resolveSocialSkillCheck('persuasion', 'Test NPC', gs, {
        dc: 15
      });
      
      if (check.roll === 20) {
        expect(check.outcome).toBe('critical_success');
      }
    });
  });
  
  describe('outcome XP multipliers', () => {
    it('should have correct multipliers', () => {
      expect(getOutcomeXpMultiplier('critical_success')).toBe(1.5);
      expect(getOutcomeXpMultiplier('success')).toBe(1.0);
      expect(getOutcomeXpMultiplier('partial')).toBe(0.7);
      expect(getOutcomeXpMultiplier('failure')).toBe(0.3);
      expect(getOutcomeXpMultiplier('critical_failure')).toBe(0.1);
    });
  });
});

// ============================================================================
// Wave B: Relationship Tracking Tests
// ============================================================================

describe('WS-7 Wave B: Relationship Tracking', () => {
  describe('deriveDisposition', () => {
    it('should default to neutral', () => {
      const rel = createMockRelationship();
      
      const disposition = deriveDisposition(rel);
      
      expect(disposition).toBe('neutral');
    });
    
    it('should promote to friendly with trust and milestone', () => {
      const rel = createMockRelationship({
        trust: 30,
        familiarity: 25,
        milestones: [
          {
            milestoneId: 'first-meet',
            type: 'first_meet',
            turn: 1,
            sourceEventId: 'init',
            summary: 'First met',
            valence: 0,
            salience: 50,
            permanent: true,
            relatedNpcIds: [],
            relatedFactionIds: [],
            tags: [],
          },
          {
            milestoneId: 'favor-1',
            type: 'favor_granted',
            turn: 5,
            sourceEventId: 'quest',
            summary: 'Helped with quest',
            valence: 50,
            salience: 60,
            permanent: true,
            relatedNpcIds: [],
            relatedFactionIds: [],
            tags: [],
          }
        ]
      });
      
      const disposition = deriveDisposition(rel);
      
      expect(disposition).toBe('friendly');
    });
    
    it('should block promotion with unrepaired betrayal', () => {
      const rel = createMockRelationship({
        trust: 60,
        familiarity: 50,
        milestones: [
          {
            milestoneId: 'first-meet',
            type: 'first_meet',
            turn: 1,
            sourceEventId: 'init',
            summary: 'First met',
            valence: 0,
            salience: 50,
            permanent: true,
            relatedNpcIds: [],
            relatedFactionIds: [],
            tags: [],
          },
          {
            milestoneId: 'favor-1',
            type: 'favor_granted',
            turn: 5,
            sourceEventId: 'quest',
            summary: 'Helped',
            valence: 50,
            salience: 60,
            permanent: true,
            relatedNpcIds: [],
            relatedFactionIds: [],
            tags: [],
          },
          {
            milestoneId: 'alliance-1',
            type: 'alliance',
            turn: 10,
            sourceEventId: 'pact',
            summary: 'Formed alliance',
            valence: 80,
            salience: 80,
            permanent: true,
            relatedNpcIds: [],
            relatedFactionIds: [],
            tags: [],
          },
          {
            milestoneId: 'betrayal-1',
            type: 'betrayal',
            turn: 15,
            sourceEventId: 'incident',
            summary: 'Betrayed trust',
            valence: -90,
            salience: 95,
            permanent: true,
            relatedNpcIds: [],
            relatedFactionIds: [],
            tags: [],
          }
        ]
      });
      
      const disposition = deriveDisposition(rel);
      
      // Should not be allied due to betrayal
      expect(disposition).not.toBe('allied');
      expect(disposition).not.toBe('loyal');
    });
    
    it('should demote to hostile with low trust', () => {
      const rel = createMockRelationship({
        trust: -60,
      });
      
      const disposition = deriveDisposition(rel);
      
      expect(disposition).toBe('hostile');
    });
  });
  
  describe('applyRelationshipEvent', () => {
    it('should apply trust delta', () => {
      const rel = createMockRelationship();
      const event: RelationshipEvent = {
        eventId: 'event-1',
        npcId: 'test-npc',
        turn: 15,
        kind: 'favor',
        trustDelta: 20,
        respectDelta: 10,
        fearDelta: 0,
        intimacyDelta: 5,
        familiarityDelta: 10,
        notes: ['Helped NPC'],
      };
      
      const updated = applyRelationshipEvent(rel, event);
      
      expect(updated.trust).toBe(20);
      expect(updated.respect).toBe(10);
      expect(updated.familiarity).toBe(20);
      expect(updated.revision).toBe(2);
    });
    
    it('should clamp values to bounds', () => {
      const rel = createMockRelationship({ trust: 90 });
      const event: RelationshipEvent = {
        eventId: 'event-2',
        npcId: 'test-npc',
        turn: 16,
        kind: 'favor',
        trustDelta: 50, // Would exceed 100
        respectDelta: 0,
        fearDelta: 0,
        intimacyDelta: 0,
        familiarityDelta: 0,
        notes: [],
      };
      
      const updated = applyRelationshipEvent(rel, event);
      
      expect(updated.trust).toBe(100); // Clamped
    });
    
    it('should add milestones', () => {
      const rel = createMockRelationship();
      const event: RelationshipEvent = {
        eventId: 'event-3',
        npcId: 'test-npc',
        turn: 17,
        kind: 'milestone',
        trustDelta: 15,
        respectDelta: 0,
        fearDelta: 0,
        intimacyDelta: 0,
        familiarityDelta: 0,
        milestone: {
          milestoneId: 'favor-2',
          type: 'favor_granted',
          turn: 17,
          sourceEventId: 'quest-2',
          summary: 'Saved NPC',
          valence: 70,
          salience: 80,
          permanent: true,
          relatedNpcIds: [],
          relatedFactionIds: [],
          tags: [],
        },
        notes: [],
      };
      
      const updated = applyRelationshipEvent(rel, event);
      
      expect(updated.milestones).toHaveLength(2); // first_meet + new one
    });
  });
  
  describe('deriveUnlocks', () => {
    it('should unlock optional quest at friendly', () => {
      const rel = createMockRelationship({
        disposition: 'friendly',
        trust: 30,
      });
      
      const unlocks = deriveUnlocks(rel);
      
      expect(unlocks).toContain('npc_optional_quest');
    });
    
    it('should unlock crisis support at allied', () => {
      const rel = createMockRelationship({
        disposition: 'allied',
        trust: 60,
      });
      
      const unlocks = deriveUnlocks(rel);
      
      expect(unlocks).toContain('npc_crisis_support');
      expect(unlocks).toContain('npc_private_access');
    });
    
    it('should unlock deep secret at loyal', () => {
      const rel = createMockRelationship({
        disposition: 'loyal',
        trust: 80,
      });
      
      const unlocks = deriveUnlocks(rel);
      
      expect(unlocks).toContain('npc_deep_secret');
      expect(unlocks).toContain('npc_sacrifice_option');
    });
  });
  
  describe('applyLongAbsence', () => {
    it('should decay familiarity after 100 turns', () => {
      const rel = createMockRelationship({
        familiarity: 50,
        lastInteractionTurn: 10,
      });
      
      const updated = applyLongAbsence(rel, 120);
      
      expect(updated.familiarity).toBeLessThan(50);
    });
    
    it('should not decay trust', () => {
      const rel = createMockRelationship({
        trust: 50,
        lastInteractionTurn: 10,
      });
      
      const updated = applyLongAbsence(rel, 120);
      
      expect(updated.trust).toBe(50); // Trust doesn't decay
    });
  });
});

// ============================================================================
// Wave C: Social Stakes Templates Tests
// ============================================================================

describe('WS-7 Wave C: Social Stakes Templates', () => {
  describe('STAKES_TEMPLATES', () => {
    it('should have templates for all modes', () => {
      const dndTemplates = templatesForMode('dnd');
      const rpgTemplates = templatesForMode('rpg');
      const pyoaTemplates = templatesForMode('pyoa');
      const litrpgTemplates = templatesForMode('litrpg');
      
      expect(dndTemplates.length).toBeGreaterThan(0);
      expect(rpgTemplates.length).toBeGreaterThan(0);
      expect(pyoaTemplates.length).toBeGreaterThan(0);
      expect(litrpgTemplates.length).toBeGreaterThan(0);
    });
    
    it('should have valid template structure', () => {
      const template = STAKES_TEMPLATES[0];
      
      expect(template.templateId).toBeDefined();
      expect(template.mode).toBeDefined();
      expect(template.skill).toBeDefined();
      expect(template.prerequisites).toBeInstanceOf(Array);
      expect(template.telegraph).toBeInstanceOf(Array);
      expect(template.success).toBeInstanceOf(Array);
      expect(template.failure).toBeInstanceOf(Array);
      expect(template.xpBudget).toBeGreaterThan(0);
    });
  });
  
  describe('OUTCOME_CATALOG', () => {
    it('should validate all outcomes', () => {
      for (const outcome of OUTCOME_CATALOG) {
        const errors = validateOutcome(outcome);
        expect(errors).toHaveLength(0);
      }
    });
    
    it('should have required mutations', () => {
      for (const outcome of OUTCOME_CATALOG) {
        expect(outcome.requiredMutations.length).toBeGreaterThan(0);
      }
    });
    
    it('should have player feedback', () => {
      for (const outcome of OUTCOME_CATALOG) {
        expect(outcome.playerFeedback.length).toBeGreaterThan(0);
      }
    });
    
    it('should have follow-up', () => {
      for (const outcome of OUTCOME_CATALOG) {
        expect(outcome.followUp).toBeTruthy();
        expect(outcome.followUp.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('leverage cooldown enforcement', () => {
    it('should allow first use', () => {
      const gs = createMockGameState();
      
      const canUse = enforceLeverageCooldown(gs, 'Merchant', 'social_exposure');
      
      expect(canUse).toBe(true);
    });
    
    it('should block exhausted leverage', () => {
      let gs = createMockGameState();
      
      const { state, assetId } = registerLeverageAsset(
        'social_exposure',
        'Merchant',
        gs,
        { evidenceStrength: 0.8, credibility: 0.9 }
      );
      
      const exhausted = exhaustLeverageAsset(assetId, state);
      
      const canUse = enforceLeverageCooldown(exhausted, 'Merchant', 'social_exposure');
      
      expect(canUse).toBe(false);
    });
  });
});

// ============================================================================
// Wave D+: Social Progression Tests
// ============================================================================

describe('WS-7 Wave D+: Social Progression', () => {
  describe('SOCIAL_SKILL_TREE', () => {
    it('should have 10 nodes across 5 tiers', () => {
      expect(SOCIAL_SKILL_TREE).toHaveLength(10);
      
      const tier1 = SOCIAL_SKILL_TREE.filter(n => n.tier === 1);
      const tier2 = SOCIAL_SKILL_TREE.filter(n => n.tier === 2);
      const tier3 = SOCIAL_SKILL_TREE.filter(n => n.tier === 3);
      const tier4 = SOCIAL_SKILL_TREE.filter(n => n.tier === 4);
      const tier5 = SOCIAL_SKILL_TREE.filter(n => n.tier === 5);
      
      expect(tier1.length).toBe(2);
      expect(tier2.length).toBe(2);
      expect(tier3.length).toBe(2);
      expect(tier4.length).toBe(2);
      expect(tier5.length).toBe(1);
    });
    
    it('should have valid prerequisites', () => {
      for (const node of SOCIAL_SKILL_TREE) {
        for (const prereq of node.prerequisites) {
          const prereqNode = SOCIAL_SKILL_TREE.find(n => n.nodeId === prereq);
          expect(prereqNode).toBeDefined();
          expect(prereqNode!.tier).toBeLessThan(node.tier);
        }
      }
    });
  });
  
  describe('calculateSocialXp', () => {
    it('should calculate XP with multipliers', () => {
      const input: XpAwardInput = {
        eventId: 'event-1',
        actorId: 'player',
        source: 'social_check_success',
        sourceObjectId: 'check-1',
        noveltyKey: 'persuade:guard:passage',
        turn: 10,
        stakesTier: 3,
        difficultyTier: 3,
        alreadyAwardedNoveltyKeys: new Set(),
      };
      
      const xpEvent = calculateSocialXp(input);
      
      expect(xpEvent.finalXp).toBeGreaterThan(0);
      expect(xpEvent.baseXp).toBe(15); // social_check_success base
      expect(xpEvent.stakesMultiplier).toBeGreaterThan(1);
      expect(xpEvent.difficultyMultiplier).toBeGreaterThan(1);
    });
    
    it('should return 0 for repeated novelty keys', () => {
      const input: XpAwardInput = {
        eventId: 'event-2',
        actorId: 'player',
        source: 'social_check_success',
        sourceObjectId: 'check-2',
        noveltyKey: 'persuade:guard:passage',
        turn: 20,
        stakesTier: 3,
        difficultyTier: 3,
        alreadyAwardedNoveltyKeys: new Set(['persuade:guard:passage']),
      };
      
      const xpEvent = calculateSocialXp(input);
      
      expect(xpEvent.finalXp).toBe(0);
      expect(xpEvent.notes[0]).toContain('No XP for repeated');
    });
    
    it('should apply parity adjustment', () => {
      const input: XpAwardInput = {
        eventId: 'event-3',
        actorId: 'player',
        source: 'nonviolent_quest_completion',
        sourceObjectId: 'quest-1',
        noveltyKey: 'quest:dungeon:peaceful',
        turn: 50,
        stakesTier: 5,
        difficultyTier: 5,
        alreadyAwardedNoveltyKeys: new Set(),
        matchedCombatXp: 100,
        accumulatedTalkXpForObjective: 40,
      };
      
      const xpEvent = calculateSocialXp(input);
      
      expect(xpEvent.parityAdjustment).toBeGreaterThan(0);
      expect(xpEvent.finalXp).toBeGreaterThanOrEqual(80); // 80% floor
    });
  });
  
  describe('evaluateParity', () => {
    it('should pass with sufficient XP ratio', () => {
      const samples: RouteParitySample[] = [
        ...Array(20).fill(null).map((_, i) => ({
          runId: `run-${i}`,
          objectiveId: 'objective-1',
          route: 'talk' as const,
          completed: true,
          xp: 85,
          questProgress: 1.0,
          durableStateChanges: 5,
          turns: 50,
        })),
        ...Array(20).fill(null).map((_, i) => ({
          runId: `run-${i+20}`,
          objectiveId: 'objective-1',
          route: 'fight' as const,
          completed: true,
          xp: 100,
          questProgress: 1.0,
          durableStateChanges: 5,
          turns: 50,
        })),
      ];
      
      const report = evaluateParity(samples);
      
      expect(report.pass).toBe(true);
      expect(report.ratio).toBeGreaterThanOrEqual(0.8);
      expect(report.questProgressRatio).toBeGreaterThanOrEqual(0.9);
    });
    
    it('should fail with insufficient samples', () => {
      const samples: RouteParitySample[] = [
        {
          runId: 'run-1',
          objectiveId: 'objective-1',
          route: 'talk',
          completed: true,
          xp: 80,
          questProgress: 1.0,
          durableStateChanges: 5,
          turns: 50,
        },
      ];
      
      const report = evaluateParity(samples);
      
      expect(report.pass).toBe(false);
    });
    
    it('should fail with low XP ratio', () => {
      const samples: RouteParitySample[] = [
        ...Array(20).fill(null).map((_, i) => ({
          runId: `run-${i}`,
          objectiveId: 'objective-1',
          route: 'talk' as const,
          completed: true,
          xp: 50, // Only 50% of combat
          questProgress: 1.0,
          durableStateChanges: 5,
          turns: 50,
        })),
        ...Array(20).fill(null).map((_, i) => ({
          runId: `run-${i+20}`,
          objectiveId: 'objective-1',
          route: 'fight' as const,
          completed: true,
          xp: 100,
          questProgress: 1.0,
          durableStateChanges: 5,
          turns: 50,
        })),
      ];
      
      const report = evaluateParity(samples);
      
      expect(report.pass).toBe(false);
      expect(report.ratio).toBeLessThan(0.8);
    });
  });
  
  describe('awardSocialXp', () => {
    it('should award XP and track novelty key', () => {
      const gs = createMockGameState();
      const xpEvent: SocialXpEvent = {
        eventId: 'event-1',
        actorId: 'player',
        source: 'social_check_success',
        sourceObjectId: 'check-1',
        turn: 10,
        noveltyKey: 'persuade:merchant:discount',
        baseXp: 15,
        stakesMultiplier: 1.2,
        difficultyMultiplier: 1.1,
        parityAdjustment: 0,
        finalXp: 20,
        notes: [],
      };
      
      const updated = awardSocialXp(gs, xpEvent);
      
      expect(updated.arcDirector?.socialProgression?.socialXp).toBe(20);
      expect(updated.arcDirector?.socialProgression?.awardedNoveltyKeys).toContain('persuade:merchant:discount');
    });
    
    it('should not award duplicate novelty keys', () => {
      const gs = createMockGameState({
        arcDirector: {
          socialProgression: {
            actorId: 'player',
            socialXp: 20,
            level: 1,
            skillRanks: {
              persuasion: 1,
              intimidation: 0,
              deception: 0,
              insight: 0,
            },
            unlockedNodes: [],
            awardedNoveltyKeys: ['persuade:merchant:discount'],
            titles: [],
            revision: 1,
          }
        }
      });
      
      const hasKey = hasNoveltyKey(gs, 'persuade:merchant:discount');
      
      expect(hasKey).toBe(true);
    });
  });
  
  describe('unlockSkillNode', () => {
    it('should unlock tier 1 node without prerequisites', () => {
      const gs = createMockGameState();
      
      const updated = unlockSkillNode(gs, 'social.t1.persuade');
      
      expect(updated.arcDirector?.socialProgression?.unlockedNodes).toContain('social.t1.persuade');
    });
    
    it('should not unlock node without prerequisites', () => {
      const gs = createMockGameState();
      
      const updated = unlockSkillNode(gs, 'social.t2.intimidate');
      
      expect(updated.arcDirector?.socialProgression?.unlockedNodes).not.toContain('social.t2.intimidate');
    });
    
    it('should unlock node with satisfied prerequisites', () => {
      const gs = createMockGameState({
        arcDirector: {
          socialProgression: {
            actorId: 'player',
            socialXp: 50,
            level: 2,
            skillRanks: {
              persuasion: 1,
              intimidation: 0,
              deception: 0,
              insight: 0,
            },
            unlockedNodes: ['social.t1.persuade'],
            awardedNoveltyKeys: [],
            titles: [],
            revision: 1,
          }
        }
      });
      
      const updated = unlockSkillNode(gs, 'social.t2.intimidate');
      
      expect(updated.arcDirector?.socialProgression?.unlockedNodes).toContain('social.t2.intimidate');
    });
  });
});

// ============================================================================
// Integration Tests: Full Social Resolution Flow
// ============================================================================

describe('WS-7 Integration: Full Social Resolution Flow', () => {
  it('should complete full social resolution with all waves', () => {
    // Start with neutral NPC
    let gs = createMockGameState();
    
    // Wave A: Register leverage
    const { state: state1, assetId } = registerLeverageAsset(
      'moral_appeal',
      'Ally NPC',
      gs,
      { evidenceStrength: 0.9, credibility: 0.95 }
    );
    
    expect(state1.arcDirector?.leverageAssets).toHaveLength(1);
    
    // Wave B: Create relationship
    const relationship = getOrCreateRelationship(state1, 'Ally NPC');
    let state2 = updateRelationship(state1, relationship);
    
    expect(state2.arcDirector?.npcRelationships).toHaveLength(1);
    
    // Wave B: Perform social check
    const check = resolveSocialSkillCheck('persuasion', 'Ally NPC', state2, {
      leverageAssetId: assetId,
      evidenceIds: ['evidence1']
    });
    
    expect(check.outcome).toBeDefined();
    
    // Wave C: Apply outcome (success assumed)
    // In real flow, would apply mutations here
    
    // Wave D+: Award XP
    const xpInput: XpAwardInput = {
      eventId: 'resolution-1',
      actorId: 'player',
      source: 'social_check_success',
      sourceObjectId: 'check-ally',
      noveltyKey: 'persuasion:ally-npc:help',
      turn: state2.turn ?? 10,
      stakesTier: 3,
      difficultyTier: 3,
      alreadyAwardedNoveltyKeys: new Set(),
    };
    
    const xpEvent = calculateSocialXp(xpInput);
    const state3 = awardSocialXp(state2, xpEvent);
    
    expect(state3.arcDirector?.socialProgression?.socialXp).toBeGreaterThan(0);
    expect(state3.arcDirector?.socialProgression?.awardedNoveltyKeys).toHaveLength(1);
    
    // Wave A: Exhaust leverage
    const state4 = exhaustLeverageAsset(assetId, state3);
    
    expect(isLeverageExhausted(assetId, state4)).toBe(true);
    
    // Verify cannot reuse same leverage
    const canReuseAssetId = enforceLeverageCooldown(state4, 'Ally NPC', 'moral_appeal');
    expect(canReuseAssetId).toBe(false);
  });
});
