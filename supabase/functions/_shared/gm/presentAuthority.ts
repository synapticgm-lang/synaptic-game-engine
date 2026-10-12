/**
 * Lock C — location-bound present[] trim on real travel.
 * NPCs do not teleport when the player leaves; companions persist. Opening pins do not.
 */

import type { GameState } from './types.ts';
import { trimAnonymousRolesOnLocationChange } from './closedScenePerson.ts';
import { isSystemWindowLabel } from './chromeAuthority.ts';
import { npcNamesAt, stampNpcLocationsOnMove } from './npcRecords.ts';
import { ensurePlaceCard } from './outdoorHubs.ts';
import { resolvePlace } from './places.ts';
import { placeScale } from './placeAuthority.ts';
import { engineTension } from './sceneFacts.ts';

/** 29z9j — objects belong to the place: park the old place's props on its record, load the new place's. */
function movePropsWithPlace(state: GameState, fromLocation: string, toLocation: string): GameState {
  const facts = state.sceneFacts;
  if (!facts) return state;
  const owner = facts.propsPlace || fromLocation;
  if (locationsEquivalentForPresence(owner, toLocation)) return state;
  const props = facts.props ?? [];
  const carried = props.filter(isSystemWindowLabel);
  const left = props.filter((p) => !isSystemWindowLabel(p));
  const from = resolvePlace(state.places, owner);
  const to = resolvePlace(state.places, toLocation);
  const places = (state.places ?? []).map((p) => (from && p.id === from.id ? { ...p, props: left } : p));
  const arrived = to && to.id !== from?.id ? to.props ?? [] : [];
  return {
    ...state,
    places,
    sceneFacts: { ...facts, props: [...carried, ...arrived], propsPlace: toLocation },
  };
}

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
    : movePropsWithPlace(
      ensurePlaceCard(
        ensurePlaceCard(stampNpcLocationsOnMove(input, fromLocation, toLocation), fromLocation),
        toLocation,
        fromLocation
      ),
      fromLocation,
      toLocation
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
  // A move leaves the old place's crowd, noise, mood and beat behind; the new place's scale comes from the place.
  const moodReset = sameLoc
    ? null
    : (() => {
        const scale = placeScale({ ...state, currentLocation: toLocation });
        return {
          crowd: 'unknown' as const,
          crowdCount: undefined,
          noise: 'unknown' as const,
          tension: engineTension(state, 'unknown'),
          lastBeat: '',
          indoor: scale ? scale === 'indoor' : undefined,
        };
      })();
  const moodSame =
    !moodReset
    || (state.sceneFacts?.crowd === moodReset.crowd
      && state.sceneFacts?.crowdCount === undefined
      && state.sceneFacts?.noise === moodReset.noise
      && state.sceneFacts?.tension === moodReset.tension
      && !state.sceneFacts?.lastBeat
      && state.sceneFacts?.indoor === moodReset.indoor);
  if (presentSame && rolesSame && behindSame && killSame && pendingSame && moodSame) {
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
      ...(moodReset ?? {}),
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
