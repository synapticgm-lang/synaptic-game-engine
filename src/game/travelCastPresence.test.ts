/**
 * Travel cast guard: a seed card's people belong at the opening, not on a street they never reached.
 * Someone actually here stays. A return to the opening seats the card again. An empty street demands no speech.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import type { GameState, NpcMemory, OpeningCardRecord } from './types';

const miraCard: OpeningCardRecord = {
  cast: 'Mira Quill',
  castNames: ['Mira Quill'],
  props: [],
  names: ['Mira', 'Quill'],
};

function memory(name: string, location: string): NpcMemory {
  return {
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 4,
    location,
  };
}

function state(over: Partial<GameState> = {}): GameState {
  const base = createInitialState(undefined, 'litrpg', undefined, 'cast-guard');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'West Wall',
    turn: 4,
    log: [{ id: 'p', role: 'player', content: 'Look around', timestamp: 1, turn: 4 }],
    sceneFacts: emptySceneFacts(4),
    openingEstablishment: {
      pending: [],
      answers: { where: 'West Wall' },
      complete: true,
      aloneArrival: false,
      card: miraCard,
    },
    ...over,
  } as GameState;
}

function people(s: GameState): string[] {
  return (buildCompletedEventPacket(s, 'Look around').refEnum ?? [])
    .filter((r) => r.klass === 'person')
    .map((r) => r.display);
}

describe('travel cast presence', () => {
  it('keeps the card cast at the same place', () => {
    const s = state({
      previousLocationSheet: { name: 'West Wall' } as GameState['previousLocationSheet'],
    });
    expect(people(s)).toContain('Mira Quill');
  });

  it('drops the card cast after a move and keeps the person who is actually there', () => {
    const s = state({
      currentLocation: 'Lowmarket',
      previousLocationSheet: { name: 'Sevenfold Circle' } as GameState['previousLocationSheet'],
      openingEstablishment: {
        pending: [],
        answers: { where: 'Sevenfold Circle' },
        complete: true,
        aloneArrival: false,
        card: miraCard,
      },
      npcMemories: [memory('Wren Holt', 'Lowmarket')],
    });
    const names = people(s);
    expect(names).toContain('Wren Holt');
    expect(names).not.toContain('Mira Quill');
    expect(formatWriterFacingEvent(buildCompletedEventPacket(s, 'Talk to Wren Holt'))).toMatch(/"fn":"speech"/);
  });

  it('seats the card again on a return, and an empty other street demands no speech', () => {
    const returned = state({
      currentLocation: 'Sevenfold Circle',
      previousLocationSheet: { name: 'West Wall' } as GameState['previousLocationSheet'],
      openingEstablishment: {
        pending: [],
        answers: { where: 'Sevenfold Circle' },
        complete: true,
        aloneArrival: false,
        card: miraCard,
      },
    });
    expect(people(returned)).toContain('Mira Quill');

    const emptyStreet = state({
      currentLocation: 'Lowmarket',
      previousLocationSheet: { name: 'Sevenfold Circle' } as GameState['previousLocationSheet'],
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        aloneArrival: false,
        card: miraCard,
      },
      npcMemories: [],
    });
    expect(people(emptyStreet)).not.toContain('Mira Quill');
    expect(formatWriterFacingEvent(buildCompletedEventPacket(emptyStreet, 'Look around'))).not.toMatch(/"fn":"speech"/);
  });

  it('a legacy save with no recorded move keeps its card, and one that already left does not', () => {
    const unmoved = state({
      currentLocation: 'Lowmarket',
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        aloneArrival: false,
        card: miraCard,
      },
    });
    expect(people(unmoved)).toContain('Mira Quill');

    const left = state({
      currentLocation: 'Lowmarket',
      previousLocationSheet: { name: 'Sevenfold Circle' } as GameState['previousLocationSheet'],
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        aloneArrival: false,
        card: miraCard,
      },
      npcMemories: [memory('Wren Holt', 'Lowmarket')],
    });
    expect(people(left)).toContain('Wren Holt');
    expect(people(left)).not.toContain('Mira Quill');
  });
});
