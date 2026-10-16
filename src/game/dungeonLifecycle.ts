/**
 * 29e — Dungeon generate / close lifecycle.
 * O1-C — a cleared site condenses to clearedSites (map as walked + item deltas); never discard.
 */

import type { ClearedSiteRecord, GameState, PlaceRecord } from './types';
import type { ActiveDungeonState, MapNode, NodeHidden } from './mapEngine';
import { buildInteriorFloorPlan, dungeonHereLabel } from './mapEngine';
import { seedDungeonState } from './dungeonSeed';
import { findSettlement } from './worldMapAuthority';
import { placeIdFromName } from './places';
import { isUndergroundPlace } from './placeAuthority';

export function placeAllowsDungeon(state: GameState, placeName?: string | null): boolean {
  if (!placeName?.trim()) return !!state.activeDungeon;
  const settlement = findSettlement(state.worldAtlas, placeName);
  if (settlement?.allowsDungeon) return true;
  const place = (state.places ?? []).find(
    (p) =>
      p.name.toLowerCase() === placeName.toLowerCase() ||
      p.aliases?.some((a) => a.toLowerCase() === placeName.toLowerCase())
  );
  if (place?.allowsDungeon || place?.dungeonRef) return true;
  if (isUndergroundPlace(placeName)) return true;
  return /\b(dungeon|ruin|crypt|undercroft|mine|delve|keep|store|warehouse|factory)\b/i.test(placeName);
}

function markPlaceDungeonRef(places: PlaceRecord[], siteName: string, dungeonRef: string): PlaceRecord[] {
  const id = placeIdFromName(siteName);
  const existing = places.find((p) => p.id === id || p.name.toLowerCase() === siteName.toLowerCase());
  if (!existing) {
    return [...places, { id, name: siteName, dungeonRef, allowsDungeon: true, arcStatus: 'open', mapScale: 'street' }];
  }
  const out: PlaceRecord[] = [];
  for (const p of places) out.push(p.id === existing.id ? { ...p, dungeonRef, allowsDungeon: true } : p);
  return out;
}

/** Strip living foes — a cleared site never respawns. */
export function stripDungeonFoes(d: ActiveDungeonState): ActiveDungeonState {
  const nodes: MapNode[] = [];
  for (const n of d.nodes) {
    if (!n.hidden) {
      nodes.push(n);
      continue;
    }
    nodes.push({ ...n, hidden: { ...n.hidden, mobs: [] } });
  }
  return { ...d, cleared: true, nodes };
}

/** Compact record from the walked dungeon (topology + opened/loose deltas; no foes). */
export function recordClearedSite(d: ActiveDungeonState): ClearedSiteRecord {
  const taken: string[] = [];
  const left: ClearedSiteRecord['items']['left'] = [];
  const nodes: ClearedSiteRecord['map']['nodes'] = [];
  for (const n of d.nodes) {
    const openedLootableIds: string[] = [];
    for (const l of n.hidden?.lootables ?? []) {
      if (l.opened) {
        openedLootableIds.push(l.id);
        taken.push(l.id);
      }
    }
    const looseLeft: ClearedSiteRecord['map']['nodes'][0]['looseLeft'] = [];
    for (const l of n.hidden?.looseItems ?? []) {
      looseLeft.push({ id: l.id, label: l.label, inventoryItemId: l.inventoryItemId, item: l.item });
      if (l.item) left.push({ id: l.id, nodeId: n.id, item: l.item });
    }
    nodes.push({
      id: n.id,
      name: n.name,
      description: n.description,
      connections: [...n.connections],
      tags: n.tags ? [...n.tags] : undefined,
      isSecret: n.isSecret,
      coordinates: n.coordinates,
      zLevel: n.zLevel,
      footprint: n.footprint,
      edgeKinds: n.edgeKinds ? { ...n.edgeKinds } : undefined,
      openedLootableIds,
      looseLeft,
    });
  }
  return {
    map: {
      blueprintId: d.blueprintId,
      dungeonName: d.dungeonName,
      siteName: d.siteName,
      tier: d.tier,
      dangerTier: d.dangerTier,
      areaLevel: d.areaLevel,
      currentZLevel: d.currentZLevel,
      visitedNodeIds: [...(d.visitedNodeIds ?? [])],
      clearedNodeIds: [...(d.clearedNodeIds ?? [])],
      nodes,
    },
    items: { left, moved: [], taken },
  };
}

