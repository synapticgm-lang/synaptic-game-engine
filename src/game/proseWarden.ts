/**
 * Cheap post-writer English / UI-leak pass. Not a second model.
 * Fixes article collisions, bare "a figure" name-slots, leaked quest verbs,
 * location tautology, alone crowd invents, and interior one-room map lies.
 * There is no general "does this make sense" critic — that would be a second LLM.
 */

import type { GameState } from './types';

/**
 * Calculate tracked crowd size from game state for consistency checking.
 */
export function calculateCrowdSize(state: GameState): number {
  const alone = state.openingEstablishment?.aloneArrival === true;
  if (alone && !state.activeEncounter) return 0;
  
  const present = state.sceneFacts?.present ?? [];
  const companions = state.companions?.length ?? 0;
  const encounter = state.activeEncounter ? 1 : 0;
  
  return Math.max(0, present.length + companions + encounter);
}

export type ProseWardenContext = {
  currentLocation?: string;
  /** Summoned Pact alone ruin / empty arrival — never invent watchers. */
  aloneArrival?: boolean;
  /** Interior graph has normal door/stair links from here — scrub one-room lies. */
  hasMappedDoorExits?: boolean;
  /** Named adjacent rooms for soft rewrite anchors (optional). */
  adjacentRoomNames?: string[];
  /** Tracked crowd size for consistency (0 = alone, 1-3 = intimate, 4-8 = small, 9-15 = modest, 16+ = large). */
  crowdSize?: number;
};

/** Interiors that already name "here" — nearby is for things that are not here. */
const HERE_PLACE_CUES =
  /\b(?:cathedral|circle|court|vault|chapel|nave|undercroft|palace|temple|keep|castle|inn|guildhall|sanctum|chamber|close)\b/i;

const NEARBY_HERE_NOUN = '(?:building|place|hall|structure|edifice|interior)s?';

export function beatIsAtNamedPlace(text: string, currentLocation?: string): boolean {
  if (HERE_PLACE_CUES.test(text)) return true;
  const loc = (currentLocation ?? '').trim();
  if (loc.length >= 3 && HERE_PLACE_CUES.test(loc)) return true;
  if (loc.length >= 8 && !/^(your surroundings|unspecified|nearby cover|just ahead of you)$/i.test(loc)) {
    return true;
  }
  return false;
}

function tidyClauses(text: string): string {
  return text
    .replace(/\s+,/g, ',')
    .replace(/,(?:\s*,)+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/,\s+\./g, '.')
    .replace(/^,+\s*/, '')
    .trim();
}

/**
 * "Nearby" is for things that are not here. If the beat is already at a named
 * interior (cathedral / circle / court / currentLocation), strip "a nearby
 * building/place/hall" used as the current room.
 */
export function scrubLocationTautology(text: string, currentLocation?: string): string {
  if (!text || !/nearby/i.test(text)) return text;
  let next = text;

  next = next.replace(
    new RegExp(
      `\\b((?:[Yy]ou are|[Yy]ou're|[Yy]ou stand|[Yy]ou sit|[Yy]ou lie|[Yy]ou wake(?:n)?))\\s+(?:within|inside|in)\\s+(?:a|the)\\s+nearby\\s+${NEARBY_HERE_NOUN}\\b`,
      'g'
    ),
    '$1 inside'
  );

  if (!beatIsAtNamedPlace(next, currentLocation)) return tidyClauses(next);

  next = next.replace(new RegExp(`\\s+of\\s+(?:a|the)\\s+nearby\\s+${NEARBY_HERE_NOUN}\\b`, 'gi'), '');
  next = next.replace(
    new RegExp(
      `\\s*,\\s*(?:in|inside|within)\\s+(?:a|the)\\s+nearby\\s+${NEARBY_HERE_NOUN}\\b(?=\\s*[,.]|$)`,
      'gi'
    ),
    ''
  );
  return tidyClauses(next);
}

