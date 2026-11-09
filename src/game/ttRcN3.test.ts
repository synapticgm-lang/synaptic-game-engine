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
  it('a one-sentence draft is not rewritten for length', async () => {
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
    expect(asked.some((p) => /Too thin/.test(p))).toBe(false);
    expect(turn.path).not.toBe('last-resort');
    expect(turn.prose).not.toMatch(/cracked font/);
  });

  it('a thin second draft is not replaced by the engine page for length', async () => {
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
    expect(asked.some((p) => /Too thin/.test(p))).toBe(false);
    expect(turn.path).not.toBe('last-resort');
  });
});
