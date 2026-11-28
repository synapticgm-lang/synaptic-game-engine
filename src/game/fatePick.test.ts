import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { fatePickPool, pickFateChoice } from './fatePick';
import { systemPromptPad } from './rules/abilityPoints';
import { classChip, CLASS_QUICK_START_CHIP, classOfferPad } from './rules/characterClass';
import type { GameState } from './types';

describe('fatePickPool — System setup when open', () => {
  it('returns systemPromptPad chips while a class offer is open, not the scene pad', () => {
    const state = createInitialState('Fate setup', 'litrpg') as GameState;
    state.campaignBibleId = 'summoned-pact';
    state.openingEstablishment = {
      ...(state.openingEstablishment as GameState['openingEstablishment']),
      complete: true,
      pending: [],
      answers: { ...(state.openingEstablishment?.answers ?? {}) },
      sceneWritten: true,
    };
    state.turn = 5;
    state.classOffer = { turn: 5, choices: ['sorcerer', 'bard', 'fighter'] };
    state.character = {
      ...state.character,
      level: 2,
      classId: undefined,
    };

    const scene = ['Look around', 'Wait', 'Talk to the handler', 'Walk on'];
    const system = systemPromptPad(state, classOfferPad(state));
    const pool = fatePickPool(scene, system?.chips);
    expect(system?.chips).toEqual([
      classChip('sorcerer'),
      classChip('bard'),
      classChip('fighter'),
      CLASS_QUICK_START_CHIP,
    ]);
    expect(pool).toEqual(system!.chips);
    expect(pool.some((c) => scene.includes(c))).toBe(false);
    expect(pickFateChoice(pool, () => 0)).toBe(classChip('sorcerer'));
  });

  it('returns the scene pad when no System setup chips are passed', () => {
    const scene = ['Look around', 'Wait'];
    expect(fatePickPool(scene, null)).toEqual(scene);
    expect(fatePickPool(scene, [])).toEqual(scene);
    expect(fatePickPool(scene)).toEqual(scene);
  });
});
