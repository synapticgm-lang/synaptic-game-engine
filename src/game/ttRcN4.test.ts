/**
 * RC-N4 — record-readout gate only on exact travel-record strings; player restating a chosen offer is not flagged.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { RECORD_READOUT } from './engineFactGate';
import { sentenceGateProblems } from './beatCommitGate';
import { buildInfoSheet } from './infoSheet';
import type { GameState } from './types';

function saltRoad(): GameState {
  const { state } = buildNewGameState({
    bibleId: 'salt-road-heist',
    characterName: 'Jax',
    seed: 13491,
    personality: 'chilled-gm',
  });
  const s = stampOpening(state);
  return {
    ...s,
    openingEstablishment: { ...s.openingEstablishment!, complete: true },
    quests: [
      {
        id: 'sr-main',
        name: 'Case the Caravan',
        revealed: true,
        status: 'active',
        description: '',
        objectives: [
          { id: 'o1', description: 'Hear what coin anyone would pay for the road east', completed: false },
        ],
      },
    ],
    completedEvent: { engineResult: 'Spoke with Nell Sallow.', loot: [], refs: [] },
  } as unknown as GameState;
}

describe('RC-N4 record readout: exact travel strings only', () => {
  it('G T3 shape: player restating their chosen coin offer is not flagged', () => {
    const s = saltRoad();
    const line =
      'Jax asked Nell Sallow what coin anyone would pay for the road east, and she named a figure that matched the chip.';
    expect(sentenceGateProblems(s, line, 'Hear the coin offer')).not.toContain(RECORD_READOUT);
  });

  it('a prose line with the exact travel-leg string is flagged', () => {
    const s = saltRoad();
    expect(
      sentenceGateProblems(s, 'The first leg of the journey took half an hour through the back streets.')
    ).toContain(RECORD_READOUT);
    expect(sentenceGateProblems(s, 'They traveled for thirty minutes on leg one toward Highmark.')).toContain(
      RECORD_READOUT
    );
    expect(sentenceGateProblems(s, 'The back streets narrowed as the light went.')).not.toContain(RECORD_READOUT);
  });

  it('OPEN on the info sheet carries the quest name without raw step text', () => {
    const sheet = buildInfoSheet(saltRoad());
    expect(sheet.open.some((row) => row.startsWith('quest Case the Caravan'))).toBe(true);
    expect(sheet.open.join('\n')).not.toMatch(/step:|coin anyone would pay/i);
  });
});
