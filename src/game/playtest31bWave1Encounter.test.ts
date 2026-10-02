/**
 * WS-4 Wave 1: Encounter Bible Tests
 * 
 * Tests for encounter templates, biome filtering, stakes materialization, and telegraphs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, EngineMode } from './types';
import type { EncounterTemplate } from './encounterBible';
import {
  allCatalogEncounters,
  encountersForMode,
  findCatalogEncounter,
  isCatalogFoeName,
  selectCatalogEncounter,
} from './encounterBible';
import {
  loadBiomeMatrix,
  clearBiomeMatrixCache,
  filterByBiome,
  isTemplateLegalForBiome,
  getDroughtFallback,
  validateWrongBiblePrevention,
} from './encounterBiomeMatrix';
import {
  materializeStakes,
  isApproachLegal,
  getLegalApproaches,
  validateActionHonesty,
} from './encounterStakes';
import {
  loadTelegraphCatalog,
  clearTelegraphCache,
  selectTelegraphCues,
  buildTelegraphContext,
  isSurpriseEligible,
} from './encounterTelegraph';

// ============================================================================
// FIXTURE TEMPLATE
// ============================================================================

function createTestTemplate(): EncounterTemplate {
  return {
    id: 'test-bible.trash.test-encounter',
    name: 'Test Encounter',
    bibleId: 'test-bible',
    mode: 'litrpg',
    version: '1.0.0',
    telegraph: {
      timing: '1-turn-before',
      patterns: [
        {
          type: 'status',
          text: 'THREAT: Minor enemy approaching',
          probability: 1.0,
        },
      ],
      avoidable: true,
    },
    stakes: {
      headline: 'Defeat the test enemy',
      approaches: [
        {
          id: 'fight',
          label: 'Fight directly',
          requirements: ['player:combat_capable'],
          method: 'combat',
          check: {
            clock: {
              successSegments: 4,
              dangerSegments: 4,
            },
          },
          onSuccess: {
            terminal: true,
            terminalState: 'victory',
            stateChanges: ['enemy defeated', 'xp gained'],
            summary: 'You defeat the enemy',
          },
          onFailure: {
            terminal: true,
            terminalState: 'defeat',
            stateChanges: ['hp reduced', 'retreat forced'],
            summary: 'The enemy defeats you',
          },
          lockout: 'Combat failed',
        },
        {
          id: 'flee',
          label: 'Flee the area',
          requirements: [],
          method: 'd20',
          check: {
            dc: 12,
          },
          onSuccess: {
            terminal: true,
            terminalState: 'fled',
            stateChanges: ['location changed', 'enemy avoided'],
            summary: 'You successfully escape',
          },
          onFailure: {
            terminal: false,
            stateChanges: ['hp reduced', 'position worsened'],
            summary: 'Flee attempt fails',
          },
          lockout: 'Escape route blocked',
        },
      ],
    },
    resolution: {
      mechanic: 'combat',
      terminalStates: ['victory', 'defeat', 'fled'],
      maxTurns: 10,
      forcedTerminal: {
        terminal: true,
        terminalState: 'partial',
        stateChanges: ['time expired', 'enemy withdraws'],
        summary: 'The encounter times out',
      },
    },
    aftermath: {
      minimumReceiptTypes: 2,
      byTerminal: {
        victory: [
          {
            type: 'xp',
            target: 'player',
            operation: 'add',
            value: 50,
          },
          {
            type: 'loot',
            target: 'inventory',
            operation: 'add',
            value: { item: 'test-reward' },
          },
        ],
        defeat: [
          {
            type: 'hp',
            target: 'player',
            operation: 'set',
            value: 1,
          },
          {
            type: 'quest',
            target: 'test-quest',
            operation: 'set',
            value: 'failed',
          },
        ],
      },
    },
    biomeConstraints: {
      allow: ['urban-hub', 'dungeon'],
      siteTags: ['combat-area'],
      exclude: ['safe-zone'],
    },
    tierRange: [1, 5],
    densityRole: 'trash',
    maxSpawns: 10,
  };
}

function createTestState(): GameState {
  return {
    turn: 10,
    character: {
      name: 'Test Player',
      level: 3,
      hp: 50,
      maxHp: 50,
      mp: 20,
      maxMp: 20,
      xp: 150,
      inventory: [],
      equippedItems: {
        weapon: {
          id: 'test-sword',
          name: 'Test Sword',
          category: 'weapon',
          equipped: true,
        },
      },
    },
    currentLocation: 'test-location',
    sceneFacts: {
      indoor: false,
      crowdSize: 'none',
      present: [],
      exits: [],
      props: [],
    },
    openingEstablishment: {
      complete: true,
      aloneArrival: false,
    },
    arcDirector: {
      choiceFingerprints: [],
    },
    worldLedger: {
      factionStandings: [],
    },
  } as GameState;
}

// ============================================================================
// ENCOUNTER BIBLE TESTS
// ============================================================================

describe('WS-4 Wave 1 — Encounter catalog (replaced the template registry in 12b)', () => {
  const at = (over: Partial<GameState>): GameState =>
    ({ engineMode: 'litrpg', turn: 5, currentLocation: '', sceneFacts: {}, stateTxLog: [], ...over }) as GameState;

  it('catalog lists authored rows for every mode', () => {
    for (const mode of ['litrpg', 'dnd', 'rpg', 'pyoa'] as const) {
      expect(encountersForMode(mode).length).toBeGreaterThan(0);
    }
  });

  it('rows are found by id and listed under their own mode', () => {
    for (const seed of allCatalogEncounters()) {
      expect(findCatalogEncounter(seed.id)).toBe(seed);
      expect(encountersForMode(seed.mode)).toContain(seed);
    }
  });

  it('every row is a named foe; fights carry a reward, PYOA crises do not', () => {
    const ids = new Set<string>();
    for (const seed of allCatalogEncounters()) {
      expect(seed.id).toBeTruthy();
      expect(ids.has(seed.id)).toBe(false);
      ids.add(seed.id);
      expect(seed.foeName.trim()).toBeTruthy();
      expect(seed.title.trim()).toBeTruthy();
      if (seed.tier === 'crisis') expect(seed.xpReward).toBe(0);
      else expect(seed.xpReward).toBeGreaterThan(0);
      expect(seed.cooldown).toBeGreaterThanOrEqual(0);
    }
  });

  it('unknown ids and blank names are not catalog rows', () => {
    expect(findCatalogEncounter('')).toBeUndefined();
    expect(isCatalogFoeName('')).toBe(false);
    expect(isCatalogFoeName('Pact-Hunter Skirmisher', 'litrpg')).toBe(true);
    expect(isCatalogFoeName('Pact-Hunter Skirmisher', 'dnd')).toBe(false);
  });

  it('litrpg catalog holds trash, elite and boss tiers', () => {
    const tiers = new Set(encountersForMode('litrpg').map((s) => s.tier));
    expect(tiers.has('trash')).toBe(true);
    expect(tiers.has('elite')).toBe(true);
    expect(tiers.has('boss')).toBe(true);
  });

  it('director pick is a catalog row of the mode, early turns pick trash', () => {
    const picked = selectCatalogEncounter(at({ turn: 5 }));
    expect(picked).not.toBeNull();
    expect(encountersForMode('litrpg')).toContain(picked!);
    expect(picked!.tier).toBe('trash');
    expect(selectCatalogEncounter(at({ turn: 5 }))).toBe(picked);
  });

  it('late turns pick elite and a hub prefers its own row', () => {
    expect(selectCatalogEncounter(at({ turn: 25 }))?.tier).toBe('elite');
    expect(selectCatalogEncounter(at({ turn: 5, currentLocation: 'Mireglass reeds' }))?.hubId).toBe('sp-hub-mireglass');
  });

  it('PYOA drought never picks a catalog foe', () => {
    expect(selectCatalogEncounter(at({ engineMode: 'pyoa' }))).toBeNull();
  });
});

// ============================================================================
// BIOME MATRIX TESTS
// ============================================================================

describe('WS-4 Wave 1 — Biome Matrix', () => {
  beforeEach(() => {
    clearBiomeMatrixCache();
  });

  it('B020: Load and parse biome matrix', async () => {
    const matrix = await loadBiomeMatrix();
    
    expect(matrix).toBeDefined();
    expect(matrix.version).toBe('1.0.0');
    expect(matrix.entries.length).toBeGreaterThan(0);
  });

  it('B021: Hard filter prevents wrong-bible spawns', async () => {
    const matrix = await loadBiomeMatrix();
    const keepWraithTemplate = createTestTemplate();
    keepWraithTemplate.id = 'cursed-keep.elite.keep-wraith';
    keepWraithTemplate.name = 'Keep Wraith Guardian';
    keepWraithTemplate.bibleId = 'cursed-keep';
    
    // Try to use it in Summoned Pact biome
    const legality = isTemplateLegalForBiome(
      keepWraithTemplate,
      'summoned-pact',  // wrong bible
      'urban-hub',
      'litrpg',
      matrix
    );
    
    expect(legality.legal).toBe(false);
    expect(legality.reason).toContain('Wrong-bible');
  });

  it('B022: Matrix validates wrong-bible prevention rules', async () => {
    const matrix = await loadBiomeMatrix();
    const validation = validateWrongBiblePrevention(matrix);
    
    expect(validation.valid).toBe(true);
    if (!validation.valid) {
      console.error('Wrong-bible validation errors:', validation.errors);
    }
    expect(validation.errors).toHaveLength(0);
  });

  it('B023: Filter templates by biome returns legal candidates only', async () => {
    const matrix = await loadBiomeMatrix();
    // Add matching template
    const legalTemplate = createTestTemplate();
    legalTemplate.bibleId = 'summoned-pact';
    legalTemplate.mode = 'litrpg';
    
    // Add non-matching template
    const illegalTemplate = createTestTemplate();
    illegalTemplate.id = 'cursed-keep.elite.keep-wraith';
    illegalTemplate.bibleId = 'cursed-keep';
    illegalTemplate.mode = 'dnd';
    
    const filtered = filterByBiome(
      [legalTemplate, illegalTemplate],
      'summoned-pact',
      'crypt-dungeon',
      'litrpg',
      matrix
    );
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(legalTemplate.id);
  });

  it('B024: Drought fallback provided when no legal templates', async () => {
    const matrix = await loadBiomeMatrix();
    
    const fallback = getDroughtFallback(
      'summoned-pact',
      'urban-hub',
      'litrpg',
      matrix
    );
    
    expect(fallback).toBeDefined();
    expect(typeof fallback).toBe('string');
  });
});

// ============================================================================
// STAKES MATERIALIZATION TESTS
// ============================================================================

describe('WS-4 Wave 1 — Stakes Materialization', () => {
  it('B006: Materialize stakes from template', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    const materialized = materializeStakes(template, state);
    
    expect(materialized).toBeDefined();
    expect(materialized.headline).toBe('Defeat the test enemy');
    expect(materialized.approaches).toHaveLength(2);
    
    const fightApproach = materialized.approaches.find((a) => a.id === 'fight');
    expect(fightApproach).toBeDefined();
    expect(fightApproach?.requirementsMet).toBe(true); // Has weapon equipped
  });

  it('B007: Validate approach legal status', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    const fightLegal = isApproachLegal('fight', template, state);
    expect(fightLegal.legal).toBe(true);
    
    const fleeLegal = isApproachLegal('flee', template, state);
    expect(fleeLegal.legal).toBe(true);
  });

  it('B008: Requirements block unavailable approaches', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    // Remove weapon
    state.character!.equippedItems = {};
    state.character!.level = 0; // Also remove level fallback
    
    const fightLegal = isApproachLegal('fight', template, state);
    expect(fightLegal.legal).toBe(false);
    expect(fightLegal.reason).toContain('Requirement not met');
  });

  it('B009: Get only legal approaches', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    const legal = getLegalApproaches(template, state);
    expect(legal).toHaveLength(2);
    expect(legal.every((a) => a.requirementsMet)).toBe(true);
  });

  it('B010: Action honesty validation', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    const honestAction = validateActionHonesty('Fight directly', template, state);
    expect(honestAction.honest).toBe(true);
    expect(honestAction.suggestedApproach).toBe('fight');
    
    const dishonestAction = validateActionHonesty('Cast fireball', template, state);
    expect(dishonestAction.honest).toBe(false);
    expect(dishonestAction.suggestedApproach).toBeDefined();
  });
});

// ============================================================================
// TELEGRAPH TESTS
// ============================================================================

describe('WS-4 Wave 1 — Telegraph System', () => {
  beforeEach(() => {
    clearTelegraphCache();
  });

  it('B011: Load telegraph catalog', async () => {
    const catalog = await loadTelegraphCatalog();
    
    expect(catalog).toBeDefined();
    expect(catalog.catalogId).toBe('ws4.telegraph.v1');
    expect(catalog.patterns.length).toBeGreaterThan(0);
  });

  it('B012: Select telegraph cues for template role', async () => {
    const catalog = await loadTelegraphCatalog();
    const template = createTestTemplate();
    
    const cues = selectTelegraphCues(template, 'litrpg', catalog);
    
    expect(cues).toBeDefined();
    expect(cues.length).toBeGreaterThanOrEqual(1);
  });

  it('B013: Elite encounters get minimum 2 channels', async () => {
    const catalog = await loadTelegraphCatalog();
    const template = createTestTemplate();
    template.densityRole = 'elite';
    template.telegraph.channels = ['status', 'scene'];
    
    const cues = selectTelegraphCues(template, 'litrpg', catalog);
    
    // Should have at least 2 cues (one per channel minimum)
    expect(cues.length).toBeGreaterThanOrEqual(2);
  });

  it('B014: Build telegraph context for situation packet', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    const context = buildTelegraphContext(template, state);
    
    expect(context).toBeDefined();
    expect(context).toContain('TELEGRAPH');
    expect(context).toContain('1-turn-before');
  });

  it('B015: Surprise eligibility check', () => {
    const template = createTestTemplate();
    const state = createTestState();
    
    const eligible = isSurpriseEligible(template, state);
    
    expect(typeof eligible).toBe('boolean');
  });
});
