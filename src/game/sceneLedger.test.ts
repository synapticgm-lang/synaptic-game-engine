import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { formatInfoSheet, formatSceneLedgerBlock, INFO_SHEET_CHAR_CAP, SCENE_CHAR_BUDGET } from './infoSheet';
import { recordSpokenTopics } from './npcMemory';
import { advanceSceneLedger, stampSceneLedger } from './sceneLedger';
import { alreadySaidLines, classifyTokenLine, plainLineFactProblem, repeatsSaid, type TokenBeat } from './tokenProse';
import type { ActiveDungeonState } from './mapEngine';
import type { Commitment, GameState, NpcMemory } from './types';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    currentLocation: 'Mireglass March',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    places: [{ id: 'mireglass-march', name: 'Mireglass March', dungeonCard: undefined }],
    npcMemories: [],
    log: [],
    turn: 4,
    campaignMemory: { pins: [], consequences: [] },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: {
      ...s.sceneFacts!,
      present: ['Ilyra Fen'],
      hereSpot: { place: 'Mireglass March', spot: 'the bank', turn: 4, nearby: [], awayFrom: [] },
      ...(over.sceneFacts ?? {}),
    },
  } as GameState;
}

const GLASS_LINE = 'Promise to Ilyra Fen: Bring the glass back';
const glassCommitment: Commitment = {
  promiseId: 'quest:glass',
  madeTurn: 2,
  description: 'Bring the glass back',
  status: 'open',
  trustDeltaOnKeep: 5,
  trustDeltaOnBreak: -8,
  beneficiaries: ['Ilyra Fen'],
  witnesses: [],
  kind: 'promise',
  by: 'player',
  to: 'Ilyra Fen',
};

const person = (): NpcMemory =>
  ({
    npcId: 'ilyra-fen',
    npcName: 'Ilyra Fen',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 4,
    location: 'Mireglass March',
  }) as NpcMemory;

describe('scene ledger on the place', () => {
  it('copies said, promises, asks, the spot and one described line, and does not store the line twice', () => {
    const memories = recordSpokenTopics(
      [person()],
      ['Ilyra Fen'],
      [],
      'Ilyra Fen said, "The March keeps what falls into it."',
      4
    );
    const state = base({
      npcMemories: memories,
      commitments: [glassCommitment],
      campaignMemory: {
        pins: [],
        consequences: [
          { id: 'p', text: 'Open thread (T2): I will bring the glass back', createdTurn: 2, unresolved: true },
          { id: 'w', text: 'Open thread (T2): they warn the water takes names', createdTurn: 2, unresolved: true },
          { id: 'a', text: 'Open ask (T3): where does the glass go', createdTurn: 3, unresolved: true },
        ],
      },
    });
    const beat = 'A grey heron stood in the shallows and did not move.';
    const once = stampSceneLedger(state, beat);
    const ledger = once.places![0]!.sceneLedger!;
    expect(ledger.openedTurn).toBe(4);
    expect(ledger.said).toEqual(['The March keeps what falls into it.']);
    expect(ledger.promises).toEqual([GLASS_LINE]);
    expect(ledger.threats).toEqual(['Open thread (T2): they warn the water takes names']);
    expect(ledger.asked).toEqual([{ q: 'Open ask (T3): where does the glass go', answered: false }]);
    expect(ledger.spot).toBe('the bank');
    expect(ledger.present).toContain('Ilyra Fen');
    expect(ledger.described.map((d) => d.line)).toEqual([beat]);
    const twice = stampSceneLedger(once, beat);
    expect(twice.places![0]!.sceneLedger!.said).toEqual(ledger.said);
    expect(twice.places![0]!.sceneLedger!.described).toHaveLength(1);
    expect(twice.places![0]!.sceneLedger!.openedTurn).toBe(4);
  });

  it('fills present and clues from the dungeon card and leaves the card store alone', () => {
    const card = {
      blueprintId: 'dungeon-card',
      dungeonName: 'Mireglass March',
      tier: 1,
      currentZLevel: 0,
      currentNodeId: 'r1',
      visitedNodeIds: ['r1'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'r1',
          name: 'Stair Descent',
          description: 'Steps.',
          connections: [],
          hidden: {
            traps: [],
            lootables: [],
            secrets: [{ id: 's1', clue: 'a cracked saint under the step', revealed: true }],
            mobs: [{ id: 'm1', name: 'Crypt Ghoul', level: 1, role: 'trash' as const, spawned: true }],
          },
        },
      ],
    } as ActiveDungeonState;
    const state = base({
      activeDungeon: card,
      places: [{ id: 'mireglass-march', name: 'Mireglass March', dungeonCard: card }],
    });
    const next = stampSceneLedger(state, 'The stair smelled of wet stone and old ash.');
    const place = next.places![0]!;
    expect(place.dungeonCard).toBe(card);
    expect(place.sceneLedger!.present).toContain('Crypt Ghoul');
    expect(place.sceneLedger!.clues).toEqual(['a cracked saint under the step']);
    expect(next.activeDungeon).toBe(card);
  });
});

