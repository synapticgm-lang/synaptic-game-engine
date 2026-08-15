import {
  isAskNearbyPerson,
  isSpeechOrProtest,
  primaryActionClause,
  type PlayerIntent,
} from './intentParser';
import { buildFactLockRetryBlock, type FactLockViolation } from './factLocks';
import { stripChoiceList } from './parser';

export { playerFacingLocation } from './locationName';

/**
 * Cross-mode guarantee: every player action must receive a concrete narrative resolution.
 * Prevents empty "You follow through…" bridges and choice-only GM replies.
 * Never locally synthesize story — retry the GM or keep a surgical fact-lock cut.
 */

const BRIDGE_MARKERS =
  /you follow through(?:\s+on that)?|the moment settles as you take in what changed|you press for clarity —|you commit to the action|the immediate result lands in|the result is local and visible|here at england/i;

const DEAD_STUB_MARKERS =
  /slow circuit of|main approach and watch for secondary gaps|opaque remains opaque|ordinary quiet|no fresh landmarks announce themselves|that is what you can act on next|not a blank circuit|you put the question plainly|anything the sheet and the last scene|rather than changing the subject|not a place you traveled to|not a list of what you are carrying|you do not recite your inventory|this is still a cracked city street|the situation has not become a different genre|the last beat holds|the people who were already here are still here|green crystals still split the concrete|the system panel still hangs|you stand still and take in what is around you|ordinary wreckage: torn material|the familiar street is breaking — cracks through walls|shelves (?:are )?(?:overturned|toppled)|broken glass (?:and debris|litter)|glass shards glitter|boots crunching on broken glass|the integration has only just begun/i;

const FINDING_CUES =
  /\b(find|found|see|saw|seen|notice|noticed|spot|spotted|hear|heard|reveal|reveals|empty|locked|ajar|open|door|entrance|exit|alley|wall|corner|shadow|quiet|noise|nothing|glint|track|tracks|window|side|rear|front|roof|balance|grip|weight|swing|hum|buzz|flicker|smell|dust|crack|gap|boarded|intact|threat|movement|stillness|cool|warm|heavy|panel|menu|level|hp|mp|greyed|grayed|readout|list|entry|entries|light in (?:your|the) hand|car|van|tunic|clothes|sword|knife|integration|registered|earth|crystal|street|city|people|scream)\b/i;

const NEEDS_FINDINGS_ACTION =
  /\b(scout|circle|search|look|inspect|examin|listen|check\s+for|find|survey|recon|practice|test|ask|what|where|how|who|why|observe|scan|watch|study|wonder)\b/i;

const FOCUS_NOUN =
  /\b(car|van|truck|bus|vehicle|door|gate|alley|panel|tunic|clothes|shirt|jacket|coat|crate|body|corpse|shop|stall|store|market|mart|tesco|entrance|sword|knife|blade|dumpster|window|wreck)\b/i;

