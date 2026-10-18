/**
 * 29z7 — one short name per opening place. A card's `location` is often a scene description
 * ("Greyhollow well at midnight", "a safehouse after a rehearsal gone loud"). When the engine already
 * knows that place — a hub of this bible or the map pin of the quest matched to this card — HERE takes
 * that name, so prose, chips, travel and the journal all read the same one. The description stays on
 * the card text for the writer. A description the engine does not know keeps its own words.
 */
import type { GameState } from './types';
import { hubsForBibleId, type OutdoorHub } from './outdoorHubs';
import { playerFacingLocation, underwayHereLabel } from './locationName';
import { dungeonRoomPlace } from './places';
import { isInteriorPlace } from './placeAuthority';
import { dungeonRoomWays } from './dungeonCard';
import { placeExits } from './placeRegistry';
import { matchLitRpgMainSpine } from '@/data/quests/litrpgMainSpines';
import { matchTabletopMainSpine } from '@/data/quests/tabletopMainSpines';
import { matchStoryRpgMainSpine } from '@/data/quests/storyRpgMainSpines';
import { replayPreFeature } from './replaySeam';

const LEAD = /^(?:(?:alone|just|standing|kneeling|waking)\s+)?(?:(?:in|inside|at|on|by|near|under)\s+)?(?:the|a|an)\s+/i;
/** How the player is in the place ("alone in", "kneeling at"): the card's words, not part of the place's name. */
const POSTURE = /^(?:alone|just|standing|kneeling|waking)\s+(?:in|inside|at|on|by|near|under)\s+(?=(?:the|a|an)\s+)/i;
const CLAUSE = /\s+(?:after|beyond|at|on|in|under|beneath|inside|beside|within|near|with|by|where|while|from|behind|outside|during|before|over|above|below|past|of|off|for|to|as)\b.*$/i;
const FILLER = new Set(['the', 'and', 'with', 'from', 'into', 'over', 'under', 'beyond', 'after', 'near']);

