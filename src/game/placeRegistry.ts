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

/** Article-stripped place key for Travel-HERE compares (OPEN9). */
export function barePlaceKey(name: string | undefined | null): string {
  return tidy(name).toLowerCase().replace(/^(?:the|a|an)\s+/, '');
}

/**
 * OPEN9 — true when Travel dest is the current place (aliases / articles / canon names).
 * Used at chip emission and when a stale Travel chip is picked.
 */
export function isTravelDestHere(state: GameState, dest: string | null | undefined): boolean {
  const d = tidy(dest);
  const here = tidy(state.currentLocation);
  if (!d || !here) return false;
  const dBare = barePlaceKey(d);
  const hereBare = barePlaceKey(here);
  if (dBare && hereBare && (dBare === hereBare || dBare.includes(hereBare) || hereBare.includes(dBare))) {
    return true;
  }
  const hereCanon = barePlaceKey(canonicalTravelDest(state, here) ?? here);
  const destCanon = barePlaceKey(canonicalTravelDest(state, d) ?? d);
  if (destCanon && hereCanon && destCanon === hereCanon) return true;
  if (destCanon && hereBare && destCanon === hereBare) return true;
  if (dBare && hereCanon && dBare === hereCanon) return true;
  // Place-record aliases for HERE.
  const place = resolvePlace(state.places, here) ?? resolvePlace(state.places, hereCanon || here);
  for (const a of place?.aliases ?? []) {
    if (barePlaceKey(a) === dBare || barePlaceKey(a) === destCanon) return true;
  }
  return false;
}

/** Quest/lead copy ("the village moot about the blight"), not an atmospheric HERE name. */
function isQuestPlaceDescription(t: string): boolean {
  return ` ${t.toLowerCase()} `.includes(' about ');
}

/**
 * TRAINLOOP4 B — one owner for Travel destination display names.
 * Hub / place registry first; then (description-shaped only) a shorter registry name
 * contained in quest/lead copy ("the village moot about the blight" → "Village Moot").
 * Never remaps atmospheric place names that merely contain a hub substring (West Wall).
 * Null when nothing in the registry matches — Travel callers must not invent a label.
 */
