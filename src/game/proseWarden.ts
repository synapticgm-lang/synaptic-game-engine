/**
 * Cheap post-writer English / UI-leak pass. Not a second model.
 * Fixes article collisions, bare "a figure" name-slots, leaked quest verbs,
 * location tautology, alone crowd invents, and interior one-room map lies.
 * There is no general "does this make sense" critic — that would be a second LLM.
 */

import type { GameState, Item } from './types';
import {
  scrubInventedEmptySearchLoot,
  scrubInventedWeapons,
} from './searchContinuity';

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

/** Names from scene props, containers, interactables, and floor loose items. */
export function collectSceneObjectNames(state: GameState): string[] {
  const names: string[] = [...(state.sceneFacts?.props ?? [])];
  for (const bag of state.containers ?? []) names.push(bag.name);
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name) names.push(it.name);
  }
  const dungeon = state.activeDungeon;
  const node = dungeon?.nodes.find((n) => n.id === dungeon.currentNodeId);
  for (const loose of node?.hidden?.looseItems ?? []) names.push(loose.label);
  return names;
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
  /** Crowd is present in scene facts (prevents empty/no-crowd contradictions). */
  crowdPresent?: boolean;
  
  // Pack 12 Extended Context
  currentTimeOfDay?: string;
  previousTimeOfDay?: string;
  isIndoor?: boolean;
  wasIndoor?: boolean;
  currentTension?: string;
  previousTension?: string;
  
  // Pack 13 Grammar Quality
  /** Enable LanguageTool grammar check (async, adds ~50-100ms). Default: true for High tier, false for Free/Mid. */
  enableGrammarCheck?: boolean;
  
  // Phase 1: Deterministic State Architecture
  /** Player inventory for invented container detection. */
  inventory?: Item[];
  /** Scene props / interactables / loose floor items — not inventory. */
  sceneProps?: string[];
  /** Last GM beat — speaker continuity scrub. */
  lastGmProse?: string;
  /** Named present NPCs from SNAPSHOT / sceneFacts. */
  presentNames?: string[];
  /** Empty-search targets — scrub invent loot on re-search. */
  searchedEmpty?: string[];
  /** Player input this turn (search continuity). */
  playerInput?: string;
  /** Grounded weapon names from inventory/props — scrub invent weapons. */
  groundedWeapons?: string[];
  /** PC name for possessive weapon scrub (Jax's dagger). */
  playerName?: string;
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

/**
 * Cheap Free-model English slips (no LanguageTool on Free).
 * "half an moments later" → "half a moment later"
 */
