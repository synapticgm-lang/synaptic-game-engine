/**
 * Brief 01 — typed hook data shape and minting from ids (not English).
 * Sanity only; live prose read is acceptance.
 */
import { describe, expect, it } from 'vitest';
import {
  openingHookHasTypedData,
  type OpeningBeatCard,
  type OpeningHookTypedData,
} from '@/data/campaigns/types';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { SUMMONED_PACT_PHASE4_HOOKS } from '@/data/campaigns/summonedPactPhase4Hooks';
import { heroAwakening } from '@/data/campaigns/heroAwakening';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import { mintOpeningInstance, snapshotFromPickedHook } from './openingInstance';

const DECKS_TYPED_SO_FAR = [
  'system-integration',
  'gatebreak-ward',
  'dungeon-transport',
  'void-audience',
  'ascending-spire',
  'inkbound-academy',
  'hollow-core',
  'cursed-keep',
  'shattered-coast',
  'fabled-legacy',
  'millstone-road',
  'broken-crown-keep',
  'verdant-blight',
  'stillroot-veil',
  'thornferry-road',
  'giltwood-estate-conundrum',
  'vesper-glass-cipher',
  'erebus-9-swarm-directive',
  'rose-gold-ultimatum',
  'null-parameter-protocol',
  'resin-sonata',
  'umbra-protocol',
  'crimson-nocturne',
  'onyx-blood-covenant',
  'salt-road-heist',
] as const;

const TYPED_FIXTURE: OpeningHookTypedData & OpeningBeatCard = {
  place: { id: 'test-cathedral-circle', kind: 'cathedral' },
  cast: [
    {
      id: 'test-cast-chanter',
      role: 'high chanter',
      pronouns: 'he/him',
      durability: 'durable',
      catalogNpcId: 'sp-npc-1',
    },
  ],
  offer: {
    items: [
      { id: 'test-offer-blade', label: 'field blade', carryable: true },
      { id: 'test-offer-papers', label: 'travel papers', carryable: true },
      { id: 'test-offer-bunk', label: 'a bunk in the dorm', carryable: false },
    ],
  },
  rite: {
    steps: [
      { id: 'test-rite-name', label: 'Give a name' },
      { id: 'test-rite-pact', label: 'Swear the Pact' },
    ],
  },
  beatOrder: ['arrive', 'panel', 'mark-wrong', 'offer'],
  who: 'an Earth stranger pulled as Pactborn',
  location: 'catalog place name that must not drive minting',
  faction: 'Catalog Chanter Name',
  whoHere: 'Catalog Chanter Name',
  openingOffer: 'English offer line that minting must not parse for items',
  pressing: 'They need a name.',
};

function assertTypedShape(card: OpeningBeatCard, label: string) {
  expect(openingHookHasTypedData(card), label).toBe(true);
  if (!openingHookHasTypedData(card)) return;
  expect(card.place.id.length).toBeGreaterThan(0);
  expect(card.place.kind.length).toBeGreaterThan(0);
  for (const member of card.cast) {
    expect(member.id.length).toBeGreaterThan(0);
    expect(member.role.length).toBeGreaterThan(0);
    expect(['he/him', 'she/her', 'they/them']).toContain(member.pronouns);
    expect(['durable', 'passer']).toContain(member.durability);
  }
  for (const item of card.offer.items) {
    expect(item.id.length).toBeGreaterThan(0);
    expect(item.label.length).toBeGreaterThan(0);
    expect(typeof item.carryable).toBe('boolean');
  }
  for (const step of card.rite.steps) {
    expect(step.id.length).toBeGreaterThan(0);
    expect(step.label.length).toBeGreaterThan(0);
  }
  expect(card.beatOrder.length).toBeGreaterThan(0);
}

describe('openingHookData (brief 01)', () => {
  it('recognises a full typed hook payload', () => {
    expect(openingHookHasTypedData(TYPED_FIXTURE)).toBe(true);
    expect(openingHookHasTypedData({ place: { id: 'x', kind: 'inn' } })).toBe(false);
  });

  it('mints place, cast and offer items from typed ids — not from English fields', () => {
    const snap = snapshotFromPickedHook(TYPED_FIXTURE);
    expect(openingHookHasTypedData(snap)).toBe(true);
    expect(snap.castNpcIds).toEqual(['sp-npc-1']);

    const a = mintOpeningInstance(snap, 'typed-a|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    const b = mintOpeningInstance(snap, 'typed-b|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });

    expect(a.placeName).toBeTruthy();
    expect(b.placeName).toBeTruthy();
    expect(a.placeName.toLowerCase()).not.toBe('catalog place name that must not drive minting');
    expect(a.cast).toHaveLength(1);
    expect(a.cast[0]!.role).toBe('high chanter');
    expect(a.cast[0]!.gender).toBe('male');
    expect(a.cast[0]!.name.toLowerCase()).not.toContain('catalog');
    expect(a.offerItemNotes).toEqual(['field blade', 'travel papers']);
    expect(a.offerChips.some((c) => c.kind === 'accept')).toBe(true);
    expect(a.offerChips.some((c) => c.kind === 'refuse')).toBe(true);
    // Per-game names differ between seeds.
    expect(a.placeName !== b.placeName || a.cast[0]!.name !== b.cast[0]!.name).toBe(true);
  });

  it('every Summoned Pact openingHooks card carries typed hook data', () => {
    const cards = (summonedPact.openingHooks ?? []).filter(
      (c): c is OpeningBeatCard => typeof c === 'object' && c !== null
    );
    expect(cards.length).toBeGreaterThanOrEqual(20 + SUMMONED_PACT_PHASE4_HOOKS.length);
    for (let i = 0; i < cards.length; i++) {
      assertTypedShape(cards[i]!, `summonedPact.openingHooks[${i}]`);
    }
  });

  it('every Phase-4 Summoned Pact hook carries typed hook data', () => {
    expect(SUMMONED_PACT_PHASE4_HOOKS.length).toBe(24);
    for (let i = 0; i < SUMMONED_PACT_PHASE4_HOOKS.length; i++) {
      assertTypedShape(SUMMONED_PACT_PHASE4_HOOKS[i]!, `SUMMONED_PACT_PHASE4_HOOKS[${i}]`);
    }
  });

  it('every Hero Awakening openingHooks card is an object with typed hook data', () => {
    const cards = heroAwakening.openingHooks ?? [];
    expect(cards.length).toBe(8);
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]!;
      expect(typeof card).toBe('object');
      assertTypedShape(card as OpeningBeatCard, `heroAwakening.openingHooks[${i}]`);
    }
  });

  it('migrated openingHookDecks bibles carry typed hook data', () => {
    for (const id of DECKS_TYPED_SO_FAR) {
      const cards = OPENING_HOOK_DECKS[id] ?? [];
      expect(cards.length, id).toBeGreaterThan(0);
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]!;
        expect(typeof card).toBe('object');
        assertTypedShape(card as OpeningBeatCard, `OPENING_HOOK_DECKS[${id}][${i}]`);
      }
    }
  });
});
