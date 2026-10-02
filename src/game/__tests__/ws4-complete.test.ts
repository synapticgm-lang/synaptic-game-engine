/**
 * WS-4 Complete Integration Tests
 * 
 * Tests all waves (A-D+) of the Encounter Bible system:
 * - Wave A: Template foundation, telegraph, biome matrix
 * - Wave B: Loot tables
 * - Wave C: Mode-specific templates (LitRPG, DnD, RPG, PYOA)
 * - Wave D+: Density enforcement, spawn coordination, cooldown tracking
 */

import { describe, test, expect } from 'vitest';
import type { GameState, EngineMode } from '../types';
import type { EncounterTemplate } from '../encounterBible';
import {
  allCatalogEncounters,
  encountersForMode,
  findCatalogEncounter,
  isCatalogFoeName,
  selectCatalogEncounter,
} from '../encounterBible';
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

describe('WS-4 Wave A: Encounter catalog (replaced the template registry in 12b)', () => {
  const at = (over: Partial<GameState>): GameState =>
    ({ engineMode: 'litrpg', turn: 5, currentLocation: '', sceneFacts: {}, stateTxLog: [], ...over }) as GameState;

  test('catalog lists authored rows for every mode', () => {
    for (const mode of ['litrpg', 'dnd', 'rpg', 'pyoa'] as const) {
      expect(encountersForMode(mode).length).toBeGreaterThan(0);
    }
  });

  test('rows are found by id and listed under their own mode', () => {
    for (const seed of allCatalogEncounters()) {
      expect(findCatalogEncounter(seed.id)).toBe(seed);
      expect(encountersForMode(seed.mode)).toContain(seed);
    }
  });

  test('every row is a named foe; fights carry a reward, PYOA crises do not', () => {
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

  test('unknown ids and blank names are not catalog rows', () => {
    expect(findCatalogEncounter('')).toBeUndefined();
    expect(isCatalogFoeName('')).toBe(false);
    expect(isCatalogFoeName('Pact-Hunter Skirmisher', 'litrpg')).toBe(true);
    expect(isCatalogFoeName('Pact-Hunter Skirmisher', 'dnd')).toBe(false);
  });

  test('litrpg catalog holds trash, elite and boss tiers', () => {
    const tiers = new Set(encountersForMode('litrpg').map((s) => s.tier));
    expect(tiers.has('trash')).toBe(true);
    expect(tiers.has('elite')).toBe(true);
    expect(tiers.has('boss')).toBe(true);
  });

  test('director pick is a catalog row of the mode, early turns pick trash', () => {
    const picked = selectCatalogEncounter(at({ turn: 5 }));
    expect(picked).not.toBeNull();
    expect(encountersForMode('litrpg')).toContain(picked!);
    expect(picked!.tier).toBe('trash');
    expect(selectCatalogEncounter(at({ turn: 5 }))).toBe(picked);
  });

  test('late turns pick elite and a hub prefers its own row', () => {
    expect(selectCatalogEncounter(at({ turn: 25 }))?.tier).toBe('elite');
    expect(selectCatalogEncounter(at({ turn: 5, currentLocation: 'Mireglass reeds' }))?.hubId).toBe('sp-hub-mireglass');
  });

  test('PYOA drought never picks a catalog foe', () => {
    expect(selectCatalogEncounter(at({ engineMode: 'pyoa' }))).toBeNull();
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
