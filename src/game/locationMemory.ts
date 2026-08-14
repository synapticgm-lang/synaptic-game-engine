import type { GameState, LocationSheet } from './types';
import { ensureLocationSheet } from './pendingTurn';

function cloneSheet(sheet: LocationSheet): LocationSheet {
  return {
    ...sheet,
    interactables: sheet.interactables.map((i) => ({ ...i })),
    exits: sheet.exits.map((e) => ({ ...e })),
    presentNpcIds: [...sheet.presentNpcIds],
  };
}

function samePlace(a: string | undefined, b: string | undefined): boolean {
  const x = (a ?? '').trim().toLowerCase();
  const y = (b ?? '').trim().toLowerCase();
  if (!x || !y) return false;
  return x === y;
}

/**
 * When the player leaves a place, stash the current sheet as previous,
 * then set / refresh the current sheet for the new place.
 */
export function advanceLocationMemory(
  state: GameState,
  nextLocationName: string | undefined
): Pick<GameState, 'locationSheet' | 'previousLocationSheet' | 'currentLocation'> {
  const nextName = (nextLocationName ?? '').trim();
  const current = state.locationSheet ?? ensureLocationSheet(state);
  const currentName = current.name || state.currentLocation || '';

  if (!nextName || samePlace(nextName, currentName)) {
    return {
      locationSheet: current.name ? current : { ...current, name: nextName || currentName || 'Unknown' },
      previousLocationSheet: state.previousLocationSheet ?? null,
      currentLocation: nextName || currentName || state.currentLocation,
    };
  }

  const previous = current.name ? cloneSheet(current) : state.previousLocationSheet ?? null;
  return {
    previousLocationSheet: previous,
    locationSheet: {
      name: nextName,
      climate: '',
      timeOfDay: '',
      interactables: [],
      exits: [],
      presentNpcIds: [],
    },
    currentLocation: nextName,
  };
}
