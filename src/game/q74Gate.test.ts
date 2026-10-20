/**
 * q74-GATE — road/door blocker: engine passage routes (name / toll / go-around / fight / talk);
 * option labels never carry outcome text. Replay from LitRPG mega L6 T36–T39 (Osric name-debt).
 * No paid model calls.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveEngineFight } from './engineFight';
import {
  commitTravel,
  GO_AROUND_PAD,
  journeyPads,
  meetingMoveBase,
  NAME_PASSAGE_PAD,
  passageDemand,
  resolveRoadPassage,
  TOLL_PASSAGE_PAD,
} from './travelJourney';
import type { GameState, RoadEncounter } from './types';

/** L6 stretch: Cinderflow Road → Contract Hall, villain name-debt (Osric ledger). */
function l6Blocker(over: Partial<RoadEncounter> = {}, pcName = 'Jax'): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'q74-l6-gate',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    turn: 39,
    currentLocation: 'On the road between places',
    gold: 12,
    character: { ...s.character, name: pcName, level: 1 },
    activeEncounter: null,
    journey: {
      from: 'Cinderflow Road',
      to: 'Contract Hall',
      ground: 'Road',
      terrain: 'road',
      legsTotal: 3,
      legsDone: 1,
      hoursPerLeg: 1,
      startedTurn: 32,
      encounter: {
        kind: 'villain',
        level: 2,
        stretch: 1,
        dangerous: true,
        want: 'your name for a debt',
        name: 'Osric Brack',
        ...over,
      },
    },
  };
}

describe('q74-GATE blocker passage', () => {
  it('blocker present → at least one route-through option; labels carry no outcome text', () => {
    const s = l6Blocker();
    expect(passageDemand(s.journey!.encounter)).toBe('name');
    const pads = journeyPads(s);
    expect(pads).toContain('Face whoever blocks the way');
    expect(pads).toContain('Talk to whoever blocks the way');
    expect(pads).toContain(NAME_PASSAGE_PAD);
    expect(pads).toContain(GO_AROUND_PAD);
    expect(pads).not.toContain('Walk on');
    expect(pads.every((p) => !/,\s*but fail and/i.test(p))).toBe(true);
    expect(pads.every((p) => meetingMoveBase(p) === p || !/,\s*but fail/.test(p))).toBe(true);
  });

  it('resolving give-name clears the block when the sheet has a lockable name', () => {
    const s = l6Blocker();
    const r = resolveRoadPassage(s, NAME_PASSAGE_PAD);
    expect(r).toBeTruthy();
    expect(r!.outcome).toBe('slipped away');
    expect(r!.state.journey?.encounter?.engaged).toBe(true);
    expect(journeyPads(r!.state).some((p) => /Face whoever|Talk to whoever|Give the name/i.test(p))).toBe(false);
    expect(journeyPads(r!.state)).toContain('Walk on');
  });

  it('give-name without a lockable name fails into an engine fight', () => {
    const s = l6Blocker({}, 'here');
    const r = resolveRoadPassage(s, NAME_PASSAGE_PAD);
    expect(r?.outcome).toBe('fight opened');
    expect(r!.state.activeEncounter?.name).toBeTruthy();
  });

  it('pay-toll clears or fails by engine gold; talk/go-around stay check chips', () => {
    const toll = l6Blocker({ want: 'a toll for the road', kind: 'thugs', name: undefined });
    expect(passageDemand(toll.journey!.encounter)).toBe('toll');
    const pads = journeyPads(toll);
    expect(pads).toContain(TOLL_PASSAGE_PAD);
    expect(pads.every((p) => !/but fail/i.test(p))).toBe(true);
    const paid = resolveRoadPassage(toll, TOLL_PASSAGE_PAD);
    expect(paid?.outcome).toBe('slipped away');
    expect(paid!.state.gold).toBe(10);

    const broke = { ...toll, gold: 0 };
    const fail = resolveRoadPassage(broke, TOLL_PASSAGE_PAD);
    expect(fail?.outcome).toBe('fight opened');

    const go = resolveEngineFight(l6Blocker(), GO_AROUND_PAD);
    expect(go).toBeTruthy();
  });

  it('L6 T39 typed door question gets a way forward when the name is on the sheet', () => {
    const s = l6Blocker();
    const typed = 'I turn to the person ahead of me. "Is the door going to open soon?"';
    const r = commitTravel(s, typed);
    expect(r.handled).toBe(true);
    expect(r.outcome).toBe('slipped away');
    expect(r.state.journey?.encounter?.engaged).toBe(true);
    expect(r.receipt ?? '').toMatch(/gave the name Jax|way on is clear/i);
  });
});
