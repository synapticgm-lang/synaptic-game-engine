/**
 * s70 Bug A — the road label is journey state, never a place.
 * No live GM call. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, journeyPads, UNDERWAY_HERE } from './travelJourney';
import { touchPlaceVisit, upsertPlaceFromSheet } from './places';
import type { GameState, LocationSheet } from './types';

const RUIN = 'alone on the stone outline of a building that is gone';

function ruinState(): GameState {
  const s = createInitialState(undefined, 'litrpg', undefined, 's70-road') as GameState;
  return {
    ...s,
    campaignBibleId: 'summoned-pact',
    currentLocation: RUIN,
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    places: [{ id: 'ruin', name: RUIN, mapScale: 'street', arcStatus: 'open', lastVisitedTurn: 3 }],
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

function namesIn(state: GameState): string[] {
  return [state.currentLocation, state.journey?.from, state.journey?.to].filter((n): n is string => !!n);
}

describe('s70 — the road is not a place', () => {
  it('a new destination named mid-trip starts from the ruin; turn back lands on the ruin', () => {
    const seen: string[] = [];
    const first = commitTravel(ruinState(), 'Travel toward Cathedral Close');
    expect(first.arrived).toBe(false);
    expect(first.state.journey?.ground).toBe('Back streets');
    expect(first.state.currentLocation).toBe(UNDERWAY_HERE);
    seen.push(...namesIn(first.state));

    const second = commitTravel(first.state, 'Travel toward Contract Hall');
    expect(second.arrived).toBe(false);
    expect(second.state.journey?.from).toBe(RUIN);
    expect(second.state.journey?.to).toBe('Contract Hall');
    seen.push(...namesIn(second.state));

    const pads = journeyPads(second.state);
    expect(pads).not.toContain('Turn back toward Back streets');
    expect(pads).toContain(`Turn back toward ${RUIN}`);

    const back = commitTravel(second.state, 'Turn back');
    expect(back.arrived).toBe(true);
    expect(back.state.currentLocation).toBe(RUIN);
    seen.push(...namesIn(back.state));

    expect(seen.some((n) => n.toLowerCase() === 'back streets')).toBe(false);
  });

  it('Travel toward Cathedral Close then Walk on arrives at Cathedral Close', () => {
    const first = commitTravel(ruinState(), 'Travel toward Cathedral Close');
    const second = commitTravel(first.state, 'Walk on');
    expect(second.arrived).toBe(true);
    expect(second.state.currentLocation).toBe('Cathedral Close');
    expect(second.state.journey).toBeNull();
  });

  it('an old save parked on the road label starts its next trip from the last real place', () => {
    const s: GameState = {
      ...ruinState(),
      currentLocation: 'Back streets',
      places: [
        { id: 'ruin', name: RUIN, mapScale: 'street', arcStatus: 'open', lastVisitedTurn: 3 },
        { id: 'back-streets', name: 'Back streets', mapScale: 'street', arcStatus: 'open', lastVisitedTurn: 9 },
      ],
    };
    const t = commitTravel(s, 'Travel toward Cathedral Close');
    expect(t.state.journey?.from).toBe(RUIN);
    expect(journeyPads(t.state)).toContain(`Turn back toward ${RUIN}`);
  });

  it('a trip adds no place card for the road; arrival at Cathedral Close still adds its card', () => {
    const record = (s: GameState, turn: number) =>
      upsertPlaceFromSheet(
        touchPlaceVisit(s.places ?? [], s.currentLocation, turn, s),
        { name: s.currentLocation } as LocationSheet,
        { state: s }
      );
    const roadNames = (places: GameState['places']) =>
      (places ?? []).map((p) => p.name.toLowerCase()).filter((n) => n === UNDERWAY_HERE.toLowerCase() || n === 'back streets');

    const first = commitTravel(ruinState(), 'Travel toward Cathedral Close');
    const underway = record(first.state, 4);
    expect(roadNames(underway)).toEqual([]);
    expect(upsertPlaceFromSheet(underway, { name: 'Back streets' } as LocationSheet)).toEqual(underway);

    const second = commitTravel({ ...first.state, places: underway }, 'Walk on');
    expect(second.state.currentLocation).toBe('Cathedral Close');
    const arrived = record(second.state, 5);
    expect(roadNames(arrived)).toEqual([]);
    expect(arrived.some((p) => p.name === 'Cathedral Close' && p.lastVisitedTurn === 5)).toBe(true);
  });
});
