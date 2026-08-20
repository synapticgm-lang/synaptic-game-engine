import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { openingHookDeck, resolveOpeningHook, normalizeOpeningHookCard } from './openingEstablishment';

describe('ready-made opening hook decks', () => {
  it('gives Summoned Pact more than the cathedral circle', () => {
    const deck = openingHookDeck(summonedPact);
    expect(deck.length).toBeGreaterThanOrEqual(18);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(resolveOpeningHook(summonedPact, `seed-${i}`) ?? '');
    }
    expect(seen.size).toBeGreaterThan(6);
    expect([...seen].some((h) => /war camp|arena|cell|shrine|festival|rival hall|treaty|harbor|infirmary|west wall/i.test(h))).toBe(true);
    expect([...seen].some((h) => /alone|outline|burnt husk|wall-shell|half-collapsed|shabby/i.test(h))).toBe(true);
  });

  it('includes alone-arrival ruin cards across ruin severity', () => {
    const alone = (summonedPact.openingHooks ?? []).filter(
      (card) => typeof card !== 'string' && /alone/i.test(card.location ?? '')
    );
    expect(alone.length).toBeGreaterThanOrEqual(5);
    const blob = alone.map((c) => JSON.stringify(c)).join('\n');
    expect(blob).toMatch(/shabby|standing/i);
    expect(blob).toMatch(/half-collapsed|half collapsed/i);
    expect(blob).toMatch(/shell|outline|foundation/i);
    expect(blob).toMatch(/burnt/i);
    expect(blob).not.toMatch(/wandering inn|erin|liscor/i);
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
