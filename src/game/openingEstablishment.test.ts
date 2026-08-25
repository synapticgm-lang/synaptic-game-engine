import { describe, expect, it } from 'vitest';
import type { OpeningPrompt } from '@/data/campaigns/types';
import { createInitialState } from './defaults';
import {
  applyHarvestedOpeningCovers,
  applyOpeningAnswer,
  establishmentChoices,
  harvestEarthOriginFromProse,
  isLocationishOpeningUtterance,
  isOpeningSetupChipLabel,
  mergePreferredProfileIntoOpening,
  openingAnswerDisplay,
  resolveLockedOpeningPlace,
  seedCoverAnswers,
} from './openingEstablishment';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState } from './types';
import { materializeWornClothes } from './wornGear';

const NAME_THEN_EARTH: OpeningPrompt[] = [
  { id: 'name', kind: 'name', question: 'A name. What do we call you?' },
  {
    id: 'where',
    kind: 'location',
    question: 'Origin lock. Name the Earth place you were in when the light took you.',
    suggestions: ['A city I actually know', 'Random Earth city', 'I was at home'],
  },
];

function summonedNameCover(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: NAME_THEN_EARTH,
      answers: {},
      complete: false,
      registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light, then stone.' },
      sceneWritten: true,
      mode: 'weave',
    },
  };
}

describe('establishmentChoices — current cover only', () => {
  const fast = { fastSetupChips: true } as import('./types').Settings;

  it('default (fastSetupChips off) returns no chips', () => {
    expect(establishmentChoices(NAME_THEN_EARTH)).toEqual([]);
    expect(establishmentChoices(NAME_THEN_EARTH, undefined, { fastSetupChips: false } as import('./types').Settings)).toEqual([]);
  });

  it('does not dump location/Earth-city chips onto a name ask', () => {
    const chips = establishmentChoices(NAME_THEN_EARTH, undefined, fast);
    const blob = chips.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/random place/);
    expect(blob).not.toMatch(/earth city/);
    expect(blob).not.toMatch(/city i actually know/);
    expect(blob).not.toMatch(/i was at home/);
    expect(chips.some((c) => /random designation/i.test(c))).toBe(true);
  });

  it('shows Earth-city chips only after the name cover is gone', () => {
    const chips = establishmentChoices(NAME_THEN_EARTH.slice(1), undefined, fast);
    const blob = chips.join(' | ').toLowerCase();
    expect(blob).toMatch(/earth city|random place/);
    expect(blob).not.toMatch(/designation/);
  });
});

