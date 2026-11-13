/**
 * Every offer chip shown must work, and accept / refuse are a pair (PR38 r2–r3 review, 13 Nov).
 * A no-offer card mints no offer chips. An offer card always shows both chips while the offer is live;
 * a label naming an item the page has not shown is relabelled noun-free, and both forms resolve on click.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES, getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { compileOpeningOffer, openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyReplacements } from './openingInstance';
import { applyOpeningOfferChoice } from './openingOffer';
import { commitOfferedPad } from './playTranscript';
import { isFreeInputChip } from './sceneAffordances';
import type { GameState } from './types';

type Card = { seed: string; offer: string; page1: string };

/** One seed per distinct opening card of a bible (the same picker New Game uses). */
function seedsByCard(bibleId: string): Card[] {
  const bible = getCampaignBibleById(bibleId)!;
  const out = new Map<string, Card>();
  for (let i = 0; i < 1500; i++) {
    const picked = resolveOpeningHookPick(bible, String(i));
    const key = picked?.text ?? '';
    if (key && !out.has(key)) {
      out.set(key, { seed: String(i), offer: picked?.openingOffer ?? '', page1: picked?.page1 || picked?.fallback || '' });
    }
  }
  return [...out.values()];
}

const isNoOffer = (offer: string) => !compileOpeningOffer(`Opening offer: ${offer}`);

/** Page 1 committed with the given prose (authored page 1, names swapped to the minted cast). */
function pageOne(state: GameState, prose: string): GameState {
  const map = state.openingEstablishment?.instance?.nameMap ?? [];
  return {
    ...state,
    turn: 1,
    log: [{ id: 'g0', turn: 0, role: 'gm', content: applyReplacements(prose, map), timestamp: 0 }],
    openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true },
  } as GameState;
}

