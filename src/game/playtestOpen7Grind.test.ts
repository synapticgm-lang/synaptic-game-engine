/**
 * XP-D1 OPEN7 addendum — pure grinder path to L6–7 in the starter zone.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { ensureWilds, ensureWildsReady, wildsHasNonGrayStock, takeWildsKill } from './wilds';
import { ensureRegionBands } from './regionLevels';
import { applyCharacterXpGain } from './characterXp';
import { unitMilestoneAmount, grayLevel, levelBar } from './rules/xpPace';
import { rankChoices, HUNT_WILDS_CHIP, isHuntChip } from './choiceRanking';
import type { GameState } from './types';
import { WORLD_OUTLINES } from '../data/worldOutlines';

function grinderStart(): GameState {
  const outline = WORLD_OUTLINES[0]!;
  const start = outline.settlements.find((s) => s.regionId === outline.startingRegionId) ?? outline.settlements[0]!;
  const s = createInitialState(undefined, 'litrpg') as GameState;
  // Rite already done — L2 with empty bar remainder for a fair grind clock.
  const bar = levelBar('litrpg', 2);
  return ensureWildsReady({
    ...s,
    engineMode: 'litrpg',
    seed: 'open7-grind',
    turn: 3,
    currentLocation: start.name,
    worldAtlas: {
      outlineId: outline.id,
      outlineName: outline.name,
      description: outline.description ?? '',
      currentRegionId: outline.startingRegionId,
      regions: outline.regions.map((r) => ({
        id: r.id,
        name: r.name,
        blurb: r.blurb,
        connections: r.connections ?? [],
        tags: r.tags ?? [],
        revealed: true,
      })),
    },
    places: [{ id: start.id, name: start.name, regionId: start.regionId, biome: start.biome }],
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
    character: { ...s.character, level: 2, xp: 0, xpToNext: bar, hp: 24, maxHp: 24 },
  } as GameState);
}

describe('OPEN7 addendum — grinder path L6–7', () => {
  it('grinding starter stock reaches L6–7; XP never 0 before gray; Hunt stops when stock is gray', () => {
    let state = ensureRegionBands(grinderStart());
    state = ensureWilds(state);
    let kills = 0;
    let turns = 0;
    const maxKills = 400;
    let grayAtLevel: number | null = null;

    while ((state.character.level ?? 1) < 7 && kills < maxKills) {
      turns += 1;
      state = { ...state, turn: (state.turn ?? 0) + 1 };
      state = ensureWilds(state); // refill over time
      // Advance clock a bit so stock refills between wipes.
      state = {
        ...state,
        worldHour: (state.worldHour ?? 0) + 6,
        worldDay: state.worldDay ?? 0,
      };
      state = ensureWilds(state);

      const placeId = Object.keys(state.wildsByPlace ?? {})[0]!;
      const slots = [...(state.wildsByPlace![placeId]?.slots ?? [])].filter((s) => s.stock > 0);
      if (!slots.length) continue;

      // Prefer highest non-gray; else any (will pay 0 and prove gray).
      const P = state.character.level ?? 1;
      const prey =
        [...slots].sort((a, b) => b.level - a.level).find((s) => s.level > grayLevel(P))
        ?? slots[0]!;
      const xp = unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: P,
        foeLevel: prey.level,
        levelSource: 'table',
        elite: prey.elite,
      });
      if (prey.level <= grayLevel(P)) {
        expect(xp).toBe(0);
        if (grayAtLevel == null) grayAtLevel = P;
        break;
      }
      expect(xp).toBeGreaterThan(0);
      const paid = applyCharacterXpGain(state.character, xp, 'litrpg');
      state = { ...state, character: paid.character };
      state = takeWildsKill(state, prey.speciesId);
      kills += 1;
    }

    expect(state.character.level).toBeGreaterThanOrEqual(6);
    expect(kills).toBeGreaterThan(10);
    expect(kills).toBeLessThan(maxKills);

    // When starter stock is gray, Hunt is not pushed.
    const high = {
      ...state,
      character: { ...state.character, level: 8, hp: 40, maxHp: 40 },
    };
    expect(wildsHasNonGrayStock(high)).toBe(false);
    const ranked = rankChoices(ensureWildsReady(high), [
      'Look around',
      'Ask what they want',
      'Travel toward Harbor',
      HUNT_WILDS_CHIP,
    ]);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(false);
    expect(
      ranked.choices.some((c) => /^travel\b/i.test(c) || ranked.notes.some((n) => /gray/i.test(n)))
    ).toBe(true);
  }, 60_000);
});
