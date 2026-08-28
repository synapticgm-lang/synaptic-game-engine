/**
 * Wave A Tests: WS-2, WS-4, WS-5 Foundations
 * 
 * Tests:
 * - WS-2: NPC Role Registry, Lifecycle FSM, Memory Ledger
 * - WS-4: Encounter Bible, Telegraph, Biome Matrix
 * - WS-5: Exclusive Facts, Delayed Consequences, Crisis Registry
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../types';

// WS-2 Imports
import {
  ROLE_OBLIGATIONS,
  inferNpcRole,
  calculateRoleDeadline,
  isRoleSatisfied,
} from '../npcRoleRegistry';
import {
  initNpcLifecycle,
  updateNpcLifecycle,
  updateAllNpcLifecycles,
  getActiveLifecycles,
  EXIT_WINDOW_TURNS,
} from '../npcLifecycleFsm';
import {
  createKeyMoment,
  appendKeyMoment,
  getKeyMoments,
  broadcastKeyMoment,
} from '../npcMemoryLedger';

// WS-4 Imports
import {
  createTemplateRegistry,
  registerTemplate,
  pickEncounterTemplate,
  validateTemplate,
  BIOME_TAXONOMY,
} from '../encounterBible';
import {
  generateTelegraph,
  formatStatusTelegraph,
} from '../encounterTelegraph';
import {
  detectBiome,
  isWrongBibleEncounter,
  validateEncounterBiome,
} from '../encounterBiomeMatrix';

// WS-5 Imports
import {
  EXCLUSIVE_FACT_REGISTRY,
  checkFactConflict,
  validateFactWrites,
  commitFactWrite,
} from '../pyoaExclusiveFacts';
import {
  scheduleDelayedConsequence,
  getDueConsequences,
  deliverConsequence,
  markConsequenceDelivered,
} from '../pyoaDelayedConsequences';
import {
  PYOA_CRISIS_REGISTRY,
  isCrisisEligible,
  pickCrisis,
} from '../pyoaCrisisRegistry';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestState(opts?: Partial<GameState>): GameState {
  return {
    version: 100,
    saveId: 'test-save',
    storyName: 'Test Story',
    engineMode: 'litrpg',
    lastUpdated: Date.now(),
    character: {
      name: 'TestHero',
      folk: 'human',
      level: 1,
      experience: 0,
      hitPoints: 100,
      maxHitPoints: 100,
    },
    inventory: [],
    containers: [],
    materials: [],
    companions: [],
    quests: [],
    shrines: [],
    bestiary: [],
    relationships: [],
    log: [],
    rolls: [],
    turn: 1,
    seed: 'test-seed',
    lorebook: [],
    arcDirector: {
      npcLifecycles: [],
      npcMemories: [],
      pyoaDelayedConsequences: [],
    },
    ...opts,
  } as GameState;
}

// ============================================================================
// WS-2: NPC ROLE REGISTRY TESTS
// ============================================================================

describe('WS-2 Wave A: NPC Role Registry', () => {
  it('has 24 role archetypes', () => {
    const roles = Object.keys(ROLE_OBLIGATIONS);
    expect(roles.length).toBe(24);
  });
  
  it('each role has required fields', () => {
    for (const [role, obligation] of Object.entries(ROLE_OBLIGATIONS)) {
      expect(obligation.roleId).toBe(role);
      expect(obligation.description).toBeTruthy();
      expect(obligation.exit.onSuccess).toBeTruthy();
      expect(obligation.exit.onFailure).toBeTruthy();
      expect(obligation.obligations.successCriteria).toBeTruthy();
      expect(obligation.obligations.failureCriteria).toBeTruthy();
    }
  });
  
  it('infers guide for opening NPC', () => {
    const state = createTestState({ turn: 1, openingEstablishment: { complete: false } });
    state.sceneFacts = { present: ['Aldous'] };
    
    const role = inferNpcRole(['guide', 'help']);
    expect(role).toBe('guide');
  });
  
  it('infers quest-patron for quest keywords', () => {
    const state = createTestState();
    const role = inferNpcRole(['quest', 'patron']);
    expect(role).toBe('quest-patron');
  });
  
  it('infers merchant in hub', () => {
    const state = createTestState({ currentLocation: 'Lowmarket Hub' });
    const role = inferNpcRole(['merchant', 'shop']);
    expect(role).toBe('merchant');
  });
  
  it('calculates deadline for role with timeline', () => {
    const state = createTestState({ turn: 10 });
    const deadline = calculateRoleDeadline('quest-patron', 10, state);
    expect(deadline).toBe(20); // Current turn (10) + turnOffset (10)
  });
  
  it('returns null deadline for indefinite roles', () => {
    const state = createTestState();
    const deadline = calculateRoleDeadline('companion', 10, state);
    expect(deadline).toBeNull();
  });
});

// ============================================================================
// WS-2: NPC LIFECYCLE FSM TESTS
// ============================================================================

describe('WS-2 Wave A: NPC Lifecycle FSM', () => {
  it('initializes lifecycle in entering state', () => {
    const state = createTestState();
    const lifecycle = initNpcLifecycle('Aldous', 'guide', state);
    
    expect(lifecycle.npcId).toBe('Aldous');
    expect(lifecycle.role).toBe('guide');
    expect(lifecycle.state).toBe('entering');
    expect(lifecycle.debtSatisfied).toBe(false);
  });
  
  it('transitions from entering to functioning', () => {
    const state = createTestState();
    const lifecycle = initNpcLifecycle('Aldous', 'guide', state);
    
    const result = updateNpcLifecycle(lifecycle, state);
    
    expect(result.lifecycle.state).toBe('functioning');
    expect(result.transition).toBeTruthy();
    expect(result.transition?.from).toBe('entering');
    expect(result.transition?.to).toBe('functioning');
  });
  
  it('transitions to debt_satisfied when obligation met', () => {
    const state = createTestState({
      turn: 10,
      openingEstablishment: { complete: true },
    });
    
    let lifecycle = initNpcLifecycle('Aldous', 'guide', state);
    lifecycle = { ...lifecycle, state: 'functioning' };
    
    const result = updateNpcLifecycle(lifecycle, state);
    
    expect(result.lifecycle.state).toBe('debt_satisfied');
    expect(result.lifecycle.debtSatisfied).toBe(true);
    expect(result.mandate).toContain('OBLIGATION MET');
  });
  
  it('enforces exit window after debt satisfied', () => {
    const state = createTestState({ turn: 30 });
    
    let lifecycle = initNpcLifecycle('Aldous', 'guide', state);
    lifecycle = {
      ...lifecycle,
      state: 'debt_satisfied',
      debtSatisfied: true,
      satisfiedAtTurn: 10, // 20 turns ago
    };
    
    const result = updateNpcLifecycle(lifecycle, state);
    
    // Should force exit after EXIT_WINDOW_TURNS
    expect(result.lifecycle.state).toBe('exiting');
    expect(result.mandate).toContain('EXIT');
  });
  
  it('forces exit on deadline miss', () => {
    const state = createTestState({ turn: 50 });
    
    let lifecycle = initNpcLifecycle('Aldous', 'guide', state);
    lifecycle = {
      ...lifecycle,
      state: 'functioning',
      obligationDeadline: 30, // Deadline was at T30, now T50
    };
    
    const result = updateNpcLifecycle(lifecycle, state);
    
    expect(result.lifecycle.state).toBe('exiting');
    expect(result.lifecycle.exitReason).toBe('deadline_missed');
  });
  
  it('updates all lifecycles in batch', () => {
    const state = createTestState({
      turn: 10,
      openingEstablishment: { complete: true },
    });
    
    const lc1 = initNpcLifecycle('Aldous', 'guide', state);
    const lc2 = initNpcLifecycle('Vendor', 'merchant', state);
    
    state.arcDirector = {
      ...state.arcDirector,
      npcLifecycles: [lc1, lc2],
    };
    
    const result = updateAllNpcLifecycles(state);
    
    expect(result.transitions.length).toBeGreaterThan(0);
    expect(result.state.arcDirector?.npcLifecycles?.length).toBe(2);
  });
});

// ============================================================================
// WS-2: NPC MEMORY LEDGER TESTS
// ============================================================================

describe('WS-2 Wave A: NPC Memory Ledger', () => {
  it('creates key moment', () => {
    const state = createTestState({ turn: 10 });
    
    const moment = createKeyMoment('Aldous', 'first_meet', { location: 'Lowmarket' }, state);
    
    expect(moment.npcId).toBe('Aldous');
    expect(moment.category).toBe('first_meet');
    expect(moment.turn).toBe(10);
    expect(moment.data.location).toBe('Lowmarket');
  });
  
  it('appends key moment to ledger', () => {
    const state = createTestState({ turn: 10 });
    
    const moment = createKeyMoment('Aldous', 'first_meet', { location: 'Lowmarket' }, state);
    const updated = appendKeyMoment('Aldous', moment, state);
    
    const moments = getKeyMoments('Aldous', updated);
    expect(moments.length).toBe(1);
    expect(moments[0]?.category).toBe('first_meet');
  });
  
  it('deduplicates recent moments', () => {
    let state = createTestState({ turn: 10 });
    
    const moment1 = createKeyMoment('Aldous', 'first_meet', { location: 'Lowmarket' }, state);
    state = appendKeyMoment('Aldous', moment1, state);
    
    // Try to add same category again within 5 turns
    state = { ...state, turn: 12 };
    const moment2 = createKeyMoment('Aldous', 'first_meet', { location: 'Lowmarket' }, state);
    state = appendKeyMoment('Aldous', moment2, state);
    
    const moments = getKeyMoments('Aldous', state);
    expect(moments.length).toBe(1); // Should still be 1 (deduplicated)
  });
  
  it('broadcasts key moment to witnesses', () => {
    const state = createTestState({ turn: 10 });
    
    const moment = createKeyMoment('Aldous', 'betrayal', { location: 'Dock' }, state);
    const updated = broadcastKeyMoment(moment, ['Oskar', 'Pellane'], state);
    
    const oskarMoments = getKeyMoments('Oskar', updated);
    const pellaneMoments = getKeyMoments('Pellane', updated);
    
    expect(oskarMoments.length).toBe(1);
    expect(pellaneMoments.length).toBe(1);
    expect(oskarMoments[0]?.category).toBe('witness');
  });
});

// ============================================================================
// WS-4: ENCOUNTER BIBLE TESTS
// ============================================================================

describe('WS-4 Wave A: Encounter Bible', () => {
  it('creates empty registry', () => {
    const registry = createTemplateRegistry();
    
    expect(registry.byBible.size).toBe(0);
    expect(registry.byId.size).toBe(0);
    expect(registry.byMode.size).toBe(0);
  });
  
  it('registers template', () => {
    const registry = createTemplateRegistry();
    
    const template = {
      id: 'test-encounter',
      name: 'Test Encounter',
      bibleId: 'test-bible',
      mode: 'litrpg' as const,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn' as const,
        patterns: [{ type: 'status' as const, text: 'Danger ahead', probability: 1.0 }],
        avoidable: true,
      },
      stakes: {
        win: { description: 'Victory', xpRange: [20, 30] },
        lose: { description: 'Defeat', xpRange: [0, 0] },
      },
      resolution: {
        type: 'combat' as const,
        combat: {
          enemyCount: [1, 3],
          hpRange: [10, 20],
          fleeDifficulty: 'medium' as const,
          parleyDifficulty: 'hard' as const,
          maxEngagementTurns: 8,
        },
      },
      aftermath: {
        receiptTypes: ['xp', 'loot'],
        mandatoryReceipts: ['xp'],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban', 'urban_ruin'],
      },
      tierRange: [1, 3] as [number, number],
      densityRole: 'trash' as const,
    };
    
    registerTemplate(registry, template);
    
    expect(registry.byId.get('test-encounter')).toBe(template);
    expect(registry.byBible.get('test-bible')?.length).toBe(1);
  });
  
  it('validates template schema', () => {
    const template = {
      id: 'test',
      name: 'Test',
      bibleId: 'test',
      mode: 'litrpg' as const,
      version: '1.0',
      telegraph: {
        timing: 'same-turn' as const,
        patterns: [{ type: 'status' as const, text: 'Test', probability: 1.0 }],
        avoidable: true,
      },
      stakes: {
        win: { description: 'Win', xpRange: [10, 20] as [number, number] },
        lose: { description: 'Lose', xpRange: [0, 0] as [number, number] },
      },
      resolution: {
        type: 'combat' as const,
        combat: {
          enemyCount: [1, 2] as [number, number],
          hpRange: [10, 20] as [number, number],
          fleeDifficulty: 'medium' as const,
          parleyDifficulty: 'hard' as const,
          maxEngagementTurns: 8,
        },
      },
      aftermath: {
        receiptTypes: ['xp' as const],
        mandatoryReceipts: ['xp'],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban'],
      },
      tierRange: [1, 3] as [number, number],
      densityRole: 'trash' as const,
    };
    
    const result = validateTemplate(template);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  it('detects invalid template', () => {
    const template = {
      id: '',
      name: 'Test',
    } as any;
    
    const result = validateTemplate(template);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// WS-4: BIOME MATRIX TESTS
// ============================================================================

describe('WS-4 Wave A: Biome Matrix', () => {
  it('detects urban biome', () => {
    const biome = detectBiome('Lowmarket City');
    expect(biome).toBe('urban');
  });
  
  it('detects urban_ruin biome', () => {
    const biome = detectBiome('Destroyed Settlement');
    expect(biome).toBe('urban_ruin');
  });
  
  it('detects dungeon biome', () => {
    const biome = detectBiome('Cursed Keep Crypt');
    expect(biome).toBe('dungeon');
  });
  
  it('detects coastal biome', () => {
    const biome = detectBiome('Saltmar Harbor');
    expect(biome).toBe('coastal');
  });
  
  it('blocks Keep Wraith on Shattered Coast', () => {
    const wrong = isWrongBibleEncounter('Keep Wraith', 'shattered-coast');
    expect(wrong).toBe(true);
  });
  
  it('allows Saltmar Raider on Shattered Coast', () => {
    const wrong = isWrongBibleEncounter('Saltmar Raider', 'shattered-coast');
    expect(wrong).toBe(false);
  });
  
  it('blocks Pact-Hunter on Cursed Keep', () => {
    const wrong = isWrongBibleEncounter('Pact-Hunter', 'cursed-keep');
    expect(wrong).toBe(true);
  });
});

// ============================================================================
// WS-5: EXCLUSIVE FACTS TESTS
// ============================================================================

describe('WS-5 Wave A: Exclusive Facts', () => {
  it('has standard exclusive groups', () => {
    const groups = EXCLUSIVE_FACT_REGISTRY.getAllGroups();
    expect(groups.length).toBeGreaterThan(0);
  });
  
  it('detects fact conflict', () => {
    const write = {
      factId: 'rebelAlly',
      value: true,
      visibility: 'public' as const,
      retention: 'campaign' as const,
      source: 'ws5' as const,
    };
    
    const existingFacts = ['lordAlly'];
    
    const conflict = checkFactConflict(write, existingFacts);
    
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictingFact).toBe('lordAlly');
  });
  
  it('allows non-conflicting facts', () => {
    const write = {
      factId: 'lordAlly',
      value: true,
      visibility: 'public' as const,
      retention: 'campaign' as const,
      source: 'ws5' as const,
    };
    
    const existingFacts = ['millerTrusted']; // Different group
    
    const conflict = checkFactConflict(write, existingFacts);
    
    expect(conflict.hasConflict).toBe(false);
  });
  
  it('validates batch of fact writes', () => {
    const writes = [
      {
        factId: 'lordAlly',
        value: true,
        visibility: 'public' as const,
        retention: 'campaign' as const,
        source: 'ws5' as const,
      },
      {
        factId: 'rebelAlly', // Conflicts with lordAlly
        value: true,
        visibility: 'public' as const,
        retention: 'campaign' as const,
        source: 'ws5' as const,
      },
    ];
    
    const state = createTestState({ engineMode: 'pyoa' });
    const result = validateFactWrites(writes, state);
    
    expect(result.valid).toBe(false);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// WS-5: DELAYED CONSEQUENCES TESTS
// ============================================================================

describe('WS-5 Wave A: Delayed Consequences', () => {
  it('schedules delayed consequence', () => {
    const state = createTestState({ turn: 10, engineMode: 'pyoa' });
    
    const updated = scheduleDelayedConsequence(state, {
      sourceCrisisId: 'trust-miller',
      sourceForkId: 'trust-offer',
      dueAtTurn: 150,
      type: 'reveal',
      payload: {
        narrativeBeat: 'Miller reveals secret',
        journalHint: 'The miller approaches...',
      },
    });
    
    const consequences = updated.arcDirector?.pyoaDelayedConsequences ?? [];
    expect(consequences.length).toBe(1);
    expect(consequences[0]?.dueAtTurn).toBe(150);
  });
  
  it('gets due consequences', () => {
    let state = createTestState({ turn: 100, engineMode: 'pyoa' });
    
    state = scheduleDelayedConsequence(state, {
      sourceCrisisId: 'test',
      sourceForkId: 'test',
      dueAtTurn: 80, // Past due
      type: 'reveal',
      payload: {
        narrativeBeat: 'Test',
        journalHint: 'Test',
      },
    });
    
    state = scheduleDelayedConsequence(state, {
      sourceCrisisId: 'test2',
      sourceForkId: 'test2',
      dueAtTurn: 150, // Not due yet
      type: 'reveal',
      payload: {
        narrativeBeat: 'Test 2',
        journalHint: 'Test 2',
      },
    });
    
    const due = getDueConsequences(state);
    expect(due.length).toBe(1);
    expect(due[0]?.dueAtTurn).toBe(80);
  });
  
  it('marks consequence as delivered', () => {
    let state = createTestState({ turn: 10, engineMode: 'pyoa' });
    
    state = scheduleDelayedConsequence(state, {
      sourceCrisisId: 'test',
      sourceForkId: 'test',
      dueAtTurn: 100,
      type: 'reveal',
      payload: {
        narrativeBeat: 'Test',
        journalHint: 'Test',
      },
    });
    
    const consequences = state.arcDirector?.pyoaDelayedConsequences ?? [];
    const id = consequences[0]!.id;
    
    state = markConsequenceDelivered(id, state);
    
    const updated = state.arcDirector?.pyoaDelayedConsequences ?? [];
    expect(updated[0]?.status).toBe('delivered');
  });
});

// ============================================================================
// WS-5: CRISIS REGISTRY TESTS
// ============================================================================

describe('WS-5 Wave A: Crisis Registry', () => {
  it('has Thornferry Road crises', () => {
    const crises = PYOA_CRISIS_REGISTRY.getCrisesForBible('thornferry-road');
    expect(crises.length).toBeGreaterThan(0);
  });
  
  it('each crisis has required fields', () => {
    const crises = PYOA_CRISIS_REGISTRY.getCrisesForBible('thornferry-road');
    
    for (const crisis of crises) {
      expect(crisis.id).toBeTruthy();
      expect(crisis.name).toBeTruthy();
      expect(crisis.bibleId).toBe('thornferry-road');
      expect(crisis.forks.length).toBeGreaterThanOrEqual(2);
      
      for (const fork of crisis.forks) {
        expect(fork.id).toBeTruthy();
        expect(fork.label).toBeTruthy();
        expect(fork.exclusiveFacts.length).toBeGreaterThan(0);
      }
    }
  });
  
  it('checks crisis eligibility by turn window', () => {
    const crisis = PYOA_CRISIS_REGISTRY.getCrisis('millstone-charter');
    expect(crisis).toBeTruthy();
    
    // Before window
    let state = createTestState({ turn: 10, engineMode: 'pyoa' });
    let result = isCrisisEligible(crisis!, state);
    expect(result.eligible).toBe(false);
    
    // Within window
    state = createTestState({ turn: 30, engineMode: 'pyoa' });
    result = isCrisisEligible(crisis!, state);
    expect(result.eligible).toBe(true);
    
    // After window
    state = createTestState({ turn: 50, engineMode: 'pyoa' });
    result = isCrisisEligible(crisis!, state);
    expect(result.eligible).toBe(false);
  });
});
