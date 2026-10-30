/**
 * T10SM1 — sole owner of scene presence + NPC exit flags.
 * Seat / unseat / exit keep NpcMemory.present and sceneFacts.present in agreement.
 * Lock C travel trim stays here (location-bound cast).
 */

import type { CrowdPresence, GameState, NpcMemory, SceneFacts } from './types.ts';
import { isSystemWindowLabel } from './chromeAuthority.ts';
import { npcNamesAt, stampNpcLocationsOnMove } from './npcRecords.ts';
import { ensurePlaceCard } from './outdoorHubs.ts';
import { resolvePlace } from './places.ts';
import { placeScale } from './placeAuthority.ts';

export type PresenceExitReason = NonNullable<NpcMemory['exitReason']>;

export function emptyPresenceFacts(turn = 0): SceneFacts {
  return {
    crowd: 'unknown',
    noise: 'unknown',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: turn,
  };
}

function baseFacts(state: GameState | { sceneFacts?: SceneFacts; turn?: number }): SceneFacts {
  return state.sceneFacts ?? emptyPresenceFacts(state.turn ?? 0);
}

/** Inline of closedScenePerson.trim — kept here to avoid presentAuthority ↔ closedScenePerson cycles. */
function rolesAfterTravel(state: GameState, sameLocation: boolean): string[] {
  if (sameLocation) return state.sceneFacts?.anonymousRoles ?? [];
  return [];
}

/** Minimal travel tension (avoid importing sceneFacts → crowdAuthority cycle). */
function travelTension(
  state: Pick<GameState, 'activeEncounter'>,
  current: SceneFacts['tension']
): SceneFacts['tension'] {
  const enc = state.activeEncounter;
  if (enc && !(typeof enc.hp === 'number' && enc.hp <= 0)) return 'combat';
  return current === 'combat' ? 'unknown' : current;
}

function nameKey(n: string): string {
  return (n ?? '').trim().toLowerCase();
}

function samePerson(a: string, b: string): boolean {
  const x = nameKey(a);
  const y = nameKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const x0 = x.split(/\s+/)[0] ?? '';
  const y0 = y.split(/\s+/)[0] ?? '';
  return (!!x0 && (y.includes(x0) || x.includes(y0))) || (!!y0 && x.includes(y0));
}

function memoryMatchesRef(m: NpcMemory, ref: string): boolean {
  if (samePerson(m.npcName, ref) || samePerson(m.npcId, ref)) return true;
  return (m.aliases ?? []).some((a) => samePerson(a, ref));
}

function crowdFromCount(count: number): CrowdPresence {
  if (count <= 0) return 'none';
  if (count <= 3) return 'sparse';
  return 'present';
}

/**
 * Sole SceneFacts patch for guarded presence fields.
 * Explicit `present`/`crowd`/`anonymousRoles`/`leftBehind` so the AST ratchet sees them here only.
 */
export function presenceFactsPatch(
  prev: SceneFacts | undefined,
  patch: Partial<SceneFacts>,
  turn?: number
): SceneFacts {
  const base = prev ?? emptyPresenceFacts(turn ?? prev?.updatedTurn ?? 0);
  const present = patch.present !== undefined ? patch.present : base.present;
  const crowd = patch.crowd !== undefined ? patch.crowd : base.crowd;
  const anonymousRoles =
    patch.anonymousRoles !== undefined ? patch.anonymousRoles : base.anonymousRoles;
  const leftBehind = patch.leftBehind !== undefined ? patch.leftBehind : base.leftBehind;
  return {
    ...base,
    ...patch,
    present,
    crowd,
    anonymousRoles,
    leftBehind,
  };
}

/** Apply a presence SceneFacts patch onto GameState. */
export function applyPresenceFacts(state: GameState, patch: Partial<SceneFacts>): GameState {
  const next = {
    ...state,
    sceneFacts: presenceFactsPatch(state.sceneFacts, patch, state.turn ?? 0),
  };
  // T10Q5 — whenever present[] is written, mirror NpcMemory.present so orphan present:true
  // cannot reopen peopleHere / reaction slots after crowd-empty or travel trim cleared the list.
  if (patch.present !== undefined) {
    const mems = syncMemoriesToPresentList(next, patch.present ?? []);
    if (mems !== next.npcMemories) return { ...next, npcMemories: mems };
  }
  return next;
}

/** NpcMemory.present flag — only written here. */
export function withMemoryPresentFlag(m: NpcMemory, present: boolean): NpcMemory {
  return { ...m, present };
}

/** NpcMemory exit flags — only written here (shouldExit / exitReason / present:false). */
export function withMemoryExitFlags(
  m: NpcMemory,
  reason: PresenceExitReason,
  turn?: number
): NpcMemory {
  return {
    ...m,
    shouldExit: true,
    exitReason: reason,
    present: false,
    ...(turn !== undefined ? { lastSeenTurn: turn } : {}),
  };
}

function syncMemoriesToPresentList(state: GameState, present: string[]): NpcMemory[] | undefined {
  const mems = state.npcMemories;
  if (!mems?.length) return mems;
  let changed = false;
  const next = mems.map((m) => {
    const here = present.some((p) => memoryMatchesRef(m, p));
    if (!!m.present === here) return m;
    changed = true;
    return withMemoryPresentFlag(m, here);
  });
  return changed ? next : mems;
}

