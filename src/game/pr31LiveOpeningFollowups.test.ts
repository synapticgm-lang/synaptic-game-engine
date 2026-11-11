import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import {
  applySuccessfulLiveOpening,
  fallbackOpeningPads,
  mentionsName,
  mentionsPlaceName,
  mockLiveOpeningProse,
  shapeOpeningPads,
  STORYTELLER_RETRY_MESSAGE,
  validateLiveOpeningProse,
  validateOpeningCastVoice,
  validateOpeningJournalTitle,
  validateOpeningOptions,
  writeLiveOpening,
} from './liveOpening';
import { proseForSpeech } from './useVoice';
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
    expect(rewriteOpeningMarkup('The **ash** was already hot.', 'litrpg')).toBe('The ash was already hot.');
    expect(rewriteOpeningMarkup('__Scarves__ hang by the door.', 'litrpg')).toBe('Scarves hang by the door.');
    expect(rewriteOpeningMarkup('# The loft is already named.\nThe crew waits.', 'litrpg')).toBe('The loft is already named.\nThe crew waits.');
  });

  it('commits the live Cinderwake-C <system> shape as [ SYSTEM ] text with a clean page and TTS', async () => {
    const state = game('litrpg');
    const inst = state.openingEstablishment!.instance!;
    const raw =
      `Heat shimmered off the ash in slow waves along ${inst.placeName}, bending the line of the trail until it looked like the ground itself was breathing. ` +
      `The newcomer's clothes were wrong for this place — city cotton, a cheap jacket, shoes with no grip — and the **ash** had already worked its way into every seam. ` +
      `Down the trail, two figures had stopped mid-stride. ${inst.cast[0]!.name} was broad and sun-scorched, a pilgrim's scarf wound loose at the throat, a water skin hanging from one hand. ` +
      `${inst.cast[1]!.name} crouched low over the road, one palm flat against a print in the ash, and did not look up. ` +
      `Above the newcomer's head, faint letters turned like a slow clock no one else seemed to notice.\n\n` +
      `<system>Registration pending. Designation required.</system>\n\n` +
      `The crouched one finally lifted her head. The broad one watched without moving, water still in hand, waiting to see what name would come out of the stranger's mouth. ` +
      `You keep your own kit if you refuse.`;
    expect(openingProseLeaksStructuredJson(raw)).toBe(true);
    const rewritten = rewriteOpeningMarkup(raw, 'litrpg');
    expect(rewritten).toContain('[ SYSTEM ]');
    expect(rewritten).toContain('Registration pending. Designation required.');
    expect(rewritten).not.toMatch(/<\/?system/i);
    expect(rewritten).not.toContain('**');
    expect(openingProseLeaksStructuredJson(rewritten)).toBe(false);
    const options = [
      `Walk with ${inst.cast[0]!.name} for water and the pilgrim scarf`,
      `Stay for ${inst.cast[1]!.name} and look at the prints`,
      'Keep your own kit and refuse both offers',
      `Look around ${inst.placeName}`,
    ];
    expect(validateLiveOpeningProse(state, rewritten)).toEqual([]);
    expect(validateOpeningOptions(state, rewritten, options)).toEqual([]);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return asJson(state, raw, { options, journalTitle: `The prints at ${inst.placeName}` });
      },
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prose).toContain('[ SYSTEM ]');
    expect(result.prose).toContain('Registration pending. Designation required.');
    expect(result.prose).not.toMatch(/<\/?[A-Za-z]/);
    expect(result.prose).not.toContain('**');
    const page = ensureSystemReceipt(state, sanitizeOpeningNarration(result.prose));
    expect(openingProseLeaksStructuredJson(page)).toBe(false);
    expect(page).toContain('[ SYSTEM ]');
    expect(page).not.toMatch(/<\/?[A-Za-z]/);
    const committed = applySuccessfulLiveOpening(state, raw, { pads: result.pads, journalTitle: result.journal.title });
    expect(committed.openingEstablishment?.sceneWritten).toBe(true);
    const tts = proseForSpeech(page);
    expect(tts).toContain('Registration pending. Designation required.');
    expect(tts).toContain(inst.placeName);
    expect(tts).not.toMatch(/<\/?system/i);
    expect(tts).not.toMatch(/\[\s*SYSTEM\s*\]/i);
    expect(tts).not.toContain('<');
    expect(tts).not.toContain('**');
  });

  it('leak gate rejects leftover unclosed tags after rewrite, and writeLiveOpening fails closed if they persist', async () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const leftover =
      `${inst.placeName} is already under you, named and ordinary, not a blur. ` +
      `${inst.cast[0]!.name} is already in motion. ` +
      '<system Registration pending. Designation required. ' +
      'You keep your own kit if you refuse. Heat rises off the ash for this run.';
    expect(rewriteOpeningMarkup(leftover, 'litrpg')).toContain('<system Registration');
    expect(openingProseLeaksStructuredJson(rewriteOpeningMarkup(leftover, 'litrpg'))).toBe(true);
    expect(openingProseLeaksStructuredJson(`${inst.placeName} is ordinary. A sign says 3 < 5 and the count is honest.`)).toBe(false);
    expect(openingProseLeaksStructuredJson(`${inst.placeName} sits by the <ward stones.`)).toBe(true);
    let calls = 0;
    const result = await writeLiveOpening(state, settings, {
      writer: async () => {
        calls += 1;
        return asJson(state, leftover);
      },
    });
    expect(calls).toBe(2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(STORYTELLER_RETRY_MESSAGE);
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
    expect(openingProseLeaksStructuredJson('Your options: "walk" or "stay."')).toBe(false);
    expect(openingProseLeaksStructuredJson('The scene: "a dusty loft"')).toBe(false);
    expect(openingProseLeaksStructuredJson('options: "walk", "choices": "stay"')).toBe(true);

    const withSystem = 'The ash trail is already named.\n[ SYSTEM ]\nRegistration pending.\nThe air is counted.';
    expect(openingProseLeaksStructuredJson(withSystem)).toBe(false);
    expect(openingProseLeaksStructuredJson('[ SYSTEM NOTICE ]\nRegistration pending.')).toBe(true);
    expect(openingProseLeaksStructuredJson('[ "Walk with Idra" ]')).toBe(true);
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

    // Next-sentence He/She and "sat with his brother" are not high-precision enough to reject.
    const nellCrouched =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `${woman.name} crouched by the dead fire. He watched from the other side of the prints. ` +
      `${man.name} has not looked away. You keep your own kit if you refuse. ` +
      'Heat rises off the ash, but the sentences are newly written for this run.';
    expect(validateOpeningCastVoice(state, nellCrouched)).toEqual([]);
    expect(validateLiveOpeningProse(state, nellCrouched)).toEqual([]);

    const withBrother =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `${woman.name} sat with his brother near the dead fire. ` +
      `${man.name} has not looked away. You keep your own kit if you refuse. ` +
      'Heat rises off the ash, but the sentences are newly written for this run.';
    expect(validateOpeningCastVoice(state, withBrother)).toEqual([]);
    expect(validateLiveOpeningProse(state, withBrother)).toEqual([]);

    // Explicit appositive / descriptor next to the name still fails when it conflicts.
    const appositive =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `The woman, ${man.name}, knelt at the edge of the marks. ` +
      `${woman.name} has not looked away. You keep your own kit if you refuse.`;
    expect(validateOpeningCastVoice(state, appositive).some((e) => /descriptor does not match minted gender/i.test(e))).toBe(true);

    const appositiveAfter =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `${man.name}, a woman, knelt at the edge of the marks. ` +
      `${woman.name} has not looked away. You keep your own kit if you refuse.`;
    expect(validateOpeningCastVoice(state, appositiveAfter).some((e) => /descriptor does not match minted gender/i.test(e))).toBe(true);

    const matchingDescriptor =
      `${inst.placeName} is already named and ordinary, not a blur. ` +
      `The man, ${man.name}, knelt at the edge of the marks. ` +
      `${woman.name} has not looked away. You keep your own kit if you refuse.`;
    expect(validateOpeningCastVoice(state, matchingDescriptor)).toEqual([]);

    expect(formatOpeningPage1Rail(state)).toMatch(/he\/him\/his/i);
  });

  it('requires the full minted place name or a distinctive token, never a generic suffix alone', () => {
    const state = game();
    const inst = state.openingEstablishment!.instance!;
    const place = inst.placeName;
    const tokens = place.split(/\s+/);
    expect(tokens.length).toBeGreaterThanOrEqual(2);
    const suffix = tokens[tokens.length - 1]!;
    expect(suffix).toMatch(/Trail|Road|Hollow|Crossing|Camp|Inn|Gate|Keep|Hall/i);
    const distinctive = tokens[0]!;
    expect(mentionsPlaceName(`They stood on ${place} in the heat.`, place)).toBe(true);
    expect(mentionsPlaceName(`They stood at ${place.toLowerCase()} in the heat.`, place)).toBe(true);
    expect(mentionsPlaceName(`The wind off ${distinctive} was already hot.`, place)).toBe(true);
    expect(mentionsPlaceName('They walked the trail until the heat broke.', place)).toBe(false);
    expect(mentionsPlaceName(`They walked the ${suffix} until the heat broke.`, place)).toBe(false);
    expect(mentionsPlaceName('They crossed the road, then the hollow, then a crossing.', place)).toBe(false);
    expect(mentionsPlaceName('Vossleigh was already under them.', 'Vossleigh Crossing')).toBe(true);
    expect(mentionsPlaceName('They waited at the crossing.', 'Vossleigh Crossing')).toBe(false);

    const trailOnly =
      `They walk the trail, named and ordinary, not a blur. ` +
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away. ` +
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit. ' +
      'Heat rises off the ash, but the sentences are newly written for this run.';
    expect(validateLiveOpeningProse(state, trailOnly).some((e) => new RegExp(`missing place ${place}`, 'i').test(e))).toBe(true);

    const distinctiveOnly =
      `${distinctive} is already under you, named and ordinary, not a blur. ` +
      `${inst.cast[0]!.name} has a waterskin half raised, and ${inst.cast[1]!.name} has not looked away. ` +
      'The offer is water and a scarf, or a brand-iron, or you keep your own kit. ' +
      'Heat rises off the ash, but the sentences are newly written for this run.';
    expect(validateLiveOpeningProse(state, distinctiveOnly)).toEqual([]);

    // Person names still match by first or last name.
    const first = inst.cast[0]!.name.split(/\s+/)[0]!;
    const last = inst.cast[0]!.name.split(/\s+/).slice(-1)[0]!;
    expect(mentionsName(`Then ${first} looked up from the prints.`, inst.cast[0]!.name)).toBe(true);
    expect(mentionsName(`Then ${last} looked up from the prints.`, inst.cast[0]!.name)).toBe(true);
    expect(mentionsName(`${inst.cast[0]!.name} looked up from the prints.`, inst.cast[0]!.name)).toBe(true);
    expect(mentionsName('Nobody named them in this sentence.', inst.cast[0]!.name)).toBe(false);
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