/** After a sentence-ending closer + quote, the next sentence must capitalize. */
export function scrubSpokenQuoteStart(text: string): string {
  if (!text) return text;
  return text.replace(/([.!?])(["”'])(\s+)([a-z])/g, (_m, punct: string, q: string, sp: string, ch: string) =>
    `${punct}${q}${sp}${ch.toUpperCase()}`
  );
}

const ARTICLE_COLLISION =
  /\b(?:the\s+a|the\s+an|a\s+the|an\s+the|a\s+an|an\s+a|the\s+the|a\s+a)\b/gi;

/** Collapse doubled articles the writer (or a name-scrub) stacked. */
export function scrubArticleCollisions(text: string): string {
  if (!text) return text;
  let next = text;
  for (let i = 0; i < 4; i += 1) {
    const cleaned = next.replace(ARTICLE_COLLISION, (hit) => {
      const low = hit.toLowerCase().replace(/\s+/g, ' ');
      if (low.startsWith('the ')) return 'the';
      if (low === 'a an' || low === 'an a') return low.endsWith('an') ? 'an' : 'a';
      if (low.startsWith('a ') || low.startsWith('an ')) {
        return low.includes('the') ? 'the' : low.startsWith('an') ? 'an' : 'a';
      }
      return 'the';
    });
    if (cleaned === next) break;
    next = cleaned;
  }
  return next;
}

/**
 * "a figure" was the default invented-name replacement and leaked as a proper noun
 * ("the a figure", "glowing a figure", "You carry the a figure").
 */
export function scrubFigurePlaceholder(text: string, alone = false): string {
  if (!text) return text;
  const personSlot = alone ? 'the panel' : 'the official';
  return text
    .replace(/\bthe\s+glowing\s+a\s+figure\b/gi, 'the glowing mark')
    .replace(/\bglowing\s+a\s+figure\b/gi, 'glowing mark')
    .replace(/\bthe\s+war\s+with\s+(?:the\s+)?a\s+figure\b/gi, 'the war')
    .replace(/\b(?:you\s+carry|carries)\s+the\s+a\s+figure\b/gi, 'you carry the mark')
    .replace(/\ba\s+figure\s+is\s+not\b/gi, 'that mark is not')
    .replace(/\bthe\s+a\s+figure\b/gi, personSlot)
    .replace(/\b(?:the\s+)?(?:glowing\s+)?a figure\b/gi, (hit) =>
      /glowing/i.test(hit) ? 'the glowing mark' : personSlot
    );
}

/** UI / journal verbs must not be spoken in-world. */
export function scrubUiQuestVerbs(text: string, alone = false): string {
  if (!text) return text;
  const look = alone ? 'look to the panel' : 'look to the official';
  return text
    .replace(/\bunlock(?:s|ed|ing)?\s+someone(?:\s+nearby)?\b/gi, look)
    .replace(/\bunlock\s+(?:a|the)\s+(?:quest|journal|starter|guide\s*book)\b/gi, 'take the next step')
    .replace(/\bquest\s+unlocked\b/gi, 'a task comes into focus');
}

/** Soft name-slot must not act as a dialogue subject. */
export function scrubSomeoneNearbyPlaceholder(text: string, alone = false): string {
  if (!text || !/someone nearby/i.test(text)) return text;
  const role = alone ? 'the panel' : 'the official';
  const rolePoss = alone ? "the panel's" : "the official's";
  return text
    .replace(/\bsomeone nearby(?:'s|’s)\b/gi, rolePoss)
    .replace(/\bsomeone nearby\s+(does|doesn't|does not|did|said|states?|turns?|inclines?|remains?|stands?|listens?|regards?|gestures?|speaks?|asks?|replies?|nods?)\b/gi, `${role} $1`)
    .replace(/\b(?:the\s+)?someone nearby\b/gi, role);
}

/** Kill "the speaker" furniture / alone System chrome leaks. */
export function scrubSpeakerPlaceholder(text: string, alone = false): string {
  if (!text || !/\b(?:the|a) speaker\b/i.test(text)) return text;
  let next = text;
  next = next.replace(/\bgapes?\s+open(?:\s+onto)?\s+the speaker\b/gi, 'gapes open');
  next = next.replace(/\bopen(?:s|ed|ing)?\s+(?:onto\s+)?the speaker\b/gi, 'open');
  if (alone) {
    next = next.replace(/\bName:\s*the speaker\b/gi, 'Name: you');
    next = next.replace(/\[the speaker\]/gi, '[Status]');
    next = next.replace(/\bthe speaker:\s*/gi, '');
    next = next.replace(/\bthe speaker\b/gi, 'the panel');
    next = next.replace(/\ba speaker\b/gi, 'a panel');
  }
  return next;
}

/**
 * Kill premature "secrets" framing on an empty first look (explore opener filler).
 * Prefer sensory-only until the ledger has actual finds.
 */
export function scrubPrematureSecrets(text: string): string {
  if (!text || !/secrets/i.test(text)) return text;
  let next = text;
  next = next.replace(
    /\b(?:the\s+)?(?:ruin|building|chamber|room|place|house|hall)\s+gives?\s+up\s+(?:its|their)\s+secrets\s+slowly\.?\s*/gi,
    ''
  );
  next = next.replace(/\bgives?\s+up\s+(?:its|their)\s+secrets\s+slowly\.?\s*/gi, '');
  next = next.replace(/\b(?:reveals?|yields?)\s+(?:its|their)\s+secrets\s+(?:slowly|reluctantly)\.?\s*/gi, '');
  return tidyClauses(next);
}

/** Sentence split that keeps closers — for alone / map scrub drops. */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return parts?.map((p) => p.trim()).filter(Boolean) ?? (text.trim() ? [text.trim()] : []);
}

/**
 * Alone arrival / empty ruin — drop invent-crowd / "saw you arrive" watcher beats.
 * Choices already gate pads; this catches prose that slipped the writer.
 */
const ALONE_CROWD_INVENT =
  /\b(?:you(?:'re|’re| are) not alone|a handful of (?:people|figures|onlookers)|people have gathered|ones who saw you arrive|who saw you(?:r)? arrive|saw you arrive|watching (?:you |through )|crowd (?:of|has|have)|bystanders?\b|onlookers?\b|handlers?\b|voices?\s+(?:outside|beyond|from (?:the )?(?:street|road|gap))|someone (?:nearby|listening|watching))\b/i;

export function scrubInventedAlonePresence(text: string, alone: boolean): string {
  if (!alone || !text) return text;
  if (!ALONE_CROWD_INVENT.test(text)) return text;
  const kept = splitSentences(text).filter((s) => !ALONE_CROWD_INVENT.test(s));
  if (kept.length === 0) {
    return 'Nothing moves. Only your own footprints disturb the dust.';
  }
  return tidyClauses(kept.join(' '));
}

/**
 * When the interior map has door/stair links, scrub "one open room / no doors / only a gap" lies.
 */
const ONE_ROOM_MAP_LIE =
  /\b(?:only\s+(?:one|a\s+single)\s+(?:open\s+)?room|no\s+doors?\s+(?:intact|remain|left)|(?:there\s+are\s+)?no\s+hallways?|only\s+(?:a\s+)?(?:gap|crack)\s+in\s+the\s+(?:far\s+)?wall|nothing\s+but\s+(?:a\s+)?(?:gap|crack)\s+in\s+the\s+wall)\b/i;

export function scrubInteriorOneRoomLie(
  text: string,
  hasMappedDoorExits: boolean,
  adjacentRoomNames: string[] = []
): string {
  if (!hasMappedDoorExits || !text || !ONE_ROOM_MAP_LIE.test(text)) return text;
  const adj =
    adjacentRoomNames.length > 0
      ? adjacentRoomNames.slice(0, 3).join(', ')
      : 'mapped adjacent rooms';
  const kept = splitSentences(text).filter((s) => !ONE_ROOM_MAP_LIE.test(s));
  const bridge = `Doorways and corridors still link this floor to ${adj}.`;
  if (kept.length === 0) return bridge;
  return tidyClauses(`${kept.join(' ')} ${bridge}`);
}

/**
 * Scrub anthropomorphized locations (e.g., "the hall answers your question").
 * Locations are places, not speakers.
 */
const LOCATION_NOUNS =
  /\b(?:hall|room|chamber|corridor|passage|doorway|archway|stairway|vault|cellar|undercroft|atrium|nave|transept|gallery|balcony|landing|foyer|vestibule|alcove|niche|street|alley|square|plaza|courtyard|garden|field|path|road|bridge)\b/i;

const ANTHROPOMORPHIC_VERBS =
  /\b(?:answers?|responds?|replies?|says?|speaks?|tells?|asks?|demands?|insists?|suggests?|offers?|promises?|warns?|threatens?|whispers?|murmurs?|shouts?|calls?)\b/i;

export function scrubAnthropomorphizedLocation(text: string): string {
  if (!text) return text;
  
  // Pattern: "the [location] [verb]" where verb is typically human
  const anthropomorphicPattern = new RegExp(
    `(?:^|\\s)(?:[Tt]he|[Aa])\\s+(${LOCATION_NOUNS.source})\\s+(${ANTHROPOMORPHIC_VERBS.source})`,
    'g'
  );
  
  if (!anthropomorphicPattern.test(text)) return text;
  
  // Common cases:
  // "The hall answers your question" -> keep the descriptive part only
  // "The room responds with..." -> "The room reveals..."
  let next = text;
  
  // "The hall answers your question with..." -> strip the anthropomorphic phrasing
  next = next.replace(
    /\b[Tt]he\s+(\w+)\s+answers\s+your\s+question\s+with\s+its\s+(?:whole\s+)?(\w+)/gi,
    'The $1 reveals its $2'
  );
  
  // "The [location] answers" -> "The [location] is clear"
  next = next.replace(
    /\b[Tt]he\s+(\w+)\s+answers?(?:\s+(?:you|your\s+question|quickly|slowly|at\s+once))?(?:\.|\s*,|\s+with\b)/gi,
    (match, loc) => {
      if (/,$/.test(match)) return `The ${loc} shows you,`;
      if (/with\b/i.test(match)) return `The ${loc} reveals `;
      return `The ${loc} is clear.`;
    }
  );
  
  return tidyClauses(next);
}

/**
 * Scrub invented large crowd claims that contradict tracked presence.
 * Catches "hundred people", "fifty onlookers", etc. when scene has small group.
 */
export function scrubInventedCrowdSize(text: string, trackedCrowdSize: number): string {
  if (!text || trackedCrowdSize >= 20) return text; // Large crowds are allowed if tracked
  
  // Pattern: number + crowd words
  const largeNumber = /\b(?:dozens?|scores?|hundreds?|fifty|sixty|seventy|eighty|ninety|hundred|two hundred|three hundred)\s+(?:of\s+)?(?:people|figures|onlookers|bystanders|watchers|voices|hands|faces|souls|bodies)\b/gi;
  
  if (!largeNumber.test(text)) return text;
  
  // If tracked crowd is small (<=8), rewrite large crowd mentions
  const replacement = trackedCrowdSize <= 3 ? 'a few people' : 'several people';
  
  return text.replace(largeNumber, replacement);
}

/**
 * Calculate tracked crowd size from game state for consistency checking.
 */
export function calculateCrowdSize(state: GameState): number {
  const alone = state.openingEstablishment?.aloneArrival === true;
  if (alone && !state.activeEncounter) return 0;
  
  const present = state.sceneFacts?.present ?? [];
  const companions = state.companions?.length ?? 0;
  const encounter = state.activeEncounter ? 1 : 0;
  
  return Math.max(0, present.length + companions + encounter);
}

export function applyProseWarden(text: string, ctx?: ProseWardenContext): string {
  if (!text) return text;
  const alone = ctx?.aloneArrival === true;
  let next = scrubFigurePlaceholder(text, alone);
  next = scrubSomeoneNearbyPlaceholder(next, alone);
  next = scrubUiQuestVerbs(next, alone);
  next = scrubSpeakerPlaceholder(next, alone);
  next = scrubPrematureSecrets(next);
  next = scrubInventedAlonePresence(next, alone);
  next = scrubInteriorOneRoomLie(
    next,
    ctx?.hasMappedDoorExits === true,
    ctx?.adjacentRoomNames ?? []
  );
  next = scrubAnthropomorphizedLocation(next);
  next = scrubInventedCrowdSize(next, ctx?.crowdSize ?? 0);
  next = scrubLocationTautology(next, ctx?.currentLocation);
  next = scrubSpokenQuoteStart(next);
  next = scrubArticleCollisions(next);
  return next;
}
