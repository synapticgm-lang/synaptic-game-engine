/**
 * q50-MAP2 — one registration entry and one exits reader for playable places.
 * No atlas row, no biome/kind invent, no discoveredLocations write, no prose parsing.
 */
import type { GameState, PlaceExitRow, PlaceRecord } from './types';
import { dungeonRoomPlace, placeIdFromName, resolvePlace } from './places';
import { hubTravelTargets, hubsForBibleId, isDungeonHub, matchHub } from './outdoorHubs';
import { isRoadLabel, isTripHere } from './travelJourney';
import { placeScale } from './placeAuthority';

export type WriterNewPlace = { name?: string; kind?: string; exitsTo?: string[] };

function tidy(name: string | undefined | null): string {
  return (name ?? '').replace(/\s+/g, ' ').trim();
}

/** Parent from stored / opening-card place data / from-hub — never a label substring. */
function parentHubOf(state: GameState, raw: string, from?: string): string {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const existing = resolvePlace(state.places, raw);
  const stored = tidy(existing?.parentHub);
  if (stored) return matchHub(hubs, stored)?.name ?? stored;
  const card = state.openingEstablishment?.card;
  const cardPlace = tidy(card?.place).toLowerCase();
  const rawKey = raw.toLowerCase();
  if (card?.parentHub && cardPlace && cardPlace === rawKey) return tidy(card.parentHub);
  // Opening HERE may drift from card.place; card.parentHub or card.place-as-hub is still the hub.
  if (!matchHub(hubs, raw)) {
    const here = tidy(state.currentLocation).toLowerCase();
    const opening = tidy(state.circling?.openingPlace).toLowerCase();
    const atOpen =
      here === rawKey
      && (!state.circling?.prevPlace || (!!opening && (opening === rawKey || opening === here)));
    if (atOpen) {
      if (card?.parentHub) return tidy(card.parentHub);
      const cardHub = matchHub(hubs, card?.place);
      if (cardHub) return cardHub.name;
    }
  }
  return matchHub(hubs, from)?.name ?? '';
}

function sourceId(state: GameState, label: string, explicit?: string): string {
  const given = tidy(explicit);
  if (given) return given;
  const key = tidy(label).toLowerCase();
  const sheet = state.locationSheet?.exits ?? [];
  for (let i = 0; i < sheet.length; i++) {
    const ex = sheet[i]!;
    if (tidy(ex.label).toLowerCase() === key && tidy(ex.id)) return tidy(ex.id);
  }
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), label);
  if (hub?.id) return hub.id;
  const place = resolvePlace(state.places, label);
  if (place?.id && tidy(place.name).toLowerCase() === key) return place.id;
  return '';
}

function pushExit(out: PlaceExitRow[], seen: Set<string>, state: GameState, label: string, explicit?: string) {
  const e = tidy(label);
  const key = e.toLowerCase();
  if (!e || seen.has(key)) return;
  seen.add(key);
  const id = sourceId(state, e, explicit);
  out.push({ id: id || e, label: e });
}

function labelsToRows(state: GameState, labels: string[]): PlaceExitRow[] {
  const out: PlaceExitRow[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < labels.length; i++) pushExit(out, seen, state, labels[i] ?? '');
  return out;
}

/** Sheet exits for this non-hub place. Null when the sheet is for somewhere else or has none. */
function sheetExitRows(state: GameState, raw: string): PlaceExitRow[] | null {
  const sheet = state.locationSheet;
  const exits = sheet?.exits ?? [];
  if (!exits.length) return null;
  const sheetName = tidy(sheet?.name).toLowerCase();
  if (sheetName && sheetName !== raw.toLowerCase()) return null;
  const out: PlaceExitRow[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < exits.length; i++) {
    const ex = exits[i]!;
    pushExit(out, seen, state, ex.label, ex.id);
  }
  return out.length ? out : null;
}

/**
 * Exits ensurePlaceOnMap would write, without writing.
 * Hub → hub travel targets. Non-hub with a location sheet → that sheet. Else the hub-graph seed.
 */
