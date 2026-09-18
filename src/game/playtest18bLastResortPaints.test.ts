/**
 * 2026-09-18c — Live timeout paints a NEW GM row. Last-resort is not
 * a reprint of the previous book. Who/Want starve after the handler spoke.
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
import {
  bookBodyAfterWriterMiss,
  buildCompletedEventPacket,
  isLastGmReprint,
  lastResortStoryBody,
} from './completedEventPacket';
import {
  coverContinuePads,
  hallTopicAlreadyAnswered,
  isNameTelegramProse,
  openingNameLockSpokenBeat,
  shouldStarveHallTopicPad,
} from './openingEstablishment';
import { hasRealGmStory, storyHasBody } from './turnAsk';
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
    currentLocation: 'Valespire',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Valespire', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: Valespire\nWho is here / who summoned: the handler\nWhy this happened: they need a Pactborn against the Ash Court.',
      pickedHookFallback: PAGE1,
    },
    sceneFacts: emptySceneFacts(2),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
    ],
    ...over,
  };
}

function afterNameLock(): { state: GameState; lock: string } {
  const lock = openingNameLockSpokenBeat(namedWatchtower());
  const state = namedWatchtower({
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
      { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
      { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
    ],
  });
  return { state, lock };
}

describe('playtest18b — live timeout paints a new book beat', () => {
  it('HUD/BUILD are 18b, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18c');
    expect(BUILD_STAMP).toBe('2026-09-18c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('live timeout / empty writer paints a new GM row, not a reprint', () => {
    const { state, lock } = afterNameLock();
    const packet = buildCompletedEventPacket(state, 'Ask what they want');
    const painted = bookBodyAfterWriterMiss(state, packet, 'Ask what they want', '');
    expect(storyHasBody(painted.prose)).toBe(true);
    expect(
      hasRealGmStory({
        id: 't2',
        turn: 2,
        role: 'gm',
        content: painted.prose,
        timestamp: 3,
      })
    ).toBe(true);
    expect(painted.prose.replace(/\s+/g, ' ').trim()).not.toBe(lock.replace(/\s+/g, ' ').trim());
    expect(isLastGmReprint(painted.prose, lock)).toBe(false);
    expect(isNameTelegramProse(painted.prose)).toBe(false);
    expect(painted.prose).not.toBe('They have the name Jax.');
    expect(painted.prose).not.toMatch(/The name \S+ already stood|The room waited on what you did next/i);
    const sentences = painted.prose.split(/(?<=[.!?])\s+/).filter(Boolean);
    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences.length).toBeLessThanOrEqual(7);
  });

  it('last-resort Look / Wait after the lock is not the previous GM', () => {
    const { state, lock } = afterNameLock();
    for (const line of ['Look around', 'Wait']) {
      const resort = lastResortStoryBody(
        state,
        buildCompletedEventPacket(state, line),
        line
      );
      expect(isLastGmReprint(resort.prose, lock)).toBe(false);
      expect(storyHasBody(resort.prose)).toBe(true);
      expect(isNameTelegramProse(resort.prose)).toBe(false);
    }
  });

  it('Want pad starves after the handler already spoke the want', () => {
    const { state } = afterNameLock();
    expect(hallTopicAlreadyAnswered(state, 'want')).toBe(true);
    expect(shouldStarveHallTopicPad(state, 'Ask what they want')).toBe(true);
    expect(coverContinuePads(state).join(' ')).not.toMatch(/Ask what they want/i);
    expect(compileChoices(state, ['Ask what they want', 'Who are you', 'Look around']).choices)
      .not.toContain('Ask what they want');
  });

  it('live sendAction last-resorts on exhausted timeout instead of throwing', () => {
    const useGame = readFileSync(resolve(__dirname, 'useGame.ts'), 'utf8');
    const fate = readFileSync(resolve(__dirname, 'fateAutoplay.ts'), 'utf8');
    expect(useGame).toContain('bookBodyAfterWriterMiss');
    expect(useGame).toContain('GM transport exhausted — last-resort will write the book');
    expect(useGame).toContain('GM transport threw — last-resort will write the book');
    expect(fate).toContain('bookBodyAfterWriterMiss');
  });
});
