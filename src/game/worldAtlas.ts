import { pickWorldOutline, type WorldOutlineDef } from '@/data/worldOutlines';
import type { CampaignBible } from '@/data/campaigns/types';
import type { EngineMode, GameState, WorldAtlasState } from './types';

export function instantiateWorldAtlas(outline: WorldOutlineDef): WorldAtlasState {
  return {
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
      // Starting region is known; neighbors stay fogged until visited or adjacent reveal.
      revealed: r.id === outline.startingRegionId,
    })),
  };
}

/**
 * Seed atlas at New Game. Bible may pin an outline id, or set null for closed stories.
 */
export function seedWorldAtlas(
  state: GameState,
  bible?: CampaignBible | null,
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
  opts?: { revealNeighbors?: boolean },
): WorldAtlasState | null | undefined {
  if (!atlas) return atlas;
  const key = regionIdOrName.trim().toLowerCase();
  const hit = atlas.regions.find(
    (r) => r.id === key || r.name.toLowerCase() === key,
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
      revealIds.has(r.id) ? { ...r, revealed: true } : r,
    ),
  };
}

/** Fuzzy match current location text against atlas region names. */
export function maybeRevealFromLocation(
  state: GameState,
  locationName?: string | null,
): GameState {
  if (!state.worldAtlas || !locationName?.trim()) return state;
  const loc = locationName.toLowerCase();
  const hit = state.worldAtlas.regions.find(
    (r) => loc.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(loc),
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
  return [
    'WORLD ATLAS (PREMADE OUTLINE — BINDING):',
    `Outline: ${atlas.outlineName} — ${atlas.description}`,
    'Stay inside this outline. You may add paths and local detail, but do not replace the landmass or invent new continent names.',
    'Fog: unrevealed regions stay ??? until the player travels there.',
    ...lines,
  ].join('\n');
}

export function defaultAtlasForMode(mode: EngineMode, seed: string): WorldAtlasState | null {
  const outline = pickWorldOutline(mode, seed);
  return outline ? instantiateWorldAtlas(outline) : null;
}
