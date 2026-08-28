/**
 * 29e — Dungeon generate / close lifecycle.
 * Interiors open at allowsDungeon map sites (or seeded hubs); close when cleared.
 */

import type { GameState, PlaceRecord } from './types.ts';
import type { ActiveDungeonState } from './mapEngine.ts';
import { buildInteriorFloorPlan } from './mapEngine.ts';
import { seedDungeonState } from './dungeonSeed.ts';
import { findSettlement } from './worldMapAuthority.ts';
import { placeIdFromName } from './places.ts';

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
  // Bible hubs / ruin cues
  return /\b(dungeon|ruin|crypt|undercroft|mine|delve|keep|store|warehouse|factory)\b/i.test(
    placeName
  );
}

/** Open a procedural interior at the current site (if allowed). */
export function openDungeonAtSite(
  state: GameState,
  opts?: { siteName?: string; seed?: string }
): GameState {
  const site = opts?.siteName ?? state.currentLocation ?? 'Ruin';
  if (!placeAllowsDungeon(state, site) && !opts?.siteName) {
    return state;
  }
  if (!placeAllowsDungeon(state, site)) {
    return state;
  }
  if (state.activeDungeon && !state.activeDungeon.cleared) {
    return state; // already inside
  }
  const seed = opts?.seed ?? state.seed ?? state.saveId ?? 'dungeon';
  let dungeon: ActiveDungeonState = buildInteriorFloorPlan(
    site,
    [],
    undefined,
    `${seed}-${site}`
  );
  dungeon = {
    ...dungeon,
    dungeonName: `${site} Interior`,
    siteName: site,
  };
  dungeon = seedDungeonState(dungeon, `${seed}-${site}`);
  const places = markPlaceDungeonRef(state.places ?? [], site, dungeon.dungeonName ?? site);
  return {
    ...state,
    activeDungeon: dungeon,
    places,
    currentLocation: dungeon.nodes?.[0]?.name ?? site,
  };
}

function markPlaceDungeonRef(
  places: PlaceRecord[],
  siteName: string,
  dungeonRef: string
): PlaceRecord[] {
  const id = placeIdFromName(siteName);
  const existing = places.find(
    (p) => p.id === id || p.name.toLowerCase() === siteName.toLowerCase()
  );
  if (!existing) {
    return [
      ...places,
      {
        id,
        name: siteName,
        dungeonRef,
        allowsDungeon: true,
        arcStatus: 'open',
        mapScale: 'street',
      },
    ];
  }
  return places.map((p) =>
    p.id === existing.id ? { ...p, dungeonRef, allowsDungeon: true } : p
  );
}

/** Close / clear active dungeon — return to site exterior. */
export function closeDungeon(
  state: GameState,
  opts?: { cleared?: boolean; summary?: string }
): GameState {
  const dungeon = state.activeDungeon;
  if (!dungeon) return state;
  const site = dungeon.siteName ?? dungeon.dungeonName ?? state.currentLocation ?? 'Outside';
  const places = (state.places ?? []).map((p) => {
    if (
      p.dungeonRef === dungeon.dungeonName ||
      p.name.toLowerCase() === (dungeon.siteName ?? '').toLowerCase()
    ) {
      return {
        ...p,
        arcStatus: (opts?.cleared ? 'cleared' : 'closed') as PlaceRecord['arcStatus'],
        arcSummary: opts?.summary ?? p.arcSummary ?? (opts?.cleared ? 'Dungeon cleared' : 'Left dungeon'),
        lastVisitedTurn: state.turn,
      };
    }
    return p;
  });
  return {
    ...state,
    activeDungeon: null,
    currentLocation: site,
    places,
    sceneFacts: {
      ...(state.sceneFacts ?? {}),
      indoor: false,
      lastBeat: opts?.cleared ? `Cleared ${site}` : `Left ${site} interior`,
    },
  };
}

/** True if dungeon mobs are all defeated / no remaining threat. */
export function shouldAutoCloseDungeon(state: GameState): boolean {
  const d = state.activeDungeon;
  if (!d?.nodes?.length) return false;
  const mobs = d.nodes.flatMap((n) => n.hidden?.mobs ?? []);
  if (mobs.length) {
    return mobs.every((m) => m.defeated || (m.hp ?? 1) <= 0);
  }
  // 29e — if clearedNodeIds covers every node that ever had mobs (or all nodes), treat as cleared
  const cleared = new Set(d.clearedNodeIds ?? []);
  if (!cleared.size) return false;
  const combatNodeIds = d.nodes
    .filter((n) => (n.hidden?.mobs?.length ?? 0) > 0 || cleared.has(n.id))
    .map((n) => n.id);
  if (!combatNodeIds.length) return false;
  return combatNodeIds.every((id) => cleared.has(id));
}

export function maybeAutoCloseDungeon(state: GameState): GameState {
  if (!shouldAutoCloseDungeon(state)) return state;
  return closeDungeon(state, { cleared: true, summary: 'All threats cleared' });
}

/** Re-export for callers that need mapEngine init. */
export { buildInteriorFloorPlan };
