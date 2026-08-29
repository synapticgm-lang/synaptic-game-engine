import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { isInteriorPlace, INTERIOR_MAP_BLUEPRINT, STREET_MAP_BLUEPRINT } from './placeAuthority';
import {
  buildLocalAreaMap,
  resolvePlayAreaMap,
  shortBuildingTitle,
  shortRoomLabel,
} from './mapEngine';
import {
  mergeHubLandmarks,
  seedOutdoorHubPlaces,
  hubLandmarkNames,
  SUMMONED_PACT_HUBS,
} from './outdoorHubs';
import { applySandboxXpAwards, isLookAroundAction, SANDBOX_XP } from './sandboxXp';
import { reconcileXpStatusLines } from './systemLog';
import { emptyWorldLedger } from './worldSim';

const BURNT_HUSK = 'alone in a burnt husk that still has a shape';

describe('26o map — burnt husk interior + hub pins', () => {
  it('classifies burnt husk essay as interior', () => {
    expect(isInteriorPlace(BURNT_HUSK)).toBe(true);
    const map = resolvePlayAreaMap(null, BURNT_HUSK, [], undefined, 'husk-seed');
    expect(map?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    expect(map?.blueprintId).not.toBe(STREET_MAP_BLUEPRINT);
    expect(map?.dungeonName).toMatch(/ruin|husk|building/i);
    expect(map?.dungeonName.length ?? 99).toBeLessThanOrEqual(44);
    const here = map?.nodes.find((n) => n.id === map.currentNodeId);
    expect(here?.name.length ?? 99).toBeLessThanOrEqual(28);
    expect(here?.name).not.toMatch(/alone in a burnt husk/i);
  });

  it('short labels truncate essay locations', () => {
    expect(shortBuildingTitle(BURNT_HUSK)).toMatch(/damaged ruin/i);
    expect(shortRoomLabel(BURNT_HUSK)).toBe('Entry');
  });

  it('seeds SP hubs into places and street map landmarks', () => {
    const places = seedOutdoorHubPlaces([], summonedPact);
    expect(places.length).toBeGreaterThanOrEqual(SUMMONED_PACT_HUBS.length);
    const state = {
      campaignBibleId: 'summoned-pact' as const,
      places,
    };
    expect(hubLandmarkNames(state).length).toBeGreaterThanOrEqual(6);
    const landmarks = mergeHubLandmarks([], state, 'Valespire Street');
    expect(landmarks.some((n) => /lowmarket/i.test(n))).toBe(true);
    expect(landmarks.some((n) => /cathedral close/i.test(n))).toBe(true);

    const street = buildLocalAreaMap('Valespire Street', landmarks, undefined, {
      visitedLandmarkNames: [],
    });
    expect(street.blueprintId).toBe(STREET_MAP_BLUEPRINT);
    expect(street.nodes.length).toBeGreaterThan(1);
    expect(street.visitedNodeIds).toEqual(['local_0']);
    expect(street.nodes.some((n) => /lowmarket/i.test(n.name))).toBe(true);
  });
});

describe('26o XP — reasons + look-around suppress', () => {
  it('isLookAroundAction catches playtest look verbs', () => {
    expect(isLookAroundAction('Have a look around the area whats near by')).toBe(true);
    expect(isLookAroundAction('Looking around the outside of the building')).toBe(true);
    expect(isLookAroundAction('explore-the-cell')).toBe(true);
    expect(isLookAroundAction('Explore my cell')).toBe(true);
    expect(isLookAroundAction('Inspect the room')).toBe(true);
    expect(isLookAroundAction('Inspect the cell')).toBe(true);
    expect(isLookAroundAction('Get your bearings')).toBe(true);
    expect(isLookAroundAction('Travel toward Lowmarket')).toBe(false);
    expect(isLookAroundAction('Examine the notice slate')).toBe(false);
  });

  it('strips bare GM XP; keeps reasoned code notes', () => {
    expect(
      reconcileXpStatusLines(['XP Gained: 10', 'Loot: ash'], [
        'XP Gained: 10 (quest progress: Get your bearings)',
      ])
    ).toEqual(['Loot: ash', 'XP Gained: 10 (quest progress: Get your bearings)']);
    expect(reconcileXpStatusLines(['XP Gained: 15'], [])).toEqual([]);
  });

  it('look-around does not award quest-tick or invent discover XP', () => {
    const before = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'Bearings',
        status: 'active' as const,
        type: 'main' as const,
        revealed: true,
        objectives: [
          {
            id: 'a',
            description: 'Get your bearings in this ruin',
            completed: false,
          },
        ],
      },
    ];
    const after = [
      {
        ...before[0],
        objectives: [{ ...before[0].objectives[0], completed: true }],
      },
    ];
    const state = {
      ...createInitialState('Act3', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      places: seedOutdoorHubPlaces([], summonedPact),
      sandboxAwardKeys: [] as string[],
      worldLedger: emptyWorldLedger(),
      currentLocation: BURNT_HUSK,
    };
    const look = applySandboxXpAwards(state, {
      playerAction: 'Have a look around the area whats near by',
      locationName: BURNT_HUSK,
      previousLocationName: BURNT_HUSK,
      questsBefore: before,
      questsAfter: after,
      events: [],
      turn: 16,
    });
    expect(look.xp).toBe(0);
    expect(look.notes).toEqual([]);
  });

  it('explore-the-cell / bearings tick awards no quest-tick XP', () => {
    const before = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'Bearings',
        status: 'active' as const,
        type: 'main' as const,
        revealed: true,
        objectives: [
          {
            id: 'a',
            description: 'Get your bearings in this arrival (floor, cell, )',
            completed: false,
          },
        ],
      },
    ];
    const after = [
      {
        ...before[0],
        objectives: [{ ...before[0].objectives[0], completed: true }],
      },
    ];
    const state = {
      ...createInitialState('Jax', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      places: [],
      sandboxAwardKeys: [] as string[],
      worldLedger: emptyWorldLedger(),
      currentLocation: 'iron-bar cell',
    };
    const explore = applySandboxXpAwards(state, {
      playerAction: 'explore-the-cell',
      locationName: 'iron-bar cell',
      previousLocationName: 'iron-bar cell',
      questsBefore: before,
      questsAfter: after,
      events: [],
      turn: 3,
    });
    expect(explore.xp).toBe(0);
    expect(explore.notes).toEqual([]);

    const typedHello = applySandboxXpAwards(state, {
      playerAction: 'hello',
      locationName: 'iron-bar cell',
      previousLocationName: 'iron-bar cell',
      questsBefore: before,
      questsAfter: after,
      events: [],
      turn: 3,
    });
    expect(typedHello.xp).toBe(0);
    expect(typedHello.notes).toEqual([]);
  });

  it('travel to hub awards discover XP once with reason', () => {
    const state = {
      ...createInitialState('Act3', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      places: seedOutdoorHubPlaces([], summonedPact),
      sandboxAwardKeys: [] as string[],
      worldLedger: emptyWorldLedger(),
      currentLocation: BURNT_HUSK,
    };
    const first = applySandboxXpAwards(state, {
      playerAction: 'Travel toward Lowmarket',
      locationName: 'Lowmarket',
      previousLocationName: BURNT_HUSK,
      questsBefore: [],
      questsAfter: [],
      events: [],
      turn: 3,
    });
    expect(first.xp).toBe(SANDBOX_XP.discoverHub);
    expect(first.notes.some((n) => /discovered Lowmarket/i.test(n))).toBe(true);
    const second = applySandboxXpAwards(
      { ...state, places: first.places, sandboxAwardKeys: first.awardKeys },
      {
        playerAction: 'Look around Lowmarket',
        locationName: 'Lowmarket',
        previousLocationName: 'Lowmarket',
        questsBefore: [],
        questsAfter: [],
        events: [],
        turn: 4,
      }
    );
    expect(second.xp).toBe(0);
  });
});
