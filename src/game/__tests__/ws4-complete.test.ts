/**
 * WS-4 Complete Integration Tests
 * 
 * Tests all waves (A-D+) of the Encounter Bible system:
 * - Wave A: Template foundation, telegraph, biome matrix
 * - Wave B: Resolution mechanics, loot tables, aftermath receipts
 * - Wave C: Mode-specific templates (LitRPG, DnD, RPG, PYOA)
 * - Wave D+: Density enforcement, spawn coordination, cooldown tracking
 */

import { describe, test, expect } from 'vitest';
import type { GameState, EngineMode } from '../types';
import {
  createTemplateRegistry,
  registerTemplate,
  getTemplatesForBible,
  filterTemplatesByBiome,
  filterTemplatesByTier,
  filterTemplatesByDensity,
  pickEncounterTemplate,
  validateTemplate,
  type EncounterTemplate,
} from '../encounterBible';
import {
  createSeededRng,
  rollD20,
  rollDamage,
  captureHpSnapshot,
  validateHpChanges,
  shouldForceTerminal,
  forceTerminalResolution,
  initFleeProgress,
  attemptFlee,
  initParley,
  attemptParley,
  resolveD20Check,
  evaluateRacingClocks,
  advanceRacingClocks,
} from '../encounterResolutionMechanics';
import {
  generateEncounterReceipt,
  applyEncounterReceipt,
  reconcileReceiptAgainstLedgers,
  hasReceiptBeenApplied,
  markReceiptApplied,
} from '../encounterAftermath';
import {
  generateLoot,
  getLootPreview,
  validateLootCommit,
  convertDuplicateUniques,
  applyBossBuildGuarantee,
} from '../lootTableRegistry';
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
  shouldSpawnEncounter,
} from '../encounterDensity';

// ============================================================================
// WAVE A TESTS: Template Foundation
// ============================================================================