describe('scene ledger writer view and repeat gate (Order M steps 3–4)', () => {
  it('SCENE block is on the info sheet, under budget, and pins promises over oldest described', () => {
    const memories = recordSpokenTopics(
      [person()],
      ['Ilyra Fen'],
      [],
      'Ilyra Fen said, "The March keeps what falls into it."',
      4
    );
    let state = base({
      npcMemories: memories,
      commitments: [glassCommitment],
      campaignMemory: {
        pins: [],
        consequences: [
          { id: 'p', text: 'Open thread (T2): I will bring the glass back', createdTurn: 2, unresolved: true },
        ],
      },
    });
    for (let i = 0; i < 20; i++) {
      state = stampSceneLedger(state, `A long grey heron number ${i} stood in the shallows and watched the bank.`);
    }
    const rows = formatSceneLedgerBlock(state);
    expect(rows.join('\n').length).toBeLessThanOrEqual(SCENE_CHAR_BUDGET);
    expect(rows.some((r) => r.startsWith('promise:'))).toBe(true);
    expect(rows.some((r) => r.startsWith('said:'))).toBe(true);
    const sheet = formatInfoSheet(state);
    expect(sheet).toContain('SCENE:');
    expect(sheet).toContain('promise:');
    expect(sheet.length).toBeLessThanOrEqual(INFO_SHEET_CHAR_CAP);
    expect(sheet).not.toContain('ALREADY ON THE PAGE');
  });

  it('alreadySaidLines and repeatsSaid read ledger said and described; narration reprint fails', () => {
    const pack =
      'That pack was the last of my errands, and you handled it fine, so tonight you have earned a meal.';
    const memories = recordSpokenTopics(
      [person()],
      ['Ilyra Fen'],
      [],
      `Ilyra Fen said, "${pack}"`,
      4
    );
    const beat = 'A grey heron stood in the shallows and did not move.';
    const state = stampSceneLedger(
      base({ npcMemories: memories, sceneFacts: { present: ['Ilyra Fen'] } as never }),
      beat
    );
    const said = alreadySaidLines(state, { playerAction: 'Talk to Ilyra Fen' } as never);
    expect(said.get('*said*')).toEqual(expect.arrayContaining([pack]));
    expect(said.get('*described*')).toEqual(expect.arrayContaining([beat]));
    expect(said.get('ilyra fen')).toEqual(expect.arrayContaining([pack]));
    expect(repeatsSaid(pack, said.get('*said*') ?? [])).toBe(true);

    const enumRefs = [{ tok: 't1', id: 'present:ilyra-fen', klass: 'person', display: 'Ilyra Fen' }] as never;
    const beatRefs = { refs: [{ tok: 't1', use: 'speaker', id: 'present:ilyra-fen' }], lines: [] } as unknown as TokenBeat;
    const speech = (text: string) => ({ fn: 'speech', speaker_tok: 't1', spoken: true, text }) as never;
    const narr = (text: string) => ({ fn: 'action', text }) as never;
    expect(classifyTokenLine(speech(pack), beatRefs, enumRefs, [], undefined, said).reason).toBe('said-again');
    expect(classifyTokenLine(narr(`Jarek kept talking. "${pack}"`), beatRefs, enumRefs, [], undefined, said).reason).toBe(
      'said-again'
    );
    // Live narr-vs-described gate waits on bank headroom (NEXT); pool still holds the line.
    expect(said.get('*described*')).toContain(beat);
    expect(plainLineFactProblem(`She said, "${pack}"`, state)).toMatch(/already said or described/);
    expect(classifyTokenLine(speech('Ask who took the glass from the bank last week.'), beatRefs, enumRefs, [], undefined, said).ok).toBe(
      true
    );
  });

  it('pulls a quoted line from the accepted beat into said when harvest has no speaker row', () => {
    const pack = 'That pack was the last of my errands, and you handled it fine, so tonight you have earned a meal.';
    const state = base({ npcMemories: [person()], sceneFacts: { present: ['Ilyra Fen'] } as never });
    const next = stampSceneLedger(state, `Ilyra Fen said, "${pack}" Down the stair, a chair scraped.`);
    expect(next.places![0]!.sceneLedger!.said).toContain(pack);
  });

  it('creates a place row when HERE is not yet on the registry', () => {
    const state = base({
      currentLocation: 'the quiet upper floors of Ernost Keep',
      places: [{ id: 'elsewhere', name: 'Elsewhere' }],
    });
    const next = stampSceneLedger(state, 'Jarek said, "That pack was the last of my errands, and you handled it fine."');
    const row = next.places!.find((p) => p.name === 'the quiet upper floors of Ernost Keep');
    expect(row?.sceneLedger?.said.some((s) => s.includes('pack was the last of my errands'))).toBe(true);
  });
});

