/**
 * Lock C — location-bound present[] trim on real travel.
 * NPCs do not teleport when the player leaves; companions persist. Opening pins do not.
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
  const keepLower = new Set<string>();
  if (state.companion) keepLower.add(state.companion.toLowerCase());
  for (const c of state.companions ?? []) {
    if (c.name) keepLower.add(c.name.toLowerCase());
  }
  // Opening pins stay in the opening room only — leave must not restore that occupancy.

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
  const dropped = sameLoc
    ? (state.sceneFacts?.leftBehind ?? [])
    : prev.filter((p) => !trimmed.some((t) => t.toLowerCase() === p.toLowerCase()));
  // 08d — leaving the scene clears corpse occupancy + parked drought for the old room
  const clearCorpse = !sameLoc;
  const presentSame = trimmed.length === prev.length && trimmed.every((p, i) => p === prev[i]);
  const rolesSame = nextRoles.length === prevRoles.length && nextRoles.every((r, i) => r === prevRoles[i]);
  const behindSame =
    (state.sceneFacts?.leftBehind ?? []).length === dropped.length
    && dropped.every((p, i) => p === (state.sceneFacts?.leftBehind ?? [])[i]);
  const killSame = !clearCorpse || !state.sceneFacts?.lastKill;
  const pendingSame = !clearCorpse || !state.sceneFacts?.pendingEncounter;
  if (presentSame && rolesSame && behindSame && killSame && pendingSame) {
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
      leftBehind: dropped,
      ...(clearCorpse
        ? {
            lastKill: undefined,
            pendingEncounter: undefined,
            pendingSpawnPreface: undefined,
          }
        : {}),
    },
  };
}
