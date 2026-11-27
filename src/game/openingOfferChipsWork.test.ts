/**
 * Brief 02: offer chips from typed data work as a pair; no-offer cards mint none.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState } from './types';

function seedsByCard(bibleId: string) {
  const bible = getCampaignBibleById(bibleId)!;
  const out = new Map<string, { seed: string; hasOffer: boolean }>();
  for (let i = 0; i < 1500; i++) {
    const picked = resolveOpeningHookPick(bible, String(i));
    const key = picked?.text ?? '';
    if (key && !out.has(key)) {
      out.set(key, {
        seed: String(i),
        hasOffer: (picked?.offer?.items?.length ?? 0) > 0,
      });
    }
  }
  return [...out.values()];
}

function sceneWritten(state: GameState): GameState {
  return {
    ...state,
    turn: 1,
    openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true },
  } as GameState;
}

describe('opening offer chips work (typed data)', () => {
  it('Summoned Pact: typed-offer cards show a resolving pair; empty-offer cards show none', () => {
    const cards = seedsByCard('summoned-pact');
    expect(cards.length).toBeGreaterThan(10);
    let withOffer = 0;
    let without = 0;
    for (const c of cards) {
      const s = sceneWritten(newGameState('summoned-pact', { seed: c.seed, liveOpening: true }));
      const pads = openingOfferPads(s);
      if (c.hasOffer) {
        withOffer += 1;
        expect(pads.length, c.seed).toBe(2);
        expect(applyOpeningOfferChoice(s, pads[0]!).state.openingEstablishment?.offerTaken).toBe('accepted');
        expect(applyOpeningOfferChoice(s, pads[1]!).state.openingEstablishment?.offerTaken).toBe('refused');
        expect(openingOfferPads(applyOpeningOfferChoice(s, pads[0]!).state)).toEqual([]);
      } else {
        without += 1;
        expect(pads, c.seed).toEqual([]);
      }
    }
    expect(withOffer).toBeGreaterThan(5);
    expect(without).toBeGreaterThan(0);
  }, 120_000);
});
