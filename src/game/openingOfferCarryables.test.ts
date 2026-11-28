/**
 * Brief 02: carryable vs benefit comes from typed offer.items[].carryable — not head-noun English.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { openingHookHasTypedData, type OpeningBeatCard } from '@/data/campaigns/types';
import { newGameState } from './newGameTestState';
import { offerRecordFromTypedData, openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState } from './types';

function typedOfferCards(bibleId: string) {
  const bible = getCampaignBibleById(bibleId)!;
  const out: Array<{ seed: string; card: OpeningBeatCard }> = [];
  const seen = new Set<string>();
  for (let i = 0; i < 1500; i++) {
    const seed = String(i);
    const p = resolveOpeningHookPick(bible, seed);
    if (!p?.offer?.items?.length || !p.text || seen.has(p.text)) continue;
    seen.add(p.text);
    out.push({ seed, card: p as OpeningBeatCard });
  }
  return out;
}

function opened(bibleId: string, seed: string): GameState {
  const s = newGameState(bibleId, { seed, liveOpening: true });
  return { ...s, turn: 1, openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true } } as GameState;
}

describe('opening offer: carryables from typed data', () => {
  it('offerRecordFromTypedData splits on the carryable flag', () => {
    const rec = offerRecordFromTypedData({
      items: [
        { id: 'a', label: 'knife', carryable: true },
        { id: 'b', label: 'oilskin', carryable: true },
        { id: 'c', label: 'a bunk', carryable: false },
        { id: 'd', label: 'story', carryable: false },
      ],
    });
    expect(rec?.items).toEqual(['knife', 'oilskin']);
    expect(rec?.benefits).toEqual(['a bunk', 'story']);
  });

  it('grain-ship crew kit: knife and oilskin inventory; bunk is a benefit', () => {
    const bible = getCampaignBibleById('summoned-pact')!;
    let seed = '';
    for (let i = 0; i < 1500; i++) {
      const p = resolveOpeningHookPick(bible, String(i));
      if (p?.offer?.items?.some((it) => it.id === 'sp-offer-bunk')) {
        seed = String(i);
        break;
      }
    }
    expect(seed).toBeTruthy();
    const s = opened('summoned-pact', seed);
    expect(openingHookHasTypedData(resolveOpeningHookPick(bible, seed)!)).toBe(true);
    const before = new Set((s.inventory ?? []).map((x) => x.name.toLowerCase()));
    const r = applyOpeningOfferChoice(s, openingOfferPads(s)[0]!);
    const gained = (r.state.inventory ?? []).map((x) => x.name).filter((n) => !before.has(n.toLowerCase()));
    const benefits = r.state.openingEstablishment?.card?.offer?.benefits ?? [];
    expect(gained.map((g) => g.toLowerCase()).sort()).toEqual(['knife', 'oilskin']);
    expect(benefits.map((b) => b.toLowerCase())).toContain('a bunk');
    expect(r.receipts.join(' | ')).toMatch(/not carried\):/);
  }, 60_000);

  it('every typed Summoned Pact offer card grants only carryable inventory items', () => {
    const cards = typedOfferCards('summoned-pact');
    expect(cards.length).toBeGreaterThanOrEqual(10);
    for (const c of cards) {
      const s = opened('summoned-pact', c.seed);
      const pads = openingOfferPads(s);
      if (!pads.length) continue;
      const carryable = new Set(
        (c.card.offer?.items ?? []).filter((it) => it.carryable).map((it) => it.label.toLowerCase())
      );
      const before = new Set((s.inventory ?? []).map((x) => x.name.toLowerCase()));
      const r = applyOpeningOfferChoice(s, pads[0]!);
      const gained = (r.state.inventory ?? []).map((x) => x.name).filter((n) => !before.has(n.toLowerCase()));
      for (const g of gained) {
        expect(carryable.has(g.toLowerCase()), `${c.seed}: "${g}"`).toBe(true);
      }
    }
  }, 120_000);
});
