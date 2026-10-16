/**
 * q31-O1C — cleared sites + L2 reward-box loot-once.
 * Acceptance O1C-a/c (map + no respawn); O1C-b left item; O1C-f streets skip; L2 box once.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Item, TravelJourney } from './types';
import type { ActiveDungeonState } from './mapEngine';
import {
  condenseClearedSite,
  maybeAutoCloseDungeon,
  openDungeonAtSite,
  placeAllowsDungeon,
  recordClearedSite,
} from './dungeonLifecycle';
import { openDungeonCard, parkDungeonCard, buildDungeonCard } from './dungeonCard';
import { placeIdFromName } from './places';
import {
  openBoxChip,
  rewardBoxItem,
  rewardBoxesHeld,
  settleDeeds,
  settleRewardBox,
} from './rules/achievements';
import { dayIsSpent } from './travelJourney';

function litrpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    seed: 'o1c-seed',
    turn: 8,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    ...over,
  } as GameState;
}

function withClearedCave(): { state: GameState; site: string; nodeIds: string[] } {
  const site = 'Ash Cave';
  let state = litrpg({
    currentLocation: site,
    places: [
      {
        id: placeIdFromName(site),
        name: site,
        allowsDungeon: true,
        arcStatus: 'open',
        mapScale: 'street',
      },
    ],
  });
  expect(placeAllowsDungeon(state, site)).toBe(true);
  state = openDungeonAtSite(state, { siteName: site, seed: 'o1c-seed' });
  const d = state.activeDungeon!;
  expect(d.nodes.length).toBeGreaterThan(1);
  // Defeat every mob; put an opened lootable + a left Lantern so deltas are non-empty.
  const room2 = d.nodes[1]?.id ?? d.nodes[0]!.id;
  const nodes = d.nodes.map((n) => {
    const base = n.hidden ?? { traps: [], lootables: [], secrets: [], mobs: [] };
    const lootables =
      n.id === d.nodes[0]!.id
        ? [
            {
              id: `${n.id}_chest`,
              label: 'Bronze chest',
              opened: true,
              loot: { rarity: 'Common' as const, qty: 1 },
            },
          ]
        : base.lootables ?? [];
    const looseItems =
      n.id === room2
        ? [
            {
              id: 'left-lantern',
              label: 'Lantern',
              item: {
                id: 'item-lantern',
                name: 'Lantern',
                rarity: 'Common' as const,
                quantity: 1,
              } satisfies Item,
            },
          ]
        : base.looseItems ?? [];
    return {
      ...n,
      hidden: {
        ...base,
        mobs: (base.mobs ?? []).map((m) => ({ ...m, defeated: true, hpRemaining: null as null })),
        lootables,
        looseItems,
      },
    };
  });
  const clearedNodeIds = nodes.map((n) => n.id);
  state = {
    ...state,
    activeDungeon: {
      ...d,
      nodes,
      clearedNodeIds,
      visitedNodeIds: clearedNodeIds,
      cleared: true,
    } as ActiveDungeonState,
  };
  return { state, site, nodeIds: clearedNodeIds };
}

describe('O1-C cleared sites', () => {
  it('O1C-a: clear, leave, re-enter — identical nodes/edges; no foes', () => {
    const { state: inside, site, nodeIds } = withClearedCave();
    const before = inside.activeDungeon!;
    const left = condenseClearedSite(inside, { summary: 'All threats cleared' });
    expect(left.activeDungeon ?? null).toBeNull();
    const key = placeIdFromName(site);
    expect(left.clearedSites?.[key]).toBeTruthy();
    expect(left.clearedSites![key]!.items.taken.length).toBeGreaterThan(0);
    expect(left.places!.find((p) => p.id === key)?.arcStatus).toBe('cleared');

    const back = openDungeonAtSite(left, { siteName: site, seed: 'o1c-seed' });
    const again = back.activeDungeon!;
    expect(again.nodes.map((n) => n.id).sort()).toEqual(before.nodes.map((n) => n.id).sort());
    expect(again.nodes.map((n) => n.connections.slice().sort().join(','))).toEqual(
      before.nodes.map((n) => n.connections.slice().sort().join(','))
    );
    expect(again.nodes.every((n) => (n.hidden?.mobs ?? []).length === 0)).toBe(true);
    expect(again.cleared).toBe(true);
    expect(again.visitedNodeIds).toEqual(expect.arrayContaining(nodeIds));
  });

  it('O1C-b: left item stays; taken lootable stays empty; record holds deltas only', () => {
    const { state: inside, site } = withClearedCave();
    const room2 = inside.activeDungeon!.nodes[1]!.id;
    const left = condenseClearedSite(inside);
    const rec = left.clearedSites![placeIdFromName(site)]!;
    expect(rec.items.left.some((x) => x.item.name === 'Lantern' && x.nodeId === room2)).toBe(true);
    expect(rec.items.taken.length).toBeGreaterThan(0);
    // Compact: only deltas — no full inventory dump.
    expect(Object.keys(rec.items).sort()).toEqual(['left', 'moved', 'taken']);

    const back = openDungeonAtSite(left, { siteName: site });
    const node = back.activeDungeon!.nodes.find((n) => n.id === room2)!;
    expect(node.hidden?.looseItems?.some((l) => l.label === 'Lantern')).toBe(true);
    const opened = back.activeDungeon!.nodes.flatMap((n) => n.hidden?.lootables ?? []).filter((l) => l.opened);
    expect(opened.length).toBeGreaterThan(0);
  });

  it('O1C-c: house card clear/leave/re-enter matches cave (same mechanism)', () => {
    const site = 'Watchhouse';
    let state = litrpg({
      currentLocation: site,
      places: [{ id: placeIdFromName(site), name: site, allowsDungeon: true, arcStatus: 'open', mapScale: 'street' }],
    });
    state = openDungeonCard(state, site);
    const d = state.activeDungeon!;
    const nodeIds = d.nodes.map((n) => n.id);
    state = {
      ...state,
      activeDungeon: {
        ...d,
        cleared: true,
        clearedNodeIds: nodeIds,
        visitedNodeIds: nodeIds,
        nodes: d.nodes.map((n) =>
          n.hidden
            ? { ...n, hidden: { ...n.hidden, mobs: (n.hidden.mobs ?? []).map((m) => ({ ...m, defeated: true })) } }
            : n
        ),
      },
    };
    const left = parkDungeonCard(state, { toSite: true });
    expect(left.clearedSites?.[placeIdFromName(site)]).toBeTruthy();
    const back = openDungeonCard(left, site);
    expect(back.activeDungeon!.nodes.map((n) => n.id)).toEqual(nodeIds);
    expect(back.activeDungeon!.nodes.every((n) => (n.hidden?.mobs ?? []).length === 0)).toBe(true);
  });

  it('O1C-f: street walking is not a travel day (dayIsSpent stays false)', () => {
    const state = litrpg({
      worldHour: 10,
      worldDay: 0,
      roadDay: { since: 0, hours: 7.5 },
    });
    const streets: TravelJourney = {
      from: 'Market',
      to: 'Gate',
      terrain: 'streets',
      ground: 'Back streets',
      legsTotal: 2,
      legsDone: 0,
      hoursPerLeg: 0.5,
      startedTurn: 1,
    };
    // Street legs never count toward the 8-hour travel day (marchHours / travelDay skip).
    expect(dayIsSpent(state, streets)).toBe(false);
  });

  it('legacy maybeAutoCloseDungeon condenses instead of discarding', () => {
    const { state } = withClearedCave();
    // Force non-card blueprint so auto-close path runs condense.
    const nonCard = {
      ...state,
      activeDungeon: { ...state.activeDungeon!, blueprintId: 'interior-plan', cleared: true },
    };
    const after = maybeAutoCloseDungeon(nonCard);
    expect(after.activeDungeon ?? null).toBeNull();
    expect(after.clearedSites && Object.keys(after.clearedSites).length).toBeGreaterThan(0);
    expect(after.places!.some((p) => p.dungeonCard)).toBe(true);
  });
});

describe('L2 reward box loot once', () => {
  const def = { key: 'achv:first-kill', name: 'First Kill', tier: 'Bronze' as const, earned: () => true };

  it('opens once; second open and re-grant are blocked; chip drops', () => {
    let state = litrpg({
      inventory: [rewardBoxItem(def)],
      sandboxAwardKeys: ['achv:first-kill', 'box:achv:first-kill'],
    });
    const chip = openBoxChip('Bronze');
    const first = settleRewardBox(state, chip);
    expect(first.settled).toBe(true);
    state = first.state;
    expect(rewardBoxesHeld(state)).toHaveLength(0);
    expect(state.sandboxAwardKeys).toEqual(
      expect.arrayContaining([`opened:reward-box:${def.key}`, 'box:achv:first-kill'])
    );

    const second = settleRewardBox(state, chip);
    expect(second.settled).toBe(false);

    // Re-grant blocked even if box: key were missing (opened: remains).
    const again = settleDeeds(
      { ...state, sandboxAwardKeys: state.sandboxAwardKeys!.filter((k) => k !== 'box:achv:first-kill') },
      { awardKeys: ['achv:first-kill', ...state.sandboxAwardKeys!.filter((k) => k.startsWith('opened:'))] }
    );
    expect(again.items.filter((i) => /Reward Box/i.test(i.name))).toHaveLength(0);
  });

  it('dungeon-card chest: opened flag survives clear/leave/re-enter (loot once)', () => {
    const site = 'Collapsed Mine';
    let state = litrpg({
      currentLocation: site,
      places: [{ id: placeIdFromName(site), name: site, allowsDungeon: true, arcStatus: 'open', mapScale: 'street' }],
    });
    const card = buildDungeonCard(state, site);
    const chestNode = card.nodes.find((n) => (n.hidden?.lootables ?? []).some((l) => !l.opened));
    expect(chestNode).toBeTruthy();
    const chestId = chestNode!.hidden!.lootables.find((l) => !l.opened)!.id;
    const openedCard: ActiveDungeonState = {
      ...card,
      cleared: true,
      clearedNodeIds: card.nodes.map((n) => n.id),
      visitedNodeIds: card.nodes.map((n) => n.id),
      nodes: card.nodes.map((n) =>
        n.hidden
          ? {
              ...n,
              hidden: {
                ...n.hidden,
                mobs: [],
                lootables: n.hidden.lootables.map((l) => (l.id === chestId ? { ...l, opened: true } : l)),
              },
            }
          : n
      ),
    };
    state = { ...state, activeDungeon: openedCard };
    const left = parkDungeonCard(state, { toSite: true });
    const rec = recordClearedSite(openedCard);
    expect(rec.items.taken).toContain(chestId);
    const back = openDungeonCard(left, site);
    const again = back.activeDungeon!.nodes
      .flatMap((n) => n.hidden?.lootables ?? [])
      .find((l) => l.id === chestId);
    expect(again?.opened).toBe(true);
  });
});
