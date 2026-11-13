/** PR42: chip-note heal keeps benefits; "key to the room" is a carryable key. */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { isCarryableOfferItem, openingOfferPads, openingOfferRecord, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState } from './types';

function card(re: RegExp): GameState {
  const bible = getCampaignBibleById('summoned-pact')!;
  for (let i = 0; i < 1500; i++) {
    const p = resolveOpeningHookPick(bible, String(i));
    if (p?.openingOffer && re.test(p.openingOffer)) {
      const s = newGameState('summoned-pact', { seed: String(i), liveOpening: true });
      return { ...s, turn: 1, openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true } } as GameState;
    }
  }
  throw new Error(`no card ${re}`);
}
/** A pre-PR40 save: record items are chip notes and no benefits were recorded. */
function preSplit(s: GameState, notes: string[]): GameState {
  const est = s.openingEstablishment!;
  return { ...s, openingEstablishment: { ...est, card: { ...est.card!, offer: { ...est.card!.offer!, items: notes, benefits: undefined } } } } as GameState;
}

describe('PR42 offer residuals', () => {
  it('(1) a pre-PR40 save healing from chip notes keeps the story / bunk as benefits', () => {
    const story = preSplit(card(/a mask and a story/), ['Caer offers mask', 'Caer offers story']);
    expect(openingOfferRecord(story)?.items).toEqual(['mask']);
    expect(openingOfferRecord(story)?.benefits).toEqual(['story']);
    const r = applyOpeningOfferChoice(story, openingOfferPads(story)[0]!);
    expect(r.receipts.join(' | ')).toMatch(/not carried\): story/);
    expect((r.state.inventory ?? []).map((i) => i.name.toLowerCase())).not.toContain('story');

    const bunk = preSplit(card(/kit you as crew/), ['Idra offers kit']);
    expect(openingOfferRecord(bunk)?.items).toEqual(['knife', 'oilskin']);
    expect(openingOfferRecord(bunk)?.benefits).toEqual(['bunk']);
  }, 60_000);

  it('(2) "to" / "from" tails: the key is carried, the room is not', () => {
    expect(isCarryableOfferItem('key to the room')).toBe(true);
    expect(isCarryableOfferItem('letter from the abbot')).toBe(true);
    expect(isCarryableOfferItem('room')).toBe(false);
    expect(isCarryableOfferItem('bunk to sleep in')).toBe(false);
  });
});
