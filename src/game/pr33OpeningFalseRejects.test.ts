/**
 * Opening option / journal / page-1 commit checks that do not depend on English scrapers.
 * Deleted scrape-pinning cases (alignHookPronouns, whoHere role/offer rewrite, Father Aldous
 * title scrape, "two militia" phrase roles) — those behaviours were removed in brief 03;
 * untyped hooks mint alone, and pronouns/roles come from typed cast data.
 */
import { describe, expect, it } from 'vitest';
import type { OpeningBeatCard, OpeningHookTypedData } from '@/data/campaigns/types';
import { createInitialState } from './defaults';
import {
  mintOpeningInstance,
  snapshotFromPickedHook,
} from './openingInstance';
import {
  deriveOpeningJournal,
  fallbackOpeningPads,
  mentionsPlaceName,
  optionPronounErrors,
  validateOpeningJournalTitle,
  validateOpeningOptions,
  writeLiveOpening,
} from './liveOpening';
import type { GameState, OpeningInstance, Settings } from './types';

const settings = { contentMode: 'adult' } as Settings;

function withInstance(engineMode: GameState['engineMode'], inst: OpeningInstance, seed = 'pr33'): GameState {
  const campaign = engineMode === 'dnd' ? 'The Cursed Keep' : 'The Summoned Pact';
  const bible = engineMode === 'dnd' ? 'cursed-keep' : 'summoned-pact';
  return {
    ...createInitialState(campaign, engineMode),
    seed,
    campaignBibleId: bible,
    engineMode,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      instance: inst,
    },
  };
}

const nollshawInst: OpeningInstance = {
  placeName: 'Nollshaw Well',
  placeKind: 'well',
  nearbyLandmark: 'Greyhollow Church',
  cast: [{ name: 'Tilde Barrow', role: 'priest', gender: 'female', pronouns: 'she/her' }],
  situation: 'a traveler who has just reached the well',
  offerChips: [
    { kind: 'accept', label: 'Hear Tilde out', note: 'Tilde Barrow is here with a reason — hear it before you decide.' },
    { kind: 'refuse', label: 'Keep your own kit', note: 'Refuse whatever is being offered and keep your own kit.' },
  ],
  alone: false,
  retiredNames: ['Aldous'],
};

/** Exact draft 1 from the 11 Nov 2026 PR31 live cursed-keep seed. */
const NOLLshawDraft1Prose =
  "Tilde Barrow flattened both palms against the well's stone lip and dipped her head toward the shaft, listening like a woman counting echoes. The dark came back up slow and wrong — not water down there, but a hollow that swallowed sound and gave back none. She straightened, brushed grit from her coat, and looked the newcomer over without hurry, taking in the sword and the road-worn satchel. \"Something answered from the shaft an hour past,\" she said. Her voice stayed level despite the way her shoulders hadn't quite come down. \"Not a bucket. Not a fox. I want to know which of those you'd bet on.\"";

const nollshawDraft1Options = [
  'Tell her what a fall into a well usually sounds like',
  'Ask what the voice said first',
  'Look down the shaft yourself',
];

const merrowInst: OpeningInstance = {
  placeName: 'Merrowbury Trail',
  placeKind: 'trail',
  nearbyLandmark: 'Kitchen Saint Alley',
  cast: [
    { name: 'Wenna Merrow', role: 'tracker', gender: 'female', pronouns: 'she/her' },
    { name: 'Ysolde Marl', role: 'tracker', gender: 'female', pronouns: 'she/her' },
  ],
  situation: 'an Earth stranger pulled into the ash-heat',
  offerChips: [{ kind: 'refuse', label: 'Keep your own kit', note: 'Refuse and keep your own kit.' }],
  alone: false,
  retiredNames: [],
};

const merrowDraft1Prose =
  'The ash road ran gray and endless under a sky the color of an old bruise. Merrowbury Trail, the locals called it, if there were any locals this far out where the world had been scraped down to grit and bone. The newcomer stood in a set of fresh prints — not their own, though they had walked them — and beside the tracks, two women had stopped still. One wore a pilgrim\'s wrap gone dark with dust, a skin of water at her hip; the other crouched low, one hand flat on the ground, reading the ash the way a scholar reads a page. Neither of them moved toward the stranger. Neither reached for a blade. The world held its breath, and the silence stretched thin until it broke, and the newcomer spoke into it — a voice rougher than they expected, shaped by dust and the long light that had dragged them here. The crouching woman lifted her head. Her eyes were pale as winter flint. Wenna Merrow stood with the waterskin half-raised, waiting to see whether the stranger was something that could be spoken to, or something that needed to be tracked.';

