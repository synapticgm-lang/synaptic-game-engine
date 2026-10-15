/**
 * tt-build-camps (John, 15 Oct, build 2b) — a road camp is a placed place: built once by the dungeon card generator
 * (headcount, people, leader, loot), kept on the save at its route leg, met again on every pass, and remembering what
 * the player did there (cleared, parleyed, fled).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, roadMeetingFact, settleRoadMeeting } from './travelJourney';
import type { GameState } from './types';

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
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

function campTrip(): GameState {
  for (let i = 0; i < 2000; i++) {
    const s = commitTravel(keepState(`camp-${i}`), 'Travel toward Keep Gate').state;
    if (s.journey?.encounter?.kind === 'camp') return s;
  }
  throw new Error('no camp meeting in 2000 seeds');
}

/** Back at the inn later, setting out on the same road again (a new trip: new dice for the watch). */
function setOutAgain(s: GameState, turns = 7): GameState {
  const home = { ...s, journey: null, currentLocation: 'Greyhollow Inn', turn: (s.turn ?? 0) + turns, activeEncounter: null };
  return commitTravel(home, 'Travel toward Keep Gate').state;
}

const camps = (s: GameState) => (s.places ?? []).filter((p) => p.roadCamp);

describe('tt-build-camps: road camps are placed places', () => {
  const first = campTrip();
  const enc = first.journey!.encounter!;
  const place = camps(first)[0]!;

  it('the first camp is placed once with a headcount, its people, a leader and loot from the dungeon card', () => {
    expect(camps(first)).toHaveLength(1);
    const c = place.roadCamp!;
    expect(enc.camp?.placeId).toBe(place.id);
    expect(c.leader).toBe(enc.name);
    expect(place.name).toBe(`${c.leader}'s camp`);
    expect(c.people[0]).toBe(c.leader);
    expect(c.people.length).toBeGreaterThanOrEqual(2);
    expect(enc.camp?.headcount).toBe(c.people.length);
    expect(new Set(c.people).size).toBe(c.people.length);
    const card = place.dungeonCard!;
    expect(card.blueprintId).toBe('dungeon-card');
    expect(new Set(card.nodes.map((n) => n.zLevel)).size).toBe(1);
    expect(card.nodes.find((n) => n.id === card.currentNodeId)?.name).toBe('Camp Edge');
    const mobs = card.nodes.flatMap((n) => n.hidden?.mobs ?? []);
    expect(mobs.map((m) => m.name).sort()).toEqual([...c.people].sort());
    expect(mobs.find((m) => m.role === 'miniBoss')?.name).toBe(c.leader);
    expect(card.nodes.flatMap((n) => n.hidden?.lootables ?? []).length).toBeGreaterThan(0);
    expect(roadMeetingFact(first.journey)).toContain(`a camp of `);
    expect(roadMeetingFact(first.journey)).toContain(`kept by ${c.leader}`);
  });

  it('the camp stays on its stretch: a later trip on the same road meets the same camp, not a new one', () => {
    for (const turns of [3, 11, 29]) {
      const again = setOutAgain(first, turns);
      expect(camps(again)).toHaveLength(1);
      expect(again.journey?.encounter?.camp?.placeId).toBe(place.id);
      expect(again.journey?.encounter?.name).toBe(place.roadCamp!.leader);
      expect(again.journey?.encounter?.camp?.memory).toBeUndefined();
    }
  });

  it('a parley is remembered on the place and told to the writer on the next pass', () => {
    const talked = settleRoadMeeting(first, 'parleyResolved');
    expect(camps(talked)[0]!.roadCamp!.outcome).toBe('parleyed');
    expect(camps(talked)[0]!.arcStatus).toBe('visited');
    const again = setOutAgain(talked);
    expect(again.journey?.encounter?.camp?.memory).toBe('parleyed');
    expect(roadMeetingFact(again.journey)).toContain('the camp the player talked with before');
  });

  it('getting away is remembered as fled', () => {
    const away = settleRoadMeeting(first, 'escape');
    expect(camps(away)[0]!.roadCamp!.outcome).toBe('fled');
    expect(setOutAgain(away).journey?.encounter?.camp?.memory).toBe('fled');
  });

  it('a cleared camp is final: its people are down on the card and the next pass finds it empty', () => {
    const won = settleRoadMeeting(first, 'victory');
    const p = camps(won)[0]!;
    expect(p.roadCamp!.outcome).toBe('cleared');
    expect(p.arcStatus).toBe('cleared');
    expect((p.dungeonCard!.nodes.flatMap((n) => n.hidden?.mobs ?? [])).every((m) => m.defeated)).toBe(true);
    expect(camps(settleRoadMeeting({ ...won, journey: first.journey }, 'parleyResolved'))[0]!.roadCamp!.outcome).toBe('cleared');
    const again = setOutAgain(won);
    expect(again.journey?.encounter?.kind).not.toBe('camp');
    expect(again.travelBeat?.facts ?? []).toContain(`The way passes ${p.name}, empty since you cleared it.`);
    expect(camps(again)).toHaveLength(1);
  });
});
