/**
 * s72 F — Garth: "said <noun phrase>" is an action, not speech; a quote under the person's own first name is theirs.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { formatInfoSheet } from './infoSheet';
import { applySocialLedgerTurn, recordSpokenTopics } from './npcMemory';
import type { GameState, LogEntry, NpcMemory } from './types';

let id = 0;
const entry = (turn: number, role: LogEntry['role'], content: string): LogEntry =>
  ({ id: `garth${id++}`, turn, role, content, timestamp: turn }) as LogEntry;

const garth = (): NpcMemory =>
  ({
    npcId: 'garth-barrow',
    npcName: 'Garth Barrow',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 15,
    met: true,
    introSpoken: true,
    location: 'The Weighing Cup',
  }) as NpcMemory;

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed72',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'The Weighing Cup',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [{ id: 'the-weighing-cup', name: 'The Weighing Cup' }],
    npcMemories: [garth()],
    companions: [],
    log: [],
    turn: 19,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present: ['Garth Barrow'], ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const T15 =
  'Garth Barrow looked up from a bench near the wall and said Jax\'s name like they had just seen them a moment ago.';
const T19 = 'Garth Barrow was already there. "Back already," Garth said, even and calm.';

describe('s72 F — Garth speech saving', () => {
  it('T15 "said Jax\'s name like…" with Garth present stores nothing', () => {
    const out = recordSpokenTopics([garth()], ['Garth Barrow'], [], T15, 15);
    expect(out[0]!.said).toBeUndefined();
  });

  it('"Back already," Garth said stores Back already for Garth Barrow', () => {
    const out = recordSpokenTopics([garth()], ['Garth Barrow'], [], T19, 19);
    expect(out[0]!.said).toEqual([{ topic: 'other', turn: 19, line: 'Back already' }]);
  });

  it('the first name does not bind when another present person shares it', () => {
    const other = { ...garth(), npcId: 'garth-hale', npcName: 'Garth Hale' };
    const out = recordSpokenTopics([garth(), other], ['Garth Barrow', 'Garth Hale'], [], T19, 19);
    expect(out.every((m) => m.said === undefined)).toBe(true);
  });

  it('the info sheet and the writer packet quote Back already after T15 and T19', () => {
    let state = base({ turn: 15 });
    state = applySocialLedgerTurn({ state, playerAction: 'Look around', turn: 15, talkTopics: [], gmText: T15 });
    state = applySocialLedgerTurn({ state: { ...state, turn: 19 }, playerAction: 'Walk in', turn: 19, talkTopics: [], gmText: T19 });
    const at21 = { ...state, turn: 21, log: [entry(20, 'player', 'Talk to Garth Barrow'), entry(20, 'gm', 'The room was warm.')] };
    const sheet = formatInfoSheet(at21);
    expect(sheet).toMatch(/Garth Barrow.*already said \(other, T19\): "Back already"/);
    expect(sheet).not.toContain('a moment ago');
    const writer = formatWriterFacingEvent(buildCompletedEventPacket(at21, 'Talk to Garth Barrow'));
    expect(writer).toContain('Back already');
    expect(writer).not.toContain('a moment ago');
  });
});
