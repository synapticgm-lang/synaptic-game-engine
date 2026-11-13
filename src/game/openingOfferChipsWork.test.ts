/**
 * Every offer chip shown must work. A no-offer card ("No one offers kit…", salvage-or-leave) mints no
 * offer chips; an offer card's accept / refuse resolve on click (PR38 re-review, 13 Nov).
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES, getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { compileOpeningOffer, openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import { commitOfferedPad } from './playTranscript';
import { isFreeInputChip } from './sceneAffordances';
import type { GameState } from './types';

/** One seed per distinct opening card of a bible (the same picker New Game uses). */
function seedsByCard(bibleId: string): Map<string, { seed: string; offer: string }> {
  const bible = getCampaignBibleById(bibleId)!;
  const out = new Map<string, { seed: string; offer: string }>();
  for (let i = 0; i < 1500; i++) {
    const picked = resolveOpeningHookPick(bible, String(i));
    const key = picked?.text ?? '';
    if (key && !out.has(key)) out.set(key, { seed: String(i), offer: picked?.openingOffer ?? '' });
  }
  return out;
}

const isNoOffer = (offer: string) => !compileOpeningOffer(`Opening offer: ${offer}`);

/** Page 1 as the live writer leaves it: the scene, with the card's offer voiced when there is one. */
function pageOne(state: GameState, offer = ''): GameState {
  const content = ['Light, then quiet. You are on the floor; the panel waits.', isNoOffer(offer) ? '' : offer].filter(Boolean).join(' ');
  return {
    ...state,
    turn: 1,
    log: [{ id: 'g0', turn: 0, role: 'gm', content, timestamp: 0 }],
    openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true },
  } as GameState;
}

describe('offer chips: none for a no-offer card, working ones for an offer card', () => {
  const pact = seedsByCard('summoned-pact');
  const noOffer = [...pact.values()].filter((c) => isNoOffer(c.offer));

  it('the 6 summoned-pact no-offer cards mint no offer chips and keep 4 normal pads', () => {
    expect(noOffer).toHaveLength(6);
    for (const { seed, offer } of noOffer) {
      const s = pageOne(newGameState('summoned-pact', { seed, liveOpening: true }));
      expect(s.openingEstablishment?.instance?.offerChips ?? [], offer).toEqual([]);
      expect(s.openingEstablishment?.card?.offer, offer).toBeUndefined();
      expect(openingOfferPads(s), offer).toEqual([]);
      const pads = (commitOfferedPad({ ...s, offeredPad: null }).offeredPad?.choices ?? []).filter((c) => !isFreeInputChip(c));
      expect(pads, `${offer}: ${pads.join('|')}`).toHaveLength(4);
      expect(pads.some((c) => /^keep your own kit$|^hear .+ out$|^accept the offer$/i.test(c)), pads.join('|')).toBe(false);
    }
  }, 60_000);

  it('offer cards (sampled across premades) yield accept / refuse chips that resolve on click', () => {
    let checked = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (!(bible.openingHooks ?? []).some((h) => (h as { openingOffer?: string }).openingOffer)) continue;
      const cards = [...seedsByCard(bible.id).values()].filter((c) => c.offer && !isNoOffer(c.offer));
      // Every other offer card keeps the run lean while covering each premade.
      for (const { seed, offer } of cards.filter((_, i) => i % 2 === 0)) {
        const s = pageOne(newGameState(bible.id, { seed, liveOpening: true }), offer);
        const chips = s.openingEstablishment?.instance?.offerChips ?? [];
        const accept = chips.find((c) => c.kind === 'accept');
        const refuse = chips.find((c) => c.kind === 'refuse');
        expect(accept && refuse, `${bible.id}: ${offer}`).toBeTruthy();
        expect(s.openingEstablishment?.card?.offer ?? compileOpeningOffer(s.openingEstablishment?.pickedHook), offer).toBeTruthy();
        expect(openingOfferPads(s), offer).toEqual(chips.map((c) => c.label));
        for (const chip of chips.filter((c) => c.kind === 'accept')) {
          const took = applyOpeningOfferChoice(s, chip.label);
          expect(took.state.openingEstablishment?.offerTaken, `${bible.id} accept "${chip.label}"`).toBeTruthy();
          expect(took.receipts.length, chip.label).toBeGreaterThan(0);
          expect(openingOfferPads(took.state)).toEqual([]);
        }
        const refused = applyOpeningOfferChoice(s, refuse!.label);
        expect(refused.state.openingEstablishment?.offerTaken, `${bible.id} refuse "${refuse!.label}"`).toBe('refused');
        expect(openingOfferPads(refused.state)).toEqual([]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(10);
  }, 60_000);

  it('an old save with chips but no offer record hides them', () => {
    const { seed } = noOffer[0]!;
    const s = pageOne(newGameState('summoned-pact', { seed, liveOpening: true }));
    const old = {
      ...s,
      openingEstablishment: {
        ...s.openingEstablishment!,
        instance: {
          ...s.openingEstablishment!.instance!,
          offerChips: [
            { kind: 'accept', label: 'Take the scrap', note: '' },
            { kind: 'refuse', label: 'Keep your own kit', note: '' },
          ],
        },
      },
    } as GameState;
    expect(openingOfferPads(old)).toEqual([]);
  });
});
