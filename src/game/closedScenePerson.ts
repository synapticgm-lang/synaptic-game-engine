/**
 * Closed-scene person (02p).
 * A common role (clerk, trader, …) may act or take a talk pad only when
 * this scene already has that occupancy. Invent ("the stranger clerk",
 * "clerk falls into step") is a fact-close — not a SNAPSHOT line.
 */

import type { GameState } from './types';
import { isCommonRoleNpc, isHubContactProperName } from './entityRegistry';
import { resolveHubArrival } from './hubEncounters';
import { isPyoaCharterClosed } from './pyoaBranchLedger';

const ROLE_ACTOR_VERBS =
  /(?:falls?\s+into\s+step|falls?\s+in\s+beside|keeps?\s+pace|takes?|says?|asks?|nods?|watches?|hands?|counts?|offers?|steps?|follows?|arrives?|waits?|bars?|greets?|looks\s+up|walks?)\b/i;

const GLUED_ROLE_COMPOUND =
  /\b(?:the\s+)?stranger\s+clerk\b|\b(?:the\s+)?clerk\s+stranger\b/i;

const TALK_ROLE_PAD =
  /\b(?:talk(?:\s+to)?|ask|help|meet|press|thank|offer)\b[\w\s']{0,28}\b(clerk|trader|merchant|vendor|innkeeper)\b/i;

const ROLE_IN_PROSE =
  /\b(clerk|trader|merchant|vendor|innkeeper)\b/gi;

function lastPlayerLine(state: GameState): string {
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.role === 'player') return log[i]?.content ?? '';
  }
  return '';
}

function normalizeRole(raw: string): string {
  return (raw ?? '').trim().replace(/^(the|a|an)\s+/i, '').toLowerCase();
}

export function listedAnonymousRoles(state: GameState): string[] {
  return (state.sceneFacts?.anonymousRoles ?? []).map(normalizeRole).filter(Boolean);
}

function presentMentionsRole(state: GameState, role: string): boolean {
  const tokens = [
    ...(state.sceneFacts?.present ?? []),
    ...(state.companions ?? []).map((c) => c.name),
    state.companion ?? '',
    ...(state.openingEstablishment?.pinnedNpcNames ?? []),
    state.activeEncounter?.name ?? '',
    state.sceneFacts?.pendingEncounter?.name ?? '',
    ...(state.sceneFacts?.openVignette?.cast ?? []),
  ];
  const want = normalizeRole(role);
  return tokens.some((t) => {
    const n = (t ?? '').trim();
    if (!n) return false;
    if (normalizeRole(n) === want) return true;
    if (isHubContactProperName(n) && new RegExp(`\\b${want}\\b`, 'i').test(n)) return true;
    return false;
  });
}

function hubContactAllowsRole(state: GameState, role: string): boolean {
  const resolved = resolveHubArrival(state, state.currentLocation);
  const contact = resolved?.beat.contactName ?? '';
  if (!contact) return false;
  const want = normalizeRole(role);
  return normalizeRole(contact) === want || new RegExp(`\\b${want}\\b`, 'i').test(contact);
}

/** Mill / inn / quay — Thornferry clerk sites. Chapel and open road are not. */
export function isThornferryClerkSite(location: string | undefined): boolean {
  return /\b(mill(?:\s+landing)?|the ford|harbor quay|inn|weighing cup)\b/i.test(location ?? '');
}

export function sceneHasRoleOccupancy(state: GameState, role: string): boolean {
  const want = normalizeRole(role);
  if (!want || !isCommonRoleNpc(want)) return false;
  if (listedAnonymousRoles(state).includes(want)) return true;
  if (presentMentionsRole(state, want)) return true;
  if (hubContactAllowsRole(state, want)) return true;
  return false;
}

