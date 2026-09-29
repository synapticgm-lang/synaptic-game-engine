/**
 * 28v3 — article repair knows every named person the save holds (npcMemories, companions, ledger),
 * lowercases a label-initial "The" after any word, and fixes "No the" glue.
 */
import { describe, expect, it } from 'vitest';
import { knownPersonNames, polishMentions, repairLabelArticles } from './mentionVariety';
import type { LedgerRef } from './completedEventPacket';
import type { GameState } from './types';

const refs: LedgerRef[] = [
  { tok: 't1', id: 'here', display: 'The road east toward Highmark', klass: 'place' },
  { tok: 't2', id: 'pell', display: 'Magistrate Pell', klass: 'person' },
];

const state = {
  npcMemories: [{ npcId: 'wren', npcName: 'Wren Holt' }],
  companions: [{ name: 'Dain Holt' }],
  worldLedger: { actors: [{ id: 'a1', name: 'Orin Quill' }] },
} as unknown as Pick<GameState, 'npcMemories' | 'companions' | 'worldLedger'>;

describe('playtest28v3ArticleRepair', () => {
  it('names outside this turn\'s refs still lose a glued "the"', () => {
    expect(knownPersonNames(refs, state)).toEqual(expect.arrayContaining(['Wren Holt', 'Dain Holt', 'Orin Quill', 'Magistrate Pell']));
    expect(repairLabelArticles('Jax weighed the Wren Holt\'s trade. The Dain Holt nodded to the Orin Quill.', refs, state))
      .toBe('Jax weighed Wren Holt\'s trade. Dain Holt nodded to Orin Quill.');
    expect(repairLabelArticles('Jax weighed the Wren Holt\'s trade.', refs)).toBe('Jax weighed the Wren Holt\'s trade.');
  });

  it('label-initial "The" after any word is lowercased; sentence start stays', () => {
    expect(repairLabelArticles('Jax stood where The road east bent south.', refs)).toBe('Jax stood where the road east bent south.');
    expect(repairLabelArticles('Past the cold, gray The road east ran on.', refs)).toBe('Past the cold, gray road east ran on.');
    expect(repairLabelArticles('Rain fell. The road east ran on.', refs)).toBe('Rain fell. The road east ran on.');
  });

  it('"No the" glue: drop the article; spoken "No" takes a comma', () => {
    expect(repairLabelArticles('No the two people here looked up.', refs)).toBe('No two people here looked up.');
    expect(repairLabelArticles('There was no the ferry inn in sight.', refs)).toBe('There was no ferry inn in sight.');
    expect(repairLabelArticles('Pell said, "No the gate stays shut."', refs)).toBe('Pell said, "No, the gate stays shut."');
    expect(polishMentions('Nothing answered.', refs, state)).toBe('Nothing answered.');
  });
});
