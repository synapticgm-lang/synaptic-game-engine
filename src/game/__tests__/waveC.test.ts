/**
 * Wave C Tests: Integration and Hardening
 * 
 * Tests for:
 * - WS-2 Wave C: Memory retrieval, grounding verification
 * - WS-4 Wave C: Density governance, variety scoring
 * - WS-5 Wave C: Convergence detection, catalog validation
 */

import { describe, it, expect } from 'vitest';

// WS-2 Wave C
import {
  scoreMemoryRelevance,
  selectMemoriesForPacket,
  verifyMemoryGrounding,
  buildNpcPacket,
  formatNpcPacketSection
} from '../npcMemoryRetrieval';

// WS-4 Wave C
import {
  getDensityProfile,
  getDensityState,
  updateDensityState,
  checkDrought,
  checkSaturation,
  hasRoleQuota,
  getAvailableRoles,
  scoreTemplateVariety,
  rankByVariety,
  selectEncounterWithDensity,
  shouldSpawnEncounter
} from '../encounterDensity';

// WS-5 Wave C
import {
  extractBranchState,
  compareBranchStates,
  detectConvergencePoints,
  checkConvergence,
  validateMerge,
  inspectCatalogStructure,
  validateCatalog,
  buildFogOfWarJournalSection,
  getConvergenceTelemetry
} from '../pyoaConvergence';

import type { GameState } from '../types';
import type { NpcMemoryLedger, KeyMoment } from '../npcMemoryLedger';
import type { DensityState } from '../encounterDensity';
import type { EncounterTemplate } from '../encounterBible';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn: 50,
    hp: 100,
    maxHp: 100,
    engineMode: 'litrpg',
    currentLocation: 'test_dungeon',
    inventory: { items: [], equipped: {} },
    quests: [],
    arcDirector: {
      npcLifecycles: [],
      npcMemories: [],
      pyoaDelayedConsequences: [],
      appliedReceipts: [],
      densityState: undefined,
      exclusiveFacts: {},
      pyoaCrisisHistory: []
    },
    ...overrides
  } as GameState;
}

function createMockMemory(overrides: Partial<KeyMoment> = {}): KeyMoment {
  return {
    id: 'memory_1',
    npcId: 'test_npc',
    actorId: 'test_actor',
    turn: 10,
    category: 'incidental',
    summary: 'Test memory',
    fact: 'test_fact',
    retention: 'temporary',
    ...overrides
  };
}

function createMockLedger(memories: KeyMoment[] = []): NpcMemoryLedger {
  return {
    npcId: 'test_npc',
    memories,
    lastCleanup: 0
  };
}

function createMockTemplate(overrides: Partial<EncounterTemplate> = {}): EncounterTemplate {
  return {
    id: 'template_1',
    role: 'trash',
    biome: 'dungeon',
    telegraph: { channels: [], cues: [] },
    stakes: { requirements: [], outcomes: [] },
    resolution: { mechanics: [] },
    aftermath: { receiptTypes: [] },
    ...overrides
  } as EncounterTemplate;
}

// ============================================================================
// WS-2 Wave C: Memory Retrieval Tests
// ============================================================================