/** Rebuild ActiveDungeonState from a cleared record (identical map, no foes). */
export function dungeonFromClearedRecord(record: ClearedSiteRecord): ActiveDungeonState {
  const nodes: MapNode[] = [];
  for (const n of record.map.nodes) {
    const lootables: NodeHidden['lootables'] = [];
    for (const id of n.openedLootableIds) {
      lootables.push({ id, label: 'empty chest', opened: true, loot: { rarity: 'Common', qty: 0 } });
    }
    const looseItems: NonNullable<NodeHidden['looseItems']> = [];
    for (const l of n.looseLeft) {
      looseItems.push({ id: l.id, label: l.label, inventoryItemId: l.inventoryItemId, item: l.item });
    }
    nodes.push({
      id: n.id,
      name: n.name,
      description: n.description,
      connections: [...n.connections],
      tags: n.tags ? [...n.tags] : undefined,
      isSecret: n.isSecret,
      coordinates: n.coordinates,
      zLevel: n.zLevel,
      footprint: n.footprint,
      edgeKinds: n.edgeKinds as MapNode['edgeKinds'],
      hidden: { traps: [], lootables, secrets: [], mobs: [], looseItems },
    });
  }
  const entry = nodes.find((n) => n.id === 'r0') ?? nodes[0];
  return {
    blueprintId: record.map.blueprintId,
    dungeonName: record.map.dungeonName,
    siteName: record.map.siteName,
    tier: record.map.tier,
    dangerTier: record.map.dangerTier,
    areaLevel: record.map.areaLevel,
    currentZLevel: entry?.zLevel ?? record.map.currentZLevel,
    currentNodeId: entry?.id ?? 'r0',
    visitedNodeIds: [...record.map.visitedNodeIds],
    clearedNodeIds: [...record.map.clearedNodeIds],
    cleared: true,
    nodes,
  };
}

/** Apply cleared deltas onto a stored card: no foes, opened stay empty, left loose restored. */
export function applyClearedSiteRecord(d: ActiveDungeonState, record: ClearedSiteRecord): ActiveDungeonState {
  const taken = new Set(record.items.taken);
  const byId = new Map<string, ClearedSiteRecord['map']['nodes'][0]>();
  for (const n of record.map.nodes) byId.set(n.id, n);
  const nodes: MapNode[] = [];
  for (const n of d.nodes) {
    const snap = byId.get(n.id);
    const openedIds = new Set<string>([...(snap?.openedLootableIds ?? []), ...taken]);
    const lootables: NodeHidden['lootables'] = [];
    for (const l of n.hidden?.lootables ?? []) {
      lootables.push(openedIds.has(l.id) || l.opened ? { ...l, opened: true } : l);
    }
    for (const id of snap?.openedLootableIds ?? []) {
      if (!lootables.some((l) => l.id === id)) {
        lootables.push({ id, label: 'empty chest', opened: true, loot: { rarity: 'Common', qty: 0 } });
      }
    }
    let looseItems: NonNullable<NodeHidden['looseItems']> = [];
    if (snap?.looseLeft?.length) {
      for (const l of snap.looseLeft) {
        looseItems.push({ id: l.id, label: l.label, inventoryItemId: l.inventoryItemId, item: l.item });
      }
    } else {
      for (const l of n.hidden?.looseItems ?? []) {
        if (!taken.has(l.id)) looseItems.push(l);
      }
    }
    nodes.push({
      ...n,
      connections: snap?.connections ?? n.connections,
      edgeKinds: (snap?.edgeKinds as MapNode['edgeKinds']) ?? n.edgeKinds,
      hidden: { traps: n.hidden?.traps ?? [], secrets: n.hidden?.secrets ?? [], lootables, mobs: [], looseItems },
    });
  }
  return {
    ...d,
    cleared: true,
    visitedNodeIds: record.map.visitedNodeIds.length ? [...record.map.visitedNodeIds] : d.visitedNodeIds,
    clearedNodeIds: record.map.clearedNodeIds.length ? [...record.map.clearedNodeIds] : d.clearedNodeIds,
    nodes,
  };
}

