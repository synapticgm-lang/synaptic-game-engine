/**
 * fight2d-PERSONTAG — road-meeting / "talk to someone" chips are backed by engine
 * `person:` timeline tags for the current HERE (written at meeting / present-NPC sources).
 * Seed 20511 T3/T4 shape: traveler Cutha Hask on a streets leg, then "Talk to someone in the street".
 */
import { describe, expect, it } from 'vitest';
import { checkChosenChip } from '../game/turnCheck';
import { recordPersonSeen } from '../game/timeline';
import { underwayHereLabel } from '../game/locationName';
import type { GameState, LogEntry, RoadEncounter, TimelineFact, TravelJourney } from '../game/types';

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

function tripHere(j: TravelJourney): string {
  return underwayHereLabel({ journey: j });
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
    timeline: [],
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

function cuthaPersonTag(place: string, turn = 3): TimelineFact {
  return {
    id: 'person-cutha',
    turn,
    kind: 'person',
    name: 'Cutha Hask',
    detail: 'met on the road',
    place,
    text: 'person: Cutha Hask - met on the road',
    at: turn,
  };
}

describe('fight2d-PERSONTAG engine person tags for talk-to-someone chips', () => {
  it('chance meeting source writes exactly one person: Cutha Hask - … entry (deduped in scene)', () => {
    const j = streetsLeg(CUTHA);
    const here = tripHere(j);
    let s = base({ journey: j, currentLocation: here, turn: 3, timeline: [] });
    s = recordPersonSeen(s, 'Cutha Hask', 'met on the road');
    s = recordPersonSeen(s, 'Cutha Hask', 'met on the road');
    const people = (s.timeline ?? []).filter((f) => f.kind === 'person');
    expect(people).toHaveLength(1);
    expect(people[0]!.text).toBe('person: Cutha Hask - met on the road');
    expect(people[0]!.name).toBe('Cutha Hask');
    expect(people[0]!.detail).toBe('met on the road');
  });

  it('seed 20511 T4: person tag for Cutha Hask → Talk to someone in the street is not unrelated-chip', () => {
    const j = streetsLeg(CUTHA);
    const before = base({
      journey: j,
      currentLocation: tripHere(j),
      timeline: [cuthaPersonTag(tripHere(j))],
      log: [
        gm(
          3,
          'Jax moved toward Greyhollow Inn. Cutha Hask came up the lane, hunched low under a heavy peddler\'s pack, and stopped when they saw Jax.'
        ),
      ],
    });
    expect(checkChosenChip(before, 'Talk to someone in the street')).toEqual([]);
  });

  it('same chip with a people meeting but no person tag → unrelated-chip', () => {
    const before = base({
      journey: streetsLeg({ kind: 'traveler', level: 1, stretch: 1, dangerous: false }),
      timeline: [],
      log: [gm(3, 'Jax walked the back streets toward Greyhollow Inn in the cool morning air.')],
    });
    expect(checkChosenChip(before, 'Talk to someone in the street').map((f) => f.kind)).toEqual(['unrelated-chip']);
  });

  it('a person tag from an earlier, left scene does not back the chip', () => {
    const j = streetsLeg({ kind: 'traveler', level: 1, stretch: 1, dangerous: false });
    const before = base({
      journey: j,
      currentLocation: tripHere(j),
      timeline: [cuthaPersonTag('Greyhollow Inn', 1)],
      log: [gm(3, 'Jax walked the back streets toward Greyhollow Inn in the cool morning air.')],
    });
    expect(checkChosenChip(before, 'Talk to someone in the street').map((f) => f.kind)).toEqual(['unrelated-chip']);
  });
});
