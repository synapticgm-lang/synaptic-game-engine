import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  filterInventedContextChoices,
  isBarePcNameChoice,
} from './choiceWarden';
import { choiceNamesUnnarratedObject, isLegalEnginePad } from './choicePipeline';
import { isNoOpCheckSuccessLine, isNoisySystemLogLine } from './systemLog';

const BARREL_INDOOR =
  'Brine film on the flagstones. You slip near the barrels and a rack. A barrel tips — dark surge across the floor. The shouting in the room sharpens.';

describe('choiceWarden — PC name + bound chips (RC-K1)', () => {
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
  });

  it('drops unbound writer labels even when the story names the object (RC-K1)', () => {
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
        'Wait and listen carefully',
        'Inspect the crystals breaking the street',
        'Offer to Help with the barrels',
        'Rob the traveler',
      ],
      state
    );

    expect(filtered).not.toContain('Inspect the crystals breaking the street');
    expect(filtered).not.toContain('Offer to Help with the barrels');
    expect(filtered).not.toContain('Rob the traveler');
    // Wait wording binds to a builder Wait pad when one exists.
    if (isLegalEnginePad('Wait and listen carefully', state, BARREL_INDOOR)) {
      expect(filtered).toContain('Wait and listen carefully');
    }
  });

  it('keeps only chips that bind to a builder action', () => {
    const indoor = createInitialState('The Summoned Pact', 'litrpg');
    indoor.sceneFacts = {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: ['barrels', 'rack'],
      lastBeat: 'indoor',
      updatedTurn: 1,
      indoor: true,
    };
    indoor.log = [
      {
        id: 'g1',
        turn: 1,
        role: 'gm',
        content: BARREL_INDOOR,
        timestamp: Date.now(),
      },
    ];
    const filtered = filterInventedContextChoices(
      ['Inspect crystals on street', 'Wait and listen carefully', 'Ask what is going on'],
      indoor
    );
    expect(filtered).not.toContain('Inspect crystals on street');
  });
});

describe('systemLog — no-op check noise', () => {
  it('suppresses Perception SUCCESS with no mechanical changes', () => {
    const line = '[Perception check: SUCCESS – no mechanical changes]';
    expect(isNoOpCheckSuccessLine(line)).toBe(true);
    expect(isNoisySystemLogLine(line)).toBe(true);
  });
});