const merrowDraft1Options = [
  'Ask Wenna Merrow for water and the pilgrim scarf',
  "Take Ysolde Marl's hunt and her brand-iron",
  'Keep Earth kit and walk on alone',
  'Give Ysolde Marl your name and ask hers in return',
];

const merrowDraft2Prose =
  'The device on their wrist had pulsed once when they spoke, a cold pinprick of light against the ash-haze, and now the words hung in the air over Merrowbury Trail. Nothing answered. No bird, no wind-thread, no crawl of something in the grey scrub along the path. The ash trail ran flat and wide beneath their street shoes, and it held their prints now, four steps of them, pale and city-soft in the fine silt. A little way ahead the ground churned where hooves and boots had passed through, then stopped, then turned back — a tracking-rite finished, the ash raked smooth to read its own story. The stranger stood inside the prints they had been following. The silence that followed their voice was the kind that gets heavier the longer it goes on, and it did not break on its own.';

const nollshawDraft2Prose =
  'The newcomer stood at the lip of Nollshaw Well. The stones were worn smooth, older than anything around them. Tilde Barrow waited at their side, a woman with the stoop of a father who had carried too many years past harvest. She did not fill the quiet. When she finally spoke, her voice was low and even, as though she had asked this question a hundred times and never once liked the answer.\n\n"What answered from the shaft?"';

const TYPED_TWO: OpeningHookTypedData & OpeningBeatCard = {
  place: { id: 'test-cinder-trail', kind: 'trail' },
  cast: [
    { id: 'test-cast-a', role: 'priest', pronouns: 'he/him', durability: 'durable' },
    { id: 'test-cast-b', role: 'tracker', pronouns: 'she/her', durability: 'durable' },
  ],
  offer: {
    items: [
      { id: 'test-water', label: 'waterskin', carryable: true },
      { id: 'test-iron', label: 'brand-iron', carryable: true },
    ],
  },
  rite: { steps: [{ id: 'test-rite', label: 'Give a name' }] },
  beatOrder: ['wake', 'offer'],
  location: 'catalog trail must not drive minting',
  whoHere: 'Brother Oren and tracker Kessa Cinder',
  openingOffer: 'English offer that minting must not parse',
  pressing: 'They want an answer.',
  page1: 'Authored page 1.',
};

