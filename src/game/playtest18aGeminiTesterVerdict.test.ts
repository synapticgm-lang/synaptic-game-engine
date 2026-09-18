/**
 * 2026-09-18a — Gemini tester verdict + interesting/simple prose floor.
 * Name-lock is HERE + spoken want. Who/Want starve after answered.
 * Third same hall ask does not reprint the identical already-told line.
 * Telegram / STATUS-only is not a successful story beat.
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
import { compileChoices } from './choiceCompiler';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';
import { stitchOpeningContinue } from './openingStitch';
import {
  coverContinuePads,
  hallTopicAlreadyAnswered,
  isNameTelegramProse,
  openingAlreadyToldLine,
  openingNameLockSpokenBeat,
  shouldStarveHallTopicPad,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { hasRealGmStory } from './turnAsk';
import type { GameState } from './types';

const PAGE1 =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower. A blue panel hangs in the freeze.';

function namedWatchtower(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 2,
    currentLocation: 'a ruined watchtower',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a ruined watchtower', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHook:
        'Location: a ruined watchtower\nWho is here / who summoned: the lead priest\nWhy this happened: they need a Pactborn against the Ash Court.',
      pickedHookFallback: PAGE1,
    },
    sceneFacts: emptySceneFacts(2),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
    ],
    ...over,
  };
}

function saltFenReed(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('Salt Road Heist', 'rpg');
  const first =
    'Vessa answers you. "Ilyra Fen and Tekk Reed are counting who comes back."';
  return {
    ...base,
    campaignBibleId: 'salt-road-heist',
    engineMode: 'rpg',
    turn: 5,
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
    sceneFacts: emptySceneFacts(5),
    log: [
      { id: 'p1', turn: 2, role: 'player', content: 'Ask what they want', timestamp: 2 },
      { id: 'g1', turn: 2, role: 'gm', content: first, timestamp: 3 },
      { id: 'p2', turn: 3, role: 'player', content: 'Ask what they want', timestamp: 4 },
      { id: 'g2', turn: 3, role: 'gm', content: 'Vessa already answered you. "Ilyra Fen and Tekk Reed are counting who comes back."', timestamp: 5 },
    ],
    ...over,
  };
}

describe('playtest18a — Gemini tester verdict + simple prose floor', () => {
  it('HUD/BUILD are 18b, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18b');
    expect(BUILD_STAMP).toBe('2026-09-18b');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('name-lock beat is HERE + spoken want, never the telegram', () => {
    const state = namedWatchtower();
    const text = stitchOpeningContinue(state, 'My name is Jax');
    expect(text).toMatch(/You are/i);
    expect(text).toMatch(/Pactborn|Ash Court|want|answer(?:s)? you|"/i);
    expect(text).not.toBe('They have the name Jax.');
    expect(isNameTelegramProse(text)).toBe(false);
    expect(isNameTelegramProse('They have the name Jax.')).toBe(true);
    expect(openingNameLockSpokenBeat(state)).toMatch(/You are in a ruined watchtower/i);
    expect(openingNameLockSpokenBeat(state).length).toBeGreaterThan(24);
    expect(openingNameLockSpokenBeat(state).length).toBeLessThan(400);
  });

  it('Who/Want pads starve after that topic is logged', () => {
    const afterWant = namedWatchtower({
      log: [
        { id: 'p1', turn: 1, role: 'player', content: 'Ask what they want', timestamp: 1 },
      ],
    });
    expect(hallTopicAlreadyAnswered(afterWant, 'want')).toBe(true);
    expect(shouldStarveHallTopicPad(afterWant, 'Ask what they want')).toBe(true);
    expect(coverContinuePads(afterWant).join(' ')).not.toMatch(/Ask what they want/i);
    expect(compileChoices(afterWant, ['Ask what they want', 'Who are you', 'Look around']).choices)
      .not.toContain('Ask what they want');

    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const afterSpokenWant = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    expect(hallTopicAlreadyAnswered(afterSpokenWant, 'want')).toBe(true);
    expect(shouldStarveHallTopicPad(afterSpokenWant, 'Ask what they want')).toBe(true);
    expect(coverContinuePads(afterSpokenWant).join(' ')).not.toMatch(/Ask what they want/i);
    expect(compileChoices(afterSpokenWant, ['Ask what they want', 'Who are you', 'Look around']).choices)
      .not.toContain('Ask what they want');

    const afterWho = namedWatchtower({
      log: [
        { id: 'p1', turn: 1, role: 'player', content: 'Who are you', timestamp: 1 },
      ],
    });
    expect(shouldStarveHallTopicPad(afterWho, 'Who are you')).toBe(true);
    expect(coverContinuePads(afterWho).join(' ')).not.toMatch(/Who are you/i);
  });

  it('third Who/Want does not reprint the identical already-told paragraph', () => {
    const third = saltFenReed();
    expect(shouldStitchOpeningContinue(third, 'Ask what they want')).toBe(false);
    const already = openingAlreadyToldLine(third, 'want');
    const lastGm = [...(third.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const resort = lastResortStoryBody(
      third,
      buildCompletedEventPacket(third, 'Ask what they want'),
      'Ask what they want'
    );
    expect(resort.prose.replace(/\s+/g, ' ').trim()).not.toBe(already.replace(/\s+/g, ' ').trim());
    expect(resort.prose.replace(/\s+/g, ' ').trim()).not.toBe(lastGm.replace(/\s+/g, ' ').trim());
    expect(isNameTelegramProse(resort.prose)).toBe(false);
  });

  it('first want after the name-lock beat is callGm; last-resort still paints a new book row', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const afterLock = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    expect(shouldStitchOpeningContinue(afterLock, 'Ask what they want')).toBe(false);
    const resort = lastResortStoryBody(
      afterLock,
      buildCompletedEventPacket(afterLock, 'Ask what they want'),
      'Ask what they want'
    );
    expect(resort.prose.replace(/\s+/g, ' ').trim()).not.toBe(lock.replace(/\s+/g, ' ').trim());
    expect(isNameTelegramProse(resort.prose)).toBe(false);
    expect(
      hasRealGmStory({
        id: 'resort',
        turn: 2,
        role: 'gm',
        content: resort.prose,
        timestamp: 3,
      })
    ).toBe(true);
  });

  it('live sendAction last-resorts when GM transport is exhausted (Fate already did)', () => {
    const useGame = readFileSync(resolve(__dirname, 'useGame.ts'), 'utf8');
    expect(useGame).toContain('GM transport exhausted — last-resort will write the book');
    expect(useGame).toContain('bookBodyAfterWriterMiss');
    expect(useGame).toContain('GM transport threw — last-resort will write the book');
    expect(useGame).not.toMatch(
      /if \(!shouldAutoRetryTurn\(kind\) \|\| attempt >= TURN_TRANSPORT_MAX_AUTO_RETRIES\) \{\s*throw err;/
    );
  });

  it('name telegram and STATUS-only chrome are not a successful story beat', () => {
    expect(
      hasRealGmStory({
        id: 't',
        turn: 2,
        role: 'gm',
        content: 'They have the name Jax.',
        timestamp: 2,
      })
    ).toBe(false);
    expect(
      hasRealGmStory({
        id: 'chrome',
        turn: 2,
        role: 'gm',
        content: '',
        timestamp: 2,
        presentation: 'mud-receipt',
        systemLog: ['Quest Unlocked: Circle\'s Price', 'XP Gained: 15'],
      })
    ).toBe(false);
  });
});
