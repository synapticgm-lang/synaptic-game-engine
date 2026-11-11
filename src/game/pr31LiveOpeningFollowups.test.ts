import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import {
  fallbackOpeningPads,
  mockLiveOpeningProse,
  shapeOpeningPads,
  validateLiveOpeningProse,
  validateOpeningCastVoice,
  validateOpeningJournalTitle,
  validateOpeningOptions,
  writeLiveOpening,
} from './liveOpening';
import {
  closeUnbalancedBraces,
  formatLaterTurnNameRail,
  formatOpeningPage1Rail,
  openingProseLeaksStructuredJson,
  readOpeningStructuredOutput,
  rewriteOpeningMarkup,
} from './openingWriterNotes';
import { ensureSystemReceipt, sanitizeOpeningNarration } from './openingEstablishment';
import { campaignCanonicalHubNames } from './outdoorHubs';
import { genderForPersonName } from './personNames';
import type { GameState, Settings } from './types';

const cinder: OpeningHookSnapshot = {
  location: 'the ash-heat of Cinderwake Trail',
  whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
  openingOffer:
    "Brother Oren's waterskin and a scarf, or Kessa's brand-iron, or neither — both are offers, not your gear.",
  pressingNeed: 'The Pellane scouts want an answer.',
  page1: 'Heat rises off the ash of Cinderwake Trail.',
};

const settings = { contentMode: 'adult' } as Settings;

function game(engineMode: GameState['engineMode'] = 'litrpg', seed = 'pr31-live-1'): GameState {
  const base = {
    ...createInitialState('The Summoned Pact', engineMode),
    seed,
    campaignBibleId: 'summoned-pact',
  };
  return attachOpeningInstance(base, cinder, cinder.page1);
}

function asJson(state: GameState, prose: string, extras?: { options?: string[]; journalTitle?: string }) {
  return JSON.stringify({
    prose,
    options: extras?.options ?? shapeOpeningPads(state, prose),
    journalTitle: extras?.journalTitle ?? `${state.openingEstablishment!.instance!.cast[0]!.name.split(/\s+/)[0]} at ${state.openingEstablishment!.instance!.placeName}`,
  });
}

