import type { GameState } from './types';
import { isAskNearbyPerson, primaryActionClause, type PlayerIntent } from './intentParser';
import { buildFactLockRetryBlock, type FactLockViolation } from './factLocks';
import { stripChoiceList } from './parser';
import { playerFacingLocation } from './locationName';

export { playerFacingLocation } from './locationName';

/**
 * Cross-mode guarantee: every player action must receive a concrete narrative resolution.
 * Prevents empty "You follow through…" bridges and choice-only GM replies.
 */

const BRIDGE_MARKERS =
  /you follow through(?:\s+on that)?|the moment settles as you take in what changed|you press for clarity —|you commit to the action|the immediate result lands in|the result is local and visible/i;

const DEAD_STUB_MARKERS =
  /slow circuit of|main approach and watch for secondary gaps|opaque remains opaque|ordinary quiet|no fresh landmarks announce themselves|that is what you can act on next|not a blank circuit|you put the question plainly|anything the sheet and the last scene|rather than changing the subject|not a place you traveled to|not a list of what you are carrying|you do not recite your inventory|this is still a cracked city street|the situation has not become a different genre|the last beat holds|the people who were already here are still here/i;

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

  const askedSomeone = isAskNearbyPerson(playerAction);
  if (askedSomeone) {
    return !proseResolvesTalk(prose);
  }

  const worldAsk = isWorldSituationQuestion(playerAction);
  if (worldAsk && proseTracksPremise(prose) && prose.length >= 80) return false;
  if (isGearOriginQuestion(playerAction) && proseExplainsGear(prose)) return false;

  const needsFindings =
    NEEDS_FINDINGS_ACTION.test(job)
    || intent.kind === 'observe'
    || intent.kind === 'search'
    || intent.kind === 'move'
    || intent.kind === 'talk';

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
Your prior reply did NOT resolve the player action (empty, bridge-only, missing the named target, or a generic street-circuit stub).
Player action: "${action}"
Intent: ${intent.label} (${intent.kind})
REQUIRED:
1. Write at least 3 full sentences of story prose that resolve THIS action — the named object, person, or question — with concrete sensory results.
2. If they search/inspect a specific thing (a car, alley, panel, body): go to THAT thing and say what is in/on it. Do NOT replace it with a general circuit of the street.
3. If they look around / ask what is around them: write sensory story of the LAST scene (street, wrecks, people, power dying). Do NOT list inventory. Do NOT mention "the sheet".
4. If they practice/test gear: describe feel, balance, sound — not a quest redirect. Use ONLY equipped/inventory gear.
5. If they ask a person / someone nearby: they MUST speak and that person MUST answer. Do not replace the conversation with a Guide Book lecture that "everyone heard it."
6. If they only ask what is going on / what the screen is: answer in-world from the last scene (blue panel, street, Integration). Never write engine notes ("not a place you traveled to", "not a list of what you are carrying", "the sheet", "This is still [location]").
7. Do NOT reply with "you follow through", "you commit to the action", "the result lands in [category]", "main approach", or "ordinary quiet" against a live scene.
8. Do NOT echo the location label as a sentence. Do NOT invent loot or named enemies without tags.
Then give 3–4 choices grounded in what you just described — not objects you never narrated.
===========================================================`;
}

function equippedWeaponName(state: GameState): string | null {
  const hit = state.inventory.find(
    (i) => i.equipped && /sword|blade|weapon|knife|axe|bow|staff|mace|spear|dagger/i.test(i.name)
  );
  return hit?.name ?? null;
}

function carriedGearLine(state: GameState): string {
  const equipped = state.inventory
    .filter((i) => i.equipped && !/^(?:you\s+)?(perve?|creep|weirdo|freak|sicko|pervert)$/i.test(i.name.trim()))
    .map((i) => i.name);
  if (equipped.length) return equipped.join(', ');
  const carried = state.inventory.slice(0, 3).map((i) => i.name);
  return carried.length ? carried.join(', ') : 'what you actually have on you';
}

function containerName(state: GameState): string | null {
  return state.containers.find((c) => c.equipped)?.name
    ?? state.containers[0]?.name
    ?? null;
}

function sceneIsLive(lastScene: string): boolean {
  return /\b(scream|shout|panic|crowd|people|crystal|crack|changing|flee|siren|gunfire|fire|integration)\b/i.test(
    lastScene
  );
}

function describeWhatIsNear(state: GameState, lastScene: string, place: string): string {
  return lookAroundNarration(state, lastScene, place);
}

/** Player-facing look-around. Story only — no inventory dump, no "sheet" talk. */
function lookAroundNarration(state: GameState, lastScene: string, place: string): string {
  const s = lastScene.toLowerCase();
  const beats: string[] = [];
  if (/\b(crack|breaking|changing|crystal|integration|mana)\b/.test(s)) {
    beats.push(
      'The street you have walked a hundred times is changing — cracks through walls and air that were not there this morning'
    );
  }
  if (/\b(alarm|electronic|power|mana saturation|siren)\b/.test(s)) {
    beats.push('sound is thinning as power dies, alarms and fried electronics fading out');
  }
  if (/\b(car|truck|van|vehicle|wreck|overturn)\b/.test(s)) {
    beats.push('overturned cars and trucks sit where traffic should be');
  }
  if (/\b(food truck|fire|unattended)\b/.test(s)) {
    beats.push('an unattended fire still works in a wrecked food truck');
  }
  if (/\b(people|crowd|scream|confused|shout|panic)\b/.test(s)) {
    beats.push('people stand in the open, confused, some still shouting');
  }
  if (/\bcrystal/.test(s) && !beats.some((b) => /crack/.test(b))) {
    beats.push('green crystals split the concrete');
  }
  const exits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
  const props = (state.locationSheet?.interactables ?? []).map((i) => i.name).filter(Boolean).slice(0, 3);
  if (exits.length) beats.push(`ways you can actually take: ${exits.join(', ')}`);
  if (props.length) beats.push(`close enough to touch: ${props.join(', ')}`);
  if (state.activeEncounter?.name) beats.push(`${state.activeEncounter.name} is already in view`);

  if (beats.length) {
    const last = beats.pop()!;
    const head = beats.length ? `${beats.join('; ')}, and ${last}` : last;
    return `You stand still and take in what is around you. ${head.charAt(0).toUpperCase()}${head.slice(1)}.`;
  }
  if (isIntegrationPremise(state)) {
    return `You stand still. The familiar street is breaking — cracks through walls and air, green crystals pushing concrete, power dying, overturned cars, people confused and shouting.`;
  }
  return `You stand still on ${place} and look. Cover, the nearest wreck or doorway, and whoever is close enough to hear are still here.`;
}

function sceneContinuation(lastScene: string): string {
  const s = lastScene.toLowerCase();
  const bits: string[] = [];
  if (/\b(scream|shout|panic)\b/.test(s)) bits.push('people are still shouting');
  if (/\bcrystal/.test(s)) bits.push('green crystals still split the concrete');
  if (/\b(panel|system)\b/.test(s)) bits.push('the System panel still hangs at the edge of your sight');
  if (/\balley\b/.test(s)) bits.push('an alley still cuts off the street');
  if (/\b(car|van|vehicle|wreck)\b/.test(s)) bits.push('wrecked vehicles still sit on the curb');
  if (bits.length) return bits.join('; ');
  if (sceneIsLive(lastScene)) {
    return 'the scene you already saw is still happening — it did not go still and blank';
  }
  return '';
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

function asksAboutScreen(action: string): boolean {
  return /\b(this|the|that)\s+(screen|panel|window|hud|blue\s+(?:box|screen|panel))\b/i.test(action)
    || /\bwhat is this screen\b/i.test(action);
}

function proseResolvesTalk(prose: string): boolean {
  return /\b(says?|said|asks?|asked|replies|replied|nods?|shakes?\s+(?:their|his|her)\s+head|stranger|"[^"]{3,}"|they\s+(?:see|saw|have|got))\b/i.test(
    prose
  );
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

function isIntegrationPremise(state: GameState): boolean {
  return /system integration|every human on earth|integration protocol/i.test(state.campaignPremise ?? '');
}

function premiseFrame(state: GameState, place: string): string {
  if (isIntegrationPremise(state)) {
    return 'The blue panel is still hanging in front of you. The street is cracking. The System called it Integration.';
  }
  return `You are still on ${place}. What you can see has not gone blank.`;
}

function askNearbyNarration(state: GameState, fullAction: string): string {
  const screenBit = asksAboutScreen(fullAction) || isIntegrationPremise(state)
    ? 'You jab a finger at the blue panel hanging in front of your eyes. '
    : '';
  const place = state.currentLocation || 'this city';
  const situationBit = isWorldSituationQuestion(fullAction) && isIntegrationPremise(state)
    ? `This is still ${place} — your life, this morning. The sky tore and the System wrote itself over the street. `
    : '';
  return (
    `${situationBit}${screenBit}`
    + `You catch the nearest person still on their feet. "Do you see this too?" `
    + `They flinch, then nod, staring at a matching panel in their own sight. "Yeah. I see it. I didn't put it there." `
    + `Whatever this is, it is not only yours.`
  );
}

function provenanceLine(
  item: { name: string; provenance?: string; description?: string },
  state: GameState
): string {
  const prov = (item.provenance ?? '').trim();
  const desc = (item.description ?? '').trim();
  const blob = `${prov} ${desc}`;
  if (/materializ|registration|system-issue|system logo|system allotment/i.test(blob)) {
    return `The ${item.name} is not something you carried yesterday. It came with Registration — the System put it on you when it finished, not a blade you walked the modern street with.`;
  }
  if (/wearing when integration|clothes you had on|what you were wearing/i.test(blob)) {
    return `The ${item.name} are what you already had on this morning, before the sky tore open.`;
  }
  if (/found on arrival|on you when you arrived|appeared at/i.test(prov)) {
    if (isIntegrationPremise(state)) {
      return `The ${item.name} is starting kit from Registration — the System issued it. You did not walk this street yesterday as an adventurer.`;
    }
    return `The ${item.name} is part of the kit you started this story with. You did not loot it from this spot.`;
  }
  if (/^campaign:/i.test(prov)) {
    return `The ${item.name} is part of the opening kit for this campaign.`;
  }
  if (desc) return `${item.name}: ${desc}`;
  if (prov) return `The ${item.name}: ${prov}.`;
  return `The ${item.name} is what you are actually carrying. The street does not invent a shop story for it.`;
}

function explainHeldWeapon(state: GameState): string {
  const weapon = state.inventory.find(
    (i) => i.equipped && (i.itemType === 'weapon' || /sword|knife|blade|weapon/i.test(i.name))
  ) ?? state.inventory.find((i) => /sword|knife|blade|weapon/i.test(i.name));
  if (!weapon) {
    return isIntegrationPremise(state)
      ? 'You are not holding a fantasy traveler\'s sword. If your hand is empty, the System has not issued a weapon yet.'
      : 'You are not holding a weapon unless inventory says so.';
  }
  return provenanceLine(weapon, state);
}

function answerGearOrigin(action: string, state: GameState): string | null {
  const t = action.toLowerCase();
  const asksOrigin = isGearOriginQuestion(t) || /\b(where|come from|came from|whose|old cloth)\b/i.test(t);
  const asksClothes = /\b(tunic|cloth|wear|wearing|outfit|shirt|jacket|coat|armor)\b/i.test(t);
  const asksWeapon = /\b(sword|blade|knife|weapon)\b/i.test(t);
  if (!asksOrigin && !asksClothes && !asksWeapon) return null;
  if (!asksOrigin && intentLooksLikePractice(t)) return null;

  const parts: string[] = [];
  if (asksWeapon) parts.push(explainHeldWeapon(state));
  if (asksClothes || (asksOrigin && /\btunic\b/.test(t))) {
    const body = state.inventory.find(
      (i) => i.equipped && (i.slot === 'Body' || /tunic|armor|leather|coat|shirt|jacket|clothes/i.test(i.name))
    );
    if (body) parts.push(provenanceLine(body, state));
    else if (isIntegrationPremise(state)) {
      parts.push('You are still in the clothes you had on this morning — not a patched traveler tunic.');
    }
  }
  if (!parts.length) return null;
  return parts.join(' ');
}

function intentLooksLikePractice(t: string): boolean {
  return /\b(practice|test|swing|balance|warm[- ]?up|heft)\b/.test(t) && !/\b(where|come from|clothes)\b/.test(t);
}

/**
 * Last-resort local resolution when the model still fails after retry.
 * Must resolve the player's stated action — never a substituted drill or category label.
 */
export function synthesizeActionResolution(
  playerAction: string,
  intent: PlayerIntent,
  state: GameState,
  lastSceneProse = ''
): string {
  const place = playerFacingLocation(state);
  const full = playerAction.replace(/\s+/g, ' ').trim().slice(0, 200);
  const action = primaryActionClause(full).slice(0, 160);
  const dismissed = /\b(dismiss|close|put away|hide|ignore)\b/i.test(full)
    && /\b(system|pann?el|menu)\b/i.test(full);
  const prefix = dismissed ? 'You put the System panel away. ' : '';
  const gear = carriedGearLine(state);
  const weapon = equippedWeaponName(state);
  const pack = containerName(state);
  const level = state.character?.level ?? 1;
  const live = sceneContinuation(lastSceneProse);
  const nearby = describeWhatIsNear(state, lastSceneProse, place);
  const focus = actionFocusPhrase(action);
  const lookingFor = /\b(?:look|search|check|find|scan)\s+(?:around\s+)?for\b/i.test(action);

  if (isPanelOnlyAction(full)) {
    const locked = level < 5
      ? 'A few headings sit greyed out with a level gate — they will not open yet, and they are not choices you can take.'
      : 'The menus you have unlocked respond; nothing extra invents itself.';
    return (
      `You bring the System panel in close. Level ${level} is current, vitals match what you already feel, and the gear list shows ${gear}`
      + `${pack ? ` stored in ${pack}` : ''}. ${locked} `
      + `No distant hubs or encyclopedia headings force themselves onto the screen.`
    );
  }

  if (isAskNearbyPerson(full) || isAskNearbyPerson(action)) {
    return `${prefix}${askNearbyNarration(state, full)}`;
  }

  if (isWorldSituationQuestion(full) || isWorldSituationQuestion(action) || asksAboutScreen(full)) {
    const gearBit = isGearOriginQuestion(full) || /\b(sword|blade|knife|weapon)\b/i.test(full)
      ? ` ${explainHeldWeapon(state)}`
      : '';
    const screenBit = asksAboutScreen(full)
      ? ' The blue screen is a System panel — Registration, hanging at eye level, written in your language. It is not a phone and it will not swipe away.'
      : '';
    return (
      `${prefix}${premiseFrame(state, place)}${screenBit} `
      + `${lookAroundNarration(state, lastSceneProse, place)}${gearBit}`
    );
  }

  if (isGeneralLookAround(full, intent) || isGeneralLookAround(action, intent)) {
    return `${prefix}${lookAroundNarration(state, lastSceneProse, place)}`;
  }

  const gearAnswer = answerGearOrigin(action, state);
  if (
    gearAnswer
    && !isGeneralLookAround(full, intent)
    && (intent.kind === 'talk' || /\?/.test(action) || /\bwonder\b/i.test(action) || isGearOriginQuestion(action))
  ) {
    return prefix + gearAnswer;
  }

  if (lookingFor && focus) {
    return (
      `${prefix}You look for ${focus} from ${place}. ${nearby} `
      + (/\bdoor|gate|entrance\b/i.test(focus)
        ? `The nearest door you can actually reach is a street-front door — shut, but close enough to try. No dungeon entrance invents itself.`
        : `You do not invent a new landmark; you only mark whether ${focus} is in reach from here.`)
    );
  }

  if (focus && /\b(search|inspect|check|loot|rummage|open|look (?:in|inside|through))\b/i.test(action) && !lookingFor) {
    return (
      `${prefix}You go to ${focus} and search it for anything you can use. `
      + `Inside is ordinary wreckage: torn material, dust, nothing that jumps into your inventory as a new weapon or kit. `
      + `You finish knowing ${focus} has no ready supplies worth taking. ${nearby}`
    );
  }

  if (intent.kind === 'observe' && !focus) {
    return `${prefix}${lookAroundNarration(state, lastSceneProse, place)}`;
  }

  if (intentLooksLikePractice(action) || (intent.kind === 'other' && /\b(practice|swing|balance)\b/i.test(action))) {
    const named = weapon ?? 'your ready hands';
    const noise = sceneIsLive(lastSceneProse)
      ? `The street does not go quiet for the drill; the noise you already heard stays in the background.`
      : `Nobody treats the motion as a challenge.`;
    return (
      `${prefix}You take a moment with ${named} — weight, grip, a short controlled arc. `
      + `The balance is workable; the motion steadies your breathing. ${noise}`
    );
  }

  if (intent.kind === 'talk' || /\?/.test(action) || /\bwonder\b/i.test(action)) {
    if (isAskNearbyPerson(full) || isAskNearbyPerson(action)) {
      return `${prefix}${askNearbyNarration(state, full)}`;
    }
    if (isGeneralLookAround(full, intent) || /\baround\b/i.test(full)) {
      return `${prefix}${lookAroundNarration(state, lastSceneProse, place)}`;
    }
    return (
      gearAnswer
      ?? `${prefix}${premiseFrame(state, place)} ${lookAroundNarration(state, lastSceneProse, place)}`
    );
  }

  if (/\b(inventory|what (?:do i|i actually) carry|check (?:my |what i )?(?:gear|pack|bag))\b/i.test(action)) {
    return (
      `You check what you actually carry: ${gear}`
      + `${pack ? `, held in ${pack}` : ''}. `
      + `Nothing extra has appeared, and nothing you listed is missing.`
    );
  }

  if (focus && (intent.kind === 'move' || /\b(go to|walk to|head to|approach)\b/i.test(action))) {
    const around = live ? ` ${live.charAt(0).toUpperCase()}${live.slice(1)}.` : '';
    return `You move to ${focus} and stop within reach of it.${around} You can search it, watch from here, or turn back.`;
  }

  return `${prefix}${premiseFrame(state, place)} ${lookAroundNarration(state, lastSceneProse, place)}`;
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
