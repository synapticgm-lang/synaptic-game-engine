/**
 * XP-D1 OPEN5 — one owner for region level bands and resource profiles.
 * Seeded once per save (state.seed + regionId); AI never sets bands.
 */
import type { GameState, WorldAtlasRegionState } from './types';
import { WORLD_OUTLINES } from '../data/worldOutlines';
import { biomeKey } from '../data/dungeonBiomes';
import {
  WORLD_MAX_CREATURE_LEVEL,
  tierForLevel,
  ORE_BY_TIER,
  HERB_BY_TIER,
} from './rules/wildlifeConfig';

export interface RegionLevelBand {
  regionId: string;
  low: number;
  high: number;
}

export interface RegionResourceProfile {
  regionId: string;
  oreTier: number | null;
  herbTier: number | null;
  /** One tier above creature band mid — rich but weakly guarded. */
  richWeak: boolean;
  oreId?: string;
  herbId?: string;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function regionsOf(state: GameState): WorldAtlasRegionState[] {
  const atlas = state.worldAtlas?.regions;
  if (atlas && atlas.length) return atlas;
  const outlineId = state.worldAtlas?.outlineId;
  const outline = WORLD_OUTLINES.find((o) => o.id === outlineId) ?? WORLD_OUTLINES[0];
  return (outline?.regions ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    blurb: r.blurb,
    connections: r.connections ?? [],
    tags: r.tags ?? [],
    revealed: true,
  }));
}

function startRegionId(state: GameState, regions: WorldAtlasRegionState[]): string {
  const here = (state.currentLocation ?? '').toLowerCase();
  const places = state.places ?? [];
  const outline = WORLD_OUTLINES.find((o) => o.id === state.worldAtlas?.outlineId);
  if (outline && regions.some((r) => r.id === outline.startingRegionId)) return outline.startingRegionId;
  const byLoc = places.find((p) => here && p.name.toLowerCase() === here);
  if (byLoc?.regionId) return byLoc.regionId;
  return regions[0]?.id ?? 'start';
}

/** BFS hops from start along connections. */
function hopDistances(
  regions: WorldAtlasRegionState[],
  startId: string
): Map<string, number> {
  const byId = new Map(regions.map((r) => [r.id, r]));
  const dist = new Map<string, number>();
  const q: string[] = [];
  if (!byId.has(startId) && regions[0]) {
    startId = regions[0].id;
  }
  dist.set(startId, 0);
  q.push(startId);
  while (q.length) {
    const id = q.shift()!;
    const r = byId.get(id);
    const d = dist.get(id) ?? 0;
    for (const n of r?.connections ?? []) {
      if (dist.has(n)) continue;
      if (!byId.has(n)) continue;
      dist.set(n, d + 1);
      q.push(n);
    }
  }
  for (const r of regions) {
    if (!dist.has(r.id)) dist.set(r.id, (dist.get(startId) ?? 0) + 3);
  }
  return dist;
}

function dangerBoost(tags: string[] | undefined): number {
  const t = (tags ?? []).map((x) => x.toLowerCase());
  if (t.some((x) => /danger|hazard|dungeon|mine|ruin|blight|undead|void/.test(x))) return 2;
  return 0;
}

/**
 * Ensure every region has a stable band on state.regionLevelBands.
 * Start region 1–3; farthest reaches WORLD_MAX_CREATURE_LEVEL; connected mids differ by ≤6.
 */
export function ensureRegionBands(state: GameState): GameState {
  const regions = regionsOf(state);
  if (!regions.length) return state;
  const existing = { ...(state.regionLevelBands ?? {}) };
  if (regions.every((r) => existing[r.id])) return state;

  const startId = startRegionId(state, regions);
  const hops = hopDistances(regions, startId);
  let maxHop = 1;
  for (const d of hops.values()) maxHop = Math.max(maxHop, d || 1);
  const rng = mulberry(hashSeed(`${state.seed ?? 's'}|region-bands|${startId}`));

  // Step per hop so the farthest mid reaches near WORLD_MAX. Prefer ≤6; short graphs
  // (diameter < 5) must use a larger step or the farthest cannot hit level 30.
  const neededStep = (WORLD_MAX_CREATURE_LEVEL - 2) / maxHop;
  const midStep = Math.max(1, neededStep);
  const maxMidDelta = Math.max(6, Math.ceil(midStep));

  let farId = startId;
  let farHop = -1;
  for (const [id, d] of hops) {
    if (d > farHop) {
      farHop = d;
      farId = id;
    }
  }

  const midOf = new Map<string, number>();
  for (const r of regions) {
    const d = hops.get(r.id) ?? 0;
    let mid = d === 0 ? 2 : Math.round(2 + d * midStep + dangerBoost(r.tags) * 0.5);
    mid = Math.max(2, Math.min(WORLD_MAX_CREATURE_LEVEL - 1, mid));
    midOf.set(r.id, mid);
  }
  midOf.set(farId, WORLD_MAX_CREATURE_LEVEL - 2);
  midOf.set(startId, 2);
  void rng;

  // Project connected mids so |a-b| ≤ maxMidDelta (6 when the graph is long enough).
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (const r of regions) {
      for (const n of r.connections ?? []) {
        if (r.id === startId && n === startId) continue;
        let a = midOf.get(r.id) ?? 2;
        let b = midOf.get(n) ?? 2;
        if (Math.abs(a - b) <= maxMidDelta) continue;
        const avg = (a + b) / 2;
        const half = maxMidDelta / 2;
        let na = Math.round(avg + Math.sign(a - b) * half);
        let nb = Math.round(avg + Math.sign(b - a) * half);
        if (r.id === startId) na = 2;
        if (n === startId) nb = 2;
        if (r.id === farId) na = Math.max(na, WORLD_MAX_CREATURE_LEVEL - 2);
        if (n === farId) nb = Math.max(nb, WORLD_MAX_CREATURE_LEVEL - 2);
        if (na !== a || nb !== b) moved = true;
        midOf.set(r.id, Math.max(2, Math.min(WORLD_MAX_CREATURE_LEVEL - 1, na)));
        midOf.set(n, Math.max(2, Math.min(WORLD_MAX_CREATURE_LEVEL - 1, nb)));
      }
    }
    if (!moved) break;
  }
  midOf.set(startId, 2);
  midOf.set(farId, Math.max(midOf.get(farId) ?? 2, WORLD_MAX_CREATURE_LEVEL - 2));

  for (const r of regions) {
    if (existing[r.id]) continue;
    const d = hops.get(r.id) ?? 0;
    const width = d === 0 ? 3 : Math.min(6, 4 + Math.floor((d / maxHop) * 2));
    const mid = midOf.get(r.id) ?? 2;
    if (d === 0 || r.id === startId) {
      existing[r.id] = { regionId: r.id, low: 1, high: 3 };
      continue;
    }
    let low = Math.max(1, mid - Math.floor((width - 1) / 2));
    let high = Math.min(WORLD_MAX_CREATURE_LEVEL, low + width - 1);
    if (r.id === farId) {
      high = WORLD_MAX_CREATURE_LEVEL;
      low = Math.max(1, high - width + 1);
    }
    existing[r.id] = { regionId: r.id, low, high };
  }

  return { ...state, regionLevelBands: existing };
}

