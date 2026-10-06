/**
 * s71 C — the writer's Outcome comes from the travel engine, never from the player's words.
 * No live GM call. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, travelOutcome } from './travelJourney';
import { buildCompletedEventPacket } from './completedEventPacket';
import type { GameState } from './types';

function cinderflow(): GameState {
  const s = createInitialState(undefined, 'litrpg', undefined, 's70-road') as GameState;
  return {
    ...s,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Cinderflow Road',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    places: [],
    turn: 4,
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** One travel turn, then the packet built with the engine's result (as both callers do). */
function travelTurn(state: GameState, input: string) {
  const next = { ...state, turn: (state.turn ?? 0) + 1 };
  const t = commitTravel(next, input);
  const packet = buildCompletedEventPacket(t.state, input, {
    engineResult: t.receipt,
    travel: travelOutcome(t, next.currentLocation ?? '', t.state),
  });
  return { ...t, packet };
}

describe('s71 C — Outcome comes from the travel engine', () => {
  it('a leg that does not arrive is not "arrived" and the receipt counts the arrival step', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    expect(start.arrived).toBe(false);
    expect(start.packet.outcome).not.toBe('arrived');
    expect(start.packet.outcome).toBe('set out');
    expect(start.receipt).toMatch(/leg 1 of 2/);
  });

  it('Walk on arrives and the packet says arrived', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    const quiet = { ...start.state, journey: { ...start.state.journey!, encounter: null } };
    const on = travelTurn(quiet, 'Walk on');
    expect(on.arrived).toBe(true);
    expect(on.packet.outcome).toBe('arrived');
  });

  it('Turn back mid-trip arrives and the packet says arrived', () => {
    const start = travelTurn(cinderflow(), 'Travel toward West Wall');
    const back = travelTurn(start.state, 'Turn back toward Cinderflow Road');
    expect(back.arrived).toBe(true);
    expect(back.state.currentLocation).toBe('Cinderflow Road');
    expect(back.packet.outcome).toBe('arrived');
  });
});
