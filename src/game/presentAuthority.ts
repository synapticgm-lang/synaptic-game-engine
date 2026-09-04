/**
 * Lock C — location-bound present[] trim on real travel.
 * NPCs do not teleport when the player leaves; companions and opening pins persist.
 */

import type { GameState } from './types';
import { trimAnonymousRolesOnLocationChange } from './closedScenePerson';

function thornferryClusterCore(s: string): boolean {
  return /\b(mill\s+landing|the ford|harbor quay)\b/i.test(s ?? '');
}

export function locationsEquivalentForPresence(a: string, b: string): boolean {
  const x = (a ?? '').trim().toLowerCase();
  const y = (b ?? '').trim().toLowerCase();
  if (!x || !y) return x === y;
  if (x === y) return true;
  return thornferryClusterCore(a) && thornferryClusterCore(b);
}

/** Drop location-bound NPCs when the player travels to a new place. */
export function trimPresentOnLocationChange(
  state: GameState,
  fromLocation: string,
  toLocation: string
): string[] {
  if (locationsEquivalentForPresence(fromLocation, toLocation)) {
    return state.sceneFacts?.present ?? [];
  }
  const present = state.sceneFacts?.present ?? [];
  const pinned = new Set(
    (state.openingEstablishment?.pinnedNpcNames ?? []).map((n) => n.toLowerCase())
  );
  const keepLower = new Set<string>();
  if (state.companion) keepLower.add(state.companion.toLowerCase());
  for (const c of state.companions ?? []) {
    if (c.name) keepLower.add(c.name.toLowerCase());
  }
  for (const p of pinned) keepLower.add(p);

  return present.filter((p) => keepLower.has(p.toLowerCase()));
}

export function applyPresentTrimOnTravel(
  state: GameState,
  fromLocation: string,
  toLocation: string
): GameState {
  const trimmed = trimPresentOnLocationChange(state, fromLocation, toLocation);
  const sameLoc = locationsEquivalentForPresence(fromLocation, toLocation);
  const nextRoles = trimAnonymousRolesOnLocationChange(state, sameLoc);
  const prev = state.sceneFacts?.present ?? [];
  const prevRoles = state.sceneFacts?.anonymousRoles ?? [];
  const presentSame = trimmed.length === prev.length && trimmed.every((p, i) => p === prev[i]);
  const rolesSame = nextRoles.length === prevRoles.length && nextRoles.every((r, i) => r === prevRoles[i]);
  if (presentSame && rolesSame) {
    return state;
  }
  const base = state.sceneFacts ?? {
    crowd: 'unknown' as const,
    noise: 'unknown' as const,
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn ?? 0,
  };
  return {
    ...state,
    sceneFacts: {
      ...base,
      present: trimmed,
      anonymousRoles: nextRoles,
    },
  };
}