function seedExitRows(state: GameState, raw: string, from?: string): PlaceExitRow[] {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(hubs, raw);
  const hubName = hub?.name ?? raw;
  const existing = resolvePlace(state.places, hubName) ?? resolvePlace(state.places, raw);
  if (existing?.closed || existing?.arcStatus === 'closed') return [];
  const parentHub = hub ? '' : parentHubOf(state, raw, from);
  const parentHubRow = matchHub(hubs, parentHub);
  const indoorLocal = !hub && placeScale(raw) === 'indoor';
  const sealed = indoorLocal && (isDungeonHub(parentHubRow ?? parentHub) || !parentHub);
  if (sealed) return [];
  const out: PlaceExitRow[] = [];
  const seen = new Set<string>();
  if (hub) {
    const names = hubTravelTargets({ ...state, currentLocation: hub.name });
    for (let i = 0; i < names.length; i++) {
      const n = names[i] ?? '';
      if (n.toLowerCase() === hubName.toLowerCase() || n.toLowerCase() === raw.toLowerCase()) continue;
      pushExit(out, seen, state, n);
    }
    return out.slice(0, 5);
  }
  const sheet = sheetExitRows(state, raw);
  if (sheet) return sheet.slice(0, 5);
  if (indoorLocal) {
    if (
      parentHub
      && parentHub.toLowerCase() !== hubName.toLowerCase()
      && parentHub.toLowerCase() !== raw.toLowerCase()
    ) {
      pushExit(out, seen, state, parentHub);
    }
    return out.slice(0, 5);
  }
  const exitSource = parentHub || hubName;
  const seed = [parentHub, ...hubTravelTargets({ ...state, currentLocation: exitSource })];
  for (let i = 0; i < seed.length; i++) {
    const n = seed[i] ?? '';
    if (n.toLowerCase() === hubName.toLowerCase() || n.toLowerCase() === raw.toLowerCase()) continue;
    pushExit(out, seen, state, n);
  }
  return out.slice(0, 5);
}

/** Exit rows for HERE. A missing record is read through the same seed ensurePlaceOnMap writes. */
export function placeExitRows(state: GameState, name?: string | null): PlaceExitRow[] {
  const raw = tidy(name ?? state.currentLocation);
  if (!raw) return [];
  const room = dungeonRoomPlace(state, raw);
  const hubs = hubsForBibleId(state.campaignBibleId);
  const place =
    resolvePlace(state.places, raw)
    ?? (room ? resolvePlace(state.places, room) : null)
    ?? resolvePlace(state.places, matchHub(hubs, raw)?.name ?? '');
  if (place) {
    if (place.closed || place.arcStatus === 'closed') return [];
    const stored = place.exits ?? [];
    if (stored.length === 0) {
      if (place.cardBuiltTurn != null) return [];
      const hub = matchHub(hubs, place.name) ?? matchHub(hubs, raw);
      return hub ? labelsToRows(state, hubTravelTargets({ ...state, currentLocation: hub.name })) : [];
    }
    return labelsToRows(state, stored);
  }
  if (room || isRoadLabel(raw) || isTripHere(state, raw)) return [];
  return seedExitRows(state, raw);
}

/** Exit labels. Closed / empty intentional card → []. */
export function placeExits(state: GameState, name?: string | null): string[] {
  return placeExitRows(state, name).map((row) => row.label);
}

