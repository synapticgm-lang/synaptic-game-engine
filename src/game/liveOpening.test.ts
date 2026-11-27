import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import {
  applyFailedLiveOpening,
  applySuccessfulLiveOpening,
  deriveOpeningJournal,
  askPadFor,
  isBlankOpeningProse,
  mockLiveOpeningProse,
  optionsAreNearDuplicates,
  shapeOpeningPads,
  mockLiveOpeningStructuredReply,
  validateOpeningOptions,
  writeLiveOpening,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
  type LiveOpeningResult,
} from './liveOpening';
import {
  formatLaterTurnNameRail,
  openingProseLeaksStructuredJson,
  readOpeningStructuredOutput,
  recoverOpeningNarration,
} from './openingWriterNotes';
import { headlessOpeningContinueTurn } from './liveDrive';
import { riteEntryForState } from './openingRiteFacts';
import { ensureSystemReceipt, sanitizeOpeningNarration } from './openingEstablishment';
import { formatOpeningCardChrome } from './openingPointerCard';
import type { GameState, Settings } from './types';

const cinder: OpeningHookSnapshot = {
  place: { id: 'live-ash-trail', kind: 'trail' },
  cast: [
    { id: 'live-cast-oren', role: 'priest', pronouns: 'he/him', durability: 'durable' },
    { id: 'live-cast-kessa', role: 'tracker', pronouns: 'she/her', durability: 'durable' },
  ],
  offer: {
    items: [
      { id: 'live-water', label: 'waterskin', carryable: true },
      { id: 'live-scarf', label: 'scarf', carryable: true },
      { id: 'live-brand', label: 'brand-iron', carryable: true },
    ],
  },
  rite: { steps: [{ id: 'live-rite-name', label: 'Give a name' }] },
  beatOrder: ['wake', 'offer'],
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

function asOpeningJson(
  state: GameState,
  prose: string,
  extras?: { options?: string[]; journalTitle?: string }
): string {
  return JSON.stringify({
    prose,
    options: extras?.options ?? shapeOpeningPads(state, prose),
    journalTitle: extras?.journalTitle ?? `${state.openingEstablishment!.instance!.cast[0]!.name.split(/\s+/)[0]} at ${state.openingEstablishment!.instance!.placeName}`,
  });
}

function assertNoKeyText(text: string) {
  expect(text).not.toMatch(
    /\b(?:prose|options|choices|journalTitle|journal_title|story|title|text|narration|scene)\b\s*["'\u201C\u201D\u2018\u2019]?\s*:/i
  );
  expect(text).not.toContain('":');
  expect(text).not.toBe(STORYTELLER_RETRY_MESSAGE);
}

function expectCleanProseOrRetry(result: LiveOpeningResult, expected?: string) {
  if (result.ok) {
    assertNoKeyText(result.prose);
    if (expected !== undefined) expect(result.prose).toBe(expected);
  } else {
    expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
  }
}

describe('liveOpening', () => {
  it('commits structured prose that old length/salad/person gates would have rejected, on the first writer call', async () => {
    const state = game();
    // Short, vague, no locked cast name — previously failed validateLiveOpeningProse.
    const prose = 'Someone here looks at you. A figure waits in the heat.';
    expect(prose.length).toBeLessThan(180);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return JSON.stringify({
          prose,
          options: ['Look around', 'Wait', 'Keep your own kit', 'Ask what they want'],
          journalTitle: 'Arrival',
        });
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(false);
      expect(result.prose).toBe(prose);
    }
  });

  it('thrown writer leaves exactly [Try again] as choices and offeredPad', async () => {
    const state = game();
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        throw new Error('network');
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
      expect(result.pads).toEqual([STORYTELLER_RETRY_CHIP]);
    }
    const next = applyFailedLiveOpening(state);
    expect(next.choices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(next.offeredPad?.choices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(next.openingEstablishment?.sceneWritten).not.toBe(true);
  });

  it('mock prose pads follow the offer with exact counts', () => {
    const litrpg = game('litrpg');
    const tabletop = game('dnd');
    const proseL = mockLiveOpeningProse(litrpg);
    const proseT = mockLiveOpeningProse(tabletop);
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
    const inst = state.openingEstablishment!.instance!;
    const journal = deriveOpeningJournal(state, prose);
    expect(inst.beatOrder?.length).toBeGreaterThan(0);
    expect(journal.title).not.toMatch(/Pellane/i);
    expect(journal.title).not.toMatch(/^Hear \S+ out$/i);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(journal.title).not.toMatch(/\w…|…\w/);
    expect(journal.description).not.toMatch(/Orel Vane|High Chanter/i);
    expect(journal.title + journal.description).toMatch(
      new RegExp(inst.cast[0]!.name.split(/\s+/)[0]!, 'i')
    );
    expect(journal.description).toMatch(new RegExp(inst.placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(journal.objectives.some((o) => o.includes(inst.placeName) || /panel|offer|Hear why/i.test(o))).toBe(true);
    const committed = applySuccessfulLiveOpening(state, prose);
    const rite = riteEntryForState(committed);
    expect(rite?.giver).not.toMatch(/Orel Vane/i);
    expect(rite?.acceptChip).not.toBe('Sign the pact');
    expect(rite?.refuseChip).toMatch(/Keep your own kit/i);
    expect(committed.quests?.some((q) => q.revealed && /Hear why Pellane wanted you/i.test(q.name))).toBe(false);
    const live = committed.quests?.find((q) => q.id === 'opening-live-journal');
    expect(live?.name).toBe(journal.title);
    expect(live?.location).toBe(inst.placeName);
    expect(live?.giver).toBe(inst.cast[0]!.name);
  });

  it('free (non-JSON) writer prose fails once with Try again — no automatic retry', async () => {
    const state = game();
    let calls = 0;
    const fail = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return 'Someone here looks over. A figure waits in the heat.';
      },
    });
    expect(calls).toBe(1);
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.error).toBe(STORYTELLER_RETRY_MESSAGE);
  });

  it('phrases ask-pads from cast pronouns, not from prose scrape', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const he = inst.cast[0]!;
    const she = inst.cast[1]!;
    const proseHe = `${inst.placeName} holds. ${he.name} stands in the ash. The offer is water, or you keep your own kit.`;
    expect(askPadFor(he.name, proseHe, state)).toMatch(new RegExp(`Ask ${he.name.split(/\s+/)[0]} what he's after`));
    expect(askPadFor(she.name, proseHe, state)).toMatch(new RegExp(`Ask ${she.name.split(/\s+/)[0]} what she's after`));
    expect(askPadFor(he.name, proseHe, state)).not.toMatch(/what they want/i);
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

  it('journal title comes from minted cast + place when offer items are empty (never prose)', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const emptyOffer: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: {
          ...inst,
          offerSummary: undefined,
          offerItemNotes: undefined,
          offerChips: inst.offerChips.filter((c) => c.kind === 'refuse'),
        },
      },
    };
    const prose = `${inst.placeName} is under you. ${inst.cast[0]!.name} waits. Long-handled scrapers working the ash are not an offer. Heat rises. You keep your own kit.`;
    const journal = deriveOpeningJournal(emptyOffer, prose);
    const given = inst.cast[0]!.name.split(/\s+/)[0]!;
    expect(journal.title.toLowerCase()).toBe(`${given} at ${inst.placeName}`.toLowerCase());
    // Title is structured data, not a mid-sentence clip from prose.
    expect(journal.title).not.toMatch(/Ng-handled|scrapers working|Long-handled/i);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
  });

  it('journal title ignores accept-chip English and uses typed offerItemNotes or cast+place', () => {
    const state = game('dnd', 'journal-reason');
    const inst = state.openingEstablishment!.instance!;
    const withReason: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: {
          ...inst,
          offerSummary: undefined,
          offerItemNotes: undefined,
          offerChips: [
            { kind: 'accept', label: `Hear ${inst.cast[0]!.name.split(/\s+/)[0]} out`, note: `${inst.cast[0]!.name} is here with a reason — hear it before you decide.` },
            inst.offerChips.find((c) => c.kind === 'refuse')!,
          ],
        },
      },
    };
    const prose = `${inst.placeName} keeps still. ${inst.cast[0]!.name} waits among the stones with a lantern. You keep your own kit.`;
    const journal = deriveOpeningJournal(withReason, prose);
    const given = inst.cast[0]!.name.split(/\s+/)[0]!;
    expect(journal.title).not.toMatch(/is here with a reason/i);
    expect(journal.title).not.toMatch(/^Hear \S+ out$/i);
    expect(journal.title).toContain(given);
    expect(journal.title).toContain(inst.placeName);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
  });

  it('ask pads without cast data stay neutral (no prose pronoun scrape)', () => {
    const nell = 'Nell Hask';
    const prose =
      'The trail holds. Nell Hask has a waterskin half raised, and Osric Dunmore has not looked away. He spat into the ash and kept the brand-iron ready.';
    expect(askPadFor(nell, prose)).toBe('Ask Nell about the deal');
    expect(askPadFor(nell, prose)).not.toMatch(/what he's after/i);
    const sheProse = 'Nell Hask stands on the trail, and she has a waterskin half raised.';
    expect(askPadFor(nell, sheProse)).toBe('Ask Nell about the deal');
  });

  it('does not pad a no-offer Salt warehouse hook with look/study/look-around-first duplicates', () => {
    const hook: OpeningHookSnapshot = {
      place: { id: 'salt-wh-loft', kind: 'warehouse loft' },
      cast: [],
      offer: { items: [] },
      rite: { steps: [] },
      beatOrder: ['arrive'],
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
    expect(inst.alone).toBe(true);
    expect(inst.cast).toHaveLength(0);
    const chrome = formatOpeningCardChrome(state);
    expect(chrome).toMatch(new RegExp(inst.placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  it('journal ignores prose mid-sentence offer wording; title and summary stay structured', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const emptyOffer: GameState = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        instance: {
          ...inst,
          offerSummary: undefined,
          offerItemNotes: undefined,
          offerChips: inst.offerChips.filter((c) => c.kind === 'refuse'),
        },
      },
    };
    const junk = `${inst.placeName} is already under you. The offer is laid on the crate beside a contract none of you have signed. Heat rises. You keep your own kit.`;
    const journal = deriveOpeningJournal(emptyOffer, junk);
    const preferred = 'The offer is laid on the crate beside a contract';
    const withPreferred = deriveOpeningJournal(emptyOffer, junk, preferred);
    expect(withPreferred.title).toBe(journal.title);
    expect(journal.title).not.toMatch(/Under you\. The offer is laid on the/i);
    expect(journal.title).not.toMatch(/the offer is laid/i);
    expect(journal.title).not.toMatch(/beside a contract/i);
    expect(journal.description).not.toMatch(/beside a contract|laid on the crate/i);
    expect(journal.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(journal.title.length).toBeGreaterThan(3);
  });

  it('objectives follow typed beatOrder and minted names, not prose', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.beatOrder).toEqual(expect.arrayContaining(['wake', 'offer']));
    const journal = deriveOpeningJournal(state, 'Irrelevant prose about scrapers working the ash.');
    expect(journal.objectives.some((o) => o.includes(inst.placeName))).toBe(true);
    expect(journal.objectives.some((o) => /Decide whether to take/i.test(o))).toBe(true);
    expect(journal.objectives.join(' ')).not.toMatch(/scrapers working/i);
    if (inst.offerItemNotes?.length) {
      expect(journal.description).toMatch(/On offer:/);
      expect(journal.description).toContain(inst.offerItemNotes[0]!);
      expect(journal.objectives.some((o) => o.includes(inst.offerItemNotes![0]!))).toBe(true);
    }
    expect(journal.title).toContain(inst.cast[0]!.name.split(/\s+/)[0]!);
    expect(journal.title).toContain(inst.placeName);
  });

  it('typed mint ignores English faction labels — place and cast come from ids', () => {
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
    expect(inst.retiredNames).toEqual([]);
    expect(inst.cast).toHaveLength(2);
    expect(inst.placeName).not.toMatch(/Pellane|Cinderwake/i);
    const later = { ...state, openingEstablishment: { ...state.openingEstablishment!, complete: true, sceneWritten: true } };
    const rail = formatLaterTurnNameRail(later);
    expect(rail).not.toMatch(/Do not use retired catalog names:[^\n]*Pellane/i);
  });

  it('untyped English hooks mint alone — no Title-Case scrape for Pellane or cast', () => {
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
    expect(inst.cast).toHaveLength(0);
    expect(inst.alone).toBe(true);
    expect(inst.retiredNames).toEqual([]);
    expect(inst.factionName).toBeUndefined();
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
        expect(result.pads).toEqual(options);
        expect(result.journal.title).toBe(title);
        expect(sanitizeOpeningNarration(prose)).toBe(prose);
        expect(ensureSystemReceipt(state, sanitizeOpeningNarration(prose))).toBe(prose);
        expect(recoverOpeningNarration(raw)).toBe(prose);
        assertNoKeyText(result.prose);
      }
    }
  });

  it('does not commit unrecoverable opening JSON as page 1 prose', async () => {
    const state = game();
    const raw = '{"options":[ "Look around first", ], "journalTitle": "Under you. The offer",';
    expect(readOpeningStructuredOutput(raw)).toBeNull();
    expect(recoverOpeningNarration(raw)).toBe('');
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return raw;
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
  });

  it('does not accept free prose from the opening call — one call, then Try again', async () => {
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
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
  });

  it('keeps a good first prose draft when the options are bad — fallback pads, no second writer call', async () => {
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
        return first;
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(false);
      expect(result.prose).toBe(prose);
      assertNoKeyText(result.prose);
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
    expect(openingProseLeaksStructuredJson(typographic)).toBe(false);
    expect(sanitizeOpeningNarration(typographic)).toBe(typographic);
    expect(ensureSystemReceipt(state, sanitizeOpeningNarration(typographic))).toBe(typographic);
    const raw = asOpeningJson(state, typographic);
    expect(readOpeningStructuredOutput(raw)?.prose).toBe(typographic);
    const result = await writeLiveOpening(state, settings, { writer: async () => raw });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prose).toBe(typographic);
      expect(sanitizeOpeningNarration(result.prose)).toBe(typographic);
      expect(ensureSystemReceipt(state, sanitizeOpeningNarration(result.prose))).toBe(typographic);
      assertNoKeyText(result.prose);
    }
  });

  it('keeps mid-line {ward, speaker colons, times, and plain lists through the final gate', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const name = inst.cast[0]!.name;
    const place = inst.placeName;
    const withWard = [
      `${place} sits by the {ward stones, named and ordinary, not a blur.`,
      `${name} is already in motion.`,
      'Heat still rises off the packed earth.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    const withSpeaker = [
      `${place} is already under you, named and ordinary, not a blur.`,
      `Hobb: “The water is already going at 12:00.”`,
      `${name} has not looked away.`,
      'You can walk, wait, or stay, and you keep your own kit if you refuse.',
    ].join(' ');
    for (const prose of [withWard, withSpeaker]) {
      expect(openingProseLeaksStructuredJson(prose)).toBe(false);
      const result = await writeLiveOpening(state, settings, { writer: async () => asOpeningJson(state, prose) });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.prose).toBe(prose);
        assertNoKeyText(result.prose);
      }
    }
    expect(withWard).toContain('{ward');
    expect(withSpeaker).toContain('Hobb: “The water');
    expect(withSpeaker).toContain('12:00');
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
    expect(next.offeredPad?.choices).toEqual([STORYTELLER_RETRY_CHIP]);
    const good = applySuccessfulLiveOpening(state, mockLiveOpeningProse(state));
    expect(good.openingEstablishment?.sceneWritten).toBe(true);
    expect(good.offeredPad).toBeNull();
  });

  it('fails closed on unquoted values, unquoted keys, typographic tails, arrays, and alternate keys', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = mockLiveOpeningProse(state);
    const title = `${inst.cast[0]!.name.split(/\s+/)[0]} at ${inst.placeName}`;
    const options = shapeOpeningPads(state, prose);
    const quotedProse = JSON.stringify(prose);

    // Round-6 shapes.
    const unquotedValue = `{ "prose": ${prose}, "options": ${JSON.stringify(options)}, "journalTitle": ${JSON.stringify(title)} }`;
    const unquotedKeys = `{prose: ${quotedProse}, options: ${JSON.stringify(options)}, journalTitle: ${JSON.stringify(title)}}`;
    const typographicSingleTail = `${prose} ‘options’: ${JSON.stringify(options)}`;
    const jsonArray = JSON.stringify(['Look around first', 'Study the loft', 'Wait and listen']);
    const altKeys = JSON.stringify({ story: prose, choices: options, title });
    const yamlLike = `prose: ${prose}\noptions:\n- Look around first\n- Keep your own kit\njournalTitle: ${title}`;

    // Round-5 shapes (no longer recovered; must not leak keys onto the page).
    const unwrapped = `"prose": ${quotedProse}, "options": ${JSON.stringify(options)}, "journalTitle": ${JSON.stringify(title)}`;
    const typographicUnwrapped = [
      `“prose”: “${prose.replace(/"/g, '\\"')}”`,
      `“options”: ${JSON.stringify(options)}`,
      `“journalTitle”: “${title}”`,
    ].join(', ');
    const trailingObject = `${prose} { "options": ${JSON.stringify(options)} }`;

    const shapes = {
      unquotedValue,
      unquotedKeys,
      typographicSingleTail,
      jsonArray,
      altKeys,
      yamlLike,
      unwrapped,
      typographicUnwrapped,
      trailingObject,
    };

    for (const [name, raw] of Object.entries(shapes)) {
      expect(readOpeningStructuredOutput(raw), name).toBeNull();
      expect(recoverOpeningNarration(raw), name).toBe('');
      let calls = 0;
      const result = await writeLiveOpening(state, settings, {
        writer: async () => {
          calls += 1;
          return raw;
        },
      });
      expect(calls, name).toBe(1);
      expect(result.ok, name).toBe(false);
      if (!result.ok) expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
      expectCleanProseOrRetry(result);
    }
  });

  it('final leak gate rejects JSON injected after extraction and keeps allowed survival prose', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const prose = mockLiveOpeningProse(state);
    const typographic = [
      `“Talk is done,” ${inst.cast[0]!.name} says at ${inst.placeName}.`,
      'The place is already named and ordinary, not a blur.',
      'First move is yours — the plan, the cut, or the walk.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    const withWard = `${inst.placeName} sits by the {ward stones, named and ordinary. ${inst.cast[0]!.name} is already in motion.`;
    const withSpeaker = `Hobb: “The water is already going at 12:00.” ${inst.placeName} is already under you.`;
    const wordList = 'You can walk, wait, or stay, and you keep your own kit if you refuse.';
    expect(openingProseLeaksStructuredJson(prose)).toBe(false);
    expect(openingProseLeaksStructuredJson(typographic)).toBe(false);
    expect(openingProseLeaksStructuredJson(withWard)).toBe(false);
    expect(openingProseLeaksStructuredJson(withSpeaker)).toBe(false);
    expect(openingProseLeaksStructuredJson(wordList)).toBe(false);

    const injected = `${prose} { "options": ["Look around first"] }`;
    expect(openingProseLeaksStructuredJson(injected)).toBe(true);
    const next = applySuccessfulLiveOpening(state, injected);
    expect(next.openingEstablishment?.sceneWritten).not.toBe(true);
    expect(next.openingEstablishment?.sceneWriteError).toBe(STORYTELLER_RETRY_MESSAGE);
    expect(next.choices).toEqual([STORYTELLER_RETRY_CHIP]);
    expect(next.offeredPad?.choices).toEqual([STORYTELLER_RETRY_CHIP]);

    const punct = `${prose}\n}, { "journalTitle": "Arrival" }`;
    expect(openingProseLeaksStructuredJson(punct)).toBe(true);
    expect(applySuccessfulLiveOpening(state, punct).openingEstablishment?.sceneWritten).not.toBe(true);
  });

  it('does not stitch authored page 1 when a live opening is still unwritten', async () => {
    const state = game();
    expect(state.openingEstablishment?.sceneWritten).not.toBe(true);
    const prose = mockLiveOpeningProse(state);
    const next = await headlessOpeningContinueTurn(state, 'Look around', {
      writer: async () => asOpeningJson(state, prose),
      settings,
    });
    expect(next.gmText).not.toMatch(/lying on your back in a scorched circle/i);
    assertNoKeyText(next.gmText);
    expect(next.gmText).toBe(prose);
    expect(next.state.openingEstablishment?.sceneWritten).toBe(true);
    expect(next.offeredChoices.length).toBeGreaterThan(0);
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
