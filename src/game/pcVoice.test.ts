import { describe, expect, it } from 'vitest';
import { classifyTokenLine, lineVoicesPc, plainLineFactProblem } from './tokenProse';
import { createInitialState } from './defaults';
import type { GameState } from './types';

const beat = { lines: [], refs: [] } as never;
const narr = (text: string) => ({ fn: 'narration', text }) as never;

describe('P-5b: pc-voice (the writer never speaks for the player)', () => {
  it('a narration line quoting the PC by name fails on the token path', () => {
    expect(classifyTokenLine(narr('Jax leaned in. "The name is Jax," he told the clerk.'), beat, [], ['Jax'], undefined, undefined, 'Jax').reason).toBe('pc-voice');
    expect(lineVoicesPc('You shrug. "All of them were down."', 'Jax')).toBe(true);
    expect(lineVoicesPc('"All of them were down," you say.', 'Jax')).toBe(true);
  });
  it('the player\'s own words may be quoted', () => {
    expect(lineVoicesPc('Jax said, "The name is Jax."', 'Jax', 'The name is Jax')).toBe(false);
    expect(classifyTokenLine(narr('Jax said, "The name is Jax."'), beat, [], ['Jax'], undefined, undefined, 'Jax', 'the name is jax').reason).not.toBe('pc-voice');
  });
  it('someone else speaking passes', () => {
    expect(lineVoicesPc('Edda looked up. "You are late."', 'Jax')).toBe(false);
    expect(lineVoicesPc('The rain kept on.', 'Jax')).toBe(false);
  });
  it('the plain (repair/ledger) path fails it too', () => {
    const s = { ...createInitialState('pc', 'dnd'), character: { ...createInitialState('pc', 'dnd').character, name: 'Jax' } } as GameState;
    expect(plainLineFactProblem('Jax grinned. "Then we go tonight."', s)).toBe("words put in the player's mouth");
    expect(plainLineFactProblem('Jax grinned. "Then we go tonight."', s, { playerAction: 'Then we go tonight' } as never)).not.toBe("words put in the player's mouth");
  });
});
