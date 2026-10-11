/**
 * Root B (seed 83) — "Check the exits" commits this place's mapped ways out before the writer:
 * the same targets the travel chips use, and no other place.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { advanceDungeonCard } from './dungeonCard';
import { engineResultFact } from './engineResult';
import { hubsForBibleId, outdoorHubTravelChoices } from './outdoorHubs';
import { placeIdFromName } from './places';
import type { GameState } from './types';

function atTheClose(turn: number): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 83, personality: 'cold-system' });
  const s = stampOpening(state);
  return {
    ...s,
    turn,
    currentLocation: 'Cathedral Close',
    journey: undefined,
    activeEncounter: undefined,
    activeDungeon: undefined,
    discoveredLocations: ['Cathedral Close', 'Contract Hall', 'Cathedral Undercroft'].map(placeIdFromName),
  };
}

describe('s83 Root B — "Check the exits" commits the mapped ways out', () => {
  it('T14 at Cathedral Close names Contract Hall and the Undercroft, and no other place', () => {
    const before = atTheClose(14);
    const t = advanceDungeonCard(before, 'Check the exits');
    const fact = engineResultFact(t.receipts);
    expect(fact).toMatch(/^Exits: the ways out of Cathedral Close lead to /);
    expect(fact).toContain('Contract Hall');
    expect(fact).toContain('Cathedral Undercroft');
    const others = hubsForBibleId('summoned-pact')
      .map((h) => h.name)
      .filter((n) => !['Contract Hall', 'Cathedral Undercroft', 'Cathedral Close'].includes(n));
    for (const n of others) expect(fact).not.toContain(n);
  });

  it('the exits match the travel chips targets', () => {
    const before = atTheClose(14);
    const fact = engineResultFact(advanceDungeonCard(before, 'Check the exits').receipts);
    for (const chip of outdoorHubTravelChoices(before, 9)) {
      expect(fact).toContain(chip.replace(/^Travel toward /, ''));
    }
  });
});