describe('scene ledger exit + leapfrog (Order M steps 5–6)', () => {
  it('A → road → B keeps A promise on Previous; next exit puts it on the timeline only', () => {
    const promise = GLASS_LINE;
    const memories = recordSpokenTopics(
      [person()],
      ['Ilyra Fen'],
      [],
      'Ilyra Fen said, "The March keeps what falls into it."',
      4
    );
    let atA = stampSceneLedger(
      base({
        npcMemories: memories,
        commitments: [glassCommitment],
        campaignMemory: {
          pins: [],
          consequences: [{ id: 'p', text: promise, createdTurn: 2, unresolved: true }],
        },
      }),
      'A grey heron stood in the shallows and did not move.'
    );
    expect(atA.places![0]!.sceneLedger!.said.length).toBeGreaterThan(0);
    expect(atA.places![0]!.sceneLedger!.described.length).toBeGreaterThan(0);

    // Leave A for the road — never closeDungeon; condense A; Previous = A.
    const onRoad = advanceSceneLedger(atA, {
      ...atA,
      currentLocation: 'Open road',
      turn: 5,
      journey: { from: 'Mireglass March', to: 'Saltford', ground: 'Open road' } as never,
    });
    const aLeft = onRoad.places!.find((p) => p.name === 'Mireglass March')!;
    expect(aLeft.sceneLedger!.said).toEqual([]);
    expect(aLeft.sceneLedger!.described).toEqual([]);
    expect(aLeft.sceneLedger!.promises).toContain(promise);
    expect(onRoad.scenePrevious?.label).toBe('Mireglass March');
    expect(onRoad.scenePrevious?.promises).toContain(promise);
    expect(onRoad.timeline ?? []).toEqual([]);

    // Arrive at B — fold road + A into Previous; stamp B.
    let atB = advanceSceneLedger(onRoad, {
      ...onRoad,
      currentLocation: 'Saltford',
      turn: 6,
      places: [
        ...(onRoad.places ?? []),
        { id: 'saltford', name: 'Saltford' },
      ],
      sceneFacts: { ...onRoad.sceneFacts!, present: ['Dock Clerk'], location: 'Saltford' } as never,
      journey: null,
    });
    atB = stampSceneLedger(atB, 'Saltford harbour smelled of tar and wet rope.');
    expect(atB.scenePrevious?.label).toMatch(/Mireglass March \+ road to Saltford/);
    expect(atB.scenePrevious?.promises).toContain(promise);
    const scene = formatSceneLedgerBlock(atB);
    expect(scene.some((r) => r.startsWith('prev-promise:') && r.includes('glass'))).toBe(true);
    expect(scene.join('\n').length).toBeLessThanOrEqual(SCENE_CHAR_BUDGET);
    expect((atB.timeline ?? []).filter((f) => f.kind === 'scene')).toHaveLength(0);

    // One more scene exit — A's compact Previous leaves the packet for the timeline.
    const atC = advanceSceneLedger(atB, {
      ...atB,
      currentLocation: 'Lowmarket',
      turn: 7,
      places: [...(atB.places ?? []), { id: 'lowmarket', name: 'Lowmarket' }],
    });
    expect(atC.scenePrevious?.label).toBe('Saltford');
    expect(atC.scenePrevious?.label).not.toMatch(/Mireglass|road/);
    const sceneFacts = (atC.timeline ?? []).filter((f) => f.kind === 'scene');
    expect(sceneFacts.some((f) => /glass|Mireglass|promise/i.test(f.text))).toBe(true);
    expect(formatSceneLedgerBlock(atC).some((r) => r.startsWith('prev:') && /Mireglass|road/.test(r))).toBe(
      false
    );
  });

  it('dungeon leave condenses the site ledger and never needs closeDungeon', () => {
    const card = {
      blueprintId: 'dungeon-card',
      dungeonName: 'Mireglass March',
      siteName: 'Mireglass March',
      tier: 1,
      currentZLevel: 0,
      currentNodeId: 'r1',
      visitedNodeIds: ['r1'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'r1',
          name: 'Stair Descent',
          description: 'Steps.',
          connections: [],
          hidden: {
            traps: [],
            lootables: [],
            secrets: [{ id: 's1', clue: 'a cracked saint under the step', revealed: true }],
            mobs: [],
          },
        },
      ],
    } as ActiveDungeonState;
    let inside = stampSceneLedger(
      base({
        activeDungeon: card,
        currentLocation: 'Mireglass March — Stair Descent',
        places: [{ id: 'mireglass-march', name: 'Mireglass March', dungeonCard: card }],
        commitments: [glassCommitment],
        campaignMemory: {
          pins: [],
          consequences: [
            { id: 'p', text: 'Open thread (T2): I will bring the glass back', createdTurn: 2, unresolved: true },
          ],
        },
      }),
      'The stair smelled of wet stone and old ash.'
    );
    expect(inside.places![0]!.sceneLedger!.described.length).toBeGreaterThan(0);
    expect(inside.places![0]!.sceneLedger!.clues).toContain('a cracked saint under the step');

    const outside = advanceSceneLedger(inside, {
      ...inside,
      activeDungeon: null,
      currentLocation: 'Mireglass March',
      turn: 5,
    });
    const site = outside.places!.find((p) => p.name === 'Mireglass March')!;
    expect(site.sceneLedger!.said).toEqual([]);
    expect(site.sceneLedger!.described).toEqual([]);
    expect(site.sceneLedger!.clues).toContain('a cracked saint under the step');
    expect(site.sceneLedger!.promises.some((p) => p.includes('glass'))).toBe(true);
    expect(outside.scenePrevious?.clues).toContain('a cracked saint under the step');
    expect(outside.activeDungeon).toBeNull();
  });
});
