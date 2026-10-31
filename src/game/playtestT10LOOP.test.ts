/**
 * T10LOOP — RPG s9601 LOOP STOP stall shapes (Walk on binder, turn-back, Face without foe).
 * Evidence: LIVE0cf60aec / T10Q3 / T10Q5 rpg-s9601 LOOP at ~T212.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyDirectorChipPolicy, facesThreatChipAllowed } from './director';
import { resolveTypedFreeText } from './typedFreeText';
import { commitTravel, journeyPads, UNDERWAY_HERE } from './travelJourney';
import { turnProgress } from './choiceRanking';
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

/** Quiet leg 1 of 2 toward Consul Caravan Camp (s9601 Walk-on stall shape). */
function quietLeg1(): GameState {
  let s = commitTravel(rpgAt(), 'Travel toward Consul Caravan Camp').state;
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
  return s;
}

describe('T10LOOP Walk on binds to the pending travel leg (s9601 T183/T200/T208)', () => {
  it('leg 1 of 2 → Walk on is not an unplaced move; commitTravel arrives / advances', () => {
    const before = quietLeg1();
    expect(journeyPads(before)).toContain('Walk on');

    const typed = resolveTypedFreeText(before, 'Walk on');
    expect(typed.engineResult).not.toMatch(/no destination named/i);
    expect(typed.receipts.join(' ')).not.toMatch(/unplaced move/i);
    expect(typed.engineResult).toBe('');

    const on = commitTravel(before, 'Walk on');
    expect(on.handled).toBe(true);
    expect(on.arrived || (on.state.journey?.legsDone ?? 0) > before.journey!.legsDone).toBe(true);

    const progress = turnProgress(before, on.state, [on.receipt ?? '', ...typed.receipts]);
    expect(progress.progressed).toBe(true);
  });
});

describe('T10LOOP travel → Turn back binds through commitTravel (s9601 T179)', () => {
  it('Turn back toward origin is not an unplaced move and returns to the origin', () => {
    const before = quietLeg1();
    const origin = before.journey!.from;
    const chip = `Turn back toward ${origin}`;
    expect(journeyPads(before).some((c) => c.startsWith('Turn back toward'))).toBe(true);

    const typed = resolveTypedFreeText(before, chip);
    expect(typed.engineResult).not.toMatch(/no destination named/i);
    expect(typed.receipts.join(' ')).not.toMatch(/unplaced move/i);
    expect(typed.engineResult).toBe('');

    const back = commitTravel(before, chip);
    expect(back.handled).toBe(true);
    expect(back.arrived).toBe(true);
    expect(back.state.currentLocation).toBe(origin);
    expect(back.state.journey).toBeNull();
  });
});

describe('T10LOOP Face the threat with no resolvable foe (s9601 post-clear)', () => {
  it('Face the threat is not offered when no parked/pending foe can resolve', () => {
    const s = rpgAt({
      currentLocation: 'Bribe Market',
      turn: 210,
      activeEncounter: null,
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 210,
      },
      directorPlan: {
        need: 'threat',
        chips: [{ label: 'Face the threat', reason: 'director-threat' }],
        turn: 210,
      },
    });
    expect(facesThreatChipAllowed(s)).toBe(false);
    const pads = applyDirectorChipPolicy(s, ['Look around', 'Face the threat', 'Wait', 'Travel toward Harbor Fence'], {});
    expect(pads.some((c) => /^Face the threat$/i.test(c))).toBe(false);
  });
});
