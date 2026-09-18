/**
 * 2026-09-17g — after page 1 the success path is callGm + Token Prose.
 * Stitch / Silent / two-line already-told is not the book except the first
 * already-told who/want/refuse (17f second hit). Third+ leaves stitch.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  acceptTokenOrLedgerStory,
  looksLikeTokenJson,
} from './tokenProse';
import {
  buildCompletedEventPacket,
  isDroughtStubProse,
  lastResortStoryBody,
} from './completedEventPacket';
import {
  shouldStitchOpeningContinue,
  storyBeatWriterPath,
} from './openingEstablishment';
import { stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import { shouldUseSilentMudTurn } from './freeMudPresentation';
import { classifyResponsePath } from './talkEnvelope';
import type { GameState } from './types';

const DROUGHT = /Whatever you tried had already happened|Dust hung at/i;
const PAGE1_NAME_ASK =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower. A blue panel hangs in the freeze. The panel waits on a name. What do you enter?';

function namedAfterPage1(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 3,
    currentLocation: 'a ruined watchtower',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a ruined watchtower', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHookFallback: PAGE1_NAME_ASK,
    },
    sceneFacts: emptySceneFacts(3),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1_NAME_ASK, timestamp: 0 },
    ],
    ...over,
  };
}

function nameLockedCoverContinue(): GameState {
  return namedAfterPage1({
    openingEstablishment: {
      pending: [{ id: 'look', kind: 'appearance', question: 'What do you look like?' }],
      answers: { where: 'a ruined watchtower', name: 'Jax' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHookFallback: PAGE1_NAME_ASK,
    },
  });
}

function saltAfterFirstWant(): GameState {
  const base = createInitialState('Salt Road Heist', 'rpg');
  const first =
    'Vessa answers you. "I need a cutter who can walk the Salt Road and a name I can use."';
  return {
    ...base,
    campaignBibleId: 'salt-road-heist',
    engineMode: 'rpg',
    turn: 4,
    currentLocation: 'a Salt Road tavern hire',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a Salt Road tavern hire', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: a Salt Road tavern hire\nWho is here / who summoned: Vessa\nWhy this happened: Vessa wants a cutter and a name she can use.',
    },
    sceneFacts: emptySceneFacts(4),
    log: [
      { id: 'p1', turn: 2, role: 'player', content: 'Ask what they want', timestamp: 2 },
      { id: 'g1', turn: 2, role: 'gm', content: first, timestamp: 3 },
    ],
  };
}

describe('playtest17g — writer always + Token Prose after page 1', () => {
  it('HUD/BUILD are 17g, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18c');
    expect(BUILD_STAMP).toBe('2026-09-18c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Silent mud stays false; Look / Wait / inspect / first hall are callGm', () => {
    const state = namedAfterPage1();
    for (const line of [
      'Look around',
      'Wait',
      'Inspect the panel',
      'Who are you',
      'Ask what they want',
      'What happens if I refuse?',
    ] as const) {
      expect(shouldStitchOpeningContinue(state, line)).toBe(false);
      expect(storyBeatWriterPath(state, line)).toBe('callGm');
      expect(
        shouldUseSilentMudTurn({
          subscriptionTier: 'free',
          openingComplete: true,
          playerInput: line,
        })
      ).toBe(false);
      expect(classifyResponsePath({ state, playerInput: line, subscriptionTier: 'free' })).toBe('E');
    }
  });

  it('name-locked cover-continue does not stitch page-1 as success', () => {
    const state = nameLockedCoverContinue();
    expect(shouldStitchOpeningContinue(state, 'Look around')).toBe(false);
    expect(shouldStitchOpeningContinue(state, 'everyday street clothes')).toBe(false);
    expect(storyBeatWriterPath(state, 'Look around')).toBe('callGm');
    const page = stitchOpeningScene(state);
    const cont = stitchOpeningContinue(state, 'Look around');
    expect(page).not.toMatch(/What do you enter|The panel waits on a name/i);
    expect(cont).not.toMatch(/What do you enter|The panel waits on a name/i);
  });

  it('first already-told who/want/refuse still stitches; third+ leaves', () => {
    const second = saltAfterFirstWant();
    expect(shouldStitchOpeningContinue(second, 'Ask what they want')).toBe(true);
    expect(storyBeatWriterPath(second, 'Ask what they want')).toBe('page1-stitch');
    const third = saltAfterFirstWant();
    third.log = [
      ...third.log,
      { id: 'p2', turn: 3, role: 'player', content: 'Ask what they want', timestamp: 4 },
      { id: 'g2', turn: 3, role: 'gm', content: 'Vessa already said it.', timestamp: 5 },
    ];
    expect(shouldStitchOpeningContinue(third, 'Ask what they want')).toBe(false);
    expect(storyBeatWriterPath(third, 'Ask what they want')).toBe('callGm');
  });

  it('token prose accept path is selected; unparseable uses 13c; last-resort is not Dust-hung', () => {
    const state = namedAfterPage1();
    const packet = buildCompletedEventPacket(state, 'Look around');
    const accepted = acceptTokenOrLedgerStory(
      '{ this is not token prose at all',
      state,
      packet
    );
    expect(accepted.path).toMatch(/13c|last-resort/);
    expect(accepted.prose).not.toMatch(DROUGHT);
    expect(isDroughtStubProse(accepted.prose)).toBe(false);
    expect(looksLikeTokenJson('{ "refs": [], "lines": [] }')).toBe(true);
    const resort = lastResortStoryBody(state, packet);
    expect(resort.prose).not.toMatch(DROUGHT);
    expect(resort.prose).not.toMatch(/What do you enter|The panel waits on a name/i);
  });

  it('live useGame and Fate share the same gates and token-prose accept path', () => {
    const live = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
    const fate = readFileSync(resolve(__dirname, './fateAutoplay.ts'), 'utf8');
    expect(live).toContain('shouldStitchOpeningContinue');
    expect(live).toContain('shouldUseSilentMudTurn');
    expect(live).toContain('acceptTokenOrLedgerStory');
    expect(live).toContain('formatTokenRepairFacing');
    expect(live).toContain('await callGm(');
    expect(fate).toContain('shouldStitchOpeningContinue');
    expect(fate).toContain('shouldUseSilentMudTurn');
    expect(fate).toContain('acceptTokenOrLedgerStory');
    expect(fate).toContain('formatTokenRepairFacing');
    expect(fate).toContain('already-told who/want/refuse still stitches');
  });
});
