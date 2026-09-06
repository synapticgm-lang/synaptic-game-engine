/**
 * 02r — Scene context filter for the last-4 tail + stale-camera commit.
 * After travel, the writer only sees beats from HERE. After a clear, only
 * beats from the clear onward. No SNAPSHOT / CRAFT / NEVER lines.
 */

import type { GameState, LogEntry } from './types.ts';
import { matchesLastKillName } from './combatAuthority.ts';

export const SCENE_CONTEXT_TAIL_WINDOW = 4;
export const SCENE_CONTEXT_RECENT_TURNS = 2;

const PLACE_STOP = new Set([
  'the', 'and', 'under', 'from', 'into', 'near', 'with', 'this', 'that',
  'your', 'over', 'road', 'street', 'place',
]);

const TRAVEL_LINE =
  /\b(travel(?:\s+toward)?|return to|enter|go (?:inside|in|through|into)|head (?:inside|through|into|to)|leave|exit|walk away)\b/i;

const LEAVE_BEHIND =
  /\b(?:leave|left|leaving)\b[\w\s,'-]{0,48}\bbehind\b|\bbehind and reach\b|\breach(?:ed|es)?\s+(?:the\s+)?|\barrive(?:d|s)? at\b/i;

const DEPARTURE_FAREWELL =
  /\b(?:watching you go|until the (?:fog|dark|rain|dust|night) swallows|left behind|stays? behind|does not follow|as you (?:leave|go|walk away))\b/i;

const HERE_ACTOR =
  /\b(?:waits?|stands?|looks? up|nods?|asks?|says?|greets?|watches? you(?!\s+go)|steps?|holds?)\b/i;

const OPENING_PIN_ROLE =
  /\b(?:handler|priests?|scale priests?)\b/i;

const FIGHT_BLEED =
  /\b(blade|throat|handspan|skirmisher|mid-arc|press(?:es)? the attack|parry|lunges?)\b/i;

const CORPSE_OK =
  /\b(?:fallen(?!\s+(?:blade|sword|knife|weapon|axe|spear))|corpse|body|remains|dissolv|crumpl(?:ed|ing)?|dead|ichor|loot|downed|defeated|already\s+down|lashed|lies where)\b/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePlace(name: string | undefined | null): string {
  return (name ?? '').replace(/\s+/g, ' ').trim();
}

function placeWords(name: string): string[] {
  return normalizePlace(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !PLACE_STOP.has(w));
}

export function placesDiffer(a: string | undefined | null, b: string | undefined | null): boolean {
  const left = normalizePlace(a).toLowerCase();
  const right = normalizePlace(b).toLowerCase();
  if (!left || !right) return false;
  return left !== right;
}

/** Distinctive place mention — strong token (≥6) or every short token (West Wall). */
export function mentionsPlace(text: string, name: string | undefined | null): boolean {
  const raw = normalizePlace(name);
  if (!raw || !text) return false;
  const hay = text.toLowerCase();
  const words = placeWords(raw);
  if (!words.length) {
    return raw.length >= 5 && hay.includes(raw.toLowerCase());
  }
  const strong = words.filter((w) => w.length >= 6);
  const needles = strong.length ? strong : words;
  const needAll = strong.length === 0;
  const hit = (w: string) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(hay);
  return needAll ? needles.every(hit) : needles.some(hit);
}

export function isLeaveBehindMention(text: string, oldPlace: string | undefined | null): boolean {
  if (!mentionsPlace(text, oldPlace)) return false;
  return LEAVE_BEHIND.test(text);
}

export function hereLocation(state: Pick<GameState, 'currentLocation'>): string {
  return normalizePlace(state.currentLocation);
}

export function priorLocation(
  state: Pick<GameState, 'previousLocationSheet'>
): string {
  return normalizePlace(state.previousLocationSheet?.name);
}

export function locationChangedRecently(
  state: GameState,
  withinTurns = SCENE_CONTEXT_RECENT_TURNS
): boolean {
  const here = hereLocation(state);
  const prev = priorLocation(state);
  if (!placesDiffer(here, prev)) return false;
  const turn = state.turn ?? 0;
  const locked = state.sceneFacts?.cameraLock?.lockedTurn;
  if (typeof locked === 'number' && turn - locked <= withinTurns) return true;
  return (state.log ?? []).some((e) => {
    if (e.role !== 'player') return false;
    if (turn - (e.turn ?? 0) > withinTurns) return false;
    return TRAVEL_LINE.test(e.content ?? '');
  });
}

export function encounterClearedRecently(
  state: GameState,
  withinTurns = SCENE_CONTEXT_RECENT_TURNS
): boolean {
  const kill = state.sceneFacts?.lastKill;
  if (!kill?.name || kill.outcome !== 'victory') return false;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return false;
  const turn = state.turn ?? 0;
  if (typeof kill.turn !== 'number') return false;
  return turn - kill.turn <= withinTurns;
}

function keepLogLine(entry: LogEntry, state: GameState): boolean {
  const here = hereLocation(state);
  const prev = priorLocation(state);
  const traveled = placesDiffer(here, prev);
  const kill = state.sceneFacts?.lastKill;
  const cleared =
    !!kill?.name
    && kill.outcome === 'victory'
    && !state.activeEncounter
    && !state.sceneFacts?.pendingEncounter
    && typeof kill.turn === 'number';

  if (cleared && (entry.turn ?? 0) < (kill.turn ?? 0)) return false;

  if (!traveled) return true;

  const body = entry.content ?? '';
  if (entry.role === 'player' && TRAVEL_LINE.test(body)) return true;
  if (mentionsPlace(body, here)) return true;
  if (mentionsPlace(body, prev) && !isLeaveBehindMention(body, prev)) return false;
  return true;
}

/** Last N log lines that still belong to this camera / this fight. */
export function selectRecentLogForContext(
  state: GameState,
  window = SCENE_CONTEXT_TAIL_WINDOW
): LogEntry[] {
  const log = state.log ?? [];
  if (!log.length) return [];
  return log.filter((e) => keepLogLine(e, state)).slice(-window);
}

export function isStaleLocationBleed(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body || !locationChangedRecently(state)) return false;
  const here = hereLocation(state);
  const prev = priorLocation(state);
  if (!placesDiffer(here, prev)) return false;
  if (!mentionsPlace(body, prev)) return false;
  if (mentionsPlace(body, here)) return false;
  if (isLeaveBehindMention(body, prev)) return false;
  return true;
}

