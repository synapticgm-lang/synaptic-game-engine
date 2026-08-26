import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  choiceInventsContext,
  filterInventedContextChoices,
  isBarePcNameChoice,
} from './choiceWarden';
import { choiceNamesUnnarratedObject } from './choicePipeline';
import { isNoOpCheckSuccessLine, isNoisySystemLogLine } from './systemLog';

const BARREL_INDOOR =
  'Brine film on the flagstones. You slip near the barrels and a rack. A barrel tips — dark surge across the floor. The shouting in the room sharpens.';

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

  it('rejects invented crystals/street when last story is barrels indoors', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    state.sceneFacts = {
      crowd: 'sparse',
      noise: 'shouting',
      present: [],
      props: ['barrels', 'rack', 'flagstones'],
      lastBeat: 'barrel spill',
      updatedTurn: 2,
      indoor: true,
    };
    state.log = [
      {
        id: 'g-old',
        turn: 1,
        role: 'gm',
        content: 'Crystals crack the street outside the guild.',
        timestamp: Date.now() - 1000,
      },
      {
        id: 'g-now',
        turn: 2,
        role: 'gm',
        content: BARREL_INDOOR,
        timestamp: Date.now(),
      },
    ];

    expect(
      choiceNamesUnnarratedObject(
        'Inspect the crystals breaking the street',
        BARREL_INDOOR,
        state
      )
    ).toBe(true);

    const filtered = filterInventedContextChoices(
      [
        'Ask what is going on',
        'Wait and listen carefully',
        'Inspect the crystals breaking the street',
        'Inspect the barrels',
        'Offer handlers honest help',
      ],
      state
    );

    expect(filtered).not.toContain('Inspect the crystals breaking the street');
    expect(filtered).toContain('Ask what is going on');
    expect(filtered).toContain('Wait and listen carefully');
    expect(filtered).toContain('Inspect the barrels');
  });

  it('keeps crystal inspect when last story names crystals', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    const story = 'Violet crystals break through the cobbled street.';
    state.sceneFacts = {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: ['crystals', 'street'],
      lastBeat: 'street crystals',
      updatedTurn: 1,
      indoor: false,
    };
    state.log = [
      {
        id: 'g1',
        turn: 1,
        role: 'gm',
        content: story,
        timestamp: Date.now(),
      },
    ];
    const filtered = filterInventedContextChoices(
      ['Inspect the crystals breaking the street', 'Wait and listen carefully'],
      state
    );
    expect(filtered).toContain('Inspect the crystals breaking the street');
    expect(filtered).toContain('Wait and listen carefully');
  });
});

describe('systemLog — no-op check noise', () => {
  it('suppresses Perception SUCCESS with no mechanical changes', () => {
    const line = '[Perception check: SUCCESS – no mechanical changes]';
    expect(isNoOpCheckSuccessLine(line)).toBe(true);
    expect(isNoisySystemLogLine(line)).toBe(true);
  });
});
