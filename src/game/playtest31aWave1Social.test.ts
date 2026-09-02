/**
 * WS-7 Wave 1: Social Crisis + Leverage Tests
 * 
 * Tests for crisis eligibility, selection, leverage exhaustion, and fingerprinting.
 */

import { describe, it, expect } from 'vitest';
import { CRISIS_CATALOG, isCrisisEligible, selectEligibleCrisis, materializeStakes, validateCrisisCatalog } from './socialCrisis';
import { generatePropositionFingerprint, hasPropositionBeenTried } from './socialSkills';
import { registerLeverageAsset, exhaustLeverageAsset, isLeverageExhausted, resolveLeverage } from './leverageMechanics';
import type { GameState } from './types';

// ============================================================================
// TEST 1: Crisis Eligibility (SC-01 eligible in DnD mode with two opposed actors)
// ============================================================================

describe('WS-7 Wave 1: Social Crisis Eligibility', () => {
  it('Test 1: SC-01 eligible in DnD mode with two opposed actors', () => {
    const crisis = CRISIS_CATALOG.find(c => c.id === 'SC-01');
    expect(crisis).toBeDefined();
    
    const state: GameState = {
      engineMode: 'dnd',
      turn: 15,
      sceneFacts: {
        location: 'Town Square',
        present: ['Aldous', 'Merchant'],
        exits: [],
        props: [],
      },
      activeEncounter: undefined,
      // ... minimal state
    } as GameState;
    
    const eligible = isCrisisEligible(crisis!, state);
    expect(eligible).toBe(true);
  });
  
  it('Test 1b: SC-01 ineligible with only one actor', () => {
    const crisis = CRISIS_CATALOG.find(c => c.id === 'SC-01');
    expect(crisis).toBeDefined();
    
    const state: GameState = {
      engineMode: 'dnd',
      turn: 15,
      sceneFacts: {
        location: 'Town Square',
        present: ['Aldous'],
        exits: [],
        props: [],
      },
      // ... minimal state
    } as GameState;
    
    const eligible = isCrisisEligible(crisis!, state);
    expect(eligible).toBe(false);
  });
  
  it('Test 1c: SC-01 ineligible during combat', () => {
    const crisis = CRISIS_CATALOG.find(c => c.id === 'SC-01');
    expect(crisis).toBeDefined();
    
    const state: GameState = {
      engineMode: 'dnd',
      turn: 15,
      sceneFacts: {
        location: 'Town Square',
        present: ['Aldous', 'Merchant'],
        exits: [],
        props: [],
      },
      activeEncounter: {
        name: 'Bandit',
        hp: 20,
        maxHp: 20,
        enemies: [],
      },
      // ... minimal state
    } as GameState;
    
    const eligible = isCrisisEligible(crisis!, state);
    expect(eligible).toBe(false);
  });
});

// ============================================================================
// TEST 2: Crisis Commits Stakes Before GM
// ============================================================================

describe('WS-7 Wave 1: Crisis Stakes Commit', () => {
  it('Test 2: Crisis commits stakes before GM (gain, loss, owner)', () => {
    const crisis = CRISIS_CATALOG.find(c => c.id === 'SC-01');
    expect(crisis).toBeDefined();
    
    const state: GameState = {
      engineMode: 'dnd',
      turn: 15,
      character: {
        name: 'Tester',
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 20,
        maxHp: 20,
        mp: 10,
        maxMp: 10,
        sp: 10,
        maxSp: 10,
        attributes: {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10,
        },
        conditions: [],
        bio: '',
        appearance: '',
      },
      // ... minimal state
    } as GameState;
    
    const stakes = materializeStakes(crisis!, state);
    
    expect(stakes.gain).toBeDefined();
    expect(stakes.gain.length).toBeGreaterThan(0);
    expect(stakes.loss).toBeDefined();
    expect(stakes.loss.length).toBeGreaterThan(0);
    expect(stakes.owner).toBeDefined();
    expect(['player', 'npc', 'faction', 'both']).toContain(stakes.owner);
    expect(stakes.magnitude).toBeDefined();
    expect(['minor', 'moderate', 'major', 'critical']).toContain(stakes.magnitude);
  });
});

// ============================================================================
// TEST 3: Leverage Asset Registered on First Use
// ============================================================================

describe('WS-7 Wave 1: Leverage Registry', () => {
  it('Test 3: Leverage asset registered on first use', () => {
    const state: GameState = {
      engineMode: 'dnd',
      turn: 20,
      arcDirector: {
        leverageAssets: [],
      },
      character: {
        name: 'Tester',
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 20,
        maxHp: 20,
        mp: 10,
        maxMp: 10,
        sp: 10,
        maxSp: 10,
        attributes: {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10,
        },
        conditions: [],
        bio: '',
        appearance: '',
      },
      // ... minimal state
    } as GameState;
    
    const { state: newState, assetId } = registerLeverageAsset(
      'moral_appeal',
      'Aldous',
      state,
      {
        evidenceStrength: 0.8,
        credibility: 0.9,
      }
    );
    
    expect(assetId).toBeDefined();
    expect(newState.arcDirector?.leverageAssets).toHaveLength(1);
    
    const asset = newState.arcDirector?.leverageAssets?.[0];
    expect(asset).toBeDefined();
    expect(asset!.type).toBe('moral_appeal');
    expect(asset!.targetNpc).toBe('Aldous');
    expect(asset!.exhausted).toBe(false);
  });
});

// ============================================================================
// TEST 4: Second Leverage Use Against Same NPC is Blocked
// ============================================================================

