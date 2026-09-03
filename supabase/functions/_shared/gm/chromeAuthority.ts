/**
 * Site-wide: UI chrome and opening cover slots are not people.
 * Blue panel / System / Place / Registration / Eye Level never enter present[],
 * choice talk-pads, image presence, or GM roster — opening + later, all modes.
 */

const COVER_SLOT_EXACT =
  /^(place|name|look|kit|wear|where|origin|appearance|designation|folk|species)$/i;

const UI_CHROME_EXACT =
  /^(blue panel|system panel|blue screen|panel|system|status|quest|bag|registration|registration incomplete|status window|system ping|system wallpaper|eye level|your palm|official|speaker)$/i;

const CHROME_HEAD =
  '(?:the\\s+)?(?:blue\\s+system\\s+panel|blue\\s+panel|system\\s+panel|blue\\s+screen|panel|system|official|speaker|registration)';

/** Prop / UI noun that may hum or hang — never a dialogue subject. */
const CHROME_NOUN =
  '(?:the\\s+)?(?:blue\\s+system\\s+panel|system\\s+panel|blue\\s+panel|blue\\s+screen|panel|system|registration)';

const SPEECH_VERB =
  '(?:states?|says?|said|asks?|asked|replies?|replied|whisper(?:s|ed)?|murmur(?:s|ed)?|tells?|told|speaks?|spoke|declares?|announces?|intones?)';

const SLOT_NAME =
  '(?:Place|Name|Look|Kit|Wear|Where|Origin|Appearance|Designation|Registration|System|Status|Eye\\s+Level|Your\\s+Palm)';

const BODY_CUE =
  /\b(?:his|her|their)\s+(?:posture|voice|bearing|gaze|face|hands?|shoulders?)|\b(?:he|she|they)\s+(?:remain|remains|stands?|says?|asks?|watches?|turns?|gestures?|speaks?)|\b(?:remain|remains|stands?)\s+(?:at|in|by|near)\b/i;

