import type { GameState } from './types';
import { primaryActionClause, type PlayerIntent } from './intentParser';
import { stripChoiceList } from './parser';
import { playerFacingLocation } from './locationName';

export { playerFacingLocation } from './locationName';

/**
 * Cross-mode guarantee: every player action must receive a concrete narrative resolution.
 * Prevents empty "You follow through…" bridges and choice-only GM replies.
 */

const BRIDGE_MARKERS =
  /you follow through —|the moment settles as you take in what changed|you press for clarity —|you commit to the action|the immediate result lands in/i;

const DEAD_STUB_MARKERS =
  /slow circuit of|main approach and watch for secondary gaps|opaque remains opaque|ordinary quiet|no fresh landmarks announce themselves|that is what you can act on next|not a blank circuit|you put the question plainly|anything the sheet and the last scene|rather than changing the subject/i;

const FINDING_CUES =
  /\b(find|found|see|saw|seen|notice|noticed|spot|spotted|hear|heard|reveal|reveals|empty|locked|ajar|open|door|entrance|exit|alley|wall|corner|shadow|quiet|noise|nothing|glint|track|tracks|window|side|rear|front|roof|balance|grip|weight|swing|hum|buzz|flicker|smell|dust|crack|gap|boarded|intact|threat|movement|stillness|cool|warm|heavy|panel|menu|level|hp|mp|greyed|grayed|readout|list|entry|entries|light in (?:your|the) hand|car|van|tunic|clothes|sword)\b/i;

const NEEDS_FINDINGS_ACTION =
  /\b(scout|circle|search|look|inspect|examin|listen|check\s+for|find|survey|recon|practice|test|ask|what|where|how|who|why|observe|scan|watch|study|wonder)\b/i;