export function regionBand(state: GameState, regionId: string): RegionLevelBand {
  const next = ensureRegionBands(state);
  const b = next.regionLevelBands?.[regionId];
  if (b) return b;
  return { regionId, low: 1, high: 3 };
}

export function ensureRegionResources(state: GameState): GameState {
  const withBands = ensureRegionBands(state);
  const regions = regionsOf(withBands);
  const existing = { ...(withBands.regionResourceProfiles ?? {}) };
  const settlements = withBands.worldAtlas?.settlements ?? [];
  let richPlaced = false;

  for (const r of regions) {
    if (existing[r.id]) {
      if (existing[r.id]!.richWeak) richPlaced = true;
      continue;
    }
    const tags = [...(r.tags ?? []), ...settlements.filter((s) => s.regionId === r.id).flatMap((s) => [s.biome ?? '', ...(s.questTags ?? [])])];
    const biomes = tags.map((t) => biomeKey(t)).filter(Boolean) as string[];
    const band = regionBand(withBands, r.id);
    const mid = Math.round((band.low + band.high) / 2);
    const baseTier = tierForLevel(mid);
    const wantOre = tags.some((t) => /mountain|mine|hill|desert|caldera|industrial/i.test(t))
      || biomes.some((b) => /mountain|mine|desert|industrial/.test(b));
    const wantHerb = tags.some((t) => /forest|plains|farm|wetland|park|coast/i.test(t))
      || biomes.some((b) => /forest|plains|wetland|coast/.test(b));
    const urban = biomes.includes('urban') || /metro|urban|city/i.test(tags.join(' '));

    let oreTier: number | null = wantOre ? baseTier : urban ? Math.max(1, baseTier - 1) : null;
    let herbTier: number | null = wantHerb || urban ? baseTier : null;
    if (!oreTier && !herbTier) herbTier = baseTier;

    const rng = mulberry(hashSeed(`${withBands.seed ?? ''}|res|${r.id}`));
    let richWeak = false;
    if (!richPlaced && (oreTier || herbTier) && band.high <= 12 && rng() < 0.45) {
      richWeak = true;
      richPlaced = true;
      if (oreTier) oreTier = Math.min(6, oreTier + 1);
      else if (herbTier) herbTier = Math.min(6, herbTier + 1);
    }

    existing[r.id] = {
      regionId: r.id,
      oreTier,
      herbTier,
      richWeak,
      oreId: oreTier ? ORE_BY_TIER[oreTier - 1]?.id : undefined,
      herbId: herbTier ? HERB_BY_TIER[Math.min(HERB_BY_TIER.length, herbTier) - 1]?.id : undefined,
    };
  }

  if (!richPlaced && regions.length) {
    const pick = regions[regions.length - 1]!;
    const row = existing[pick.id] ?? {
      regionId: pick.id,
      oreTier: 2,
      herbTier: null,
      richWeak: true,
    };
    existing[pick.id] = {
      ...row,
      richWeak: true,
      oreTier: Math.min(6, (row.oreTier ?? 1) + 1),
      oreId: ORE_BY_TIER[Math.min(5, (row.oreTier ?? 1))]?.id,
    };
  }

  return { ...withBands, regionResourceProfiles: existing };
}

export function resolvePlaceRegionId(state: GameState, placeName?: string): string {
  const name = (placeName ?? state.currentLocation ?? '').toLowerCase();
  const hit = (state.places ?? []).find(
    (p) => p.name.toLowerCase() === name || (name && p.name.toLowerCase().includes(name))
  );
  if (hit?.regionId) return hit.regionId;
  const regions = regionsOf(state);
  return startRegionId(state, regions);
}