/** Seat one or more names into the scene; mark matching memories present. */
export function seat(state: GameState, npcRefOrNames: string | string[]): GameState {
  const names = (Array.isArray(npcRefOrNames) ? npcRefOrNames : [npcRefOrNames])
    .map((n) => (n ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!names.length) return state;
  const base = baseFacts(state);
  const present = [...(base.present ?? [])];
  for (const n of names) {
    if (!present.some((p) => samePerson(p, n))) present.push(n);
  }
  const crowd =
    base.crowd === 'none' || base.crowd === 'unknown'
      ? crowdFromCount(present.length)
      : base.crowd;
  const crowdCount =
    typeof base.crowdCount === 'number'
      ? Math.max(base.crowdCount, present.length)
      : base.crowdCount;
  const next = applyPresenceFacts(state, {
    present,
    crowd,
    crowdCount,
    updatedTurn: state.turn ?? base.updatedTurn,
  });
  // T10RC6fix2 — seat writes the place fact readers already require for "here"
  // (npcPlacedElsewhere / presentNpcNames). One owner: present[] alone never beats an
  // elsewhere stamp; the writer stamps location to currentLocation when seating.
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const hereKey = here.toLowerCase();
  const flagged = syncMemoriesToPresentList(next, present) ?? next.npcMemories ?? [];
  let changed = flagged !== next.npcMemories;
  const mems = flagged.map((m) => {
    if (!present.some((p) => memoryMatchesRef(m, p))) return m;
    if (!here || (m.location ?? '').replace(/\s+/g, ' ').trim().toLowerCase() === hereKey) return m;
    changed = true;
    return { ...m, location: here };
  });
  return changed ? { ...next, npcMemories: mems } : next;
}

/**
 * Remove a name from the scene. Engine events only for reason 'engine'.
 * Does not set shouldExit (use exitNpc for that).
 */
export function unseat(
  state: GameState,
  name: string,
  _reason: 'engine' | 'harvest' | 'travel' | 'repair' | string = 'engine'
): GameState {
  void _reason;
  const base = baseFacts(state);
  const present = (base.present ?? []).filter((p) => !samePerson(p, name));
  if (present.length === (base.present ?? []).length) return state;
  const next = applyPresenceFacts(state, {
    present,
    crowdCount:
      typeof base.crowdCount === 'number' ? Math.min(base.crowdCount, present.length) : base.crowdCount,
    crowd: present.length === 0 ? 'none' : base.crowd === 'none' ? crowdFromCount(present.length) : base.crowd,
    updatedTurn: state.turn ?? base.updatedTurn,
  });
  const mems = (next.npcMemories ?? []).map((m) =>
    memoryMatchesRef(m, name) ? withMemoryPresentFlag(m, false) : m
  );
  return { ...next, npcMemories: mems };
}

/**
 * ONLY place that sets shouldExit/exitReason/present:false on memory AND removes
 * the name from sceneFacts.present (crowd stays consistent).
 */
export function exitNpc(
  state: GameState,
  npcRef: string,
  reason: PresenceExitReason
): GameState {
  const turn = state.turn ?? 0;
  const mems = (state.npcMemories ?? []).map((m) => {
    if (!memoryMatchesRef(m, npcRef) || m.shouldExit) return m;
    return withMemoryExitFlags(m, reason, turn);
  });
  const base = baseFacts(state);
  const present = (base.present ?? []).filter((p) => !samePerson(p, npcRef));
  const next = applyPresenceFacts(
    { ...state, npcMemories: mems },
    {
      present,
      crowd:
        present.length === 0
          ? 'none'
          : base.crowd === 'none'
            ? crowdFromCount(present.length)
            : base.crowd,
      crowdCount:
        typeof base.crowdCount === 'number'
          ? Math.min(base.crowdCount, Math.max(present.length, 0))
          : base.crowdCount,
      updatedTurn: turn,
    }
  );
  return next;
}

/** Replace the whole present list (travel rebuild, harvest sync, vignette cast). Syncs memories. */
export function setPresentList(state: GameState, present: string[]): GameState {
  const next = applyPresenceFacts(state, {
    present,
    updatedTurn: state.turn ?? 0,
  });
  const mems = syncMemoriesToPresentList(next, present);
  return mems === next.npcMemories ? next : { ...next, npcMemories: mems };
}

export function setCrowd(
  state: GameState,
  crowd: CrowdPresence,
  crowdCount?: number | undefined
): GameState {
  return applyPresenceFacts(state, {
    crowd,
    crowdCount,
    updatedTurn: state.turn ?? 0,
  });
}

export function setAnonymousRoles(state: GameState, anonymousRoles: string[]): GameState {
  return applyPresenceFacts(state, {
    anonymousRoles,
    updatedTurn: state.turn ?? 0,
  });
}

export function clearScene(
  state: GameState,
  opts?: { lastBeat?: string; keepProps?: boolean; crowd?: CrowdPresence }
): GameState {
  const base = baseFacts(state);
  return applyPresenceFacts(state, {
    present: [],
    crowd: opts?.crowd ?? 'none',
    crowdCount: undefined,
    lastBeat: opts?.lastBeat ?? base.lastBeat,
    props: opts?.keepProps === false ? [] : base.props,
    updatedTurn: state.turn ?? 0,
  });
}

/** Drop everyone marked shouldExit from the present list (memory flags already set). */
export function applyExitedToPresent(state: GameState): GameState {
  const present = state.sceneFacts?.present;
  if (!present?.length) return state;
  const next = present.filter((name) => {
    const m = (state.npcMemories ?? []).find((row) => memoryMatchesRef(row, name));
    return !m?.shouldExit;
  });
  if (next.length === present.length) return state;
  return setPresentList(state, next);
}

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
    sceneFacts: presenceFactsPatch(facts, { props: [...carried, ...arrived], propsPlace: toLocation }),
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
  const nextRoles = rolesAfterTravel(state, sameLoc);
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
          tension: travelTension(state, 'unknown'),
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
  return applyPresenceFacts(state, {
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
  });
}
