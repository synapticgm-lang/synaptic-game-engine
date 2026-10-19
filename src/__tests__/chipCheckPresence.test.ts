/**
 * fight2c-CHIPCHECK — road-meeting / "talk to someone" chips are backed by engine presence
 * (journey.encounter.name, scene present, named NPCs), never a prose person-word list.
 * Seed 20511 T3/T4 shape: traveler Cutha Hask on a streets leg, then "Talk to someone in the street".
 */
import { describe, expect, it } from 'vitest';
import { checkChosenChip } from '../game/turnCheck';
import type { GameState, LogEntry, RoadEncounter, TravelJourney } from '../game/types';

function gm(turn: number, content: string): LogEntry {
  return { id: `gm-${turn}`, turn, role: 'gm', content, timestamp: turn };
}

function streetsLeg(encounter: RoadEncounter | null): TravelJourney {
  return {
    from: 'the washed-out road into Greyhollow',
    to: 'Greyhollow Inn',
    ground: 'back streets',
    terrain: 'streets',
    legsTotal: 4,
    legsDone: 1,
    hoursPerLeg: 1,
    startedTurn: 2,
    encounter,
  };
}

function base(over: Partial<GameState> = {}): GameState {
  return {
    version: 2,
    seed: '20511',
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'the back streets from the washed-out road into Greyhollow toward Greyhollow Inn',
    turn: 4,
    character: { name: 'Jax' },
    log: [],
    rolls: [],
    inventory: [],
    npcMemories: [],
    companions: [],
    sceneFacts: { crowd: 'unknown', noise: 'unknown', present: [], props: [], lastBeat: '', updatedTurn: 0 },
    journey: null,
    ...over,
  } as GameState;
}

const CUTHA: RoadEncounter = {
  kind: 'traveler',
  level: 1,
  stretch: 1,
  dangerous: false,
  name: 'Cutha Hask',
  about: 'bent under a peddler\'s pack',
  want: 'company for the next stretch',
};

describe('fight2c-CHIPCHECK engine presence for talk-to-someone chips', () => {
  it('seed 20511 T4: named traveler on the leg → Talk to someone in the street is not unrelated-chip', () => {
    const before = base({
      journey: streetsLeg(CUTHA),
      log: [
        gm(
          3,
          'Jax moved toward Greyhollow Inn. Cutha Hask came up the lane, hunched low under a heavy peddler\'s pack, and stopped when they saw Jax.'
        ),
      ],
    });
    expect(checkChosenChip(before, 'Talk to someone in the street')).toEqual([]);
  });

  it('same chip with a people meeting but no person recorded in state → unrelated-chip', () => {
    const before = base({
      journey: streetsLeg({ kind: 'traveler', level: 1, stretch: 1, dangerous: false }),
      log: [gm(3, 'Jax walked the back streets toward Greyhollow Inn in the cool morning air.')],
    });
    expect(checkChosenChip(before, 'Talk to someone in the street').map((f) => f.kind)).toEqual(['unrelated-chip']);
  });

  it('sceneFacts.present alone backs the chip when the meeting name is unset', () => {
    const before = base({
      journey: streetsLeg({ kind: 'traveler', level: 1, stretch: 1, dangerous: false }),
      sceneFacts: {
        crowd: 'sparse',
        noise: 'unknown',
        present: ['Cutha Hask'],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
      log: [gm(3, 'Someone waited on the packed dirt.')],
    });
    expect(checkChosenChip(before, 'Talk to someone in the street')).toEqual([]);
  });
});