describe('WS-2 Wave C: Memory Retrieval', () => {
  describe('scoreMemoryRelevance', () => {
    it('should score pinned memories highest', () => {
      const memory = createMockMemory({ retention: 'permanent' });
      
      const score = scoreMemoryRelevance(memory, { currentTurn: 50 });
      
      expect(score.signals.pinned).toBe(100);
      expect(score.score).toBeGreaterThan(90);
    });
    
    it('should score unresolved obligations high', () => {
      const memory = createMockMemory({ actorId: 'guide_npc' });
      
      const score = scoreMemoryRelevance(memory, {
        currentTurn: 50,
        unresolvedObligations: ['guide_npc']
      });
      
      expect(score.signals.unresolved).toBe(80);
    });
    
    it('should apply recency decay', () => {
      const recentMemory = createMockMemory({ turn: 45 });
      const oldMemory = createMockMemory({ turn: 10 });
      
      const recentScore = scoreMemoryRelevance(recentMemory, { currentTurn: 50 });
      const oldScore = scoreMemoryRelevance(oldMemory, { currentTurn: 50 });
      
      expect(recentScore.signals.recency).toBeGreaterThan(oldScore.signals.recency);
    });
  });
  
  describe('selectMemoriesForPacket', () => {
    it('should select top memories by score', () => {
      const memories = [
        createMockMemory({ id: 'mem1', turn: 10, retention: 'permanent' }),
        createMockMemory({ id: 'mem2', turn: 20, retention: 'temporary' }),
        createMockMemory({ id: 'mem3', turn: 30, retention: 'temporary' })
      ];
      
      const ledger = createMockLedger(memories);
      
      const selection = selectMemoriesForPacket(ledger, {
        currentTurn: 50,
        maxMemories: 2
      });
      
      expect(selection.selected.length).toBe(2);
      expect(selection.selected[0].id).toBe('mem1'); // Pinned first
    });
    
    it('should enforce mandatory memories', () => {
      const memories = [
        createMockMemory({ id: 'mem1', turn: 10 }),
        createMockMemory({ id: 'mem2', turn: 20 }),
        createMockMemory({ id: 'mem3', turn: 30 })
      ];
      
      const ledger = createMockLedger(memories);
      
      const selection = selectMemoriesForPacket(ledger, {
        currentTurn: 50,
        maxMemories: 2,
        mandatoryMemoryIds: ['mem2']
      });
      
      expect(selection.selected).toContainEqual(expect.objectContaining({ id: 'mem2' }));
      expect(selection.mandatory.length).toBe(1);
    });
    
    it('should exclude forbidden memories', () => {
      const memories = [
        createMockMemory({ id: 'mem1' }),
        createMockMemory({ id: 'mem2' }),
        createMockMemory({ id: 'mem3' })
      ];
      
      const ledger = createMockLedger(memories);
      
      const selection = selectMemoriesForPacket(ledger, {
        currentTurn: 50,
        forbiddenEventIds: ['mem2']
      });
      
      expect(selection.selected).not.toContainEqual(expect.objectContaining({ id: 'mem2' }));
      expect(selection.forbidden).toContain('mem2');
    });
  });
  
  describe('verifyMemoryGrounding', () => {
    it('should detect ungrounded actor references', () => {
      const gmOutput = 'You remember when Aldous betrayed you';
      const memories = [
        createMockMemory({ actorId: 'Oskar' }) // Different actor
      ];
      
      const check = verifyMemoryGrounding(gmOutput, memories);
      
      expect(check.warnings.length).toBeGreaterThan(0);
      expect(check.warnings[0]).toContain('Aldous');
    });
    
    it('should pass when actors are in memories', () => {
      const gmOutput = 'You remember when Aldous helped you';
      const memories = [
        createMockMemory({ actorId: 'Aldous', summary: 'Aldous helped' })
      ];
      
      const check = verifyMemoryGrounding(gmOutput, memories);
      
      expect(check.warnings.length).toBe(0);
    });
  });
});

// ============================================================================
// WS-4 Wave C: Density Governance Tests
// ============================================================================

