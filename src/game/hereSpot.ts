/**
 * Gap 2 — position inside a place. A typed move that stays in the current place (step back, to the
 * bank, out of the water, away from them) writes a here-spot on sceneFacts: where the player now
 * stands and who stayed out of talking range. The hub does not change.
 */

import type { GameState, HereSpot } from './types';

const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
const key = (s: string | null | undefined) => norm(s).toLowerCase();

const QUESTION_OPENER =
  /^(?:can|could|should|would|may|might|do|does|did|is|are|am|will|shall|what|why|how|where|when|who)\b/i;
const TRUE_LEAVE = /\b(?:leave|exit|go\s+another\s+direction|this\s+place|the\s+area|the\s+scene)\b/i;
const WATER = /\b(?:water|river|stream|pool|pond|lake|mud|bog|marsh|mire|reeds|shallows)\b/i;
const OUT_OF_WATER =
  /\b(?:climb|clamber|get|wade|step|walk|move|haul|pull)\s+(?:myself\s+|yourself\s+)?out\s+of\s+the\s+(?:water|river|stream|pool|pond|lake|mud|bog|marsh|mire|reeds|shallows)\b/i;
const NAMED_SPOT =
  /\b(?:to|onto|toward|towards|up\s+on(?:to)?)\s+(?:the\s+)?(dry\s+(?:ground|land)|(?:river\s*)?bank|shore|edge(?:\s+of\s+the\s+\w+)?|higher\s+ground|firm\s+ground|solid\s+ground)\b/i;
const STEP_BACK = /\b(?:step|move|stand|walk|wade|back)\s+(?:a\s+(?:few|couple\s+of)\s+(?:steps?|paces?)\s+)?back\b|\bstep\s+back\b|\bback\s+(?:away|off)\b/i;
const MOVE_AWAY = /\b(?:move|moving|step|stepping|walk|walking|wade|wading|get|getting|back)\s+away\b/i;
const AWAY_FROM_PEOPLE = /\baway\s+from\s+(?:them|him|her|those|these|the\s+(?:two|pair|others|group)|[A-Z][a-z]+)\b/;
const TOWARD_PEOPLE = /\b(?:to|toward|towards|back\s+to|over\s+to|closer\s+to)\s+(?:them|him|her|the\s+(?:two|pair|others|group))\b/i;

/** Sentences of the line that are not questions ("Should I move away?" is not a move). */
function statementSentences(line: string): string[] {
  return line
    .split(/(?<=[.!?])\s*/)
    .map((s) => s.trim())
    .filter((s) => s && !(QUESTION_OPENER.test(s) && /\?$/.test(s)));
}

/** The spot named or implied by a within-place move, or null when the line is not one. */
export function withinPlaceSpot(raw: string, sceneText = ''): string | null {
  const line = norm(raw);
  if (!line || TRUE_LEAVE.test(line)) return null;
  for (const s of statementSentences(line)) {
    if (OUT_OF_WATER.test(s)) return 'dry ground';
    const named = s.match(NAMED_SPOT);
    if (named && /\b(?:move|step|walk|wade|get|go|head|climb|back|retreat|make\s+(?:my|your)\s+way)\b/i.test(s)) {
      const spot = named[1].toLowerCase();
      return /bank|shore|edge/.test(spot) ? `the ${spot}` : spot;
    }
    const away = MOVE_AWAY.test(s) || AWAY_FROM_PEOPLE.test(s);
    if (away || STEP_BACK.test(s)) {
      if (WATER.test(line) || WATER.test(sceneText)) return 'dry ground';
      return away ? 'a spot apart from them' : 'a few steps back';
    }
  }
  return null;
}

/** People still in talking range after a move to a spot: none when the player walked away, all when he moved toward them. */
function splitByRange(line: string, people: string[]): { nearby: string[]; awayFrom: string[] } {
  if (TOWARD_PEOPLE.test(line)) return { nearby: people, awayFrom: [] };
  const named = people.filter((p) => new RegExp(`\\baway\\s+from\\s+${p.split(/\s+/)[0]}\\b`, 'i').test(line));
  if (named.length) return { nearby: people.filter((p) => !named.includes(p)), awayFrom: named };
  return { nearby: [], awayFrom: people };
}

export function buildHereSpot(
  state: GameState,
  raw: string,
  spot: string,
  people: string[]
): HereSpot {
  const companions = new Set(
    [(state as { companion?: string }).companion, ...(state.companions ?? []).map((c) => c.name)]
      .filter(Boolean)
      .map((n) => key(n))
  );
  const others = people.filter((p) => !companions.has(key(p)));
  const { nearby, awayFrom } = splitByRange(norm(raw), others);
  return {
    place: norm(state.currentLocation),
    spot,
    turn: state.turn ?? 0,
    nearby: [...people.filter((p) => companions.has(key(p))), ...nearby],
    awayFrom,
  };
}

/** The here-spot when it belongs to the current place. */
export function activeHereSpot(state: Pick<GameState, 'sceneFacts' | 'currentLocation'>): HereSpot | null {
  const s = state.sceneFacts?.hereSpot;
  if (!s?.spot || !s.place) return null;
  return key(s.place) === key(state.currentLocation) ? s : null;
}

/** The stored spot only while the player is still at its place; any move to another place ends it. */
export function hereSpotAt(spot: HereSpot | undefined, place: string | null | undefined): HereSpot | undefined {
  if (!spot) return undefined;
  return key(spot.place) === key(place) ? spot : undefined;
}

/** True when the player walked away from this person inside the current place and they did not follow. */
export function isOutOfTalkingRange(state: Pick<GameState, 'sceneFacts' | 'currentLocation'>, name: string): boolean {
  const s = activeHereSpot(state);
  if (!s?.awayFrom?.length) return false;
  const k = key(name);
  return s.awayFrom.some((a) => key(a) === k);
}

/** After the writer: someone the prose shows following the player is beside him again. */
export function applyFollowersToHereSpot(spot: HereSpot | undefined, narrative: string): HereSpot | undefined {
  if (!spot?.awayFrom?.length || !narrative) return spot;
  const followed = spot.awayFrom.filter((name) => {
    const first = name.split(/\s+/)[0].replace(/[^\w'-]/g, '');
    if (!first) return false;
    return new RegExp(
      `\\b${first}\\b[^.!?]{0,40}\\b(?:follows|follow|followed|comes\\s+with|walks\\s+with|wades\\s+after|trails\\s+after|joins\\s+you|keeps\\s+pace)\\b`,
      'i'
    ).test(narrative);
  });
  if (!followed.length) return spot;
  return {
    ...spot,
    awayFrom: spot.awayFrom.filter((n) => !followed.includes(n)),
    nearby: [...spot.nearby, ...followed],
  };
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Writer line for the spot: what moved this turn, or where the player still stands. '' when no spot. */
export function hereSpotFact(state: GameState): string {
  const s = activeHereSpot(state);
  if (!s) return '';
  const here = norm(state.currentLocation);
  const away = s.awayFrom.length
    ? ` ${listNames(s.awayFrom)} stayed where they were, out of talking range; they are not beside the player.`
    : '';
  const near = s.nearby.length ? ` Still within talking range: ${listNames(s.nearby)}.` : '';
  if (s.turn === state.turn) {
    return `Moved this turn within ${here}: now on ${s.spot}. Still at ${here}; do not narrate leaving it.${away}${near}`;
  }
  return `No move this turn: still on ${s.spot} at ${here} (moved there T${s.turn}).${away}${near}`;
}
