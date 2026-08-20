import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyErrorRepairs,
  classifyTurnFailure,
  turnFailPlayerMessage,
} from './errorRepairWarden';

describe('errorRepairWarden', () => {
  it('classifies compiling timeout as timeout with honest copy', () => {
    const kind = classifyTurnFailure(
      new Error('The System is still compiling. Try again, or cancel and keep the last scene.')
    );
    expect(kind).toBe('timeout');
    expect(turnFailPlayerMessage(kind)).toMatch(/too long/i);
    expect(turnFailPlayerMessage(kind)).not.toMatch(/compiling/i);
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
