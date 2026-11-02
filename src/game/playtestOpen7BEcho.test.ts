/**
 * XP-D1 OPEN7B — turn-echo-player-act from twin-lanterns s7402 T16 / T41.
 * Offline product strip (no AI call): opening must not restate the Ask chip.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { openingRestatesPlayerAct, checkPlayCrimes } from './turnCheck';
import { dropPlayerActEchoOpening, writerDraftProblems, type DraftCheck } from './writerTurn';
import type { GameState } from './types';

const ACT = 'Ask the people here about the delivery in their care';

/** Real T16 committed opening (Token Prose paint after @t bind). */
const T16_ECHO =
  'Jax asked the people here about the delivery in their care, but Twin Lanterns stable stood quiet for a long moment and only the horses moved in their stalls. Someone here had already refused to help with that, and meant it. No one was there to answer.';

/** Real T41 committed opening. */
const T41_ECHO =
  "Jax asked the courier about the delivery in their care, but the courier only shook their head and stepped back toward the tack wall. A few of the people here only shook their heads and turned away. A thin, cold draft slipped under the stable door and stirred the straw near Jax's boots, carrying the smell of wet rope from the harbour. No one was there to answer.";

function base(): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'twin-lanterns',
    turn: 16,
    currentLocation: 'Twin Lanterns stable',
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    sceneFacts: {
      ...emptySceneFacts(16),
      present: ['the people here'],
    },
  } as GameState;
}

describe('OPEN7B — turn-echo-player-act strip (s7402 T16/T41)', () => {
  it('gate still flags the raw echo openings', () => {
    expect(openingRestatesPlayerAct(T16_ECHO, ACT)).toBe(true);
    expect(openingRestatesPlayerAct(T41_ECHO, ACT)).toBe(true);
    const crimes16 = checkPlayCrimes(base(), base(), ACT, T16_ECHO).p0;
    expect(crimes16.some((f) => f.kind === 'echo-player-act')).toBe(true);
  });

  it('dropPlayerActEchoOpening clears T16 and T41; gate passes; draft problems clear', () => {
    const stripped16 = dropPlayerActEchoOpening(T16_ECHO, ACT);
    expect(stripped16).not.toMatch(/asked the people here about the delivery/i);
    expect(openingRestatesPlayerAct(stripped16, ACT)).toBe(false);
    expect(checkPlayCrimes(base(), base(), ACT, stripped16).p0.some((f) => f.kind === 'echo-player-act')).toBe(
      false
    );

    const stripped41 = dropPlayerActEchoOpening(T41_ECHO, ACT);
    expect(stripped41).not.toMatch(/asked the courier about the delivery in their care/i);
    expect(openingRestatesPlayerAct(stripped41, ACT)).toBe(false);
    expect(checkPlayCrimes(base(), base(), ACT, stripped41).p0.some((f) => f.kind === 'echo-player-act')).toBe(
      false
    );

    const check: DraftCheck = {
      state: base(),
      playerInput: ACT,
      intent: { kind: 'talk', label: ACT, targets: ['the people here'] },
      engineFact:
        'Speech event: you address the people here. the people here was last seen at Twin Lanterns stable; not present to answer.',
      previousGm: '',
    };
    expect(writerDraftProblems(stripped16, check).some((p) => /Do not restate the player's act/i.test(p))).toBe(
      false
    );
    expect(writerDraftProblems(stripped41, check).some((p) => /Do not restate the player's act/i.test(p))).toBe(
      false
    );
  });
});
