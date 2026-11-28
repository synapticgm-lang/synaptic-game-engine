/**
 * Brief 03 — per-game names from typed cast/place data; no English renamer.
 */
import { describe, expect, it } from 'vitest';
import type { OpeningBeatCard, OpeningHookTypedData } from '@/data/campaigns/types';
import { openingHookHasTypedData } from '@/data/campaigns/types';
import { createInitialState } from './defaults';
import {
  attachOpeningInstance,
  mintOpeningInstance,
  snapshotFromPickedHook,
  type OpeningHookSnapshot,
} from './openingInstance';

const TYPED_CINDER: OpeningHookTypedData & OpeningBeatCard = {
  place: { id: 'test-ash-trail', kind: 'trail' },
  cast: [
    { id: 'test-cast-oren', role: 'priest', pronouns: 'he/him', durability: 'durable' },
    { id: 'test-cast-kessa', role: 'tracker', pronouns: 'she/her', durability: 'durable' },
  ],
  offer: {
    items: [
      { id: 'test-water', label: 'waterskin', carryable: true },
      { id: 'test-scarf', label: 'scarf', carryable: true },
    ],
  },
  rite: { steps: [{ id: 'test-rite-name', label: 'Give a name' }] },
  beatOrder: ['wake', 'offer'],
  location: 'catalog Cinderwake Trail must not drive minting',
  whoHere: 'Brother Oren and Kessa Cinder',
  openingOffer: 'English offer that minting must not parse',
  pressing: 'They want an answer.',
  page1: 'Authored page 1 with Brother Oren on Cinderwake Trail.',
};

function seededState(seed: string) {
  return { ...createInitialState('The Summoned Pact', 'litrpg'), seed, campaignBibleId: 'summoned-pact' };
}

