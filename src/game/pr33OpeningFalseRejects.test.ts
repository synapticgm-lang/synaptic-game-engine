import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  alignHookPronouns,
  givenNameOf,
  mintOpeningInstance,
  type OpeningHookSnapshot,
} from './openingInstance';
import {
  fallbackOpeningPads,
  mentionsPlaceName,
  optionPronounErrors,
  validateLiveOpeningProse,
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
  cast: [{ name: 'Tilde Barrow', role: 'priest', gender: 'female' }],
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
    { name: 'Wenna Merrow', role: 'tracker', gender: 'female' },
    { name: 'Ysolde Marl', role: 'tracker', gender: 'female' },
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

describe('PR33 opening false rejects', () => {
  it('accepts Nollshaw Well draft 1 when the title names the well and the prose says "the well"', () => {
    const state = withInstance('dnd', nollshawInst, 'pr31-live-dnd-keep');
    expect(mentionsPlaceName(NOLLshawDraft1Prose, 'Nollshaw Well')).toBe(false);
    expect(validateLiveOpeningProse(state, NOLLshawDraft1Prose).some((e) => /missing place Nollshaw Well/i.test(e))).toBe(true);
    expect(validateLiveOpeningProse(state, NOLLshawDraft1Prose, 'What Answered at Nollshaw Well')).toEqual([]);
    expect(validateOpeningOptions(state, NOLLshawDraft1Prose, nollshawDraft1Options)).toEqual([]);
  });

  it('still rejects a bare generic trail or road with no coined stem in the title or prose', () => {
    const state = withInstance('litrpg', merrowInst);
    const trailOnly =
      'They walk the trail, named and ordinary, not a blur. Wenna Merrow has a waterskin half raised, and Ysolde Marl has not looked away. The offer is water and a scarf, or a brand-iron, or you keep your own kit. Heat rises off the ash, but the sentences are newly written for this run.';
    expect(validateLiveOpeningProse(state, trailOnly, 'Along the Trail').some((e) => /missing place Merrowbury Trail/i.test(e))).toBe(true);
    expect(validateLiveOpeningProse(state, trailOnly, 'The Road, After Dark').some((e) => /missing place Merrowbury Trail/i.test(e))).toBe(true);
    expect(mentionsPlaceName('They walked the trail until the heat broke.', 'Merrowbury Trail')).toBe(false);
    expect(mentionsPlaceName('They crossed the road, then the hollow.', 'Merrowbury Trail')).toBe(false);
  });

  it('does not treat "Keep Earth kit" as a coined name, but still flags a locked person missing from the prose', () => {
    const state = withInstance('litrpg', merrowInst);
    const errors = validateOpeningOptions(state, merrowDraft1Prose, merrowDraft1Options);
    expect(errors.some((e) => /Keep Earth/i.test(e))).toBe(false);
    expect(errors.some((e) => /option names Ysolde/i.test(e))).toBe(true);
    expect(validateLiveOpeningProse(state, merrowDraft1Prose, 'A Name on the Ash Road')).toEqual([]);
  });

  it('still rejects a real missing named person', () => {
    const state = withInstance('litrpg', merrowInst);
    expect(validateLiveOpeningProse(state, merrowDraft2Prose, 'Merrowbury Trail, In Their Prints')).toEqual(
      expect.arrayContaining([expect.stringMatching(/missing named person/i)])
    );
  });

  it('accepts scene titles with a comma and still rejects a real name/place list', () => {
    const merrow = withInstance('litrpg', merrowInst);
    const gate = withInstance('dnd', {
      ...nollshawInst,
      placeName: 'Beltaneleigh Gate',
      placeKind: 'gate',
      nearbyLandmark: "Mira's Apothecary",
      cast: [{ name: 'Rosel Cotter', role: 'militia', gender: 'female' }],
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
    expect(validateLiveOpeningProse(state, nollshawDraft2Prose, 'At Nollshaw Well')).toEqual([]);
  });

  it('never uses Father, Mother, Brother, or Sister as a minted person role, and aligns offer pronouns', () => {
    const hook: OpeningHookSnapshot = {
      location: 'Greyhollow well at Nollshaw',
      whoHere: 'Father Aldous',
      openingOffer:
        'Walk with Father Aldous and he will share what answered from the shaft. The inn lights stay a rumor uphill if you refuse him.',
      pressingNeed: 'Father Aldous wants to know what answered from the shaft.',
    };
    const inst = mintOpeningInstance(hook, 'pr33-father|cursed-keep|opening-instance', {
      bibleId: 'cursed-keep',
      engineMode: 'dnd',
    });
    expect(inst.cast).toHaveLength(1);
    expect(inst.cast[0]!.role).toBe('priest');
    expect(inst.cast.some((c) => /^(father|mother|brother|sister)$/i.test(c.role))).toBe(false);
    const offer = inst.offerSummary ?? '';
    expect(offer).not.toMatch(/Father Aldous/i);
    expect(offer).toMatch(new RegExp(`Walk with ${inst.cast[0]!.name} and `));
    if (inst.cast[0]!.gender === 'female') {
      expect(offer).toMatch(/\bshe will share\b/i);
      expect(offer).not.toMatch(/\bhe will share\b/i);
      expect(offer).toMatch(/refuse her/i);
      expect(offer).not.toMatch(/refuse him/i);
    } else {
      expect(offer).toMatch(/\bhe will share\b/i);
      expect(offer).toMatch(/refuse him/i);
    }
  });

  it('rewrites stale offer pronouns after a two-person name swap', () => {
    const hook: OpeningHookSnapshot = {
      location: 'the ash-heat of Cinderwake Trail',
      whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
      openingOffer:
        'Walk with Brother Oren and he will share water and a pilgrim scarf. Stay for Kessa and she will offer a brand-iron if you take her hunt — or you keep Earth kit and both of them.',
    };
    const inst = mintOpeningInstance(hook, 'pr33-pronouns|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    expect(inst.cast).toHaveLength(2);
    const [a, b] = inst.cast;
    const offer = inst.offerSummary ?? '';
    expect(offer).not.toMatch(/Oren|Kessa/i);
    const aSubj = a!.gender === 'female' ? 'she' : 'he';
    const bSubj = b!.gender === 'female' ? 'she' : 'he';
    const bPoss = b!.gender === 'female' ? 'her' : 'his';
    expect(offer).toMatch(new RegExp(`Walk with ${a!.name} and ${aSubj} will share`, 'i'));
    expect(offer).toMatch(new RegExp(`Stay for ${givenNameOf(b!.name)} and ${bSubj} will offer`, 'i'));
    expect(offer).toMatch(new RegExp(`take ${bPoss} hunt`, 'i'));
    expect(alignHookPronouns(`Walk with ${a!.name} and he will share water.`, [a!])).toMatch(
      new RegExp(`Walk with ${a!.name} and ${aSubj} will share`)
    );
  });

  it('does not use a plural group phrase as one person\'s role', () => {
    const hook: OpeningHookSnapshot = {
      location: 'Greyhollow gate after dark',
      whoHere: 'two militia',
      pressingNeed: 'The militia want you inside the bar, not back in the woods.',
    };
    const inst = mintOpeningInstance(hook, 'pr33-militia|cursed-keep|opening-instance', {
      bibleId: 'cursed-keep',
      engineMode: 'dnd',
    });
    expect(inst.cast.length).toBeGreaterThanOrEqual(1);
    expect(inst.cast[0]!.role).toBe('militia');
    expect(inst.cast[0]!.role).not.toMatch(/two militia/i);
  });

  it('does not fill page-1 pads with an accept chip naming an item the prose never mentions', () => {
    const inst: OpeningInstance = {
      placeName: 'Beltaneleigh Gate',
      placeKind: 'gate',
      nearbyLandmark: "Mira's Apothecary",
      cast: [{ name: 'Rosel Cotter', role: 'militia', gender: 'female' }],
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
      expect(result.journal.title).toBe('What Answered at Nollshaw Well');
      expect(result.pads).toEqual(nollshawDraft1Options);
    }
  });
});
