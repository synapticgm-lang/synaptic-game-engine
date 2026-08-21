/**
 * Cheap post-writer English / UI-leak pass. Not a second model.
 * Fixes article collisions, bare "a figure" name-slots, leaked quest verbs,
 * and location tautology ("in the court … of a nearby building").
 * There is no general "does this make sense" critic — that would be a second LLM.
 */

export type ProseWardenContext = {
  currentLocation?: string;
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
export function scrubFigurePlaceholder(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bthe\s+glowing\s+a\s+figure\b/gi, 'the glowing mark')
    .replace(/\bglowing\s+a\s+figure\b/gi, 'glowing mark')
    .replace(/\bthe\s+war\s+with\s+(?:the\s+)?a\s+figure\b/gi, 'the war')
    .replace(/\b(?:you\s+carry|carries)\s+the\s+a\s+figure\b/gi, 'you carry the mark')
    .replace(/\ba\s+figure\s+is\s+not\b/gi, 'that mark is not')
    .replace(/\bthe\s+a\s+figure\b/gi, 'the speaker')
    .replace(/\b(?:the\s+)?(?:glowing\s+)?a figure\b/gi, (hit) =>
      /glowing/i.test(hit) ? 'the glowing mark' : 'the speaker'
    );
}

/** UI / journal verbs must not be spoken in-world. */
export function scrubUiQuestVerbs(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bunlock(?:s|ed|ing)?\s+someone(?:\s+nearby)?\b/gi, 'look to the speaker')
    .replace(/\bunlock\s+(?:a|the)\s+(?:quest|journal|starter|guide\s*book)\b/gi, 'take the next step')
    .replace(/\bquest\s+unlocked\b/gi, 'a task comes into focus');
}

/** Soft name-slot must not act as a dialogue subject. */
export function scrubSomeoneNearbyPlaceholder(text: string): string {
  if (!text || !/someone nearby/i.test(text)) return text;
  return text
    .replace(/\bsomeone nearby(?:'s|’s)\b/gi, "the speaker's")
    .replace(/\bsomeone nearby\s+(does|doesn't|does not|did|said|states?|turns?|inclines?|remains?|stands?|listens?|regards?|gestures?|speaks?|asks?|replies?|nods?)\b/gi, 'the speaker $1')
    .replace(/\b(?:the\s+)?someone nearby\b/gi, 'the speaker');
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

export function applyProseWarden(text: string, ctx?: ProseWardenContext): string {
  if (!text) return text;
  let next = scrubFigurePlaceholder(text);
  next = scrubSomeoneNearbyPlaceholder(next);
  next = scrubUiQuestVerbs(next);
  next = scrubPrematureSecrets(next);
  next = scrubLocationTautology(next, ctx?.currentLocation);
  next = scrubSpokenQuoteStart(next);
  next = scrubArticleCollisions(next);
  return next;
}
