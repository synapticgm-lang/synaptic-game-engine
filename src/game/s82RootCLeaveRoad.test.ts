/**
 * Root C (seed 82) — "Leave the scene" from an unmapped card place never commits the road label as
 * a place. A later trip goes on from where the player is.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitTravel, isRoadLabel } from './travelJourney';
import type { GameState } from './types';

const DESK = 'the wagon desk of the Argent Ledger';

/** Seed 82 at T15: back at the card place after the T6 walk turned round; the sheet left behind is the road. */
function atTheDesk(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 82, personality: 'cold-system' });
  const s = stampOpening(state);
  return {
    ...s,
    turn: 15,
    currentLocation: DESK,
    journey: null,
    activeEncounter: undefined,
    activeDungeon: undefined,
    previousLocationSheet: { ...(s.locationSheet ?? {}), name: 'On the road between places' } as GameState['previousLocationSheet'],
    places: [
      ...(s.places ?? []).filter((p) => p.name !== DESK),
      { ...(s.places?.[0] ?? {}), id: 'desk', name: DESK, lastVisitedTurn: 7 } as NonNullable<GameState['places']>[number],
    ],
  };
}

describe('s82 Root C — leaving an unmapped card place', () => {
  it('T16 "Leave the scene" never sets the location to the road label', () => {
    const t = commitTravel(atTheDesk(), 'Leave the scene');
    expect(t.handled).toBe(true);
    // Underway, HERE is the trip's own road words with a journey to a real place; never an arrival at the road.
    if (t.state.journey) expect(isRoadLabel(t.state.journey.to)).toBe(false);
    else expect(isRoadLabel(t.state.currentLocation)).toBe(false);
    expect(t.receipt ?? '').not.toMatch(/to On the road between places/);
  });

  it('a later "Travel toward Lowmarket" goes on from where the player is, not leg 1 from the desk', () => {
    const left = commitTravel(atTheDesk(), 'Leave the scene');
    const next = commitTravel({ ...left.state, turn: 19 }, 'Travel toward Lowmarket');
    expect(next.handled).toBe(true);
    expect(next.receipt ?? '').not.toMatch(new RegExp(`between ${DESK} and Lowmarket \\S+ leg 1 of`));
  });
});
