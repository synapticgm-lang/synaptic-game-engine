import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import {
  applySuccessfulLiveOpening,
  deriveOpeningJournal,
  askPadFor,
  mockLiveOpeningProse,
  shapeOpeningPads,
  validateLiveOpeningProse,
  writeLiveOpening,
  STORYTELLER_RETRY_MESSAGE,
} from './liveOpening';
import { riteEntryForState } from './openingRiteFacts';
import type { GameState, Settings } from './types';

const cinder: OpeningHookSnapshot = {
  location: 'the ash-heat of Cinderwake Trail',
  whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
  openingOffer:
    "Brother Oren's waterskin and a scarf, or Kessa's brand-iron, or neither — both are offers, not your gear.",
  pressingNeed: 'The Pellane scouts want an answer.',
  page1:
    'Heat rises off the ash of Cinderwake Trail. You are lying on your back in a scorched circle on the trail.',
};

const settings = { contentMode: 'adult' } as Settings;

function game(engineMode: GameState['engineMode'] = 'litrpg', seed = 'live-1'): GameState {
  const base = {
    ...createInitialState('The Summoned Pact', engineMode),
    seed,
    campaignBibleId: 'summoned-pact',
  };
  return attachOpeningInstance(base, cinder, cinder.page1);
}

describe('liveOpening', () => {
  it('rejects vague salad, missing locked names, and authored reprints', () => {
    const state = game();
    expect(validateLiveOpeningProse(state, 'Someone here looks at you. A figure waits.')).toEqual(
      expect.arrayContaining([expect.stringMatching(/salad|missing/i)])
    );
    const inst = state.openingEstablishment!.instance!;
    expect(
      validateLiveOpeningProse(
        state,
        `${inst.placeName} is already under you, named and ordinary, not a blur. ${inst.cast[0]!.name} is waiting with a waterskin half raised. The offer is water and a scarf, or a brand-iron, or you keep your own kit and walk on.`
      )
    ).toEqual([]);
    expect(validateLiveOpeningProse(state, cinder.page1 ?? '')).not.toEqual([]);
  });

  it('mock prose passes validation and pads follow the offer with exact counts', () => {
    const litrpg = game('litrpg');
    const tabletop = game('dnd');
    const proseL = mockLiveOpeningProse(litrpg);
    const proseT = mockLiveOpeningProse(tabletop);
    expect(validateLiveOpeningProse(litrpg, proseL)).toEqual([]);
    expect(validateLiveOpeningProse(tabletop, proseT)).toEqual([]);
    const padsL = shapeOpeningPads(litrpg, proseL);
    const padsT = shapeOpeningPads(tabletop, proseT);
    expect(padsL).toHaveLength(4);
    expect(padsT).toHaveLength(3);
    expect(padsL.some((p) => /Keep your own kit/i.test(p))).toBe(true);
    expect(padsL.some((p) => /Accept the offer/i.test(p))).toBe(false);
  });

  it('journal and rite wording come from the live instance, not Pellane or Orel Vane', () => {
    const state = game();
    const prose = mockLiveOpeningProse(state);
    const journal = deriveOpeningJournal(state, prose);
    expect(journal.title).not.toMatch(/Pellane/i);
    expect(journal.title).not.toMatch(/^Hear \S+ out$/i);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(journal.title).not.toMatch(/\w…|…\w/);
    // Pellane is a summoned-pact hub still on the map; pressing may mention the scouts.
    expect(journal.description).not.toMatch(/Orel Vane|High Chanter/i);
    expect(journal.title + journal.description).toMatch(
      new RegExp(state.openingEstablishment!.instance!.cast[0]!.name.split(/\s+/)[0]!, 'i')
    );
    const committed = applySuccessfulLiveOpening(state, prose);
    const rite = riteEntryForState(committed);
    expect(rite?.giver).not.toMatch(/Orel Vane/i);
    expect(rite?.acceptChip).not.toBe('Sign the pact');
    expect(rite?.refuseChip).toMatch(/Keep your own kit/i);
    expect(committed.quests?.some((q) => q.revealed && /Hear why Pellane wanted you/i.test(q.name))).toBe(false);
  });

  it('retries once on a failed draft, then surfaces a retry state instead of authored prose', async () => {
    const state = game();
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        if (calls === 1) return 'Someone here looks over. A figure waits in the heat.';
        return mockLiveOpeningProse(state);
      },
    });
    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.retried).toBe(true);

    const fail = await writeLiveOpening(state, settings, {
      writer: async () => 'Someone here looks over. A figure waits in the heat.',
    });
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.error).toBe(STORYTELLER_RETRY_MESSAGE);
  });

  it('does not treat shared setting words or pronouns as a validation fail', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away.`,
      'They have not put a blade in your hand.',
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit.',
      'Heat rises off the ash, but the sentences are newly written for this run.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, prose)).toEqual([]);
  });

  it('does not fail validation on a common word from a multi-word retired place', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const retired = inst.retiredNames.join(' ');
    expect(retired).toMatch(/Oren/i);
    expect(retired).not.toMatch(/Cinderwake/i);
    const prose = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away.`,
      'They walk the trail. The salt wind and the heat are ordinary weather, not a catalog place.',
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, prose)).toEqual([]);
    const leak = `${prose} Brother Oren is still standing on the old trail.`;
    expect(validateLiveOpeningProse(state, leak).some((e) => /retired name/i.test(e))).toBe(true);
  });

  it('does not treat the honorific "brother" as a retired-name leak', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.retiredNames.join(' ')).toMatch(/Oren/i);
    const prose = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away.`,
      'His brother is not in this scene, and no catalog chanter is named.',
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, prose)).toEqual([]);
    const leak = `${prose} Brother Oren is still standing on the old trail.`;
    expect(validateLiveOpeningProse(state, leak).some((e) => /retired name/i.test(e))).toBe(true);
  });

  it('does not fail validation on the common word cinder', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away.`,
      'A cinder stuck to his shoe, ordinary ash, not a catalog surname.',
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, prose)).toEqual([]);
  });

  it('phrases ask-pads from the prose pronoun and does not default to they', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const he = inst.cast[0]!;
    const proseHe = `${inst.placeName} holds. ${he.name} stands in the ash. He has a waterskin half raised. The offer is water, or you keep your own kit.`;
    expect(askPadFor(he.name, proseHe)).toMatch(new RegExp(`Ask ${he.name.split(/\s+/)[0]} what he's after`));
    expect(askPadFor(he.name, proseHe)).not.toMatch(/what they want/i);
    const theyProse = `${inst.placeName} holds. ${he.name} is here. The offer is water, or you keep your own kit.`;
    expect(askPadFor(he.name, theyProse)).toMatch(/about the deal/i);
    const noOffer: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: { ...inst, offerChips: inst.offerChips.filter((c) => c.kind === 'refuse') },
      },
    };
    const pads = shapeOpeningPads(noOffer, proseHe);
    expect(pads).toHaveLength(4);
    expect(pads.some((p) => /what they want/i.test(p))).toBe(false);
    expect(pads.some((p) => new RegExp(he.name.split(/\s+/)[0]!, 'i').test(p) || new RegExp(inst.placeName, 'i').test(p))).toBe(true);
  });

  it('derives a short whole-word journal title and does not clip inside working', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const emptyOffer: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: { ...inst, offerSummary: undefined, offerChips: inst.offerChips.filter((c) => c.kind === 'refuse') },
      },
    };
    const prose = `${inst.placeName} is under you. ${inst.cast[0]!.name} waits. Long-handled scrapers working the ash are not an offer. Heat rises. You keep your own kit.`;
    const journal = deriveOpeningJournal(emptyOffer, prose);
    expect(journal.title).not.toMatch(/Ng-handled|scrapers working/i);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(journal.title.length).toBeGreaterThan(3);
  });

  it('does not title the journal from a hear-them-out reason note', () => {
    const state = game('dnd', 'journal-reason');
    const inst = state.openingEstablishment!.instance!;
    const withReason: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: {
          ...inst,
          offerSummary: undefined,
          offerChips: [
            { kind: 'accept', label: `Hear ${inst.cast[0]!.name.split(/\s+/)[0]} out`, note: `${inst.cast[0]!.name} is here with a reason — hear it before you decide.` },
            inst.offerChips.find((c) => c.kind === 'refuse')!,
          ],
        },
      },
    };
    const prose = `${inst.placeName} keeps still. ${inst.cast[0]!.name} waits among the stones with a lantern. You keep your own kit.`;
    const journal = deriveOpeningJournal(withReason, prose);
    expect(journal.title).not.toMatch(/is here with a reason/i);
    expect(journal.title).not.toMatch(new RegExp(`${inst.cast[0]!.name.split(/\s+/)[0]}'s ${inst.cast[0]!.name}`, 'i'));
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(journal.title).toMatch(new RegExp(inst.cast[0]!.name.split(/\s+/)[0]!, 'i'));
  });

  it('two seeds produce different mock openings', () => {


    const a = game('litrpg', 'seed-a');
    const b = game('litrpg', 'seed-b');
    const pa = mockLiveOpeningProse(a);
    const pb = mockLiveOpeningProse(b);
    expect(pa).not.toBe(pb);
    expect(a.openingEstablishment?.instance?.cast.map((c) => c.name).join()).not.toBe(
      b.openingEstablishment?.instance?.cast.map((c) => c.name).join()
    );
  });
});
