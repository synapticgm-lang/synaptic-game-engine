/**
 * Cheap post-writer English / UI-leak pass. Not a second model.
 * Fixes article collisions, bare "a figure" name-slots, leaked quest verbs,
 * location tautology, alone crowd invents, and interior one-room map lies.
 * There is no general "does this make sense" critic — that would be a second LLM.
 */

import type { GameState, Item } from './types';
import { playerTypedDialogue } from './intentParser';
import {
  scrubInventedEmptySearchLoot,
  scrubInventedWeapons,
} from './searchContinuity';
import { scrubInventedCrowdSize } from './crowdAuthority';
import { rewriteChromePersonClauses } from './chromeAuthority';
import { scrubHookReversals, type HookLock } from './hookLock';
import { scrubBeastifiedHumanoid, scrubDeniedKill, type LastKill } from './combatAuthority';

export { calculateCrowdSize, crowdSizeForWarden, scrubInventedCrowdSize } from './crowdAuthority';

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
  /** 29b — player exit/flee authority this turn; do not scrub outdoor transitions. */
  exitNarrated?: boolean;
  /** Other named places (hubs / atlas) — dual-location scrub. */
  knownPlaces?: string[];
  /** Live ledger encounter — skip unearned-victory scrub. */
  hasLiveEncounter?: boolean;
  /** Encounter cleared this turn — allow victory language. */
  recentlyClearedEncounter?: boolean;
  /** Auto-fight / terminal last kill — deny-loot scrub. */
  lastKill?: LastKill | null;
  /** Live or just-cleared enemy name — humanoid body lock. */
  enemyName?: string;
  /** Locked why-you’re-here — rewrite accident ↛ pawn (and reverse). */
  hookLock?: HookLock;
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
    .replace(/\b(?:you\s+carry|carries)\s+the\s+a\s+figure\b/gi, alone ? 'you carry the sealed bag' : 'you carry the sign')
    .replace(/\ba\s+figure\s+is\s+not\b/gi, 'that mark is not')
    .replace(/\bthe\s+a\s+figure\b/gi, personSlot)
    .replace(/\b(?:the\s+)?(?:glowing\s+)?a figure\b/gi, (hit) =>
      /glowing/i.test(hit) ? (alone ? 'the glowing panel' : personSlot) : personSlot
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
 * 29d: ONLY replace with a present named person or alone→panel.
 * Never invent merchant/guard from keyword scan of the whole beat (Gemini mush).
 */
export function scrubStrangerArtifact(
  text: string,
  presentNames: string[] = [],
  alone = false
): string {
  if (!text || !/\bthe stranger\b/i.test(text)) return text;

  const namedPerson = presentNames.find(
    (n) =>
      n.length >= 2
      && !/\b(?:you|your|panel|system|status)\b/i.test(n)
      && !/^(bystanders?|handlers?|onlookers?|watchers?|crowd|people|voices)$/i.test(n)
  );

  const replacement = (() => {
    if (namedPerson) return namedPerson;
    if (alone) return 'the panel';
    return 'the stranger';
  })();

  if (replacement === 'the stranger') return text;

  let next = text;
  const possessiveRepl = namedPerson ? `${namedPerson}'s` : `${replacement}'s`;
  next = next.replace(/\bthe stranger(?:'s|’s)\b/gi, possessiveRepl);
  next = next.replace(/\bthe stranger\b/gi, replacement);

  return next;
}

/**
 * 29d — unearned victory when no live encounter (and not just cleared).
 * Soften absolute win language so the GM cannot auto-win outside the ledger.
 */
export function scrubUnearnedVictory(
  text: string,
  opts?: { hasLiveEncounter?: boolean; recentlyCleared?: boolean }
): string {
  if (!text || opts?.hasLiveEncounter || opts?.recentlyCleared) return text;
  let next = text;
  next = next.replace(
    /\byou (?:easily )?(?:defeat|defeated|slay|slew|slain|kill|killed|vanquish|vanquished)\b/gi,
    'you drive back'
  );
  next = next.replace(
    /\b(?:the enemy|the foe|your opponent) (?:falls|collapses|dies|is dead|is defeated)\b/gi,
    'the threat falters'
  );
  next = next.replace(/\byou win the (?:fight|battle|skirmish)\b/gi, 'you hold your ground');
  next = next.replace(/\bvictory is (?:yours|assured)\b/gi, 'the moment hangs unresolved');
  return next;
}

/**
 * Kill unresolved placeholder nouns left by claim-scrub / bad generation
 * ("this place", orphan "them", "imposing this place").
 */
export function scrubPlaceholderNouns(text: string, currentLocation?: string): string {
  if (!text) return text;
  const loc = (currentLocation ?? '').trim();
  const locShort = loc
    ? loc.replace(/^(the\s+)/i, '').split(/[,—–-]/)[0]!.trim().slice(0, 48)
    : '';
  const place = locShort ? `the ${locShort}` : 'the building';
  let next = text;
  next = next.replace(/\bthe imposing this place\b/gi, `the imposing mass of ${place}`);
  next = next.replace(/\bstructure of this place\b/gi, `structure of ${place}`);
  next = next.replace(/\bspires of this place\b/gi, `spires of ${place}`);
  next = next.replace(/\bedifice of this place\b/gi, `edifice of ${place}`);
  next = next.replace(/\bgrand entrance of this place\b/gi, `grand entrance of ${place}`);
  next = next.replace(/\bApproach this place\b/gi, `Approach ${place}`);
  next = next.replace(/\btowards? this place\b/gi, `toward ${place}`);
  next = next.replace(/\bback towards? this place\b/gi, `back toward ${place}`);
  // Orphan object "them" (not "ask them" / "tell them" / "with them").
  next = next.replace(/\bpresence of them\b/gi, 'presence ahead');
  next = next.replace(/\bopen them\b/gi, 'the open way');
  next = next.replace(/\bassume is them\b/gi, 'assume lies ahead');
  next = next.replace(/\brumored them\b/gi, 'rumored place');
  next = next.replace(/\bcluster of them\b/gi, 'cluster of debris');
  next = next.replace(/\bsurfaces of them\b/gi, 'surfaces of the items');
  next = next.replace(/\btwo them\b/gi, 'two items');
  next = next.replace(/\bfour them\b/gi, 'four items');
  next = next.replace(/\bthree them\b/gi, 'three items');
  next = next.replace(/\ba few them\b/gi, 'a few items');
  // Rarity-tagged inventory mush: "[Uncommon] them" (count forms first).
  next = next.replace(
    /\b(two|three|four|several)\s+\[(Common|Uncommon|Rare|Epic|Legendary|Unique)\]\s+them\b/gi,
    '$1 [$2] items'
  );
  next = next.replace(
    /\[(Common|Uncommon|Rare|Epic|Legendary|Unique)\]\s+them\b/gi,
    '[$1] item'
  );
  next = next.replace(/\bCheck your them\b/gi, 'Check your items');
  next = next.replace(/\bExamine (?:your )?them clues\b/gi, 'Examine the clues');
  next = next.replace(/\bInspect them\b(?!\s+\w)/gi, 'Inspect it');
  next = next.replace(/\bPick up them\b/gi, 'Pick it up');
  next = next.replace(/\bof them in your (bag|pack|pockets?)\b/gi, 'of your items in your $1');
  next = next.replace(/\bthe them\b/gi, 'them');
  next = next.replace(/\b(?:a|an)\s+them\b/gi, 'someone');
  next = next.replace(/\breads\s+['']them\s*[-–—]\s*them['']/gi, "reads a worn brass nameplate");
  return next;
}

/** Fix mid-sentence lowercase "your eyes" NPC slips and orphan "them" subjects. */
export function scrubPronounSubjectSlips(text: string): string {
  if (!text) return text;
  let next = text;
  next = next.replace(/([.!?]\s+)your eyes\b/g, '$1Their eyes');
  // NPC agent + your body kit (perspective over-rewrite).
  next = next.replace(
    /\b(He|She)\s+((?:[^.]|\.(?!\s)){0,120}?)\byour (head|eyes|face|hand|hands|shoulders?|gaze)\b/gi,
    (_m, who: string, mid: string, body: string) => {
      const poss = String(who).toLowerCase() === 'she' ? 'her' : 'his';
      return `${who} ${mid}${poss} ${body}`;
    }
  );
  next = next.replace(
    /\b(They)\s+((?:[^.]|\.(?!\s)){0,120}?)\byour (head|eyes|face|hand|hands|shoulders?|gaze)\b/gi,
    (_m, who: string, mid: string, body: string) => `${who} ${mid}their ${body}`
  );
  next = next.replace(/\btilted your head\b/gi, 'tilted their head');
  next = next.replace(/\binclines? your head\b/gi, 'inclines their head');
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
 * 29b — skip outdoor scrub when exitAuthority / exitNarrated is set.
 */
export function scrubInventedLocationChange(
  text: string,
  isIndoor?: boolean,
  wasIndoor?: boolean,
  exitNarrated?: boolean
): string {
  if (!text || isIndoor === undefined) return text;
  if (exitNarrated) return text;

  const OUTDOOR_TRANSITIONS = /\b(you (?:step|walk|go|move|head) (?:outside|outdoors|into (?:the )?(?:street|open air|sunlight|rain))|(?:exit(?:ing)?|leav(?:e|ing)) (?:the )?(?:building|room|hall))\b/i;
  const INDOOR_TRANSITIONS = /\b(you (?:step|walk|go|move|enter) (?:inside|indoors|into (?:the )?(?:building|room|hall)))\b/i;

  // Scrub outdoor transition if we're still indoors
  if (isIndoor && OUTDOOR_TRANSITIONS.test(text)) {
    return text.replace(OUTDOOR_TRANSITIONS, 'you move forward');
  }

  // Scrub indoor transition if we're still outdoors (snap-back after exit)
  if (isIndoor === false && INDOOR_TRANSITIONS.test(text)) {
    return text.replace(INDOOR_TRANSITIONS, 'you continue');
  }

  return text;
}

/**
 * Batch D — one camera per beat. Fallback/fail paths sometimes stack
 * "At Lowmarket…" with "At the Weighing Cup…" or dual place openings.
 * Keep the committed currentLocation framing; demote other place openings.
 */
export function scrubDualLocationOpenings(
  text: string,
  currentLocation?: string,
  knownPlaces: string[] = []
): string {
  if (!text || !currentLocation?.trim()) return text;
  const loc = currentLocation.trim();
  const others = knownPlaces
    .map((p) => p.trim())
    .filter((p) => p.length >= 3 && p.toLowerCase() !== loc.toLowerCase());
  if (!others.length && !/^At\s+/im.test(text)) return text;

  let next = text;
  // Collapse repeated "At X," openings when X is not current location
  const atOpen = /^At\s+([^,—.\n]{2,60})\s*[,—]/gim;
  next = next.replace(atOpen, (full, place: string) => {
    const p = String(place ?? '').trim();
    if (!p) return full;
    if (p.toLowerCase() === loc.toLowerCase() || loc.toLowerCase().includes(p.toLowerCase())) {
      return full;
    }
    if (
      others.some(
        (o) =>
          o.toLowerCase() === p.toLowerCase() ||
          p.toLowerCase().includes(o.toLowerCase()) ||
          o.toLowerCase().includes(p.toLowerCase())
      )
    ) {
      return `Still at ${loc},`;
    }
    return full;
  });

  // Second sentence that teleports: "… Cup. At Lowmarket, Void-Touched…"
  for (const other of others) {
    const esc = other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dual = new RegExp(
      `([.!?])\\s+At\\s+${esc}\\b`,
      'gi'
    );
    if (dual.test(next) && new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(next)) {
      next = next.replace(dual, `$1 Still here,`);
    }
  }

  // "in Lowmarket … at the Weighing Cup" same-beat without travel
  if (others.length && new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(next)) {
    for (const other of others) {
      const esc = other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const teleport = new RegExp(
        `\\b(?:you (?:are|stand|arrive|find yourself) (?:at|in) (?:the )?${esc}|at (?:the )?${esc}(?:,|\\s+(?:the|a|an|void|pact|skirmish)))`,
        'gi'
      );
      next = next.replace(teleport, (m) => {
        if (new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(m)) return m;
        return m.replace(new RegExp(esc, 'i'), loc);
      });
    }
  }

  return next;
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
 * Strip leaked safer-scene rewrite meta from GM story (any object, not panel-only).
 * Owner: player-agency / rewrite path — crowd-count agent should keep `scrubInventedCrowdSize`.
 */
export function scrubSaferSceneMeta(text: string): string {
  if (!text) return text;
  let next = text;
  next = next.replace(
    /["'“]I scan[\s\S]{0,80}before committing["'”][,.]?\s*(?:you state[,.]?\s*)?/gi,
    ''
  );
  next = next.replace(
    /["'“]?if none is present[,.]?\s*I stay alert and choose a safer scene action\.?["'”]?/gi,
    ''
  );
  next = next.replace(/\bI scan(?:\s+\w+){0,8}\s+before committing\b[,.]?/gi, '');
  next = next.replace(/\bchoose a safer scene action\b[,.]?/gi, '');
  next = next.replace(/\bif none is present\b[,.]?/gi, '');
  next = next.replace(/\bstay alert and choose a safer\b[\s\S]{0,24}/gi, '');
  next = next.replace(/\bbefore committing\b/gi, '');
  return tidyClauses(next);
}

/**
 * If the player did not speak (no quotes / say / ask / talk), do not narrate the act as dialogue.
 */
export function scrubFalseSpokenAction(text: string, playerInput?: string): string {
  if (!text) return text;
  if (playerTypedDialogue(playerInput ?? '')) return text;
  let next = text;
  next = next.replace(
    /["'“]([^"'”]{8,160})["'”]\s*,?\s*you state\b([^.]{0,80})[,.]?\s*["'“]([^"'”]{8,160})["'”]/gi,
    (_, a: string, _mid: string, b: string) => `${String(a).trim()} ${String(b).trim()}`
  );
  next = next.replace(
    /["'“]([^"'”]{8,200})["'”]\s*,?\s*you state\b[^.]{0,100}\./gi,
    (_, quoted: string) => `${String(quoted).trim()}.`
  );
  next = next.replace(/\byou state,\s*your voice[^,]{0,80},\s*/gi, '');
  next = next.replace(/\byou state\b/gi, 'you act');
  next = next.replace(/\byou declare\b/gi, 'you move');
  next = next.replace(/\byou announce\b/gi, 'you act');
  return tidyClauses(next);
}

/**
 * UI chrome + cover-slot dummy names are not people.
 * Rewrites chrome-as-person: posture clauses, dialogue tags (states/says/their voice),
 * and want/need. Hum of the panel stays. Handlers never become the speaker name.
 */
export function scrubChromeAsPerson(text: string, presentNames: string[] = []): string {
  return tidyClauses(rewriteChromePersonClauses(text, presentNames));
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
  next = scrubChromeAsPerson(next, ctx?.presentNames ?? []);
  next = scrubStrangerArtifact(next, ctx?.presentNames ?? [], alone);
  next = scrubUnearnedVictory(next, {
    hasLiveEncounter: ctx?.hasLiveEncounter === true,
    recentlyCleared: ctx?.recentlyClearedEncounter === true,
  });
  next = scrubPlaceholderNouns(next, ctx?.currentLocation);
  next = scrubPrematureSecrets(next);
  next = scrubInventedAlonePresence(next, alone);
  next = scrubInteriorOneRoomLie(
    next,
    ctx?.hasMappedDoorExits === true,
    ctx?.adjacentRoomNames ?? []
  );
  next = scrubAnthropomorphizedLocation(next);
  next = scrubInventedCrowdSize(next, ctx?.crowdSize ?? 0, ctx?.crowdPresent);
  next = scrubHookReversals(next, ctx?.hookLock);
  next = scrubSaferSceneMeta(next);
  next = scrubFalseSpokenAction(next, ctx?.playerInput);
  next = scrubInventedContainers(next, ctx?.inventory ?? [], ctx?.sceneProps ?? []);
  next = scrubInventedEmptySearchLoot(next, ctx?.searchedEmpty ?? [], ctx?.playerInput);
  next = scrubInventedWeapons(next, ctx?.groundedWeapons ?? [], 'bare hands', ctx?.playerName);
  next = scrubBeastifiedHumanoid(next, ctx?.enemyName);
  next = scrubDeniedKill(next, ctx?.lastKill);
  next = scrubInventedTimeSkip(next, ctx?.currentTimeOfDay, ctx?.previousTimeOfDay);
  next = scrubInventedLocationChange(next, ctx?.isIndoor, ctx?.wasIndoor, ctx?.exitNarrated);
  if (!ctx?.exitNarrated) {
    next = scrubDualLocationOpenings(next, ctx?.currentLocation, ctx?.knownPlaces ?? []);
  }
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
