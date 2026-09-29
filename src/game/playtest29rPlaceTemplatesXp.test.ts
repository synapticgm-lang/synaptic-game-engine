import { describe, expect, it } from 'vitest';
import type { WorldOutlineSettlement } from '@/data/worldOutlines';
import { createInitialState } from './defaults';
import type { EngineMode, GameState, PlaceRecord } from './types';
import { buildInteriorFloorPlan, interiorBuildingScale } from './mapEngine';
import { interiorTemplates } from './interiorGenerator';
import {
  INSIDE_TEMPLATES,
  PLACE_TEMPLATES,
  SHAPE_TEMPLATES,
  VEHICLE_TEMPLATES,
  insideTemplateFor,
  placeTemplateById,
  settlementShapeTemplate,
} from './placeTemplates';
import { finishSettlementQuestCard, takeSettlementQuestCard } from './settlementQuestCards';
import { applySandboxXpAwards } from './sandboxXp';
import { seedWorldMapPlaces } from './worldMapAuthority';
import { DND_XP_BUDGET_PER_CHARACTER, LITRPG_MILESTONE_XP, milestoneXp, type MilestoneKind } from './xpRules';
import { discoveryXpAmount } from './discoveryXpLedger';
import { HUD_BUILD_STAMP } from '@/components/Hud';
import { BUILD_STAMP } from './runManifest';

const farmVillage: WorldOutlineSettlement = {
  id: 'oakfield', name: 'Oakfield', regionId: 'r1', kind: 'village', biome: 'farm', blurb: '',
};
const atlas = (settlements: WorldOutlineSettlement[]) =>
  ({ settlements, regions: [], outlineName: 'Test', description: '' }) as never;

function st(mode: EngineMode, level: number, threatTier: number, take = true): GameState {
  const s = createInitialState('Ria', mode);
  const seeded: PlaceRecord = { ...seedWorldMapPlaces([], atlas([farmVillage]), { seed: 'seed-29r' })[0], threatTier };
  const place: PlaceRecord = take ? takeSettlementQuestCard([seeded], seeded.questCards![0].id, 1)[0] : seeded;
  return {
    ...s,
    engineMode: mode,
    gmStrictness: 'standard',
    character: { ...s.character, level },
    currentLocation: 'Oakfield',
    places: [place],
    locationSheet: undefined,
    activeDungeon: null,
    activeEncounter: null,
    openingEstablishment: undefined,
    sandboxAwardKeys: [],
    turn: 2,
  } as GameState;
}

const cardOf = (s: GameState) => s.places![0].questCards![0];

describe('29r place templates', () => {
  it('every template has an id, a label, up to four interior names, a reuse list, and empty who/where', () => {
    const ids = [
      'bld-inside-house', 'bld-inside-shop', 'bld-inside-tavern', 'bld-inside-barn',
      'bld-shape-cliff-village', 'bld-shape-cave-dwelling', 'bld-shape-sea-harbour', 'bld-shape-river-harbour',
      'veh-cart-hand', 'veh-wagon-covered', 'veh-wagon-merchant', 'veh-cart-farm',
      'veh-boat-fishing', 'veh-boat-barge', 'veh-boat-cargo', 'veh-boat-rowboat',
    ];
    for (const id of ids) {
      const t = placeTemplateById(id)!;
      expect(t).toBeTruthy();
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.interiorNames.length).toBeGreaterThan(0);
      expect(t.interiorNames.length).toBeLessThanOrEqual(4);
      expect(t.reuse.length).toBeGreaterThan(0);
      expect(t.who).toBe('');
      expect(t.where).toBe('');
    }
    expect(PLACE_TEMPLATES).toHaveLength(ids.length);
    expect(interiorTemplates('vehicle').map((t) => t.id)).toEqual(expect.arrayContaining(VEHICLE_TEMPLATES.map((t) => t.id)));
    expect(interiorTemplates('building').map((t) => t.id)).toEqual(expect.arrayContaining(INSIDE_TEMPLATES.map((t) => t.id)));
  });

  it('a house is not a ruin layout', () => {
    expect(interiorBuildingScale('a small house on the lane')).toBe('inside');
    expect(insideTemplateFor('a small house on the lane')?.id).toBe('bld-inside-house');
    const house = buildInteriorFloorPlan('a small house on the lane', [], undefined, 'seed-29r');
    const names = house.nodes.map((n) => n.name);
    expect(names).toEqual(expect.arrayContaining(placeTemplateById('bld-inside-house')!.interiorNames));
    expect(names).not.toContain('Ruined hall');
    expect(insideTemplateFor('the village tavern')?.id).toBe('bld-inside-tavern');
    expect(insideTemplateFor('an old barn')?.id).toBe('bld-inside-barn');
    expect(insideTemplateFor('the smithy shop')?.id).toBe('bld-inside-shop');
    expect(interiorBuildingScale('the burnt-out husk of a house')).toBe('ruin');
  });

  it('sea and river harbours differ', () => {
    const sea = settlementShapeTemplate({ kind: 'shore', biome: 'coast' })!;
    const river = settlementShapeTemplate({ kind: 'town', biome: 'river' })!;
    expect(sea.id).toBe('bld-shape-sea-harbour');
    expect(river.id).toBe('bld-shape-river-harbour');
    expect(sea.interiorNames).not.toEqual(river.interiorNames);
    expect(settlementShapeTemplate({ kind: 'village', biome: 'cliff' })?.id).toBe('bld-shape-cliff-village');
    expect(settlementShapeTemplate({ kind: 'village', biome: 'cave' })?.id).toBe('bld-shape-cave-dwelling');
    expect(SHAPE_TEMPLATES.every((t) => !t.layout)).toBe(true);
  });
});

