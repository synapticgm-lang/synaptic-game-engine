/**
 * PR39 (live check on dec9e118): the offer pair relabels together; one clean accept + one refuse per
 * offer; the choice filter keeps live offer chips.
 */
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { ALL_CAMPAIGN_BIBLES, getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { compileOpeningOffer, openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyReplacements } from './openingInstance';
import { applyOpeningOfferChoice } from './openingOffer';
import { filterInventedContextChoices } from './choiceWarden';
import type { GameState } from './types';

type Card = { bible: string; seed: string; offer: string; page1: string };
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
      out.push({ bible: bible.id, seed: String(i), offer: p.openingOffer, page1: p.page1 || p.fallback || '' });
    }
  }
  return out;
}
function pageOne(state: GameState, prose: string, extra: Partial<GameState> = {}): GameState {
  const map = state.openingEstablishment?.instance?.nameMap ?? [];
  return {
    ...state,
    turn: 1,
    log: [{ id: 'g0', turn: 0, role: 'gm', content: applyReplacements(prose, map), timestamp: 0 }],
    openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true },
    ...extra,
  } as GameState;
}
const GARBLED = /\boffer of [A-Z]|^Take the [A-Z]|\boffer of (?:sign|sit|kneel|read|swear|take|join)\b|\bcopied line\b|^Sign the blank$/;

describe('PR39 opening offer labels', () => {
  const cards = offerCards();

  it('every offer card: exactly ONE accept and ONE refuse chip, clean labels, both resolve (writes a table)', () => {
    const rows: string[] = ['| # | premade | seed | accept chip | refuse chip | page-1 pair |', '|---|---|---|---|---|---|'];
    cards.forEach((c, n) => {
      const s = pageOne(newGameState(c.bible, { seed: c.seed, liveOpening: true }), c.page1);
      const chips = s.openingEstablishment?.instance?.offerChips ?? [];
      expect(chips.map((x) => x.kind), c.offer).toEqual(['accept', 'refuse']);
      const [accept, refuse] = chips;
      expect(accept!.label, c.offer).not.toMatch(GARBLED);
      expect(accept!.label, c.offer).toMatch(/^[A-Z]/);
      const pads = openingOfferPads(s);
      expect(pads, `${c.seed}: ${pads.join('|')}`).toHaveLength(2);
      expect(applyOpeningOfferChoice(s, pads[0]!).state.openingEstablishment?.offerTaken, pads[0]).toBe('accepted');
      expect(applyOpeningOfferChoice(s, pads[1]!).state.openingEstablishment?.offerTaken, pads[1]).toBe('refused');
      rows.push(`| ${n + 1} | ${c.bible} | ${c.seed} | ${accept!.label} | ${refuse!.label} | ${pads.join(' / ')} |`);
    });
    expect(cards.length).toBeGreaterThanOrEqual(37);
    writeFileSync('/tmp/pr39-offer-labels.md', rows.join('\n') + '\n');
  }, 120_000);

  it('1. either label names an unseen item → BOTH go noun-free with the same giver', () => {
    const card = cards.find((c) => /kit you as crew/.test(c.offer))!;
    const base = newGameState(card.bible, { seed: card.seed, liveOpening: true });
    const giver = base.openingEstablishment!.instance!.cast[0]!.name.split(' ')[0]!;
    // Accept ("Keep X's secret") is grounded; refuse ("Keep your own kit") is not: no "kit" on the page.
    const s = pageOne(base, `Salt and pitch. ${giver} sets a crate by the chalk line. "Keep the secret and it's yours."`);
    expect(openingOfferPads(s)).toEqual([`Accept ${giver}'s offer`, `Turn down ${giver}'s offer`]);
  });

  it("1. John's live mixed pair ('Accept Brannoc's offer' / 'Keep your own kit') heals to one giver, then stays", () => {
    const card = cards.find((c) => /kit you as crew/.test(c.offer))!;
    const base = newGameState(card.bible, { seed: card.seed, liveOpening: true });
    const giver = base.openingEstablishment!.instance!.cast[0]!.name.split(' ')[0]!;
    const shown = [`Accept ${giver}'s offer`, 'Keep your own kit', 'Look around', 'Wait and listen'];
    const s = pageOne(base, 'A crate by the chalk line.', { choices: shown });
    const pair = openingOfferPads(s);
    expect(pair).toEqual([`Accept ${giver}'s offer`, `Turn down ${giver}'s offer`]);
    const later = { ...s, choices: [...pair, 'Look around', 'Wait and listen'], log: [...(s.log ?? []), { id: 'g1', turn: 1, role: 'gm', content: 'The kit: a knife, an oilskin, a bunk. Keep the secret.', timestamp: 1 }] } as GameState;
    expect(openingOfferPads(later)).toEqual(pair);
    // A grounded concrete pair, once shown, also stays.
    const grounded = pageOne(base, 'Keep the secret, they say. Your own kit is Earth clothes.');
    const concrete = openingOfferPads(grounded);
    expect(concrete[1]).toBe('Keep your own kit');
    expect(openingOfferPads({ ...grounded, choices: concrete, log: [...(grounded.log ?? []), { id: 'g1', turn: 1, role: 'gm', content: 'A crate.', timestamp: 1 }] } as GameState)).toEqual(concrete);
  });

  it('2. action clauses become the accept action, not an item ("Sit the audit for Dunn")', () => {
    const want: Array<[RegExp, RegExp]> = [
      [/^Sit the audit and/, /^Sit the audit for \S+$/],
      [/^Sign the blank and/, /^Sign the blank for \S+$/],
      [/^Kneel the doctrine and/, /^Kneel the doctrine/],
      [/^Read the one page/, /^Read the one page they allow$/],
    ];
    for (const [offer, label] of want) {
      const c = cards.find((x) => offer.test(x.offer))!;
      const s = newGameState(c.bible, { seed: c.seed, liveOpening: true });
      expect(s.openingEstablishment!.instance!.offerChips[0]!.label, c.offer).toMatch(label);
    }
  });

  it('3. the choice filter keeps live offer chips (no "Removed unbound chip")', () => {
    const card = cards.find((c) => /kit you as crew/.test(c.offer))!;
    const s = pageOne(newGameState(card.bible, { seed: card.seed, liveOpening: true }), 'A crate by the chalk line.');
    const pair = openingOfferPads(s);
    const kept = filterInventedContextChoices([...pair, 'Ask the moon for a sandwich'], s);
    expect(kept).toEqual(expect.arrayContaining(pair));
    // The other form of the pair (a pass whose prose picks the concrete labels) is still a live offer chip.
    const grounded = pageOne(newGameState(card.bible, { seed: card.seed, liveOpening: true }), 'Keep the secret, they say. Your own kit is Earth clothes.');
    const concrete = openingOfferPads(grounded);
    expect(concrete).not.toEqual(pair);
    expect(filterInventedContextChoices([...pair], grounded)).toEqual(pair);
    // Once the offer is refused the chips are no longer live and fall to the normal binding rule.
    const refused = applyOpeningOfferChoice(s, pair[1]!).state;
    expect(openingOfferPads(refused)).toEqual([]);
    expect(filterInventedContextChoices([...pair], refused)).toEqual([]);
  });
});
