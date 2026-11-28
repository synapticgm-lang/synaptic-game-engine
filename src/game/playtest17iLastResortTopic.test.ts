/**
 * Brief 06 slice 3 — topicAdvance last-resort retired; miss is empty.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

function hallState(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 2,
    currentLocation: 'Valespire',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Valespire', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
    },
    sceneFacts: emptySceneFacts(2),
    log: [
      {
        id: 'g0',
        turn: 0,
        role: 'gm',
        content: 'The handler waited in the hall.',
        timestamp: 0,
      },
    ],
  };
}

describe('playtest17i — last-resort topic advance deleted (brief 06)', () => {
  it('who/want/look miss prose is empty', () => {
    const state = hallState();
    const packet = buildCompletedEventPacket(state, 'Ask what they want');
    expect(lastResortStoryBody(state, packet, 'Ask what they want').prose).toBe('');
    expect(lastResortStoryBody(state, packet, 'Look around').prose).toBe('');
  });
});