describe('PR31 live-opening follow-ups', () => {
  it('strips and converts raw <system> tags in the sanitiser; LitRPG uses the later-turn System style', () => {
    const state = game('litrpg');
    const inst = state.openingEstablishment!.instance!;
    const raw =
      `Heat shimmers off ${inst.placeName}. ${inst.cast[0]!.name} is already in motion. ` +
      `<system>Registration pending. Designation required.</system> ` +
      `${inst.cast[1]!.name} has not looked away.`;
    expect(sanitizeOpeningNarration(raw)).toBe(raw);
    const rewritten = rewriteOpeningMarkup(raw, 'litrpg');
    expect(rewritten).toContain('[ SYSTEM ]');
    expect(rewritten).toContain('Registration pending. Designation required.');
    expect(rewritten).not.toMatch(/<\/?system/i);
    const painted = ensureSystemReceipt(state, sanitizeOpeningNarration(raw));
    expect(painted).toContain('[ SYSTEM ]');
    expect(painted).not.toMatch(/<\/?system/i);
    // Tabletop / non-LitRPG keeps the inner sentence but not the tags or registrar chrome.
    const plain = rewriteOpeningMarkup(raw, 'rpg');
    expect(plain).toContain('Registration pending. Designation required.');
    expect(plain).not.toMatch(/<\/?system/i);
    expect(plain).not.toContain('[ SYSTEM ]');
    // Unknown tags are stripped, inner text kept; tag-free typographic prose is unchanged.
    expect(rewriteOpeningMarkup('Hello <foo>bar</foo> there.', 'litrpg')).toMatch(/Hello\s+bar\s+there\./);
    const typographic = `“Talk is done,” ${inst.cast[0]!.name} says at ${inst.placeName}.`;
    expect(rewriteOpeningMarkup(typographic, 'litrpg')).toBe(typographic);
    expect(sanitizeOpeningNarration(typographic)).toBe(typographic);
  });

  it('leak gate fails on raw angle-bracket tags and writeLiveOpening retries then fails closed if they persist', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const tagged =
      `${inst.placeName} is already under you, named and ordinary, not a blur. ` +
      `${inst.cast[0]!.name} is already in motion. ` +
      `<system>Registration pending. Designation required.</system> ` +
      'You keep your own kit if you refuse.';
    expect(openingProseLeaksStructuredJson(tagged)).toBe(true);
    expect(openingProseLeaksStructuredJson(tagged.replace(/<system>[\s\S]*?<\/system>/, 'The air is counted.'))).toBe(false);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return asJson(state, tagged);
      },
    });
    expect(calls).toBe(2);
    expect(result.ok).toBe(false);
  });

  it('keeps round-5 and round-6 leak shapes failing closed, and loosens plain colons', () => {
    const prose = 'The ash trail is already named and ordinary, not a blur.';
    expect(openingProseLeaksStructuredJson(`${prose} { "options": ["Look around first"] }`)).toBe(true);
    expect(openingProseLeaksStructuredJson(`${prose}\n}, { "journalTitle": "Arrival" }`)).toBe(true);
    expect(openingProseLeaksStructuredJson(`${prose} “options”: ["Look around first"]`)).toBe(true);
    expect(openingProseLeaksStructuredJson('"prose": "The ash trail is already named."')).toBe(true);
    expect(openingProseLeaksStructuredJson('options: ["Walk with Idra"]')).toBe(true);
    expect(openingProseLeaksStructuredJson('journalTitle: "Two Sets of Prints"')).toBe(true);
    expect(openingProseLeaksStructuredJson("‘options’: [\"Walk\"]")).toBe(true);

    expect(openingProseLeaksStructuredJson('Your options: walk or stay, and you keep your own kit.')).toBe(false);
    expect(openingProseLeaksStructuredJson('The choices: the loft, the dock, or the road.')).toBe(false);
    expect(openingProseLeaksStructuredJson('The scene: a dusty warehouse loft above the salt dock.')).toBe(false);
    expect(openingProseLeaksStructuredJson("The miners': share is already on the table.")).toBe(false);
    expect(openingProseLeaksStructuredJson('Hobb: “The water is already going at 12:00.”')).toBe(false);
  });

  it('closeUnbalancedBraces counts only braces outside strings', () => {
    const slice = '{ "prose": "A {ward mark sat in the ash.", "options": ["Walk"], "journalTitle": "Title"';
    const closed = closeUnbalancedBraces(slice);
    expect((closed.match(/{/g) ?? []).length).toBe(2); // one real, one inside the string
    expect(closed.endsWith('}')).toBe(true);
    expect(closed.endsWith('}}')).toBe(false);
    const parsed = readOpeningStructuredOutput(slice);
    expect(parsed?.prose).toContain('{ward');
    expect(parsed?.journalTitle).toBe('Title');
  });

  it('rejects a self-introduction and pronouns that disagree with minted gender, and puts gender in the prompt', () => {
    const state = (() => {
      for (const seed of ['pr30-live-cinder-b', 'pr31-gender', 'pr31-gender-2', 'pr31-gender-3', 'pr31-gender-4']) {
        const s = game('litrpg', seed);
        const g = new Set(s.openingEstablishment!.instance!.cast.map((c) => c.gender));
        if (g.has('male') && g.has('female')) return s;
      }
      return game('litrpg', 'pr30-live-cinder-b');
    })();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.cast).toHaveLength(2);
    expect(inst.cast.some((c) => c.gender === 'male')).toBe(true);
    expect(inst.cast.some((c) => c.gender === 'female')).toBe(true);
    expect(inst.cast.every((c) => c.gender === 'male' || c.gender === 'female')).toBe(true);
    const rail = formatOpeningPage1Rail(state);
    for (const member of inst.cast) {
      expect(rail).toContain(member.name);
      expect(rail).toMatch(new RegExp(`${member.name} — ${member.gender === 'female' ? 'woman' : 'man'}`));
      expect(genderForPersonName(member.name)).toBe(member.gender);
    }

    const woman = inst.cast.find((c) => c.gender === 'female') ?? inst.cast[0]!;
    const man = inst.cast.find((c) => c.gender === 'male') ?? inst.cast[1] ?? inst.cast[0]!;
    // Cinderwake B: a woman introduces herself with the man's name.
    const swapped =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `A woman knelt at the edge of the marks. She looked up. "${man.name}. I track." ` +
      `${woman.name} has not looked away. You keep your own kit if you refuse.`;
    expect(validateOpeningCastVoice(state, swapped).some((e) => /self-introduction gender mismatch/i.test(e))).toBe(true);
    expect(validateLiveOpeningProse(state, swapped).length).toBeGreaterThan(0);

    // Cinderwake A: next-sentence pronoun disagrees with minted gender.
    const wrongPronoun =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `${woman.name} was the first to speak. He crouched by the dead fire. ` +
      `${man.name} has not looked away. You keep your own kit if you refuse.`;
    expect(validateOpeningCastVoice(state, wrongPronoun).some((e) => /pronoun does not match minted gender/i.test(e))).toBe(true);

    const ok =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `${woman.name} was the first to speak. She crouched by the dead fire. ` +
      `${man.name} has not looked away. You keep your own kit if you refuse.`;
    expect(validateOpeningCastVoice(state, ok)).toEqual([]);
  });

  it('rejects a comma-separated list of names and places as a journal title', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const list = `${inst.placeName}, ${inst.cast[0]!.name}, ${inst.cast[1]!.name}`;
    expect(validateOpeningJournalTitle(state, list)).toContain('journal title is a list of names and places');
    expect(validateOpeningJournalTitle(state, `Two Sets of Prints on ${inst.placeName}`)).toEqual([]);
    expect(validateOpeningJournalTitle(state, `${inst.placeName}, the crew waiting`)).toEqual([]);
  });

  it('picks a proper named campaign hub as nearbyLandmark, never a generic alias like caravan', () => {
    const warehouse: OpeningHookSnapshot = {
      location: 'a warehouse loft',
      whoHere: 'the crew',
      pressingNeed: 'First move is yours — the plan, the cut, or the walk.',
    };
    const salt = mintOpeningInstance(warehouse, 'pr31-salt|salt-road-heist|opening-instance', {
      bibleId: 'salt-road-heist',
      engineMode: 'rpg',
    });
    const saltHubs = campaignCanonicalHubNames('salt-road-heist');
    expect(salt.nearbyLandmark).toBeTruthy();
    expect(salt.nearbyLandmark).not.toMatch(/^caravan$/i);
    expect(saltHubs).toContain(salt.nearbyLandmark);

    const landmarks = Array.from({ length: 9 }, (_, i) =>
      mintOpeningInstance(cinder, `pr31-cinder-seed-${i}|summoned-pact|opening-instance`, { bibleId: 'summoned-pact' })
        .nearbyLandmark
    );
    const pactHubs = campaignCanonicalHubNames('summoned-pact');
    expect(landmarks.every((l) => l && pactHubs.includes(l))).toBe(true);
    expect(landmarks.every((l) => !/^caravan$|^reliquary$|^cinderflow$/i.test(l ?? ''))).toBe(true);
    expect(landmarks.some((l) => /Cinderflow Road|Saint Vhal|Lowmarket|Greyhollow|Valespire|Pellane/i.test(l ?? ''))).toBe(true);
  });

  it('mentions the nearby landmark on the later-turn name rail', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.nearbyLandmark).toBeTruthy();
    const unwritten = formatLaterTurnNameRail(state);
    expect(unwritten).toBe('');
    const later: GameState = {
      ...state,
      openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true, complete: true },
    };
    const rail = formatLaterTurnNameRail(later);
    expect(rail).toContain(inst.nearbyLandmark!);
    expect(rail).toMatch(/still on the map/i);
  });

  it('prefers a fully valid second draft over first prose plus generic fallback pads', async () => {
    const state = game('litrpg', 'pr31-retry');
    const inst = state.openingEstablishment!.instance!;
    const firstProse =
      `${inst.placeName} is already under you, named and ordinary, not a blur. ` +
      `${inst.cast[0]!.name} is already in motion and has not looked away. ` +
      'Heat rises off the ash, but the sentences are newly written for this run. ' +
      'You keep your own kit if you refuse.';
    // Options name the second person, who is not in the first prose — this is why live C retried and fell back.
    const badOptions = [
      `Walk with ${inst.cast[1]!.name} for water and the pilgrim scarf`,
      `Stay for ${inst.cast[0]!.name} and take the hunt for the brand-iron`,
      'Keep your own kit and refuse both offers',
      `Ask ${inst.cast[1]!.name.split(/\s+/)[0]} about the prints`,
    ];
    const secondProse =
      `${inst.placeName} is already under you, named and ordinary, not a blur. ` +
      `${inst.cast[0]!.name} is already in motion, and ${inst.cast[1]!.name} has not looked away. ` +
      'The waterskin and the brand-iron are both on offer. You keep your own kit if you refuse.';
    const goodOptions = [
      `Walk with ${inst.cast[0]!.name} for the waterskin`,
      `Stay for ${inst.cast[1]!.name} and take the hunt`,
      'Keep your own kit and refuse both offers',
      `Look around ${inst.placeName}`,
    ];
    expect(validateLiveOpeningProse(state, firstProse)).toEqual([]);
    expect(validateOpeningOptions(state, secondProse, goodOptions)).toEqual([]);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        if (calls === 1) {
          return asJson(state, firstProse, { options: badOptions, journalTitle: `Arrival at ${inst.placeName}` });
        }
        return asJson(state, secondProse, { options: goodOptions, journalTitle: `The waterskin at ${inst.placeName}` });
      },
    });
    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retried).toBe(true);
      expect(result.prose).toBe(secondProse);
      expect(result.pads).toEqual(goodOptions);
      expect(result.pads.join(' ')).not.toMatch(/Wait and listen|Stand your ground/i);
    }
  });

  it('builds fallback pads from the prose (crates, loft, crew) instead of only generic fillers', () => {
    const warehouse: OpeningHookSnapshot = {
      location: 'a warehouse loft',
      whoHere: 'the crew',
      pressingNeed: 'First move is yours.',
    };
    const state = attachOpeningInstance(
      { ...createInitialState('Salt Road Heist', 'rpg'), seed: 'pr31-pads', campaignBibleId: 'salt-road-heist' },
      warehouse
    );
    const place = state.openingEstablishment!.instance!.placeName;
    const prose =
      `The newcomer stood at the lip of the loft. ${place} stretched out below the loading dock doors, ` +
      'one wide room of crates and rope. The crew was already there. They had been waiting long enough to stop talking.';
    const pads = fallbackOpeningPads(state, prose);
    expect(pads.length).toBe(4);
    expect(pads.some((p) => /crate|loft|crew|loading dock|warehouse/i.test(p))).toBe(true);
    // Generic last-resort pads should not fill the whole set when the prose has concrete nouns.
    const generic = pads.filter((p) => /Wait and listen|Stand your ground/i.test(p));
    expect(generic.length).toBeLessThan(2);
  });
});
