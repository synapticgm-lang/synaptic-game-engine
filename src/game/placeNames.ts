/**
 * 29z7 — one short name per opening place. A card's `location` is often a scene description
 * ("Greyhollow well at midnight", "a safehouse after a rehearsal gone loud"). When the engine already
 * knows that place — a hub of this bible or the map pin of the quest matched to this card — HERE takes
 * that name, so prose, chips, travel and the journal all read the same one. The description stays on
 * the card text for the writer. A description the engine does not know keeps its own words.
 */
import type { GameState } from './types';
import { hubsForBibleId, placeCardFor, type OutdoorHub } from './outdoorHubs';
import { playerFacingLocation, underwayHereLabel } from './locationName';
import { matchLitRpgMainSpine } from '@/data/quests/litrpgMainSpines';
import { matchTabletopMainSpine } from '@/data/quests/tabletopMainSpines';
import { matchStoryRpgMainSpine } from '@/data/quests/storyRpgMainSpines';

const LEAD = /^(?:(?:alone|just|standing|kneeling|waking)\s+)?(?:(?:in|inside|at|on|by|near|under)\s+)?(?:the|a|an)\s+/i;
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

function knownPlaceNames(bibleId: string | null | undefined, hookBlob: string, description: string): string[] {
  const out = hubsForBibleId(bibleId).map((h) => h.name);
  const pins = [
    matchLitRpgMainSpine(bibleId, hookBlob, description)?.mapPin,
    matchTabletopMainSpine(bibleId, hookBlob, description)?.mapPin,
    matchStoryRpgMainSpine(bibleId, hookBlob, description)?.mapPin,
  ];
  for (const pin of pins) if (pin?.trim()) out.push(pin.trim());
  return out;
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
  const raw = (description ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return description;
  const core = placeCore(raw);
  const headHub = hubsForBibleId(bibleId)
    .filter((h) => hubNames(h).some((n) => wordRe(n, '$').test(core)))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (headHub) return headHub.name;
  const head = placeHeadNoun(raw);
  if (!head) return raw;
  const mine = new Set(words(raw));
  let best: { name: string; score: number } | null = null;
  for (const name of knownPlaceNames(bibleId, hookBlob, raw)) {
    const theirs = words(name);
    if (theirs[theirs.length - 1] !== head) continue;
    const score = theirs.filter((w) => mine.has(w)).length;
    if (!best || score > best.score) best = { name, score };
  }
  return best?.name ?? raw;
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
  const raw = description.replace(/\s+/g, ' ').trim();
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
  if (!rest) return { place: mentioned.name };
  const clausePrep = raw.replace(LEAD, '').match(CLAUSE)?.[0]?.trim().split(' ')[0] ?? '';
  const prep = SPATIAL_PREP.test(clausePrep) ? clausePrep.toLowerCase() : 'in';
  return { place: `the ${rest} ${prep} ${mentioned.name}`, parentHub: mentioned.name };
}

/** The exits of HERE: the location sheet when it has them, else the place card. On a trip: its two ends. */
export function exitPlaceNames(state: GameState): string[] {
  if (underwayHereLabel(state)) return [state.journey!.from, state.journey!.to];
  const sheet = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
  return sheet.length ? sheet : placeCardFor(state, playerFacingLocation(state))?.exits ?? [];
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
