/** Camera / travel authority. HERE changes only via resolveNextLocation (29u). All modes. */
import type { GameState, SceneFacts } from './types';
import { isExplorableDungeon, isInteriorMap, placeScale, type PlaceScaleSource } from './placeAuthority';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { findSettlement } from './worldMapAuthority';
import { dungeonRoomPlace, resolvePlace } from './places';
export type CameraScale = 'outdoor' | 'indoor';
export interface CameraLock {
  scale: CameraScale;
  label: string;
  roomId?: string;
  lockedTurn: number;
}
const TRAVEL_COMMIT =
  /\b(travel(?:\s+(?:toward|to|into))?|return to|(?:go|head) back to|enter|go (?:inside|in|through|into|to)|walk(?:\s+\w+){0,4}\s+(?:through|into|inside|to)|step (?:inside|through|into)|leave(?:\s+the\s+scene)?|exit|flee|run away|head (?:inside|through|into|to|toward|for)|open the door|through the (?:door|threshold)|into the (?:foyer|entry|hall|room))\b/i;
const OUTDOOR_CAMERA =
  /\b(mosaic|bombardment|under fire|open (?:air|street)|outdoors?|outside|cracked street|street tiles|sky overhead|rain on|under the sky)\b/i;
const INDOOR_ROOM =
  /\b(?:the\s+)?(?:entry|foyer|narthex|vestibule|interior floor|what the map indicates)\b/i;
const INDOOR_CAMERA =
  /\b(inside|indoors?|ceiling|you (?:are|stand) (?:now )?(?:in|inside) (?:the )?(?:entry|foyer|hall|chamber|room))\b/i;
const ARRIVAL_TRAVEL =
  /^(?:travel\s+(?:toward|to)|return\s+to|(?:go|head|walk) back to|enter\b|go (?:inside|in|through|into)|head (?:inside|through|into|to|toward|for))\b/i;