/** Leave a site: write clearedSites + park foe-stripped card; return to exterior. */
export function condenseClearedSite(state: GameState, opts?: { summary?: string }): GameState {
  const dungeon = state.activeDungeon;
  if (!dungeon) return state;
  const site = dungeon.siteName ?? dungeon.dungeonName ?? state.currentLocation ?? 'Outside';
  const key = placeIdFromName(site);
  const stripped = stripDungeonFoes({ ...dungeon, cleared: true });
  const record = recordClearedSite(stripped);
  const clearedSites = { ...(state.clearedSites ?? {}), [key]: record };
  const summary = opts?.summary ?? 'Site cleared';
  const places: PlaceRecord[] = [];
  let hasPlace = false;
  for (const p of state.places ?? []) {
    if (
      p.id === key ||
      p.dungeonRef === dungeon.dungeonName ||
      p.name.toLowerCase() === (dungeon.siteName ?? '').toLowerCase()
    ) {
      hasPlace = true;
      places.push({
        ...p,
        arcStatus: 'cleared',
        arcSummary: opts?.summary ?? p.arcSummary ?? summary,
        lastVisitedTurn: state.turn,
        dungeonCard: stripped,
        allowsDungeon: true,
        dungeonRef: dungeon.dungeonName,
      });
    } else {
      places.push(p);
    }
  }
  if (!hasPlace) {
    places.push({
      id: key,
      name: site,
      allowsDungeon: true,
      dungeonRef: dungeon.dungeonName,
      dungeonCard: stripped,
      arcStatus: 'cleared',
      arcSummary: summary,
      lastVisitedTurn: state.turn,
      mapScale: 'street',
    });
  }
  return {
    ...state,
    activeDungeon: null,
    currentLocation: site,
    clearedSites,
    places,
    sceneFacts: { ...(state.sceneFacts ?? {}), indoor: false, lastBeat: `Cleared ${site}` },
  };
}

/** Open a procedural interior at the current site (if allowed). */
export function openDungeonAtSite(
  state: GameState,
  opts?: { siteName?: string; seed?: string }
): GameState {
  const site = opts?.siteName ?? state.currentLocation ?? 'Ruin';
  if (!placeAllowsDungeon(state, site) && !opts?.siteName) return state;
  if (!placeAllowsDungeon(state, site)) return state;
  if (state.activeDungeon && !state.activeDungeon.cleared) return state;

  const key = placeIdFromName(site);
  const cleared = state.clearedSites?.[key];
  if (cleared) {
    const place = (state.places ?? []).find((p) => p.id === key || p.name.toLowerCase() === site.toLowerCase());
    let card =
      place?.dungeonCard != null
        ? applyClearedSiteRecord(place.dungeonCard, cleared)
        : dungeonFromClearedRecord(cleared);
    card = {
      ...card,
      currentNodeId: 'r0',
      currentZLevel: card.nodes.find((n) => n.id === 'r0')?.zLevel ?? card.currentZLevel,
    };
    const places: PlaceRecord[] = [];
    if (place) {
      for (const p of state.places ?? []) {
        places.push(
          p.id === place.id
            ? { ...p, allowsDungeon: true, dungeonRef: card.dungeonName, dungeonCard: card, arcStatus: 'cleared' }
            : p
        );
      }
    } else {
      for (const p of state.places ?? []) places.push(p);
      places.push({
        id: key,
        name: site,
        allowsDungeon: true,
        dungeonRef: card.dungeonName,
        dungeonCard: card,
        arcStatus: 'cleared',
        mapScale: 'street',
      });
    }
    return {
      ...state,
      activeDungeon: card,
      places,
      currentLocation: dungeonHereLabel(card.dungeonName, card.nodes.find((n) => n.id === 'r0')?.name),
      sceneFacts: { ...(state.sceneFacts ?? {}), indoor: true } as GameState['sceneFacts'],
    };
  }

  const seed = opts?.seed ?? state.seed ?? state.saveId ?? 'dungeon';
  let dungeon: ActiveDungeonState = buildInteriorFloorPlan(site, [], undefined, `${seed}-${site}`);
  dungeon = { ...dungeon, dungeonName: `${site} Interior`, siteName: site };
  dungeon = seedDungeonState(dungeon, `${seed}-${site}`);
  const places = markPlaceDungeonRef(state.places ?? [], site, dungeon.dungeonName ?? site);
  const entryNode = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId) ?? dungeon.nodes[0];
  return {
    ...state,
    activeDungeon: dungeon,
    places,
    currentLocation: entryNode ? dungeonHereLabel(dungeon.dungeonName, entryNode.name) : site,
  };
}

