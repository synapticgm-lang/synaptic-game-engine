import { describe, expect, it } from 'vitest';
import { newGameState } from './newGameTestState';
import { ensureOpeningRite, applyOpeningRiteTurn, riteAcceptLabelForState } from './openingRite';
import { resolveOfferedChoices, commitOfferedPad } from './playTranscript';
import { visibleActionChips } from './fourSlotPads';
import type { GameState } from './types';

/** A System Integration game whose live page 1 is written and whose name is already Jax. */
function namedSiPageOne(over: Partial<GameState> = {}): GameState {
  const base = newGameState('system-integration', { seed: '7', liveOpening: true });
  return ensureOpeningRite({
    ...base,
    turn: 1,
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      ...base.openingEstablishment!,
      answers: { ...(base.openingEstablishment?.answers ?? {}), name: 'Jax' },
      pending: [],
      complete: true,
      sceneWritten: true,
    },
    log: [
      {
        id: 'g1',
        turn: 0,
        role: 'gm',
        content:
          'The sky splits over the street and a blue panel opens at eye level. Your planet has joined the System. Registration is waiting.',
        timestamp: 1,
      },
    ],
    ...over,
  } as GameState);
}

describe('PR43 — the open rite keeps both chips on a named SI start', () => {
  it('the ActionBar pad (resolveOfferedChoices) shows Register as Jax and Refuse to register', () => {
    const state = namedSiPageOne();
    const shown = visibleActionChips(resolveOfferedChoices(state));
    expect(shown).toContain('Register as Jax');
    expect(shown).toContain('Refuse to register');
    expect(shown.some((c) => /give your name/i.test(c))).toBe(false);
    // A scene pad the legality filter drops never costs a slot: LitRPG still shows four.
    expect(shown).toHaveLength(4);
  });

  it('a committed pad keeps both rite chips and four engine slots', () => {
    const state = namedSiPageOne({
      choices: ['Look around the street', 'Read the panel', 'Wait and listen', 'Search the area'],
    });
    const committed = commitOfferedPad(state);
    const pad = visibleActionChips(committed.offeredPad?.choices ?? []);
    expect(pad).toContain('Register as Jax');
    expect(pad).toContain('Refuse to register');
    expect(pad).toHaveLength(4);
    // Either chip from the committed pad completes the rite.
    expect(applyOpeningRiteTurn(committed, 'Register as Jax').state.openingRite?.done).toBe(true);
    expect(applyOpeningRiteTurn(committed, 'Refuse to register').state.openingRite?.done).toBe(true);
  });

  it('a name-ask clause drops out with a leading then: "and then register" → "Register as Jax"', () => {
    const state = namedSiPageOne();
    expect(riteAcceptLabelForState(state, 'Give your name and then register')).toBe('Register as Jax');
    expect(riteAcceptLabelForState(state, 'Give your name then register')).toBe('Register as Jax');
    expect(riteAcceptLabelForState(state, 'Give your name')).toBeNull();
    expect(riteAcceptLabelForState(state, 'Take the Ward oath')).toBe('Take the Ward oath');
  });
});