const ITEM_NOUNS = /\b(?:kit|cloak|blade|knife|coat|crate|chit|tabard|armband|staff|papers?|pass|relic|weapon|coin|wraps|oilskin|bunk|lamp|scarf|waterskin|vial|bread|gloves|key|gear|robe|boots|rope|bag|ration|sword|shield|axe|spear|bow|mark)\b/gi;
function namesAbsentItem(label: string, prose: string): string | null {
  for (const n of label.match(ITEM_NOUNS) ?? []) {
    if (!new RegExp(`\\b${n.toLowerCase().replace(/s$/, '')}`, 'i').test(prose)) return n;
  }
  return null;
}
/** The pair names one giver: every noun-free "X's offer" names the same X, and that X is the accept side's. */
function expectOneGiver(pads: string[], accepts: string[], tag: string) {
  const plain = [...new Set(pads.map((l) => l.match(/^(?:Accept|Turn down) (\S+?)['’]s offer$/)?.[1]).filter(Boolean))];
  expect(plain.length, `${tag}: ${pads.join('|')}`).toBeLessThanOrEqual(1);
  if (plain[0]) {
    expect(accepts.some((a) => new RegExp(`\\b${plain[0]}\\b`).test(a)), `${tag}: ${pads.join('|')}`).toBe(true);
  }
}
const engine = (pads: string[]) => pads.filter((c) => !isFreeInputChip(c));

/** Both chips show, name no unseen item, sit in exactly 4 pads, and each resolves + clears on click. */
function checkPair(s: GameState, tag: string) {
  const pads = openingOfferPads(s);
  const prose = String(s.log?.[0]?.content ?? '');
  const accepts = pads.filter((l) => applyOpeningOfferChoice(s, l).state.openingEstablishment?.offerTaken && applyOpeningOfferChoice(s, l).state.openingEstablishment?.offerTaken !== 'refused');
  const refuses = pads.filter((l) => applyOpeningOfferChoice(s, l).state.openingEstablishment?.offerTaken === 'refused');
  expect(accepts.length, `${tag}: ${pads.join('|')}`).toBeGreaterThan(0);
  expect(refuses.length, `${tag}: ${pads.join('|')}`).toBe(1);
  expect(accepts.length + refuses.length, `${tag}: every chip resolves`).toBe(pads.length);
  for (const l of pads) expect(namesAbsentItem(l, prose), `${tag}: "${l}" vs page 1`).toBeNull();
  expectOneGiver(pads, accepts, tag);
  for (const l of pads) {
    const after = applyOpeningOfferChoice(s, l);
    expect(after.receipts.length, `${tag}: ${l}`).toBeGreaterThan(0);
    expect(openingOfferPads(after.state)).toEqual([]);
  }
  const committed = engine(commitOfferedPad({ ...s, offeredPad: null }).offeredPad?.choices ?? []);
  expect(committed, `${tag}: ${committed.join('|')}`).toHaveLength(4);
  expect(committed, tag).toEqual(expect.arrayContaining([accepts[0]!, refuses[0]!]));
}

describe('offer chips: none for a no-offer card, a working pair for an offer card', () => {
  const pactNoOffer = seedsByCard('summoned-pact').filter((c) => isNoOffer(c.offer));

  it('the 6 summoned-pact no-offer cards mint no offer chips and keep 4 normal pads', () => {
    expect(pactNoOffer).toHaveLength(6);
    for (const { seed, offer, page1 } of pactNoOffer) {
      const s = pageOne(newGameState('summoned-pact', { seed, liveOpening: true }), page1);
      expect(s.openingEstablishment?.instance?.offerChips ?? [], offer).toEqual([]);
      expect(s.openingEstablishment?.card?.offer, offer).toBeUndefined();
      expect(openingOfferPads(s), offer).toEqual([]);
      const pads = engine(commitOfferedPad({ ...s, offeredPad: null }).offeredPad?.choices ?? []);
      expect(pads, `${offer}: ${pads.join('|')}`).toHaveLength(4);
      expect(pads.some((c) => /^keep your own kit$|^hear .+ out$|offer$/i.test(c)), pads.join('|')).toBe(false);
    }
  }, 60_000);

  it('every offer card, on its authored page 1: both chips, no unseen item named, clicks resolve and clear', () => {
    let checked = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (!(bible.openingHooks ?? []).some((h) => (h as { openingOffer?: string }).openingOffer)) continue;
      for (const { seed, offer, page1 } of seedsByCard(bible.id).filter((c) => c.offer && !isNoOffer(c.offer))) {
        const s = pageOne(newGameState(bible.id, { seed, liveOpening: true }), page1);
        checkPair(s, `${bible.id} "${offer.slice(0, 50)}"`);
        checked++;
      }
    }
    expect(checked).toBe(38);
  }, 120_000);

  it('a live-AI page 1 that says "crate" / "gear" still shows both chips, noun-free', () => {
    const card = seedsByCard('summoned-pact').find((c) => /kit you as crew/.test(c.offer))!;
    const base = newGameState('summoned-pact', { seed: card.seed, liveOpening: true });
    const lead = base.openingEstablishment!.instance!.cast[0]!.name;
    const s = pageOne(base, `Salt and pitch. ${lead} sets a crate of gear by the chalk line. "Keep quiet about the circle and it's yours."`);
    checkPair(s, 'crate/gear page');
    const given = lead.split(' ')[0]!;
    expect(openingOfferPads(s)).toEqual(expect.arrayContaining([`Turn down ${given}'s offer`]));
  }, 60_000);

  it('review seeds 0, 12, 15, 22, 27, 158: the pair names the same giver', () => {
    for (const seed of ['0', '12', '15', '22', '27', '158']) {
      const picked = resolveOpeningHookPick(getCampaignBibleById('summoned-pact')!, seed);
      if (!picked?.openingOffer || isNoOffer(picked.openingOffer)) continue;
      const s = pageOne(newGameState('summoned-pact', { seed, liveOpening: true }), 'Salt and pitch. A crate sits by the chalk line.');
      const pads = openingOfferPads(s);
      const refuse = pads.find((l) => applyOpeningOfferChoice(s, l).state.openingEstablishment?.offerTaken === 'refused')!;
      const accepts = pads.filter((l) => l !== refuse);
      expect(accepts.length, pads.join('|')).toBeGreaterThan(0);
      // The refuse names a giver only when every accept is that same giver's.
      const who = refuse.match(/^Turn down (\S+?)['’]s offer$/)?.[1];
      if (who) {
        for (const a of accepts) expect(a, `seed ${seed}: ${pads.join('|')}`).toMatch(new RegExp(`\\b${who}\\b`));
      }
      expectOneGiver(pads, accepts, `seed ${seed}`);
    }
  }, 60_000);

  it('"kitchen" does not ground "kit"; "kits" does', () => {
    const card = seedsByCard('summoned-pact').find((c) => /kit you as crew/.test(c.offer))!;
    const base = newGameState('summoned-pact', { seed: card.seed, liveOpening: true });
    const kitchen = openingOfferPads(pageOne(base, 'Keep the secret, they say. Steam from the galley kitchen. A bunk, an oilskin, a knife on the table.'));
    expect(kitchen.some((l) => /\bkit\b/i.test(l)), kitchen.join('|')).toBe(false);
    const kits = openingOfferPads(pageOne(base, 'Keep the secret, they say. Crew kits hang by the bunk: an oilskin and a knife each.'));
    expect(kits.some((l) => /\bkit\b/i.test(l)), kits.join('|')).toBe(true);
  }, 60_000);

  it('labels stay stable once shown, even when later prose names the item', () => {
    const card = seedsByCard('summoned-pact').find((c) => /kit you as crew/.test(c.offer))!;
    const base = newGameState('summoned-pact', { seed: card.seed, liveOpening: true });
    const s = pageOne(base, 'Salt and pitch. A crate sits by the chalk line.');
    const shown = openingOfferPads(s);
    const later = {
      ...s,
      choices: shown,
      log: [...(s.log ?? []), { id: 'g1', turn: 1, role: 'gm', content: 'The kit is a knife, an oilskin and a bunk.', timestamp: 1 }],
    } as GameState;
    expect(openingOfferPads(later)).toEqual(shown);
  }, 60_000);

  it('an old save with chips but no offer record hides them', () => {
    const { seed, page1 } = pactNoOffer[0]!;
    const s = pageOne(newGameState('summoned-pact', { seed, liveOpening: true }), page1);
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
  }, 60_000);
});
