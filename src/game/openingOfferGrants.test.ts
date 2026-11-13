/**
 * PR40: accepting any opening offer grants the concrete items the card offered — never a chip note
 * ("Nell offers a deal", seeds 21 / 66) or an action clause ("Sign the blank") as loot.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES, getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { compileOpeningOffer, openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
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
const NOT_AN_ITEM = /\boffers\b|\ba deal\b|^(?:sign|sit|kneel|read|swear|take|join|walk|stay) (?:the|a|an|as|with)\b|^(?:work|job|pact|oath|contract)$/i;

function accepted(s: GameState): string[] {
  const before = new Set((s.inventory ?? []).map((x) => x.name.toLowerCase()));
  const r = applyOpeningOfferChoice(s, openingOfferPads(s)[0]!);
  expect(r.state.openingEstablishment?.offerTaken).toBe('accepted');
  return (r.state.inventory ?? []).map((x) => x.name).filter((n) => !before.has(n.toLowerCase()));
}

describe('opening offer acceptance grants what was offered', () => {
  const cards = offerCards();

  it('every offer-bearing card: accept grants ≥1 named item from the offer, never a note or action', () => {
    expect(cards.length).toBeGreaterThanOrEqual(38);
    for (const c of cards) {
      const s = opened(c);
      const offered = compileOpeningOffer(`Opening offer: ${c.offer}`)!.items.map((i) => i.toLowerCase());
      const gained = accepted(s);
      expect(gained.length, `${c.seed}: ${c.offer}`).toBeGreaterThan(0);
      for (const g of gained) {
        expect(g, `${c.seed}: ${c.offer}`).not.toMatch(NOT_AN_ITEM);
        // Names follow the minted cast, so compare on the item words, not catalog names.
        expect(offered.some((o) => o.split(/\s+/).pop() === g.toLowerCase().split(/\s+/).pop()), `${c.seed}: "${g}" vs ${offered.join(', ')}`).toBe(true);
      }
    }
  }, 120_000);

  it('seeds 21 and 66: the real items (militia armband / short blade; weapon), not "offers a deal"', () => {
    const by = (seed: string) => cards.find((c) => c.bible === 'summoned-pact' && c.seed === seed)!;
    expect(accepted(opened(by('21'))).map((n) => n.toLowerCase())).toEqual(expect.arrayContaining(['militia armband', 'short blade']));
    expect(accepted(opened(by('66'))).map((n) => n.toLowerCase())).toEqual(['weapon']);
  }, 60_000);

  it('an older save whose record items are chip notes heals from the card text on accept', () => {
    const c = cards.find((x) => x.bible === 'summoned-pact' && x.seed === '21')!;
    const s = opened(c);
    const est = s.openingEstablishment!;
    const old = { ...s, openingEstablishment: { ...est, card: { ...est.card!, offer: { ...est.card!.offer!, items: ['Nell Thatch offers a deal'] } } } } as GameState;
    const gained = accepted(old).map((n) => n.toLowerCase());
    expect(gained).toEqual(expect.arrayContaining(['militia armband', 'short blade']));
    expect(gained.some((g) => /offers/.test(g))).toBe(false);
  }, 60_000);
});
