import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyErrorRepairs,
  classifyTurnFailure,
  gmProxyTimeoutMsForState,
  GM_PROXY_TIMEOUT_DEFAULT_MS,
  GM_PROXY_TIMEOUT_EARLY_MS,
  GM_PROXY_TIMEOUT_FIRST_POST_OPEN_MS,
  shouldAutoRetryTurn,
  turnFailExhaustedMessage,
  turnFailPlayerMessage,
  turnTransportRetryMessage,
} from './errorRepairWarden';

describe('errorRepairWarden', () => {
  it('classifies compiling timeout as timeout with honest copy', () => {
    const kind = classifyTurnFailure(
      new Error('The System is still compiling. Try again, or cancel and keep the last scene.')
    );
    expect(kind).toBe('timeout');
    expect(turnFailPlayerMessage(kind)).toMatch(/too long/i);
    expect(turnFailPlayerMessage(kind)).not.toMatch(/compiling/i);
    expect(shouldAutoRetryTurn(kind)).toBe(true);
  });

  it('classifies Failed to fetch as network and marks auto-retryable', () => {
    const kind = classifyTurnFailure(new Error('Failed to fetch'));
    expect(kind).toBe('network');
    expect(turnFailPlayerMessage(kind)).toMatch(/Connection dropped/i);
    expect(shouldAutoRetryTurn(kind)).toBe(true);
    expect(turnFailExhaustedMessage(kind)).toMatch(/after retry/i);
    expect(turnTransportRetryMessage(1, kind)).toMatch(/retrying/i);
  });

  it('classifies provider "no content" as empty and auto-retries', () => {
    const kind = classifyTurnFailure(new Error('The AI provider returned no content.'));
    expect(kind).toBe('empty');
    expect(shouldAutoRetryTurn(kind)).toBe(true);
    expect(turnFailPlayerMessage(kind)).toMatch(/returned nothing/i);
    expect(turnTransportRetryMessage(1, kind)).toMatch(/Empty reply/i);
  });

  it('does not auto-retry auth or client bugs', () => {
    expect(shouldAutoRetryTurn(classifyTurnFailure(new Error('401 unauthorized JWT')))).toBe(false);
    expect(shouldAutoRetryTurn(classifyTurnFailure(new Error('forceFreeModel is not defined')))).toBe(
      false
    );
  });

  it('uses a longer first-post-open / honeymoon proxy budget', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const afterOpen = {
      ...base,
      turn: 1,
      storyStartTextTurnsRemaining: 7,
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: true,
        mode: 'weave' as const,
      },
    };
    expect(gmProxyTimeoutMsForState(afterOpen)).toBe(GM_PROXY_TIMEOUT_FIRST_POST_OPEN_MS);
    expect(gmProxyTimeoutMsForState({ ...afterOpen, turn: 12, storyStartTextTurnsRemaining: 0 })).toBe(
      GM_PROXY_TIMEOUT_DEFAULT_MS
    );
    expect(gmProxyTimeoutMsForState({ ...base, turn: 3 })).toBe(GM_PROXY_TIMEOUT_EARLY_MS);
  });

  it('stamps aloneArrival and rewrites Circle’s Price on Continue', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = {
      ...base,
      campaignBibleId: 'summoned-pact',
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: true,
        mode: 'weave' as const,
        pickedHook: 'Alone in a half-collapsed ruin.',
        aloneArrival: undefined,
      },
      quests: [
        {
          id: 'sp-quest-1',
          name: "The Circle's Price",
          description:
            'You have just been summoned. Hear why Pellane wanted you. Swear the Pact, refuse it, or walk away before anyone owns your name.',
          status: 'active' as const,
          type: 'main' as const,
          revealed: true,
          objectives: [
            {
              id: '1',
              description: 'First objective: Get your bearings in this arrival (floor, cell, camp, or vault)',
              completed: false,
            },
          ],
        },
      ],
    };

    const { state: next, dirty, notes } = applyErrorRepairs(state);
    expect(dirty).toBe(true);
    expect(next.openingEstablishment?.aloneArrival).toBe(true);
    expect(next.quests?.[0]?.description).toMatch(/arrived alone/i);
    expect(next.quests?.[0]?.description).not.toMatch(/Pellane/i);
    expect(notes.some((n) => n.code === 'ERR_ALONE_QUEST')).toBe(true);
  });
});
