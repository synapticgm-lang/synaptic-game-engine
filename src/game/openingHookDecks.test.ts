import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { openingHookDeck, resolveOpeningHook, normalizeOpeningHookCard } from './openingEstablishment';

describe('ready-made opening hook decks', () => {
  it('gives Summoned Pact more than the cathedral circle', () => {
    const deck = openingHookDeck(summonedPact);
    expect(deck.length).toBeGreaterThanOrEqual(12);
    const seen = new Set<string>();
    for (let i = 0; i < 160; i++) {
      seen.add(resolveOpeningHook(summonedPact, `seed-${i}`) ?? '');
    }
    expect(seen.size).toBeGreaterThan(5);
    expect([...seen].some((h) => /war camp|arena|cell|shrine|festival|rival hall|treaty|harbor|infirmary|west wall/i.test(h))).toBe(true);
  });

  it('feeds Summoned Pact as pointer cards with optional gear offers, not a no-sword lecture', () => {
    for (const card of summonedPact.openingHooks ?? []) {
      const n = normalizeOpeningHookCard(card);
      expect(n.text, n.location).not.toMatch(/nobody hands/i);
      expect(n.fallback ?? '', n.location).not.toMatch(/nobody hands/i);
      expect(n.text).toMatch(/Opening offer/i);
      if (typeof card !== 'string') {
        expect(card.beats?.length ?? 0, card.location).toBeGreaterThan(0);
        expect(card.openingOffer, card.location).toBeTruthy();
        expect(card.fallback, card.location).toBeTruthy();
      }
    }
  });

  it('gives every catalog bible a starter deck', () => {
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      const deck = openingHookDeck(bible);
      expect(deck.length, bible.id).toBeGreaterThanOrEqual(3);
    }
  });
});