export function normalizeChromeToken(raw: string): string {
  return (raw ?? '')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCoverSlotLabel(token: string): boolean {
  return COVER_SLOT_EXACT.test(normalizeChromeToken(token));
}

export function isUiChromeNoun(token: string): boolean {
  const t = (token ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return UI_CHROME_EXACT.test(t) || UI_CHROME_EXACT.test(normalizeChromeToken(t));
}

/** True when a present[] / roster / pin token is chrome or a cover-slot dummy name. */
export function isChromePersonToken(token: string): boolean {
  const t = (token ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return isCoverSlotLabel(t) || isUiChromeNoun(t);
}

/**
 * Polity / faction / hub / settlement names are places — never person slots.
 * "Pellane" in present[] → "the Pellane" contagion (critic Batch B).
 */
const POLITY_FACTION_PLACE_EXACT =
  /^(pellane|pellane crown|ash court|the ash court|valespire|lowmarket|west wall|the weighing cup|weighing cup|contract hall|cathedral close|cinderflow|cinderflow road|harbor quay|pellane war camp|war camp|kitchen saint|kitchen saint alley|palace approach|circle|sevenfold circle|the sevenfold circle|scattered scale|the scattered scale|pactborn|calamity mark|highmark|nowhere)$/i;

const POLITY_FACTION_PLACE_HEAD =
  /^(?:the\s+)?(?:pellane(?:\s+crown)?|ash\s+court|valespire|lowmarket|weighing\s+cup|contract\s+hall|cathedral\s+close|cinderflow(?:\s+road)?|harbor\s+quay|war\s+camp|kitchen\s+saint(?:\s+alley)?|palace\s+approach|scattered\s+scale|sevenfold\s+circle)\b/i;

/**
 * Choice-pad / pronoun tokens that must never become present[] person slots.
 * Transcript T22: "They" / "One" / "Press" harvested from pad text ("Press for leverage").
 * Batch T: Ascend/Draw/Intervene/Peer/Give + spatial deixis (Ahead/Behind/…).
 * Batch 02f P0-3: Added "They" (pronoun harvest) and "Child" (generic descriptor).
 */
const CHOICE_PAD_PERSON_EXACT =
  /^(they|them|their|theirs|one|ones|press|wait|ready|scout|inspect|check|ask|talk|leave|open|hold|attempt|continue|fate|options?|leverage|attack|flee|parley|status|travel|engage|examine|observe|approach|remain|ignore|demand|listen|walk|run|duck|slip|scan|search|unroll|unfold|show|call|try|keep|find|push|dash|meet|state|provide|inquire|step|turn|maintain|focus|move|glance|ascend|draw|intervene|peer|give|ahead|behind|beside|nearby|above|below|left|right|forward|back|around|here|there|child|easy|fine|don|traveler|cup|now|somewhere|nowhere|told|thanks|most|that|alright|weighed|buried|something|well|go|what|trader|clerk)$/i;

/**
 * Unresolved deixis / occupancy nouns — never person slots, pads, or stitch subjects.
 * Batch T tape: "the Ahead", "figure 1 priests", "silhouette of figure 1".
 */
const UNRESOLVED_DEIXIS_EXACT =
  /^(ahead|behind|beside|nearby|above|below|left|right|forward|back|around|here|there|north|south|east|west)$/i;

export function isUnresolvedDeixisToken(token: string): boolean {
  const t = normalizeChromeToken(token);
  if (!t) return false;
  if (UNRESOLVED_DEIXIS_EXACT.test(t)) return true;
  if (/^figure\s+\d+$/i.test(t)) return true;
  return false;
}

export function isPolityFactionOrPlaceToken(token: string): boolean {
  const t = normalizeChromeToken(token);
  if (!t) return false;
  // Batch W — "Lowmarket Fence" / "Wall Sergeant" are people, not place slots.
  if (/\b(?:fence|sergeant|guard|merchant|vendor|handler|warden|contact|hand|owner|chirurgeon|registrar|skirmisher|thug|priest)\b/i.test(t)) {
    return false;
  }
  if (POLITY_FACTION_PLACE_EXACT.test(t)) return true;
  if (POLITY_FACTION_PLACE_HEAD.test(t)) return true;
  // Bare polity adjective used as a name slot ("Pellane" alone)
  if (/^(pellane|valespire|lowmarket)$/i.test(t)) return true;
  return false;
}

/**
 * Role / workplace adjectives harvested as person names ("Field" from field chirurgeon).
 * Never a present[] person slot.
 */
const ROLE_ADJECTIVE_EXACT =
  /^(field|ward|gate|street|harbor|kitchen|palace|circle|court|market|road|ash|salt|void|pact|system|blue|official)$/i;

export function isRoleAdjectivePersonSlot(token: string): boolean {
  const t = normalizeChromeToken(token);
  if (!t) return false;
  if (t.includes(' ')) return false;
  return ROLE_ADJECTIVE_EXACT.test(t);
}

/**
 * Batch W — role / contact labels are not person slots or prose substitution tokens.
 * Tape: "stall contact" promoted into cast → "leans stall contact" / "the stall contact decree".
 * Batch 02f P0-3: Extended to catch "They" pronoun and "Child" generic descriptor.
 */
const ROLE_CONTACT_LABEL =
  /^(?:the\s+)?(?:stall[- ]?contact|stall[- ]?hand|fence|handler|contact|vendor|merchant|trader|clerk|sergeant|warden|guard|official|chirurgeon|registrar|skirmisher|thug|priest|stall owner|they|child)$/i;

export function isRoleContactLabel(token: string): boolean {
  const t = (token ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (ROLE_CONTACT_LABEL.test(t)) return true;
  if (/\bstall contact\b/i.test(t)) return true;
  if (/\bstall[- ]hand\b/i.test(t)) return true;
  return false;
}

/** Hub + role compounds ("Lowmarket Fence") are valid NPC names when used as people. */
const HUB_ROLE_SUFFIX =
  /^(?:fence|sergeant|guard|merchant|vendor|handler|warden|contact|skirmisher|thug|priest|registrar|chirurgeon|hand|owner)$/i;

export function isHubRoleCompoundToken(token: string): boolean {
  const t = (token ?? '').replace(/\s+/g, ' ').trim();
  if (!t || !/\s/.test(t)) return false;
  const parts = t.split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  if (!HUB_ROLE_SUFFIX.test(last)) return false;
  return parts.length >= 2 && /^[A-Z]/.test(parts[0] ?? '');
}

/** Location+role promoted into verb/preposition/object slots (Batch X mad-lib). */
export function detectHubRoleMadlib(text: string): boolean {
  if (!text?.trim()) return false;
  const hubRole = '(?:Lowmarket\\s+Fence|Wall\\s+Sergeant|Pact-Hunter(?:\\s+Skirmisher)?)';
  return (
    new RegExp(
      `\\b(?:lunged?|leaned|steps?|walks?|runs?|heads?|turned|swung|struck|swiped|pull|draw|grab|raise|swing|wield|as you)\\s+(?:the\\s+)?${hubRole}\\b`,
      'i'
    ).test(text)
    || new RegExp(
      `\\b(?:to|toward|towards|into|at|on|from|near|your)\\s+(?:the\\s+)?${hubRole}\\b`,
      'i'
    ).test(text)
    || /\ba\s+Lowmarket\s+Fence,\s*(?:greyish|tarnished|cracked)/i.test(text)
    || /\b(?:sky|overcast\s+sky|bruised,\s+overcast\s+sky)\s+Scattered\s+Scale\b/i.test(text)
    || /\bthe\s+Lowmarket\s+Fence\s+(?:clad|staggered)\b/i.test(text)
    || /\bscrap\.\s*"\s*$/i.test(text.trim())
  );
}

/** True when a harvested "name" is a choice-pad verb/pronoun, not a person. */
export function isChoicePadPersonToken(token: string): boolean {
  const t = normalizeChromeToken(token);
  if (!t) return false;
  if (isUnresolvedDeixisToken(t)) return true;
  if (t.includes(' ')) return false;
  return CHOICE_PAD_PERSON_EXACT.test(t);
}

/**
 * Batch V — dialogue attribution verbs / past-participles must never become present[] names.
 * Tape: GM wrote `"…" Rasped, their voice` → vignette Title-Case harvest promoted "Rasped"
 * into cast → SNAPSHOT / rewriteInvalidReferences / codedSceneMove injected it as direction,
 * monster, and cast ("Rasped and They").
 * Batch 02f P0-3: Extended to catch "Child" (when used as dialogue-like token in harvest).
 */
const DIALOGUE_VERB_PERSON_EXACT =
  /^(rasped|rasp|whispered|whisper|growled|growl|murmured|murmur|hissed|hiss|snarled|snarl|barked|bark|croaked|croak|grunted|grunt|snapped|snap|muttered|mutter|chuckled|chuckle|laughed|laugh|sighed|sigh|gasped|gasp|coughed|cough|sneered|sneer|spat|spits?|drawled|drawl|intoned|intone|boomed|boom|cried|cry|shouted|shout|yelled|yell|called|call|replied|reply|answered|answer|asked|ask|said|says?|stated|state|declared|declare|announced|announce|demanded|demand|insisted|insist|warned|warn|promised|promise|offered|offer|nodded|nod|smiled|smile|frowned|frown|gestured|gesture|shrugged|shrug|leaned|lean|lunged|lunge|charged|charge|pressed|press|waited|wait|watched|watch|scouted|scout|traveled|travel|attacked|attack|fled|flee|parleyed|parley|engaged|engage|maintained|maintain|intervened|intervene|ascended|ascend|drew|draw|gave|give|peered|peer|child)$/i;

export function isDialogueVerbPersonToken(token: string): boolean {
  const t = normalizeChromeToken(token);
  if (!t) return false;
  if (t.includes(' ')) return false;
  return DIALOGUE_VERB_PERSON_EXACT.test(t);
}

/** Any token that must never occupy a person slot (chrome / pad / deixis / dialogue verb). */
export function isNonPersonNameToken(token: string): boolean {
  return (
    isChromePersonToken(token)
    || isChoicePadPersonToken(token)
    || isUnresolvedDeixisToken(token)
    || isDialogueVerbPersonToken(token)
    || isPolityFactionOrPlaceToken(token)
    || isRoleAdjectivePersonSlot(token)
    || isFactionOrOrgToken(token)
    || isRoleContactLabel(token)
  );
}

/** Faction / polity nouns locked as non-loot, non-person-slot entities. */
export function isFactionOrOrgToken(token: string): boolean {
  const t = normalizeChromeToken(token);
  if (!t) return false;
  return /^(?:the\s+)?scattered\s+scale$/i.test(t) || /^(?:pactborn|calamity\s+mark|ash\s+court|pellane\s+crown)$/i.test(t);
}

export function filterChromeFromPresent(present: string[] | undefined): string[] {
  return (present ?? []).filter(
    (p) =>
      typeof p === 'string' &&
      p.trim() &&
      !isNonPersonNameToken(p)
  );
}

/** Named people only — no chrome, aggregates, polity/place, pad tokens, or occupancy figures. */
export function realPresentPeople(present: string[] | undefined): string[] {
  return filterChromeFromPresent(present).filter((p) => {
    const t = p.trim();
    if (isAggregatePersonToken(t) || /^(cracked street)$/i.test(t)) {
      return false;
    }
    if (isUnresolvedDeixisToken(t)) return false;
    if (isPolityFactionOrPlaceToken(t)) return false;
    if (isRoleAdjectivePersonSlot(t)) return false;
    if (isChoicePadPersonToken(t)) return false;
    if (isFactionOrOrgToken(t)) return false;
    if (isHubRoleCompoundToken(t)) return false;
    return t.length >= 2;
  });
}

/** Crowd nouns — not a named speaker slot (never rewrite these to "blue panel"). */
export function isAggregatePersonToken(token: string): boolean {
  return /^(bystanders?|handlers?|onlookers?|watchers?|crowd|people|voices)$/i.test(
    (token ?? '').trim()
  );
}

/**
 * Who may take a dialogue tag when chrome was the fake speaker.
 * Named people only — never handlers/aggregates, never the panel.
 * If the beat already has handlers, use the role "the handler" (singular).
 */
export function chromeSpeechAnchor(presentPeople: string[] = [], prose = ''): string | null {
  const named = realPresentPeople(presentPeople);
  if (named[0]) return named[0];
  if (/\bhandlers?\b/i.test(prose)) return 'the handler';
  return null;
}

/** Talk/ask/call-out pads aimed at a cover slot or UI chrome. Inspect/scan the panel stays. */
export function isChromeTalkChoice(choice: string): boolean {
  const t = (choice ?? '').trim();
  if (!t) return false;
  return /\b(?:talk(?:\s+to)?|ask|call(?:\s+out)?(?:\s+to)?|approach|greet|address|speak(?:\s+to)?|tell)\s+(?:the\s+)?(?:blue\s+panel|system\s+panel|panel|place|name|look|kit|registration|system|official|eye\s+level|your\s+palm)\b/i.test(
    t
  );
}

export function formatCoverChromeBindingLine(): string {
  return 'COVER CHROME (BINDING): The name/look cover panel may hum or hang as a prop — it is not a character. It must never speak (says/states/asks/their voice) or want/need. Slot labels (Place, Name, Look, Registration) are not NPC names. LitRPG System text is STATUS, not a person in the doorway. Handlers is a crowd noun, not a name.';
}

function tidyChromeClauses(text: string): string {
  return text
    .replace(/\s+,/g, ',')
    .replace(/,(?:\s*,)+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/,\s+\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/^,+\s*/, '')
    .replace(/\s+\./g, '.')
    .trim();
}

/**
 * Strip dialogue tags and want/need from UI chrome.
 * "blue panel states, their voice…" → named person / "the handler" / unattributed quotes.
 * "the blue panel has need" → "there is a need".
 * Hum / glow / hang of the panel stays.
 */
export function rewriteChromeSpeakerTags(text: string, presentPeople: string[] = []): string {
  if (!text || !/\b(?:panel|system|registration)\b/i.test(text)) return text;
  const anchor = chromeSpeechAnchor(presentPeople, text);
  let next = text;

  const voiceAside = `(?:\\s*,\\s*(?:their|his|her)\\s+voice\\b[^."]{0,160})?`;
  const speechTag = new RegExp(
    `\\b${CHROME_NOUN}\\s+${SPEECH_VERB}\\b${voiceAside},?`,
    'gi'
  );
  next = next.replace(speechTag, () => (anchor ? `${anchor} says` : ''));

  next = next.replace(
    new RegExp(`,\\s*(?:says|said|asks|asked|states)\\s+${CHROME_NOUN}\\b`, 'gi'),
    anchor ? `, says ${anchor}` : ','
  );

  next = next.replace(
    new RegExp(`\\b${CHROME_NOUN}\\s+has\\s+need\\b`, 'gi'),
    'there is a need'
  );
  next = next.replace(
    new RegExp(`\\b${CHROME_NOUN}\\s+(?:wants|needs)\\s+`, 'gi'),
    'the work requires '
  );

  return tidyChromeClauses(next);
}

/**
 * Rewrite the chrome-as-person class:
 *   "the blue panel, Place, remains at the threshold, his posture tense."
 *   "The official, Place, remains at the threshold, his posture tense."
 * Pattern: [ui chrome], [slot name], + posture/voice/he/she — or chrome/slot + body pronouns.
 * Prefer a real present person; otherwise drop the clause.
 */
export function rewriteChromePersonClauses(text: string, presentPeople: string[] = []): string {
  if (!text) return text;
  const anchor = chromeSpeechAnchor(presentPeople, text);
  let next = text;

  const commaClause = new RegExp(
    `${CHROME_HEAD}\\s*,\\s*${SLOT_NAME}\\s*,\\s*([^.]{0,200}?)(?=[.!]|$)`,
    'gi'
  );
  next = next.replace(commaClause, (full, rest: string) => {
    if (!BODY_CUE.test(full) && !BODY_CUE.test(rest)) return full;
    if (anchor) {
      const cleaned = String(rest)
        .replace(/\b(?:his|her|their)\s+posture\s+\w+/gi, '')
        .replace(/^[\s,]+/, '')
        .trim();
      return cleaned ? `${anchor} ${cleaned}` : `${anchor} stays here`;
    }
    return '';
  });

  const chromeBody = new RegExp(
    `${CHROME_HEAD}\\s+(?:remain|remains|stands?|watches?|turns?|says?|asks?)\\b[^.]{0,160}?\\b(?:his|her|their)\\s+(?:posture|voice|bearing|gaze)\\b[^.]{0,80}?(?=[.!]|$)`,
    'gi'
  );
  next = next.replace(chromeBody, () => (anchor ? `${anchor} stays here` : ''));

  const slotBody = new RegExp(
    `\\b${SLOT_NAME}\\s+(?:remain|remains|stands?|watches?|turns?|says?|asks?)\\b[^.]{0,160}?\\b(?:his|her|their)\\s+(?:posture|voice|bearing|gaze)\\b[^.]{0,80}?(?=[.!]|$)`,
    'gi'
  );
  next = next.replace(slotBody, () => (anchor ? `${anchor} stays here` : ''));

  // Door confusion: "you push the blue panel" when hinges/threshold are in the beat.
  if (/\b(?:door|hinge|threshold|splinter)/i.test(next)) {
    next = next.replace(/\bpush(?:es|ed|ing)?\s+(?:the\s+)?(?:blue\s+)?panel\b/gi, 'push the door');
  }

  // Official-placeholder → panel left a chrome crowd: "the blue panel men"
  next = next.replace(/\bthe\s+(?:blue\s+)?panel\s+men\b/gi, 'the people');

  next = rewriteChromeSpeakerTags(next, presentPeople);

  return tidyChromeClauses(next);
}
