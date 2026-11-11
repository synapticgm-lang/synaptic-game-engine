import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import {
  applySuccessfulLiveOpening,
  deriveOpeningJournal,
  askPadFor,
  isBlankOpeningProse,
  mockLiveOpeningProse,
  optionsAreNearDuplicates,
  shapeOpeningPads,
  validateLiveOpeningProse,
  validateOpeningOptions,
  writeLiveOpening,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
} from './liveOpening';
import {
  extractOpeningJsonStringField,
  formatLaterTurnNameRail,
  looksLikeOpeningStructuredText,
  readOpeningStructuredOutput,
  recoverOpeningNarration,
  unescapeExtractedString,
} from './openingWriterNotes';
import { riteEntryForState } from './openingRiteFacts';
import { ensureSystemReceipt, sanitizeOpeningNarration } from './openingEstablishment';
import { formatOpeningCardChrome } from './openingPointerCard';
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
    expect(retired).toMatch(/Cinderwake/i);
    const prose = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away.`,
      'They walk the trail. The salt wind and the heat are ordinary weather, not a catalog place.',
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, prose)).toEqual([]);
    const leak = `${prose} Brother Oren is still standing on the old trail.`;
    expect(validateLiveOpeningProse(state, leak).some((e) => /retired name/i.test(e))).toBe(true);
    const placeLeak = `${prose} Cinderwake Trail still burns behind you.`;
    expect(validateLiveOpeningProse(state, placeLeak).some((e) => /retired name/i.test(e))).toBe(true);
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
    const proseHe = `${inst.placeName} holds. ${he.name} stands in the ash and he has a waterskin half raised. The offer is water, or you keep your own kit.`;
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

  it("does not attach a nearby man's He to Nell in the Osric sentence", () => {
    const nell = 'Nell Hask';
    const osric = 'Osric Dunmore';
    // Reviewer counter-example: a 40/80-character window around Nell also captures Osric's "He".
    const prose =
      'The trail holds. Nell Hask has a waterskin half raised, and Osric Dunmore has not looked away. He spat into the ash and kept the brand-iron ready.';
    expect(askPadFor(nell, prose)).toBe('Ask Nell about the deal');
    expect(askPadFor(nell, prose)).not.toMatch(/what he's after/i);
    expect(validateOpeningOptions(
      game(),
      prose,
      ['Walk with Nell for water', "Ask Nell what he's after", 'Keep your own kit', 'Look around the trail']
    ).some((e) => /pronoun/i.test(e))).toBe(true);
    const sheProse = 'Nell Hask stands on the trail, and she has a waterskin half raised. Osric Dunmore has not looked away.';
    expect(askPadFor(nell, sheProse)).toBe("Ask Nell what she's after");
    expect(askPadFor(osric, sheProse)).toBe('Ask Osric about the deal');
    const afterHe = 'The trail holds. Nell took the scarf after he tossed it. You keep your own kit.';
    expect(askPadFor(nell, afterHe)).toBe('Ask Nell about the deal');
    expect(askPadFor(nell, afterHe)).not.toMatch(/what he's after/i);
  });

  it('does not pad a no-offer Salt warehouse hook with look/study/look-around-first duplicates', () => {
    const hook = {
      location: 'a warehouse loft',
      whoHere: 'the crew',
      pressingNeed: 'First move is yours — the plan, the cut, or the walk.',
    };
    const state = attachOpeningInstance(
      {
        ...createInitialState('Salt Road Heist', 'rpg'),
        campaignBibleId: 'salt-road-heist',
        engineMode: 'rpg',
        seed: 'salt-wh-pads',
      } as GameState,
      hook
    );
    const inst = state.openingEstablishment!.instance!;
    const prose = `${inst.placeName} is a warehouse loft that already has a name. The crew is here, none of them sitting. First move is yours — the plan, the cut, or the walk. You keep your own kit if you refuse.`;
    const pads = shapeOpeningPads(state, prose);
    expect(pads).toHaveLength(4);
    for (let i = 0; i < pads.length; i++) {
      for (let j = i + 1; j < pads.length; j++) {
        expect(optionsAreNearDuplicates(pads[i]!, pads[j]!)).toBe(false);
      }
    }
    expect(pads.filter((p) => /^(look|study)\b/i.test(p)).length).toBeLessThanOrEqual(1);
    expect(pads.some((p) => /Look around first/i.test(p) && pads.some((q) => /Look around /i.test(q) && q !== p))).toBe(false);
    const chrome = formatOpeningCardChrome(state);
    expect(inst.groupLabel).toMatch(/crew/i);
    expect(chrome).toMatch(/The crew is here\./);
    expect(chrome).not.toMatch(/Someone is here\./);
  });

  it('does not title the journal from a mid-sentence offer or contract', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const emptyOffer: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: { ...inst, offerSummary: undefined, offerChips: inst.offerChips.filter((c) => c.kind === 'refuse') },
      },
    };
    const junk = `${inst.placeName} is already under you. The offer is laid on the crate beside a contract none of you have signed. Heat rises. You keep your own kit.`;
    const journal = deriveOpeningJournal(emptyOffer, junk);
    expect(journal.title).not.toMatch(/Under you\. The offer is laid on the/i);
    expect(journal.title).not.toMatch(/the offer is laid/i);
    expect(journal.title).not.toMatch(/beside a contract/i);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(journal.title.length).toBeGreaterThan(3);
  });

  it('bans Pellane on page 1 when it is the hook faction', () => {
    const hook = { ...cinder, faction: 'the Pellane scouts' };
    const state = attachOpeningInstance(
      {
        ...createInitialState('The Summoned Pact', 'litrpg'),
        seed: 'pellane-page1',
        campaignBibleId: 'summoned-pact',
        engineMode: 'litrpg',
      } as GameState,
      hook
    );
    const inst = state.openingEstablishment!.instance!;
    expect(inst.retiredNames.join(' ')).toMatch(/Pellane/i);
    const prose = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away.`,
      'The Pellane scouts want an answer.',
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, prose).some((e) => /retired name/i.test(e))).toBe(true);
    const later = { ...state, openingEstablishment: { ...state.openingEstablishment!, complete: true, sceneWritten: true } };
    const rail = formatLaterTurnNameRail(later);
    expect(rail).not.toMatch(/Do not use retired catalog names:[^\n]*Pellane/i);
  });


  it('bans Pellane on page 1 when it only appears in structured hook text, not hook.faction', () => {
    const hook: OpeningHookSnapshot = {
      location: 'the ash-heat of Cinderwake Trail',
      whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
      openingOffer: "Brother Oren's waterskin and a scarf.",
      pressingNeed: 'The Pellane scouts want an answer.',
      summonIntent: "Someone upstairs will still call this Pellane's summon.",
    };
    const inst = mintOpeningInstance(hook, 'pellane-pressing|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
    });
    expect(inst.retiredNames.join(' ')).toMatch(/Pellane/i);
    expect(inst.factionName).toBeTruthy();
    expect(inst.factionName).not.toMatch(/Pellane/i);
    expect((inst.pressing ?? '') + (inst.offerSummary ?? '')).not.toMatch(/Pellane/i);
  });

  it('recovers prose from trailing-comma, curly-quoted, or missing-brace opening JSON', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = mockLiveOpeningProse(state);
    const title = `${inst.cast[0]!.name.split(/\s+/)[0]} at ${inst.placeName}`;
    const options = shapeOpeningPads(state, prose);
    const trailing = `{"prose":${JSON.stringify(prose)},"options":${JSON.stringify(options)},"journalTitle":${JSON.stringify(title)},}`;
    expect(readOpeningStructuredOutput(trailing)?.prose).toBe(prose);
    const curly = `\u201Cprose\u201D:\u201C${prose.replace(/"/g, '\\"')}\u201D, \u201Coptions\u201D:${JSON.stringify(options)}, \u201CjournalTitle\u201D:\u201C${title}\u201D`;
    const curlyObj = `{${curly}}`;
    expect(readOpeningStructuredOutput(curlyObj)?.prose).toBe(prose);
    const missing = `{"prose":${JSON.stringify(prose)},"options":${JSON.stringify(options)},"journalTitle":${JSON.stringify(title)}`;
    expect(missing.trim().endsWith('}')).toBe(false);
    expect(readOpeningStructuredOutput(missing)?.prose).toBe(prose);

    for (const raw of [trailing, curlyObj, missing]) {
      const result = await writeLiveOpening(state, settings, { writer: async () => raw });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.prose).toBe(prose);
        expect(result.prose.startsWith('{')).toBe(false);
        expect(result.prose).not.toMatch(/"prose"\s*:/);
        expect(result.pads).toEqual(options);
        expect(result.journal.title).toBe(title);
        expect(sanitizeOpeningNarration(prose)).toBe(prose);
        expect(ensureSystemReceipt(state, sanitizeOpeningNarration(prose))).toBe(prose);
        expect(recoverOpeningNarration(raw)).toBe(prose);
      }
    }
  });

  it('does not commit unrecoverable opening JSON as page 1 prose', async () => {
    const state = game();
    const raw = '{"options":[ "Look around first", ], "journalTitle": "Under you. The offer",';
    expect(readOpeningStructuredOutput(raw)).toBeNull();
    expect(recoverOpeningNarration(raw)).toBe('');
    expect(sanitizeOpeningNarration(raw)).toBe(raw);
    const result = await writeLiveOpening(state, settings, { writer: async () => raw });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
  });

  it('uses a no-schema free-prose fallback without treating it as JSON', async () => {
    const state = game();
    const prose = mockLiveOpeningProse(state);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return prose;
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(false);
      expect(result.prose).toBe(prose);
      expect(result.prose.startsWith('{')).toBe(false);
      expect(result.pads).toHaveLength(4);
      expect(result.journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    }
  });

  it('keeps a good first prose draft when the options are bad and the retry is worse', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = mockLiveOpeningProse(state);
    const title = `${inst.cast[0]!.name.split(/\s+/)[0]} at ${inst.placeName}`;
    const badOptions = ['Look around first', 'Study the loft', 'Look around the loft', 'Study first'];
    const first = JSON.stringify({ prose, options: badOptions, journalTitle: title });
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        if (calls === 1) return first;
        return '{"prose":';
      },
    });
    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(true);
      expect(result.prose).toBe(prose);
      expect(result.prose.startsWith('{')).toBe(false);
      expect(result.pads).toHaveLength(4);
      expect(result.pads.filter((p) => /^(look|study)\b/i.test(p)).length).toBeLessThanOrEqual(1);
    }
  });

  it('uses structured options and a short journal title from the writer JSON', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = mockLiveOpeningProse(state);
    const title = `${inst.cast[0]!.name.split(/\s+/)[0]} at ${inst.placeName}`;
    const options = shapeOpeningPads(state, prose);
    expect(validateOpeningOptions(state, prose, options)).toEqual([]);
    const result = await writeLiveOpening(state, settings, {
      writer: async () => JSON.stringify({ prose, options, journalTitle: title }),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(false);
      expect(result.pads).toEqual(options);
      expect(result.journal.title).toBe(title);
    }
  });


  it('keeps dialogue-first typographic prose through structured parse and post-extraction sanitise', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const typographic = [
      `“Talk is done,” ${inst.cast[0]!.name} says at ${inst.placeName}.`,
      'The place is already named and ordinary, not a blur.',
      'First move is yours — the plan, the cut, or the walk.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    expect(looksLikeOpeningStructuredText(typographic)).toBe(false);
    expect(recoverOpeningNarration(typographic)).toBe(typographic);
    expect(sanitizeOpeningNarration(typographic)).toBe(typographic);
    expect(ensureSystemReceipt(state, sanitizeOpeningNarration(typographic))).toBe(typographic);
    const options = shapeOpeningPads(state, typographic);
    const title = `${inst.cast[0]!.name.split(/\s+/)[0]} at ${inst.placeName}`;
    const raw = JSON.stringify({ prose: typographic, options, journalTitle: title });
    const result = await writeLiveOpening(state, settings, { writer: async () => raw });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prose).toBe(typographic);
      expect(result.prose.startsWith('{')).toBe(false);
      expect(sanitizeOpeningNarration(result.prose)).toBe(typographic);
      expect(ensureSystemReceipt(state, sanitizeOpeningNarration(result.prose))).toBe(typographic);
    }
  });

  it('keeps dialogue-first typographic prose on the free-prose path', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const typographic = [
      `“Talk is done,” ${inst.cast[0]!.name} says at ${inst.placeName}.`,
      'The place is already named and ordinary, not a blur.',
      'First move is yours — the plan, the cut, or the walk.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    const result = await writeLiveOpening(state, settings, { writer: async () => typographic });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prose).toBe(typographic);
      expect(result.prose).not.toBe(STORYTELLER_RETRY_MESSAGE);
      expect(result.pads).toHaveLength(4);
      expect(sanitizeOpeningNarration(result.prose)).toContain('“Talk is done,”');
    }
  });

  it('does not treat a bare "options" phrase or an unbalanced {ward in prose as structured JSON', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const withOptions = [
      `${inst.placeName} is already under you, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} has not looked away.`,
      'The choice is written on the crate as "options": walk or stay, but the crew is still waiting.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    const withWard = [
      `${inst.placeName} sits by the {ward stones, named and ordinary, not a blur.`,
      `${inst.cast[0]!.name} is already in motion.`,
      'Heat still rises off the packed earth.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    for (const prose of [withOptions, withWard]) {
      expect(looksLikeOpeningStructuredText(prose)).toBe(false);
      expect(recoverOpeningNarration(prose)).toBe(prose);
      expect(sanitizeOpeningNarration(prose)).toBe(prose);
      const result = await writeLiveOpening(state, settings, { writer: async () => prose });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.prose).toBe(prose);
        expect(result.prose).not.toBe(STORYTELLER_RETRY_MESSAGE);
      }
    }
    expect(withOptions).toContain('"options": walk or stay');
    expect(withWard).toContain('{ward');
  });

  it('refuses to commit empty opening prose and does not set sceneWritten', () => {
    const state = game();
    expect(isBlankOpeningProse('')).toBe(true);
    expect(isBlankOpeningProse('   \n\t')).toBe(true);
    expect(isBlankOpeningProse('“Talk is done,”')).toBe(false);
    const next = applySuccessfulLiveOpening(state, '  \n  ');
    expect(next.openingEstablishment?.sceneWritten).not.toBe(true);
    expect(next.openingEstablishment?.sceneWriteError).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(next.choices).toEqual([STORYTELLER_RETRY_CHIP]);
    const good = applySuccessfulLiveOpening(state, mockLiveOpeningProse(state));
    expect(good.openingEstablishment?.sceneWritten).toBe(true);
  });

  it('unescapes \\n, \\" and \\\\ once in a truncated opening response', () => {
    expect(unescapeExtractedString('Heat rises.\\nYou wake at the loft.')).toBe('Heat rises.\nYou wake at the loft.');
    expect(unescapeExtractedString('She said \\\"stay\\". Path \\\\ward')).toBe('She said "stay". Path \\ward');
    const truncated = '{"prose": "Heat rises.\\nYou wake at the loft. The crew is here.';
    expect(truncated.includes('}')).toBe(false);
    expect(looksLikeOpeningStructuredText(truncated)).toBe(true);
    const extracted = extractOpeningJsonStringField(truncated, 'prose');
    expect(extracted).toBeTruthy();
    expect(extracted).not.toMatch(/\\n/);
    expect(extracted).toMatch(/Heat rises\.\s+You wake at the loft/);
    expect(readOpeningStructuredOutput(truncated)?.prose).toMatch(/Heat rises\.\s+You wake at the loft/);
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
