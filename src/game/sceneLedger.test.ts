import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { recordSpokenTopics } from './npcMemory';
import { stampSceneLedger } from './sceneLedger';
import type { ActiveDungeonState } from './mapEngine';
import type { GameState, NpcMemory } from './types';

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
    expect(ledger.promises).toEqual(['Open thread (T2): I will bring the glass back']);
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
