/**
 * Live fault after #82 (RPG salt-road-heist T2): writer-miss page painted
 * Try again padded beside 3 scene options. Miss page must own the bar alone.
 */
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import {
  actionBarSceneActions,
  fatePickPool,
  setupOwnsActionBar,
} from './fatePick';
import { finalSceneOptions, sceneOptionCount } from './finalOptions';
import {
  buildFailedStorytellerPage,
  failedOpeningPads,
  isStorytellerRetryPage,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
} from './liveOpening';
import { resolveOfferedChoices } from './playTranscript';
import { emptySceneFacts } from './sceneFacts';
import type { EngineMode, GameState, Settings } from './types';
import { mulberry32 } from './fatePick';

vi.mock('./aiService', () => ({
  callGm: vi.fn(async () => ({ text: '', systemLog: [], failKind: 'empty' as const, transportRetries: 0 })),
  callGmCheck: vi.fn(async () => ({})),
  callGmRepair: vi.fn(async () => ({ text: '' })),
}));

const SCENE4 = [
  'Talk to Piers Barrow',
  'Get your bearings in Yarrowfen Loft',
  'Travel toward Salt Road Waystation',
  'Look around',
];

function rpgStoryState(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('Salt Road Heist', 'rpg');
  return {
    ...base,
    campaignBibleId: 'salt-road-heist',
    engineMode: 'rpg',
    turn: 2,
    currentLocation: 'Yarrowfen Loft',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Yarrowfen Loft', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
    },
    sceneFacts: {
      ...emptySceneFacts(2),
      present: ['Piers Barrow'],
    },
    choices: [...SCENE4],
    offeredPad: {
      turn: 2,
      choices: [...SCENE4],
      chips: SCENE4.map((label) => ({
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
        content: 'Piers Barrow waited in Yarrowfen Loft with the charter still warm from the press.',
        timestamp: 0,
      },
    ],
    ...over,
  };
}

describe('writer-miss page offers only Try again (not padded beside scene options)', () => {
  it('buildFailedStorytellerPage + resolveOfferedChoices + finalSceneOptions are exactly [Try again]', () => {
    const prior = rpgStoryState();
    const page = buildFailedStorytellerPage(prior, { pendingAct: 'Ask Piers what he wants' });
    expect(page.prose).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(page.offeredChoices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(isStorytellerRetryPage(page.state)).toBe(true);
    expect(resolveOfferedChoices(page.state)).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(finalSceneOptions(page.state, [...SCENE4, STORYTELLER_RETRY_CHIP])).toEqual([
      STORYTELLER_RETRY_CHIP,
    ]);
    expect(setupOwnsActionBar(null, false, true)).toBe(true);
    expect(actionBarSceneActions(SCENE4, null, false, undefined, true)).toEqual([...SCENE4]);
    expect(
      actionBarSceneActions(failedOpeningPads, null, false, undefined, true)
    ).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(fatePickPool([...SCENE4], null, true)).toEqual([...SCENE4]);
    expect(fatePickPool(failedOpeningPads, null, true)).toEqual([STORYTELLER_RETRY_CHIP]);
  });

  it('Try again re-sends the same pending act (no automatic retry)', () => {
    const page = buildFailedStorytellerPage(rpgStoryState(), {
      pendingAct: 'Ask Piers what he wants',
    });
    expect(page.state.pendingWriterRetry?.act).toBe('Ask Piers what he wants');
    expect(page.state.turn).toBe(2);
  });

  it.each<[EngineMode, number]>([
    ['litrpg', 4],
    ['rpg', 4],
    ['dnd', 3],
  ])('after a good answer %s scene row is exactly %i', (mode, n) => {
    const base = createInitialState('Pad restore', mode);
    base.campaignBibleId =
      mode === 'dnd' ? 'cursed-keep' : mode === 'rpg' ? 'salt-road-heist' : 'summoned-pact';
    base.openingEstablishment = {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
    };
    base.turn = 3;
    base.pendingWriterRetry = null;
    base.currentLocation = 'Greyhollow Inn';
    base.choices = [...SCENE4];
    expect(isStorytellerRetryPage(base)).toBe(false);
    const scene = finalSceneOptions(base, [...SCENE4]);
    expect(scene).toHaveLength(n);
    expect(scene).toHaveLength(sceneOptionCount(mode));
    expect(scene).not.toContain(STORYTELLER_RETRY_CHIP);
  });

  it('fateAutoplay writer miss: offered choices stay exactly [Try again]', async () => {
    const { headlessFateTurn } = await import('./fateAutoplay');
    const prior = rpgStoryState({ turn: 2 });
    const settings = {
      subscriptionTier: 'free',
      contentMode: 'adult',
    } as Settings;
    const result = await headlessFateTurn(prior, settings, mulberry32(7), {
      bibleId: 'salt-road-heist',
      personalityId: 'friendly-guide',
      seed: 7,
      mode: 'first-pad',
      aiAgentMode: 'storyfollower',
      dryRun: false,
      playerInputOverride: 'Ask Piers what he wants',
    });
    expect(result.state.pendingWriterRetry?.act).toBe('Ask Piers what he wants');
    expect(result.telemetry.offeredChoices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(resolveOfferedChoices(result.state)).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(isStorytellerRetryPage(result.state)).toBe(true);
  });
});
