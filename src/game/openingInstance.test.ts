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
    expect(a.retiredNames.join(' ')).toMatch(/Kessa|Cinder/i);
    expect(a.retiredNames.join(' ')).toMatch(/Cinderwake/i);
    expect(a.retiredNames.join(' ')).toMatch(/Pellane/i);
    expect(a.cast.some((c) => /Oren|Kessa|Cinder/i.test(c.name))).toBe(false);
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
    const inst = mintOpeningInstance(cinder, '0|summoned-pact|opening-instance');
    const state = attachOpeningInstance(seededState('0'), cinder, cinder.page1);
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

  it('scrubs catalog places case-insensitively without remapping Walk or bare salt', () => {
    const hook: OpeningHookSnapshot = {
      location: 'Salt Road waystation',
      whoHere: 'no one — you are alone',
      openingOffer: 'Walk with Oren for water and a scarf, or stay and watch the road.',
    };
    const state = attachOpeningInstance(
      { ...seededState('salt-verb-seed'), campaignBibleId: 'salt-road-heist', engineMode: 'rpg' },
      hook,
      hook.page1
    );
    const inst = state.openingEstablishment!.instance!;
    expect(inst.retiredNames.some((n) => /^walk$/i.test(n))).toBe(false);
    expect(inst.retiredNames.some((n) => /^salt$/i.test(n))).toBe(false);
    expect(inst.retiredNames.join(' ')).toMatch(/Salt Road/i);
    expect(inst.offerSummary ?? '').toMatch(/\bWalk with\b/i);
    const scrubbed = applyReplacements(
      'Salt Road waystation sits under a chalk eve. The salt wind pulls at the canvas.',
      inst.nameMap ?? []
    );
    expect(scrubbed).not.toMatch(/Salt Road/i);
    expect(scrubbed).toMatch(/salt wind/i);
    expect(scrubbed).toMatch(new RegExp(inst.placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const chrome = formatOpeningCardChrome(state);
    expect(chrome).toMatch(new RegExp(inst.placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(chrome).not.toMatch(/Salt Road/i);
    if (inst.cast[0]) expect(chrome).toMatch(new RegExp(inst.cast[0].name.split(/\s+/)[0]!, 'i'));

    const okProse = [
      `${inst.placeName} sits under a chalk eve, named and ordinary.`,
      'The salt wind pulls at the canvas and at the dry grass along the berm.',
      'Walk with the first stranger for water, or stay and watch the road.',
      'You keep your own kit if you refuse.',
    ].join(' ');
    expect(validateLiveOpeningProse({ ...state, openingEstablishment: { ...state.openingEstablishment!, instance: inst } }, okProse)).toEqual([]);

    const leak = `${okProse} You can still see Salt Road waystation from here.`;
    expect(validateLiveOpeningProse({ ...state, openingEstablishment: { ...state.openingEstablishment!, instance: inst } }, leak).some((e) => /retired name/i.test(e))).toBe(true);
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
