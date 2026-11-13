/**
 * PR41: only carryable objects from an opening offer become inventory. A place given (a bunk) or words
 * given (a cover story) is honoured as a benefit on the offer record and in the receipt, not carried.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES, getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { compileOpeningOffer, isCarryableOfferItem, openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState } from './types';

type Card = { bible: string; seed: string; offer: string };
function offerCards(): Card[] {
  const out: Card[] = [];
  for (const bible of ALL_CAMPAIGN_BIBLES) {
    if (!(bible.openingHooks ?? []).some((h) => (h as { openingOffer?: string }).openingOffer)) continue;
    const seen = new Set<string>();
    for (let i = 0; i < 1500; i++) {
      const p = resolveOpeningHookPick(getCampaignBibleById(bible.id)!, String(i));
      if (!p?.text || seen.has(p.text)) continue;
      seen.add(p.text);
      if (!p.openingOffer || !compileOpeningOffer(`Opening offer: ${p.openingOffer}`)) continue;
      out.push({ bible: bible.id, seed: String(i), offer: p.openingOffer });
    }
  }
  return out;
}
function opened(c: Card): GameState {
  const s = newGameState(c.bible, { seed: c.seed, liveOpening: true });
  return { ...s, turn: 1, openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true } } as GameState;
}
function accept(s: GameState) {
  const before = new Set((s.inventory ?? []).map((x) => x.name.toLowerCase()));
  const r = applyOpeningOfferChoice(s, openingOfferPads(s)[0]!);
  const gained = (r.state.inventory ?? []).map((x) => x.name).filter((n) => !before.has(n.toLowerCase()));
  const benefits = r.state.openingEstablishment?.card?.offer?.benefits ?? [];
  return { r, gained, benefits };
}

describe('opening offer: carryables go to inventory, places / words stay benefits', () => {
  const cards = offerCards();

  it('head-noun rule', () => {
    for (const t of ['knife', 'room-key', 'heel of bread', 'citizenship papers', 'short line', 'pass', 'little coin']) {
      expect(isCarryableOfferItem(t), t).toBe(true);
    }
    for (const t of ['bunk', 'a berth', 'seat at the table', 'story', 'cover story', 'rank']) {
      expect(isCarryableOfferItem(t), t).toBe(false);
    }
  });

  it('every offer card: each granted inventory item is a carryable object; something is granted', () => {
    expect(cards.length).toBeGreaterThanOrEqual(38);
    for (const c of cards) {
      const { r, gained, benefits } = accept(opened(c));
      expect(r.state.openingEstablishment?.offerTaken, c.offer).toBe('accepted');
      for (const g of gained) expect(isCarryableOfferItem(g), `${c.seed}: "${g}"`).toBe(true);
      expect(gained.length + benefits.length, `${c.seed}: ${c.offer}`).toBeGreaterThan(0);
    }
  }, 120_000);

  it('seed 14 "a mask and a story": mask carried, the story is a benefit on the record + receipt', () => {
    const c = cards.find((x) => x.bible === 'summoned-pact' && /a mask and a story/.test(x.offer))!;
    const { r, gained, benefits } = accept(opened(c));
    expect(gained.map((g) => g.toLowerCase())).toEqual(['mask']);
    expect(benefits).toEqual(['story']);
    expect(r.receipts.join(' | ')).toMatch(/not carried\): story/);
  }, 60_000);

  it('the crew-kit card (knife, oilskin, a bunk): the bunk is lodging, not inventory', () => {
    const c = cards.find((x) => x.bible === 'summoned-pact' && /kit you as crew/.test(x.offer))!;
    const { gained, benefits } = accept(opened(c));
    expect(gained.map((g) => g.toLowerCase()).sort()).toEqual(['knife', 'oilskin']);
    expect(benefits).toEqual(['bunk']);
  }, 60_000);

  it('an older record that still lists "bunk" as an item is split at accept time', () => {
    const c = cards.find((x) => x.bible === 'summoned-pact' && /kit you as crew/.test(x.offer))!;
    const s = opened(c);
    const est = s.openingEstablishment!;
    const old = { ...s, openingEstablishment: { ...est, card: { ...est.card!, offer: { ...est.card!.offer!, items: ['knife', 'oilskin', 'bunk'], benefits: undefined } } } } as GameState;
    const { gained, benefits } = accept(old);
    expect(gained.map((g) => g.toLowerCase())).not.toContain('bunk');
    expect(benefits).toEqual(['bunk']);
  }, 60_000);
});