export function scrubFreeEnglishSlips(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bhalf an moments\b/gi, 'half a moment')
    .replace(/\bhalf an moment\b/gi, 'half a moment')
    .replace(/\ba few people still['’]s\b/gi, 'a few people still')
    .replace(/\ba few people still moves\b/gi, 'a few people still move');
}

/**
 * High-confidence only: last beat had an awake named speaker / dialogue, but this
 * beat opens on "cot-bound sleeper never stirs". Strip that orphan opener —
 * do not over-scrub general sleep imagery.
 */
export function scrubAwakeSpeakerAsSleeper(
  text: string,
  ctx?: { lastGmProse?: string; presentNames?: string[] }
): string {
  if (!text || !/cot-bound\s+sleeper/i.test(text)) return text;
  const last = (ctx?.lastGmProse ?? '').trim();
  if (!last) return text;
  const lastLower = last.toLowerCase();
  const names = (ctx?.presentNames ?? []).map((n) => n.trim()).filter((n) => n.length >= 2);
  const namedInLast = names.some((n) => lastLower.includes(n.toLowerCase()));
  const hadSpeech =
    /\b(?:says?|asks?|replies?|speaks?|demands?|wants a name|who are you|what(?:'s| is) your name)\b/i.test(
      last
    );
  if (!namedInLast && !hadSpeech) return text;
  return text
    .replace(
      /^(?:The\s+)?cot-bound\s+sleeper\s+never\s+stirs[^.?!]*[.?!]\s*/i,
      ''
    )
    .replace(
      /\b(?:The\s+)?cot-bound\s+sleeper\s+never\s+stirs\b/gi,
      'the attendant stays near'
    );
}

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
  const personSlot = alone ? 'the panel' : 'the stranger';
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
  const look = alone ? 'look to the panel' : 'look to the stranger';
  return text
    .replace(/\bunlock(?:s|ed|ing)?\s+someone(?:\s+nearby)?\b/gi, look)
    .replace(/\bunlock\s+(?:a|the)\s+(?:quest|journal|starter|guide\s*book)\b/gi, 'take the next step')
    .replace(/\bquest\s+unlocked\b/gi, 'a task comes into focus');
}

/** Soft name-slot must not act as a dialogue subject. */
export function scrubSomeoneNearbyPlaceholder(text: string, alone = false): string {
  if (!text || !/someone nearby/i.test(text)) return text;
  const role = alone ? 'the panel' : 'the stranger';
  const rolePoss = alone ? "the panel's" : "the stranger's";
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
 * "the stranger" is a scrub artifact that replaced person/role slots.
 * Fix it with contextual replacements — use present names, roles, or environment.
 */
export function scrubStrangerArtifact(
  text: string,
  presentNames: string[] = [],
  alone = false
): string {
  if (!text || !/\bthe stranger\b/i.test(text)) return text;
  
  // Collect context clues for replacement
  const namedPerson = presentNames.find(n => 
    n.length >= 2 && !/\b(?:you|your|panel|system|status)\b/i.test(n)
  );
  
  // Determine contextual replacement
  const replacement = (() => {
    if (namedPerson) return namedPerson.toLowerCase();
    if (alone) return 'the panel';
    // Scene-based fallback
    if (/\b(?:merchant|shopkeeper|clerk|vendor)\b/i.test(text)) return 'the merchant';
    if (/\b(?:guard|sentry|watch|soldier)\b/i.test(text)) return 'the guard';
    if (/\b(?:innkeeper|bartender|server)\b/i.test(text)) return 'the innkeeper';
    if (/\b(?:priest|chanter|cleric)\b/i.test(text)) return 'the priest';
    if (/\b(?:captain|sergeant|officer)\b/i.test(text)) return 'the officer';
    // Generic fallback
    return 'them';
  })();
  
  let next = text;
  
  // Fix possessive: "the stranger's" → "their" or named possessive
  const possessiveRepl = namedPerson 
    ? `${namedPerson.toLowerCase()}'s` 
    : (replacement === 'them' ? 'their' : `${replacement}'s`);
  next = next.replace(/\bthe stranger(?:'s|'s)\b/gi, possessiveRepl);
  
  // Fix subject usage: "the stranger X" where X is verb
  if (replacement !== 'them') {
    next = next.replace(/\bthe stranger\b/gi, replacement);
  } else {
    // "the stranger" → "them" requires rephrasing to avoid grammar break
    next = next.replace(/\bthe stranger\s+(is|was|seems?|appears?|stands?|sits?|waits?|watches?)\b/gi, 'they $1');
    next = next.replace(/\bthe stranger\b/gi, 'them');
  }
  
  // Fix article collisions that may have been created
  next = next.replace(/\b(?:a|an)\s+them\b/gi, 'them');
  next = next.replace(/\bthe\s+them\b/gi, 'them');
  // Subject-verb after figure→them scrub
  next = next.replace(/\bthem\s+(feels?|seems?|appears?|looks?|stands?|sits?|waits?)\b/gi, 'they $1');
  next = next.replace(/\bthem\s+(is|was)\b/gi, 'they $1');
  
  return next;
}

/** Fix mid-sentence lowercase "your eyes" NPC slips and orphan "them" subjects. */
export function scrubPronounSubjectSlips(text: string): string {
  if (!text) return text;
  let next = text;
  next = next.replace(/([.!?]\s+)your eyes\b/g, '$1Their eyes');
  next = next.replace(/\bthem feels\b/gi, 'it feels');
  next = next.replace(/\bthem emerges\b/gi, 'they emerge');
  next = next.replace(/\bthem emerge\b/gi, 'they emerge');
  next = next.replace(/\bAsk about them\b/gi, 'Ask about it');
  next = next.replace(/\bExamine them\b(?!\s+\w)/gi, 'Examine it');
  next = next.replace(/\bFocus on them\b/gi, 'Focus on it');
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
 * Also catches contradictory "empty" / "no crowd" when crowd is tracked as present.
 */
export function scrubInventedCrowdSize(text: string, trackedCrowdSize: number, crowdPresent?: boolean): string {
  if (!text) return text;
  
  // If crowd is present, scrub contradictory "empty" / "no crowd" claims
  if (crowdPresent) {
    const EMPTY_CLAIMS = /\b((?:the )?(?:square|street|room|hall|place) is (?:empty|deserted)|no (?:one|people|crowd|voices)|(?:empty|deserted) (?:square|street|room|hall))\b/gi;
    if (EMPTY_CLAIMS.test(text)) {
      text = text.replace(EMPTY_CLAIMS, (match) => {
        if (/no (?:one|people|crowd)/i.test(match)) return 'a few people still';
        if (/no voices/i.test(match)) return 'quiet voices';
        return 'a handful of people in the $1'.replace('$1', match.match(/(?:square|street|room|hall|place)/i)?.[0] || 'area');
      });
    }
  }
  
  if (trackedCrowdSize >= 20) return text; // Large crowds are allowed if tracked
  
  // Pattern: number + crowd words
  const largeNumber = /\b(?:dozens?|scores?|hundreds?|fifty|sixty|seventy|eighty|ninety|hundred|two hundred|three hundred)\s+(?:of\s+)?(?:people|figures|onlookers|bystanders|watchers|voices|hands|faces|souls|bodies)\b/gi;
  
  if (!largeNumber.test(text)) return text;
  
  // If tracked crowd is small (<=8), rewrite large crowd mentions
  const replacement = trackedCrowdSize <= 3 ? 'a few people' : 'several people';
  
  return text.replace(largeNumber, replacement);
}

/**
 * Pack 12 Extended Validation: Time Skip
 * Scrubs "hours later" / "next morning" unless time of day actually changed.
 */
export function scrubInventedTimeSkip(text: string, currentTime?: string, prevTime?: string): string {
  if (!text || !currentTime || currentTime === 'unknown') return text;
  
  const TIME_SKIP_PATTERNS = /\b(hours? (?:later|pass(?:es|ed)?|ago)|next (?:morning|day|evening)|(?:that|the) (?:evening|afternoon|night)|by (?:morning|evening|nightfall)|(?:much|some) (?:time|while) (?:later|passes))\b/i;
  
  if (!TIME_SKIP_PATTERNS.test(text)) return text;
  
  // Allow if time actually changed
  if (prevTime && prevTime !== 'unknown' && currentTime !== prevTime) return text;
  
  // Scrub invented time skip
  return text.replace(
    /\b(hours? (?:later|pass(?:es|ed)?)|next (?:morning|day)|(?:that|the) (?:evening|afternoon))\b/gi,
    'moments later'
  ).replace(
    /\b(much|some) (?:time|while) (?:later|passes)\b/gi,
    'a moment later'
  );
}

/**
 * Pack 12 Extended Validation: Indoor/Outdoor
 * Scrubs "you step outside" if location is marked interior and player didn't use an exit.
 */
export function scrubInventedLocationChange(text: string, isIndoor?: boolean, wasIndoor?: boolean): string {
  if (!text || isIndoor === undefined) return text;
  
  const OUTDOOR_TRANSITIONS = /\b(you (?:step|walk|go|move|head) (?:outside|outdoors|into (?:the )?(?:street|open air|sunlight|rain))|(?:exit(?:ing)?|leav(?:e|ing)) (?:the )?(?:building|room|hall))\b/i;
  const INDOOR_TRANSITIONS = /\b(you (?:step|walk|go|move|enter) (?:inside|indoors|into (?:the )?(?:building|room|hall)))\b/i;
  
  // Scrub outdoor transition if we're still indoors
  if (isIndoor && OUTDOOR_TRANSITIONS.test(text)) {
    return text.replace(OUTDOOR_TRANSITIONS, 'you move forward');
  }
  
  // Scrub indoor transition if we're still outdoors
  if (isIndoor === false && INDOOR_TRANSITIONS.test(text)) {
    return text.replace(INDOOR_TRANSITIONS, 'you continue');
  }
  
  return text;
}

/**
 * Pack 12 Extended Validation: Tension
 * Scrubs "calm settles" or "danger passes" if tension state didn't actually change.
 */
export function scrubInventedTensionChange(text: string, currentTension?: string, prevTension?: string): string {
  if (!text || !currentTension || currentTension === 'unknown') return text;
  
  const CALM_CLAIMS = /\b((?:the )?(?:danger|threat|tension) (?:passes|fades|recedes|lifts)|calm (?:settles|returns)|(?:you|the room|the hall) relax(?:es)?)\b/i;
  const DANGER_CLAIMS = /\b(danger (?:arrives|emerges|appears)|(?:the )?threat (?:materializes|looms|closes in)|tension (?:spikes|rises))\b/i;
  
  // Allow if tension actually changed
  if (prevTension && prevTension !== 'unknown' && currentTension !== prevTension) return text;
  
  // Scrub calm claims if tension is still high
  if ((currentTension === 'danger' || currentTension === 'combat') && CALM_CLAIMS.test(text)) {
    return text.replace(CALM_CLAIMS, 'the moment holds');
  }
  
  // Scrub danger claims if tension is still calm
  if (currentTension === 'calm' && DANGER_CLAIMS.test(text)) {
    return text.replace(DANGER_CLAIMS, 'something shifts');
  }
  
  return text;
}

const CONTAINER_KIND = /box|crate|chest|pouch|bag|sack|barrel|trunk/;

function collectContainerTypes(inventory: Item[], extraNames: string[]): Set<string> {
  const containerTypes = new Set<string>();
  const addFrom = (name: string) => {
    const n = name.toLowerCase();
    if (/box/.test(n)) containerTypes.add('box');
    if (/crate/.test(n)) containerTypes.add('crate');
    if (/chest/.test(n)) containerTypes.add('chest');
    if (/pouch/.test(n)) containerTypes.add('pouch');
    if (/bag/.test(n)) containerTypes.add('bag');
    if (/sack/.test(n)) containerTypes.add('sack');
    if (/barrel/.test(n)) containerTypes.add('barrel');
    if (/trunk/.test(n)) containerTypes.add('trunk');
  };
  for (const item of inventory) addFrom(item.name);
  for (const extra of extraNames) addFrom(extra);
  return containerTypes;
}

/**
 * Phase 1: Scrub invented prior containers that don't exist in inventory/scene.
 * Catches: "last box", "final crate", "remaining chest", etc.
 */
export function scrubInventedContainers(
  text: string,
  inventory: Item[] = [],
  extraNames: string[] = [],
): string {
  if (!text || !CONTAINER_KIND.test(text)) return text;

  const containerTypes = collectContainerTypes(inventory, extraNames);

  if (containerTypes.size === 0) {
    return text.replace(
      /\b(?:the\s+)?(?:last|final|remaining|other|another)\s+(box(?:es)?|crate(?:s)?|chest(?:s)?|pouch(?:es)?|bag(?:s)?|sack(?:s)?|barrel(?:s)?|trunk(?:s)?)\b/gi,
      'the area'
    );
  }

  return text.replace(
    /\b(last|final|remaining|other)\s+(box(?:es)?|crate(?:s)?|chest(?:s)?|pouch(?:es)?|bag(?:s)?|sack(?:s)?|barrel(?:s)?|trunk(?:s)?)\b/gi,
    (match, modifier, container) => {
      const singular = container.replace(/e?s$/, '').toLowerCase();
      if (!containerTypes.has(singular)) {
        return 'the area';
      }
      if (
        modifier.toLowerCase() === 'remaining'
        || modifier.toLowerCase() === 'last'
        || modifier.toLowerCase() === 'final'
      ) {
        return `the ${singular}`;
      }
      return match;
    }
  );
}

/**
 * Synchronous prose warden - fast regex-based fixes.
 * Use this for immediate, in-memory corrections.
 */
export function applyProseWarden(text: string, ctx?: ProseWardenContext): string {
  if (!text) return text;
  const alone = ctx?.aloneArrival === true;
  let next = scrubFigurePlaceholder(text, alone);
  next = scrubSomeoneNearbyPlaceholder(next, alone);
  next = scrubUiQuestVerbs(next, alone);
  next = scrubSpeakerPlaceholder(next, alone);
  next = scrubStrangerArtifact(next, ctx?.presentNames ?? [], alone);
  next = scrubPrematureSecrets(next);
  next = scrubInventedAlonePresence(next, alone);
  next = scrubInteriorOneRoomLie(
    next,
    ctx?.hasMappedDoorExits === true,
    ctx?.adjacentRoomNames ?? []
  );
  next = scrubAnthropomorphizedLocation(next);
  next = scrubInventedCrowdSize(next, ctx?.crowdSize ?? 0, ctx?.crowdPresent);
  next = scrubInventedContainers(next, ctx?.inventory ?? [], ctx?.sceneProps ?? []);
  next = scrubInventedEmptySearchLoot(next, ctx?.searchedEmpty ?? [], ctx?.playerInput);
  next = scrubInventedWeapons(next, ctx?.groundedWeapons ?? [], 'bare hands', ctx?.playerName);
  next = scrubInventedTimeSkip(next, ctx?.currentTimeOfDay, ctx?.previousTimeOfDay);
  next = scrubInventedLocationChange(next, ctx?.isIndoor, ctx?.wasIndoor);
  next = scrubInventedTensionChange(next, ctx?.currentTension, ctx?.previousTension);
  next = scrubLocationTautology(next, ctx?.currentLocation);
  next = scrubAwakeSpeakerAsSleeper(next, {
    lastGmProse: ctx?.lastGmProse,
    presentNames: ctx?.presentNames,
  });
  next = scrubFreeEnglishSlips(next);
  next = scrubSpokenQuoteStart(next);
  next = scrubArticleCollisions(next);
  next = scrubPronounSubjectSlips(next);
  return next;
}

/**
 * Async prose warden - includes grammar checking via LanguageTool.
 * Use this for full quality pass (adds ~50-100ms).
 */
export async function applyProseWardenAsync(text: string, ctx?: ProseWardenContext): Promise<string> {
  // First apply all fast regex rules
  let next = applyProseWarden(text, ctx);
  
  // Then apply grammar check if enabled
  if (ctx?.enableGrammarCheck !== false) {
    try {
      const { quickGrammarCheck } = await import('./grammarCheck');
      next = await quickGrammarCheck(next);
    } catch (error) {
      console.error('[proseWarden] Grammar check failed:', error);
      // Silent failure - return regex-fixed version
    }
  }
  
  return next;
}