export function isStaleFightBleed(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body || !encounterClearedRecently(state)) return false;
  if (!FIGHT_BLEED.test(body)) return false;
  if (CORPSE_OK.test(body)) return false;
  const kill = state.sceneFacts?.lastKill;
  if (!kill?.name) return false;
  const tokens = body.match(/\b[A-Za-z][A-Za-z'-]{3,}\b/g) ?? [];
  return (
    mentionsPlace(body, kill.name)
    || tokens.some((t) => matchesLastKillName(t.replace(/['’]s$/i, ''), kill))
  );
}

export function leftBehindNames(state: GameState): string[] {
  const out: string[] = [];
  for (const p of state.sceneFacts?.leftBehind ?? []) {
    const n = (p ?? '').trim();
    if (n && !out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out;
}

export function isLeftBehindActingHere(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body || !locationChangedRecently(state)) return false;
  if (isLeaveBehindFarewell(body)) return false;
  if (mentionsPlace(body, hereLocation(state))) return false;
  return leftBehindNames(state).some((name) => {
    if (name.length < 3) return false;
    return new RegExp(`\\b${escapeRe(name)}\\b`, 'i').test(body) && HERE_ACTOR.test(body);
  });
}

export function isStaleContextBleed(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  return (
    isStaleLocationBleed(state, body)
    || isStaleFightBleed(state, body)
    || isOpeningOccupancyReset(state, body)
    || isLeftBehindActingHere(state, body)
  );
}

export function openingPinNames(state: GameState): string[] {
  const pins = [...(state.openingEstablishment?.pinnedNpcNames ?? [])];
  const out: string[] = [];
  for (const p of pins) {
    const n = (p ?? '').trim();
    if (n && !out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out;
}

export function isLeaveBehindFarewell(text: string): boolean {
  return DEPARTURE_FAREWELL.test(text ?? '');
}

function openingPinActsHere(body: string, state: GameState): boolean {
  if (isLeaveBehindFarewell(body) && !mentionsPlace(body, state.openingEstablishment?.answers?.where)) {
    return false;
  }
  const pinHit =
    OPENING_PIN_ROLE.test(body)
    || openingPinNames(state).some((pin) => {
      if (pin.length < 3) return false;
      return new RegExp(`\\b${escapeRe(pin)}\\b`, 'i').test(body);
    });
  return pinHit && HERE_ACTOR.test(body);
}

/**
 * After a committed leave/travel, the opening room is not HERE unless we returned.
 * Ledger: opening answers.where + opening pins vs current camera — not a phrase list.
 */
export function isOpeningOccupancyReset(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body || !locationChangedRecently(state)) return false;
  const here = hereLocation(state);
  const openingWhere = (state.openingEstablishment?.answers?.where ?? '').trim();
  if (!openingWhere || !placesDiffer(here, openingWhere)) return false;
  if (mentionsPlace(body, openingWhere) && !mentionsPlace(body, here)) return true;
  if (openingPinActsHere(body, state)) return true;
  return false;
}
