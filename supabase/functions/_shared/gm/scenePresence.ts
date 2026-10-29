/**
 * Who is here to hear / answer — shared by chip legality and scene affordances.
 * Kept out of chipLegality ↔ sceneAffordances so openingEstablishment mocks (and live
 * opening-cast presence) bind to one module without a circular import.
 */
import type { GameState } from './types.ts';
import { isChromePersonToken } from './chromeAuthority.ts';
import { isNeverCastTitle } from './neverCast.ts';
import { presentNpcRecords } from './npcRecords.ts';
import { presentNpcNames } from './npcRelationships.ts';
import * as openingEstablishment from './openingEstablishment.ts';
import { isJourneyUnderway, roadMeetingLabel, roadMeetingOver } from './travelJourney.ts';
import { isOutOfTalkingRange, TALKING_RANGE_FT } from './hereSpot.ts';

const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const low = (s: string | undefined | null) => norm(s).toLowerCase();

export function mentionsName(text: string, name: string): boolean {
  const hay = low(text);
  if (!hay) return false;
  if (hay.includes(low(name))) return true;
  const tokens = low(name)
    .replace(/^(?:the|a|an)\s+/, '')
    .split(/[\s'’-]+/)
    .filter((t) => t.length >= 3 && !/^(?:the|of|and)$/.test(t));
  if (!tokens.length) return false;
  const hit = (t: string) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay);
  // Multi-token names need every content token ("Nemi Salt" ≠ "salt-burners" via Salt alone).
  return tokens.length >= 2 ? tokens.every(hit) : hit(tokens[0]!);
}

const ROAD_PEOPLE_KINDS = new Set(['traveler', 'meeting', 'thugs', 'camp', 'villain']);
/** Group meetings keep the kind label seated beside the leader name (ttPres thugs). */
const ROAD_GROUP_KINDS = new Set(['thugs', 'camp']);

/**
 * The person a live, in-range road meeting puts on this stretch.
 * T10RC6 — engine-chosen `enc.name` is the reaction-slot / gate name when set (not a stale place NPC).
 */
export function roadMeetingPeople(state: GameState): string | null {
  const enc = state.journey?.encounter;
  if (!enc || roadMeetingOver(enc) || !isJourneyUnderway(state)) return null;
  if (!ROAD_PEOPLE_KINDS.has(enc.kind)) return null;
  // T10RC1 — beyond talking range is not seated (same isOutOfTalkingRange / awayFrom gate).
  const label = roadMeetingLabel(enc.kind);
  const who = (enc.name ?? '').trim() || label;
  if (typeof enc.distanceFt === 'number' && enc.distanceFt > TALKING_RANGE_FT) return null;
  if (isOutOfTalkingRange(state, who)) return null;
  return who;
}

/** Group label for a live in-range meeting (thugs / camp) when distinct from the leader name. */
function roadMeetingGroupLabel(state: GameState): string | null {
  const enc = state.journey?.encounter;
  if (!enc || !ROAD_GROUP_KINDS.has(enc.kind)) return null;
  if (!roadMeetingPeople(state)) return null;
  const label = roadMeetingLabel(enc.kind);
  const who = (enc.name ?? '').trim();
  if (who && personKey(who) === personKey(label)) return null;
  return label;
}

/** Article-stripped key so "the crew" and "crew" are one person (T10Y — no "crew of the crew"). */
function personKey(name: string): string {
  return name.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
}

/**
 * Engine record: the crowd has departed (crowd none + cleared present + unlocked count).
 * Narrow input for chips / gate / peopleHere — not a prose empty-room synonym.
 */
export function crowdDepartedByRecord(
  facts: { crowd?: string; crowdCount?: number; present?: string[] } | null | undefined,
): boolean {
  return !!facts
    && facts.crowd === 'none'
    && (facts.crowdCount ?? 0) === 0
    && !(facts.present?.length);
}

/**
 * Everyone who could answer: the presence record, companions, the live foe, the opening cast,
 * a road meeting. Opening cast stays while still at the card place (busy beat / no empty text
 * does not clear them — empty-room listeners strip cast separately).
 * T10AI — when the engine records an empty occupancy (crowdDepartedByRecord), departed
 * cast/roles/location memories do not stay as listeners (Follow-up chips retract with the record).
 */
export function peopleHere(state: GameState): string[] {
  const out = new Map<string, string>();
  const add = (n?: string | null) => {
    const name = norm(n);
    // T10RC5 — quest/place concept titles (System bounty) are never seated speakers.
    if (!name || isChromePersonToken(name) || isNeverCastTitle(name, state)) return;
    const key = personKey(name);
    if (!key) return;
    const prev = out.get(key);
    // Prefer the article form ("the crew") when both bare and articulated appear.
    if (!prev || (/^(?:the|a|an)\s+/i.test(name) && !/^(?:the|a|an)\s+/i.test(prev))) {
      out.set(key, name);
    }
  };
  const facts = state.sceneFacts;
  if (crowdDepartedByRecord(facts)) {
    // T10RC1 — empty occupancy is seat-authority empty. Location-stamped memories are not
    // seats (dual-here deleted). Companions + live road meeting + active encounter only.
    (state.companions ?? []).forEach((c) => add(c.name));
    add(state.activeEncounter?.name);
    add(roadMeetingPeople(state));
    add(roadMeetingGroupLabel(state));
    return [...out.values()];
  }
  // T10RC6 — underway: one seat list = companions + live foe + in-range meeting name.
  // Do not keep place-cast leftovers (Orel at Lowmarket) beside a road stranger.
  if (isJourneyUnderway(state)) {
    (state.companions ?? []).forEach((c) => add(c.name));
    add(state.activeEncounter?.name);
    for (const m of presentNpcRecords(state)) add(m.npcName);
    add(roadMeetingPeople(state));
    add(roadMeetingGroupLabel(state));
    return [...out.values()];
  }
  // T10RC5fix — people who live at THIS place (presentNpcNames / location stamp, not departed,
  // in talking range) are here. Narrow RC5 keeps: neverCast titles, road/in-transit (presentNpcRecords
  // skips UNDERWAY historical stamps; npcPlacedElsewhere drops stale sceneFacts names), out-of-range.
  presentNpcNames(state).forEach(add);
  (state.companions ?? []).forEach((c) => add(c.name));
  add(state.activeEncounter?.name);
  // Namespace read so vitest openingCastNames mocks stay live (no stale named binding).
  // Opening cast stays at the card place (T10AI). True empty occupancy is crowdDepartedByRecord
  // above (drops cast). Empty-room chips strip cast via listenersOnEmptyText -- do not starve
  // pads / giver / last-resort want when present[] is merely unset (emptySceneFacts).
  // T10AN — opening cast out of talking range is still at the place but cannot hear talk chips.
  if (openingEstablishment.openingCastStillHere(state)) {
    for (const n of openingEstablishment.openingCastNames(state)) {
      if (!isOutOfTalkingRange(state, n)) add(n);
    }
  }
  add(roadMeetingPeople(state));
  add(roadMeetingGroupLabel(state));
  return [...out.values()];
}

/** Who can hear a talk chip when the place text says the room is empty: never the opening card's cast. */
export function listenersOnEmptyText(state: GameState): string[] {
  const cast = openingEstablishment.openingCastNames(state);
  return peopleHere(state).filter((n) => !cast.some((c) => mentionsName(n, c) || mentionsName(c, n)));
}

/**
 * Non-empty beat still seats a listener the prose names (opener-cast role the text shows),
 * even when the cast list / vitest mock did not land in peopleHere.
 */
export function proseSeatsListener(prose: string, who: string): boolean {
  const w = norm(who);
  if (!w || !norm(prose)) return false;
  return mentionsName(prose, w) || mentionsName(prose, `the ${w}`);
}
