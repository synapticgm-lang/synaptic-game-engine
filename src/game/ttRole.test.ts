/**
 * q48-ROLE — place-provided and writer-introduced roles join the one presence record
 * (presentNpcRecords / admitPersonHere). Places never register as people (q46-PAP).
 */
import { describe, expect, it } from 'vitest';
import { peopleHere } from './chipLegality';
import { presentNpcRecords } from './npcRecords';
import { commitOfferedPad } from './playTranscript';
import { applyOptionCooldown } from './sceneAffordances';
import { checkPlayCrimes } from './turnCheck';
import { admitPersonHere, registerWriterIntroductions } from './writerIntroductions';
import type { GameState, NpcMemory, PlaceRecord, RoadEncounter } from './types';

function names(state: GameState): string[] {
  return presentNpcRecords(state).map((m) => m.npcName);
}

function memory(npcName: string, location?: string, extra?: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: `mem:${npcName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...(location ? { location } : {}),
    ...extra,
  };
}

function hallState(extra?: Partial<GameState>): GameState {
  const hall: PlaceRecord = {
    id: 'place_contract-hall',
    name: 'Contract Hall',
    aliases: ['the Contract Hall'],
    mapScale: 'street',
    arcStatus: 'open',
    sceneLedger: {
      openedTurn: 1,
      said: [],
      described: [],
      promises: [],
      threats: [],
      clues: [],
      asked: [] as { q: string; answered: boolean }[],
      present: ['Brin Holt', 'Clerk Brin'],
      spot: '',
    },
  };
  return {
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Contract Hall',
    turn: 2,
    seed: 'role',
    log: [],
    rolls: [],
    character: { name: 'Jax' },
    npcMemories: [
      memory('Brin Holt', 'Contract Hall', { aliases: ['Clerk Brin Holt', 'Clerk Brin'], roleHint: 'informant' }),
      {
        npcId: 'writer:contract-hall:clerk',
        npcName: 'the clerk',
        disposition: 'neutral',
        facts: ['Introduced by the story at Contract Hall on turn 2.'],
        lastSeenTurn: 2,
      },
    ],
    companions: [],
    places: [hall],
    sceneFacts: { present: ['Brin Holt'], props: [], anonymousRoles: ['clerk'] },
    ...extra,
  } as GameState;
}

function roadState(encounter: RoadEncounter | null, extra?: Partial<GameState>): GameState {
  return {
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'On the road between places',
    turn: 3,
    seed: 'pres',
    log: [],
    rolls: [],
    character: { name: 'Ada' },
    npcMemories: [],
    companions: [],
    sceneFacts: { present: [], props: [] },
    journey: {
      from: 'Greyhollow Inn',
      to: 'Keep Gate',
      ground: 'road',
      terrain: 'road',
      legsTotal: 4,
      legsDone: 1,
      hoursPerLeg: 2,
      startedTurn: 1,
      encounter,
    },
    ...extra,
  } as GameState;
}

describe('q48-ROLE place roles in the presence record', () => {
  it('seed 20363 T2: the clerk is present at Contract Hall and speaking is not flagged', () => {
    const s = hallState();
    expect(names(s).some((n) => /clerk/i.test(n))).toBe(true);
    expect(peopleHere(s).some((n) => /clerk/i.test(n))).toBe(true);
    const speak = checkPlayCrimes(
      s,
      s,
      'Refuse the work',
      'Jax looked at the job board, then at the clerk, and said they would not take the work. Brin Holt said, "Keep your kit."'
    );
    expect(speak.p0.some((f) => f.kind === 'absent-speaker' && /clerk/i.test(f.detail))).toBe(false);
  });

  it('the clerk leaves the presence record when the player leaves Contract Hall', () => {
    const atHall = admitPersonHere(hallState({ npcMemories: [memory('Brin Holt', 'Contract Hall')] }), 'the clerk');
    expect(names(atHall).some((n) => /clerk/i.test(n))).toBe(true);
    const left = { ...atHall, currentLocation: 'Cathedral Close', sceneFacts: { present: [], props: [] } } as unknown as GameState;
    expect(names(left).some((n) => /clerk/i.test(n))).toBe(false);
  });

  it('a role of another place is still absent when they speak', () => {
    const s = hallState({
      npcMemories: [
        memory('Brin Holt', 'Contract Hall'),
        memory('the innkeeper', 'Greyhollow Inn'),
      ],
      sceneFacts: { present: ['Brin Holt'], props: [] } as unknown as GameState['sceneFacts'],
    });
    expect(names(s).some((n) => /innkeeper/i.test(n))).toBe(false);
    const gone = checkPlayCrimes(s, s, 'Wait', 'The innkeeper says the ale is gone.');
    expect(gone.p0.some((f) => f.kind === 'absent-speaker' && /innkeeper/i.test(f.detail))).toBe(true);
  });

  it('the TALK slot offers only people in the presence record', () => {
    const s = hallState({
      npcMemories: [memory('Brin Holt', 'Contract Hall'), memory('Absent Quinn', 'Lowmarket')],
      sceneFacts: { present: ['Brin Holt'], props: [] } as unknown as GameState['sceneFacts'],
    });
    const next = commitOfferedPad(s);
    expect([...(next.choices ?? [])].some((l) => /absent quinn/i.test(l))).toBe(false);
    const brin = presentNpcRecords(s).find((m) => m.npcName === 'Brin Holt')!;
    const slotted = applyOptionCooldown(s, [
      { label: 'Talk to Brin Holt', actionId: `person:${brin.npcId}:talk`, kind: 'affordance', slotCategory: 'talk', entityId: brin.npcId, rank: 80 },
      { label: 'Talk to Absent Quinn', actionId: 'person:mem:absent-quinn:talk', kind: 'affordance', slotCategory: 'talk', entityId: 'mem:absent-quinn', rank: 70 },
    ]);
    expect(slotted.filter((c) => c.slotCategory === 'talk').map((c) => c.label)).toEqual(['Talk to Brin Holt']);
  });

  it('writer introductions admit roles at HERE and refuse registered places (q46-PAP s20316)', () => {
    const base = {
      turn: 2,
      currentLocation: 'Safehouse Alley',
      campaignBibleId: 'salt-road-heist',
      character: { name: 'Jax' },
      npcMemories: [],
      places: [{ id: 'place_safehouse-alley', name: 'Safehouse Alley', mapScale: 'street', arcStatus: 'open' }],
      sceneFacts: { crowd: 'empty', noise: 'quiet', present: [], props: [], lastBeat: '' },
    } as unknown as GameState;
    const alley = registerWriterIntroductions(base, 'Jax stood still in Safehouse Alley and said the reason they had come.');
    expect(alley.npcMemories?.some((m) => /safehouse alley/i.test(m.npcName))).toBe(false);
    // q72: prose path refuses writer-invented roles — engine admitPersonHere still works.
    const withGuard = registerWriterIntroductions(base, 'A guard coiled rope by the rail.');
    expect(withGuard.npcMemories ?? []).toEqual([]);
    const admitted = admitPersonHere(base, 'the guard', 'engine cast');
    expect(admitted.npcMemories).toEqual([
      expect.objectContaining({ npcName: 'the guard', location: 'Safehouse Alley' }),
    ]);
  });

  it('earlier presence cases stay green: Maud, Piers, Col Tew on the road', () => {
    const maud = roadState(
      { kind: 'meeting', level: 1, stretch: 0, dangerous: false, name: 'Maud Merrow' },
      { npcMemories: [memory('Maud Merrow')] }
    );
    expect(names(maud)).toContain('Maud Merrow');
    expect(checkPlayCrimes(maud, maud, 'Wait', 'Maud Merrow says the road is watched.').p0.some((f) => f.kind === 'absent-speaker')).toBe(false);
    const piers = roadState(
      { kind: 'traveler', level: 1, stretch: 1, dangerous: false, name: 'Piers Rudd' },
      { turn: 6, npcMemories: [memory('Piers Rudd')] }
    );
    expect(names(piers)).toContain('Piers Rudd');
    const col = roadState(
      { kind: 'thugs', level: 4, stretch: 1, dangerous: true, count: 2, name: 'Col Tew' },
      { engineMode: 'litrpg', turn: 7, npcMemories: [memory('Col Tew')] }
    );
    expect(names(col)).toContain('Col Tew');
  });
});
