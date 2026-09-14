/**
 * Batch 13b — after page 1, live turns call the writer.
 * Sign / Wait / Who / Look must not commit Dust-hung drought as the book.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  isDroughtStubProse,
  lastResortStoryBody,
} from './completedEventPacket';
import {
  shouldStitchOpeningContinue,
  storyBeatWriterPath,
} from './openingEstablishment';
import { shouldUseSilentMudTurn } from './freeMudPresentation';
import { classifyResponsePath } from './talkEnvelope';
import type { GameState } from './types';

const DROUGHT = /Whatever you tried had already happened|Dust hung at/i;
const SIGN_READ = 'sign the book read the page. outline what the page says';

const HOOK = [
  'Location: a Crown archive stack behind iron mesh',
  'Who is here / who summoned: Archivist Lene Quill and a silent Scale witness',
  'Why this happened: They tried to summon a forbidden name out of the stack. The name arrived wearing Earth clothes.',
  'Opening offer (optional — player may refuse): Read the one page they allow and they will issue a reader’s ribbon and a copied line.',
].join('\n');

const PAGE1 =
  'Dust and iron mesh. You are on the archive floor behind the stack, a circle of library-chalk around a pulled folio. A blue panel hangs over empty shelves. Archivist Lene Quill has one page turned face-down. A Scale witness does not speak. A reader’s ribbon lies on the folio — offered if you take the page, not if you grab the rest.';

function crown(over: Partial<GameState> = {}): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    seed: 'dp4yq4yh',
    turn: 7,
    currentLocation: 'a Crown archive stack behind iron mesh',
    character: { ...state.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a Crown archive stack behind iron mesh', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: HOOK,
      pickedHookFallback: PAGE1,
    },
    sceneFacts: {
      ...emptySceneFacts(7),
      present: ['Archivist Lene Quill', 'a silent Scale witness'],
    },
    log: [
      {
        id: 'g0',
        turn: 0,
        role: 'gm',
        content: PAGE1,
        timestamp: 0,
      },
    ],
    ...over,
  };
}

const LINES = [SIGN_READ, 'Wait', 'Who are you', 'Look around'] as const;

describe('playtest13b — writer owns the book after page 1', () => {
  it('HUD/BUILD are 13b, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('sign / Wait / Who / Look go to callGm, never Silent or hall stitch', () => {
    const state = crown();
    const callGm = vi.fn();
    for (const line of LINES) {
      expect(shouldStitchOpeningContinue(state, line)).toBe(false);
      expect(
        shouldUseSilentMudTurn({
          subscriptionTier: 'free',
          openingComplete: true,
          playerInput: line,
        })
      ).toBe(false);
      expect(storyBeatWriterPath(state, line)).toBe('callGm');
      expect(classifyResponsePath({ state, playerInput: line, subscriptionTier: 'free' })).toBe('E');
      const body = assemblePacketStitch(buildCompletedEventPacket(state, line));
      expect(body).not.toMatch(DROUGHT);
      expect(isDroughtStubProse(body)).toBe(false);
      if (storyBeatWriterPath(state, line) === 'callGm') callGm(line);
    }
    expect(callGm).toHaveBeenCalledTimes(4);
    expect(callGm).toHaveBeenCalledWith(SIGN_READ);
    expect(callGm).toHaveBeenCalledWith('Wait');
    expect(callGm).toHaveBeenCalledWith('Who are you');
    expect(callGm).toHaveBeenCalledWith('Look around');
  });

  it('last-resort after empty GM is page 1 / last good beat, not Dust hung', () => {
    const drought =
      'Dust hung at a Crown archive stack behind iron mesh. Whatever you tried had already happened.';
    expect(isDroughtStubProse(drought)).toBe(true);
    const resort = lastResortStoryBody(crown(), buildCompletedEventPacket(crown(), SIGN_READ));
    expect(resort.prose).not.toMatch(DROUGHT);
    expect(isDroughtStubProse(resort.prose)).toBe(false);
    expect(resort.prose).toMatch(/archive floor|Lene Quill|reader’s ribbon|iron mesh/i);
    expect(resort.status).toMatch(/Writer empty after retries/i);
    expect(resort.prose.length).toBeGreaterThan(80);
  });

  it('live and Fate skip premade continue after sceneWritten', () => {
    const live = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
    const fate = readFileSync(resolve(__dirname, './fateAutoplay.ts'), 'utf8');
    expect(live).toContain('openingSceneWritten');
    expect(live).toContain('lastResortStoryBody');
    expect(live).toContain('await callGm(');
    expect(fate).toContain('lastResortStoryBody');
    expect(fate).toContain('page 1 stitch only');
    expect(fate).toContain('applyOpeningAnswer');
  });
});
