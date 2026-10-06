/**
 * s70 Bug A — the road label is journey state, never a place.
 * No live GM call. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, isRoadLabel, journeyPads, UNDERWAY_HERE } from './travelJourney';
import { touchPlaceVisit, upsertPlaceFromSheet } from './places';
import { buildCompletedEventPacket, formatWriterFacingEvent, movementFact } from './completedEventPacket';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { formatInfoSheet } from './infoSheet';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { buildPlaceCard, ensurePlaceCard } from './outdoorHubs';
import { recordCirclingTurn } from './choiceRanking';
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

describe('s71 A+B — the writer and the card builder never treat the road as a place', () => {
  /** The road labels as names (the trip in plain lower-case words is the intended fact). */
  const ROAD = /[Oo]n the road between places|Open road|Back streets|Forest path|Marsh track|Mountain pass|Coast road/;

  function cinderflow(): GameState {
    const s = { ...ruinState(), currentLocation: 'Cinderflow Road', places: [], turn: 4 } as GameState;
    return recordCirclingTurn(s, 'Look around', []);
  }

  /** One game turn: travel, present trim on a HERE change, then the circling record (as fate-autoplay does). */
  function travelTurn(state: GameState, input: string) {
    const next = { ...state, turn: (state.turn ?? 0) + 1 };
    const t = commitTravel(next, input);
    const moved = t.state.currentLocation !== next.currentLocation
      ? applyPresentTrimOnTravel(t.state, next.currentLocation ?? '', t.state.currentLocation ?? '')
      : t.state;
    return { ...t, state: recordCirclingTurn(moved, input, t.receipt ? [t.receipt] : [], next) };
  }

  it('the writer packet, info layer and info sheet name both ends and no road label', () => {
    const t = travelTurn(cinderflow(), 'Travel toward West Wall');
    expect(t.arrived).toBe(false);
    expect(t.state.currentLocation).toBe(UNDERWAY_HERE);
    const packet = buildCompletedEventPacket(t.state, 'Travel toward West Wall');
    const texts = [formatWriterFacingEvent(packet), formatWriterInfoLayer(t.state), formatInfoSheet(t.state)];
    for (const text of texts) {
      expect(text).not.toMatch(ROAD);
      expect(text).toContain('Cinderflow Road');
      expect(text).toContain('West Wall');
    }
    const refs = packet.refEnum ?? [];
    expect(refs.some((r) => r.id === 'here')).toBe(false);
    expect(refs.some((r) => r.klass === 'place' && isRoadLabel(r.display))).toBe(false);
    const places = refs.filter((r) => r.klass === 'place').map((r) => r.display);
    expect(places).toEqual(['Cinderflow Road', 'West Wall']);
    expect(packet.allowlist.some((n) => isRoadLabel(n) || ROAD.test(n))).toBe(false);
  });

  it('no place card is built for a road label, by any path', () => {
    const t = travelTurn(cinderflow(), 'Travel toward West Wall');
    expect((t.state.places ?? []).some((p) => isRoadLabel(p.name))).toBe(false);
    expect(buildPlaceCard(t.state, UNDERWAY_HERE, 'Cinderflow Road')).toBeNull();
    expect(buildPlaceCard(t.state, 'Open road')).toBeNull();
    expect(ensurePlaceCard(t.state, UNDERWAY_HERE, 'Cinderflow Road')).toBe(t.state);
  });

  it('the movement line says moved on trip start and on a mid-trip reroute', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    expect(movementFact(start.state)).toMatch(/^Moved this turn: on from Cinderflow Road toward West Wall/);

    const reroute = travelTurn(start.state, 'Return to Cathedral Close');
    expect(reroute.state.journey?.to).toBe('Cathedral Close');
    expect(movementFact(reroute.state)).toMatch(/^Moved this turn: on from Cinderflow Road toward Cathedral Close/);

    const wait = travelTurn(reroute.state, 'Wait');
    expect(movementFact(wait.state)).toMatch(/^No move this turn/);
  });

  it('Walk on still arrives at West Wall with its card', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    const quiet = { ...start.state, journey: { ...start.state.journey!, encounter: null } };
    const on = travelTurn(quiet, 'Walk on');
    expect(on.arrived).toBe(true);
    expect(on.state.currentLocation).toBe('West Wall');
    expect((on.state.places ?? []).some((p) => p.name === 'West Wall' && p.cardBuiltTurn != null)).toBe(true);
    expect((on.state.places ?? []).some((p) => isRoadLabel(p.name))).toBe(false);
  });
});

describe('s71 arrival — the arrival move line and Things here during a trip', () => {
  const ROAD = /[Oo]n the road between places|Open road|Back streets|Forest path|Marsh track|Mountain pass|Coast road/;

  function cinderflow(): GameState {
    const s = { ...ruinState(), currentLocation: 'Cinderflow Road', places: [], turn: 4 } as GameState;
    return recordCirclingTurn(s, 'Look around', []);
  }

  function travelTurn(state: GameState, input: string) {
    const next = { ...state, turn: (state.turn ?? 0) + 1 };
    const t = commitTravel(next, input);
    const moved = t.state.currentLocation !== next.currentLocation
      ? applyPresentTrimOnTravel(t.state, next.currentLocation ?? '', t.state.currentLocation ?? '')
      : t.state;
    return { ...t, state: recordCirclingTurn(moved, input, t.receipt ? [t.receipt] : [], next) };
  }

  it('the arrival move line names Cinderflow Road and West Wall, and no writer fact names a road label', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    const quiet = { ...start.state, journey: { ...start.state.journey!, encounter: null } };
    const on = travelTurn(quiet, 'Walk on');
    expect(on.arrived).toBe(true);
    const line = movementFact(on.state);
    expect(line).toMatch(/^Moved this turn: from Cinderflow Road to West Wall/);
    expect(line).not.toMatch(ROAD);
    const packet = buildCompletedEventPacket(on.state, 'Walk on');
    expect(formatWriterFacingEvent(packet)).not.toMatch(ROAD);
    expect(formatWriterInfoLayer(on.state)).not.toMatch(ROAD);
  });

  it('mid-trip, Things here does not list a leftover Cinderflow Road sheet', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    const sheet = {
      name: 'Cinderflow Road',
      interactables: [{ id: 'cart', name: 'Overturned ore cart', state: 'intact' }],
      exits: [],
      presentNpcIds: [],
    } as unknown as LocationSheet;
    const layer = formatWriterInfoLayer({ ...start.state, locationSheet: sheet });
    expect(layer).not.toContain('Overturned ore cart');
    expect(layer).not.toMatch(/Things here:/);
  });
});
