import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { finalSceneOptions, isSetupOption, sceneOptionCount, setupOptionLabels } from './finalOptions';
import { excludedPadFamilies, isLeaveFamilyPad, isTravelPad } from './padUniverse';
import { emptySceneFacts } from './sceneFacts';
import { CLASS_QUICK_START_CHIP, classChip } from './rules/characterClass';
import { STAT_SYSTEM_CHOICE_CHIP, statChip } from './rules/abilityPoints';
import { beginTabletopCreation, creationChips, tabletopCreationPending } from './tabletop/creationFlow';
import { resolveOfferedChoices } from './playTranscript';
import { normalizeSearchTarget } from './searchContinuity';
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

  it('short-pad refill never reintroduces an excluded family (Travel/Leave)', () => {
    const state = createInitialState(undefined, 'litrpg');
    Object.assign(state, {
      openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
      currentLocation: 'West Wall',
      campaignBibleId: 'summoned-pact',
      turn: 43,
      log: [
        { id: 'a', role: 'player', content: 'Travel toward Lowmarket', timestamp: 1 },
        { id: 'b', role: 'gm', content: 'You reach Lowmarket.', timestamp: 2 },
        { id: 'c', role: 'player', content: 'Talk to Lowmarket Fence', timestamp: 3 },
        { id: 'd', role: 'gm', content: 'The fence waits.', timestamp: 4 },
        { id: 'e', role: 'player', content: 'Travel toward West Wall', timestamp: 5 },
        { id: 'f', role: 'gm', content: 'You reach West Wall.', timestamp: 6 },
      ],
      sceneFacts: { ...emptySceneFacts(43), present: ['Wall Sergeant'] },
      discoveredLocations: ['sp-hub-lowmarket', 'sp-hub-west-wall'],
    });
    expect(excludedPadFamilies(state).has('travel')).toBe(true);

    // Short sealed candidates force refill from journey/affordances.
    const scene = finalSceneOptions(state, ['Ask about the rain']);
    expect(scene.length).toBeGreaterThan(0);
    expect(scene.some((c) => isTravelPad(c))).toBe(false);
    expect(scene.some((c) => isLeaveFamilyPad(c))).toBe(false);
  });

  it('tabletop creation pending: offered row is creation chips only (session-zero)', () => {
    const state = beginTabletopCreation(base('dnd'));
    expect(tabletopCreationPending(state)).toBe(true);
    const expected = creationChips(state);
    expect(expected.length).toBeGreaterThan(0);
    // Scene-looking candidates must not win: resolveOfferedChoices owns session-zero.
    state.choices = ['Talk to Edda Crane', 'Travel toward Greyhollow Inn', 'Search the area'];
    state.offeredPad = {
      turn: state.turn ?? 0,
      choices: state.choices,
      chips: state.choices.map((label) => ({ label, actionId: `label:${label.toLowerCase()}`, kind: 'compiled' as const })),
    };
    const offered = resolveOfferedChoices(state);
    expect(offered).toEqual(expected);
    for (const label of offered) {
      expect(expected).toContain(label);
    }
  });

  it('LitRPG class offer pending: scene row exactly 4 when affordances are exhausted', () => {
    const state = base('litrpg');
    state.character = { ...state.character, classId: undefined, name: 'Jax', level: 1 };
    state.classOffer = { turn: state.turn ?? 5, choices: ['cleric', 'bard', 'druid'] };
    const place = state.currentLocation!;
    const searchKey = normalizeSearchTarget('Search the area', place);
    state.sceneFacts = { ...emptySceneFacts(state.turn ?? 5), present: [], searchedEmpty: [searchKey] };
    state.discoveredLocations = ['sp-hub-lowmarket', 'sp-hub-west-wall'];
    state.log = [
      { id: 'a', turn: 1, role: 'player', content: 'Travel toward Lowmarket', timestamp: 1 },
      { id: 'b', turn: 1, role: 'gm', content: 'You reach Lowmarket.', timestamp: 2 },
      { id: 'c', turn: 2, role: 'player', content: `Travel toward ${place}`, timestamp: 3 },
      { id: 'd', turn: 2, role: 'gm', content: `You reach ${place}.`, timestamp: 4 },
      { id: 'e', turn: 3, role: 'player', content: 'Travel toward Lowmarket', timestamp: 5 },
      { id: 'f', turn: 3, role: 'gm', content: 'Back.', timestamp: 6 },
    ];
    const setup = [
      classChip('cleric'),
      classChip('bard'),
      classChip('druid'),
      CLASS_QUICK_START_CHIP,
    ];
    const shortScene = [
      'Travel toward Lowmarket',
      'Find a way out',
      'Pursue First Read at Morrowleigh Hollow',
    ];
    const mixed = [...setup, ...shortScene];
    state.choices = mixed;
    state.offeredPad = {
      turn: state.turn ?? 5,
      choices: mixed,
      chips: mixed.map((label) => ({ label, actionId: `label:${label.toLowerCase()}`, kind: 'compiled' as const })),
    };

    const scene = finalSceneOptions(state, mixed);
    expect(scene).toHaveLength(4);
    for (const label of scene) {
      expect(isSetupOption(state, label), label).toBe(false);
    }
    const offered = resolveOfferedChoices(state);
    expect(offered).toHaveLength(4);
    for (const label of offered) {
      expect(isSetupOption(state, label), label).toBe(false);
    }
    // Membership: every offered scene label is either a non-setup candidate or a closed-universe refill.
    const sceneCandidates = new Set(shortScene.map((c) => c.toLowerCase()));
    expect(offered.filter((c) => sceneCandidates.has(c.toLowerCase())).length).toBeGreaterThan(0);
  });
});
