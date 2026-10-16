/**
 * Order RC-N3 — thin / blocking accepted drafts get one rewrite, else engine-fact fallback.
 * Acceptance: docs/orders/acceptance-tests-new-orders.md § RC-N3.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket } from './completedEventPacket';
import { parsePlayerIntent } from './intentParser';
import { runWriterTurnWithFightRetry } from './writerTurn';
import type { GameState } from './types';

const THIN = 'You looked around the hall and saw only dust.';
const THICK =
  'You walked the length of the undercroft with slow steps. Dust lifted where your boots fell on the flagstones. '
  + 'A cracked font stood against the far wall, dry for years. Somewhere above, a bell rope creaked once and went still.';

function lookState(): GameState {
  const s = createInitialState('Ria', 'litrpg') as GameState;
  const base = {
    ...s,
    currentLocation: 'Cathedral Undercroft',
    turn: 5,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
  } as GameState;
  return {
    ...base,
    completedEvent: buildCompletedEventPacket(base, 'Look around the hall'),
  };
}

function check(state: GameState) {
  return {
    state,
    playerInput: 'Look around the hall',
    intent: parsePlayerIntent('Look around the hall', state),
    engineFact: '',
    previousGm: '',
  };
}

describe('RC-N3 blocking draft rewrite', () => {
  it('a one-sentence accepted draft triggers exactly one rewrite with Too thin', async () => {
    const state = lookState();
    const asked: string[] = [];
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: THIN,
      packet: state.completedEvent!,
      check: check(state),
      rewrite: async (problem) => {
        asked.push(problem);
        return THICK;
      },
    });
    expect(asked).toHaveLength(1);
    expect(asked[0]).toMatch(/Too thin/);
    expect(turn.draftRetry).toBe('retried');
    expect(turn.path).not.toBe('last-resort');
    expect(turn.prose).toMatch(/cracked font/);
    expect(turn.prose).not.toBe(THIN);
  });

  it('a second thin draft falls back and is logged, never shipped as-is', async () => {
    const state = lookState();
    const asked: string[] = [];
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: THIN,
      packet: state.completedEvent!,
      check: check(state),
      rewrite: async (problem) => {
        asked.push(problem);
        return 'Dust only.';
      },
    });
    expect(asked).toHaveLength(1);
    expect(asked[0]).toMatch(/Too thin/);
    expect(turn.draftRetry).toBe('painted');
    expect(turn.path).toBe('last-resort');
    expect(turn.prose).not.toBe(THIN);
    expect(turn.prose).not.toBe('Dust only.');
    expect(turn.problems.some((p) => p.includes('fell back to engine-fact page'))).toBe(true);
  });
});
