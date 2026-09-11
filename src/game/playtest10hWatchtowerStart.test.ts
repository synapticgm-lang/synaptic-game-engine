/**
 * 2026-09-10h — Watchtower start: Inspect the panel / explore-or / locked name.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  hallTalkAsksPanel,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import {
  isSilentReceiptAction,
  shouldUseSilentMudTurn,
} from './freeMudPresentation';
import { detectRepairSituation } from './repairEngine';
import { playerAskedAboutSystemPanel } from './litrpgSystemWindow';
import type { GameState } from './types';

const WATCHTOWER_PAGE1 =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower; half the circular roof is gone and the upper floor opens to grey sky. Cold finds the seams of your Earth clothes through the arrow-slits. A blue panel hangs in the freeze, untouched by weather. The stair door is empty. No priests. No handlers. The circle under you is already fading. The panel waits on a name. What do you enter?';

function watchtower(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'alone in a half-collapsed watchtower on the edge of wild country',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: {
        where: 'alone in a half-collapsed watchtower on the edge of wild country',
        name: 'Jax',
      },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHookFallback: WATCHTOWER_PAGE1,
    },
    sceneFacts: emptySceneFacts(2),
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content: WATCHTOWER_PAGE1,
        timestamp: 1,
      },
    ],
    ...over,
  };
}

describe('playtest10h — watchtower start', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Inspect the panel is hall talk and stitches the window, not a room look', () => {
    expect(hallTalkAsksPanel('Inspect the panel')).toBe(true);
    expect(playerAskedAboutSystemPanel('Inspect the panel')).toBe(true);
    expect(shouldStitchOpeningContinue(watchtower(), 'Inspect the panel')).toBe(true);
    expect(isSilentReceiptAction('Inspect the panel')).toBe(false);
    expect(
      shouldUseSilentMudTurn({
        subscriptionTier: 'free',
        openingComplete: true,
        playerInput: 'Inspect the panel',
      })
    ).toBe(false);
    const text = stitchOpeningContinue(watchtower(), 'Inspect the panel');
    expect(text).toMatch(/panel|System window/i);
    expect(text).toMatch(/Jax/);
    expect(text).not.toMatch(/looked through this room|looked again at this room/i);
  });

  it('explore-for-where-or-use is not force-the-door repair', () => {
    expect(
      detectRepairSituation(
        'Explore the room for any signs of where you are or anything of use',
        watchtower()
      )
    ).toBeNull();
  });

  it('page 1 does not re-ask a name Usual Self already locked', () => {
    const prose = stitchOpeningScene(watchtower());
    expect(prose).toMatch(/watchtower|arrow-slits|blue panel/i);
    expect(prose).not.toMatch(/What do you enter|The panel waits on a name/i);
  });
});
