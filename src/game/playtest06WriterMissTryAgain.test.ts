/**
 * Brief 06 slice 3 — writer miss on a story turn shows honest Try again;
 * no canned last-resort painters; Try again re-sends the same act.
 * Review follow-up: all three drivers (useGame / liveDrive / fate) use one owner.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  bookBodyAfterWriterMiss,
  buildCompletedEventPacket,
  ledgerActionStitch,
  pageWhenClauseWithheld,
} from './completedEventPacket';
import { createInitialState } from './defaults';
import {
  buildFailedStorytellerPage,
  isStorytellerRetryChip,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
} from './liveOpening';
import { emptySceneFacts } from './sceneFacts';
import type { GameState, Settings } from './types';
import { mulberry32 } from './fatePick';

vi.mock('./aiService', () => ({
  callGm: vi.fn(async () => ({ text: '', systemLog: [], failKind: 'empty' as const, transportRetries: 0 })),
  callGmCheck: vi.fn(async () => ({})),
  callGmRepair: vi.fn(async () => ({ text: '' })),
}));

function storyState(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 3,
    currentLocation: 'Greyhollow Inn',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Greyhollow Inn', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
    },
    sceneFacts: emptySceneFacts(3),
    choices: ['Look around', 'Ask what they want', 'Wait', 'Who are you'],
    offeredPad: {
      turn: 3,
      choices: ['Look around', 'Ask what they want', 'Wait', 'Who are you'],
      chips: ['Look around', 'Ask what they want', 'Wait', 'Who are you'].map((label) => ({
        label,
        actionId: `act:${label}`,
        kind: 'scene',
      })),
    },
    log: [
      {
        id: 'g0',
        turn: 0,
        role: 'gm',
        content: 'Ash hung in the rafters of Greyhollow Inn. A handler waited by the bar.',
        timestamp: 0,
      },
    ],
    ...over,
  };
}

describe('brief 06 slice 3 — writer miss → honest Try again', () => {
  it('pageWhenClauseWithheld / ledgerActionStitch / bookBodyAfterWriterMiss paint no canned miss prose', () => {
    const state = storyState();
    const packet = buildCompletedEventPacket(state, 'Look around');
    expect(pageWhenClauseWithheld(state, packet, 'Look around')).toBe('');
    expect(ledgerActionStitch(state, 'Look around')).toBe('');
    expect(bookBodyAfterWriterMiss(state, packet, 'Look around', '').prose).toBe('');
  });

  it('writer miss page is STORYTELLER_RETRY_MESSAGE with one Try again chip and no turn advance', () => {
    const prior = storyState({ turn: 3 });
    const page = buildFailedStorytellerPage(prior, { pendingAct: 'Look around' });
    expect(page.prose).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(page.offeredChoices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(page.state.choices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(page.state.turn).toBe(3);
    expect(page.state.pendingWriterRetry).toEqual({ act: 'Look around' });
    expect(page.state.openingEstablishment?.sceneWritten).toBe(true);
    const lastGm = [...(page.state.log ?? [])].reverse().find((e) => e.role === 'gm');
    expect(lastGm?.content).toBe(STORYTELLER_RETRY_MESSAGE);
  });

  it('Try again chip re-sends the same pending act (no automatic retry)', () => {
    const prior = storyState({ turn: 3 });
    const page = buildFailedStorytellerPage(prior, { pendingAct: 'Ask what they want' });
    expect(isStorytellerRetryChip(STORYTELLER_RETRY_CHIP)).toBe(true);
    expect(page.state.pendingWriterRetry?.act).toBe('Ask what they want');
    const act = page.state.pendingWriterRetry!.act;
    expect(act).toBe('Ask what they want');
    expect(isStorytellerRetryChip(act)).toBe(false);
  });

  it('opening miss still uses the same failed-page owner', () => {
    const opening = storyState({
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        sceneWritten: false,
        mode: 'weave',
      },
    });
    const page = buildFailedStorytellerPage(opening);
    expect(page.prose).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(page.offeredChoices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(page.state.openingEstablishment?.sceneWritten).toBe(false);
    expect(page.state.pendingGeneratedOpening).toBe(true);
    expect(page.state.pendingWriterRetry).toBeNull();
  });

  it('fateAutoplay writer miss yields Try again page and no state advance', async () => {
    const { headlessFateTurn } = await import('./fateAutoplay');
    const prior = storyState({ turn: 3 });
    const settings = {
      subscriptionTier: 'free',
      contentMode: 'adult',
    } as Settings;
    const result = await headlessFateTurn(prior, settings, mulberry32(42), {
      bibleId: 'summoned-pact',
      personalityId: 'cold-registrar',
      seed: 42,
      mode: 'first-pad',
      aiAgentMode: 'storyfollower',
      dryRun: false,
      playerInputOverride: 'Look around',
    });
    expect(result.state.turn).toBe(3);
    expect(result.state.pendingWriterRetry?.act).toBe('Look around');
    expect(result.telemetry.gmText).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(result.telemetry.offeredChoices).toEqual([STORYTELLER_RETRY_CHIP]);
    const lastGm = [...(result.state.log ?? [])].reverse().find((e) => e.role === 'gm');
    expect(lastGm?.content).toBe(STORYTELLER_RETRY_MESSAGE);
  });
});