const FOCUS_NOUN =
  /\b(car|van|truck|bus|vehicle|door|gate|alley|panel|tunic|clothes|shirt|jacket|coat|crate|body|corpse|shop|stall|sword|knife|blade|dumpster|window|wreck)\b/i;

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
      .replace(/you follow through —[^.?!]*[.?!]/gi, '')
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
  intent: PlayerIntent
): boolean {
  const job = primaryActionClause(playerAction);
  const prose = proseOnly(narrative);
  if (!prose || prose.length < 60) return true;
  if (isGenericBridgeNarrative(narrative)) return true;
  if (/bring the System panel in close/i.test(prose) && !isPanelOnlyAction(playerAction)) return true;

  const needsFindings =
    NEEDS_FINDINGS_ACTION.test(job)
    || intent.kind === 'observe'
    || intent.kind === 'search'
    || intent.kind === 'move'
    || intent.kind === 'talk';

  if (needsFindings && !FINDING_CUES.test(prose)) return true;

  const focus = job.match(FOCUS_NOUN)?.[1];
  if (focus && !new RegExp(`\\b${focus}\\b`, 'i').test(prose)) return true;

  const tokens = (job.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(
    (t) => !/^(with|from|that|this|have|into|your|their|about|would|could|should|first|other|more|closely|additional|nearest|nearby|wonder)$/.test(t)
  );
  if (tokens.length >= 3) {
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
5. If they ask a question: answer from inventory provenance, equipped slots, and established scene. Never write "the sheet", "stays unknown", or "rather than changing the subject".
6. Do NOT reply with "you follow through", "you commit to the action", "the result lands in [category]", "main approach", or "ordinary quiet" against a live scene.
7. Do NOT echo the location label as a sentence. Do NOT invent loot or named enemies without tags.
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
  const equipped = state.inventory.filter((i) => i.equipped).map((i) => i.name);
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
    return `You stand still and take in what is around you. ${head.charAt(0).toUpperCase()}${head.slice(1)}. That is the street as it is now — not a list of what you are carrying.`;
  }
  return `You stand still on ${place} and look. The place you are already in is still here: cover, the nearest wreck or doorway, and whoever is close enough to hear. You do not go blank. You do not recite your inventory.`;
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

function provenanceLine(item: { name: string; provenance?: string; description?: string }): string {
  const prov = (item.provenance ?? '').trim();
  const desc = (item.description ?? '').trim();
  if (/materializ|registration|system-issue|system logo/i.test(`${prov} ${desc}`)) {
    return `The ${item.name} came with Registration — it was on you when the System finished, not something you picked up off this street.`;
  }
  if (/found on arrival|on you when you arrived|appeared at/i.test(prov)) {
    return `The ${item.name} was on you when you arrived here (${prov}). You did not loot it from this spot.`;
  }
  if (/^campaign:/i.test(prov)) {
    return `The ${item.name} is part of the kit you started with.`;
  }
  if (prov) return `The ${item.name}: ${prov}.`;
  return `The ${item.name} is in your inventory; the street does not add a shop story for it.`;
}

function answerFromSheet(action: string, state: GameState, gear: string): string | null {
  const t = action.toLowerCase();
  const asksOrigin = /\b(where|come from|came from|whose|who(?:se)?|why (?:do|did) i (?:have|wear)|suddenly have|old cloth)\b/i.test(t);
  const asksClothes = /\b(tunic|cloth|wear|wearing|outfit|shirt|jacket|coat|armor)\b/i.test(t);
  const asksWeapon = /\b(sword|blade|knife|weapon)\b/i.test(t);
  if (!asksOrigin && !asksClothes && !asksWeapon) return null;
  if (!asksOrigin && intentLooksLikePractice(t)) return null;

  const parts: string[] = [];
  if (asksWeapon) {
    const weapon = state.inventory.find((i) => /sword|blade|knife|weapon/i.test(i.name));
    if (weapon) parts.push(provenanceLine(weapon));
  }
  if (asksClothes || (asksOrigin && /\btunic\b/.test(t))) {
    const body = state.inventory.find(
      (i) => i.equipped && (i.slot === 'Body' || /tunic|armor|leather|coat|shirt|jacket/i.test(i.name))
    );
    if (body) {
      parts.push(provenanceLine(body));
      parts.push(
        `That ${body.name} is what you are wearing now. Your old clothes are not on you — they are not listed in inventory.`
      );
    } else {
      parts.push(
        `Nothing in inventory is tagged as your old clothes. You are wearing whatever is equipped on Body, or the arrival kit.`
      );
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

  if (isGeneralLookAround(full, intent) || isGeneralLookAround(action, intent)) {
    return `${prefix}${lookAroundNarration(state, lastSceneProse, place)}`;
  }

  const sheetAnswer = answerFromSheet(action, state, gear);
  if (
    sheetAnswer
    && !isGeneralLookAround(full, intent)
    && (intent.kind === 'talk' || /\?/.test(action) || /\bwonder\b/i.test(action))
  ) {
    return prefix + sheetAnswer;
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
    if (isGeneralLookAround(full, intent) || /\baround\b/i.test(full)) {
      return `${prefix}${lookAroundNarration(state, lastSceneProse, place)}`;
    }
    return (
      sheetAnswer
      ?? `${prefix}You ask it. What you can see from here is still the same street: ${lookAroundNarration(state, lastSceneProse, place)}`
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

  return (
    `You follow through on that: ${action.replace(/[.?!]+$/g, '')}. `
    + `Here at ${place} the result is local and visible — you learn what changed in arm's reach and what you can do next with ${gear}.`
    + (live ? ` ${live.charAt(0).toUpperCase()}${live.slice(1)}.` : '')
  );
}

export function buildResolutionUserPayload(params: {
  mandateBlock: string;
  playerAction: string;
  deterministicBlock: string;
  retry: boolean;
  intent: PlayerIntent;
}): string {
  const retry = params.retry ? `${buildResolutionRetryBlock(params.playerAction, params.intent)}\n\n` : '';
  return `${params.mandateBlock}\n\n${retry}${params.playerAction}\n\n${params.deterministicBlock}`;
}
