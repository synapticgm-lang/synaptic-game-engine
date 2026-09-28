/**
 * 28m — treasure (gold + loot tier) scales with the local area level: dungeon card level >
 * region/zone threat > party level, clamped to party level ±3.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveLocalAreaLevel, tierToAreaLevel } from './placeAuthority';
import { rollLoot, scaleTreasureGold, treasureScale } from './lootTableRegistry';
import type { ActiveDungeonState } from './mapEngine';
import type { GameState } from './types';

function st(level: number, patch: Partial<GameState> = {}): GameState {
  const s = createInitialState('Ria', 'litrpg');
  return {
    ...s,
    gmStrictness: 'standard',
    lootPity: { byTier: {} },
    character: { ...s.character, level },
    ...patch,
  } as GameState;
}

function card(areaLevel: number | undefined, dangerTier: 1 | 2 | 3 | 4 = 2): ActiveDungeonState {
  return {
    blueprintId: 'dungeon-card',
    dungeonName: 'Old Mine',
    tier: 4,
    dangerTier,
    areaLevel,
    currentZLevel: 0,
    currentNodeId: 'r1',
    visitedNodeIds: ['r1'],
    clearedNodeIds: [],
    nodes: [],
  } as unknown as ActiveDungeonState;
}

describe('28m treasure scaling', () => {
  it('maps threat tiers to area levels', () => {
    expect([1, 2, 3, 4].map(tierToAreaLevel)).toEqual([1, 4, 7, 10]);
  });

  it('dungeon card level beats region beats party level', () => {
    const inDungeon = st(5, { activeDungeon: card(7), threatTier: 1 });
    expect(resolveLocalAreaLevel(inDungeon)).toMatchObject({ level: 7, source: 'dungeon' });
    const region = st(5, { threatTier: 3 });
    expect(resolveLocalAreaLevel(region)).toMatchObject({ level: 7, source: 'region' });
    expect(resolveLocalAreaLevel(st(5))).toMatchObject({ level: 5, source: 'party' });
  });

  it('clamps the area level to party level ±3', () => {
    expect(resolveLocalAreaLevel(st(1, { activeDungeon: card(12) })).level).toBe(4);
    expect(resolveLocalAreaLevel(st(10, { threatTier: 1 })).level).toBe(7);
  });

  it('gold and tier grow with the area level, within bounds', () => {
    const low = treasureScale(st(1));
    const high = treasureScale(st(8, { threatTier: 4 }));
    expect(low).toMatchObject({ areaLevel: 1, tier: 1, goldMult: 1 });
    expect(high.areaLevel).toBe(10);
    expect(high.tier).toBe(4);
    expect(high.goldMult).toBeCloseTo(2.35);
    expect(treasureScale(st(30)).goldMult).toBe(3);
    expect(scaleTreasureGold(st(1), 10)).toBe(10);
    expect(scaleTreasureGold(st(8, { threatTier: 4 }), 20)).toBe(47);
    expect(scaleTreasureGold(st(8), 0)).toBe(0);
  });

  it('rollLoot uses the area tier unless a tier is passed', () => {
    const deep = st(6, { activeDungeon: card(9, 4) });
    expect(rollLoot({ profile: 'chestGold', state: deep, seed: 's1' }).pityTier).toBe(3);
    expect(rollLoot({ profile: 'chestGold', state: deep, seed: 's1', tier: 1 }).pityTier).toBe(1);
  });
});
