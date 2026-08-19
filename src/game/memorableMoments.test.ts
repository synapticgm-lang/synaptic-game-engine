import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createInitialState } from './defaults';
import {
  decideClassicMemorable,
  memorableBypassesWeeklyCap,
  memorableLogFields,
  openingSplashStillDue,
  pinOpeningHereScene,
} from './memorableMoments';

const CATHEDRAL =
  'Light, then stone. The Sevenfold Circle waits under a cathedral vault while the summons settles.';

function openingInput(sceneWritten = false) {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  return {
    settings: {
      ...createDefaultSettings(),
      visualMode: 'classic' as const,
      classicMemorableImages: true,
      contentMode: 'adult' as const,
    },
    state: {
      ...state,
      currentLocation: 'the cathedral',
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: sceneWritten,
        sceneWritten,
        mode: 'weave' as const,
      },
    },
    turn: 1,
    storyText: CATHEDRAL,
    writerTag: null,
    events: [],
    lootVideo: null,
    isOpeningSceneTurn: !sceneWritten || openingSplashStillDue(state),
    characterHp: 24,
    characterConditions: [] as string[],
    gainedItems: [],
  };
}

describe('Chapter One opener vs weekly cap', () => {
  it('still queues the cathedral splash when memorable cap is exhausted', () => {
    const decision = decideClassicMemorable(openingInput(false), false);
    expect(decision.beat).toBe('opening');
    expect(decision.request?.imagePrompt).toBeTruthy();
    expect(decision.skippedForCapacity).toBeFalsy();
    expect(memorableBypassesWeeklyCap(decision.beat)).toBe(true);
    const fields = memorableLogFields(decision);
    expect(fields.entryKind).toBe('milestone');
    expect(fields.splashTitle).toBe('Chapter One');
    expect(fields.splashImagePrompt).toBeTruthy();
    expect(fields.imageStatus).toBe('pending');
  });

  it('pins Chapter One art to the floor beat and strips the Earth-origin ask', () => {
    const originAsk =
      'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault. '
      + 'The stone is cold under your back. Before the light took you — which Earth place were you in? A city, a street, a home.';
    const prompt = pinOpeningHereScene({
      storyText: originAsk,
      location: 'The Sevenfold Circle under Valespire Cathedral',
      pickedHook:
        'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault.',
    });
    expect(prompt).toMatch(/lying on the floor/i);
    expect(prompt).toMatch(/Sevenfold Circle/i);
    expect(prompt).not.toMatch(/which Earth place/i);
    expect(prompt).toMatch(/not a manga page of Earth daily life/i);
    expect(prompt).toMatch(/not an open book/i);
    expect(prompt).toMatch(/an adult \(18 or older\)/i);
    expect(prompt).not.toMatch(/VIEWPOINT CHARACTER: a child/i);
  });

  it('draws a child only when the look or sheet names one', () => {
    const adult = pinOpeningHereScene({
      storyText: 'Light, then cold stone. You are on your back inside a seven-ring summoning circle.',
      location: 'The Sevenfold Circle',
      characterLook: 'gray hoodie, blue jeans',
    });
    expect(adult).toMatch(/LOOK: gray hoodie, blue jeans/i);
    expect(adult).toMatch(/an adult \(18 or older\)/i);

    const child = pinOpeningHereScene({
      storyText: 'Light, then cold stone. You are on your back inside a seven-ring summoning circle.',
      location: 'The Sevenfold Circle',
      characterLook: 'a child in a gray hoodie',
    });
    expect(child).toMatch(/a child as the look/i);
    expect(child).not.toMatch(/an adult \(18 or older\)/i);
  });

  it('still treats cover-complete as the opener if the splash never fired', () => {
    const input = openingInput(true);
    expect(input.isOpeningSceneTurn).toBe(true);
    const decision = decideClassicMemorable(input, false);
    expect(decision.beat).toBe('opening');
    expect(decision.request).toBeTruthy();
  });
});
