/**
 * XP-D1 OPEN7 — Story RPG offers Gather when node stock exists and the pouch can take it.
 * Root cause on 7307: containers=[] → canAddMaterials always false; ensureGatherPouch fixes it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  rankChoices,
  GATHER_WILDS_CHIP,
  isGatherChip,
  isHuntChip,
} from './choiceRanking';
import { ensureWildsReady, hasNodeStock, ensureGatherPouch } from './wilds';
import { gatherModeOk, startGatherFromInput } from './wildlifeActions';
import { canAddMaterials } from './inventory';
import type { GameState } from './types';

/** The recovered s7307 final is Twin Lanterns, not a Redmesa path. Untracked; never committed. */
const REL7307 = 'scripts/fate-autoplay/runs/2026-11-02T14-58-47-531Z_twin-lanterns_chilled-gm_s7307/snapshot.json';

function open7SnapshotPath(): string | null {
  for (const root of [process.cwd(), resolve(__dirname, '../..')]) {
    const p = resolve(root, REL7307);
    if (existsSync(p)) return p;
  }
  return null;
}

function load7307(): GameState | null {
  const path = open7SnapshotPath();
  if (!path) return null;
  const snap = JSON.parse(readFileSync(path, 'utf8'));
  return snap.state as GameState;
}

function rpgBare(): GameState {
  return {
    engineMode: 'rpg',
    turn: 12,
    seed: 7307,
    saveId: 'open7-rpg',
    currentLocation: 'Dying Campfire',
    character: { name: 'Jax', level: 2, xp: 20, xpToNext: 187, hp: 20, maxHp: 20 },
    openingEstablishment: { complete: true, pending: [], answers: {} },
    inventory: [{ id: 'deed', name: 'Claim Deed' }],
    containers: [],
    materials: [],
    quests: [],
    log: [],
    places: [
      { id: 'place_dying-campfire', name: 'Dying Campfire', regionId: 'redmesa' },
    ],
    nodeStockByPlace: {
      'place_dying-campfire': {
        placeId: 'place_dying-campfire',
        nodes: [
          { id: 'peacebloom', kind: 'herb', tier: 1, stock: 4, maxStock: 4 },
          { id: 'tin-ore', kind: 'ore', tier: 2, stock: 4, maxStock: 4 },
        ],
        lastRefillHour: 9,
      },
    },
    regionLevelBands: { redmesa: { low: 1, high: 4 } },
    regionResourceProfiles: {
      redmesa: { regionId: 'redmesa', oreTier: 2, herbTier: 1, richWeak: false, oreId: 'tin-ore', herbId: 'peacebloom' },
    },
  } as unknown as GameState;
}

describe('OPEN7 Story RPG Gather', () => {
  it('ensureGatherPouch unlocks materials capacity when RPG has no containers', () => {
    const bare = rpgBare();
    expect(canAddMaterials(bare, 1).ok).toBe(false);
    const withPouch = ensureGatherPouch(bare);
    expect(canAddMaterials(withPouch, 1).ok).toBe(true);
    expect(withPouch.containers?.some((c) => c.storageType === 'Materials Only')).toBe(true);
  });

  it('Gather is offered at places with stock; Hunt never in Story RPG', () => {
    let state = ensureWildsReady(rpgBare());
    expect(gatherModeOk(state)).toBe(true);
    expect(hasNodeStock(state)).toBe(true);
    expect(canAddMaterials(state, 1).ok).toBe(true);
    const ranked = rankChoices(state, [
      "Travel toward Sniper's Nest on the Ridge",
      'Ask Marshal Kett about the lead',
      'Search the area',
      'Say something…',
    ]);
    expect(ranked.choices.some((c) => isGatherChip(c) || c === GATHER_WILDS_CHIP)).toBe(true);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(false);
  });

  it('Gather is not offered where node stock is empty', () => {
    let state = ensureWildsReady({
      ...rpgBare(),
      currentLocation: 'Empty Cellar',
      places: [{ id: 'place_empty-cellar', name: 'Empty Cellar', regionId: 'redmesa' }],
      nodeStockByPlace: {
        'place_empty-cellar': {
          placeId: 'place_empty-cellar',
          nodes: [{ id: 'peacebloom', kind: 'herb', tier: 1, stock: 0, maxStock: 4 }],
          lastRefillHour: 9,
        },
      },
    } as unknown as GameState);
    // Indoor cellar — outdoor gate may also hide Gather; force outdoor name:
    state = ensureWildsReady({
      ...state,
      currentLocation: 'Windy Ridge',
      places: [{ id: 'place_windy-ridge', name: 'Windy Ridge', regionId: 'redmesa' }],
      nodeStockByPlace: {
        'place_windy-ridge': {
          placeId: 'place_windy-ridge',
          nodes: [{ id: 'peacebloom', kind: 'herb', tier: 1, stock: 0, maxStock: 4 }],
          lastRefillHour: 9,
        },
      },
    } as unknown as GameState);
    expect(hasNodeStock(state)).toBe(false);
    const ranked = rankChoices(state, ['Look around', 'Travel toward Dying Campfire', 'Wait']);
    expect(ranked.choices.some((c) => isGatherChip(c))).toBe(false);
  });

  it('typed gather herbs is never rejected; pays trade XP only (no character XP)', () => {
    const state = ensureWildsReady(rpgBare());
    const beforeXp = state.character.xp;
    const beforeLevel = state.character.level;
    const out = startGatherFromInput(state, 'gather herbs');
    expect(out).not.toBeNull();
    expect(out!.state.character.xp).toBe(beforeXp);
    expect(out!.state.character.level).toBe(beforeLevel);
  });

  it.skipIf(!open7SnapshotPath())(
    'real 7307 final: Gather appears after pouch ensure at stocked campfire',
    () => {
      const loaded = load7307()!;
      expect(loaded.engineMode).toBe('rpg');
      let state = {
        ...loaded,
        currentLocation: 'Dying Campfire',
        journey: undefined,
        activeEncounter: undefined,
        activeDungeon: undefined,
      } as GameState;
      expect(canAddMaterials(state, 1).ok).toBe(false);
      state = ensureWildsReady(state);
      expect(canAddMaterials(state, 1).ok).toBe(true);
      expect(hasNodeStock(state)).toBe(true);
      const ranked = rankChoices(state, [
        "Travel toward Sniper's Nest on the Ridge",
        'Ask Marshal Kett about the lead',
        'Search the area',
      ]);
      expect(ranked.choices.some((c) => isGatherChip(c))).toBe(true);
      expect(ranked.choices.some((c) => isHuntChip(c))).toBe(false);
    }
  );
});
