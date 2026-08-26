import { describe, expect, it } from 'vitest';
import { classifyTurnFailure, shouldAutoRetryTurn } from './errorRepairWarden';
import { scrubOfficialPlaceholder, scrubInventedProperNouns } from './narrativeScrub';
import { filterInventedContextChoices } from './choiceWarden';
import { ensureTravelArrivalProse, parseTravelDestination } from './outdoorHubs';
import { createInitialState } from './defaults';
import type { GameState } from './types';

function baseState(over: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    campaignBibleId: 'summoned-pact',
    currentLocation: 'alone in a burnt husk that still has a shape',
    ...over,
  };
}

describe('26r quality repair', () => {
  it('classifies provider/5xx as empty (retryable)', () => {
    expect(classifyTurnFailure(new Error('GM proxy error 502'))).toBe('empty');
    expect(classifyTurnFailure(new Error('OpenRouter upstream failed'))).toBe('empty');
    expect(shouldAutoRetryTurn('unknown')).toBe(true);
    expect(shouldAutoRetryTurn('empty')).toBe(true);
  });

  it('scrubs ungrounded "the official" to stranger/panel', () => {
    const alone = baseState({
      openingEstablishment: {
        complete: false,
        aloneArrival: true,
        required: [],
        answered: {},
        asked: [],
      } as GameState['openingEstablishment'],
    });
    const crowded = baseState({
      openingEstablishment: {
        complete: true,
        aloneArrival: false,
        required: [],
        answered: {},
        asked: [],
      } as GameState['openingEstablishment'],
    });
    expect(scrubOfficialPlaceholder('Approach the official.', alone)).toMatch(/panel/i);
    expect(scrubOfficialPlaceholder('Approach the official.', crowded)).toMatch(/stranger/i);
  });

  it('ungrounded proper names do not become the official', () => {
    const state = baseState({
      openingEstablishment: {
        complete: true,
        aloneArrival: false,
        required: [],
        answered: {},
        asked: [],
      } as GameState['openingEstablishment'],
    });
    const { text } = scrubInventedProperNouns('Finn greets you at the moot.', state, '');
    expect(text.toLowerCase()).not.toMatch(/the official/);
  });

  it('filters official-placeholder choice pads', () => {
    const state = baseState({
      openingEstablishment: {
        complete: true,
        aloneArrival: false,
        required: [],
        answered: {},
        asked: [],
      } as GameState['openingEstablishment'],
      log: [
        {
          id: '1',
          turn: 1,
          role: 'gm',
          content: 'An elder gestures at the green wall of blight.',
          timestamp: 1,
        },
      ],
    });
    const kept = filterInventedContextChoices(
      ['Ask about the blight', 'Approach the official', 'Wait'],
      state
    );
    expect(kept.join(' ')).not.toMatch(/official/i);
    expect(kept).toContain('Wait');
  });

  it('Travel toward Lowmarket parses and arrival prose lands', () => {
    expect(parseTravelDestination('Travel toward Lowmarket', 'summoned-pact')?.name).toBe(
      'Lowmarket'
    );
    const prose = ensureTravelArrivalProse(
      'Acrid smoke still fills the burnt husk. Dust motes hang.',
      'Lowmarket',
      'alone in a burnt husk that still has a shape'
    );
    expect(prose).toMatch(/Lowmarket/);
    expect(prose.toLowerCase()).toMatch(/leave|reach/);
  });
});
