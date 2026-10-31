/**
 * T10RPGLOOP — RPG s9601 ~T185 LOOP STOP: stall road Walk on + Make camp dead-end.
 * Evidence: T10PUSH-rpg.log T181–T185; turns 2026-10-31T10-34-01-687Z T182–T186.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { planDirector, STALL_N } from './director';
import { commitTravel, journeyPads, UNDERWAY_HERE, worldClock } from './travelJourney';
import { turnProgress } from './choiceRanking';
import { resolveTypedFreeText } from './typedFreeText';
import { planSceneThreads } from './openThreads';
import type { GameState } from './types';

function rpgAt(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    currentLocation: 'Salt Road Waystation',
    turn: 182,
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    character: { ...s.character, name: 'Jax' },
    ...over,
  } as GameState;
}

/** Quiet leg 1 of 2 toward Bribe Market (T10PUSH T182 shape). */
function quietLegTowardBribe(recent: string[] = ['Salt Road Waystation', 'Bribe Market']): GameState {
  let s = commitTravel(rpgAt({ worldHour: 14 }), 'Travel toward Bribe Market').state;
  if (s.journey?.encounter) {
    s = {
      ...s,
      journey: {
        ...s.journey,
        encounter: { ...s.journey.encounter, escaped: true, closedTurn: s.turn },
      },
    };
  }
  expect(s.currentLocation).toBe(UNDERWAY_HERE);
  expect(s.journey?.legsDone).toBeGreaterThanOrEqual(1);
  expect(s.journey!.legsDone).toBeLessThan(s.journey!.legsTotal);
  return {
    ...s,
    turn: 183,
    progressGovernor: {
      turnsSinceProgress: STALL_N,
      lastProgressTurn: 180,
      recentDeltas: [],
    },
    circling: {
      stale: {},
      lastProgressTurn: 180,
      lastLocation: UNDERWAY_HERE,
      recentPlaces: recent,
      tried: {},
    },
  };
}

describe('T10RPGLOOP stall road Walk on registers progress (s9601 T183 Make camp)', () => {
  it('stall mid-journey emits Nudge so bounce arrival + Make camp cannot burn five turns', () => {
    const before = quietLegTowardBribe();
    expect(journeyPads(before).some((c) => /^Make camp$/i.test(c) || /^Walk on$/i.test(c))).toBe(true);

    const planned = planDirector(before, { playerInput: 'Make camp' });
    expect(planned.state.sceneThreadPlan?.stallEventId ?? '').toMatch(/stall-road|stall-/);
    const nudge =
      planned.receipts.find((r) => /^Nudge:/i.test(r))
      ?? planned.state.sceneFacts?.stallProgressReceipt
      ?? '';
    expect(nudge).toMatch(/^Nudge:/i);

    // Player chip was Make camp; after stall Walk on the journey may be cleared → rest binder.
    const typed = resolveTypedFreeText(planned.state, 'Make camp');
    const progress = turnProgress(before, planned.state, [
      ...planned.receipts,
      planned.state.sceneFacts?.stallProgressReceipt ?? '',
      ...typed.receipts,
    ]);
    expect(progress.progressed).toBe(true);
    expect(progress.reasons).toContain('receipt');
  });

  it('planSceneThreads stamps stallProgressReceipt on sceneFacts', () => {
    const before = quietLegTowardBribe();
    const after = planSceneThreads(before, 'Make camp');
    expect(after.sceneFacts?.stallProgressReceipt ?? '').toMatch(/^Nudge:/i);
  });
});

describe('T10RPGLOOP no chip for a missing journey target', () => {
  it('journey pads are empty when no journey is underway', () => {
    const s = rpgAt({
      currentLocation: 'Bribe Market',
      journey: null,
      turn: 186,
    });
    expect(journeyPads(s)).toEqual([]);
  });
});

describe('T10COMBO stall Make camp when push-on day is spent (no Exhaustion-6 Walk on)', () => {
  it('stall mid-journey with day spent camps and still emits Nudge; playPhase stays live', () => {
    let s = createInitialState(undefined, 'dnd') as GameState;
    let found = false;
    for (let i = 0; i < 200; i++) {
      const probe = {
        ...s,
        seed: `combo-stall-${i}`,
        engineMode: 'dnd' as const,
        campaignBibleId: 'cursed-keep',
        currentLocation: 'Keep Gate',
        worldAtlas: null,
        activeEncounter: null,
        journey: null,
        turn: 29,
        openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
        character: { ...s.character, exhaustion: 4, hp: 1, maxHp: 10 },
      } as GameState;
      const t = commitTravel(probe, 'Travel toward Greyhollow Graveyard');
      const j = t.state.journey;
      if (!j || j.encounter || j.legsDone >= j.legsTotal - 1) continue;
      s = {
        ...t.state,
        roadDay: { since: worldClock(t.state), hours: 10 },
        pendingPushOnConfirm: null,
        progressGovernor: {
          turnsSinceProgress: STALL_N,
          lastProgressTurn: 25,
          recentDeltas: [],
        },
        circling: {
          stale: {},
          lastProgressTurn: 25,
          lastLocation: UNDERWAY_HERE,
          recentPlaces: ['Keep Gate', 'Greyhollow Graveyard'],
          tried: {},
        },
      };
      found = true;
      break;
    }
    expect(found).toBe(true);
    expect(s.journey).toBeTruthy();
    const planned = planDirector(s, { playerInput: 'I trip over my own boots' });
    const nudge =
      planned.receipts.find((r) => /^Nudge:/i.test(r))
      ?? planned.state.sceneFacts?.stallProgressReceipt
      ?? '';
    expect(nudge).toMatch(/^Nudge:/i);
    expect(planned.state.playPhase === 'ended' || planned.state.playPhase === 'down').toBe(false);
    expect(planned.state.character.exhaustion ?? 0).toBeLessThan(6);
    expect(planned.state.character.hp ?? 1).toBeGreaterThan(0);
  });
});
