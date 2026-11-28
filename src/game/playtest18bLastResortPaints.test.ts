/**
 * Brief 06 slice 3 — last-resort painters deleted; writer miss is empty / honest Try again.
 * (Was: live timeout paints a NEW GM row from topicAdvance.)
 */
import { publicStampIdentityHolds, readPublicStampIdentity } from './publicStampFiles';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  bookBodyAfterWriterMiss,
  buildCompletedEventPacket,
  lastResortStoryBody,
} from './completedEventPacket';
import {
  buildFailedStorytellerPage,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
} from './liveOpening';
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
    },
    sceneFacts: emptySceneFacts(2),
    log: [{ id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 }],
    ...over,
  };
}

describe('playtest18b — last-resort retired (brief 06)', () => {
  it('HUD/BUILD stamps hold, Mid writer OFF', () => {
    expect(readPublicStampIdentity().build.length).toBeGreaterThan(0);
    expect(publicStampIdentityHolds()).toBe(true);
    expect(readPublicStampIdentity()).toMatchObject({
      hud: HUD_BUILD_STAMP,
      build: BUILD_STAMP,
    });
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('writer miss paints no canned book body', () => {
    const state = namedWatchtower();
    const packet = buildCompletedEventPacket(state, 'Ask what they want');
    const painted = bookBodyAfterWriterMiss(state, packet, 'Ask what they want', '');
    expect(painted.prose).toBe('');
    expect(lastResortStoryBody(state, packet, 'Look around').prose).toBe('');
  });

  it('honest Try again page owns the miss', () => {
    const state = namedWatchtower();
    const page = buildFailedStorytellerPage(state, { pendingAct: 'Ask what they want' });
    expect(page.prose).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(page.offeredChoices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(page.state.pendingWriterRetry?.act).toBe('Ask what they want');
  });

  it('live sendAction routes miss to Try again owner', () => {
    const useGame = readFileSync(resolve(__dirname, 'useGame.ts'), 'utf8');
    const fate = readFileSync(resolve(__dirname, 'fateAutoplay.ts'), 'utf8');
    expect(useGame).toContain('buildFailedStorytellerPage');
    expect(useGame).toContain('bookBodyAfterWriterMiss');
    expect(fate).toContain('bookBodyAfterWriterMiss');
  });
});
