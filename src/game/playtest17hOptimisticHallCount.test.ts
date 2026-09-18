/**
 * 2026-09-17h — first who/want after a locked name is callGm, even when
 * sendAction already appended the optimistic player bubble. Last-resort
 * after a lock is a ledger advance, not page-1 or the last GM reprint.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { lastResortStoryBody } from './completedEventPacket';
import {
  countSameHallTopicRepeats,
  shouldStitchOpeningContinue,
  storyBeatWriterPath,
} from './openingEstablishment';
import type { GameState } from './types';

const PAGE1 =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower. A blue panel hangs in the freeze. The panel waits on a name. What do you enter?';
const DROUGHT = /Whatever you tried had already happened|Dust hung at/i;

function namedAfterPage1(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 3,
    currentLocation: 'Cinderwake Trail',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Cinderwake Trail', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHookFallback: PAGE1,
    },
    sceneFacts: emptySceneFacts(3),
    log: [{ id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 }],
    ...over,
  };
}

describe('playtest17h — optimistic hall count + last-resort advance', () => {
  it('HUD/BUILD are 17h, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-17h');
    expect(BUILD_STAMP).toBe('2026-09-17h');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('first want is one repeat even after the optimistic player bubble', () => {
    const incoming = 'Ask what they want';
    const fresh = namedAfterPage1();
    expect(countSameHallTopicRepeats(fresh, incoming)).toBe(1);
    expect(shouldStitchOpeningContinue(fresh, incoming)).toBe(false);
    expect(storyBeatWriterPath(fresh, incoming)).toBe('callGm');

    const optimistic = namedAfterPage1({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 3, role: 'player', content: incoming, timestamp: 1 },
      ],
    });
    expect(countSameHallTopicRepeats(optimistic, incoming)).toBe(1);
    expect(shouldStitchOpeningContinue(optimistic, incoming)).toBe(false);
    expect(storyBeatWriterPath(optimistic, incoming)).toBe('callGm');
  });

  it('second want still stitches; third+ leaves after optimistic bubble', () => {
    const want = 'Ask what they want';
    const afterFirst = namedAfterPage1({
      log: [
        { id: 'p1', turn: 2, role: 'player', content: want, timestamp: 2 },
        { id: 'g1', turn: 2, role: 'gm', content: 'Oren answers you. "Walk with me."', timestamp: 3 },
      ],
    });
    expect(countSameHallTopicRepeats(afterFirst, want)).toBe(2);
    expect(shouldStitchOpeningContinue(afterFirst, want)).toBe(true);

    const thirdOptimistic = namedAfterPage1({
      log: [
        { id: 'p1', turn: 2, role: 'player', content: want, timestamp: 2 },
        { id: 'g1', turn: 2, role: 'gm', content: 'Oren answers you. "Walk with me."', timestamp: 3 },
        { id: 'p2', turn: 3, role: 'player', content: want, timestamp: 4 },
        { id: 'g2', turn: 3, role: 'gm', content: 'Oren already answered you. "Walk with me."', timestamp: 5 },
        { id: 'p3', turn: 4, role: 'player', content: want, timestamp: 6 },
      ],
    });
    expect(countSameHallTopicRepeats(thirdOptimistic, want)).toBe(3);
    expect(shouldStitchOpeningContinue(thirdOptimistic, want)).toBe(false);
    expect(storyBeatWriterPath(thirdOptimistic, want)).toBe('callGm');
  });

  it('last-resort after a locked name is not page-1 or the last GM reprint', () => {
    const last =
      'Brother Oren and tracker Kessa Cinder already answered you. "Walk with Oren."';
    const state = namedAfterPage1({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'g1', turn: 3, role: 'gm', content: last, timestamp: 4 },
      ],
    });
    const resort = lastResortStoryBody(state);
    expect(resort.prose).not.toMatch(DROUGHT);
    expect(resort.prose).not.toMatch(/What do you enter|The panel waits on a name|What name/i);
    expect(resort.prose.replace(/\s+/g, ' ').trim()).not.toBe(last);
    expect(resort.prose).toMatch(/Jax/);
  });
});
