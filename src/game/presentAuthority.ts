/**
 * Lock C — location-bound present[] trim on real travel.
 * NPCs do not teleport when the player leaves; companions persist. Opening pins do not.
 */

import type { GameState } from './types';
import { trimAnonymousRolesOnLocationChange } from './closedScenePerson';
import { npcNamesAt, stampNpcLocationsOnMove } from './npcRecords';
import { ensurePlaceCard } from './outdoorHubs';

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
  // 27f — rebuild the scene cast from the new place: companions plus NPC records located there. No carry-forward.
  const companionNames = [state.companion, ...(state.companions ?? []).map((c) => c.name)].filter(
    (n): n is string => !!n
  );
  const out: string[] = [];
  for (const n of [...companionNames, ...npcNamesAt(state, toLocation)]) {
    if (!out.some((o) => o.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out;
}

export function applyPresentTrimOnTravel(
  input: GameState,
  fromLocation: string,
  toLocation: string
): GameState {
  const state = locationsEquivalentForPresence(fromLocation, toLocation)
    ? input
    : ensurePlaceCard(
      ensurePlaceCard(stampNpcLocationsOnMove(input, fromLocation, toLocation), fromLocation),
      toLocation,
      fromLocation
    );
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
