/**
 * 29e — World map authority: premade settlements, biomes, invent-lock, quest-site fitness.
 * AI narrates fluff inside the map; code owns geography (towns/cities/shores).
 */

import type { WorldOutlineDef, WorldOutlineSettlement } from '@/data/worldOutlines';
import type { GameState, PlaceRecord, WorldAtlasState } from './types';
import { placeIdFromName } from './places';

/** Quest / site tags that must match settlement biomes. */
const BIOME_QUEST_ALLOW: Record<string, string[]> = {
  farming: ['farm', 'rural', 'plains', 'wetland', 'orchard'],
  fishing: ['coast', 'river', 'sea', 'wetland', 'shore'],
  mining: ['mine', 'mountain', 'quarry', 'delve'],
  trade: ['town', 'city', 'trade', 'urban', 'market'],
  combat: ['danger', 'hazard', 'dungeon', 'ruin', 'wild', 'forest', 'mountain', 'plains', 'coast'],
  ruin: ['ruin', 'dungeon', 'hazard', 'mine', 'delve'],
  social: ['town', 'city', 'urban', 'village', 'trade'],
  dungeon: ['dungeon', 'mine', 'ruin', 'hazard', 'delve', 'urban', 'industrial'],
};

export function settlementBiomeTags(s: WorldOutlineSettlement): string[] {
  return [s.biome, s.kind, ...(s.questTags ?? [])].map((t) => t.toLowerCase());
}

/** True if a quest tag (farming, fishing, …) fits this settlement's biome. */
export function questFitsSettlement(questTag: string, settlement: WorldOutlineSettlement): boolean {
  const tag = questTag.toLowerCase().replace(/[^a-z]/g, '');
  const allowed = BIOME_QUEST_ALLOW[tag];
  if (!allowed) return true; // unknown tags: allow
  const biome = settlementBiomeTags(settlement);
  return allowed.some((a) => biome.some((b) => b.includes(a) || a.includes(b)));
}

export function inferQuestTagsFromText(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  if (/\b(farm|harvest|crop|orchard|livestock|wheat|grain)\b/.test(t)) tags.push('farming');
  if (/\b(fish|harbor|quay|net|tide|shore)\b/.test(t)) tags.push('fishing');
  if (/\b(mine|ore|shaft|quarry|delve)\b/.test(t)) tags.push('mining');
  if (/\b(trade|market|merchant|caravan)\b/.test(t)) tags.push('trade');
  if (/\b(dungeon|ruin|crypt|undercroft)\b/.test(t)) tags.push('dungeon');
  if (/\b(fight|bandit|skirmish|hunt|clear)\b/.test(t)) tags.push('combat');
  if (/\b(talk|persuade|favor|reputation)\b/.test(t)) tags.push('social');
  return tags;
}

export function settlementsFromAtlas(atlas: WorldAtlasState | null | undefined): WorldOutlineSettlement[] {
  return atlas?.settlements ?? [];
}

export function findSettlement(
  atlas: WorldAtlasState | null | undefined,
  nameOrId: string
): WorldOutlineSettlement | undefined {
  if (!atlas?.settlements?.length) return undefined;
  const key = nameOrId.trim().toLowerCase();
  return atlas.settlements.find(
    (s) =>
      s.id === key ||
      s.name.toLowerCase() === key ||
      s.aliases?.some((a) => a.toLowerCase() === key)
  );
}