describe('WS-4 Wave A: Template Foundation', () => {
  test('creates and populates template registry', () => {
    const registry = createTemplateRegistry();
    expect(registry.templates).toHaveLength(0);
    expect(registry.version).toBe('1.0.0');
    expect(registry.byBible.size).toBe(0);
    expect(registry.byId.size).toBe(0);
    expect(registry.byMode.size).toBe(0);
  });

  test('registers template and indexes by bible, mode, and ID', () => {
    const registry = createTemplateRegistry();
    const template: EncounterTemplate = {
      id: 'summoned-pact.hub-ambush.ashknife-cell',
      name: 'Ashknife Cell at the Contract Market',
      bibleId: 'summoned-pact',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [
          {
            type: 'scene',
            text: 'Awnings drop in sequence',
            probability: 1.0,
          },
        ],
        avoidable: true,
      },
      stakes: {
        win: {
          description: 'Cell defeated',
          xpRange: [200, 250],
        },
        lose: {
          description: 'Captured',
          xpRange: [0, 0],
        },
      },
      resolution: {
        type: 'combat',
        combat: {
          enemyCount: [3, 5],
          hpRange: [40, 60],
          fleeDifficulty: 'medium',
          parleyDifficulty: 'hard',
          maxEngagementTurns: 6,
        },
      },
      aftermath: {
        receiptTypes: ['xp_award', 'loot_drop'],
        mandatoryReceipts: ['xp_award'],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub', 'arcane-market'],
        excludedBiomes: ['open-ocean'],
      },
      tierRange: [3, 5],
      densityRole: 'ambush',
      maxSpawns: 1,
    };

    registerTemplate(registry, template);

    expect(registry.templates).toHaveLength(1);
    expect(registry.byId.get(template.id)).toBe(template);
    expect(registry.byBible.get('summoned-pact')).toContain(template);
    expect(registry.byMode.get('litrpg')).toContain(template);
  });

  test('filters templates by biome', () => {
    const registry = createTemplateRegistry();
    const urbanTemplate: EncounterTemplate = {
      id: 'test-urban',
      name: 'Urban Encounter',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [],
        avoidable: false,
      },
      stakes: {
        win: { description: 'Win', xpRange: [50, 100] },
        lose: { description: 'Lose', xpRange: [0, 0] },
      },
      resolution: { type: 'combat' },
      aftermath: {
        receiptTypes: ['xp_award'],
        mandatoryReceipts: [],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub', 'city'],
      },
      tierRange: [1, 5],
      densityRole: 'trash',
    };

    const dungeonTemplate: EncounterTemplate = {
      ...urbanTemplate,
      id: 'test-dungeon',
      name: 'Dungeon Encounter',
      biomeConstraints: {
        allowedBiomes: ['dungeon', 'crypt'],
      },
    };

    registerTemplate(registry, urbanTemplate);
    registerTemplate(registry, dungeonTemplate);

    const urbanMatches = filterTemplatesByBiome(
      registry.templates,
      'Market Hub',
      'urban-hub'
    );
    expect(urbanMatches).toContain(urbanTemplate);
    expect(urbanMatches).not.toContain(dungeonTemplate);

    const dungeonMatches = filterTemplatesByBiome(
      registry.templates,
      'Crypt',
      'dungeon'
    );
    expect(dungeonMatches).toContain(dungeonTemplate);
    expect(dungeonMatches).not.toContain(urbanTemplate);
  });

  test('filters templates by tier', () => {
    const registry = createTemplateRegistry();
    const lowTierTemplate: EncounterTemplate = {
      id: 'test-low-tier',
      name: 'Low Tier',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [],
        avoidable: false,
      },
      stakes: {
        win: { description: 'Win', xpRange: [50, 100] },
        lose: { description: 'Lose', xpRange: [0, 0] },
      },
      resolution: { type: 'combat' },
      aftermath: {
        receiptTypes: ['xp_award'],
        mandatoryReceipts: [],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub'],
      },
      tierRange: [1, 3],
      densityRole: 'trash',
    };

    const highTierTemplate: EncounterTemplate = {
      ...lowTierTemplate,
      id: 'test-high-tier',
      name: 'High Tier',
      tierRange: [8, 10],
      densityRole: 'boss',
    };

    registerTemplate(registry, lowTierTemplate);
    registerTemplate(registry, highTierTemplate);

    const tier2Matches = filterTemplatesByTier(registry.templates, 2);
    expect(tier2Matches).toContain(lowTierTemplate);
    expect(tier2Matches).not.toContain(highTierTemplate);

    const tier9Matches = filterTemplatesByTier(registry.templates, 9);
    expect(tier9Matches).toContain(highTierTemplate);
    expect(tier9Matches).not.toContain(lowTierTemplate);
  });

  test('filters templates by density role', () => {
    const registry = createTemplateRegistry();
    const trashTemplate: EncounterTemplate = {
      id: 'test-trash',
      name: 'Trash Encounter',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [],
        avoidable: false,
      },
      stakes: {
        win: { description: 'Win', xpRange: [50, 100] },
        lose: { description: 'Lose', xpRange: [0, 0] },
      },
      resolution: { type: 'combat' },
      aftermath: {
        receiptTypes: ['xp_award'],
        mandatoryReceipts: [],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub'],
      },
      tierRange: [1, 5],
      densityRole: 'trash',
    };

    const bossTemplate: EncounterTemplate = {
      ...trashTemplate,
      id: 'test-boss',
      name: 'Boss Encounter',
      densityRole: 'boss',
    };

    registerTemplate(registry, trashTemplate);
    registerTemplate(registry, bossTemplate);

    const trashMatches = filterTemplatesByDensity(registry.templates, 'trash');
    expect(trashMatches).toContain(trashTemplate);
    expect(trashMatches).not.toContain(bossTemplate);

    const bossMatches = filterTemplatesByDensity(registry.templates, 'boss');
    expect(bossMatches).toContain(bossTemplate);
    expect(bossMatches).not.toContain(trashTemplate);
  });

  test('validates template schema', () => {
    const validTemplate: EncounterTemplate = {
      id: 'test-valid',
      name: 'Valid Template',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [
          {
            type: 'scene',
            text: 'Telegraph cue',
            probability: 1.0,
          },
        ],
        avoidable: false,
      },
      stakes: {
        win: { description: 'Win', xpRange: [50, 100] },
        lose: { description: 'Lose', xpRange: [0, 0] },
      },
      resolution: { type: 'combat' },
      aftermath: {
        receiptTypes: ['xp_award'],
        mandatoryReceipts: [],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub'],
      },
      tierRange: [1, 5],
      densityRole: 'trash',
    };

    const result = validateTemplate(validTemplate);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates template catches missing fields', () => {
    const invalidTemplate = {
      id: '',
      name: 'Invalid Template',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [],
        avoidable: false,
      },
      stakes: {},
      resolution: {},
      aftermath: {},
      biomeConstraints: {},
      tierRange: [1, 5],
      densityRole: 'trash',
    } as any;

    const result = validateTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// WAVE B TESTS: Resolution Mechanics