describe('29r XP in every mode', () => {
  it('a settlement card pays once in litrpg and rpg (flat quest-complete) and grants one item', () => {
    for (const mode of ['litrpg', 'rpg'] as const) {
      const s = st(mode, 1, 1);
      const fin = finishSettlementQuestCard(s, cardOf(s).id);
      expect(fin.xp).toBe(LITRPG_MILESTONE_XP.questComplete);
      expect(fin.item).not.toBeNull();
      expect(fin.places[0].questCards![0].status).toBe('done');
    }
  });

  it('dnd pays the High band for the area level, not the player level', () => {
    const s = st('dnd', 2, 2); // area level 4, player level 2
    const fin = finishSettlementQuestCard(s, cardOf(s).id);
    expect(fin.xp).toBe(DND_XP_BUDGET_PER_CHARACTER[3]![2]);
    expect(fin.xp).not.toBe(DND_XP_BUDGET_PER_CHARACTER[1]![2]);
  });

  it('a second completion pays nothing', () => {
    for (const mode of ['litrpg', 'rpg', 'dnd'] as const) {
      const s = st(mode, 1, 1);
      const id = cardOf(s).id;
      const fin = finishSettlementQuestCard(s, id);
      const after = { ...s, places: fin.places, sandboxAwardKeys: [fin.awardKey!] };
      const again = finishSettlementQuestCard(after, id);
      expect(again.xp).toBe(0);
      expect(again.card).toBeNull();
      expect(again.item).toBeNull();
      const reopened = { ...after, places: s.places };
      expect(finishSettlementQuestCard(reopened, id).xp).toBe(0);
    }
  });

  it('picking the card chip at its place takes the card and pays nothing (29s)', () => {
    const s = st('litrpg', 1, 1, false);
    const card = cardOf(s);
    const first = applySandboxXpAwards(s, {
      playerAction: card.label,
      locationName: 'Oakfield',
      previousLocationName: 'Oakfield',
      questsBefore: [],
      questsAfter: [],
      events: [],
      turn: 2,
    });
    expect(first.notes.some((n) => n.includes('quest complete'))).toBe(false);
    expect(first.items).toHaveLength(0);
    expect(first.places![0].questCards![0].status).toBe('open');
    expect(first.places![0].questCards![0].takenTurn).toBe(2);
  });

  it('six levels above the area pays 5 percent in all three modes', () => {
    const cut = (n: number) => Math.max(1, Math.round(n * 0.05));
    const lit = finishSettlementQuestCard(st('litrpg', 10, 1), cardOf(st('litrpg', 10, 1)).id);
    expect(lit.xp).toBe(cut(100));
    const rpg = finishSettlementQuestCard(st('rpg', 10, 1), cardOf(st('rpg', 10, 1)).id);
    expect(rpg.xp).toBe(cut(100));
    // D&D: area level clamps to player − 3 for the band, the raw area level (1) drives the cut.
    const dnd = finishSettlementQuestCard(st('dnd', 10, 1), cardOf(st('dnd', 10, 1)).id);
    expect(dnd.xp).toBe(cut(DND_XP_BUDGET_PER_CHARACTER[6]![2]));

    const kinds: MilestoneKind[] = ['questComplete', 'encounter', 'significantPlace', 'significantPerson', 'dungeonCleared', 'roomCleared'];
    for (const mode of ['litrpg', 'rpg', 'dnd'] as const) {
      for (const kind of kinds) {
        const full = milestoneXp(mode, kind, { level: 10, cr: 1 }).amount;
        const over = milestoneXp(mode, kind, { level: 10, cr: 1, playerLevel: 10, areaLevel: 4 }).amount;
        const near = milestoneXp(mode, kind, { level: 10, cr: 1, playerLevel: 10, areaLevel: 5 }).amount;
        expect(over).toBe(cut(full));
        expect(near).toBe(full);
      }
    }
    expect(milestoneXp('dnd', 'encounter', { cr: '1/8', playerLevel: 10, areaLevel: 1 }).amount).toBe(1);
  });

  it('discovery XP uses the same mode rule and cut', () => {
    const near = st('litrpg', 1, 1);
    expect(discoveryXpAmount(near, 'location')).toBe(LITRPG_MILESTONE_XP.significantPlace);
    const over = st('litrpg', 10, 1);
    expect(discoveryXpAmount(over, 'location')).toBe(Math.max(1, Math.round(LITRPG_MILESTONE_XP.significantPlace * 0.05)));
  });

  it('pyoa never pays a settlement card', () => {
    const s = st('pyoa', 1, 1);
    expect(finishSettlementQuestCard(s, cardOf(s).id).xp).toBe(0);
  });

  it('stamp is 2026-09-29y1', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-29y1');
    expect(BUILD_STAMP).toBe('2026-09-29y1');
  });
});
