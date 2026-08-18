import { describe, expect, it } from 'vitest';
import type { OpeningPrompt } from '@/data/campaigns/types';
import { createInitialState } from './defaults';
import {
  applyOpeningAnswer,
  establishmentChoices,
  isLocationishOpeningUtterance,
  isOpeningSetupChipLabel,
} from './openingEstablishment';
import type { GameState } from './types';

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
  it('does not dump location/Earth-city chips onto a name ask', () => {
    const chips = establishmentChoices(NAME_THEN_EARTH);
    const blob = chips.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/random place/);
    expect(blob).not.toMatch(/earth city/);
    expect(blob).not.toMatch(/city i actually know/);
    expect(blob).not.toMatch(/i was at home/);
    expect(chips.some((c) => /random designation/i.test(c))).toBe(true);
  });

  it('shows Earth-city chips only after the name cover is gone', () => {
    const chips = establishmentChoices(NAME_THEN_EARTH.slice(1));
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
});
