/**
 * q31-CR1 — camp robbing as a scenario (acceptance CR1-a…d).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { runPlayerCheck } from './checkMath';
import { resolveCampRob } from './lockAttempt';
import { placeRoadCamp, stampCampStash } from './roadCamps';
import { journeyPads, withJourneyPads } from './travelJourney';
import type { GameState, RoadEncounter, TravelJourney } from './types';
import type { PlayerIntent } from './intentParser';
import type { ActiveDungeonState } from './mapEngine';

const PICK: PlayerIntent = { kind: 'search', label: 'Pick', targets: ['lock'] };

function tools() {
  return [{ id: 'tt-1', name: "Thieves' Tools", rarity: 'Common' as const, quantity: 1, itemType: 'accessory' as const, itemLevel: 1, description: 'picks', provenance: 'test' }];
}

function threePersonCamp(over: Partial<GameState> = {}): { state: GameState; placeId: string; campName: string } {
  const base = createInitialState(undefined, 'litrpg') as GameState;
  let state: GameState = {
    ...base,
    ...over,
    seed: 'cr1-camp',
    turn: 4,
    engineMode: 'litrpg',
    inventory: over.inventory ?? tools(),
    character: {
      ...base.character,
      ...(over.character ?? {}),
      name: 'Rook',
      skills: { ...(base.character.skills ?? {}), stealth: 14, thievery: 14, perception: 12 },
    },
    openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    worldHour: 14,
    worldDay: 0,
  };
  const enc: RoadEncounter = {
    kind: 'camp',
    level: 2,
    stretch: 1,
    dangerous: false,
    name: 'Mara Holt',
  };
  const made = placeRoadCamp(state, 'vale ~ mill', 1, enc);
  state = made.state;
  const place = state.places!.find((p) => p.id === made.encounter.camp!.placeId)!;
  // Force exactly 3 people + stash for CR1-a (card size varies by seed).
  const people = ['Mara Holt', 'Bren Cole', 'Syra Venn'];
  const nodes = stampCampStash(
    (place.dungeonCard!.nodes as ActiveDungeonState['nodes']).map((n, i) => {
      if (i >= 3) return { ...n, hidden: { ...(n.hidden ?? { traps: [], lootables: [], secrets: [], mobs: [] }), mobs: [] } };
      return {
        ...n,
        hidden: {
          traps: n.hidden?.traps ?? [],
          secrets: n.hidden?.secrets ?? [],
          lootables: n.hidden?.lootables ?? [],
          mobs: [{ id: `${n.id}__p`, name: people[i]!, level: 2, role: i === 0 ? 'miniBoss' : 'trash', spawned: false }],
        },
      };
    }),
  );
  const card = { ...place.dungeonCard!, nodes } as ActiveDungeonState;
  state = {
    ...state,
    places: state.places!.map((p) =>
      p.id === place.id ? { ...p, dungeonCard: card, roadCamp: { ...p.roadCamp!, people, leader: people[0]! } } : p
    ),
    journey: {
      from: 'Vale',
      to: 'Mill',
      terrain: 'road',
      ground: 'Road',
      legsTotal: 4,
      legsDone: 1,
      startedTurn: 1,
      encounter: { ...made.encounter, camp: { placeId: place.id, headcount: 3 } },
    } as TravelJourney,
    currentLocation: 'the road between Vale and Mill',
  };
  return { state, placeId: place.id, campName: place.name };
}

describe('CR-1: camp robbing', () => {
  it('CR1-a: three stealth checks, then lock, then alarm, in order; first failure stops', () => {
    const { state, placeId } = threePersonCamp();
    const place = state.places!.find((p) => p.id === placeId)!;

    const noticed = resolveCampRob(state, place, { stealthTotals: [20, 5, 20] });
    expect(noticed?.outcome).toBe('noticed');
    expect(noticed?.steps).toEqual(['stealth:Mara Holt', 'stealth:Bren Cole']);
    expect(noticed?.wake).toBe(true);

    const failLock = resolveCampRob(state, place, {
      stealthTotals: [20, 20, 20],
      pick: runPlayerCheck(state, PICK, 'pick the lock', 1),
    });
    expect(failLock?.outcome === 'lock-fail' || failLock?.outcome === 'alarm').toBe(true);
    expect(failLock?.steps).toEqual(['stealth:Mara Holt', 'stealth:Bren Cole', 'stealth:Syra Venn', 'lock']);

    const failAlarm = resolveCampRob(state, place, {
      stealthTotals: [20, 20, 20],
      pick: runPlayerCheck(state, PICK, 'pick the lock', 20),
      spotD20: 1,
    });
    expect(failAlarm?.outcome).toBe('alarm');
    expect(failAlarm?.steps).toEqual(['stealth:Mara Holt', 'stealth:Bren Cole', 'stealth:Syra Venn', 'lock', 'alarm']);
  });

  it('CR1-b: noticed at step 1 wakes the camp meeting; no loot', () => {
    const { state, placeId } = threePersonCamp();
    const place = state.places!.find((p) => p.id === placeId)!;
    const before = (state.inventory ?? []).length;
    const r = resolveCampRob(state, place, { stealthTotals: [3, 20, 20] });
    expect(r?.outcome).toBe('noticed');
    expect(r?.wake).toBe(true);
    expect((r?.state.inventory ?? []).length).toBe(before);
    expect(r?.receipts.join(' ')).not.toMatch(/Stolen from/i);
  });

  it('CR1-c: all pass opens the stash with Stolen from <camp> provenance', () => {
    const { state, placeId, campName } = threePersonCamp();
    const place = state.places!.find((p) => p.id === placeId)!;
    const r = resolveCampRob(state, place, {
      stealthTotals: [20, 20, 20],
      pick: runPlayerCheck(state, PICK, 'pick the lock', 20),
      spotD20: 20,
      disarmD20: 20,
    });
    expect(r?.outcome).toBe('robbed');
    expect(r?.steps).toEqual(['stealth:Mara Holt', 'stealth:Bren Cole', 'stealth:Syra Venn', 'lock', 'alarm']);
    const stolen = (r?.state.inventory ?? []).filter((it) => (it.provenance ?? '').includes(`Stolen from ${campName}`));
    expect(stolen.length + (r?.receipts.some((x) => /empty/i.test(x)) ? 1 : 0)).toBeGreaterThan(0);
    expect(r?.receipts.join(' ')).toMatch(new RegExp(`Stolen from ${campName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });

  it('CR1-d: no raid chip is offered at a camp', () => {
    const { state } = threePersonCamp();
    const pads = journeyPads(state);
    const offered = withJourneyPads(state, ['Wait', 'Raid the camp', 'Look around']);
    expect(pads.join(' | ')).toMatch(/Sneak into the camp/i);
    expect(pads.join(' | ')).not.toMatch(/\braid\b/i);
    expect(offered.join(' | ')).not.toMatch(/\braid\b/i);
  });
});
