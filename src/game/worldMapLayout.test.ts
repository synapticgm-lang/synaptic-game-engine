import { describe, expect, it } from 'vitest';
import { getWorldOutlineById, WORLD_OUTLINES } from '@/data/worldOutlines';
import { instantiateWorldAtlas, revealWorldRegion } from './worldAtlas';
import { worldMapLayout } from './worldMapLayout';
import type { WorldAtlasState } from './types';

function atlas(): WorldAtlasState {
  const outline = (WORLD_OUTLINES as unknown as Array<{ id: string }>)[0]!;
  return instantiateWorldAtlas(getWorldOutlineById(outline.id)!);
}

describe('WM-a: deterministic world map layout', () => {
  it('the same atlas gives the same layout (reload)', () => {
    const a = worldMapLayout(atlas());
    const b = worldMapLayout(JSON.parse(JSON.stringify(atlas())));
    expect(a).toEqual(b);
    expect(a!.regions.length).toBeGreaterThan(0);
  });
  it('every region sits inside the map and no two share a spot', () => {
    const l = worldMapLayout(atlas())!;
    const spots = new Set(l.regions.map((r) => `${r.x},${r.y}`));
    expect(spots.size).toBe(l.regions.length);
    for (const r of l.regions) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x).toBeLessThanOrEqual(l.width);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeLessThanOrEqual(l.height);
    }
  });
  it('fog: settlements of unrevealed regions are hidden; revealing a region shows them greyed; visiting makes one full', () => {
    const a0 = atlas();
    const l0 = worldMapLayout(a0)!;
    const hiddenRegion = a0.regions.find((r) => !r.revealed && (a0.settlements ?? []).some((s) => s.regionId === r.id));
    if (!hiddenRegion) return;
    expect(l0.settlements.some((s) => s.regionId === hiddenRegion.id)).toBe(false);
    const a1 = revealWorldRegion(a0, hiddenRegion.id)!;
    const l1 = worldMapLayout(a1)!;
    const shown = l1.settlements.filter((s) => s.regionId === hiddenRegion.id);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((s) => s.fog === 'seen')).toBe(true);
    const l2 = worldMapLayout(a1, [{ id: 'p', name: shown[0]!.name, lastVisitedTurn: 3 }])!;
    expect(l2.settlements.find((s) => s.id === shown[0]!.id)?.fog).toBe('visited');
  });
  it('roads to unrevealed regions are dashed (unknown); roads between revealed regions are known', () => {
    const l = worldMapLayout(atlas())!;
    const revealed = new Set(l.regions.filter((r) => r.revealed).map((r) => r.id));
    for (const road of l.roads) expect(road.known).toBe(revealed.has(road.from) && revealed.has(road.to));
  });
  it('the marker sits at the current settlement, and moves along the journey', () => {
    const a = atlas();
    const start = (a.settlements ?? []).filter((s) => s.regionId === a.currentRegionId);
    if (start.length < 2) return;
    const l = worldMapLayout(a, [], start[0]!.name)!;
    const s0 = l.settlements.find((s) => s.id === start[0]!.id)!;
    expect(l.marker).toEqual({ x: s0.x, y: s0.y });
    const s1 = l.settlements.find((s) => s.id === start[1]!.id)!;
    const mid = worldMapLayout(a, [], 'the road', { from: start[0]!.name, to: start[1]!.name, legsTotal: 2, legsDone: 1 } as never)!;
    expect(mid.marker).toEqual({ x: Math.round(s0.x + (s1.x - s0.x) / 2), y: Math.round(s0.y + (s1.y - s0.y) / 2) });
  });
  it('no atlas, no map', () => {
    expect(worldMapLayout(null)).toBeNull();
  });
});