describe('WS-7 Wave 1: Leverage Exhaustion', () => {
  it('Test 4: Second leverage use against same NPC is blocked', () => {
    // First use
    const state: GameState = {
      engineMode: 'dnd',
      turn: 20,
      arcDirector: {
        leverageAssets: [],
      },
      character: {
        name: 'Tester',
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 20,
        maxHp: 20,
        mp: 10,
        maxMp: 10,
        sp: 10,
        maxSp: 10,
        attributes: {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10,
        },
        conditions: [],
        bio: '',
        appearance: '',
      },
      // ... minimal state
    } as GameState;
    
    const { state: state2, assetId } = registerLeverageAsset(
      'moral_appeal',
      'Aldous',
      state,
      {
        evidenceStrength: 0.8,
        credibility: 0.9,
      }
    );
    
    // Mark as exhausted
    const state3 = exhaustLeverageAsset(assetId, state2);
    
    // Check exhaustion
    const exhausted = isLeverageExhausted(assetId, state3);
    expect(exhausted).toBe(true);
    
    // Verify asset is marked
    const asset = state3.arcDirector?.leverageAssets?.find(a => a.id === assetId);
    expect(asset?.exhausted).toBe(true);
    
    // Try to use again
    const resolution = resolveLeverage(asset!, 'Aldous', state3);
    expect(resolution.outcome).toBe('failure');
    expect(resolution.modifier).toBe(-6);
    expect(resolution.cost).toContain('already used');
  });
});

// ============================================================================
// TEST 5: Crisis Scheduler Suppresses Same Pattern for 60 Turns
// ============================================================================

describe('WS-7 Wave 1: Crisis Suppression', () => {
  it('Test 5: Crisis scheduler suppresses same pattern for 60 turns', () => {
    const crisis = CRISIS_CATALOG.find(c => c.id === 'SC-01');
    expect(crisis).toBeDefined();
    
    // State with recent SC-01 spawn at T20
    const state: GameState = {
      engineMode: 'dnd',
      turn: 50, // 30 turns later
      sceneFacts: {
        location: 'Town Square',
        present: ['Aldous', 'Merchant'],
        exits: [],
        props: [],
      },
      arcDirector: {
        socialCrises: [
          {
            id: 'SC-01',
            name: 'Social Standoff',
            spawnedTurn: 20,
          },
        ],
      },
      character: {
        name: 'Tester',
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 20,
        maxHp: 20,
        mp: 10,
        maxMp: 10,
        sp: 10,
        maxSp: 10,
        attributes: {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10,
        },
        conditions: [],
        bio: '',
        appearance: '',
      },
      // ... minimal state
    } as GameState;
    
    // Should be ineligible (suppression = 60 turns, only 30 have passed)
    const eligible = isCrisisEligible(crisis!, state);
    expect(eligible).toBe(false);
    
    // Advance to T81 (61 turns later)
    const state2 = { ...state, turn: 81 };
    const eligible2 = isCrisisEligible(crisis!, state2);
    expect(eligible2).toBe(true); // Now eligible again
  });
});

// ============================================================================
// TEST 6: Proposition Fingerprinting (Duplicate Detection)
// ============================================================================

describe('WS-7 Wave 1: Proposition Fingerprinting', () => {
  it('Test 6: Proposition fingerprint blocks exact repeats', () => {
    const fingerprint = generatePropositionFingerprint(
      'persuasion',
      'Aldous',
      'Please help us defeat the bandits'
    );
    
    expect(fingerprint).toBeDefined();
    expect(fingerprint).toContain('persuasion');
    expect(fingerprint).toContain('aldous');
    
    // Check if tried (should be false initially)
    const state: GameState = {
      engineMode: 'dnd',
      turn: 20,
      arcDirector: {
        socialCrises: [],
      },
      character: {
        name: 'Tester',
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 20,
        maxHp: 20,
        mp: 10,
        maxMp: 10,
        sp: 10,
        maxSp: 10,
        attributes: {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10,
        },
        conditions: [],
        bio: '',
        appearance: '',
      },
      // ... minimal state
    } as GameState;
    
    const tried = hasPropositionBeenTried(fingerprint, state);
    expect(tried).toBe(false);
    
    // Add fingerprint to state
    const state2: GameState = {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        socialCrises: [
          {
            id: 'SC-01',
            name: 'Social Standoff',
            spawnedTurn: 20,
            propositionFingerprints: [fingerprint],
          },
        ],
      },
    };
    
    // Now should be tried
    const tried2 = hasPropositionBeenTried(fingerprint, state2);
    expect(tried2).toBe(true);
  });
});

// ============================================================================
// TEST 7: Catalog Validation
// ============================================================================

describe('WS-7 Wave 1: Catalog Validation', () => {
  it('Test 7: Crisis catalog is valid', () => {
    const validation = validateCrisisCatalog();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
  
  it('Test 7b: All crises have required fields', () => {
    for (const crisis of CRISIS_CATALOG) {
      expect(crisis.id).toMatch(/^SC-\d{2}$/);
      expect(crisis.name).toBeDefined();
      expect(crisis.name.length).toBeGreaterThan(0);
      expect(crisis.modes).toBeDefined();
      expect(crisis.modes.length).toBeGreaterThan(0);
      expect(crisis.eligibility).toBeDefined();
      expect(crisis.stakesTemplates).toBeDefined();
      expect(crisis.stakesTemplates.length).toBeGreaterThan(0);
      expect(crisis.suppressionTurns).toBeGreaterThan(0);
      expect(crisis.targetCadence).toBeGreaterThan(0);
    }
  });
});