describe('WS-4 Wave C: Density Governance', () => {
  describe('getDensityProfile', () => {
    it('should return LitRPG dungeon profile', () => {
      const profile = getDensityProfile('litrpg', 'dungeon_1', true);
      
      expect(profile.engineMode).toBe('litrpg');
      expect(profile.trashQuota.min).toBe(4);
      expect(profile.droughtTimer).toBe(15);
    });
    
    it('should return DnD profile', () => {
      const profile = getDensityProfile('dnd', 'forest', false);
      
      expect(profile.engineMode).toBe('dnd');
      expect(profile.droughtTimer).toBe(8);
    });
  });
  
  describe('checkDrought', () => {
    it('should detect drought when timer exceeded', () => {
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 0,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 20,
        recentEncounters: [],
        recentRoles: []
      };
      
      const drought = checkDrought(profile, state);
      
      expect(drought.isDrought).toBe(true);
      expect(drought.turnsElapsed).toBe(20);
    });
    
    it('should not detect drought when under timer', () => {
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 0,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 10,
        recentEncounters: [],
        recentRoles: []
      };
      
      const drought = checkDrought(profile, state);
      
      expect(drought.isDrought).toBe(false);
    });
  });
  
  describe('checkSaturation', () => {
    it('should detect saturation when limit exceeded', () => {
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 0,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 0,
        recentEncounters: [
          { encounterId: 'e1', templateId: 't1', role: 'trash', turn: 48 },
          { encounterId: 'e2', templateId: 't2', role: 'trash', turn: 49 }
        ],
        recentRoles: ['trash', 'trash']
      };
      
      const saturation = checkSaturation(profile, state, 50);
      
      expect(saturation.isSaturated).toBe(true);
    });
  });
  
  describe('getAvailableRoles', () => {
    it('should return available roles under quota', () => {
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 2,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 0,
        recentEncounters: [],
        recentRoles: []
      };
      
      const available = getAvailableRoles(profile, state);
      
      expect(available).toContain('trash');
      expect(available).toContain('elite');
      expect(available).toContain('boss');
    });
    
    it('should exclude roles at max quota', () => {
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 6, // At max
        eliteEncountered: 0,
        bossEncountered: 1, // At max
        turnsSinceEncounter: 0,
        recentEncounters: [],
        recentRoles: []
      };
      
      const available = getAvailableRoles(profile, state);
      
      expect(available).not.toContain('trash');
      expect(available).toContain('elite');
      expect(available).not.toContain('boss');
    });
  });
  
  describe('scoreTemplateVariety', () => {
    it('should penalize recent role repeats', () => {
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 2,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 0,
        recentEncounters: [],
        recentRoles: ['trash', 'trash', 'trash']
      };
      
      const score = scoreTemplateVariety('template_1', 'trash', state);
      
      expect(score.penalties.recentRole).toBeGreaterThan(0);
      expect(score.score).toBeLessThan(100);
    });
    
    it('should penalize exact template repeats', () => {
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 2,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 0,
        recentEncounters: [
          { encounterId: 'e1', templateId: 'template_1', role: 'trash', turn: 45 },
          { encounterId: 'e2', templateId: 'template_1', role: 'trash', turn: 48 }
        ],
        recentRoles: []
      };
      
      const score = scoreTemplateVariety('template_1', 'trash', state);
      
      expect(score.penalties.recentTemplate).toBeGreaterThan(0);
    });
  });
  
  describe('shouldSpawnEncounter', () => {
    it('should spawn during drought', () => {
      const gs = createMockGameState({ engineMode: 'litrpg', turn: 50 });
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 2,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 20,
        recentEncounters: [],
        recentRoles: []
      };
      
      const result = shouldSpawnEncounter(gs, profile, state);
      
      expect(result.shouldSpawn).toBe(true);
      expect(result.reason).toContain('Drought');
    });
    
    it('should not spawn if saturated', () => {
      const gs = createMockGameState({ engineMode: 'litrpg', turn: 50 });
      const profile = getDensityProfile('litrpg', 'dungeon', true);
      const state: DensityState = {
        locationId: 'dungeon',
        trashEncountered: 2,
        eliteEncountered: 0,
        bossEncountered: 0,
        turnsSinceEncounter: 0,
        recentEncounters: [
          { encounterId: 'e1', templateId: 't1', role: 'trash', turn: 48 },
          { encounterId: 'e2', templateId: 't2', role: 'trash', turn: 49 }
        ],
        recentRoles: []
      };
      
      const result = shouldSpawnEncounter(gs, profile, state);
      
      expect(result.shouldSpawn).toBe(false);
      expect(result.reason).toContain('Saturation');
    });
  });
});

