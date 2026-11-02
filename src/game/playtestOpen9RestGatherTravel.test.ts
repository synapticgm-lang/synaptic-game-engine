/**
 * XP-D1 OPEN9 FIX 2–4 — Rest when HP≤50% everywhere (no fight); Gather over Walk;
 * never Travel to HERE; meal amends inventory.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { rankChoices, chipProgressScore, GATHER_WILDS_CHIP } from './choiceRanking';
import { applyRestHeal, canOutdoorShortRest } from './recoveryRules';
import { OUTDOOR_REST_CHIP, isHurtHp } from './rules/wildlifeConfig';
import { collectSceneAffordances } from './sceneAffordances';
import { isTravelDestHere } from './placeRegistry';
import { commitTravel } from './travelJourney';
import { ensureWilds, ensureGatherPouch, hasNodeStock, wildsPlaceId } from './wilds';
import { ensureRegionResources } from './regionLevels';
import { preferHurtRecoveryPick } from './fateAutoplay';
import type { GameState, Item } from './types';

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'inkbound-academy',
    turn: 20,
    currentLocation: 'Living Ink Atelier',
    character: {
      ...s.character!,
      name: 'Jax',
      level: 2,
      xp: 62,
      xpToNext: 187,
      hp: 9,
      maxHp: 31,
    },
    sceneFacts: { ...emptySceneFacts(20), outdoor: true },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

function rpg(over: Partial<GameState> = {}): GameState {
  return lit({
    engineMode: 'rpg',
    campaignBibleId: 'cape-district-vigil',
    currentLocation: 'a Cape District chapel watch',
    sceneFacts: { ...emptySceneFacts(20), indoor: true },
    ...over,
  } as Partial<GameState>) as GameState;
}

describe('XP-D1 OPEN9 Rest when hurt', () => {
  it('offers Rest at HP ≤ 50% in a wilds / hub scene and not in a fight', () => {
    expect(isHurtHp(9, 31)).toBe(true);
    const hub = lit();
    expect(canOutdoorShortRest(hub, OUTDOOR_REST_CHIP)).toBe(true);
    const ranked = rankChoices(hub, ['Walk on', 'Travel toward Quill Dormitory', 'Open the bronze reward box']);
    expect(ranked.choices.some((c) => /^rest and bind your wounds\b/i.test(c))).toBe(true);

    const fighting = lit({
      activeEncounter: { name: 'Gull Swarm', hp: 8, maxHp: 8, level: 2 },
    });
    expect(canOutdoorShortRest(fighting, OUTDOOR_REST_CHIP)).toBe(false);
    const fightPad = rankChoices(fighting, ['Press the attack', 'Try to flee']);
    expect(fightPad.choices.some((c) => /^rest and bind your wounds\b/i.test(c))).toBe(false);
  });

  it('Rest amends inventory when a meal is owned; longer rest without food', () => {
    const meal: Item = {
      id: 'meal-1',
      name: 'Travel ration',
      rarity: 'common',
      quantity: 1,
      itemType: 'consumable',
    };
    const withFood = lit({ inventory: [meal] });
    const rested = applyRestHeal(withFood, OUTDOOR_REST_CHIP);
    expect(rested.receipt).toMatch(/Rest:/i);
    expect(rested.receipt).toMatch(/Travel ration|ate/i);
    expect((rested.state.inventory ?? []).some((i) => i.id === 'meal-1')).toBe(false);
    expect(rested.state.character.hp).toBeGreaterThan(9);

    const noFood = applyRestHeal(lit({ inventory: [] }), OUTDOOR_REST_CHIP);
    expect(noFood.receipt).toMatch(/no food|longer/i);
    expect(noFood.state.character.hp).toBeGreaterThan(9);
  });

  it('Story RPG chapel (indoor) also gets Rest when hurt and not fighting', () => {
    const s = rpg();
    expect(canOutdoorShortRest(s, OUTDOOR_REST_CHIP)).toBe(true);
    const ranked = rankChoices(s, [
      'Search a Cape District chapel watch for signs',
      'Talk to the people here',
    ]);
    expect(ranked.choices.some((c) => /^rest and bind your wounds\b/i.test(c))).toBe(true);
  });

  it('autoplay prefers Rest over Hunt / Travel / Search when HP ≤ 50%', () => {
    const s = lit();
    const pick = preferHurtRecoveryPick(
      [
        'Hunt the wildlife nearby',
        'Travel toward Quill Dormitory',
        'Search the scene for signs',
        OUTDOOR_REST_CHIP,
        'Walk on',
      ],
      'Hunt the wildlife nearby',
      s
    );
    expect(pick).toMatch(/^rest and bind your wounds\b/i);
  });
});

describe('XP-D1 OPEN9 Gather over Walk', () => {
  it('Gather with node stock ranks ahead of Walk / aimless Travel', () => {
    let s = lit({
      character: { ...lit().character!, hp: 31, maxHp: 31 },
      currentLocation: 'Quill Dormitory',
    });
    s = ensureGatherPouch(ensureRegionResources(ensureWilds(s)));
    const placeId = wildsPlaceId(s);
    s = {
      ...s,
      nodeStockByPlace: {
        ...(s.nodeStockByPlace ?? {}),
        [placeId]: {
          placeId,
          lastRefillHour: 0,
          nodes: [{ id: 'herb-1', kind: 'herb', tier: 1, stock: 3, maxStock: 4 }],
        },
      },
    };
    expect(hasNodeStock(s)).toBe(true);
    expect(chipProgressScore(s, GATHER_WILDS_CHIP)).toBeLessThan(chipProgressScore(s, 'Walk on'));
    expect(chipProgressScore(s, GATHER_WILDS_CHIP)).toBeLessThan(
      chipProgressScore(s, 'Travel toward Lecture Courtyard')
    );
    const ranked = rankChoices(s, [
      'Walk on',
      'Travel toward Lecture Courtyard',
      'Open the bronze reward box',
      GATHER_WILDS_CHIP,
    ]);
    const gi = ranked.choices.findIndex((c) => /^gather\b/i.test(c));
    const wi = ranked.choices.findIndex((c) => /^walk on\b/i.test(c));
    expect(gi).toBeGreaterThanOrEqual(0);
    if (wi >= 0) expect(gi).toBeLessThan(wi);
  });
});

describe('XP-D1 OPEN9 Travel never targets HERE', () => {
  it('isTravelDestHere matches articles / aliases (real T35 shape)', () => {
    const s = rpg({
      currentLocation: 'a Cape District chapel watch',
      places: [
        {
          id: 'place_a-cape-district-chapel-watch',
          name: 'a Cape District chapel watch',
          aliases: ['Cape District chapel watch', 'chapel watch'],
          exits: ['Saltmar', 'a Cape District chapel watch'],
        },
      ],
    });
    expect(isTravelDestHere(s, 'a Cape District chapel watch')).toBe(true);
    expect(isTravelDestHere(s, 'Cape District chapel watch')).toBe(true);
    expect(isTravelDestHere(s, 'Saltmar')).toBe(false);
  });

  it('affordances drop Travel toward current chapel; stale pick answers already-here', () => {
    const s = rpg({
      currentLocation: 'a Cape District chapel watch',
      places: [
        {
          id: 'place_a-cape-district-chapel-watch',
          name: 'a Cape District chapel watch',
          aliases: ['Cape District chapel watch'],
          exits: ['Saltmar', 'a Cape District chapel watch', 'Beacon Yard'],
        },
      ],
    });
    const labels = collectSceneAffordances(s).map((a) => a.label);
    expect(labels.some((l) => /^Travel toward a Cape District chapel watch$/i.test(l))).toBe(false);
    expect(labels.some((l) => /^Travel toward Cape District chapel watch$/i.test(l))).toBe(false);

    const stale = commitTravel(s, 'Travel toward a Cape District chapel watch');
    expect(stale.handled).toBe(true);
    expect(stale.arrived).toBe(false);
    expect(stale.facts?.some((f) => /already at/i.test(f))).toBe(true);
    expect(stale.state.currentLocation).toMatch(/chapel watch/i);
  });
});
