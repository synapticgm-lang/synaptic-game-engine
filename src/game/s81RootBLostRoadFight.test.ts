/**
 * Root B (seed 81) — a lost road fight closes the meeting. The next receipt has no live meeting and
 * the list has no chip aimed at it. No live GM call.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import { resolveEngineFight } from './engineFight';
import { mulberry32 } from './fatePick';
import { peopleHere } from './chipLegality';
import { commitTravel, journeyPads, roadEncounterLevel, roadMeetingFact } from './travelJourney';
import type { GameState, RoadEncounter } from './types';

function keepState(seed: string): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    quests: [],
    character: { ...s.character, level: 1, hp: 1 },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** On the ground between two places with thugs on this stretch. */
function thugsOnStretch(over: Partial<RoadEncounter> = {}): GameState {
  const trip = commitTravel(keepState('road-fight'), 'Travel toward Blackspine Treeline').state;
  const j = trip.journey!;
  const level = roadEncounterLevel(trip, j.areaTier ?? 1);
  return {
    ...trip,
    turn: 10,
    journey: { ...j, encounter: { kind: 'thugs', level, stretch: j.legsDone, dangerous: false, ...over } },
  };
}

/** The fight engine then travel, in caller order. */
function playTurn(state: GameState, input: string) {
  const next = { ...state, turn: (state.turn ?? 0) + 1 };
  const fight = resolveEngineFight(next, input);
  const travel = commitTravel(fight?.state ?? next, input);
  return { fight, travel, state: travel.state };
}

/** Face the thugs until the engine rolls a defeat (seeded, deterministic). */
function lostFight() {
  for (let seed = 1; seed < 200; seed++) {
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
    const t = playTurn(thugsOnStretch(), 'Face the thugs');
    vi.restoreAllMocks();
    if (t.fight?.receipts.some((r) => /^Fight: DEFEAT/.test(r))) return t;
  }
  throw new Error('no defeat rolled');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('s81 Root B — a lost road fight closes the meeting', () => {
  it('the defeat turn and the next receipt carry no live meeting', () => {
    const lost = lostFight();
    expect(lost.state.journey?.encounter?.lost).toBe(true);
    expect(lost.travel.receipt ?? '').not.toMatch(/chance meeting/);
    expect(lost.travel.receipt ?? '').toMatch(/lost the fight to thugs/);
    expect(roadMeetingFact(lost.state.journey)).toBe('');

    const next = playTurn(lost.state, 'Wait and watch');
    expect(next.travel.receipt ?? '').not.toMatch(/chance meeting/);
  });

  it('the list has no chip aimed at the meeting, and nobody from it is here', () => {
    const lost = lostFight();
    const pads = journeyPads(lost.state);
    expect(pads).not.toContain('Talk your way past the thugs, but fail and they attack');
    expect(pads).not.toContain('Face the thugs');
    expect(pads).toContain('Walk on');
    expect(peopleHere(lost.state)).not.toContain('thugs');
  });

  it('a live meeting before any fight still offers its chips', () => {
    expect(journeyPads(thugsOnStretch())).toEqual(expect.arrayContaining(['Face the thugs', 'Talk your way past the thugs, but fail and they attack']));
  });
});
