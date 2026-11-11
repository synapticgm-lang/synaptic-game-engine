import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyReplacements,
  attachOpeningInstance,
  extractTitleNames,
  isLikelyProperName,
  mintOpeningInstance,
  type OpeningHookSnapshot,
} from './openingInstance';
import { formatOpeningCardChrome } from './openingPointerCard';
import { validateLiveOpeningProse } from './liveOpening';

const cinder: OpeningHookSnapshot = {
  location: 'the ash-heat of Cinderwake Trail',
  whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
  openingOffer:
    "Brother Oren's waterskin and a scarf, or Kessa's brand-iron, or neither — both are offers, not your gear.",
  pressingNeed: 'The Pellane scouts want an answer.',
  howYouGotHere: 'You woke in a scorched circle on the trail.',
  page1:
    'Heat rises off the ash of Cinderwake Trail. You are lying on your back in a scorched circle on the trail. Brother Oren has a waterskin half raised.',
};

function seededState(seed: string) {
  return { ...createInitialState('The Summoned Pact', 'litrpg'), seed, campaignBibleId: 'summoned-pact' };
}

describe('openingInstance', () => {
  it('mints different locked names and places for different seeds', () => {
    const a = mintOpeningInstance(cinder, 'seed-alpha|summoned-pact|opening-instance');
    const b = mintOpeningInstance(cinder, 'seed-beta|summoned-pact|opening-instance');
    expect(a.placeName).toMatch(/\S/);
    expect(b.placeName).toMatch(/\S/);
    expect(a.placeName).not.toMatch(/Cinderwake/i);
    expect(b.placeName).not.toMatch(/Cinderwake/i);
    expect(`${a.placeName}|${a.cast.map((c) => c.name).join(',')}`).not.toBe(
      `${b.placeName}|${b.cast.map((c) => c.name).join(',')}`
    );
    expect(a.cast).toHaveLength(2);
    expect(a.retiredNames.join(' ')).toMatch(/Oren/i);
    expect(a.retiredNames.join(' ')).toMatch(/Kessa/i);
    expect(a.retiredNames.join(' ')).toMatch(/Cinderwake/i);
    expect(a.retiredNames.some((n) => /^cinder$/i.test(n))).toBe(false);
    expect(a.retiredNames.join(' ')).not.toMatch(/Pellane/i);
    expect(a.retiredNames.join(' ')).not.toMatch(/Greyhollow|Valespire/i);
    expect(a.cast.some((c) => /Oren|Kessa|Cinder/i.test(c.name))).toBe(false);
  });

  it('always mints a fresh Cinderwake opening place and retires the catalog trail on page 1', () => {
    const inst = mintOpeningInstance(cinder, 'hub-keep|summoned-pact|opening-instance', { bibleId: 'summoned-pact' });
    expect(inst.placeName).not.toMatch(/Cinderwake/i);
    expect(inst.placeName).toMatch(/\S/);
    expect(inst.retiredNames.join(' ')).toMatch(/Oren/i);
    expect(inst.retiredNames.join(' ')).toMatch(/Kessa/i);
    expect(inst.retiredNames.join(' ')).toMatch(/Cinderwake/i);
    expect(inst.retiredNames.some((n) => /^cinder$/i.test(n))).toBe(false);
    expect(inst.retiredNames.join(' ')).not.toMatch(/Greyhollow/i);
    expect(inst.cast).toHaveLength(2);
    expect(inst.cast.some((c) => /Oren|Kessa/i.test(c.name))).toBe(false);
    expect(inst.nearbyLandmark).toBeTruthy();
    expect(inst.nearbyLandmark).not.toMatch(/Cinderwake/i);
  });

  it('gives seven Cinderwake seeds seven different opening places', () => {
    const places = Array.from({ length: 7 }, (_, i) =>
      mintOpeningInstance(cinder, `cinder-seed-${i}|summoned-pact|opening-instance`, { bibleId: 'summoned-pact' }).placeName
    );
    expect(places.every((p) => p && !/cinderwake/i.test(p))).toBe(true);
    expect(new Set(places).size).toBe(7);
  });

  it('names the actual offer on chips and always offers keeping your own kit', () => {
    const inst = mintOpeningInstance(cinder, 'chip-seed|summoned-pact|opening-instance');
    const labels = inst.offerChips.map((c) => c.label);
    expect(labels.some((l) => /Keep your own kit/i.test(l))).toBe(true);
    expect(labels.some((l) => /Accept the offer/i.test(l))).toBe(false);
    expect(labels.some((l) => /water|scarf|brand|hunt|iron/i.test(l))).toBe(true);
    const names = inst.cast.map((c) => c.name.split(/\s+/)[0]!);
    expect(labels.some((l) => names.some((n) => l.includes(n)))).toBe(true);
  });

  it('locks minted place and cast onto the save and drops authored page 1 as a fallback', () => {
    const inst = mintOpeningInstance(cinder, '0|summoned-pact|opening-instance', { bibleId: 'summoned-pact' });
    const state = attachOpeningInstance(seededState('0'), cinder, cinder.page1);
    expect(inst.placeName).not.toMatch(/Cinderwake/i);
    expect(state.currentLocation).toBe(inst.placeName);
    expect(state.openingEstablishment?.instance?.placeName).toBe(inst.placeName);
    expect(state.openingEstablishment?.pinnedNpcNames).toEqual(inst.cast.map((c) => c.name));
    expect(state.openingEstablishment?.pickedHookFallback).toBeUndefined();
    expect(state.openingEstablishment?.page1).toBeUndefined();
    expect(state.openingEstablishment?.authoredPage1Retired).toMatch(/Cinderwake/);
  });

  it('does not treat title-case offer verbs or common nouns as catalog names', () => {
    expect(isLikelyProperName('Walk')).toBe(false);
    expect(isLikelyProperName('Stay')).toBe(false);
    expect(isLikelyProperName('Salt')).toBe(false);
    expect(isLikelyProperName('Glass')).toBe(false);
    expect(isLikelyProperName('Earth')).toBe(false);
    expect(isLikelyProperName('They')).toBe(false);
    expect(isLikelyProperName('Oren')).toBe(true);
    expect(isLikelyProperName('Cinderwake Trail')).toBe(true);
    expect(isLikelyProperName('Salt Road waystation')).toBe(true);
    expect(extractTitleNames('Walk with Oren for water and a scarf')).toEqual(
      expect.arrayContaining(['Oren'])
    );
    expect(extractTitleNames('Walk with Oren for water and a scarf').some((n) => /^walk$/i.test(n))).toBe(false);
    expect(extractTitleNames('Stay and watch the road').some((n) => /^stay$/i.test(n))).toBe(false);
    expect(extractTitleNames('They wait. Earth hangs in the heat.').some((n) => /^(they|earth)$/i.test(n))).toBe(false);
  });

  it('does not mint hook field labels or sentence-initial First', () => {
    expect(isLikelyProperName('First')).toBe(false);
    expect(isLikelyProperName('Talk')).toBe(false);
    expect(isLikelyProperName('Location')).toBe(false);
    expect(isLikelyProperName('Armed')).toBe(false);
    expect(isLikelyProperName('Twenty')).toBe(false);
    expect(isLikelyProperName('Dawn')).toBe(false);
    expect(isLikelyProperName('Abort')).toBe(false);
    const labels = extractTitleNames(
      'Talk is done. First move is yours — the plan, the cut, or the walk. Location: a warehouse loft. Armed hirelings. Twenty outriders. Dawn glare. Abort.'
    );
    expect(labels.some((n) => /^(Talk|First|Location|Armed|Twenty|Dawn|Abort)$/i.test(n))).toBe(false);
    const warehouse: OpeningHookSnapshot = {
      location: 'a warehouse loft',
      whoHere: 'the crew',
      pressingNeed: 'First move is yours — the plan, the cut, or the walk. the crew is waiting on your move.',
      openingOffer: undefined,
    };
    const inst = mintOpeningInstance(warehouse, 'wh-seed|salt-road-heist|opening-instance', {
      bibleId: 'salt-road-heist',
      engineMode: 'rpg',
    });
    expect(inst.retiredNames.some((n) => /^(First|Talk|Location|Armed|Twenty|Dawn|Abort)$/i.test(n))).toBe(false);
  });

  it('keeps Salt Road Waystation as a campaign hub and names the waystation enforcer', () => {
    const hook: OpeningHookSnapshot = {
      location: 'a Salt Road waystation',
      whoHere: 'an enforcer',
      pressingNeed: 'The enforcer wants to hear why you are late.',
    };
    const state = attachOpeningInstance(
      { ...seededState('enforcer-seed'), campaignBibleId: 'salt-road-heist', engineMode: 'rpg' },
      hook
    );
    const inst = state.openingEstablishment!.instance!;
    expect(inst.placeName).not.toMatch(/Salt Road/i);
    expect(inst.alone).toBe(false);
    expect(inst.cast.length).toBeGreaterThanOrEqual(1);
    expect(inst.cast[0]!.role).toMatch(/enforcer/i);
    expect(inst.retiredNames.join(' ')).toMatch(/Salt Road/i);
    expect(inst.retiredNames.join(' ')).not.toMatch(/Greyhollow|Valespire/i);
    const chrome = formatOpeningCardChrome(state);
    expect(chrome).toMatch(new RegExp(inst.placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(chrome).not.toMatch(/You are alone/i);
    expect(chrome).toMatch(new RegExp(inst.cast[0]!.name.split(/\s+/)[0]!, 'i'));
  });

  it('scrubs a non-hub catalog place case-insensitively without remapping Walk, salt, or cinder', () => {
    const hook: OpeningHookSnapshot = {
      location: 'the ash-heat of Hollowmere Track',
      whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
      openingOffer: 'Walk with Oren for water and a scarf, or stay and watch the road.',
    };
    const inst = mintOpeningInstance(hook, 'hollow-verb-seed|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    expect(inst.placeName).not.toMatch(/Hollowmere/i);
    expect(inst.retiredNames.some((n) => /^walk$/i.test(n))).toBe(false);
    expect(inst.retiredNames.some((n) => /^cinder$/i.test(n))).toBe(false);
    expect(inst.retiredNames.join(' ')).toMatch(/Hollowmere/i);
    expect(inst.offerSummary ?? '').toMatch(/\bWalk with\b/i);
    const scrubbed = applyReplacements(
      'Hollowmere Track sits under a chalk eve. A cinder stuck to his shoe. The salt wind pulls at the canvas.',
      inst.nameMap ?? []
    );
    expect(scrubbed).not.toMatch(/Hollowmere Track/i);
    expect(scrubbed).toMatch(/a cinder stuck/i);
    expect(scrubbed).toMatch(/salt wind/i);
    expect(scrubbed).toMatch(new RegExp(inst.placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const state = attachOpeningInstance(seededState('hollow-verb-seed'), hook, hook.page1);
    const attached = state.openingEstablishment!.instance!;
    const okProse = [
      `${attached.placeName} sits under a chalk eve, named and ordinary.`,
      `${attached.cast[0]!.name} has a waterskin half raised, and ${attached.cast[1]!.name} has not looked away.`,
      'A cinder stuck to his shoe. The salt wind pulls at the canvas.',
      'Walk with them for water, or stay and watch the road. You keep your own kit if you refuse.',
    ].join(' ');
    expect(validateLiveOpeningProse(state, okProse)).toEqual([]);
    const leak = `${okProse} You can still see Hollowmere Track from here.`;
    expect(validateLiveOpeningProse(state, leak).some((e) => /retired name/i.test(e))).toBe(true);
  });

  it('bans the hook catalog faction Pellane on page 1', () => {
    const hook: OpeningHookSnapshot = {
      ...cinder,
      faction: 'the Pellane scouts',
    };
    const inst = mintOpeningInstance(hook, 'pellane-fac|summoned-pact|opening-instance', { bibleId: 'summoned-pact' });
    expect(inst.retiredNames.join(' ')).toMatch(/Pellane/i);
    expect(inst.factionName).toBeTruthy();
    expect(inst.factionName).not.toMatch(/Pellane/i);
  });

  it('mints a wide variety of place names so two seeds rarely collide', () => {
    const names = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const inst = mintOpeningInstance(cinder, `variety-${i}|summoned-pact|opening-instance`);
      names.add(inst.placeName);
      expect(inst.placeName).not.toMatch(/Cinderwake/i);
    }
    expect(names.size).toBeGreaterThanOrEqual(36);
  });
});