export function sceneAllowsRoleIntroduction(
  state: GameState,
  role: string,
  playerInput?: string
): boolean {
  const want = normalizeRole(role);
  if (!want) return false;
  if (sceneHasRoleOccupancy(state, want)) return true;
  const player = (playerInput ?? lastPlayerLine(state)).toLowerCase();
  if (player && new RegExp(`\\b${want}\\b`, 'i').test(player)) return true;
  if (want === 'clerk' && isThornferryClerkSite(state.currentLocation)) return true;
  if (hubContactAllowsRole(state, want)) return true;
  return false;
}

function roleActorHits(text: string): string[] {
  const body = text ?? '';
  if (!body.trim()) return [];
  const found = new Set<string>();
  if (GLUED_ROLE_COMPOUND.test(body)) found.add('clerk');
  const re =
    /\b(?:the|a|an)\s+(?:\w+\s+){0,2}(clerk|trader|merchant|vendor|innkeeper)\b(?:'s)?\s+/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const after = body.slice(m.index + m[0].length, m.index + m[0].length + 28);
    if (ROLE_ACTOR_VERBS.test(after)) found.add(normalizeRole(m[1] ?? ''));
  }
  if (/\b(clerk|trader|merchant|vendor|innkeeper)\b[\w\s']{0,24}(?:falls?\s+into\s+step|falls?\s+in\s+beside|keeps?\s+pace\s+with you)/i.test(body)) {
    const ride = body.match(/\b(clerk|trader|merchant|vendor|innkeeper)\b/i);
    if (ride?.[1]) found.add(normalizeRole(ride[1]));
  }
  return [...found].filter(Boolean);
}

/**
 * Prose that puts a role on stage who is not in this scene.
 * Glued "stranger clerk" is always invent. Companion-join ("falls into step")
 * needs occupancy. First mill/hub intro is allowed.
 */
export function isInventedClosedScenePerson(
  state: GameState,
  text: string,
  playerInput?: string
): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  // Two roles glued is never a person who is here.
  if (GLUED_ROLE_COMPOUND.test(body)) return true;
  for (const role of roleActorHits(body)) {
    if (sceneAllowsRoleIntroduction(state, role, playerInput)) continue;
    return true;
  }
  return false;
}

/** Talk/Ask/Help a role who is not here — pad starve. */
export function isClosedScenePersonPad(choice: string, state: GameState): boolean {
  const label = (choice ?? '').trim();
  if (!label) return false;
  const talk = label.match(TALK_ROLE_PAD);
  if (!talk?.[1]) return false;
  const role = normalizeRole(talk[1]);
  if (role === 'clerk' && isPyoaCharterClosed(state) && !sceneHasRoleOccupancy(state, 'clerk')) {
    return true;
  }
  // Pads need occupancy. Location-legal first intro is writer-only, then harvest locks.
  return !sceneHasRoleOccupancy(state, role);
}

export function filterClosedScenePersonPads(pads: string[], state: GameState): string[] {
  return pads.filter((p) => !isClosedScenePersonPad(p, state));
}

/** Record roles that were legally on stage this beat. Dropped on real travel. */
export function harvestRoleOccupancy(
  state: GameState,
  prose: string,
  playerInput?: string
): GameState {
  const body = (prose ?? '').trim();
  if (!body) return state;
  const mentioned = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(ROLE_IN_PROSE.source, 'gi');
  while ((m = re.exec(body))) {
    const role = normalizeRole(m[1] ?? '');
    if (role && isCommonRoleNpc(role)) mentioned.add(role);
  }
  if (!mentioned.size) return state;
  const next = new Set(listedAnonymousRoles(state));
  for (const role of mentioned) {
    if (sceneAllowsRoleIntroduction(state, role, playerInput) || sceneHasRoleOccupancy(state, role)) {
      next.add(role);
    }
  }
  const list = [...next];
  const prev = listedAnonymousRoles(state);
  if (list.length === prev.length && list.every((r) => prev.includes(r))) return state;
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
      anonymousRoles: list,
    },
  };
}

export function trimAnonymousRolesOnLocationChange(
  state: GameState,
  sameLocation: boolean
): string[] {
  if (sameLocation) return listedAnonymousRoles(state);
  return [];
}
