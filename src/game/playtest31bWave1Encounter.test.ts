/**
 * WS-4 Wave 1: Encounter Bible Tests
 * 
 * Tests for encounter templates, biome filtering, stakes materialization, and telegraphs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, EngineMode } from './types';
import type { EncounterTemplate } from './encounterBible';
import {
  createTemplateRegistry,
  registerTemplate,
  getTemplatesForBible,
  filterTemplatesByBiome,
  filterTemplatesByTier,
  pickEncounterTemplate,
  validateTemplate,
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

describe('WS-4 Wave 1 — Encounter Bible', () => {
  it('B001: Template registry creation and validation', () => {
    const registry = createTemplateRegistry();
    expect(registry).toBeDefined();
    expect(registry.templates).toEqual([]);
    expect(registry.version).toBe('1.0.0');
  });

  it('B002: Template registration and retrieval', () => {
    const registry = createTemplateRegistry();
    const template = createTestTemplate();
    
    registerTemplate(registry, template);
    
    expect(registry.templates).toHaveLength(1);
    expect(registry.templates[0].id).toBe(template.id);
    
    const retrieved = getTemplatesForBible(registry, 'test-bible', 'litrpg');
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe(template.id);
  });

  it('B003: Template validation', () => {
    const template = createTestTemplate();
    const validation = validateTemplate(template);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('B004: Filter templates by tier range', () => {
    const registry = createTemplateRegistry();
    const template = createTestTemplate();
    registerTemplate(registry, template);
    
    // Template is tier 1-5
    const tier1 = filterTemplatesByTier(registry.templates, 1, 'litrpg');
    expect(tier1).toHaveLength(1);
    
    const tier3 = filterTemplatesByTier(registry.templates, 3, 'litrpg');
    expect(tier3).toHaveLength(1);
    
    const tier8 = filterTemplatesByTier(registry.templates, 8, 'litrpg');
    expect(tier8).toHaveLength(0);
  });

  it('B005: Pick encounter template with seeding', () => {
    const registry = createTemplateRegistry();
    const template = createTestTemplate();
    registerTemplate(registry, template);
    
    const state = createTestState();
    state.campaignBibleId = 'test-bible';
    state.currentLocation = 'Test Dungeon Floor 1';
    
    const picked = pickEncounterTemplate(
      registry,
      state,
      { 
        bibleId: 'test-bible',
        location: 'Test Dungeon Floor 1',
        biome: 'dungeon',
        tier: 1,
        densityRole: 'trash',
        seed: 123
      }
    );
    
    expect(picked).toBeDefined();
    expect(picked?.id).toBe(template.id);
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
    const registry = createTemplateRegistry();
    
    // Create a Keep Wraith template
    const keepWraithTemplate = createTestTemplate();
    keepWraithTemplate.id = 'cursed-keep.elite.keep-wraith';
    keepWraithTemplate.name = 'Keep Wraith Guardian';
    keepWraithTemplate.bibleId = 'cursed-keep';
    registerTemplate(registry, keepWraithTemplate);
    
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
    const registry = createTemplateRegistry();
    
    // Add matching template
    const legalTemplate = createTestTemplate();
    legalTemplate.bibleId = 'summoned-pact';
    legalTemplate.mode = 'litrpg';
    registerTemplate(registry, legalTemplate);
    
    // Add non-matching template
    const illegalTemplate = createTestTemplate();
    illegalTemplate.id = 'cursed-keep.elite.keep-wraith';
    illegalTemplate.bibleId = 'cursed-keep';
    illegalTemplate.mode = 'dnd';
    registerTemplate(registry, illegalTemplate);
    
    const filtered = filterByBiome(
      registry.templates,
      'summoned-pact',
      'urban-hub',
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
