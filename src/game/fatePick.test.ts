import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  actionBarSceneActions,
  fatePickPool,
  pickFateChoice,
  setupOwnsActionBar,
} from './fatePick';
import { finalSceneOptions, sceneOptionCount } from './finalOptions';
import {
  settleStatPoints,
  STAT_SYSTEM_CHOICE_CHIP,
  systemPromptPad,
} from './rules/abilityPoints';
import {
  applyCharacterClass,
  classChip,
  CLASS_QUICK_START_CHIP,
  classOfferPad,
} from './rules/characterClass';
import { clampSystemHousing } from './systemHousing';
import type { GameState } from './types';

const SCENE4 = ['Look around', 'Wait', 'Talk to the handler', 'Walk on'];

function litrpgOpened(over: Partial<GameState> = {}): GameState {
  const state = createInitialState('Fate setup', 'litrpg') as GameState;
  state.campaignBibleId = 'summoned-pact';
  // Level always-on housing so System pads are not silently blocked by leftover_pocket rolls.
  state.systemHousing = clampSystemHousing({
    housing: 'private_window',
    parts: { skills: true, quest_list: true, pocket: true, shop: true } as never,
  });
  state.openingEstablishment = {
    ...(state.openingEstablishment as GameState['openingEstablishment']),
    complete: true,
    pending: [],
    answers: { ...(state.openingEstablishment?.answers ?? {}) },
    sceneWritten: true,
  };
  state.turn = 5;
  state.activeEncounter = null;
  state.roundCombat = null;
  Object.assign(state, over);
  return state;
}

describe('fatePickPool — System setup when open', () => {
  it('returns systemPromptPad chips while a class offer is open, not the scene pad', () => {
    const state = litrpgOpened({
      classOffer: { turn: 5, choices: ['sorcerer', 'bard', 'fighter'] },
      character: {
        ...createInitialState('Fate setup', 'litrpg').character,
        level: 2,
        classId: undefined,
      },
    });

    const scene = [...SCENE4];
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

describe('ActionBar — System prompt is its own step', () => {
  it('stat points pending: rendered rows = System row only (no scene beside it)', () => {
    const state = litrpgOpened({
      classOffer: null,
      character: {
        ...createInitialState('Fate setup', 'litrpg').character,
        level: 2,
        classId: 'fighter',
        statAllocations: [],
      },
    });
    const system = systemPromptPad(state, classOfferPad(state));
    expect(system).not.toBeNull();
    expect(system!.chips).toContain(STAT_SYSTEM_CHOICE_CHIP);
    expect(setupOwnsActionBar(system!.chips, false)).toBe(true);
    expect(actionBarSceneActions(SCENE4, system!.chips, false)).toEqual([]);
    expect(fatePickPool([...SCENE4], system!.chips)).toEqual(system!.chips);
  });

  it('class offer pending: rendered rows = System row only (no scene beside it)', () => {
    const state = litrpgOpened({
      classOffer: { turn: 5, choices: ['cleric', 'rogue', 'wizard'] },
      character: {
        ...createInitialState('Fate setup', 'litrpg').character,
        level: 2,
        classId: undefined,
      },
    });
    const classPads = classOfferPad(state)!;
    const system = systemPromptPad(state, classPads);
    expect(system!.chips).toEqual(classPads);
    expect(setupOwnsActionBar(system!.chips, false)).toBe(true);
    expect(actionBarSceneActions(SCENE4, system!.chips, false)).toEqual([]);
    expect(fatePickPool([...SCENE4], system!.chips)).toEqual(classPads);
  });

  it('after a class pick: System step clears and scene row is exactly 4', () => {
    // Level 1 earns no free stat points, so clearing the class offer leaves no System step.
    const state = litrpgOpened({
      classOffer: { turn: 5, choices: ['cleric', 'rogue', 'wizard'] },
      character: {
        ...createInitialState('Fate setup', 'litrpg').character,
        level: 1,
        classId: undefined,
        statAllocations: [],
      },
      choices: [...SCENE4],
    });
    expect(systemPromptPad(state, classOfferPad(state))).not.toBeNull();

    const picked = applyCharacterClass(state, 'rogue').state;
    expect(picked.classOffer ?? null).toBeNull();
    expect(classOfferPad(picked)).toBeNull();
    const prompt = systemPromptPad(picked, classOfferPad(picked));
    expect(prompt).toBeNull();
    expect(setupOwnsActionBar(null, false)).toBe(false);

    const scene = finalSceneOptions(picked, [...SCENE4]);
    expect(scene).toHaveLength(sceneOptionCount('litrpg'));
    expect(actionBarSceneActions(scene, null, false)).toEqual(scene);
  });

  it('after spending waiting stat points: scene row of exactly 4', () => {
    const state = litrpgOpened({
      classOffer: null,
      character: {
        ...createInitialState('Fate setup', 'litrpg').character,
        level: 2,
        classId: 'fighter',
        statAllocations: [],
      },
      choices: [...SCENE4],
    });
    expect(systemPromptPad(state, classOfferPad(state))).not.toBeNull();
    const spent = settleStatPoints(state, STAT_SYSTEM_CHOICE_CHIP);
    expect(spent.settled).toBe(true);
    const prompt = systemPromptPad(spent.state, classOfferPad(spent.state));
    expect(prompt).toBeNull();
    const scene = finalSceneOptions(spent.state, [...SCENE4]);
    expect(scene).toHaveLength(4);
    expect(actionBarSceneActions(scene, null, false)).toEqual(scene);
  });
});