function words(s: string): string[] {
  return (s.toLowerCase().match(/[a-z][a-z'’-]{2,}/g) ?? []).filter((w) => !FILLER.has(w));
}

/** The noun the description is about: the last word before its first trailing clause. */
export function placeHeadNoun(description: string): string {
  const core = description.replace(/\s+/g, ' ').trim().replace(LEAD, '').replace(CLAUSE, '');
  const list = words(core);
  return list[list.length - 1] ?? '';
}

/** The quest pin matched to this card first (it is the card's own place), then the bible's hubs. */
function knownPlaceNames(bibleId: string | null | undefined, hookBlob: string, description: string): string[] {
  const out: string[] = [];
  const pins = replayPreFeature('openingPlaceNames') ? [] : [
    matchLitRpgMainSpine(bibleId, hookBlob, description)?.mapPin,
    matchTabletopMainSpine(bibleId, hookBlob, description)?.mapPin,
    matchStoryRpgMainSpine(bibleId, hookBlob, description)?.mapPin,
  ];
  for (const pin of pins) if (pin?.trim()) out.push(pin.trim());
  for (const h of hubsForBibleId(bibleId)) if (!out.includes(h.name)) out.push(h.name);
  return out;
}

/** When the card meets the place ("Greyhollow mill lane at dusk"): the hour is the scene, never the place's name. */
const TIME_OF_DAY = /,?\s+(?:at|in|by|during|before|after|toward|towards|near|around)\s+(?:the\s+)?(?:dawn|dusk|midnight|night|nightfall|noon|midday|morning|evening|afternoon|twilight|sunset|sundown|sunrise|daybreak|first light|last light|small hours|dead of night)\b.*$/i;
export function dropTimeOfDay(description: string): string {
  const out = description.replace(TIME_OF_DAY, '').trim();
  return out.length >= 3 ? out : description;
}

/** "Greyhollow, at the inn" names one place, Greyhollow's inn: read it as "Greyhollow inn". */
function foldTownComma(description: string): string {
  return description.replace(/^([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)*),\s+(?:at|in|inside)\s+(?:the|a|an)\s+/, '$1 ');
}

/** The description without its lead-in and trailing clause ("a Lowmarket cellar shrine under X" → "Lowmarket cellar shrine"). */
function placeCore(description: string): string {
  return description.replace(/\s+/g, ' ').trim().replace(LEAD, '').replace(CLAUSE, '').trim();
}

function hubNames(h: OutdoorHub): string[] {
  return [h.name, ...(h.aliases ?? [])]
    .map((n) => n.trim().replace(/^(?:the|a|an)\s+/i, ''))
    .filter((n) => n.length >= 5);
}

function wordRe(name: string, suffix = '\\b'): RegExp {
  return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${suffix}`, 'i');
}

/** The longest hub of this bible whose name or alias sits anywhere in the description. */
function mentionedHub(hubs: OutdoorHub[], description: string): OutdoorHub | undefined {
  return hubs
    .filter((h) => hubNames(h).some((n) => wordRe(n).test(description)))
    .sort((a, b) => b.name.length - a.name.length)[0];
}

/**
 * The name HERE uses for an opening place. A hub wins only when it is the description's head
 * ("the Lowmarket at dusk"), never when it is merely mentioned ("a Lowmarket cellar shrine", "the ford
 * on the Cinderflow"); else a known place that shares the description's head noun and the most other
 * words; else the description itself.
 */
export function shortPlaceName(
  bibleId: string | null | undefined,
  description: string | undefined,
  hookBlob = ''
): string | undefined {
  const given = (description ?? '').replace(/\s+/g, ' ').trim();
  if (!given) return description;
  const raw = foldTownComma(given);
  const core = placeCore(raw);
  const headHub = hubsForBibleId(bibleId)
    .filter((h) => hubNames(h).some((n) => wordRe(n, '$').test(core)))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (headHub) return headHub.name;
  const head = placeHeadNoun(raw);
  if (!head) return given;
  const mine = new Set(words(raw));
  let best: { name: string; score: number } | null = null;
  for (const name of knownPlaceNames(bibleId, hookBlob, raw)) {
    const theirs = words(name);
    if (theirs[theirs.length - 1] !== head) continue;
    const score = theirs.filter((w) => mine.has(w)).length;
    if (!best || score > best.score) best = { name, score };
  }
  return best?.name ?? dropTimeOfDay(given);
}

const SPATIAL_PREP = /^(?:under|beneath|below|behind|beside|within|near|outside|above|inside|in|at|by|off|on)$/i;

/**
 * The opening place as one record: its own name and the hub it sits in. A hub that only modifies
 * the head noun becomes the parent ("a Lowmarket cellar shrine under Valespire" → "the cellar shrine
 * under Lowmarket", parent Lowmarket); a hub in the trailing clause stays in the description's own words.
 */
export function openingPlaceRecord(
  bibleId: string | null | undefined,
  description: string,
  hookBlob = ''
): { place: string; parentHub?: string } {
  const raw = dropTimeOfDay(description.replace(/\s+/g, ' ').trim().replace(POSTURE, ''));
  const hubs = hubsForBibleId(bibleId);
  const short = shortPlaceName(bibleId, raw, hookBlob) ?? raw;
  const mentioned = mentionedHub(hubs, raw);
  if (short !== raw) {
    const isHub = hubs.some((h) => h.name === short);
    return { place: short, ...(!isHub && mentioned ? { parentHub: mentioned.name } : {}) };
  }
  if (!mentioned) return { place: raw };
  const core = placeCore(raw);
  const inCore = hubNames(mentioned).find((n) => wordRe(n).test(core));
  if (!inCore) return { place: raw, parentHub: mentioned.name };
  const rest = core
    .replace(new RegExp(`${wordRe(inCore).source}(?:['’]s)?`, 'i'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // A room of an indoor hub ("Greyhollow tavern common room") is that hub, not a second map place; a place
  // only beside or beneath the hub ("a cell beneath Valespire Cathedral") keeps its own words, as does one
  // whose trailing clause names the hub again ("an undercroft cell beneath Valespire Cathedral").
  const clause = raw.replace(LEAD, '').match(CLAUSE)?.[0] ?? '';
  const hubWords = new Set(hubNames(mentioned).flatMap(words));
  const clauseNamesHub = words(clause).some((w) => hubWords.has(w));
  const roomOfHub =
    !replayPreFeature('openingPlaceNames') &&
    isInteriorPlace(mentioned.name) && !clauseNamesHub && !rest.split(' ').some((w) => SPATIAL_PREP.test(w));
  if (!rest || roomOfHub) return { place: mentioned.name };
  const clausePrep = raw.replace(LEAD, '').match(CLAUSE)?.[0]?.trim().split(' ')[0] ?? '';
  const prep = SPATIAL_PREP.test(clausePrep) ? clausePrep.toLowerCase() : 'in';
  return { place: `the ${rest} ${prep} ${mentioned.name}`, parentHub: mentioned.name };
}

/**
 * The exits of HERE: the place record (placeExits). On a trip: its two ends.
 * In a dungeon room: the room's own ways on, not the exits of the place the dungeon sits under.
 */
export function exitPlaceNames(state: GameState): string[] {
  if (underwayHereLabel(state)) return [state.journey!.from, state.journey!.to];
  if (dungeonRoomPlace(state, playerFacingLocation(state))) {
    const ways = dungeonRoomWays(state);
    if (ways) return ways;
  }
  return placeExits(state, playerFacingLocation(state));
}

/**
 * 29z8 — the town the opening hook put HERE in: capitalised words of the hook's Location line that are
 * not part of HERE's own name ("Pellane war camp beyond Valespire walls" at Pellane War Camp → Valespire).
 */
export function hookTownName(state: GameState): string {
  const line = state.openingEstablishment?.pickedHook?.match(/^Location:\s*(.+)$/im)?.[1] ?? '';
  const here = new Set(words(playerFacingLocation(state)));
  const caps = (line.match(/\b[A-Z][a-z'’]+(?:\s+[A-Z][a-z'’]+)*/g) ?? [])
    .filter((c) => !words(c).some((w) => here.has(w)));
  return caps[0] ?? '';
}

/** 29z8 — places other than HERE the writer may name this turn: exits, the journey ends, the hook town. */
export function nearbyPlaceNames(state: GameState): string[] {
  const out: string[] = [];
  const here = playerFacingLocation(state).toLowerCase();
  const names = underwayHereLabel(state)
    ? exitPlaceNames(state)
    : [...exitPlaceNames(state).slice(0, 5), state.journey?.from, state.journey?.to, hookTownName(state)];
  for (const name of names) {
    const n = (name ?? '').replace(/\s+/g, ' ').trim();
    if (n.length >= 3 && n.toLowerCase() !== here && !out.some((o) => o.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out;
}
