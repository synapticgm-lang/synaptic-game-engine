/**
 * 02r — Scene context filter for the last-4 tail + stale-camera commit.
 * After travel, the writer only sees beats from HERE. After a clear, only
 * beats from the clear onward. No SNAPSHOT / CRAFT / NEVER lines.
 */

import type { GameState, LogEntry } from './types';
import { UNDERWAY_HERE, underwayHereLabel } from './locationName';
import { splitProseSentences } from './proseSentences';
import { matchesLastKillName, withoutLastKillName } from './combatAuthority';

export const SCENE_CONTEXT_TAIL_WINDOW = 4;
export const SCENE_CONTEXT_RECENT_TURNS = 2;

const PLACE_STOP = new Set([
  'the', 'and', 'under', 'from', 'into', 'near', 'with', 'this', 'that',
  'your', 'over', 'road', 'street', 'place',
]);

/** A preposition in a described place ("a stack behind iron mesh") is grammar, never the place's own word. */
const PREPOSITION =
  /^(?:above|across|after|against|along|among|around|before|behind|below|beneath|beside|besides|between|beyond|down|inside|onto|outside|past|through|throughout|toward|towards|underneath|upon|within|without)$/;

const TRAVEL_LINE =
  /\b(travel(?:\s+toward)?|return to|enter|go (?:inside|in|through|into)|head (?:inside|through|into|to)|leave|exit|walk away)\b/i;

/** The move away from (or onto) a place: naming the old place here is the departure, not the camera. */
const LEAVE_BEHIND =
  /\b(?:leave|left|leaving|depart(?:s|ed|ing)?|set (?:out|off) from|travell?(?:ed|ing)? from|away from|(?:stepped|walked|came|come|climbed)(?: up| back)? (?:out of|from))\b|\b(?:fell|falls|fall|fallen)(?: away)? behind\b|\breach(?:ed|es)?\s+(?:the\s+)?|\barrive(?:d|s)? at\b/i;

const DEPARTURE_FAREWELL =
  /\b(?:watching you go|until the (?:fog|dark|rain|dust|night) swallows|left behind|stays? behind|does not follow|as you (?:leave|go|walk away))\b/i;

const HERE_ACTOR =
  /\b(?:waits?|stands?|looks? up|nods?|asks?|says?|greets?|watches? you(?!\s+go)|steps?|holds?)\b/i;

const OPENING_PIN_ROLE = 'handler|priests?|scale priests?';

/** A word that makes the name after it its object ("the job from Harn"), not the one acting. */
const OBJECT_OF = '(?<!\\b(?:from|to|for|with|of|by|about|toward|towards|at|in|on|after|behind|past)\\s+(?:the\\s+)?)';

/** The name is the subject of a here-verb: not the object of a preposition, and the verb follows within three words. */
function actsHereAsSubject(sentence: string, name: string): boolean {
  return new RegExp(`${OBJECT_OF}\\b(?:${name})\\b(?:[\\s,]+[\\w'’-]+){0,2}?[\\s,]+${HERE_ACTOR.source}`, 'i').test(sentence);
}

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
    .filter((w) => w.length >= 4 && !PLACE_STOP.has(w) && !PREPOSITION.test(w));
}

export function placesDiffer(a: string | undefined | null, b: string | undefined | null): boolean {
  const left = normalizePlace(a).toLowerCase();
  const right = normalizePlace(b).toLowerCase();
  if (!left || !right) return false;
  return left !== right;
}

/**
 * Distinctive place mention — strong token (≥6) or every short token (West Wall).
 * A word the place's own label writes in lower case is a description word ("a harbor circle"): the same word
 * capitalised mid-sentence is another proper name ("The Circle's Price"), not this place.
 */