/** Sole registration entry. No-op when closed or exits already filled. */
export function ensurePlaceOnMap(state: GameState, name?: string | null, from?: string | null): GameState {
  const raw = tidy(name ?? state.currentLocation);
  if (!raw || isRoadLabel(raw) || isTripHere(state, raw)) return state;
  if (dungeonRoomPlace(state, raw)) return state;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(hubs, raw);
  const hubName = hub?.name ?? raw;
  const existing = resolvePlace(state.places, hubName) ?? resolvePlace(state.places, raw);
  if (existing?.closed || existing?.arcStatus === 'closed') return state;
  if (existing && (existing.exits?.length ?? 0) > 0) return state;

  const parentHub = hub ? '' : parentHubOf(state, raw, from ?? undefined);
  const parentHubRow = matchHub(hubs, parentHub);
  const indoorLocal = !hub && placeScale(raw) === 'indoor';
  const sealed = indoorLocal && (isDungeonHub(parentHubRow ?? parentHub) || !parentHub);
  const exits = seedExitRows(state, raw, from ?? undefined).map((row) => row.label);
  const closed = sealed;
  if (existing) {
    const patched: PlaceRecord = {
      ...existing,
      exits,
      ...(closed ? { closed: true, arcStatus: 'closed' as const } : {}),
      cardBuiltTurn: state.turn ?? 0,
      parentHub: hub ? existing.parentHub : existing.parentHub || parentHub || undefined,
      aliases: Array.from(new Set([...(existing.aliases ?? []), hubName, raw])).slice(0, 12),
    };
    return {
      ...state,
      places: (state.places ?? []).map((p) => (p.id === existing.id ? patched : p)),
    };
  }
  const row: PlaceRecord = {
    id: placeIdFromName(hubName),
    name: hubName,
    aliases: Array.from(new Set([hubName, raw])).slice(0, 12),
    mapScale: 'street',
    arcStatus: closed ? 'closed' : 'open',
    ...(closed ? { closed: true } : {}),
    exits,
    cardBuiltTurn: state.turn ?? 0,
    parentHub: hub ? undefined : parentHub || undefined,
  };
  return { ...state, places: [...(state.places ?? []), row] };
}

/** Validate exitsTo against the hub graph; register through ensurePlaceOnMap. */
export function applyWriterNewPlaces(
  state: GameState,
  newPlaces: WriterNewPlace[] | null | undefined
): GameState {
  if (!newPlaces?.length) return state;
  const hubs = hubsForBibleId(state.campaignBibleId);
  let next = state;
  for (let i = 0; i < newPlaces.length; i++) {
    const row = newPlaces[i]!;
    const placeName = tidy(row.name);
    if (placeName.length < 3) continue;
    const closed =
      (row.kind ?? '').toLowerCase() === 'closed' || (row.kind ?? '').toLowerCase() === 'sealed';
    if (closed) {
      if (resolvePlace(next.places, placeName)) continue;
      const parentHub = parentHubOf(next, placeName, next.currentLocation);
      next = {
        ...next,
        places: [
          ...(next.places ?? []),
          {
            id: placeIdFromName(placeName),
            name: placeName,
            aliases: [placeName],
            mapScale: 'street',
            arcStatus: 'closed',
            closed: true,
            exits: [],
            cardBuiltTurn: next.turn ?? 0,
            parentHub: parentHub || undefined,
          },
        ],
      };
      continue;
    }
    const validated: string[] = [];
    const seen = new Set<string>();
    const want = row.exitsTo ?? [];
    for (let j = 0; j < want.length; j++) {
      const e = tidy(want[j]);
      const key = e.toLowerCase();
      if (!e || seen.has(key)) continue;
      const asHub = matchHub(hubs, e);
      const asPlace = resolvePlace(next.places, e);
      if (!asHub && !asPlace) continue;
      seen.add(key);
      validated.push(asHub?.name ?? asPlace?.name ?? e);
    }
    if (row.exitsTo && row.exitsTo.length > 0 && validated.length === 0) continue;
    next = ensurePlaceOnMap(next, placeName, next.currentLocation);
    if (!validated.length) continue;
    const place = resolvePlace(next.places, placeName);
    if (!place || place.closed || place.arcStatus === 'closed') continue;
    next = {
      ...next,
      places: (next.places ?? []).map((p) =>
        p.id === place.id ? { ...p, exits: validated.slice(0, 5) } : p
      ),
    };
  }
  return next;
}

/** Structured newPlaces from a writer JSON body (never from prose). */
export function newPlacesFromWriterPayload(raw: unknown): WriterNewPlace[] | undefined {
  if (raw == null) return undefined;
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t.startsWith('{')) return undefined;
    try {
      obj = JSON.parse(t);
    } catch {
      return undefined;
    }
  }
  if (!obj || typeof obj !== 'object') return undefined;
  const places = (obj as { newPlaces?: unknown }).newPlaces;
  return Array.isArray(places) ? (places as WriterNewPlace[]) : undefined;
}
