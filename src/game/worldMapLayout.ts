/**
 * Order WM-a: a deterministic world-map layout from the atlas (regions + their connections) and the map authority's
 * settlements. Pure: the same atlas gives the same layout on every load. Fog comes from the atlas (revealed) and the
 * place records (visited); the marker from the current place or the journey step. No second store of places.
 */
import type { GameState, PlaceRecord, TravelJourney, WorldAtlasState } from './types';
import { normalizeLocationName } from './worldMapAuthority';
import { hashSeed } from './seededRng';

export const WORLD_MAP_SIZE = { width: 1000, height: 1000 } as const;
const RING = 210;
const SETTLE_R = 70;

export interface MapRegionNode { id: string; name: string; x: number; y: number; revealed: boolean; current: boolean }
export interface MapSettlementNode {
  id: string;
  name: string;
  regionId: string;
  kind: string;
  biome: string;
  x: number;
  y: number;
  /** visited: full; seen: greyed (its region is revealed, the player has not been there). */
  fog: 'visited' | 'seen';
}
export interface MapRoad { from: string; to: string; known: boolean }
export interface WorldMapLayout {
  width: number;
  height: number;
  regions: MapRegionNode[];
  settlements: MapSettlementNode[];
  roads: MapRoad[];
  marker: { x: number; y: number } | null;
}

/** Region centres: rings by hops from the starting region, order inside a ring by id, turned by the outline's seed. */
function regionPositions(atlas: WorldAtlasState, startId: string): Map<string, { x: number; y: number }> {
  const byId = new Map(atlas.regions.map((r) => [r.id, r]));
  const depth = new Map<string, number>();
  const queue = [byId.has(startId) ? startId : [...byId.keys()].sort()[0]!];
  depth.set(queue[0]!, 0);
  while (queue.length) {
    const id = queue.shift()!;
    for (const n of [...(byId.get(id)?.connections ?? [])].sort()) {
      if (byId.has(n) && !depth.has(n)) {
        depth.set(n, depth.get(id)! + 1);
        queue.push(n);
      }
    }
  }
  let far = Math.max(0, ...depth.values());
  for (const id of [...byId.keys()].sort()) if (!depth.has(id)) depth.set(id, ++far);
  const rings = new Map<number, string[]>();
  for (const [id, d] of depth) rings.set(d, [...(rings.get(d) ?? []), id]);
  const turn = (hashSeed(atlas.outlineId) % 360) * (Math.PI / 180);
  const maxD = Math.max(1, ...rings.keys());
  const ring = Math.min(RING, (WORLD_MAP_SIZE.width / 2 - SETTLE_R - 40) / maxD);
  const cx = WORLD_MAP_SIZE.width / 2;
  const cy = WORLD_MAP_SIZE.height / 2;
  const out = new Map<string, { x: number; y: number }>();
  for (const [d, ids] of rings) {
    ids.sort();
    ids.forEach((id, i) => {
      const a = turn + (2 * Math.PI * i) / ids.length + d * 0.5;
      out.set(id, { x: Math.round(cx + Math.cos(a) * ring * d), y: Math.round(cy + Math.sin(a) * ring * d) });
    });
  }
  return out;
}

const visitedKeys = (places: readonly PlaceRecord[]) =>
  new Set(places.filter((p) => p.lastVisitedTurn != null || p.arcStatus === 'visited' || p.arcStatus === 'cleared').map((p) => normalizeLocationName(p.name)));

export function worldMapLayout(
  atlas: WorldAtlasState | null | undefined,
  places: readonly PlaceRecord[] = [],
  currentLocation = '',
  journey?: TravelJourney | null
): WorldMapLayout | null {
  if (!atlas?.regions?.length) return null;
  // Rooted at the outline's first region, not the player's: the layout must not move as the player travels.
  const pos = regionPositions(atlas, atlas.regions[0]!.id);
  const revealed = new Set(atlas.regions.filter((r) => r.revealed).map((r) => r.id));
  const regions: MapRegionNode[] = atlas.regions.map((r) => ({
    id: r.id,
    name: r.name,
    ...pos.get(r.id)!,
    revealed: r.revealed,
    current: r.id === atlas.currentRegionId,
  }));
  const seen = new Set<string>();
  const roads: MapRoad[] = [];
  for (const r of atlas.regions) {
    for (const n of r.connections) {
      const key = [r.id, n].sort().join('|');
      if (seen.has(key) || !pos.has(n)) continue;
      seen.add(key);
      if (!revealed.has(r.id) && !revealed.has(n)) continue;
      roads.push({ from: r.id, to: n, known: revealed.has(r.id) && revealed.has(n) });
    }
  }
  const visited = visitedKeys(places);
  const settlements: MapSettlementNode[] = [];
  const perRegion = new Map<string, number>();
  const all = [...(atlas.settlements ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  for (const s of all) perRegion.set(s.regionId, (perRegion.get(s.regionId) ?? 0) + 1);
  const index = new Map<string, number>();
  for (const s of all) {
    const i = index.get(s.regionId) ?? 0;
    index.set(s.regionId, i + 1);
    if (!revealed.has(s.regionId)) continue;
    const c = pos.get(s.regionId);
    if (!c) continue;
    const n = perRegion.get(s.regionId) ?? 1;
    const a = (2 * Math.PI * i) / n + (hashSeed(s.regionId) % 360) * (Math.PI / 180);
    const names = [s.name, ...(s.aliases ?? [])].map(normalizeLocationName);
    settlements.push({
      id: s.id,
      name: s.name,
      regionId: s.regionId,
      kind: s.kind,
      biome: s.biome,
      x: Math.round(c.x + Math.cos(a) * SETTLE_R * (n > 1 ? 1 : 0)),
      y: Math.round(c.y + Math.sin(a) * SETTLE_R * (n > 1 ? 1 : 0)),
      fog: names.some((k) => visited.has(k)) ? 'visited' : 'seen',
    });
  }
  const at = (name: string) => {
    const k = normalizeLocationName(name ?? '');
    if (!k) return null;
    const s = (atlas.settlements ?? []).find((x) => [x.name, ...(x.aliases ?? [])].some((n) => normalizeLocationName(n) === k));
    return s ? settlements.find((x) => x.id === s.id) ?? null : null;
  };
  let marker: WorldMapLayout['marker'] = null;
  if (journey && journey.legsTotal > 0) {
    const a = at(journey.from);
    const b = at(journey.to);
    if (a && b) {
      const t = Math.min(1, Math.max(0, journey.legsDone / journey.legsTotal));
      marker = { x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) };
    }
  }
  if (!marker) {
    const here = at(currentLocation);
    const c = here ?? regions.find((r) => r.current);
    if (c) marker = { x: c.x, y: c.y };
  }
  return { ...WORLD_MAP_SIZE, regions, settlements, roads, marker };
}

/** The layout for a game state (atlas, place records, where the player is, the journey). */
export function worldMapLayoutFor(state: GameState): WorldMapLayout | null {
  return worldMapLayout(state.worldAtlas, state.places ?? [], state.currentLocation ?? '', state.journey);
}