// ============================================================================
// WS-5 Wave C: Convergence Detection Tests
// ============================================================================

describe('WS-5 Wave C: Convergence Detection', () => {
  describe('extractBranchState', () => {
    it('should extract exclusive facts', () => {
      const gs = createMockGameState({
        arcDirector: {
          exclusiveFacts: {
            'ally_chosen': true,
            'betrayer_marked': false
          }
        }
      });
      
      const state = extractBranchState('test', gs);
      
      expect(state.activeFacts.has('ally_chosen')).toBe(true);
      expect(state.excludedFacts.has('betrayer_marked')).toBe(true);
    });
  });
  
  describe('compareBranchStates', () => {
    it('should detect equivalent states', () => {
      const stateA = {
        branchId: 'A',
        activeFacts: new Set(['fact1', 'fact2']),
        excludedFacts: new Set(['fact3']),
        crisisPath: []
      };
      
      const stateB = {
        branchId: 'B',
        activeFacts: new Set(['fact1', 'fact2']),
        excludedFacts: new Set(['fact3']),
        crisisPath: []
      };
      
      const comparison = compareBranchStates(stateA, stateB);
      
      expect(comparison.equivalent).toBe(true);
      expect(comparison.sharedFacts).toEqual(['fact1', 'fact2']);
    });
    
    it('should detect different states', () => {
      const stateA = {
        branchId: 'A',
        activeFacts: new Set(['fact1']),
        excludedFacts: new Set(),
        crisisPath: []
      };
      
      const stateB = {
        branchId: 'B',
        activeFacts: new Set(['fact2']),
        excludedFacts: new Set(),
        crisisPath: []
      };
      
      const comparison = compareBranchStates(stateA, stateB);
      
      expect(comparison.equivalent).toBe(false);
      expect(comparison.differentFacts).toContain('fact1');
      expect(comparison.differentFacts).toContain('fact2');
    });
  });
  
  describe('detectConvergencePoints', () => {
    it('should find convergence points for thornferry-road', () => {
      const points = detectConvergencePoints('thornferry-road');
      
      expect(points.length).toBeGreaterThan(0);
      expect(points[0].crisisId).toBeDefined();
      expect(points[0].convergingBranches.length).toBeGreaterThan(1);
    });
  });
  
  describe('validateMerge', () => {
    it('should allow merge with no conflicts', () => {
      const source = {
        branchId: 'source',
        activeFacts: new Set(['fact1']),
        excludedFacts: new Set(['fact2']),
        crisisPath: []
      };
      
      const target = {
        branchId: 'target',
        activeFacts: new Set(['fact1']),
        excludedFacts: new Set(['fact2']),
        crisisPath: []
      };
      
      const validation = validateMerge(source, target);
      
      expect(validation.valid).toBe(true);
      expect(validation.conflicts.length).toBe(0);
    });
    
    it('should detect merge conflicts', () => {
      const source = {
        branchId: 'source',
        activeFacts: new Set(['fact1']),
        excludedFacts: new Set(),
        crisisPath: []
      };
      
      const target = {
        branchId: 'target',
        activeFacts: new Set(),
        excludedFacts: new Set(['fact1']),
        crisisPath: []
      };
      
      const validation = validateMerge(source, target);
      
      expect(validation.valid).toBe(false);
      expect(validation.conflicts.length).toBeGreaterThan(0);
    });
  });
  
  describe('validateCatalog', () => {
    it('should validate known catalog', () => {
      const validation = validateCatalog('thornferry-road');
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
    
    it('should detect empty catalog', () => {
      const validation = validateCatalog('unknown-bible');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No crises defined for this bible');
    });
  });
});
