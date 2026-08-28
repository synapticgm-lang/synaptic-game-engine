import { pickWorldOutline, type WorldOutlineDef } from './worldOutlines.ts';
import type { CampaignBible } from './campaignBibleTypes.ts';
import type { EngineMode, GameState, WorldAtlasState } from './types.ts';
import { attachSettlementsToAtlas } from './worldMapAuthority.ts';

export function instantiateWorldAtlas(outline: WorldOutlineDef): WorldAtlasState {
  const base: WorldAtlasState = {
    outlineId: outline.id,
    outlineName: outline.name,
    description: outline.description,
    currentRegionId: outline.startingRegionId,
    regions: outline.regions.map((r) => ({
      id: r.id,
      name: r.name,
      blurb: r.blurb,
      connections: [...r.connections],
      tags: r.tags ? [...r.tags] : undefined,
      revealed: r.id === outline.startingRegionId,
    })),
  };
  return attachSettlementsToAtlas(base, outline);
}

/**
 * Seed atlas at New Game. LitRPG / DnD / RPG always get a premade world map (29e).
 * PYOA stays closed unless a bible pins an outline.
 */
export function seedWorldAtlas(
  state: GameState,
  bible?: CampaignBible | null
): GameState {
  const pinned =
    bible && 'worldOutlineId' in bible
      ? (bible.worldOutlineId as string | null | undefined)
      : undefined;
  const outline = pickWorldOutline(state.engineMode, state.seed || state.saveId, pinned);
  if (!outline) {
    return { ...state, worldAtlas: null };
  }
  return { ...state, worldAtlas: instantiateWorldAtlas(outline) };
}

/** Reveal a region (and optionally its neighbors) when the player arrives. */
export function revealWorldRegion(
  atlas: WorldAtlasState | null | undefined,
  regionIdOrName: string,
  opts?: { revealNeighbors?: boolean }
): WorldAtlasState | null | undefined {
  if (!atlas) return atlas;
  const key = regionIdOrName.trim().toLowerCase();
  const hit = atlas.regions.find(
    (r) => r.id === key || r.name.toLowerCase() === key
  );
  if (!hit) return atlas;
  const revealIds = new Set<string>([hit.id]);
  if (opts?.revealNeighbors !== false) {
    for (const n of hit.connections) revealIds.add(n);
  }
  return {
    ...atlas,
    currentRegionId: hit.id,
    regions: atlas.regions.map((r) =>
      revealIds.has(r.id) ? { ...r, revealed: true } : r
    ),
  };
}

/** Fuzzy match current location text against atlas region / settlement names. */
export function maybeRevealFromLocation(
  state: GameState,
  locationName?: string | null
): GameState {
  if (!state.worldAtlas || !locationName?.trim()) return state;
  const loc = locationName.toLowerCase();
  const settlement = state.worldAtlas.settlements?.find(
    (s) =>
      loc.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(loc) ||
      s.aliases?.some((a) => loc.includes(a.toLowerCase()))
  );
  if (settlement) {
    const next = revealWorldRegion(state.worldAtlas, settlement.regionId);
    if (next === state.worldAtlas) return state;
    return { ...state, worldAtlas: next ?? null };
  }
  const hit = state.worldAtlas.regions.find(
    (r) => loc.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(loc)
  );
  if (!hit) return state;
  const next = revealWorldRegion(state.worldAtlas, hit.id);
  if (next === state.worldAtlas) return state;
  return { ...state, worldAtlas: next ?? null };
}

export function formatWorldAtlasBlock(state: GameState): string {
  const atlas = state.worldAtlas;
  if (!atlas) {
    return 'WORLD ATLAS: none (closed / local story — do not invent a continent map).';
  }
  const lines = atlas.regions.map((r) => {
    if (r.revealed) {
      const here = r.id === atlas.currentRegionId ? ' ← HERE' : '';
      return `- ${r.name}${here}: ${r.blurb} [links: ${r.connections.join(', ') || '—'}]`;
    }
    return `- ??? (unrevealed region — keep fogged; do not invent its name or contents)`;
  });
  const settle = (atlas.settlements ?? [])
    .slice(0, 24)
    .map((s) => `  · ${s.name} (${s.kind}/${s.biome})`);
  return [
    'WORLD ATLAS (PREMADE OUTLINE — BINDING):',
    `Outline: ${atlas.outlineName} — ${atlas.description}`,
    'Stay inside this outline. Do not invent new cities, towns, shores, or continents.',
    'Fog: unrevealed regions stay ??? until the player travels there.',
    ...lines,
    'Settlements (fixed):',
    ...settle,
  ].join('\n');
}

export function defaultAtlasForMode(mode: EngineMode, seed: string): WorldAtlasState | null {
  const outline = pickWorldOutline(mode, seed);
  return outline ? instantiateWorldAtlas(outline) : null;
}
