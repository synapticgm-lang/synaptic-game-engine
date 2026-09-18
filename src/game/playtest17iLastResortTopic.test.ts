/**
 * 2026-09-17i — after a lock, writer-empty last-resort is the topic stitch,
 * not the same "room waited" telegram. Still never page-1 / Dust-hung.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';
import type { GameState } from './types';

const PAGE1 =
  'Wet charcoal fills your lungs as you push up on scorched boards. You are alone in the burnt husk of a roadside waystation. A blue panel hangs clean against the soot. The panel waits on a name. What name do you lock?';
const DROUGHT = /Whatever you tried had already happened|Dust hung at/i;
const WAITED = /The room waited on what you did next/i;

function namedAlone(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 3,
    currentLocation: 'burnt roadside waystation',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'burnt roadside waystation', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHookFallback: PAGE1,
    },
    sceneFacts: emptySceneFacts(3),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
      { id: 'g1', turn: 1, role: 'gm', content: 'They have the name Jax.', timestamp: 1 },
    ],
    ...over,
  };
}

describe('playtest17i — last-resort topic advance after lock', () => {
  it('HUD/BUILD are 17i, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18a');
    expect(BUILD_STAMP).toBe('2026-09-18a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('first want after lock is not the room-waited telegram or page-1', () => {
    const state = namedAlone();
    const packet = buildCompletedEventPacket(state, 'Ask what they want');
    const resort = lastResortStoryBody(state, packet, 'Ask what they want');
    expect(resort.prose).not.toMatch(DROUGHT);
    expect(resort.prose).not.toMatch(WAITED);
    expect(resort.prose).not.toMatch(/What name do you lock|The panel waits on a name/i);
    expect(resort.prose.length).toBeGreaterThan(20);
  });

  it('a second writer-empty want does not reprint the first last-resort', () => {
    const state = namedAlone();
    const packet = buildCompletedEventPacket(state, 'Ask what they want');
    const first = lastResortStoryBody(state, packet, 'Ask what they want');
    const after = namedAlone({
      turn: 4,
      log: [
        ...(state.log ?? []),
        { id: 'g2', turn: 3, role: 'gm', content: first.prose, timestamp: 3 },
      ],
    });
    const second = lastResortStoryBody(
      after,
      buildCompletedEventPacket(after, 'Ask what they want'),
      'Ask what they want'
    );
    expect(second.prose.replace(/\s+/g, ' ').trim()).not.toBe(first.prose.replace(/\s+/g, ' ').trim());
    expect(second.prose).not.toMatch(DROUGHT);
    expect(second.prose).not.toMatch(/What name do you lock|The panel waits on a name/i);
  });

  it('look-around after lock is not the room-waited telegram', () => {
    const state = namedAlone();
    const packet = buildCompletedEventPacket(state, 'Look around');
    const resort = lastResortStoryBody(state, packet, 'Look around');
    expect(resort.prose).not.toMatch(WAITED);
    expect(resort.prose).not.toMatch(DROUGHT);
    expect(resort.prose).not.toMatch(/What name do you lock|The panel waits on a name/i);
  });
});
