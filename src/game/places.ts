import type { GameState, LocationSheet, MapScale, PlaceRecord } from './types';
import { looksLikeGeographyInvent, isLegalMapPlace } from './worldMapAuthority';
import { placeIdFromName } from './placeUtils';
import { isRoadLabel } from './travelJourney';

// Re-export for backward compatibility
export { placeIdFromName };

const ROOM_DASH = /\s+[—–]\s+/;

/** A dungeon's place name: its title before any " — room" part. */
export function dungeonTitle(dungeonName: string | undefined | null): string {
  return (dungeonName ?? '').split(ROOM_DASH)[0]?.replace(/\s+/g, ' ').trim() ?? '';
}

/**
 * A room is not a place: HERE "Cathedral Undercroft — Stair Descent" stands in the place "Cathedral Undercroft".
 * Returns that place when the label's head is the active dungeon or a known place (the dungeon may already be
 * left when the room is read back as the travel origin), else null.
 */
export function dungeonRoomPlace(
  state: { activeDungeon?: { dungeonName?: string } | null; places?: PlaceRecord[] | null },
  name: string | undefined | null
): string | null {
  const parts = (name ?? '').replace(/\s+/g, ' ').trim().split(ROOM_DASH);
  const head = parts[0]?.trim().toLowerCase() ?? '';
  if (parts.length < 2 || !head || !parts[1]?.trim()) return null;
  const title = dungeonTitle(state.activeDungeon?.dungeonName);
  if (title && title.toLowerCase() === head) return title;
  const known = (state.places ?? []).find(
    (p) => p.name.toLowerCase() === head || p.aliases?.some((a) => a.toLowerCase() === head)
  );
  return known?.name ?? null;
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
  const state = opts?.state;
  const name = (state && dungeonRoomPlace(state, sheet?.name)) || sheet?.name?.trim();
  if (!name || isRoadLabel(name)) return places;
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
  if (state) placeName = dungeonRoomPlace(state, placeName) ?? placeName;
  if (!placeName?.trim() || isRoadLabel(placeName)) return places;
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