/** Legal outdoor geography names: atlas settlements + revealed region names + hubs already on places. */
export function isLegalMapPlace(state: GameState, name: string): boolean {
  const key = name.trim().toLowerCase();
  if (!key || key.length < 2) return false;
  // Interior / dungeon rooms always legal while dungeon live
  if (state.activeDungeon) {
    const node = state.activeDungeon.nodes?.find(
      (n) => n.name.toLowerCase() === key || n.id.toLowerCase() === key
    );
    if (node) return true;
  }
  if (findSettlement(state.worldAtlas, name)) return true;
  const region = state.worldAtlas?.regions.find(
    (r) => r.id === key || r.name.toLowerCase() === key
  );
  if (region) return true;
  // Already harvested / seeded place registry
  const places = state.places ?? [];
  if (
    places.some(
      (p) =>
        p.name.toLowerCase() === key ||
        p.aliases?.some((a) => a.toLowerCase() === key) ||
        p.id === `place_${key.replace(/[^a-z0-9]+/g, '-')}`
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Reject inventing new towns/cities/shores outside the premade map.
 * Local detail (alley, room, stall) is allowed as sub-places under a legal parent.
 */
export function looksLikeGeographyInvent(name: string): boolean {
  return /\b(city|town|village|port|harbor|harbour|coast|shore|capital|kingdom|continent|island|sea|desert|mountain range)\b/i.test(
    name
  );
}

/** Seed atlas settlements into PlaceRecord[] at New Game. */
export function seedWorldMapPlaces(
  places: PlaceRecord[] | undefined,
  atlas: WorldAtlasState | null | undefined
): PlaceRecord[] {
  const settlements = settlementsFromAtlas(atlas);
  if (!settlements.length) return places ?? [];
  let next = [...(places ?? [])];
  for (const s of settlements) {
    const id = placeIdFromName(s.name);
    const existing = next.find(
      (p) =>
        p.id === id ||
        p.name.toLowerCase() === s.name.toLowerCase() ||
        p.aliases?.some((a) => a.toLowerCase() === s.name.toLowerCase())
    );
    const place: PlaceRecord = {
      id: existing?.id ?? id,
      name: s.name,
      loreName: s.name,
      aliases: Array.from(
        new Set([...(existing?.aliases ?? []), ...(s.aliases ?? []), s.name, s.id])
      ).slice(0, 12),
      threatTier: existing?.threatTier ?? (s.kind === 'ruin' || s.biome === 'hazard' ? 3 : 1),
      dangerTier: existing?.dangerTier ?? 1,
      mapScale: s.kind === 'city' ? 'region' : 'street',
      arcStatus: existing?.arcStatus ?? 'open',
      biome: s.biome,
      settlementKind: s.kind,
      regionId: s.regionId,
      mapCanonical: true,
      allowsDungeon:
        s.allowsDungeon ??
        (s.kind === 'ruin' || s.biome === 'dungeon' || s.biome === 'mine'),
    };
    if (existing) {
      next = next.map((p) => (p.id === existing.id ? { ...existing, ...place } : p));
    } else {
      next.push(place);
    }
  }
  return next;
}

/** Pick a legal quest site for tags (biome-sane). */
export function pickQuestSiteForTags(
  atlas: WorldAtlasState | null | undefined,
  tags: string[],
  preferRegionId?: string
): WorldOutlineSettlement | null {
  const list = settlementsFromAtlas(atlas);
  if (!list.length) return null;
  const scored = list
    .map((s) => {
      let score = tags.length === 0 ? 1 : 0;
      for (const t of tags) {
        if (questFitsSettlement(t, s)) score += 2;
      }
      if (preferRegionId && s.regionId === preferRegionId) score += 1;
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.s ?? null;
}

export function formatWorldMapAuthorityBlock(state: GameState): string {
  const atlas = state.worldAtlas;
  if (!atlas) {
    return [
      'WORLD MAP AUTHORITY: closed / local story — do not invent continents, cities, or shorelines.',
      'Local rooms and interiors only.',
    ].join('\n');
  }
  const settlements = settlementsFromAtlas(atlas);
  const revealedRegionIds = new Set(
    atlas.regions.filter((r) => r.revealed).map((r) => r.id)
  );
  const lines = settlements.map((s) => {
    const fog = revealedRegionIds.has(s.regionId) ? '' : ' [fogged region]';
    return `- ${s.name} (${s.kind}, biome:${s.biome}, region:${s.regionId})${fog}: ${s.blurb}`;
  });
  return [
    'WORLD MAP AUTHORITY (PREMADE — BINDING):',
    `Outline: ${atlas.outlineName} — ${atlas.description}`,
    'Towns, cities, shores, and named settlements are FIXED below. Narrate richly inside them; do NOT invent new cities, towns, coasts, or continents.',
    'You may add alleys, rooms, stalls, and unnamed local detail under a listed settlement.',
    'Quest sites must fit biome (no farming in dead desert / ash caldera).',
    'Dungeons open only at allowsDungeon sites or seeded dungeon hubs — generate interiors on enter; close when cleared.',
    ...lines.slice(0, 40),
  ].join('\n');
}

/** Attach settlements from outline definition onto atlas state. */
export function attachSettlementsToAtlas(
  atlas: WorldAtlasState,
  outline: WorldOutlineDef
): WorldAtlasState {
  return {
    ...atlas,
    settlements: (outline.settlements ?? []).map((s) => ({ ...s })),
  };
}