export function canonicalTravelDest(state: GameState, raw: string | null | undefined): string | null {
  const t = tidy(raw);
  if (!t) return null;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(hubs, t);
  if (hub?.name) return hub.name;
  const key = t.toLowerCase();
  const desc = isQuestPlaceDescription(t);
  const hit = { name: '', len: 0 };
  if (desc) {
    const consider = (name: string | undefined | null) => {
      const n = tidy(name);
      if (!n || n.length < 4) return;
      const nl = n.toLowerCase();
      if (nl === key) return;
      if (key.includes(nl) && nl.length > hit.len) {
        hit.name = n;
        hit.len = nl.length;
      }
    };
    for (let i = 0; i < hubs.length; i++) consider(hubs[i]!.name);
    for (const p of state.places ?? []) {
      if (p.closed || p.arcStatus === 'closed') continue;
      consider(p.name);
      for (const a of p.aliases ?? []) consider(a);
      // Hubless story exits (Village Moot off Overgrown Station) count as registry names.
      for (const ex of p.exits ?? []) consider(ex);
    }
    if (hit.len > 0) return hit.name;
  }
  const exact = resolvePlace(state.places, t);
  if (exact?.name) return exact.name;
  return null;
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

/** Hubless stories (28p): story-place rows already on the save are the travel graph. */
function storyPlaceExitLabels(state: GameState, raw: string, hubName: string): string[] {
  const hereKeys = new Set([raw.toLowerCase(), hubName.toLowerCase()]);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of state.places ?? []) {
    if (p.settlementKind !== 'story-place') continue;
    if (p.closed || p.arcStatus === 'closed') continue;
    const n = tidy(p.name);
    const key = n.toLowerCase();
    if (!n || hereKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

/**
 * Exits ensurePlaceOnMap would write, without writing.
 * Hub → hub travel targets. Non-hub with a location sheet → that sheet.
 * Hubless bible → story-place pool (+ way back). Else the hub-graph seed.
 * Open outdoor places never seed empty when any linked place exists.
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
  const notHere = (n: string) => {
    const key = n.toLowerCase();
    return !!n && key !== hubName.toLowerCase() && key !== raw.toLowerCase();
  };
  // Way back from travel / opening always links first when it is a real other place.
  const back = tidy(from);
  if (notHere(back)) pushExit(out, seen, state, back);
  if (hub) {
    const names = hubTravelTargets({ ...state, currentLocation: hub.name });
    for (let i = 0; i < names.length; i++) {
      const n = names[i] ?? '';
      if (!notHere(n)) continue;
      pushExit(out, seen, state, n);
    }
    return out.slice(0, 5);
  }
  const sheet = sheetExitRows(state, raw);
  if (sheet) {
    for (let i = 0; i < sheet.length; i++) {
      const row = sheet[i]!;
      if (!notHere(row.label)) continue;
      pushExit(out, seen, state, row.label, row.id);
    }
    if (out.length) return out.slice(0, 5);
  }
  if (indoorLocal) {
    if (notHere(parentHub)) pushExit(out, seen, state, parentHub);
    return out.slice(0, 5);
  }
  if (!hubs.length) {
    // 28p / MAP2: hubless worlds keep the story-place graph (Ford Camp → other Millstone places).
    const story = storyPlaceExitLabels(state, raw, hubName);
    for (let i = 0; i < story.length; i++) pushExit(out, seen, state, story[i] ?? '');
  } else {
    const exitSource = parentHub || hubName;
    const seed = [parentHub, ...hubTravelTargets({ ...state, currentLocation: exitSource })];
    for (let i = 0; i < seed.length; i++) {
      const n = seed[i] ?? '';
      if (!notHere(n)) continue;
      pushExit(out, seen, state, n);
    }
  }
  // Last resort: any other open registered place so registration never leaves a dead end.
  if (!out.length) {
    for (const p of state.places ?? []) {
      if (p.closed || p.arcStatus === 'closed') continue;
      const n = tidy(p.name);
      if (!notHere(n)) continue;
      pushExit(out, seen, state, n);
      if (out.length) break;
    }
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
      // cardBuiltTurn + empty exits is the sealed/built card contract (OCD pads rely on it).
      // Hubless holes are fixed at write time in ensurePlaceOnMap / seedExitRows — not by re-reading.
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

/** Close a lead-copy place row once it remaps to a real registry place (FORDCAMP trap). */
function closeRemappedDescriptionPlace(state: GameState, rawIn: string, canon: string): GameState {
  if (!rawIn || !canon || rawIn.toLowerCase() === canon.toLowerCase()) return state;
  let changed = false;
  const places = (state.places ?? []).map((p) => {
    if (tidy(p.name).toLowerCase() !== rawIn.toLowerCase()) return p;
    if (p.closed || p.arcStatus === 'closed') return p;
    changed = true;
    return { ...p, closed: true, arcStatus: 'closed' as const };
  });
  return changed ? { ...state, places } : state;
}

/** Sole registration entry. No-op when closed or exits already filled. */
export function ensurePlaceOnMap(state: GameState, name?: string | null, from?: string | null): GameState {
  const rawIn = tidy(name ?? state.currentLocation);
  if (!rawIn || isRoadLabel(rawIn) || isTripHere(state, rawIn)) return state;
  if (dungeonRoomPlace(state, rawIn)) return state;
  // TRAINLOOP4 B — description-shaped names only; atmospheric HERE keeps its own record.
  const raw = isQuestPlaceDescription(rawIn)
    ? (canonicalTravelDest(state, rawIn) ?? rawIn)
    : rawIn;
  let working = state;
  if (isQuestPlaceDescription(rawIn) && raw.toLowerCase() !== rawIn.toLowerCase()) {
    working = closeRemappedDescriptionPlace(working, rawIn, raw);
  }
  const hubs = hubsForBibleId(working.campaignBibleId);
  const hub = matchHub(hubs, raw);
  const hubName = hub?.name ?? raw;
  const existing = resolvePlace(working.places, hubName) ?? resolvePlace(working.places, raw);
  if (existing?.closed || existing?.arcStatus === 'closed') return working;
  if (existing && (existing.exits?.length ?? 0) > 0) return working;

  const parentHub = hub ? '' : parentHubOf(working, raw, from ?? undefined);
  const parentHubRow = matchHub(hubs, parentHub);
  const indoorLocal = !hub && placeScale(raw) === 'indoor';
  const sealed = indoorLocal && (isDungeonHub(parentHubRow ?? parentHub) || !parentHub);
  const exits = seedExitRows(working, raw, from ?? undefined).map((row) => row.label);
  const closed = sealed;
  // Never lock an open place as a built card with zero exits (Ford Camp hubless hole).
  const lockCard = closed || exits.length > 0;
  if (existing) {
    const patched: PlaceRecord = {
      ...existing,
      exits,
      ...(closed ? { closed: true, arcStatus: 'closed' as const } : {}),
      ...(lockCard ? { cardBuiltTurn: working.turn ?? 0 } : {}),
      parentHub: hub ? existing.parentHub : existing.parentHub || parentHub || undefined,
      aliases: Array.from(new Set([...(existing.aliases ?? []), hubName, raw])).slice(0, 12),
    };
    return {
      ...working,
      places: (working.places ?? []).map((p) => (p.id === existing.id ? patched : p)),
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
    ...(lockCard ? { cardBuiltTurn: working.turn ?? 0 } : {}),
    parentHub: hub ? undefined : parentHub || undefined,
  };
  return { ...working, places: [...(working.places ?? []), row] };
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
