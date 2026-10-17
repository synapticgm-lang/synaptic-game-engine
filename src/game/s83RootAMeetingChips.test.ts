/**
 * Root A (seed 83) — a road meeting's own talk / slip chip resolves through the existing checks.
 * Talk runs the parley check, slip / skirt / hide runs the flee check. Success closes the meeting,
 * failure forces the fight. No live GM call.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import { resolveEngineFight } from './engineFight';
import { mulberry32 } from './fatePick';
import { commitTravel, journeyPads, roadEncounterLevel } from './travelJourney';
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
    character: { ...s.character, level: 1 },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** The s83 T19 shape: on the ground between two places with a meeting on this stretch. */
function meetingOnStretch(over: Partial<RoadEncounter> = {}): GameState {
  const trip = commitTravel(keepState('road-meeting'), 'Travel toward Blackspine Treeline').state;
  const j = trip.journey!;
  const level = roadEncounterLevel(trip, j.areaTier ?? 1);
  return {
    ...trip,
    turn: 19,
    journey: { ...j, encounter: { kind: 'thugs', level, stretch: j.legsDone, dangerous: false, ...over } },
  };
}

function playTurn(state: GameState, input: string) {
  const next = { ...state, turn: (state.turn ?? 0) + 1 };
  const fight = resolveEngineFight(next, input);
  const travel = commitTravel(fight?.state ?? next, input);
  return { fight, travel, state: travel.state };
}

function rollUntil(state: GameState, input: string, want: RegExp) {
  for (let seed = 1; seed < 300; seed++) {
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
    const t = playTurn(state, input);
    vi.restoreAllMocks();
    if (t.fight?.receipts.some((r) => want.test(r))) return t;
  }
  throw new Error(`no roll matched ${want}`);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('s83 Root A — a meeting chip resolves through the existing checks', () => {
  it('"Talk your way past the thugs" commits a parley receipt', () => {
    const t = playTurn(meetingOnStretch(), 'Talk your way past the thugs');
    expect(t.fight).not.toBeNull();
    // VR1-b: Parley is formatResultLine / Check outcome (not "Parley check: d20…").
    expect(t.fight!.receipts.some((r) => /^d20 .+ vs DC \d+ — (?:success|failure)$/.test(r) || r === 'Check success.' || r === 'Check failure.')).toBe(true);
  });

  it('a parley success ends the meeting: Walk on, no meeting chips', () => {
    const t = rollUntil(meetingOnStretch(), 'Talk your way past the thugs', /^Check success\.$/);
    expect(t.state.journey?.encounter?.engaged).toBe(true);
    const pads = journeyPads(t.state);
    expect(pads).toContain('Walk on');
    expect(pads).not.toContain('Talk your way past the thugs');
    expect(pads).not.toContain('Face the thugs');
  });

  it('a parley failure starts the fight', () => {
    const t = rollUntil(meetingOnStretch(), 'Talk your way past the thugs', /^Check failure\.$/);
    expect(t.fight!.receipts).toContain('Fight: the thugs forces the fight');
    expect(t.fight!.receipts.some((r) => /^Fight: (VICTORY|DEFEAT) vs the thugs/.test(r))).toBe(true);
  });

  it('a slip chip runs the flee check and a clean break escapes the meeting', () => {
    const dead = meetingOnStretch({ kind: 'undead' });
    const t = rollUntil(dead, 'Slip past the dead', /^Check success\.$/);
    expect(t.state.journey?.encounter?.escaped).toBe(true);
    expect(journeyPads(t.state)).not.toContain('Slip past the dead');
  });
});