/** Close / clear active dungeon — return to site exterior. Cleared sites condense (O1-C). */
export function closeDungeon(
  state: GameState,
  opts?: { cleared?: boolean; summary?: string }
): GameState {
  const dungeon = state.activeDungeon;
  if (!dungeon) return state;
  if (opts?.cleared || dungeon.cleared || shouldAutoCloseDungeon(state)) {
    return condenseClearedSite(state, { summary: opts?.summary });
  }
  const site = dungeon.siteName ?? dungeon.dungeonName ?? state.currentLocation ?? 'Outside';
  const places: PlaceRecord[] = [];
  for (const p of state.places ?? []) {
    if (
      p.dungeonRef === dungeon.dungeonName ||
      p.name.toLowerCase() === (dungeon.siteName ?? '').toLowerCase()
    ) {
      places.push({
        ...p,
        arcStatus: 'closed',
        arcSummary: opts?.summary ?? p.arcSummary ?? 'Left dungeon',
        lastVisitedTurn: state.turn,
        ...(dungeon.blueprintId === 'dungeon-card' ? { dungeonCard: dungeon } : {}),
      });
    } else {
      places.push(p);
    }
  }
  return {
    ...state,
    activeDungeon: null,
    currentLocation: site,
    places,
    sceneFacts: {
      ...(state.sceneFacts ?? {}),
      indoor: false,
      lastBeat: `Left ${site} interior`,
    },
  };
}

/** True if dungeon mobs are all defeated / no remaining threat. */
export function shouldAutoCloseDungeon(state: GameState): boolean {
  const d = state.activeDungeon;
  if (!d?.nodes?.length) return false;
  const mobs = d.nodes.flatMap((n) => n.hidden?.mobs ?? []);
  if (mobs.length) return mobs.every((m) => m.defeated || (m.hp ?? 1) <= 0);
  const cleared = new Set(d.clearedNodeIds ?? []);
  if (!cleared.size) return false;
  const combatNodeIds: string[] = [];
  for (const n of d.nodes) {
    if ((n.hidden?.mobs?.length ?? 0) > 0 || cleared.has(n.id)) combatNodeIds.push(n.id);
  }
  if (!combatNodeIds.length) return false;
  for (const id of combatNodeIds) {
    if (!cleared.has(id)) return false;
  }
  return true;
}

/**
 * O1-C — when every foe is down, mark cleared / condense. Legacy path no longer discards the layout.
 * Card sites: mark cleared in place (player leaves by choice); parkDungeonCard writes clearedSites.
 */
export function maybeAutoCloseDungeon(state: GameState): GameState {
  if (!shouldAutoCloseDungeon(state)) return state;
  const d = state.activeDungeon;
  if (!d) return state;
  if (d.blueprintId === 'dungeon-card') {
    if (d.cleared) return state;
    return { ...state, activeDungeon: { ...d, cleared: true } };
  }
  return condenseClearedSite({ ...state, activeDungeon: { ...d, cleared: true } }, {
    summary: 'All threats cleared',
  });
}

export { buildInteriorFloorPlan };
