/**
 * Live 11 Nov 2026 (PR32+PR33 checks): prose-derived accept chips were not
 * recognised, and option-name validation false-rejected Head / Show / Greyhollow Inn.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import { applySuccessfulLiveOpening, validateOpeningOptions } from './liveOpening';
import { applyOpeningOfferChoice, isOfferRefuseLine } from './openingOffer';
import { isAcceptOfferLine } from './openingEstablishment';
import { classifyOpeningOfferInput, openingOfferPadIdentityMatch } from './openingOfferRecognize';
import type { GameState } from './types';

const CINDER_HOOK: OpeningHookSnapshot = {
  location: 'the ash-heat of Cinderwake Trail',
  whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
  openingOffer:
    "Brother Oren's waterskin and a scarf, or Kessa's brand-iron, or neither — both are offers, not your gear.",
  pressingNeed: 'The Pellane scouts want an answer.',
  howYouGotHere: 'You woke in a scorched circle on the trail.',
  faction: 'the Pellane scouts',
};

const CINDER_PROSE =
  'Heat came off the ash in slow waves, and the light that had taken them spat them out onto Nairnvale Trail with the sound of a held breath released. The newcomer stood in the middle of a road that was not a road but a scar — grey dust packed into the shape of a path, one set of prints cutting through it, fresh and deliberate. The stranger\'s clothes clung wrong to their skin; the ash was already in the seams. On their wrist sat a worn device, snug as if grown there, and only their eyes could read the small cold text inside it. Health. A pool. A level. It waited. Ahead, the prints led to a woman who had just finished carving something into the dust — a tracking-rite, ash stirred into lines that told her what had walked here before the newcomer did. Wenna Coyne straightened, brown pilgrim\'s habit grey at the hem, a waterskin on her hip and a scarf looped at her throat. Behind her, farther down Nairnvale Trail, Lisle Merrow crouched over the same prints with a tracker\'s stillness, a brand-iron laid flat on a fold of cloth beside her. Neither of them had expected to find a person standing inside a set of tracks that should have been empty. Wenna Coyne looked the newcomer over once, unhurried, then spoke. The offer hung in the ash-heat: walk with Wenna Coyne, and she would share water and a pilgrim scarf for the road. Stay for Lisle Merrow, and the brand-iron could be the newcomer\'s if they took her hunt. Or keep the Earth clothes and the Earth device, and have both of them at once.';

const CINDER_PADS = [
  'Walk with Wenna Coyne for water and the scarf',
  'Stay for Lisle Merrow and take her hunt for the brand-iron',
  'Ask what the prints were tracking',
  'Say nothing and study the device on your wrist',
];

const KEEP_PROSE_DRAFT1 =
  "Thatchleigh Gate stood open at the newcomer's back, its iron hinges still ticking as the night air cooled them. Bertil Fenwick watched from the gatehouse step, a Durn militia cloak pulled tight against the damp, and the newcomer gave him the plain truth of the road: the treeline, the dark, and the walk that had led here after sunset. Bertil listened without interrupting. When the newcomer finished, he only nodded once toward the lantern-light down the lane, where Greyhollow Inn kept its door cracked and warm against the cold, and said the bar had room for a body that wanted to be inside it.";

const KEEP_PROSE_DRAFT2 =
  "Bertil Fenwick stood his ground on the gate road, thumbs hooked in his belt, watching the newcomer the way a man watches weather he means to wait out. The torch behind him threw his shadow long across Thatchleigh Gate's timber and iron. Whatever the newcomer said, it landed the way words land on a man who already made up his mind. He shook his head once, slow. The woods pressed black at their backs. He'd asked them inside, and the asking hadn't changed.";

function pinCast(state: GameState, place: string, landmark: string, cast: Array<{ name: string; role: string }>, bibleId: string): GameState {
  const inst = state.openingEstablishment!.instance!;
  return {
    ...state,
    campaignBibleId: bibleId,
    currentLocation: place,
    openingEstablishment: {
      ...state.openingEstablishment!,
      instance: {
        ...inst,
        placeName: place,
        nearbyLandmark: landmark,
        cast: cast.map((c) => ({ ...c, gender: undefined })),
      },
      pickedHook: [
        `Where you are: ${place}`,
        `Who is here: ${cast.map((c) => c.name).join(' and ')}`,
        `Opening offer: Walk with ${cast[0]!.name} and take a field kit (a field kit). Or refuse and keep your own kit.`,
        'If you refuse: Keep your own kit.',
      ].join('\n'),
    },
  };
}

function cinderState(): GameState {
  const base = attachOpeningInstance(
    { ...createInitialState('The Summoned Pact', 'litrpg'), seed: 'pr32-33-live-cinder', campaignBibleId: 'summoned-pact' },
    CINDER_HOOK,
    CINDER_HOOK.openingOffer,
  );
  return pinCast(
    base,
    'Nairnvale Trail',
    'Pellane War Camp',
    [
      { name: 'Wenna Coyne', role: 'priest' },
      { name: 'Lisle Merrow', role: 'tracker' },
    ],
    'summoned-pact',
  );
}

function keepState(): GameState {
  const hook: OpeningHookSnapshot = {
    location: 'the gate road of Greyhollow',
    whoHere: 'a militia corporal on the step',
    openingOffer: 'Hear him out, or keep your own kit.',
  };
  const base = attachOpeningInstance(
    { ...createInitialState('The Cursed Keep', 'dnd'), seed: 'pr32-33-live-keep', campaignBibleId: 'cursed-keep' },
    hook,
  );
  return pinCast(
    base,
    'Thatchleigh Gate',
    "Mira's Apothecary",
    [{ name: 'Bertil Fenwick', role: 'militia' }],
    'cursed-keep',
  );
}

describe('opening offer chip recognition (live 11 Nov 2026 drafts)', () => {
  it('still recognises classic take-the-kit / accept lines without a state', () => {
    expect(isAcceptOfferLine('Take the kit')).toBe(true);
    expect(isAcceptOfferLine('I accept')).toBe(true);
    expect(isAcceptOfferLine('Walk with Wenna Coyne for water and the scarf')).toBe(false);
    expect(isOfferRefuseLine('I refuse the offer')).toBe(true);
  });

  it('tags the live Cinderwake pads and accepts the short "Walk with Wenna for water" chip', () => {
    const opened = applySuccessfulLiveOpening(cinderState(), CINDER_PROSE, {
      pads: CINDER_PADS,
      journalTitle: 'The Prints on Nairnvale Trail',
    });
    const kinds = opened.openingEstablishment?.offerPadKinds ?? [];
    expect(kinds.find((p) => p.label === CINDER_PADS[0])?.kind).toBe('accept');
    expect(kinds.find((p) => p.label === CINDER_PADS[1])?.kind).toBe('accept');
    expect(kinds.some((p) => /Ask what the prints/i.test(p.label) && p.kind === 'accept')).toBe(false);

    expect(classifyOpeningOfferInput(opened, 'Walk with Wenna Coyne for water and the scarf')).toBe('accept');
    expect(classifyOpeningOfferInput(opened, 'Walk with Wenna for water')).toBe('accept');
    expect(classifyOpeningOfferInput(opened, 'Stay for Lisle Merrow and take her hunt for the brand-iron')).toBe('accept');
    expect(classifyOpeningOfferInput(opened, "I'll walk with Wenna Coyne")).toBe('accept');
    expect(classifyOpeningOfferInput(opened, 'Ask what the prints were tracking')).toBe('none');
    expect(classifyOpeningOfferInput(opened, 'Keep your own kit')).toBe('refuse');
    expect(classifyOpeningOfferInput(opened, 'Keep your own Earth kit and stay with both of them')).toBe('refuse');

    const taken = applyOpeningOfferChoice(opened, 'Walk with Wenna for water');
    expect(taken.receipts.join('\n')).toMatch(/Offer accepted/i);
    expect(taken.state.openingEstablishment?.offerTaken).toBe('accepted');

    const refused = applyOpeningOfferChoice(opened, 'Keep your own kit');
    expect(refused.receipts.join('\n')).toMatch(/Offer refused/i);
    expect(refused.state.openingEstablishment?.offerTaken).toBe('refused');
  });

  it('does not treat Head, Show, or Greyhollow Inn as missing option names', () => {
    const state = keepState();
    const draft1 = [
      'Head for the lit door of Greyhollow Inn',
      'Ask Bertil what he knows about the treeline',
      'Keep your kit close and take the gatehouse side of the lane',
    ];
    expect(validateOpeningOptions(state, KEEP_PROSE_DRAFT1, draft1).join('\n')).not.toMatch(
      /option names (?:Head|Show|Greyhollow Inn)/i,
    );

    const draft2 = [
      'Ask why the bar and not the woods',
      'Walk with Bertil to the Greyhollow Inn',
      'Show him the keep road behind you',
    ];
    const errors2 = validateOpeningOptions(state, KEEP_PROSE_DRAFT2, draft2);
    expect(errors2.join('\n')).not.toMatch(/option names (?:Head|Show|Greyhollow Inn)/i);

    // A locked person who is not in the prose must still fail.
    const missingPerson = validateOpeningOptions(state, KEEP_PROSE_DRAFT2, [
      'Walk with Wenna Coyne for water and the scarf',
      'Ask Bertil about the deal',
      'Keep your own kit',
    ]);
    expect(missingPerson.join('\n')).toMatch(/option names Wenna Coyne/i);
  });

  it('does not treat ordinary take/follow/help lines or "keep your kit close" as offer choices', () => {
    const opened = applySuccessfulLiveOpening(cinderState(), CINDER_PROSE, {
      pads: CINDER_PADS,
      journalTitle: 'The Prints on Nairnvale Trail',
    });
    expect(classifyOpeningOfferInput(opened, 'Take a closer look at Wenna')).toBe('none');
    expect(classifyOpeningOfferInput(opened, 'Follow the prints toward Wenna')).toBe('none');
    expect(classifyOpeningOfferInput(opened, 'Help Wenna read the tracks')).toBe('none');
    expect(classifyOpeningOfferInput(opened, 'Join Wenna on the trail')).toBe('none');
    expect(classifyOpeningOfferInput(opened, 'Keep your kit close and take the gatehouse side of the lane')).toBe('none');
    expect(applyOpeningOfferChoice(opened, 'Take a closer look at Wenna').receipts).toEqual([]);
    expect(applyOpeningOfferChoice(opened, 'Keep your kit close and take the gatehouse side of the lane').receipts).toEqual([]);
    // Clear refusals and tight accept phrases still work.
    expect(classifyOpeningOfferInput(opened, 'Keep your own kit')).toBe('refuse');
    expect(classifyOpeningOfferInput(opened, 'Walk with Wenna Coyne for water and the scarf')).toBe('accept');
  });

  it('does not treat a mid-pad tail as chip identity unless it starts the pad or names the person or verb', () => {
    const pad = 'Walk with Wenna Coyne for water and the scarf';
    expect(openingOfferPadIdentityMatch(pad, pad)).toBe(true);
    expect(openingOfferPadIdentityMatch('Walk with Wenna for water', pad)).toBe(true);
    expect(openingOfferPadIdentityMatch('Wenna Coyne for water and the scarf', pad)).toBe(true);
    expect(openingOfferPadIdentityMatch('for water and the scarf', pad)).toBe(false);
    expect(openingOfferPadIdentityMatch('water and the scarf', pad)).toBe(false);
    expect(openingOfferPadIdentityMatch('Take a closer look at Wenna', pad)).toBe(false);
  });
});
