/**
 * Brief 02: offer pads are the minted typed-item chips — one accept + one refuse, both resolve.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState } from './types';

type Card = { seed: string; items: string[] };

function offerCards(): Card[] {
  const bible = getCampaignBibleById('summoned-pact')!;
  const out: Card[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 1500; i++) {
    const p = resolveOpeningHookPick(bible, String(i));
    const key = p?.text ?? '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const items = (p?.offer?.items ?? []).filter((it) => it.carryable).map((it) => it.label);
    if (!items.length) continue;
    out.push({ seed: String(i), items });
  }
  return out;
}

function sceneWritten(state: GameState): GameState {
  return {
    ...state,
    turn: 1,
    openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true },
  } as GameState;
}

describe('opening offer labels from typed data', () => {
  const cards = offerCards();

  it('every typed offer card: exactly one accept and one refuse, both resolve', () => {
    expect(cards.length).toBeGreaterThanOrEqual(10);
    for (const c of cards) {
      const s = sceneWritten(newGameState('summoned-pact', { seed: c.seed, liveOpening: true }));
      const chips = s.openingEstablishment?.instance?.offerChips ?? [];
      expect(chips.map((x) => x.kind), c.seed).toEqual(['accept', 'refuse']);
      const pads = openingOfferPads(s);
      expect(pads, c.seed).toHaveLength(2);
      // Accept chip names at least one typed item word.
      const accept = pads[0]!;
      const named = c.items.some((label) => {
        const head = label.replace(/^(?:a|an|the)\s+/i, '').toLowerCase().split(/\s+/)[0]!;
        return accept.toLowerCase().includes(head);
      });
      expect(named, `${c.seed}: ${accept}`).toBe(true);
      expect(applyOpeningOfferChoice(s, pads[0]!).state.openingEstablishment?.offerTaken).toBe('accepted');
      expect(applyOpeningOfferChoice(s, pads[1]!).state.openingEstablishment?.offerTaken).toBe('refused');
    }
  }, 120_000);

  it('pads stay the minted labels (no prose re-grounding)', () => {
    const c = cards[0]!;
    const base = sceneWritten(newGameState('summoned-pact', { seed: c.seed, liveOpening: true }));
    const pads = openingOfferPads(base);
    const later = {
      ...base,
      log: [{ id: 'g0', turn: 0, role: 'gm' as const, content: 'Salt and empty air. No kit nouns here.', timestamp: 0 }],
    };
    expect(openingOfferPads(later)).toEqual(pads);
  }, 60_000);
});
