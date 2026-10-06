/**
 * s70 Bug B — ordinary first-person speech from a met person is not a self-intro.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { sentenceLooksLikeSelfIntro } from './npcMemory';
import { checkSheetMemory } from './turnCheck';
import type { GameState, NpcMemory } from './types';

const T20 =
  'Jax slowed on the cracked street and turned to the woman walking beside him, and asked her straight what brought her out this way today. Edda Tew stopped too and said, "I\'m off to the Lowmarket for cloth and a few roots, and I wanted the walk before the light goes."';

const edda: NpcMemory = {
  npcId: 'edda',
  npcName: 'Edda Tew',
  aliases: ['Edda'],
  disposition: 'friendly',
  facts: ['Introduced in play T7'],
  lastSeenTurn: 19,
  met: true,
  introSpoken: true,
  meetCount: 6,
  completedTopics: ['intro'],
  knownPlayerName: 'Jax',
  relationshipStatus: 'acquaintance',
  location: 'Valespire roads',
} as NpcMemory;

function state(): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    currentLocation: 'Valespire roads',
    npcMemories: [edda],
    companions: [],
    turn: 20,
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
  };
}

describe('s70 intro false positive', () => {
  it('the T20 Edda line is not a self-intro', () => {
    expect(sentenceLooksLikeSelfIntro(T20, 'Edda Tew')).toBe(false);
    expect(sentenceLooksLikeSelfIntro(T20, 'Edda')).toBe(false);
  });

  it('a spoken name after the phrase is a self-intro', () => {
    expect(sentenceLooksLikeSelfIntro('"I\'m Edda Tew," she said.', 'Edda Tew')).toBe(true);
    expect(sentenceLooksLikeSelfIntro('Edda said, "My name is Edda."', 'Edda')).toBe(true);
  });

  it('checkSheetMemory on met Edda with the T20 prose raises no sheet-forgotten', () => {
    expect(checkSheetMemory(state(), 'Edda Tew stops. "I\'m Edda Tew, of the lower lanes."')[0]?.kind).toBe('sheet-forgotten');
    expect(checkSheetMemory(state(), T20).filter((f) => f.kind === 'sheet-forgotten')).toEqual([]);
  });
});