export function playerCommittedTravel(input: string | undefined): boolean {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  return !!t && TRAVEL_COMMIT.test(t);
}
/** Arrival snap only — not Leave / Walk away / Exit. */
export function playerCommittedArrivalTravel(input: string | undefined): boolean {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  return !!t && ARRIVAL_TRAVEL.test(t);
}
export function detectCameraScale(text: string): CameraScale | null {
  if (!text) return null;
  if (OUTDOOR_CAMERA.test(text) && !INDOOR_ROOM.test(text)) return 'outdoor';
  if (INDOOR_ROOM.test(text) || INDOOR_CAMERA.test(text)) return 'indoor';
  if (OUTDOOR_CAMERA.test(text)) return 'outdoor';
  return null;
}
/** Place scale owns indoor/outdoor; stored lock fills gaps. */
export function resolveCameraLock(
  state: Pick<GameState, 'sceneFacts'> & PlaceScaleSource
): CameraLock | undefined {
  const lock = state.sceneFacts?.cameraLock;
  const scale = placeScale(state);
  if (!lock || !scale) return lock;
  const here = (state.currentLocation ?? '').trim();
  const moved = !!here && here.toLowerCase() !== (lock.label ?? '').trim().toLowerCase();
  if (lock.scale === scale && !moved) return lock;
  return { ...lock, scale, label: here || lock.label, roomId: moved ? undefined : lock.roomId };
}
export function formatCameraBindingLine(state: GameState): string | null {
  const lock = resolveCameraLock(state);
  if (!lock) {
    return 'CAMERA: not yet locked — first committed outdoor/indoor beat owns the camera. Do not jump rooms without a travel/enter.';
  }
  return `CAMERA (BINDING): ${lock.scale} at ${lock.label}. Do not snap to another room or indoor floor plan unless the player travels or enters.`;
}
export function harvestCameraIntoSceneFacts(
  prev: SceneFacts | undefined,
  _narrative: string,
  turn: number,
  playerInput?: string,
  locationLabel?: string,
  place?: PlaceScaleSource
): SceneFacts {
  const base: SceneFacts = prev
    ? { ...prev, updatedTurn: turn }
    : { crowd: 'unknown', noise: 'unknown', present: [], props: [], lastBeat: '', updatedTurn: turn };
  const label = (locationLabel ?? '').trim();
  const scale = placeScale(place ? { ...place, currentLocation: label || place.currentLocation } : label);
  const lock = base.cameraLock;
  const moved =
    playerCommittedTravel(playerInput)
    || (!!lock && !!label && label.toLowerCase() !== (lock.label ?? '').trim().toLowerCase());
  if (!scale) {
    if (lock && moved) {
      const { cameraLock: _left, indoor: _indoor, ...rest } = base;
      return rest;
    }
    return lock ? { ...base, indoor: lock.scale === 'indoor' } : base;
  }
  if (lock && lock.scale === scale && !moved) return { ...base, indoor: scale === 'indoor' };
  return {
    ...base,
    indoor: scale === 'indoor',
    cameraLock: {
      scale,
      label,
      roomId: moved ? undefined : lock?.roomId,
      lockedTurn: lock && lock.scale === scale && !moved ? lock.lockedTurn : turn,
    },
  };
}
/** Outdoor camera: snap invented indoor map/flag back. */
export function enforceCameraOnState(state: GameState, playerInput?: string): GameState {
  const lock = resolveCameraLock(state);
  if (!lock || lock.scale !== 'outdoor' || playerCommittedTravel(playerInput)) return state;
  if (isExplorableDungeon(state.activeDungeon)) return state;
  let next = state;
  if (state.sceneFacts?.indoor) next = { ...next, sceneFacts: { ...next.sceneFacts!, indoor: false } };
  if (next.locationSheet?.mapScale === 'interior') {
    next = { ...next, locationSheet: { ...next.locationSheet, mapScale: 'street' } };
  }
  if (next.activeDungeon && isInteriorMap(next.activeDungeon)) next = { ...next, activeDungeon: null };
  return next;
}
/** Outdoor lock: snap invented indoor room nouns in prose back to the lock. */
export function enforceCameraOnProse(
  prose: string,
  state: GameState,
  playerInput?: string,
  _hereAtTurnStart?: string | null
): string {
  let next = prose ?? '';
  const lock = resolveCameraLock(state);
  const dest = (state.currentLocation ?? '').trim();
  if (playerCommittedTravel(playerInput) && dest && playerCommittedArrivalTravel(playerInput)) return next;
  const here = (lock?.label || dest || '').trim();
  if (!lock || lock.scale !== 'outdoor' || !here) return next;
  if (INDOOR_ROOM.test(next)) next = next.replace(INDOOR_ROOM, here);
  return next;
}
export function cameraAllowsInteriorMap(state: GameState, playerInput?: string): boolean {
  const lock = resolveCameraLock(state);
  return !lock || lock.scale === 'indoor' || playerCommittedTravel(playerInput);
}
export function cameraPrefersStreetMap(state: GameState): boolean {
  return resolveCameraLock(state)?.scale === 'outdoor' && !isExplorableDungeon(state.activeDungeon);
}
/** Entry/Foyer cannot replace an outdoor lock without travel. */
export function honestLocationName(
  state: GameState,
  proposed: string | undefined,
  playerInput?: string
): string | undefined {
  const lock = resolveCameraLock(state);
  const here = (proposed ?? '').trim();
  if (!here) return proposed;
  if (!lock || lock.scale !== 'outdoor' || playerCommittedTravel(playerInput)) return here;
  if (INDOOR_ROOM.test(here)) return (state.currentLocation || lock.label).trim() || here;
  return here;
}
/** travelJourney.TravelCommit — local shape avoids an import cycle. */
export type LocationTravelCommit = {
  handled?: boolean;
  state: Pick<GameState, 'currentLocation'>;
} | null | undefined;
/** q50-MAP2 newPlaces row (never mined from prose). */
export type WriterDeclaredPlace = { name?: string; id?: string } | string;
/** q58-LOCSET: HERE only via travel commit, known place, or writer newPlaces. */
export function resolveNextLocation(
  state: GameState,
  opts: {
    travelCommit?: LocationTravelCommit;
    proposed?: string | null;
    writerNewPlaces?: readonly WriterDeclaredPlace[] | null;
  } = {}
): string {
  const travelHere =
    opts.travelCommit?.handled && opts.travelCommit.state.currentLocation
      ? opts.travelCommit.state.currentLocation.trim()
      : '';
  if (travelHere) return travelHere;
  const current = (state.currentLocation ?? '').trim();
  const proposed = (opts.proposed ?? '').trim();
  if (!proposed) return current;
  if (proposed.toLowerCase() === current.toLowerCase()) return current || proposed;
  const writerPlaces = opts.writerNewPlaces;
  if (writerPlaces?.length) {
    for (let i = 0; i < writerPlaces.length; i++) {
      const row = writerPlaces[i]!;
      const name = (typeof row === 'string' ? row : row.name ?? row.id ?? '').trim();
      if (name && name.toLowerCase() === proposed.toLowerCase()) return name;
    }
  }
  const known =
    resolvePlace(state.places, proposed)?.name
    || (dungeonRoomPlace(state, proposed) ? proposed : '')
    || matchHub(hubsForBibleId(state.campaignBibleId), proposed)?.name
    || findSettlement(state.worldAtlas, proposed)?.name
    || '';
  if (known) return known;
  const key = proposed.toLowerCase();
  const regions = state.worldAtlas?.regions ?? [];
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i]!;
    if (r.id === key || r.name.toLowerCase() === key) return r.name;
  }
  const nodes = state.activeDungeon?.nodes ?? [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    if (n.id.toLowerCase() === key || n.name.toLowerCase() === key) return n.name;
  }
  const discovered = state.discoveredLocations ?? [];
  for (let i = 0; i < discovered.length; i++) {
    const d = (discovered[i] ?? '').trim();
    if (d && d.toLowerCase() === key) return d;
  }
  return current;
}