export function mentionsPlace(text: string, name: string | undefined | null): boolean {
  const raw = normalizePlace(name);
  if (!raw || !text) return false;
  const words = placeWords(raw);
  if (!words.length) {
    return raw.length >= 5 && text.toLowerCase().includes(raw.toLowerCase());
  }
  const strong = words.filter((w) => w.length >= 6);
  const needles = strong.length ? strong : words;
  const needAll = strong.length === 0;
  const hit = (w: string) => {
    const re = new RegExp(`\\b${escapeRe(w)}\\b`, 'gi');
    const describes = !new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(raw.replace(/\b[a-z][\w'-]*/g, ' '));
    for (const m of text.matchAll(re)) {
      const at = m.index ?? 0;
      const sentenceStart = /(?:^|[.!?]["'”’)\]]*\s+)$/.test(text.slice(0, at));
      if (!describes || !/^[A-Z]/.test(m[0]) || sentenceStart) return true;
    }
    return false;
  };
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

/**
 * Text naming HERE; on a trip, naming where the trip is going is the move itself. The destination counts
 * only by its own words ("Cathedral" alone is also the Close being left).
 */
function mentionsHereOrTrip(state: GameState, body: string): boolean {
  if (mentionsPlace(body, hereLocation(state))) return true;
  const to = state.journey?.to;
  if (!to) return false;
  const left = new Set(placeWords(priorLocation(state)));
  const own = placeWords(to).filter((w) => !left.has(w));
  return own.length > 0 && own.some((w) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(body));
}

/** On a leg, the place the trip set out from is part of the road ("the back streets from X toward Y"). */
function isTripStart(state: GameState, place: string): boolean {
  const j = state.journey;
  if (!j || j.legsDone >= j.legsTotal) return false;
  return !placesDiffer(j.from, place);
}

const MOVE_VERB =
  /\b(?:walk|head|turn|go|goes|went|gone|move|step|return|march|hurr(?:y|ied|ies)|travel|made|make|start|set)\w*\b/i;

/** The sentence puts the camera in or at the place, or moves the PC back toward it (not near it or past it). */
function putsCameraAt(sentence: string, place: string): boolean {
  const named = (lead: string, w: string) =>
    new RegExp(`\\b${lead}\\s+(?:the\\s+)?(?:[\\w'-]+\\s+){0,2}${escapeRe(w)}\\b`, 'i');
  return placeWords(place).some((w) => {
    if (named('(?:in|inside|at|within)', w).test(sentence)) return true;
    const toward = sentence.match(named('(?:toward|towards|back to|back into)', w));
    return !!toward && MOVE_VERB.test(sentence.slice(0, toward.index));
  });
}

/** "about" after one of these is around a place ("looked about the yard"), not a topic. */
const AROUND_VERB = /\b(?:look|looked|looks|looking|glanced|peered|gazed|wandered|walked|milled|moved|turned|stood|paced|strolled)\s*$/i;

/**
 * Words that only name a place as the matter of talk or thought are not the camera: quoted words, and a
 * topic after about / regarding / concerning ("asked about the Ledger", "a decision about the wagon desk").
 */
function withoutTalkAbout(text: string): string {
  return text
    .replace(/"[^"]*"|“[^”]*”/g, ' ')
    .replace(/\b(?:about|regarding|concerning)\b(?:\s+[\w'’-]+){1,8}/gi, (m, at: number, all: string) =>
      AROUND_VERB.test(all.slice(0, at)) ? m : ' ');
}

/**
 * Past perfect ("Jax had finished their business in Lowmarket", "had been in the Undercroft") tells the time
 * before the move, not where the camera is now. Going back there ("had returned to") is still a move.
 */
const PAST_PERFECT =
  /\bhad\s+(?:(?:just|already|recently|once|earlier|only|first|long)\s+)*(?:been|spent|done|left|seen|kept|held|stood|sat|met|heard|said|told|paid|bought|slept|eaten|fought|won|lost|found|known|[a-z]+ed)\b/i;
const PAST_PERFECT_RETURN =
  /\bhad\s+(?:\w+\s+)?(?:returned|come\s+back|gone\s+back|walked\s+back|stepped\s+back|headed\s+back|turned\s+back)\b/i;

function tellsEarlierTime(sentence: string): boolean {
  return PAST_PERFECT.test(sentence) && !PAST_PERFECT_RETURN.test(sentence);
}

/**
 * A sentence names the place already left as the camera: it names that place with no HERE, no trip
 * destination and no departure in the same sentence (another sentence naming HERE does not excuse it).
 * Underway, the trip's start is a landmark of the road itself: only putting the camera in or at it is stale.
 */
export function isStaleLocationBleed(state: GameState, text: string): boolean {
  if (!(text ?? '').trim() || !locationChangedRecently(state)) return false;
  const here = hereLocation(state);
  const prev = priorLocation(state);
  if (!placesDiffer(here, prev)) return false;
  // The road label while underway names no place, so no sentence can bleed it.
  if (prev.toLowerCase() === UNDERWAY_HERE.toLowerCase()) return false;
  const tripStart = isTripStart(state, prev);
  return splitProseSentences(text).some((sentence) => {
    const s = withoutTalkAbout(sentence).trim();
    if (!s || !mentionsPlace(s, prev) || mentionsHereOrTrip(state, s) || isLeaveBehindMention(s, prev)) return false;
    if (tellsEarlierTime(s)) return false;
    return !tripStart || putsCameraAt(s, prev);
  });
}

export function isStaleFightBleed(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body || !encounterClearedRecently(state)) return false;
  const kill = state.sceneFacts?.lastKill;
  if (!kill?.name) return false;
  if (!FIGHT_BLEED.test(withoutLastKillName(body, kill))) return false;
  if (CORPSE_OK.test(body)) return false;
  // The kill turn is the engine's settled fight being told: its blows are this beat, not a fight left behind.
  if (kill.turn === state.turn) return false;
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

/**
 * A person left behind acts here when one sentence names them and gives them a here-verb. Someone the
 * presence ledger has here now was not left behind, and quoted words are talk, not an act.
 */
export function isLeftBehindActingHere(state: GameState, text: string): boolean {
  const body = (text ?? '').trim();
  if (!body || !locationChangedRecently(state)) return false;
  if (isLeaveBehindFarewell(body)) return false;
  if (mentionsHereOrTrip(state, body)) return false;
  const present = (state.sceneFacts?.present ?? []).map((p) => ` ${p.toLowerCase()} `);
  const names = leftBehindNames(state).filter(
    (name) => name.length >= 3 && !present.some((p) => p.includes(` ${name.toLowerCase()} `))
  );
  if (!names.length) return false;
  return splitProseSentences(withoutTalkAbout(body)).some((sentence) =>
    names.some((name) => actsHereAsSubject(sentence, escapeRe(name)))
  );
}

/** For a sentence that puts the scene back in a place already left: where the scene is now and which place is behind. */
export function staleLocationRepairNote(state: GameState, sentence: string): string {
  const left = isStaleLocationBleed(state, sentence)
    ? priorLocation(state)
    : isOpeningOccupancyReset(state, sentence) && mentionsPlace(sentence, state.openingEstablishment?.answers?.where)
      ? (state.openingEstablishment?.answers?.where ?? '').trim()
      : '';
  if (!left) return '';
  const trip = underwayHereLabel(state);
  const where = trip ? `on ${trip}` : `at ${hereLocation(state)}`;
  return `This happens ${where}; ${left} is behind, so nothing in this sentence is in or at ${left}.`;
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

/** A pin acts here when one sentence names the pin and gives it a here-verb (another sentence's verb is someone else's). */
function openingPinActsHere(body: string, state: GameState): boolean {
  if (isLeaveBehindFarewell(body) && !mentionsPlace(body, state.openingEstablishment?.answers?.where)) {
    return false;
  }
  const pins = openingPinNames(state).filter((pin) => pin.length >= 3);
  // Quoted words are talk: a speaker recalling "the priests" or "the Close steps" puts no pin in this room.
  const names = [OPENING_PIN_ROLE, ...pins.map(escapeRe)];
  return splitProseSentences(withoutTalkAbout(body)).some((sentence) =>
    names.some((name) => actsHereAsSubject(sentence, name))
  );
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
  if (mentionsPlace(withoutTalkAbout(body), openingWhere) && !mentionsHereOrTrip(state, body) && !LEAVE_BEHIND.test(body)) {
    // Underway from the opening place, it is a landmark of the road: only putting the camera in or at it resets.
    if (!isTripStart(state, openingWhere)) return true;
    const talkless = withoutTalkAbout(body);
    if (splitProseSentences(talkless).some((s) => mentionsPlace(s, openingWhere) && putsCameraAt(s, openingWhere))) return true;
  }
  if (openingPinActsHere(body, state)) return true;
  return false;
}
