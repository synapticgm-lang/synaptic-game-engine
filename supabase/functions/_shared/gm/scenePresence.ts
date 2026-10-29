/**
 * Who is here to hear / answer — shared by chip legality and scene affordances.
 * Kept out of chipLegality ↔ sceneAffordances so openingEstablishment mocks (and live
 * opening-cast presence) bind to one module without a circular import.
 */
import type { GameState } from './types.ts';
import { presentNpcNames } from './npcRelationships.ts';
import { isChromePersonToken } from './chromeAuthority.ts';
import * as openingEstablishment from './openingEstablishment.ts';
import { isJourneyUnderway, roadMeetingLabel, roadMeetingOver } from './travelJourney.ts';
import { UNDERWAY_HERE } from './locationName.ts';
import { isOutOfTalkingRange } from './hereSpot.ts';

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

/** The person or group a live, un-fought road meeting puts on this stretch, by the journey's own label. */
export function roadMeetingPeople(state: GameState): string | null {
  const enc = state.journey?.encounter;
  if (!enc || roadMeetingOver(enc) || !isJourneyUnderway(state)) return null;
  return ROAD_PEOPLE_KINDS.has(enc.kind) ? roadMeetingLabel(enc.kind) : null;
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
    if (!name || isChromePersonToken(name)) return;
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
    // T10AI-fix — empty occupancy still seats engine-tagged people at this place
    // (refuse/ask via recordPersonSeen). Skip opening-cast filler and stale crowd
    // stamps (present:true left after sceneFacts cleared) so Follow-up chips retract.
    // T10AQ-fix — UNDERWAY_HERE is one shared stamp; quiet-road clear must not re-seat
    // historical road meets via location match (companions + live meeting only below).
    const hereKey = low(state.currentLocation);
    const sharedRoad = hereKey === low(UNDERWAY_HERE);
    for (const m of state.npcMemories ?? []) {
      if (m.shouldExit || m.present === true) continue;
      if (sharedRoad) continue;
      if (low(m.location) && low(m.location) === hereKey) add(m.npcName);
    }
    (state.companions ?? []).forEach((c) => add(c.name));
    add(state.activeEncounter?.name);
    add(roadMeetingPeople(state));
    return [...out.values()];
  }
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
