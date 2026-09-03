/**
 * Site-wide camera / travel authority.
 * Location string + map + dungeon cannot snap outdoor → indoor (or room → room)
 * without a player travel/enter commit. Writer room-jumps snap back; real travel
 * prepends leave/reach (26r). All modes — not Summoned Pact only.
 */

import type { GameState, SceneFacts } from './types';
import { isExplorableDungeon, isInteriorMap } from './placeAuthority';
import { ensureTravelArrivalProse } from './outdoorHubs';

export type CameraScale = 'outdoor' | 'indoor';

export interface CameraLock {
  scale: CameraScale;
  label: string;
  roomId?: string;
  lockedTurn: number;
}

const TRAVEL_COMMIT =
  /\b(travel(?:\s+toward)?|return to|enter|go (?:inside|in|through|into)|walk(?:\s+\w+){0,4}\s+(?:through|into|inside)|step (?:inside|through|into)|leave|exit|flee|run away|head (?:inside|through|into|to)|open the door|through the (?:door|threshold)|into the (?:foyer|entry|hall|room))\b/i;

const OUTDOOR_CAMERA =
  /\b(mosaic|bombardment|under fire|open (?:air|street)|outdoors?|outside|cracked street|street tiles|sky overhead|rain on|under the sky)\b/i;

const INDOOR_ROOM =
  /\b(?:the\s+)?(?:entry|foyer|narthex|vestibule|interior floor|what the map indicates)\b/i;

const INDOOR_CAMERA =
  /\b(inside|indoors?|ceiling|you (?:are|stand) (?:now )?(?:in|inside) (?:the )?(?:entry|foyer|hall|chamber|room))\b/i;

export function playerCommittedTravel(input: string | undefined): boolean {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return TRAVEL_COMMIT.test(t);
}

/** Arrival snap only — not Leave / Walk away / Exit (those are not "You reach dest"). */
export function playerCommittedArrivalTravel(input: string | undefined): boolean {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return /^(?:travel\s+toward|return\s+to|enter\b|go (?:inside|in|through|into)|head (?:inside|through|into|to))\b/i.test(
    t
  );
}

export function detectCameraScale(text: string): CameraScale | null {
  if (!text) return null;
  if (OUTDOOR_CAMERA.test(text) && !INDOOR_ROOM.test(text)) return 'outdoor';
  if (INDOOR_ROOM.test(text) || INDOOR_CAMERA.test(text)) return 'indoor';
  if (OUTDOOR_CAMERA.test(text)) return 'outdoor';
  return null;
}

export function resolveCameraLock(state: Pick<GameState, 'sceneFacts'>): CameraLock | undefined {
  return state.sceneFacts?.cameraLock;
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
  narrative: string,
  turn: number,
  playerInput?: string,
  locationLabel?: string
): SceneFacts {
  const base: SceneFacts = prev
    ? { ...prev, updatedTurn: turn }
    : {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: turn,
      };

  const traveled = playerCommittedTravel(playerInput);
  if (base.cameraLock && !traveled) {
    return {
      ...base,
      indoor: base.cameraLock.scale === 'indoor',
    };
  }

  const detected = detectCameraScale(narrative);
  if (traveled && detected) {
    return {
      ...base,
      indoor: detected === 'indoor',
      cameraLock: {
        scale: detected,
        label: (locationLabel || base.cameraLock?.label || '').trim() || (detected === 'indoor' ? 'inside' : 'outside'),
        roomId: base.cameraLock?.roomId,
        lockedTurn: turn,
      },
    };
  }

  if (base.cameraLock) return base;
  if (!detected) return base;

  const label = (locationLabel || '').trim() || (detected === 'indoor' ? 'inside' : 'outside');
  return {
    ...base,
    indoor: detected === 'indoor',
    cameraLock: {
      scale: detected,
      label,
      lockedTurn: turn,
    },
  };
}

/**
 * If the writer / map authored an indoor floor plan while the camera is outdoor
 * and the player did not travel, snap map + indoor flag back. Keep currentLocation.
 */
export function enforceCameraOnState(state: GameState, playerInput?: string): GameState {
  const lock = resolveCameraLock(state);
  if (!lock || lock.scale !== 'outdoor') return state;
  if (playerCommittedTravel(playerInput)) return state;
  if (isExplorableDungeon(state.activeDungeon)) return state;

  let next = state;
  if (state.sceneFacts?.indoor) {
    next = {
      ...next,
      sceneFacts: { ...next.sceneFacts!, indoor: false },
    };
  }
  if (next.locationSheet?.mapScale === 'interior') {
    next = {
      ...next,
      locationSheet: { ...next.locationSheet, mapScale: 'street' },
    };
  }
  const dungeon = next.activeDungeon;
  if (dungeon && isInteriorMap(dungeon)) {
    next = { ...next, activeDungeon: null };
  }
  return next;
}

/**
 * Writer jumped rooms without a travel commit → snap invented indoor room nouns
 * back to the locked label. Real travel prepends leave/reach when prose stays put.
 */
export function enforceCameraOnProse(
  prose: string,
  state: GameState,
  playerInput?: string
): string {
  let next = prose ?? '';
  const lock = resolveCameraLock(state);
  const traveled = playerCommittedTravel(playerInput);
  const dest = (state.currentLocation ?? '').trim();
  const from = (state.previousLocationSheet?.name ?? '').trim();

  // Batch U — arrival prepend ONLY on real location change; use travel snap, not stale camera lock.
  // Batch 02g — Leave / Walk away / Exit must not invent "You reach <current dest>".
  if (traveled && dest && playerCommittedArrivalTravel(playerInput)) {
    if (from && from.toLowerCase() === dest.toLowerCase()) return next;
    return ensureTravelArrivalProse(next, dest, from || null);
  }

  const here = (lock?.label || dest || '').trim();
  if (!lock || lock.scale !== 'outdoor' || !here) return next;
  if (INDOOR_ROOM.test(next)) {
    next = next.replace(INDOOR_ROOM, here);
  }
  return next;
}

/** True when map/dungeon may author an interior floor plan. */
export function cameraAllowsInteriorMap(state: GameState, playerInput?: string): boolean {
  const lock = resolveCameraLock(state);
  if (!lock) return true;
  if (lock.scale === 'indoor') return true;
  return playerCommittedTravel(playerInput);
}

export function cameraPrefersStreetMap(state: GameState): boolean {
  const lock = resolveCameraLock(state);
  return lock?.scale === 'outdoor' && !isExplorableDungeon(state.activeDungeon);
}

/** Keep currentLocation honest — Entry/Foyer cannot replace an outdoor lock without travel. */
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
