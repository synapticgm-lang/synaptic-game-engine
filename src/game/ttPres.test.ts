/**
 * q47-PRES — one presence record (presentNpcRecords). Road encounter leader and party
 * are in it while the meeting runs; the place left behind is not; TALK and absent-speaker read it.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { peopleHere } from './chipLegality';
import { presentNpcRecords } from './npcRecords';
import { commitOfferedPad } from './playTranscript';
import { applyOptionCooldown } from './sceneAffordances';
import { checkPlayCrimes } from './turnCheck';
import type { GameState, NpcMemory, RoadEncounter } from './types';

function names(state: GameState): string[] {
  return presentNpcRecords(state).map((m) => m.npcName);
}

function memory(npcName: string, location?: string): NpcMemory {
  return {
    npcId: `mem:${npcName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...(location ? { location } : {}),
  };
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
    sceneFacts: { present: [], props: [], exits: [] },
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

function loadMega(turn: 69 | 70 | 71): { before: GameState; after: GameState } {
  const raw = JSON.parse(readFileSync(`src/game/__fixtures__/pres/mega19053-pres-t${turn}.json`, 'utf8'));
  return { before: raw.before as GameState, after: raw.after as GameState };
}

describe('q47-PRES presence record', () => {
  it('keeps the road leader and party while the meeting runs, then drops them', () => {
    const live = roadState({ kind: 'thugs', level: 2, stretch: 1, dangerous: false, count: 2, name: 'Col Tew' });
    expect(names(live)).toContain('Col Tew');
    expect(peopleHere(live)).toContain('thugs');
    const over = roadState({ kind: 'thugs', level: 2, stretch: 1, dangerous: false, count: 2, name: 'Col Tew', engaged: true });
    expect(names(over)).not.toContain('Col Tew');
    expect(peopleHere(over)).not.toContain('thugs');
    const arrived = {
      ...live,
      currentLocation: 'Keep Gate',
      journey: { ...live.journey!, legsDone: 4, encounter: null },
    } as GameState;
    expect(names(arrived)).not.toContain('Col Tew');
  });

  it('carries companions and leaves the place behind', () => {
    const s = roadState(
      { kind: 'meeting', level: 1, stretch: 0, dangerous: false, name: 'Maud Merrow' },
      {
        companions: [{ id: 'c1', name: 'Bram Holt', type: 'party', role: 'guide', hp: 1, maxHp: 1, maintenanceCost: '', assignment: '', notes: '' }],
        npcMemories: [memory('Bram Holt', 'Greyhollow Inn'), memory('Maud Pike', 'Lowmarket')],
      }
    );
    const here = names(s);
    expect(here).toContain('Maud Merrow');
    expect(here).toContain('Bram Holt');
    expect(here).not.toContain('Maud Pike');
  });

  it('camp party joins from the camp record', () => {
    const s = roadState(
      { kind: 'camp', level: 2, stretch: 1, dangerous: false, name: 'Wren Ash', camp: { placeId: 'camp-1', headcount: 2 } },
      {
        places: [{
          id: 'camp-1',
          name: "Wren Ash's camp",
          roadCamp: { route: 'a|b', leg: 1, leader: 'Wren Ash', people: ['Wren Ash', 'Ned Pell'], miniBoss: false, level: 2 },
        }],
      } as Partial<GameState>
    );
    expect(names(s)).toEqual(expect.arrayContaining(['Wren Ash', 'Ned Pell']));
  });

  it('Maud Merrow and Piers Rudd are present when they speak', () => {
    const maud = roadState(
      { kind: 'meeting', level: 1, stretch: 0, dangerous: false, name: 'Maud Merrow' },
      { npcMemories: [memory('Maud Merrow')] }
    );
    const maudSpeak = checkPlayCrimes(maud, maud, 'Wait', 'Maud Merrow says the road is watched.');
    expect(maudSpeak.p0.some((f) => f.kind === 'absent-speaker')).toBe(false);
    const piers = roadState(
      { kind: 'traveler', level: 1, stretch: 1, dangerous: false, name: 'Piers Rudd' },
      { turn: 6, npcMemories: [memory('Piers Rudd')] }
    );
    expect(names(piers)).toContain('Piers Rudd');
    const piersSpeak = checkPlayCrimes(piers, piers, 'Greet the traveler', 'Piers Rudd says he is bound for the gate.');
    expect(piersSpeak.p0.some((f) => f.kind === 'absent-speaker')).toBe(false);
  });

  it('Col Tew and the thugs are present when addressed; a truly absent person still flags', () => {
    const s = roadState(
      { kind: 'thugs', level: 4, stretch: 1, dangerous: true, count: 2, name: 'Col Tew' },
      { engineMode: 'litrpg', turn: 7, npcMemories: [memory('Col Tew'), memory('the thugs'), memory('Absent Quinn', 'Lowmarket')] }
    );
    expect(names(s)).toContain('Col Tew');
    expect(peopleHere(s)).toContain('thugs');
    const addressed = checkPlayCrimes(s, s, 'Talk to Col Tew', 'Col Tew says nothing. The thugs said to turn back.');
    expect(addressed.p0.some((f) => f.kind === 'absent-speaker' && /Col Tew|thugs/.test(f.detail))).toBe(false);
    const gone = checkPlayCrimes(s, s, 'Wait', 'Absent Quinn says you should have stayed in Lowmarket.');
    expect(gone.p0.some((f) => f.kind === 'absent-speaker' && f.detail.startsWith('Absent Quinn'))).toBe(true);
  });

  it('MEGA3 Hale Cotter is present on the live road meeting and gone once it ends', () => {
    const t69 = loadMega(69);
    expect(names(t69.before)).not.toContain('Hale Cotter');
    expect(names(t69.after)).toContain('Hale Cotter');
    expect(peopleHere(t69.after)).toContain('thugs');
    const t70 = loadMega(70);
    expect(names(t70.before)).toContain('Hale Cotter');
    expect(peopleHere(t70.before)).toContain('thugs');
    expect(names(t70.after)).not.toContain('Hale Cotter');
    expect(peopleHere(t70.after)).not.toContain('thugs');
    const t71 = loadMega(71);
    expect(names(t71.after)).not.toContain('Hale Cotter');
  });

  it('the TALK slot offers only people in the presence record', () => {
    const s = roadState(
      { kind: 'meeting', level: 1, stretch: 0, dangerous: false, name: 'Maud Merrow' },
      { npcMemories: [memory('Absent Quinn', 'Lowmarket'), memory('Maud Merrow')] }
    );
    const next = commitOfferedPad(s);
    const offered = [...(next.choices ?? [])];
    expect(offered.some((l) => /absent quinn/i.test(l))).toBe(false);
    const maud = presentNpcRecords(s).find((m) => m.npcName === 'Maud Merrow')!;
    const slotted = applyOptionCooldown(s, [
      { label: 'Talk to Maud Merrow', actionId: `person:${maud.npcId}:talk`, kind: 'affordance', slotCategory: 'talk', entityId: maud.npcId, rank: 80 },
      { label: 'Talk to Absent Quinn', actionId: 'person:mem:absent-quinn:talk', kind: 'affordance', slotCategory: 'talk', entityId: 'mem:absent-quinn', rank: 70 },
    ]);
    const talk = slotted.filter((c) => c.slotCategory === 'talk').map((c) => c.label);
    expect(talk).toEqual(['Talk to Maud Merrow']);
  });

  it('q78r: shouldExit on the canonical memory drops them from the presence record and TALK', () => {
    const here = 'the stable loft behind the Weighing Cup';
    const s = roadState(null, {
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: here,
      turn: 7,
      seed: '20673',
      journey: undefined,
      // Covers done and player moved on — opening cast must not pad peopleHere with Joss.
      openingEstablishment: { complete: true, pending: [], answers: { where: 'Cathedral Close' } } as GameState['openingEstablishment'],
      sceneFacts: { present: ['Crown'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 7 },
      npcMemories: [
        memory('Crown', here),
        { ...memory('Ostler Joss', here), shouldExit: true },
        { ...memory('Joss', 'The Weighing Cup'), shouldExit: true },
      ],
    });
    expect(names(s)).toContain('Crown');
    expect(names(s)).not.toContain('Ostler Joss');
    expect(peopleHere(s)).toContain('Crown');
    expect(peopleHere(s).some((n) => /^ostler joss$/i.test(n) || /^joss$/i.test(n))).toBe(false);
    const crown = presentNpcRecords(s).find((m) => m.npcName === 'Crown')!;
    const slotted = applyOptionCooldown(s, [
      { label: 'Talk to Crown', actionId: `person:${crown.npcId}:talk`, kind: 'affordance', slotCategory: 'talk', entityId: crown.npcId, rank: 80 },
      { label: 'Talk to Ostler Joss', actionId: 'person:mem:ostler-joss:talk', kind: 'affordance', slotCategory: 'talk', entityId: 'mem:ostler-joss', rank: 70 },
    ]);
    expect(slotted.filter((c) => c.slotCategory === 'talk').map((c) => c.label)).toEqual(['Talk to Crown']);
  });
});