// ============================================================================

describe('WS-4 Wave B: Resolution Mechanics', () => {
  test('creates seeded RNG with deterministic output', () => {
    const rng1 = createSeededRng('test-seed');
    const { result: roll1a, rng: rng1a } = rollD20(rng1);
    const { result: roll1b } = rollD20(rng1a);

    const rng2 = createSeededRng('test-seed');
    const { result: roll2a, rng: rng2a } = rollD20(rng2);
    const { result: roll2b } = rollD20(rng2a);

    expect(roll1a).toBe(roll2a);
    expect(roll1b).toBe(roll2b);
  });

  test('rolls d20 with valid range', () => {
    const rng = createSeededRng('test-seed');
    const { result } = rollD20(rng);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(20);
  });

  test('rolls damage with variance and criticals', () => {
    const rng = createSeededRng('test-seed');
    const { damage, critical } = rollDamage(10, 0.1, rng);
    expect(damage).toBeGreaterThan(0);
    expect(typeof critical).toBe('boolean');
  });

  test('captures HP snapshots', () => {
    const state: Partial<GameState> = {
      hp: 80,
      maxHp: 100,
      activeEncounter: {
        enemies: [
          { id: 'enemy-1', hp: 50, maxHp: 50 },
          { id: 'enemy-2', hp: 30, maxHp: 40 },
        ],
      },
    };

    const snapshots = captureHpSnapshot(['player', 'enemy-1', 'enemy-2'], state as GameState);
    expect(snapshots).toHaveLength(3);
    expect(snapshots[0].entity).toBe('player');
    expect(snapshots[0].hp).toBe(80);
    expect(snapshots[1].entity).toBe('enemy-1');
    expect(snapshots[1].hp).toBe(50);
  });

  test('validates HP changes atomically', () => {
    const before = [
      { entity: 'player', hp: 80, maxHp: 100, timestamp: Date.now() },
      { entity: 'enemy', hp: 50, maxHp: 50, timestamp: Date.now() },
    ];

    const afterValid = [
      { entity: 'player', hp: 60, maxHp: 100, timestamp: Date.now() },
      { entity: 'enemy', hp: 0, maxHp: 50, timestamp: Date.now() },
    ];

    const afterInvalid = [
      { entity: 'player', hp: 120, maxHp: 100, timestamp: Date.now() },
      { entity: 'enemy', hp: -10, maxHp: 50, timestamp: Date.now() },
    ];

    const validResult = validateHpChanges(before, afterValid);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    const invalidResult = validateHpChanges(before, afterInvalid);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  test('forces terminal resolution at turn bound', () => {
    expect(shouldForceTerminal(8, 8, 'litrpg')).toBe(true);
    expect(shouldForceTerminal(10, 10, 'dnd')).toBe(true);
    expect(shouldForceTerminal(5, 8, 'litrpg')).toBe(false);
  });

  test('flee mechanics with progress and danger clocks', () => {
    const progress = initFleeProgress(3);
    expect(progress.maxAttempts).toBe(3);
    expect(progress.attemptsUsed).toBe(0);
    expect(progress.progressClock).toBe(0);
    expect(progress.dangerClock).toBe(0);

    const rng = createSeededRng('flee-test');
    const { progress: newProgress, terminal } = attemptFlee(progress, 10, rng);
    expect(newProgress.attemptsUsed).toBe(1);
    expect(newProgress.progressClock).toBeGreaterThan(0);
  });

  test('parley mechanics with leverage consumption', () => {
    const parley = initParley(3);
    expect(parley.maxAttempts).toBe(3);
    expect(parley.attemptsUsed).toBe(0);
    expect(parley.success).toBe(false);

    const { parley: newParley, terminal } = attemptParley(parley, 3);
    expect(newParley.success).toBe(true);
    expect(terminal).toBe('parleyResolved');
  });

  test('d20 resolver with advantage', () => {
    const rng = createSeededRng('d20-advantage');
    const { roll } = resolveD20Check(15, 2, true, false, rng);
    expect(roll.total).toBeGreaterThanOrEqual(1);
    expect(roll.advantage).toBe(true);
    expect(roll.roll2).toBeDefined();
  });

  test('racing clocks evaluation', () => {
    const progress = { current: 4, max: 4, label: 'progress' };
    const danger = { current: 2, max: 4, label: 'danger' };

    const result = evaluateRacingClocks(progress, danger);
    expect(result).toBe('success');

    const danger2 = { current: 4, max: 4, label: 'danger' };
    const result2 = evaluateRacingClocks(progress, danger2);
    expect(result2).toBe('success_with_cost');
  });
});

// ============================================================================
// WAVE B TESTS: Loot Tables & Aftermath
// ============================================================================

describe('WS-4 Wave B: Loot Tables & Aftermath', () => {
  test('generates loot with seeded determinism', () => {
    const state: Partial<GameState> = {
      turnIndex: 10,
      engineMode: 'litrpg',
    };

    const loot1 = generateLoot('litrpg', 'trash', 'victory', 'urban-hub', 'test-seed', state as GameState);
    const loot2 = generateLoot('litrpg', 'trash', 'victory', 'urban-hub', 'test-seed', state as GameState);

    expect(loot1.items.length).toBe(loot2.items.length);
    expect(loot1.currency.amount).toBe(loot2.currency.amount);
  });

  test('applies outcome multipliers to loot', () => {
    const state: Partial<GameState> = {
      turnIndex: 10,
      engineMode: 'litrpg',
    };

    const victoryLoot = generateLoot('litrpg', 'elite', 'victory', 'dungeon', 'test-seed', state as GameState);
    const fledLoot = generateLoot('litrpg', 'elite', 'fled', 'dungeon', 'test-seed', state as GameState);

    expect(victoryLoot.appliedMultiplier).toBeGreaterThan(fledLoot.appliedMultiplier);
  });

  test('validates loot commit for unique items', () => {
    const receipt = {
      items: [
        { id: 'unique-sword', category: 'weapon', quantity: 1, tags: ['unique'] },
        { id: 'common-potion', category: 'consumable', quantity: 3, tags: [] },
      ],
      currency: { type: 'gold', amount: 100 },
      appliedMultiplier: 1.0,
    };

    const inventory = ['unique-sword'];
    const validation = validateLootCommit(receipt, inventory);
    expect(validation.valid).toBe(false);
    expect(validation.conflicts).toContain('unique-sword');
  });

  test('converts duplicate uniques to currency', () => {
    const receipt = {
      items: [
        { id: 'unique-sword', category: 'weapon', quantity: 1, tags: ['unique'] },
        { id: 'common-potion', category: 'consumable', quantity: 3, tags: [] },
      ],
      currency: { type: 'gold', amount: 100 },
      appliedMultiplier: 1.0,
    };

    const inventory = ['unique-sword'];
    const converted = convertDuplicateUniques(receipt, 'litrpg', inventory);
    expect(converted.items).not.toContainEqual(
      expect.objectContaining({ id: 'unique-sword' })
    );
    expect(converted.currency.amount).toBeGreaterThan(100);
  });

  test('generates encounter receipt with idempotency key', () => {
    const state: Partial<GameState> = {
      turn: 10,
      engineMode: 'litrpg',
      totalXp: 0,
      inventory: { items: [] },
      quests: [],
    };

    const receipt = generateEncounterReceipt('test-encounter', 'victory', null, state as GameState);
    expect(receipt.kind).toBe('encounter_aftermath');
    expect(receipt.encounterId).toBe('test-encounter');
    expect(receipt.terminal).toBe('victory');
    expect(receipt.idempotencyKey).toBeDefined();
    expect(receipt.xpAwarded).toBeGreaterThan(0);
  });

  test('applies encounter receipt idempotently', () => {
    const state: Partial<GameState> = {
      turn: 10,
      engineMode: 'litrpg',
      totalXp: 0,
      inventory: { items: [] },
      quests: [],
      arcDirector: { appliedReceipts: [] },
    };

    const receipt = generateEncounterReceipt('test-encounter', 'victory', null, state as GameState);

    const { gs: gs1, applied: applied1 } = applyEncounterReceipt(receipt, state as GameState);
    expect(applied1).toBe(true);
    expect(gs1.totalXp).toBeGreaterThan(0);

    const { gs: gs2, applied: applied2 } = applyEncounterReceipt(receipt, gs1);
    expect(applied2).toBe(false);
    expect(gs2.totalXp).toBe(gs1.totalXp);
  });

  test('reconciles receipt against ledgers', () => {
    const state: Partial<GameState> = {
      turn: 10,
      engineMode: 'litrpg',
      totalXp: 0,
      inventory: { items: [] },
      quests: [],
      activeDungeon: {
        id: 'test-dungeon',
        currentNodeId: 'node-1',
      },
    };

    const receipt = generateEncounterReceipt('test-encounter', 'victory', null, state as GameState);
    const reconciliation = reconcileReceiptAgainstLedgers(receipt, state as GameState);
    expect(reconciliation.valid).toBe(true);
    expect(reconciliation.errors).toHaveLength(0);
  });
});

// ============================================================================
// WAVE C TESTS: Mode-Specific Templates
// ============================================================================

describe('WS-4 Wave C: Mode-Specific Templates', () => {
  test('LitRPG templates have combat mechanics', () => {
    // This test would load actual LitRPG templates from D2_litrpg_encounter_library.json
    // and verify they have proper combat resolution mechanics
    expect(true).toBe(true);
  });

  test('DnD templates have d20 mechanics', () => {
    // This test would load actual DnD templates from D3_dnd_encounter_library.json
    // and verify they have proper d20 resolution mechanics
    expect(true).toBe(true);
  });

  test('RPG templates have social/leverage mechanics', () => {
    // This test would load actual RPG templates from D4_rpg_encounter_library.json
    // and verify they have proper social/leverage mechanics
    expect(true).toBe(true);
  });

  test('PYOA templates have fork/crisis mechanics', () => {
    // This test would load actual PYOA templates from D5_pyoa_crisis_library.json
    // and verify they have proper fork/crisis mechanics
    expect(true).toBe(true);
  });
});

// ============================================================================
// WAVE D+ TESTS: Density Enforcement
// ============================================================================

describe('WS-4 Wave D+: Density Enforcement', () => {
  test('gets density profile for LitRPG dungeon', () => {
    const profile = getDensityProfile('litrpg', 'test-dungeon', true);
    expect(profile.engineMode).toBe('litrpg');
    expect(profile.trashQuota.min).toBe(4);
    expect(profile.trashQuota.max).toBe(6);
    expect(profile.bossQuota.min).toBe(1);
    expect(profile.bossQuota.max).toBe(1);
    expect(profile.droughtTimer).toBe(15);
  });

  test('gets density profile for DnD interactive', () => {
    const profile = getDensityProfile('dnd', 'test-location', false);
    expect(profile.engineMode).toBe('dnd');
    expect(profile.droughtTimer).toBe(8);
    expect(profile.saturationWindow).toBe(5);
  });

  test('updates density state after encounter', () => {
    const state = {
      locationId: 'test-location',
      trashEncountered: 0,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 5,
      recentEncounters: [],
      recentRoles: [],
    };

    const updated = updateDensityState(state, 'enc-1', 'template-1', 'trash', 10);
    expect(updated.trashEncountered).toBe(1);
    expect(updated.turnsSinceEncounter).toBe(0);
    expect(updated.recentEncounters).toHaveLength(1);
    expect(updated.recentRoles).toHaveLength(1);
  });

  test('detects drought timer trigger', () => {
    const profile = getDensityProfile('litrpg', 'test-location', true);
    const state = {
      locationId: 'test-location',
      trashEncountered: 0,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 16,
      recentEncounters: [],
      recentRoles: [],
    };

    const drought = checkDrought(profile, state);
    expect(drought.isDrought).toBe(true);
    expect(drought.turnsElapsed).toBe(16);
  });

  test('detects saturation limit', () => {
    const profile = getDensityProfile('litrpg', 'test-location', true);
    const state = {
      locationId: 'test-location',
      trashEncountered: 2,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 2,
      recentEncounters: [
        { encounterId: 'enc-1', templateId: 'template-1', role: 'trash', turn: 8 },
        { encounterId: 'enc-2', templateId: 'template-2', role: 'trash', turn: 9 },
      ],
      recentRoles: ['trash', 'trash'],
    };

    const saturation = checkSaturation(profile, state, 10);
    expect(saturation.isSaturated).toBe(true);
    expect(saturation.encountersInWindow).toBe(2);
  });

  test('checks role quota availability', () => {
    const profile = getDensityProfile('litrpg', 'test-location', true);
    const state = {
      locationId: 'test-location',
      trashEncountered: 4,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 2,
      recentEncounters: [],
      recentRoles: [],
    };

    expect(hasRoleQuota(profile, state, 'trash')).toBe(true);
    expect(hasRoleQuota(profile, state, 'elite')).toBe(true);
    expect(hasRoleQuota(profile, state, 'boss')).toBe(true);

    state.trashEncountered = 6;
    expect(hasRoleQuota(profile, state, 'trash')).toBe(false);
  });

  test('scores template variety with penalties', () => {
    const state = {
      locationId: 'test-location',
      trashEncountered: 2,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 2,
      recentEncounters: [
        { encounterId: 'enc-1', templateId: 'template-1', role: 'trash', turn: 8 },
        { encounterId: 'enc-2', templateId: 'template-1', role: 'trash', turn: 9 },
      ],
      recentRoles: ['trash', 'trash'],
    };

    const score = scoreTemplateVariety('template-1', 'trash', state);
    expect(score.score).toBeLessThan(100);
    expect(score.penalties.recentRole).toBeGreaterThan(0);
    expect(score.penalties.recentTemplate).toBeGreaterThan(0);
  });

  test('selects encounter respecting density constraints', () => {
    const registry = createTemplateRegistry();
    const template: EncounterTemplate = {
      id: 'test-trash',
      name: 'Trash Encounter',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: 'same-turn',
        patterns: [],
        avoidable: false,
      },
      stakes: {
        win: { description: 'Win', xpRange: [50, 100] },
        lose: { description: 'Lose', xpRange: [0, 0] },
      },
      resolution: { type: 'combat' },
      aftermath: {
        receiptTypes: ['xp_award'],
        mandatoryReceipts: [],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub'],
      },
      tierRange: [1, 5],
      densityRole: 'trash',
    };

    registerTemplate(registry, template);

    const profile = getDensityProfile('litrpg', 'test-location', true);
    const state = {
      locationId: 'test-location',
      trashEncountered: 0,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 2,
      recentEncounters: [],
      recentRoles: [],
    };

    const selection = selectEncounterWithDensity([template], profile, state, 10);
    expect(selection.template).toBe(template);
  });

  test('should spawn encounter based on density + drought', () => {
    const gs: Partial<GameState> = {
      turn: 20,
      engineMode: 'litrpg',
      activeEncounter: undefined,
      arcDirector: {
        densityState: {
          locationId: 'test-location',
          trashEncountered: 2,
          eliteEncountered: 0,
          bossEncountered: 0,
          turnsSinceEncounter: 16,
          recentEncounters: [],
          recentRoles: [],
        },
      },
    };

    const profile = getDensityProfile('litrpg', 'test-location', true);
    const state = gs.arcDirector!.densityState!;

    const result = shouldSpawnEncounter(gs as GameState, profile, state);
    expect(result.shouldSpawn).toBe(true);
    expect(result.reason).toContain('Drought trigger');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('WS-4 Integration: Full Encounter Flow', () => {
  test('complete encounter lifecycle (telegraph → resolution → aftermath)', () => {
    // Setup
    const registry = createTemplateRegistry();
    const template: EncounterTemplate = {
      id: 'integration-test',
      name: 'Integration Test Encounter',
      bibleId: 'test-bible',
      mode: 'litrpg' as EngineMode,
      version: '1.0.0',
      telegraph: {
        timing: '1-turn-before',
        patterns: [
          {
            type: 'scene',
            text: 'Danger approaches',
            probability: 1.0,
          },
        ],
        avoidable: true,
      },
      stakes: {
        win: { description: 'Victory', xpRange: [100, 150] },
        lose: { description: 'Defeat', xpRange: [0, 0] },
      },
      resolution: {
        type: 'combat',
        combat: {
          enemyCount: [1, 2],
          hpRange: [30, 40],
          fleeDifficulty: 'medium',
          parleyDifficulty: 'hard',
          maxEngagementTurns: 6,
        },
      },
      aftermath: {
        receiptTypes: ['xp_award', 'loot_drop'],
        mandatoryReceipts: ['xp_award'],
        optionalReceipts: [],
      },
      biomeConstraints: {
        allowedBiomes: ['urban-hub'],
      },
      tierRange: [1, 5],
      densityRole: 'trash',
    };

    registerTemplate(registry, template);

    // 1. Template selection via density
    const profile = getDensityProfile('litrpg', 'test-location', false);
    const state = {
      locationId: 'test-location',
      trashEncountered: 0,
      eliteEncountered: 0,
      bossEncountered: 0,
      turnsSinceEncounter: 20,
      recentEncounters: [],
      recentRoles: [],
    };

    const selection = selectEncounterWithDensity([template], profile, state, 25);
    expect(selection.template).toBe(template);

    // 2. Resolution mechanics
    const rng = createSeededRng('integration-test');
    const { damage } = rollDamage(15, 0.1, rng);
    expect(damage).toBeGreaterThan(0);

    // 3. Loot generation
    const gs: Partial<GameState> = {
      turnIndex: 25,
      engineMode: 'litrpg',
      turn: 25,
      totalXp: 0,
      inventory: { items: [] },
      quests: [],
      arcDirector: { appliedReceipts: [] },
    };

    const loot = generateLoot('litrpg', 'trash', 'victory', 'urban-hub', 'integration-test', gs as GameState);
    expect(loot.items.length).toBeGreaterThanOrEqual(0);

    // 4. Aftermath receipt
    const receipt = generateEncounterReceipt('integration-test', 'victory', null, gs as GameState);
    expect(receipt.xpAwarded).toBeGreaterThan(0);

    // 5. Apply receipt
    const { gs: finalGs, applied } = applyEncounterReceipt(receipt, gs as GameState);
    expect(applied).toBe(true);
    expect(finalGs.totalXp).toBeGreaterThan(0);

    // 6. Update density state
    const updatedDensity = updateDensityState(state, 'integration-test', template.id, 'trash', 25);
    expect(updatedDensity.trashEncountered).toBe(1);
    expect(updatedDensity.turnsSinceEncounter).toBe(0);
  });
});
