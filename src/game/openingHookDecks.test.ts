import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { openingHookDeck, resolveOpeningHook } from './openingEstablishment';

describe('ready-made opening hook decks', () => {
  it('gives Summoned Pact more than the cathedral circle', () => {
    const deck = openingHookDeck(summonedPact);
    expect(deck.length).toBeGreaterThanOrEqual(8);
    const seen = new Set<string>();
    for (let i = 0; i < 120; i++) {
      seen.add(resolveOpeningHook(summonedPact, `seed-${i}`) ?? '');
    }
    expect(seen.size).toBeGreaterThan(3);
    expect([...seen].some((h) => /war camp|arena|cell|shrine|festival|rival hall/i.test(h))).toBe(true);
  });

  it('gives every catalog bible a starter deck', () => {
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      const deck = openingHookDeck(bible);
      expect(deck.length, bible.id).toBeGreaterThanOrEqual(3);
    }
  });
});
