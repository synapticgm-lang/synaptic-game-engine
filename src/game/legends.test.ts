/**
 * Capped legends. Offline. No model call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyFactGate } from './factGate';
import { buildFactSheet, formatFactSheetForWriter } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import { attachDungeonLegend, knowLegends, REGION_CAP, retireQuietLegends, seedWorldLegends, WORLD_CAP } from './legends';
import { ensureNpcSheet } from './npcSheet';
import { seedWorldAtlas } from './worldAtlas';
import type { FactSheet, GameState, NpcMemory } from './types';

function sheet(labels: string[]): FactSheet {
  return {
    turn: 2,
    place: { name: 'Lowmarket', exits: [], features: [] },
    present: [{ name: 'Mira' }],
    openLedger: [],
    gear: { worn: [], carrying: [], inHand: 'nothing' },
    beat: { verb: 'looked', outcome: 'looked', steps: [] },
    player: { typed: 'look', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
    legendLabels: labels,
  };
}

describe('legends', () => {
  it('seeds a few world legends, each aimed at a real settlement, and does not seed twice', () => {
    const first = seedWorldAtlas(createInitialState('Legends', 'dnd') as GameState);
    const rows = first.legends ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(3);
    for (const row of rows) {
      const place = first.worldAtlas?.settlements?.find((p) => p.id === row.target.id);
      expect(place?.name).toBe(row.target.label);
      expect(row.target.kind).toBe('place');
    }
    expect(seedWorldLegends(first).legends).toEqual(rows);
  });

  it('adds one dungeon legend above the area level, and a second call does not grow it', () => {
    const site = {
      dungeonName: 'Old Crypt',
      areaLevel: 4,
      nodes: [{ hidden: { lootables: [{ id: 'chest-1', label: 'iron chest' }] } }],
    };
    const once = attachDungeonLegend(createInitialState('Legends', 'dnd') as GameState, site);
    const twice = attachDungeonLegend(once, site);
    expect(twice.legends).toHaveLength(1);
    expect(twice.legends?.[0]?.target).toMatchObject({ kind: 'item', id: 'chest-1', label: 'iron chest' });
    expect(twice.legends?.[0]?.target.level).toBeGreaterThan(4);
    expect(site.nodes[0]?.hidden?.lootables).toHaveLength(1);
    expect(twice.legends?.[0]?.hiddenTruth).toMatch(/iron chest/);
  });

  it('shows at most three public rumours and hides the truth until the legend is found', () => {
    let state = attachDungeonLegend(createInitialState('Legends', 'dnd') as GameState, {
      dungeonName: 'Old Crypt',
      areaLevel: 4,
      nodes: [{ hidden: { lootables: [{ id: 'chest-1', label: 'iron chest' }] } }],
    });
    const memory: NpcMemory = {
      npcId: 'mira',
      npcName: 'Mira',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 0,
      location: 'Lowmarket',
    };
    state = {
      ...state,
      currentLocation: 'Lowmarket',
      npcMemories: [memory],
      sceneFacts: { present: ['Mira'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 1 },
    };
    const taught = ensureNpcSheet(state, 'Mira', 'Lowmarket');
    const known = taught.npcMemories?.find((m) => m.npcId === 'mira')?.knownLegendIds ?? [];
    expect(known.length).toBeGreaterThan(0);
    expect(known.length).toBeLessThanOrEqual(2);
    expect(ensureNpcSheet(taught, 'Mira', 'Lowmarket').npcMemories?.find((m) => m.npcId === 'mira')?.knownLegendIds).toEqual(known);

    const hidden = formatFactSheetForWriter(buildFactSheet(taught, buildCompletedEventPacket(taught, 'look'), 'look'));
    expect(hidden).toMatch(/Rumours:/);
    expect(hidden).not.toMatch(/placed by the engine/);

    const found = {
      ...taught,
      legends: (taught.legends ?? []).map((row) => row.id === known[0] ? { ...row, status: 'found' as const } : row),
    };
    const open = formatFactSheetForWriter(buildFactSheet(found, buildCompletedEventPacket(found, 'look'), 'look'));
    expect(open).toMatch(/placed by the engine/);
  });

  it('keeps a sheet rumour and a boast, and does not file an unregistered ruin', async () => {
    const label = 'Ash Vault';
    const told = await applyFactGate({
      prose: 'They say the Ash Vault is real.',
      sheet: sheet([label]),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(told.prose).toBe('They say the Ash Vault is real.');
    const boast = await applyFactGate({
      prose: 'I once fought a great beast.',
      sheet: sheet([label]),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(boast.prose).toBe('I once fought a great beast.');
    const invented = await applyFactGate({
      prose: 'They say the Moon Spire is real.',
      sheet: sheet([label]),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(invented.prose).not.toMatch(/Moon Spire/);
    const before = attachDungeonLegend(createInitialState('Legends', 'dnd') as GameState, {
      dungeonName: 'Old Crypt',
      areaLevel: 2,
      nodes: [{ hidden: { lootables: [{ id: 'c', label: 'iron chest' }] } }],
    });
    expect(before.legends).toHaveLength(1);
  });

  it('retires a quiet place rumour and keeps a dungeon legend in the registry', () => {
    let state = seedWorldAtlas(createInitialState('Legends', 'dnd') as GameState);
    state = attachDungeonLegend(state, {
      dungeonName: 'Old Crypt',
      areaLevel: 3,
      nodes: [{ hidden: { lootables: [{ id: 'c', label: 'iron chest' }] } }],
    });
    const place = state.legends?.find((row) => row.target.kind === 'place');
    const item = state.legends?.find((row) => row.target.kind === 'item');
    expect(place && item).toBeTruthy();
    state = {
      ...state,
      worldDay: (place?.lastToldTurn ?? 0) + 12,
      npcMemories: [{
        npcId: 'mira',
        npcName: 'Mira',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 0,
        knownLegendIds: [place!.id, item!.id],
        location: 'Lowmarket',
      }],
    };
    const retired = retireQuietLegends(state);
    expect(retired.legends?.some((row) => row.id === place!.id)).toBe(false);
    expect(retired.legendArchive?.some((row) => row.id === place!.id)).toBe(true);
    expect(retired.legends?.find((row) => row.id === item!.id)?.quiet).toBe(true);
    const lines = buildFactSheet({
      ...retired,
      currentLocation: 'Lowmarket',
      sceneFacts: { present: ['Mira'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 1 },
    }, buildCompletedEventPacket(retired, 'look'), 'look').rumours ?? [];
    expect(lines.some((line) => line.includes(place!.target.label))).toBe(false);
    expect(lines.some((line) => line.includes('iron chest'))).toBe(false);
  });

  it('stops at the region cap', () => {
    let state = {
      ...createInitialState('Legends', 'dnd'),
      worldAtlas: { outlineId: 't', outlineName: 'T', description: '', currentRegionId: 'r', regions: [], settlements: [] },
    } as GameState;
    for (let i = 0; i < 20; i++) {
      state = attachDungeonLegend(state, {
        dungeonName: `Crypt ${i}`,
        areaLevel: 2,
        nodes: [{ hidden: { lootables: [{ id: `c${i}`, label: `chest ${i}` }] } }],
      });
    }
    expect(state.legends?.length).toBe(REGION_CAP);
    expect(state.legends?.length).toBeLessThanOrEqual(WORLD_CAP);
    expect(knowLegends(state, {
      npcId: 'mira', npcName: 'Mira', disposition: 'neutral', facts: [], lastSeenTurn: 0,
    }).knownLegendIds?.length).toBeLessThanOrEqual(2);
  });
});
