/**
 * Root C (seed 83) — a named person here keeps one talk chip; a role chip never stands in for them.
 * The s83 T16 state at Lowmarket: Osric Coyne and Maud Pike met and here, the pad held role chips.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import type { GameState, NpcMemory } from './types';

function met(npcId: string, npcName: string, job: string): NpcMemory {
  return {
    npcId,
    npcName,
    disposition: 'unknown',
    facts: ['Introduced in play T16'],
    lastSeenTurn: 16,
    met: true,
    location: 'Lowmarket',
    sheet: { job, place: 'town' },
    meetCount: 1,
    introSpoken: true,
    completedTopics: ['intro'],
    relationshipStatus: 'acquaintance',
  } as NpcMemory;
}

function atLowmarket(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 83, personality: 'cold-system' });
  const s = stampOpening(state);
  return {
    ...s,
    turn: 17,
    currentLocation: 'Lowmarket',
    journey: undefined,
    activeEncounter: undefined,
    npcMemories: [...(s.npcMemories ?? []), met('town-osric-coyne', 'Osric Coyne', 'keeper'), met('town-maud-pike', 'Maud Pike', 'artisan')],
    sceneFacts: { ...s.sceneFacts!, present: ['Osric Coyne', 'Maud Pike'] },
    log: [
      ...(s.log ?? []),
      { id: 'p16', role: 'player', content: 'Walk on' },
      { id: 'g16', role: 'gm', content: 'Jax came into Lowmarket. Osric Coyne looked up from behind a stall of cracked tools. Maud Pike called out that the good junk was picked over.' },
    ] as GameState['log'],
    choices: ['Talk to the fence', 'Offer a kindness to a stall-hand', 'Call out to a bystander', 'Travel toward West Wall'],
  };
}

describe('s83 Root C — named people here keep a talk chip', () => {
  it('T16 Lowmarket: the list talks to Osric Coyne or Maud Pike, with no fence / stall-hand / bystander chip', () => {
    const offered = commitOfferedPad(atLowmarket()).choices ?? [];
    expect(offered.some((c) => /^Talk to (Osric Coyne|Maud Pike)$/.test(c))).toBe(true);
    expect(offered.some((c) => /\b(fence|stall-hand|bystander)\b/i.test(c))).toBe(false);
  });

  it('a person whose own topics are spent does not get the chip back', () => {
    const s = atLowmarket();
    const spent: GameState = {
      ...s,
      arcDirector: {
        ...(s.arcDirector ?? {}),
        npcTopics: { 'osric-coyne': ['a', 'b'], 'maud-pike': ['a', 'b'] },
      } as GameState['arcDirector'],
    };
    const offered = commitOfferedPad(spent).choices ?? [];
    expect(offered.some((c) => /^Talk to (Osric Coyne|Maud Pike)$/.test(c))).toBe(false);
  });
});