function proseOnly(text: string): string {
  return stripChoiceList(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[SYSTEM[^\]]*\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isGenericBridgeNarrative(narrative: string): boolean {
  const prose = proseOnly(narrative);
  if (!prose) return true;
  if (DEAD_STUB_MARKERS.test(prose)) return true;
  if (BRIDGE_MARKERS.test(prose) && prose.length < 280) return true;
  if (BRIDGE_MARKERS.test(prose)) {
    const withoutBridge = prose
      .replace(/you follow through(?:\s+on that)?[^.?!]*[.?!]/gi, '')
      .replace(/the moment settles[^.?!]*[.?!]/gi, '')
      .replace(/you press for clarity —[^.?!]*[.?!]/gi, '')
      .replace(/you commit to the action[^.?!]*[.?!]?/gi, '')
      .replace(/the immediate result lands in[^.?!]*[.?!]/gi, '')
      .trim();
    if (withoutBridge.length < 40) return true;
  }
  return false;
}

/**
 * True when the narrative fails to resolve the player's stated action with concrete results.
 */
export function isUnresolvedActionNarrative(
  playerAction: string,
  narrative: string,
  intent: PlayerIntent,
  previousNarrative = ''
): boolean {
  const job = primaryActionClause(playerAction);
  const prose = proseOnly(narrative);
  if (!prose || prose.length < 60) return true;
  if (/^(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?\s*$/i.test(prose)) return true;
  if (isGenericBridgeNarrative(narrative)) return true;
  if (/bring the System panel in close/i.test(prose) && !isPanelOnlyAction(playerAction)) return true;
  if (isRecycledLookAround(playerAction, intent, prose, previousNarrative)) return true;
  if (asksIfEveryoneGotGear(playerAction) && !proseAnswersEveryoneGear(prose)) return true;
  if (isCreatureWithoutRoom(playerAction, prose)) return true;
  if (isHealQuestion(playerAction) && !proseAnswersHeal(prose)) return true;
  if (
    intent.kind === 'attack'
    && !/\b(strike|stab|cut|slash|hit|knife|blow|drive|wrench|claw|blood|miss|dodge|parry|shriek)\b/i.test(prose)
  ) {
    return true;
  }

  const askedSomeone = isAskNearbyPerson(playerAction);
  if (askedSomeone) {
    return !proseResolvesTalk(prose);
  }

  const speech = intent.kind === 'talk' || isSpeechOrProtest(playerAction);
  if (speech) {
    return !(proseResolvesSpeech(prose) || proseTracksPremise(prose));
  }

  const worldAsk = isWorldSituationQuestion(playerAction);
  if (worldAsk && proseTracksPremise(prose) && prose.length >= 80) return false;
  if (isGearOriginQuestion(playerAction) && proseExplainsGear(prose)) return false;

  const needsFindings =
    NEEDS_FINDINGS_ACTION.test(job)
    || intent.kind === 'observe'
    || intent.kind === 'search'
    || intent.kind === 'move';

  if (needsFindings && !FINDING_CUES.test(prose) && !proseTracksPremise(prose)) return true;

  const focus = job.match(FOCUS_NOUN)?.[1];
  if (focus && !worldAsk && !isGearOriginQuestion(playerAction) && !new RegExp(`\\b${focus}\\b`, 'i').test(prose)) {
    return true;
  }

  const tokens = (job.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(
    (t) => !/^(with|from|that|this|have|into|your|their|about|would|could|should|first|other|more|closely|additional|nearest|nearby|wonder)$/.test(t)
  );
  if (tokens.length >= 3 && !worldAsk && !isGearOriginQuestion(playerAction)) {
    const hay = prose.toLowerCase();
    const hits = tokens.filter((t) => hay.includes(t)).length;
    if (hits === 0 && needsFindings) return true;
  }

  return false;
}

/** Extra user-message block for a single automatic regeneration. */
export function buildResolutionRetryBlock(playerAction: string, intent: PlayerIntent): string {
  const action = playerAction.replace(/\s+/g, ' ').trim().slice(0, 220);
  return `=== RESOLUTION RETRY (BINDING — ALL ENGINE MODES) ===
Your prior reply did NOT resolve the player action (empty, System-only, bridge-only, missing the named target, or a generic street-circuit stub).
Player action: "${action}"
Intent: ${intent.label} (${intent.kind})
REQUIRED:
1. Write at least 3 full sentences of NEW story prose that resolve THIS action — the named object, person, or question — with concrete sensory results. Do not reuse prior sentences.
2. If they search/inspect a specific thing (a car, alley, panel, body): go to THAT thing and say what is in/on it. Do NOT replace it with a general circuit of the street.
3. If they look around / ask what is around them: write a unique sensory beat of the LAST scene (street, wrecks, people, power dying). Do NOT list inventory. Do NOT mention "the sheet". Do NOT paste a crystal/panel collage.
4. If they enter, scout an entrance, sneak, or move forward: describe the space in front of them (aisle, door, shelves, light, smell) BEFORE any creature acts. Never open on "the nearest creature".
5. If they practice/test gear: describe feel, balance, sound — not a quest redirect. Use ONLY equipped/inventory gear.
6. If they protest, joke, refuse, or ask who is in charge: that is DIALOGUE. Answer in System/registrar or narrator voice. Do NOT narrate a physical follow-through, knife-grip, or step forward.
7. If they ask a person / someone nearby: they MUST speak and that person MUST answer. Do not replace the conversation with a Guide Book lecture that "everyone heard it."
8. If they only ask what is going on / what the screen is: answer in-world from the last scene (blue panel, street, Integration). Never write engine notes ("not a place you traveled to", "not a list of what you are carrying", "the sheet", "This is still [location]").
9. Do NOT reply with "you follow through", "you commit to the action", "the result lands in [category]", "main approach", "ordinary wreckage", "green crystals still split the concrete", or "the System panel still hangs".
10. Story first, then <system-log>. Never emit XP Gained: 0. Never reply with a system-log and no story.
11. Do NOT echo the location label as a sentence. Do NOT invent loot or named enemies without tags.
Then give 3–4 choices grounded in what you just described — not objects you never narrated.
===========================================================`;
}

/** Named thing the player is trying to search, inspect, or move to. */
export function actionFocusPhrase(action: string): string | null {
  const targeted = action.match(
    /\b(?:the|a|an|nearest|nearby|this|that|closest)\s+((?:[a-z][\w'-]*\s+){0,3}(?:car|van|truck|bus|vehicle|door|gate|alley|panel|crate|body|corpse|shop|stall|window|dumpster|wreck|tunic|sword|knife|blade))\b/i
  );
  if (targeted) return targeted[0].replace(/\s+/g, ' ').trim();
  const bare = action.match(FOCUS_NOUN);
  return bare ? bare[0] : null;
}

function isPanelOnlyAction(action: string): boolean {
  const full = action.replace(/\s+/g, ' ').trim();
  const job = primaryActionClause(full);
  // Dismiss / look-for / explore always wins. Never open the panel for a compound line.
  if (/\b(dismiss|close|put away|hide|ignore|wave (?:off|away)|look for|look around|explor|open door)\b/i.test(full)) {
    return false;
  }
  if (/\b(door|alley|car|street|wreck|around me|near me)\b/i.test(job)) return false;
  return (
    /^(?:check|read|open|study|inspect)\b.{0,40}\b(system\s*pann?el|status\s+panel|character\s+sheet|system\s+menu)\b/i.test(job)
    || /^(?:check|read|open|study|inspect)\s+(?:the\s+)?(?:system\s*)?pann?el\b/i.test(job)
  );
}

function asksIfEveryoneGotGear(action: string): boolean {
  return /\b(did we all|everyone get|everybody get|we all get|all get (?:a |the )?(?:knife|weapon|gear)|did (?:they|everyone|people) (?:get|also get))\b/i.test(
    action
  );
}

function proseAnswersEveryoneGear(prose: string): boolean {
  return /\b(everyone|everybody|all of (?:you|them|us)|only you|just you|not everyone|others (?:have|got|hold|weren'?t)|allotment|issued to (?:every|all)|each (?:person|citizen|human)|nobody else|no one else)\b/i.test(
    prose
  );
}

function isCreatureWithoutRoom(action: string, prose: string): boolean {
  const entering =
    /\b(enter|inside|forward|stealth|sneak|scout(?:ing)?(?:\s+the)?\s+entrance|move forward|go in|step in)\b/i.test(
      action
    );
  if (!entering) return false;
  const creatureRe =
    /\b(creature|enemy|verminkin|scavenger|mob|monster|nearest creature|beady eyes|screech)\b/i;
  const creatureIdx = prose.search(creatureRe);
  if (creatureIdx < 0) return false;
  const roomRe =
    /\b(aisle|shelf|shelves|counter|till|checkout|fridge|fluorescent|trolley|cart|interior|inside|doorway|threshold|linoleum|tiles|stock|freezer|energy drink|shop floor|store|tesco|entrance|door|room|corridor|hallway)\b/i;
  const roomIdx = prose.search(roomRe);
  return roomIdx < 0 || roomIdx > creatureIdx;
}

function isRecycledLookAround(
  action: string,
  intent: PlayerIntent,
  prose: string,
  previous: string
): boolean {
  if (!isGeneralLookAround(action, intent)) return false;
  const prior = proseOnly(previous).toLowerCase();
  if (prior.length < 80) return false;
  const sentences = prose
    .toLowerCase()
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 28);
  if (sentences.length === 0) return true;
  const recycled = sentences.filter((s) => prior.includes(s.slice(0, 42))).length;
  return recycled >= Math.ceil(sentences.length * 0.6);
}

function isGeneralLookAround(action: string, intent: PlayerIntent): boolean {
  if (actionFocusPhrase(action) && /\b(search|inspect|check|loot|rummage|open)\b/i.test(action)
    && !/\b(around|standing|surround)\b/i.test(action)) {
    return false;
  }
  return (
    /\b(what'?s?\s+(?:is\s+|it\s+)?around|around me|where i(?:'?m| am) standing|stand still|surroundings|scan (?:the )?(?:area|room|street)|look around|examine the immediate|what is near)\b/i.test(action)
    || ((intent.kind === 'observe' || intent.kind === 'search') && !actionFocusPhrase(action)
      && /\b(scout|circle|survey|recon|look|examin|inspect)\b/i.test(action))
  );
}

export function isWorldSituationQuestion(action: string): boolean {
  return /\b(what'?s?\s+(?:the\s+hell\s+)?going\s+on|what\s+the\s+(?:hell|fuck)\s+is\s+going|what\s+happened|why\s+is\s+(?:this|the\s+world|everything)|explain\s+(?:this|what)|what\s+is\s+(?:the\s+)?(?:system|integration)|what do you want from me|registration complete)\b/i.test(
    action
  );
}

function proseResolvesTalk(prose: string): boolean {
  return /\b(says?|said|asks?|asked|replies|replied|nods?|shakes?\s+(?:their|his|her)\s+head|stranger|"[^"]{3,}"|they\s+(?:see|saw|have|got))\b/i.test(
    prose
  );
}

/** System/narrator answer to protest, refusal, or "who's in charge" — not a physical stub. */
function proseResolvesSpeech(prose: string): boolean {
  return (
    proseResolvesTalk(prose)
    || /\b(in charge|didn'?t (?:ask|agree|sign)|not a joke|nobody (?:asked|agreed)|allotment|registrar|welcome to the system|every (?:human|mind)|registered)\b/i.test(
      prose
    )
    || /\[[^\]]*(?:SYSTEM|AUDITOR)[^\]]*\]/i.test(prose)
  );
}

export function isHealQuestion(action: string): boolean {
  return /\b(heal|healing|recover(?:y| hp)?|restore hp|how do i (?:heal|get hp)|hp recovery|health vial|drink)\b/i.test(
    action
  );
}

function proseAnswersHeal(prose: string): boolean {
  if (/hp recovery options:\s*$/i.test(prose.trim())) return false;
  return /\b(vial|potion|rest|bandage|restore \d+|heal \d+|hp \+|drink|safe zone|healer)\b/i.test(prose)
    && !/hp recovery options:\s*$/i.test(prose);
}

function isGearOriginQuestion(action: string): boolean {
  return /\b(why\s+(?:do|did)\s+i\s+have|where\s+did\s+(?:this|the|my)\s+\w+\s+come|whose\s+\w+\s+is\s+this|suddenly\s+have)\b/i.test(
    action
  );
}

function proseTracksPremise(prose: string): boolean {
  return /\b(integration|registered|system|crystal|street|city|people|scream|panel|earth|sky|mana)\b/i.test(prose);
}

function proseExplainsGear(prose: string): boolean {
  return /\b(materializ|registration|system-issue|system\s+put|did\s+not\s+walk\s+around|not\s+something\s+you\s+carried|in\s+your\s+hand)\b/i.test(
    prose
  );
}

export function buildResolutionUserPayload(params: {
  mandateBlock: string;
  playerAction: string;
  deterministicBlock: string;
  retry: boolean;
  intent: PlayerIntent;
  factLocks?: FactLockViolation[];
}): string {
  const retry = params.retry ? `${buildResolutionRetryBlock(params.playerAction, params.intent)}\n\n` : '';
  const locks = params.factLocks?.length ? `${buildFactLockRetryBlock(params.factLocks)}\n\n` : '';
  return `${params.mandateBlock}\n\n${retry}${locks}${params.playerAction}\n\n${params.deterministicBlock}`;
}
