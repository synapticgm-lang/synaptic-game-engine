import type { GameState, LocationSheet, MapScale, MapTier, PlaceRecord } from './types.ts';
import { looksLikeGeographyInvent, isLegalMapPlace } from './worldMapAuthority.ts';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'place';
}

export function placeIdFromName(name: string): string {
  return `place_${slugify(name)}`;
}

export function ensurePlaces(state: GameState): PlaceRecord[] {
  return state.places ?? [];
}

/**
 * Upsert place from location sheet.
 * 29e: reject inventing new cities/towns/shores off the premade world map.
 */
export function upsertPlaceFromSheet(
  places: PlaceRecord[],
  sheet: LocationSheet | null | undefined,
  opts?: {
    dungeonRef?: string | null;
    loreName?: string;
    aliases?: string[];
    state?: GameState;
    allowInvent?: boolean;
  }
): PlaceRecord[] {
  const name = sheet?.name?.trim();
  if (!name) return places;
  const state = opts?.state;
  if (
    state?.worldAtlas?.settlements?.length &&
    !opts?.allowInvent &&
    looksLikeGeographyInvent(name) &&
    !isLegalMapPlace(state, name)
  ) {
    // Do not add invented geography to the registry
    return places;
  }
  const id = placeIdFromName(name);
  const existing = places.find((p) => p.id === id || p.name.toLowerCase() === name.toLowerCase());
  const next: PlaceRecord = {
    id: existing?.id ?? id,
    name,
    loreName: opts?.loreName ?? existing?.loreName,
    aliases: Array.from(
      new Set([...(existing?.aliases ?? []), ...(opts?.aliases ?? []), name].map((a) => a.trim()).filter(Boolean))
    ).slice(0, 12),
    dangerTier: sheet?.dangerTier ?? existing?.dangerTier,
    mapScale: sheet?.mapScale ?? existing?.mapScale ?? 'street',
    dungeonRef: opts?.dungeonRef ?? existing?.dungeonRef,
    arcSummary: existing?.arcSummary,
    arcStatus: existing?.arcStatus ?? 'open',
    lastVisitedTurn: existing?.lastVisitedTurn,
    biome: existing?.biome,
    settlementKind: existing?.settlementKind,
    regionId: existing?.regionId,
    mapCanonical: existing?.mapCanonical,
    allowsDungeon: existing?.allowsDungeon,
  };
  if (existing) {
    return places.map((p) => (p.id === existing.id ? { ...existing, ...next } : p));
  }
  return [...places, next];
}

export function touchPlaceVisit(
  places: PlaceRecord[],
  placeName: string | undefined,
  turn: number,
  state?: GameState
): PlaceRecord[] {
  if (!placeName?.trim()) return places;
  if (
    state?.worldAtlas?.settlements?.length &&
    looksLikeGeographyInvent(placeName) &&
    !isLegalMapPlace(state, placeName)
  ) {
    return places;
  }
  const id = placeIdFromName(placeName);
  const existing = places.find(
    (p) => p.id === id || p.name.toLowerCase() === placeName.toLowerCase() || p.aliases?.some((a) => a.toLowerCase() === placeName.toLowerCase())
  );
  if (!existing) {
    // Local alley/room detail OK; geography invent blocked above
    return [
      ...places,
      {
        id,
        name: placeName.trim(),
        mapScale: 'street' as MapScale,
        arcStatus: 'open',
        lastVisitedTurn: turn,
        aliases: [placeName.trim()],
        mapCanonical: false,
      },
    ];
  }
  return places.map((p) =>
    p.id === existing.id ? { ...p, lastVisitedTurn: turn, arcStatus: p.arcStatus ?? 'open' } : p
  );
}

/** Write a short arc summary when leaving a place (Pack 6). */
export function closePlaceArc(
  places: PlaceRecord[],
  leftName: string | undefined,
  summary: string,
  turn: number
): PlaceRecord[] {
  if (!leftName?.trim() || !summary.trim()) return places;
  const key = leftName.toLowerCase();
  return places.map((p) => {
    if (p.name.toLowerCase() !== key && !p.aliases?.some((a) => a.toLowerCase() === key)) return p;
    return {
      ...p,
      arcSummary: summary.trim().slice(0, 480),
      arcStatus: 'visited' as const,
      lastVisitedTurn: turn,
    };
  });
}

export function resolvePlace(
  places: PlaceRecord[] | undefined,
  refOrName: string | undefined
): PlaceRecord | null {
  if (!refOrName || !places?.length) return null;
  const key = refOrName.toLowerCase();
  return (
    places.find(
      (p) =>
        p.id === refOrName ||
        p.name.toLowerCase() === key ||
        p.aliases?.some((a) => a.toLowerCase() === key)
    ) ?? null
  );
}

export function formatPlacesForPrompt(places: PlaceRecord[] | undefined, currentName?: string): string {
  if (!places?.length) return '';
  const current = currentName ? resolvePlace(places, currentName) : null;
  const recent = [...places]
    .filter((p) => p.arcSummary || p.id === current?.id)
    .sort((a, b) => (b.lastVisitedTurn ?? 0) - (a.lastVisitedTurn ?? 0))
    .slice(0, 4);
  if (!recent.length) return '';
  return recent
    .map((p) => {
      const tier =
        p.dangerTier != null ? `dangerTier T${p.dangerTier}` : 'dangerTier none (street)';
      const arc = p.arcSummary ? ` | arc: ${p.arcSummary}` : '';
      return `- ${p.name}${p.loreName ? ` (${p.loreName})` : ''} [${p.mapScale ?? 'street'}, ${tier}]${p.dungeonRef ? ` dungeonRef=${p.dungeonRef}` : ''}${arc}`;
    })
    .join('\n');
}

export function sheetFromPlace(place: PlaceRecord, sheet?: LocationSheet | null): LocationSheet {
  return {
    name: place.name,
    dangerTier: place.dangerTier as MapTier | undefined,
    mapScale: place.mapScale,
    interactables: sheet?.interactables ?? [],
    exits: sheet?.exits ?? [],
    presentNpcIds: sheet?.presentNpcIds ?? [],
  };
}
