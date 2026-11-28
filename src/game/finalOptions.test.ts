import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { finalSceneOptions, isSetupOption, sceneOptionCount, setupOptionLabels } from './finalOptions';
import { CLASS_QUICK_START_CHIP, classChip } from './rules/characterClass';
import { STAT_SYSTEM_CHOICE_CHIP, statChip } from './rules/abilityPoints';
import type { AttributeKey, EngineMode, GameState } from './types';

function base(mode: EngineMode): GameState {
  const s = createInitialState('Pad count check', mode);
  s.campaignBibleId = mode === 'dnd' ? 'cursed-keep' : mode === 'rpg' ? 'salt-road-heist' : 'summoned-pact';
  s.openingEstablishment = {
    ...(s.openingEstablishment as GameState['openingEstablishment']),
    complete: true,
    pending: [],
    answers: { ...(s.openingEstablishment?.answers ?? {}) },
    sceneWritten: true,
  };
  s.turn = 5;
  s.currentLocation = mode === 'dnd' ? 'Greyhollow Inn' : 'Idraridge Hollow';
  return s;
}

describe('finalOptions — exact 4/4/3 scene pad, setup excluded', () => {
  it('sceneOptionCount is 4 LitRPG / 4 RPG / 3 tabletop', () => {
    expect(sceneOptionCount('litrpg')).toBe(4);
    expect(sceneOptionCount('rpg')).toBe(4);
    expect(sceneOptionCount('dnd')).toBe(3);
  });

  it.each<[EngineMode, number]>([
    ['litrpg', 4],
    ['rpg', 4],
    ['dnd', 3],
  ])('%s: mixed setup chips + short road pad → exactly %i scene options, no setup', (mode, n) => {
    const state = base(mode);
    if (mode === 'litrpg') {
      state.classOffer = { turn: state.turn ?? 5, choices: ['sorcerer', 'bard', 'fighter'] };
      state.character = {
        ...state.character,
        level: 2,
        classId: undefined,
        attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      };
    }

    const setupish =
      mode === 'litrpg'
        ? [
            ...(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AttributeKey[]).map(statChip),
            STAT_SYSTEM_CHOICE_CHIP,
            classChip('sorcerer'),
            classChip('bard'),
            classChip('fighter'),
            CLASS_QUICK_START_CHIP,
          ]
        : [];
    const shortRoad = ['Walk on', 'Turn back toward Idraridge Hollow'];
    const mixed = [...setupish, ...shortRoad, 'Wait and listen', 'Look around'];

    const scene = finalSceneOptions(state, mixed);
    expect(scene).toHaveLength(n);
    for (const label of scene) {
      expect(isSetupOption(state, label), label).toBe(false);
    }

    // Membership: scene pad comes from the non-setup candidates (order preserved), not phrase matching.
    const sceneCandidates = mixed.filter((c) => !isSetupOption(state, c));
    expect(scene).toEqual(sceneCandidates.slice(0, n));

    const setup = setupOptionLabels(state);
    for (const label of setupish) {
      if (setup.has(label.toLowerCase())) {
        expect(scene.map((c) => c.toLowerCase())).not.toContain(label.toLowerCase());
      }
    }
  });
});
