import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  choiceInventsContext,
  filterInventedContextChoices,
  isBarePcNameChoice,
} from './choiceWarden';
import { isNoOpCheckSuccessLine, isNoisySystemLogLine } from './systemLog';

describe('choiceWarden — PC name + invented chores', () => {
  it('strips bare PC name choices', () => {
    expect(isBarePcNameChoice('Jax', 'Jax')).toBe(true);
    expect(isBarePcNameChoice('Ask Jax about work', 'Jax')).toBe(false);

    const state = createInitialState('The Summoned Pact', 'litrpg');
    state.character = { ...state.character, name: 'Jax' };
    state.log = [
      {
        id: 'g1',
        turn: 1,
        role: 'gm',
        content: 'The registrar waits for your answer.',
        timestamp: Date.now(),
      },
    ];
    const filtered = filterInventedContextChoices(
      ['Jax', 'Get your bearings', 'Ask the registrar for directions'],
      state
    );
    expect(filtered).not.toContain('Jax');
    expect(filtered.some((c) => /registrar/i.test(c))).toBe(true);
  });

  it('filters barrel chores not grounded in story or props', () => {
    expect(
      choiceInventsContext('Offer to Help with the barrels', 'Stone floor. Registrar waits.', '')
    ).toBe(true);
    expect(
      choiceInventsContext(
        'Offer to Help with the barrels',
        'Handlers stack barrels by the gate.',
        ''
      )
    ).toBe(false);
    expect(
      choiceInventsContext('Offer to Help with the barrels', 'Quiet street.', 'oak barrels')
    ).toBe(false);
  });
});

describe('systemLog — no-op check noise', () => {
  it('suppresses Perception SUCCESS with no mechanical changes', () => {
    const line = '[Perception check: SUCCESS – no mechanical changes]';
    expect(isNoOpCheckSuccessLine(line)).toBe(true);
    expect(isNoisySystemLogLine(line)).toBe(true);
  });
});
