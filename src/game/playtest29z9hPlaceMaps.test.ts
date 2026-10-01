import { describe, expect, it } from 'vitest';
import { buildInteriorFloorPlan, listInteriorZLevels, resolvePlayAreaMap, type ActiveDungeonState } from './mapEngine';
import { floorPlanIssues } from './floorPlan';
import { createInitialState } from './defaults';
import { previewDungeonCard, openDungeonCard } from './dungeonCard';
import { placeAllowsDungeon } from './dungeonLifecycle';
import { isInteriorPlace } from './placeAuthority';
import type { GameState } from './types';

const BATHHOUSE = 'alone in a ruined bathhouse off the Valespire roads';

function names(m: ActiveDungeonState): string[] {
  return m.nodes.map((n) => n.name);
}

function onFloor(m: ActiveDungeonState, name: string): number | undefined {
  return m.nodes.find((n) => n.name === name)?.zLevel;
}

function sp(): GameState {
  return { ...createInitialState('The Summoned Pact', 'litrpg'), campaignBibleId: 'summoned-pact', seed: 'z9h' };
}

describe('playtest29z9h — the map is built from the place', () => {
  it('the alone bathhouse is a building footprint with no upper floor', () => {
    for (const seed of ['s1', 's2', 's3']) {
      const m = resolvePlayAreaMap(null, BATHHOUSE, [], undefined, seed)!;
      expect(m.blueprintId).toBe('interior-plan');
      expect(Math.max(...listInteriorZLevels(m))).toBe(0);
      expect(floorPlanIssues(m, { building: true })).toEqual([]);
    }
  });

  it('a roofless shell keeps one floor and a dead-end stair reads as broken', () => {
    const m = buildInteriorFloorPlan('a gutted market hall with no roof', [], undefined, 's1');
    expect(listInteriorZLevels(m)).toEqual([0]);
    expect(names(m)).not.toContain('Stairs');
    expect(floorPlanIssues(m, { building: true })).toEqual([]);
  });

  it('an intact building drops ruin rooms', () => {
    for (const seed of ['s1', 's2', 's3']) {
      const m = buildInteriorFloorPlan('a guardhouse', [], undefined, seed);
      expect(names(m).join(' ')).not.toMatch(/\b(?:Ruined|Collapsed)\b/);
    }
  });

  it('a house has a hall, stairs and an upper floor on shared walls', () => {
    const m = buildInteriorFloorPlan('a cottage', [], undefined, 's1');
    expect(onFloor(m, 'Hall')).toBe(0);
    expect(onFloor(m, 'Stairs')).toBe(0);
    expect(onFloor(m, 'Landing')).toBe(1);
    const stairs = m.nodes.find((n) => n.name === 'Stairs')!;
    const landing = m.nodes.find((n) => n.name === 'Landing')!;
    expect(stairs.connections).toContain(landing.id);
    expect(floorPlanIssues(m, { building: true })).toEqual([]);
  });

  it('a tavern cellar stair reaches a cellar; a barn ladder reaches a hayloft', () => {
    const tavern = buildInteriorFloorPlan('the village tavern', [], undefined, 's1');
    expect(onFloor(tavern, 'Cellar')).toBe(-1);
    expect(floorPlanIssues(tavern, { building: true })).toEqual([]);
    const barn = buildInteriorFloorPlan('an old barn', [], undefined, 's1');
    expect(onFloor(barn, 'Hayloft')).toBe(1);
    expect(floorPlanIssues(barn, { building: true })).toEqual([]);
  });

  it('an old one-floor house save is rebuilt with its stairs', () => {
    const old = buildInteriorFloorPlan('a cottage', [], undefined, 's1');
    const flat = { ...old, nodes: old.nodes.filter((n) => (n.zLevel ?? 0) === 0 && n.name !== 'Stairs').map((n) => ({ ...n, connections: n.connections.filter((c) => old.nodes.some((o) => o.id === c && (o.zLevel ?? 0) === 0 && o.name !== 'Stairs')) })) };
    const again = resolvePlayAreaMap(flat, 'a cottage', [], undefined, 's1')!;
    expect(listInteriorZLevels(again)).toEqual([0, 1]);
  });

  it('caves, mines, crypts and sewers draw their dungeon card, not a street or a house', () => {
    const state = sp();
    for (const p of ['a cave', 'the old mine', 'a crypt', 'the sewers']) {
      expect(isInteriorPlace(p)).toBe(true);
      expect(placeAllowsDungeon(state, p)).toBe(true);
      const m = resolvePlayAreaMap(null, p, [], undefined, 's1', { underground: (s) => previewDungeonCard(state, s) })!;
      expect(m.blueprintId).toBe('interior-plan');
      expect(names(m)).not.toContain('Bedroom');
      expect(new Set(names(m)).size).toBe(m.nodes.length);
      expect(m.nodes.every((n) => !n.hidden)).toBe(true);
      expect(floorPlanIssues(m, { building: false })).toEqual([]);
    }
  });

  it('bathhouse, guardhouse and watchtower use their own rooms, intact or ruined', () => {
    const bath = buildInteriorFloorPlan('a bathhouse', [], undefined, 's1');
    expect(names(bath)).toEqual(expect.arrayContaining(['Changing room', 'Warm room', 'Hot room', 'Cold plunge']));
    const ruinedBath = resolvePlayAreaMap(null, BATHHOUSE, [], undefined, 's1')!;
    expect(names(ruinedBath)).toContain('Hot room');
    const guard = buildInteriorFloorPlan('a guardhouse', [], undefined, 's1');
    expect(onFloor(guard, 'Cells')).toBe(0);
    expect(onFloor(guard, 'Barracks')).toBe(1);
    const tower = buildInteriorFloorPlan('the old watchtower', [], undefined, 's1');
    expect(listInteriorZLevels(tower)).toEqual([0, 1, 2]);
    expect(onFloor(tower, 'Lookout')).toBe(2);
    const ruinedTower = buildInteriorFloorPlan('a collapsed watchtower', [], undefined, 's1');
    expect(listInteriorZLevels(ruinedTower)).toEqual([0]);
    expect(names(ruinedTower)).toContain('Broken stair');
    for (const m of [bath, ruinedBath, guard, tower, ruinedTower]) {
      expect(names(m).join(' ')).not.toMatch(/\b(?:Bedroom|Wardrobe|Crypt|Ossuary|Tomb|Reliquary)\b/);
      expect(floorPlanIssues(m, { building: true })).toEqual([]);
    }
  });

  it('crypt rooms only sit under sacred places; a burnt building has no basement unless named', () => {
    for (const seed of ['s1', 's2', 's3', 's4', 's5']) {
      for (const p of ['a ruined mill', 'an abandoned warehouse', 'a manor house']) {
        expect(names(buildInteriorFloorPlan(p, [], undefined, seed)).join(' ')).not.toMatch(/\b(?:Crypt|Ossuary|Tomb|Reliquary|Catacomb)\b/);
      }
      const burnt = buildInteriorFloorPlan('a burnt waystation', [], undefined, seed);
      expect(listInteriorZLevels(burnt)).toEqual([0]);
      expect(floorPlanIssues(burnt, { building: true })).toEqual([]);
      expect(resolvePlayAreaMap(burnt, 'a burnt waystation', [], undefined, seed)).toBe(burnt);
    }
    expect(listInteriorZLevels(buildInteriorFloorPlan('a burnt farmhouse with a cellar', [], undefined, 's1'))).toContain(-1);
    const sacred = ['s1', 's2', 's3', 's4', 's5'].map((s) => names(buildInteriorFloorPlan('a ruined chapel', [], undefined, s)).join(' '));
    expect(sacred.some((n) => /\bCrypt\b/.test(n))).toBe(true);
  });

  it('the preview is the same plan the card opens with', () => {
    const state = sp();
    const preview = previewDungeonCard(state, 'a cave');
    const card = openDungeonCard(state, 'a cave').activeDungeon!;
    expect(preview.nodes.map((n) => [n.id, n.name, n.zLevel])).toEqual(card.nodes.map((n) => [n.id, n.name, n.zLevel]));
  });
});
