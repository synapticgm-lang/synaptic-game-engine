import { describe, expect, it } from 'vitest';
import { introducedNamedPeople, namedPersonCandidates } from './tokenProse';
import { registerWriterIntroductions } from './writerIntroductions';
import type { GameState } from './types';

describe('P-5d named invented people', () => {
  it('reads a name in a person slot as a person, and a name after a preposition as not one', () => {
    expect(introducedNamedPeople('By the stall, Mara Voss watched the gate.', [])).toEqual(['Mara Voss']);
    expect(introducedNamedPeople('Jax turned from Ulf and stepped to the board.', [])).toEqual([]);
    expect(introducedNamedPeople('Jax walked toward the Ash Gate.', [])).toEqual([]);
  });

  it('a name sharing a word with a known person clashes', () => {
    expect(namedPersonCandidates('At the door, Oda Kell waited.', ['Oda Brack']).clash).toBe(true);
    expect(namedPersonCandidates('At the door, Oda Brack waited.', ['Oda Brack'])).toEqual({ names: [], clash: false });
  });

  it('q72: writer-invented names are refused — prose no longer admits presence', () => {
    const state = {
      turn: 2, currentLocation: 'Docks', character: { name: 'Jax' }, npcMemories: [],
      sceneFacts: { crowd: 'empty', noise: 'quiet', present: [], props: [], lastBeat: '' },
    } as unknown as GameState;
    const next = registerWriterIntroductions(state, 'By the stall, Mara Voss watched the gate.');
    expect(next.npcMemories ?? []).toEqual([]);
    expect(next).toBe(state);
  });
});