describe('opening utterance — name cover vs location-talk', () => {
  it.each(['somewhere on earth', 'on earth', 'a city I actually know'])(
    'does not save %s as character.name',
    async (input) => {
      expect(isLocationishOpeningUtterance(input)).toBe(true);
      const { state } = await applyOpeningAnswer(summonedNameCover(), input);
      expect(state.character.name.toLowerCase()).not.toMatch(/somewhere|on earth|city i actually know|random earth/);
      expect(state.character.name).toBe('Unknown Survivor');
      expect(state.openingEstablishment?.pending[0]?.kind).toBe('name');
    }
  );

  it('does not treat Random Earth city as spoken name copy', () => {
    expect(isOpeningSetupChipLabel('Random Earth city')).toBe(true);
    expect(isOpeningSetupChipLabel('somewhere on earth')).toBe(false);
  });

  it('still accepts a real given name on the name cover', async () => {
    const { state } = await applyOpeningAnswer(summonedNameCover(), 'Sam');
    expect(state.character.name).toBe('Sam');
  });

  it('name + who/where acknowledges Jax and never re-asks for a name', async () => {
    const { state } = await applyOpeningAnswer(
      summonedNameCover(),
      'my name is Jax who are you where am i'
    );
    expect(state.character.name).toBe('Jax');
    const gm = [...state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    expect(gm).toMatch(/Jax/i);
    expect(gm).not.toMatch(/They want a name/i);
    expect(gm).toMatch(/Earth|summon/i);
    expect(gm).toMatch(/where|circle|floor|here/i);
  });
});

describe('harvest Earth origin from opening prose', () => {
  it('locks apartment origin and drops Earth-city chips', () => {
    const prose =
      'The cold stone of the Sevenfold Circle is a stark contrast to the last place Jax remembered: his small apartment in a bustling city.';
    expect(harvestEarthOriginFromProse(prose)?.toLowerCase()).toMatch(/apartment/);
    const next = applyHarvestedOpeningCovers(
      {
        pending: NAME_THEN_EARTH.slice(1),
        answers: {},
        complete: false,
        registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light, then stone.' },
        sceneWritten: true,
        mode: 'weave',
      },
      prose
    );
    expect(next.pending.some((p) => p.kind === 'location')).toBe(false);
    expect(establishmentChoices(next.pending, undefined, { fastSetupChips: true } as import('./types').Settings).join(' ')).not.toMatch(/Earth city|I was at home/i);
  });
});

describe('mergePreferredProfileIntoOpening', () => {
  it('skips name cover when profile has preferredName', () => {
    const state = summonedNameCover();
    const { state: next, applied } = mergePreferredProfileIntoOpening(state, {
      preferredName: 'John',
      preferredGender: '',
      updatedAt: 0,
      storiesStarted: 0,
      plateEvents: [],
      metaBadges: [],
    });
    expect(applied).toBe(true);
    expect(next.character.name).toBe('John');
    expect(next.openingEstablishment?.pending[0]?.kind).toBe('location');
    expect(next.openingEstablishment?.answers?.name).toBe('John');
  });
});

describe('opening player bubbles', () => {
  it('maps setup chips to locked canon in display text', () => {
    expect(openingAnswerDisplay('Random Earth city', 'Peterborough UK')).toBe('Peterborough UK');
    expect(openingAnswerDisplay('Travel clothes', 'Travel clothes')).toBe('Travel clothes');
  });

  it('logs resolved Earth place when Random Earth city chip is used', async () => {
    let state = (await applyOpeningAnswer(summonedNameCover(), 'Sam')).state;
    state = (await applyOpeningAnswer(state, 'Random Earth city')).state;
    const playerLines = state.log.filter((e) => e.role === 'player').map((e) => e.content);
    expect(playerLines).toContain('Sam');
    expect(playerLines.some((l) => /peterborough|manchester|leeds|birmingham|sheffield|london/i.test(l))).toBe(
      true
    );
  });

  it('defers in-world questions to play while covers remain after sceneWritten', async () => {
    const state = {
      ...summonedNameCover(),
      openingEstablishment: {
        ...summonedNameCover().openingEstablishment!,
        pending: [
          {
            id: 'wear',
            kind: 'appearance' as const,
            question: 'You look down. What are you wearing?',
          },
        ],
        sceneWritten: true,
      },
    };
    const result = await applyOpeningAnswer(
      state,
      "what's going on? what do you mean the mark is wrong"
    );
    expect(result.deferToPlay).toBe(true);
    expect(result.generateOpening).toBe(false);
  });

  it('seals kit cover instead of blocking with a questionnaire', async () => {
    const state = {
      ...summonedNameCover(),
      openingEstablishment: {
        ...summonedNameCover().openingEstablishment!,
        pending: [
          {
            id: 'pockets',
            kind: 'kit' as const,
            question: 'Pat yourself down. What is really on you?',
          },
        ],
        sceneWritten: true,
      },
    };
    const result = await applyOpeningAnswer(state, 'look around');
    expect(result.generateOpening).toBe(true);
    expect(result.state.openingEstablishment?.complete).toBe(true);
    expect(result.state.inventory.some((i) => /^bag$/i.test(i.name))).toBe(true);
  });
});

describe('opening place lock — card vs bible startingLocation', () => {
  it('does not seed Sevenfold Circle when a hook card place exists', () => {
    const answers = seedCoverAnswers(
      summonedPact,
      createInitialState('x', 'litrpg').character,
      'Pellane war camp beyond Valespire walls'
    );
    expect(answers.where).toMatch(/war camp/i);
    expect(answers.where).not.toMatch(/Sevenfold/i);
  });

  it('keeps war-camp currentLocation when answers still hold cathedral default', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state: GameState = {
      ...base,
      campaignBibleId: 'summoned-pact',
      seed: 'war-camp-seed',
      currentLocation: 'Pellane war camp beyond Valespire walls',
      openingEstablishment: {
        pending: [],
        answers: { where: 'The Sevenfold Circle under Valespire Cathedral' },
        complete: true,
        registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: true,
        mode: 'weave',
        pickedHookFallback:
          'Light, then mud. You are on your back in a war-camp circle outside Valespire’s walls.',
      },
    };
    const locked = resolveLockedOpeningPlace(state, {
      where: 'The Sevenfold Circle under Valespire Cathedral',
    });
    expect(locked).toMatch(/war camp/i);
    expect(locked).not.toMatch(/Sevenfold/i);
  });
});

describe('opening kit vs clothes', () => {
  it('does not glue bag kit onto street-clothes chest name', () => {
    const look = 'everyday street clothes a bag with everyday stuff';
    const inv = materializeWornClothes([], look);
    const chest = inv.find((i) => i.slot === 'Chest' || i.slot === 'Body');
    expect(chest?.name ?? '').not.toMatch(/bag/i);
    expect(inv.some((i) => /bag/i.test(i.name))).toBe(true);
  });
});