describe('openingInstance (brief 03 typed mint)', () => {
  it('mints different locked names and places for different seeds from typed data', () => {
    const snap = snapshotFromPickedHook(TYPED_CINDER);
    expect(openingHookHasTypedData(snap)).toBe(true);
    const a = mintOpeningInstance(snap, 'seed-alpha|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    const b = mintOpeningInstance(snap, 'seed-beta|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    expect(a.placeName).toMatch(/\S/);
    expect(b.placeName).toMatch(/\S/);
    expect(a.placeName).not.toMatch(/Cinderwake/i);
    expect(b.placeName).not.toMatch(/Cinderwake/i);
    expect(`${a.placeName}|${a.cast.map((c) => c.name).join(',')}`).not.toBe(
      `${b.placeName}|${b.cast.map((c) => c.name).join(',')}`
    );
    expect(a.cast).toHaveLength(2);
    expect(a.cast[0]!.gender).toBe('male');
    expect(a.cast[1]!.gender).toBe('female');
    expect(a.cast[0]!.pronouns).toBe('he/him');
    expect(a.cast[1]!.pronouns).toBe('she/her');
    expect(a.cast[0]!.durability).toBe('durable');
    expect(a.cast.some((c) => /Oren|Kessa|Cinder/i.test(c.name))).toBe(false);
    expect(a.retiredNames).toEqual([]);
    expect(a.beatOrder).toEqual(['wake', 'offer']);
    expect(a.offerItemNotes).toEqual(expect.arrayContaining(['waterskin', 'scarf']));
  });

  it('names offer chips from typed carryable items', () => {
    const snap = snapshotFromPickedHook(TYPED_CINDER);
    const inst = mintOpeningInstance(snap, 'chip-seed|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
    });
    const labels = inst.offerChips.map((c) => c.label);
    expect(labels.some((l) => /Keep your own kit/i.test(l))).toBe(true);
    expect(labels.some((l) => /water|scarf/i.test(l))).toBe(true);
    const names = inst.cast.map((c) => c.name.split(/\s+/)[0]!);
    expect(labels.some((l) => names.some((n) => l.includes(n)))).toBe(true);
  });

  it('locks minted place and cast onto the save', () => {
    const snap = snapshotFromPickedHook(TYPED_CINDER);
    const inst = mintOpeningInstance(snap, '0|summoned-pact|opening-instance', { bibleId: 'summoned-pact' });
    const state = attachOpeningInstance(seededState('0'), snap, TYPED_CINDER.page1);
    expect(state.currentLocation).toBe(inst.placeName);
    expect(state.openingEstablishment?.instance?.placeName).toBe(inst.placeName);
    expect(state.openingEstablishment?.pinnedNpcNames).toEqual(inst.cast.map((c) => c.name));
    expect(state.npcMemories?.some((m) => m.durability === 'durable')).toBe(true);
  });

  it('does not scrape Title-Case English for names — untyped hooks mint alone', () => {
    const untyped: OpeningHookSnapshot = {
      location: 'the ash-heat of Cinderwake Trail',
      whoHere: 'Brother Oren and tracker Kessa Cinder',
    };
    const alone = mintOpeningInstance(untyped, 'untyped|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
    });
    expect(alone.cast).toHaveLength(0);
    expect(alone.alone).toBe(true);
    expect(alone.placeName).toMatch(/\S/);
  });

  it('mints a wide variety of place names so two seeds rarely collide', () => {
    const snap = snapshotFromPickedHook(TYPED_CINDER);
    const names = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const inst = mintOpeningInstance(snap, `variety-${i}|summoned-pact|opening-instance`, {
        bibleId: 'summoned-pact',
      });
      names.add(inst.placeName);
      expect(inst.placeName).not.toMatch(/Cinderwake/i);
    }
    expect(names.size).toBeGreaterThanOrEqual(36);
  });

  it('two game seeds mint different NPC names for the same bible cast slot; same seed is stable', () => {
    const snap = snapshotFromPickedHook(TYPED_CINDER);
    const keyA = 'game-seed-alpha|summoned-pact|opening-instance';
    const keyB = 'game-seed-beta|summoned-pact|opening-instance';
    const a1 = mintOpeningInstance(snap, keyA, { bibleId: 'summoned-pact' });
    const a2 = mintOpeningInstance(snap, keyA, { bibleId: 'summoned-pact' });
    const b = mintOpeningInstance(snap, keyB, { bibleId: 'summoned-pact' });
    expect(a1.cast.map((c) => c.name)).toEqual(a2.cast.map((c) => c.name));
    expect(a1.cast[0]!.name).not.toBe(b.cast[0]!.name);
  });

  it('salt-road-heist opening NPC gets a proper minted name (not role-only)', () => {
    const enforcerHook: OpeningHookTypedData & OpeningBeatCard = {
      place: { id: 'salt-road-heist-a-salt-road-waystation', kind: 'road' },
      cast: [
        { id: 'salt-road-heist-cast-enforcer', role: 'enforcer', pronouns: 'he/him', durability: 'passer' },
      ],
      offer: { items: [] },
      rite: { steps: [{ id: 'salt-road-heist-rite-name', label: 'Give a name' }] },
      beatOrder: ['arrive', 'panel'],
      location: 'a Salt Road waystation',
      faction: 'an enforcer',
    };
    const inst = mintOpeningInstance(snapshotFromPickedHook(enforcerHook), 'salt-a|salt-road-heist|opening-instance', {
      bibleId: 'salt-road-heist',
      engineMode: 'rpg',
    });
    expect(inst.cast).toHaveLength(1);
    expect(inst.cast[0]!.role).toBe('enforcer');
    expect(inst.cast[0]!.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(inst.cast[0]!.name.toLowerCase()).not.toMatch(/\benforcer\b|\bscout\b|\bthief\b/);
  });

  it('keeps bible canon names when catalogNpcId resolves (Father Aldous / Vessa)', () => {
    const snap = snapshotFromPickedHook({
      place: { id: 'cursed-keep-greyhollow-churchyard', kind: 'place' },
      cast: [
        { id: 'cursed-keep-cast-1', role: 'town priest', pronouns: 'he/him', durability: 'durable', catalogNpcId: 'ck-npc-1' },
      ],
      offer: { items: [] },
      rite: { steps: [{ id: 'cursed-keep-rite-name', label: 'Give a name' }] },
      beatOrder: ['arrive', 'panel'],
      location: 'Greyhollow churchyard',
      castNpcIds: ['ck-npc-1'],
    } as OpeningHookTypedData & OpeningBeatCard);
    const inst = mintOpeningInstance(snap, 'canon|cursed-keep|opening-instance', {
      bibleId: 'cursed-keep',
      engineMode: 'dnd',
      catalogById: { 'ck-npc-1': 'Father Aldous' },
    });
    expect(inst.cast[0]!.name).toBe('Father Aldous');
  });
});
