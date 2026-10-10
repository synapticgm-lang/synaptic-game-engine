import { describe, expect, it } from 'vitest';
import type { WorldOutlineSettlement } from '@/data/worldOutlines';
import type { PlaceRecord } from './types';
import {
  SETTLEMENT_QUEST_LIBRARY,
  openTalkQuestCard,
  seedSettlementQuestCards,
} from './settlementQuestCards';
import { questFitsSettlement, seedWorldMapPlaces } from './worldMapAuthority';
import { HUD_BUILD_STAMP } from '@/components/Hud';
import { BUILD_STAMP } from './runManifest';

const farmVillage: WorldOutlineSettlement = {
  id: 'oakfield', name: 'Oakfield', regionId: 'r1', kind: 'village', biome: 'farm', blurb: '',
};
const desertTown: WorldOutlineSettlement = {
  id: 'dunmere', name: 'Dunmere', regionId: 'r1', kind: 'town', biome: 'desert', blurb: '',
};
const atlas = (settlements: WorldOutlineSettlement[]) =>
  ({ settlements, regions: [], outlineName: 'Test', description: '' }) as never;

function seededPlace(s: WorldOutlineSettlement): PlaceRecord {
  return seedWorldMapPlaces([], atlas([s]), { seed: 'seed-1' })[0];
}

const template = (id: string) => SETTLEMENT_QUEST_LIBRARY.find((t) => t.id === id)!;

describe('29q settlement quest cards', () => {
  it('first seed stamps two fitting cards', () => {
    const place = seededPlace(farmVillage);
    expect(place.questCardsSeeded).toBe(true);
    expect(place.questCards).toHaveLength(2);
    for (const card of place.questCards!) {
      const t = template(card.templateId);
      expect(t.placeType).toBe('farm');
      expect(questFitsSettlement(t.tag, farmVillage)).toBe(true);
      expect(card.label.length).toBeGreaterThan(0);
      expect(card.params.where).toBe('Oakfield');
    }
  });

  it('second seed adds none', () => {
    const first = seededPlace(farmVillage);
    const again = seedWorldMapPlaces([first], atlas([farmVillage]), { seed: 'other-seed' })[0];
    expect(again.questCards).toEqual(first.questCards);
    expect(seedSettlementQuestCards(again, { settlement: farmVillage })).toBe(again);
  });

  it('authored linked quests count toward the two', () => {
    const place = seedWorldMapPlaces([], atlas([farmVillage]), { authoredQuestCount: () => 1 })[0];
    expect(place.questCards).toHaveLength(1);
  });

  it('a desert place does not get a fishing card', () => {
    const place = seededPlace(desertTown);
    expect(place.questCards).toHaveLength(2);
    for (const card of place.questCards!) {
      expect(template(card.templateId).tag).not.toBe('fishing');
      expect(template(card.templateId).placeType).toBe('desert');
    }
  });

  it('"how are you today" adds nothing', () => {
    const place = seededPlace(farmVillage);
    const out = openTalkQuestCard({ places: [place], currentLocation: 'Oakfield' }, ['How are you today, traveller?'], 3);
    expect(out.card).toBeNull();
    expect(out.places[0].questCards).toHaveLength(2);
  });

  it('a missing dog the player is asked to find adds one library card', () => {
    const place = seededPlace(farmVillage);
    const out = openTalkQuestCard(
      { places: [place], currentLocation: 'Oakfield' },
      ['My dog ran off last night and never came home. Please, can you find him?'],
      3
    );
    expect(out.card).not.toBeNull();
    expect(SETTLEMENT_QUEST_LIBRARY.some((t) => t.id === out.card!.templateId)).toBe(true);
    expect(out.card!.source).toBe('talk');
    expect(out.card!.params.what).toBe('dog');
    expect(out.places[0].questCards).toHaveLength(3);
  });

  it('a fourth open side card is refused', () => {
    const talk = (id: string) => ({
      id, templateId: id, label: id, params: {}, source: 'talk' as const, status: 'open' as const, offeredTurn: 1,
    });
    const elsewhere: PlaceRecord[] = ['a', 'b', 'c'].map((k) => ({
      id: `place_${k}`, name: `Town ${k}`, questCardsSeeded: true, questCards: [talk(`city-delivery-${k}`)],
    }));
    const place = seededPlace(farmVillage);
    const line = ['My dog ran off last night and never came home. Please, can you find him?'];
    expect(openTalkQuestCard({ places: [...elsewhere.slice(0, 2), place], currentLocation: 'Oakfield' }, line, 4).card).not.toBeNull();
    const out = openTalkQuestCard({ places: [...elsewhere, place], currentLocation: 'Oakfield' }, line, 4);
    expect(out.card).toBeNull();
  });

  it('stamp is 2026-10-10a', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-10a');
    expect(BUILD_STAMP).toBe('2026-10-10a');
  });
});
