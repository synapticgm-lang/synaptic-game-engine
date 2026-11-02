/**
 * XP-D1 OPEN7 addendum — starter-zone stretch creatures (spawn+1 / spawn+2) + win rates.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { WORLD_OUTLINES } from '../data/worldOutlines';
import { ensureWilds, ensureWildsReady } from './wilds';
import { ensureRegionBands, regionBand, resolvePlaceRegionId } from './regionLevels';
import { simulateCombat, type EnemyStats } from './combat';
import { huntFoe } from './wildlifeActions';
import { conWord } from './rules/xpPace';
import type { GameState } from './types';

function starterState(outlineId: string, seed: string): GameState {
  const outline = WORLD_OUTLINES.find((o) => o.id === outlineId)!;
  const start = outline.settlements.find((s) => s.regionId === outline.startingRegionId) ?? outline.settlements[0]!;
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return ensureWildsReady({
    ...s,
    engineMode: 'litrpg',
    seed,
    currentLocation: start.name,
    worldAtlas: {
      outlineId: outline.id,
      outlineName: outline.name,
      description: outline.description ?? outline.name,
      currentRegionId: outline.startingRegionId,
      regions: outline.regions.map((r) => ({
        id: r.id,
        name: r.name,
        blurb: r.blurb,
        connections: r.connections ?? [],
        tags: r.tags ?? [],
        revealed: true,
      })),
      settlements: outline.settlements.map((x) => ({
        id: x.id,
        name: x.name,
        regionId: x.regionId,
        kind: x.kind,
        biome: x.biome,
        blurb: x.blurb,
        revealed: true,
      })),
    },
    places: [
      {
        id: start.id,
        name: start.name,
        regionId: start.regionId,
        biome: start.biome,
      },
    ],
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
    character: { ...s.character, level: 1, hp: 20, maxHp: 20 },
  } as GameState);
}

function winRate(state: GameState, foeLevel: number, elite: boolean, trials: number): number {
  const slot = {
    speciesId: 'test',
    name: elite ? 'Zone Matriarch' : 'Stretch Prey',
    level: foeLevel,
    kind: 'beast' as const,
    behaviour: 'aggressive' as const,
    elite,
    stock: 1,
    maxStock: 1,
    skinnable: true,
    primaryDrop: 'hide' as const,
  };
  const enc = huntFoe(slot, state.currentLocation ?? '');
  const enemy: EnemyStats = {
    name: enc.name,
    level: enc.level,
    hp: enc.hp,
    maxHp: enc.maxHp,
    attack: Math.max(1, enc.level + (elite ? 2 : 0)),
    defense: Math.max(0, Math.floor(enc.level / 2)),
    armorClass: enc.armorClass ?? 10 + enc.level,
    xpReward: 0,
    goldReward: 0,
  };
  let wins = 0;
  for (let i = 0; i < trials; i++) {
    let t = (i * 0x9e3779b9 + foeLevel * 17 + (elite ? 3 : 0)) >>> 0;
    const rng = () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const fresh = {
      ...state,
      character: { ...state.character, hp: state.character.maxHp || 20 },
    };
    const result = simulateCombat(fresh, enemy, { rng });
    if (result.victory) wins += 1;
  }
  return wins / trials;
}

describe('OPEN7 addendum — starter stretch creatures', () => {
  it('every world outline starter region stocks spawn, spawn+1, spawn+2 and nothing above spawn+2', () => {
    for (const outline of WORLD_OUTLINES) {
      const state = starterState(outline.id, `stretch-${outline.id}`);
      const withBands = ensureRegionBands(state);
      const regionId = resolvePlaceRegionId(withBands, withBands.currentLocation);
      const band = regionBand(withBands, regionId);
      expect(band.low).toBe(1);
      expect(band.high).toBe(3);
      const stocked = ensureWilds(withBands);
      const placeId = Object.keys(stocked.wildsByPlace ?? {})[0]!;
      const slots = stocked.wildsByPlace![placeId]!.slots;
      const levels = new Set(slots.map((s) => s.level));
      expect(levels.has(1), `${outline.id} missing spawn`).toBe(true);
      expect(levels.has(2), `${outline.id} missing spawn+1`).toBe(true);
      expect(levels.has(3), `${outline.id} missing spawn+2`).toBe(true);
      expect(Math.max(...levels)).toBeLessThanOrEqual(3);
      expect(slots.some((s) => s.elite)).toBe(true);
      // Con words stay readable for a L1 player.
      expect(conWord(1, 2)).toMatch(/even|stronger|weaker/i);
      expect(conWord(1, 3)).toMatch(/even|stronger/i);
    }
  });

  it('L1 win rate vs spawn+1 is reasonable; spawn+2 is a risk not a wall; elite boss beatable by L4+', () => {
    const state = starterState(WORLD_OUTLINES[0]!.id, 'stretch-winrate');
    const w1 = winRate(state, 2, false, 80);
    const w2 = winRate(state, 3, false, 80);
    const bossL4 = winRate({ ...state, character: { ...state.character, level: 4, hp: 28, maxHp: 28 } }, 3, true, 60);
    const bossL7 = winRate({ ...state, character: { ...state.character, level: 7, hp: 40, maxHp: 40 } }, 3, true, 60);
    // Soft bands — real combat resolver. Spawn+1 is winnable for L1; spawn+2 is harder (risk, not a wall).
    expect(w1).toBeGreaterThan(0.35);
    expect(w2).toBeGreaterThan(0.15);
    expect(w2).toBeLessThanOrEqual(w1);
    expect(bossL4).toBeGreaterThan(0.25);
    expect(bossL7).toBeGreaterThan(bossL4 - 0.05);
  }, 60_000);
});
