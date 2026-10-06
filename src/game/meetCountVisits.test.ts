/**
 * s73 I — "met before" counts later visits, not turns a person was mentioned;
 * "knows them as" only after the player's name was said aloud in front of them.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { applySocialLedgerTurn } from './npcMemory';
import { recordCirclingTurn } from './choiceRanking';
import type { GameState, NpcMemory } from './types';

const WAGON = 'Ash Wagon';

function base(): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  const yara: NpcMemory = {
    npcId: 'yara-quill',
    npcName: 'Yara Quill',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 0,
    met: false,
    location: WAGON,
  };
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character, name: 'Jax' },
    currentLocation: WAGON,
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [{ id: 'ash-wagon', name: WAGON }, { id: 'lowmarket', name: 'Lowmarket' }],
    npcMemories: [yara],
    companions: [],
    log: [],
    turn: 1,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: { ...s.sceneFacts!, present: ['Yara Quill'] },
  } as GameState;
}

function turnAt(state: GameState, turn: number, input: string, place = state.currentLocation): GameState {
  const moved = { ...state, turn, currentLocation: place };
  return recordCirclingTurn(moved, input, []);
}

const yaraOf = (s: GameState) => s.npcMemories!.find((m) => m.npcName === 'Yara Quill')!;
const packet = (s: GameState, input = 'Look around') => formatWriterFacingEvent(buildCompletedEventPacket(s, input));

describe('s73 I — meeting count follows visits', () => {
  it('mentions on the same visit never make Yara a returning acquaintance; leaving and coming back counts once; the spoken name is known', () => {
    let s = turnAt(base(), 2, 'Look around');
    s = harvestNarrativeIntoLedger(s, 'Yara Quill checked the wagon straps without looking up.', 2);
    expect(yaraOf(s).met).toBe(true);
    expect(yaraOf(s).meetCount ?? 0).toBe(0);

    for (const t of [3, 4]) {
      s = turnAt(s, t, 'Wait');
      s = harvestNarrativeIntoLedger(s, 'Yara Quill tied off a rope and kept her eyes on the road.', t);
      const writer = packet(s);
      expect(writer).not.toMatch(/has met Jax before/);
      expect(writer).not.toMatch(/knows them as Jax/);
    }
    expect(yaraOf(s).meetCount ?? 0).toBe(0);

    s = turnAt({ ...s, sceneFacts: { ...s.sceneFacts!, present: [] } }, 5, 'Travel toward Lowmarket', 'Lowmarket');
    s = turnAt(s, 6, 'Travel toward Ash Wagon', WAGON);
    s = { ...s, sceneFacts: { ...s.sceneFacts!, present: ['Yara Quill'] } };
    s = harvestNarrativeIntoLedger(s, 'Yara Quill glanced up from the wagon as you came back.', 6);
    expect(yaraOf(s).meetCount).toBe(1);
    const back = packet(s);
    expect(back).toMatch(/Yara Quill has met Jax before \(once\)/);
    expect(back).not.toMatch(/knows them as Jax/);

    s = turnAt(s, 7, 'Talk to Yara');
    s = harvestNarrativeIntoLedger(s, 'Yara Quill listened.', 7);
    expect(yaraOf(s).meetCount).toBe(1);

    s = applySocialLedgerTurn({
      state: s,
      playerAction: 'I tell her, "My name is Jax."',
      turn: 7,
      talkTopics: [],
      gmText: 'Yara Quill listened and nodded once.',
    });
    expect(yaraOf(s).knownPlayerName).toBe('Jax');
    expect(packet(s)).toMatch(/knows them as Jax/);
  });
});
