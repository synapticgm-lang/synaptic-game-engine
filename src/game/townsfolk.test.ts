import { describe, expect, it } from 'vitest';
import { compileRefEnum, formatWriterFacingEvent } from './completedEventPacket';
import { prepareWriterInputWithTownsfolk, seedTownsfolkHere, townsfolkWriterLines } from './townsfolk';
import type { GameState, NpcMemory } from './types';

const ALDOUS: NpcMemory = {
  npcId: 'ck-aldous',
  npcName: 'Father Aldous',
  disposition: 'neutral',
  facts: ['Bible roster: quest-patron'],
  lastSeenTurn: 0,
  location: 'Midnight Well',
};

function state(over: Partial<GameState> = {}): GameState {
  return {
    turn: 3,
    currentLocation: 'Midnight Well',
    campaignBibleId: 'cursed-keep',
    npcMemories: [ALDOUS],
    openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
    sceneFacts: {},
    inventory: [],
    log: [],
    ...over,
  } as unknown as GameState;
}

/** Opening place seen once, then the player walks to the inn. */
function atInn(): GameState {
  const opened = seedTownsfolkHere(state());
  return seedTownsfolkHere({ ...opened, turn: 5, currentLocation: 'Greyhollow Inn' });
}

describe('townsfolk', () => {
  it('the opening place is the card’s: nobody is added there', () => {
    const s = state();
    const seeded = seedTownsfolkHere(s);
    expect(seeded.npcMemories).toEqual([ALDOUS]);
    expect(seeded.townsfolkPlaces).toEqual(['midnight well']);
  });

  it('a new place gets its people once, each with a sheet, saved at that place', () => {
    const inn = atInn();
    const town = inn.npcMemories!.filter((m) => m.sheet);
    expect(town).toHaveLength(2);
    for (const m of town) {
      expect(m.location).toBe('Greyhollow Inn');
      expect(m.met).toBe(false);
      expect(m.sheet!.job).toBeTruthy();
      expect(m.npcName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    }
    expect(seedTownsfolkHere({ ...inn, turn: 6 })).toEqual({ ...inn, turn: 6 });
  });

  it('coming back finds the same people with the same sheets', () => {
    const inn = atInn();
    const people = inn.npcMemories!.filter((m) => m.sheet);
    const away = seedTownsfolkHere({ ...inn, turn: 7, currentLocation: 'Back streets' });
    const back = seedTownsfolkHere({ ...away, turn: 9, currentLocation: 'Greyhollow Inn' });
    const again = back.npcMemories!.filter((m) => m.location === 'Greyhollow Inn');
    expect(again).toEqual(people);
    expect(townsfolkWriterLines(back, compileRefEnum(back))).toHaveLength(2);
  });

  it('the same place and campaign always makes the same people', () => {
    expect(atInn().npcMemories).toEqual(atInn().npcMemories);
  });

  it('townsfolk are in the REF ENUM as people', () => {
    const inn = atInn();
    const refs = compileRefEnum(inn);
    for (const m of inn.npcMemories!.filter((x) => x.sheet)) {
      expect(refs.some((r) => r.display === m.npcName && r.klass === 'person')).toBe(true);
    }
  });

  it('roster people are untouched and never get a sheet', () => {
    const inn = atInn();
    expect(inn.npcMemories!.find((m) => m.npcId === 'ck-aldous')).toEqual(ALDOUS);
  });

  it('no seeding in a fight or partway along a road; the place fills later', () => {
    const opened = seedTownsfolkHere(state());
    const fight = seedTownsfolkHere({
      ...opened,
      currentLocation: 'Greyhollow Inn',
      activeEncounter: { name: 'Keep Wraith' } as GameState['activeEncounter'],
    });
    expect(fight.npcMemories).toEqual([ALDOUS]);
    expect(fight.townsfolkPlaces).toEqual(['midnight well']);
    const road = seedTownsfolkHere({
      ...opened,
      currentLocation: 'Back streets',
      journey: { legsDone: 1, legsTotal: 3 } as GameState['journey'],
    });
    expect(road.npcMemories).toEqual([ALDOUS]);
  });

  it('the writer is given their sheet line, never the secret', () => {
    const opened = seedTownsfolkHere(state());
    const walked = { ...opened, turn: 5, currentLocation: 'Greyhollow Inn' } as GameState;
    const prepared = prepareWriterInputWithTownsfolk(walked, 'Look around');
    const people = prepared.state.npcMemories!.filter((m) => m.sheet);
    expect(people).toHaveLength(2);
    expect(prepared.packet.townsfolk).toHaveLength(2);
    expect(prepared.state.completedEvent).toBe(prepared.packet);
    expect(prepared.writerFacing).toBe(formatWriterFacingEvent(prepared.packet));
    expect(prepared.writerFacing).toContain('PEOPLE HERE');
    for (const m of people) {
      const tok = prepared.packet.refEnum!.find((r) => r.display === m.npcName)!.tok;
      expect(prepared.writerFacing).toContain(`@${tok} ${m.npcName} (${m.sheet!.job})`);
      if (m.sheet!.secret) expect(prepared.writerFacing).not.toContain(m.sheet!.secret);
    }
  });

  it('each sheet line carries that person’s own token, and nobody without a token is listed', () => {
    const inn = atInn();
    const refs = compileRefEnum(inn);
    const lines = townsfolkWriterLines(inn, refs);
    for (const m of inn.npcMemories!.filter((x) => x.sheet)) {
      const tok = refs.find((r) => r.display === m.npcName)!.tok;
      expect(lines.filter((l) => l.startsWith(`@${tok} `))).toEqual([expect.stringContaining(m.npcName)]);
    }
    expect(townsfolkWriterLines(inn, refs.filter((r) => r.display !== 'Edda Merrow' && !r.id.startsWith('present:')))).toEqual([]);
  });

  it('a place with no townsfolk leaves the packet as it was', () => {
    const prepared = prepareWriterInputWithTownsfolk(state(), 'Look around');
    expect(prepared.packet.townsfolk).toBeUndefined();
    expect(prepared.writerFacing).not.toContain('PEOPLE HERE');
  });
});
