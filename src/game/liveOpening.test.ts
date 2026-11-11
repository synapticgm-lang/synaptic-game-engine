import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import {
  applySuccessfulLiveOpening,
  deriveOpeningJournal,
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
    expect(journal.description).not.toMatch(/Pellane/i);
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

  it('two seeds produce different mock openings', () => {
    const a = game('litrpg', 'seed-a');
    const b = game('litrpg', 'seed-b');
    const pa = mockLiveOpeningProse(a);
    const pb = mockLiveOpeningProse(b);
    expect(pa).not.toBe(pb);
    expect(a.openingEstablishment?.instance?.placeName).not.toBe(b.openingEstablishment?.instance?.placeName);
  });
});