describe('Opening false rejects (typed / locked instance)', () => {
  it('accepts Nollshaw Well draft 1 options when the prose is committed without place-name prose gates', () => {
    const state = withInstance('dnd', nollshawInst, 'pr31-live-dnd-keep');
    expect(mentionsPlaceName(NOLLshawDraft1Prose, 'Nollshaw Well')).toBe(false);
    expect(validateOpeningOptions(state, NOLLshawDraft1Prose, nollshawDraft1Options)).toEqual([]);
  });

  it('mentionsPlaceName still requires a coined stem, not a bare trail or road', () => {
    expect(mentionsPlaceName('They walked the trail until the heat broke.', 'Merrowbury Trail')).toBe(false);
    expect(mentionsPlaceName('They crossed the road, then the hollow.', 'Merrowbury Trail')).toBe(false);
    expect(mentionsPlaceName('Merrowbury was already under them.', 'Merrowbury Trail')).toBe(true);
  });

  it('does not treat "Keep Earth kit" as a coined name, but still flags a locked person missing from the prose', () => {
    const state = withInstance('litrpg', merrowInst);
    const errors = validateOpeningOptions(state, merrowDraft1Prose, merrowDraft1Options);
    expect(errors.some((e) => /Keep Earth/i.test(e))).toBe(false);
    expect(errors.some((e) => /option names Ysolde/i.test(e))).toBe(true);
  });

  it('commits structured prose that names only one cast member (old missing-person gate deleted)', async () => {
    const state = withInstance('litrpg', merrowInst);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return JSON.stringify({
          prose: merrowDraft2Prose,
          options: ['Look around', 'Wait', 'Keep your own kit', 'Ask what they want'],
          journalTitle: 'Merrowbury Trail, In Their Prints',
        });
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.prose).toBe(merrowDraft2Prose);
  });

  it('accepts scene titles with a comma and still rejects a real name/place list', () => {
    const merrow = withInstance('litrpg', merrowInst);
    const gate = withInstance('dnd', {
      ...nollshawInst,
      placeName: 'Beltaneleigh Gate',
      placeKind: 'gate',
      nearbyLandmark: "Mira's Apothecary",
      cast: [{ name: 'Rosel Cotter', role: 'militia', gender: 'female', pronouns: 'she/her' }],
    });
    expect(validateOpeningJournalTitle(merrow, 'Merrowbury Trail, In Their Prints')).toEqual([]);
    expect(validateOpeningJournalTitle(gate, 'The Gate, After Dark')).toEqual([]);
    expect(validateOpeningJournalTitle(merrow, 'Wenna Merrow, Ysolde Marl')).toContain('journal title is a list of names and places');
    expect(validateOpeningJournalTitle(merrow, 'Wenna Merrow, Ysolde Marl and Merrowbury Trail')).toContain(
      'journal title is a list of names and places'
    );
  });

  it('accepts an option pronoun that matches minted gender when the prose pronoun is unknown', () => {
    const state = withInstance('dnd', nollshawInst);
    const label = 'Ask Tilde Barrow what she already knows';
    expect(optionPronounErrors(label, nollshawDraft2Prose, ['Tilde Barrow', 'Tilde'], state)).toEqual([]);
    expect(validateOpeningOptions(state, nollshawDraft2Prose, [
      'Tell Tilde Barrow what the shaft said',
      'Say you heard nothing from the well',
      label,
    ])).toEqual([]);
  });

  it('typed cast supplies roles and pronouns; untyped English does not mint people', () => {
    const typed = mintOpeningInstance(snapshotFromPickedHook(TYPED_TWO), 'pr33-typed|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    expect(typed.cast).toHaveLength(2);
    expect(typed.cast[0]!.role).toBe('priest');
    expect(typed.cast[1]!.role).toBe('tracker');
    expect(typed.cast[0]!.pronouns).toBe('he/him');
    expect(typed.cast[1]!.pronouns).toBe('she/her');
    expect(typed.cast.some((c) => /Oren|Kessa|Father|Brother/i.test(c.name))).toBe(false);
    expect(typed.cast.some((c) => /^(father|mother|brother|sister)$/i.test(c.role))).toBe(false);

    const untyped = mintOpeningInstance(
      { location: 'Greyhollow well', whoHere: 'Father Aldous', openingOffer: 'Walk with Father Aldous and he will share.' },
      'pr33-untyped|cursed-keep|opening-instance',
      { bibleId: 'cursed-keep', engineMode: 'dnd' }
    );
    expect(untyped.cast).toHaveLength(0);
    expect(untyped.alone).toBe(true);
  });

  it('does not fill page-1 pads with an accept chip naming an item the prose never mentions', () => {
    const inst: OpeningInstance = {
      placeName: 'Beltaneleigh Gate',
      placeKind: 'gate',
      nearbyLandmark: "Mira's Apothecary",
      cast: [{ name: 'Rosel Cotter', role: 'militia', gender: 'female', pronouns: 'she/her' }],
      situation: 'a traveler at the gate after dark',
      offerChips: [
        { kind: 'accept', label: 'Take the kit', note: 'Take the kit.' },
        { kind: 'refuse', label: 'Keep your own kit', note: 'Refuse and keep your own kit.' },
      ],
      alone: false,
      retiredNames: [],
    };
    const state = withInstance('dnd', inst, 'pr33-pads');
    const prose =
      'The rain had followed the newcomer up the last mile of switchbacks, and at Beltaneleigh Gate it found the wind that made it sting. Rosel Cotter, mud to the knee, hood back despite the downpour, stood at the portcullis. "Late to walk that road alone," she said. Crates of provisions were stacked under the arch, already wet.';
    const pads = fallbackOpeningPads(state, prose);
    expect(pads).toHaveLength(3);
    expect(pads.some((p) => /^Take the kit$/i.test(p))).toBe(false);
    expect(pads.some((p) => /Keep your own kit/i.test(p))).toBe(true);
    expect(pads.some((p) => /crate/i.test(p))).toBe(true);
  });

  it('accepts the live Nollshaw draft 1 as page 1 without a retry', async () => {
    const state = withInstance('dnd', nollshawInst, 'pr31-live-dnd-keep');
    const raw = JSON.stringify({
      prose: NOLLshawDraft1Prose,
      options: nollshawDraft1Options,
      journalTitle: 'What Answered at Nollshaw Well',
    });
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return raw;
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(false);
      expect(result.prose).toBe(NOLLshawDraft1Prose);
      // Brief 04 — journal title comes from typed beats / minted names, not the writer string.
      expect(result.journal.title).toBe(deriveOpeningJournal(state).title);
      expect(result.pads).toEqual(nollshawDraft1Options);
    }
  });
});
