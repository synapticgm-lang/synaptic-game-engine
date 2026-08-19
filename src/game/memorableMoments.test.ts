import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createInitialState } from './defaults';
import {
  decideClassicMemorable,
  memorableBypassesWeeklyCap,
  memorableLogFields,
  openingSplashStillDue,
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

  it('still treats cover-complete as the opener if the splash never fired', () => {
    const input = openingInput(true);
    expect(input.isOpeningSceneTurn).toBe(true);
    const decision = decideClassicMemorable(input, false);
    expect(decision.beat).toBe('opening');
    expect(decision.request).toBeTruthy();
  });
});
