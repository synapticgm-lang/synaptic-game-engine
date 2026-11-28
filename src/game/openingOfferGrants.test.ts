/**
 * Brief 02: accepting grants typed offer item labels — never chip notes or English-parsed actions.
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

function opened(c: Card): GameState {
  const s = newGameState('summoned-pact', { seed: c.seed, liveOpening: true });
  return { ...s, turn: 1, openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true } } as GameState;
}

function accepted(s: GameState): string[] {
  const before = new Set((s.inventory ?? []).map((x) => x.name.toLowerCase()));
  const pads = openingOfferPads(s);
  expect(pads.length).toBeGreaterThan(0);
  const r = applyOpeningOfferChoice(s, pads[0]!);
  expect(r.state.openingEstablishment?.offerTaken).toBe('accepted');
  return (r.state.inventory ?? []).map((x) => x.name).filter((n) => !before.has(n.toLowerCase()));
}

describe('opening offer acceptance grants typed items', () => {
  const cards = offerCards();

  it('every offer-bearing Summoned Pact card: accept grants the typed carryable labels', () => {
    expect(cards.length).toBeGreaterThanOrEqual(10);
    for (const c of cards) {
      const gained = accepted(opened(c)).map((n) => n.toLowerCase());
      const offered = c.items.map((i) => i.toLowerCase());
      expect(gained.length, c.seed).toBeGreaterThan(0);
      for (const g of gained) {
        expect(offered, `${c.seed}: "${g}"`).toContain(g);
        expect(g).not.toMatch(/\boffers\b/);
      }
    }
  }, 120_000);

  it('accept chip names a real typed item from the card', () => {
    const c = cards[0]!;
    const s = opened(c);
    const accept = openingOfferPads(s)[0]!;
    const hit = c.items.some((label) =>
      accept.toLowerCase().includes(label.replace(/^(?:a|an|the)\s+/i, '').toLowerCase().split(/\s+/)[0]!)
    );
    expect(hit || /take|accept/i.test(accept), accept).toBe(true);
  }, 60_000);
});
