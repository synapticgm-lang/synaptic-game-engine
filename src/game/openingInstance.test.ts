import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  attachOpeningInstance,
  mintOpeningInstance,
  type OpeningHookSnapshot,
} from './openingInstance';

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
});
