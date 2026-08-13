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
  /slow circuit of|main approach and watch for secondary gaps|opaque remains opaque|ordinary quiet|no fresh landmarks announce themselves|that is what you can act on next|not a blank circuit/i;

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
  if (/bring the System panel in close/i.test(prose) && !isPanelOnlyAction(job)) return true;

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
3. If they look around: continue the LAST established scene (people, noise, crystals, weather). Do not empty a live street.
4. If they practice/test gear: describe feel, balance, sound — not a quest redirect. Use ONLY equipped/inventory gear.
5. If they ask a question: answer from inventory provenance, equipped slots, and established scene. Do not say "what is opaque remains opaque" when the sheet already knows.
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
  const s = lastScene.toLowerCase();
  const bits: string[] = [];
  if (/\b(scream|shout|panic|people|crowd)\b/.test(s)) bits.push('people still moving and making noise');
  if (/\bcrystal/.test(s)) bits.push('green crystals breaking the concrete');
  if (/\b(car|van|vehicle|wreck)\b/.test(s)) bits.push('at least one wrecked vehicle on the curb');
  if (/\balley\b/.test(s)) bits.push('an alley cutting off the street');
  if (/\b(panel|system)\b/.test(s)) bits.push('the System panel still at the edge of your sight if you want it');
  const exits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
  const props = (state.locationSheet?.interactables ?? []).map((i) => i.name).filter(Boolean).slice(0, 3);
  if (exits.length) bits.push(`ways onward: ${exits.join('; ')}`);
  if (props.length) bits.push(`in reach: ${props.join(', ')}`);
  if (state.activeEncounter?.name) bits.push(`${state.activeEncounter.name} already in view`);
  if (bits.length) {
    return `Near you at ${place}: ${bits.join('; ')}.`;
  }
  return `Near you at ${place}: the street itself, ordinary cover, and whatever doorway or wreck is closest — the scene you are already in, not an empty void.`;
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
  const job = primaryActionClause(action);
  if (/\b(dismiss|close|put away|hide|ignore|wave (?:off|away))\b/i.test(action)
    && /\b(look|search|explor|door|around|walk|go)\b/i.test(job)) {
    return false;
  }
  if (/\b(look around|search|explor|open door|for an? open)\b/i.test(job)
    && !/\b(check|read|open|study)\b.{0,20}\b(system|pann?el|menu)\b/i.test(job)) {
    return false;
  }
  return /\b(system\s*pann?el|status\s+panel|character\s+sheet|system\s+menu)\b/i.test(job)
    || (/^\s*(?:check|read|open|study)\b/i.test(job) && /\b(system|pann?el|menu)\b/i.test(job));
}

function isGeneralLookAround(action: string, intent: PlayerIntent): boolean {
  if (actionFocusPhrase(action) && /\b(search|inspect|check|loot|rummage|open)\b/i.test(action)) {
    return false;
  }
  return (
    /\b(what'?s around|around me now|surroundings|scan (?:the )?(?:area|room|street)|look around|examine the immediate)\b/i.test(action)
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
  return `${parts.join(' ')} The sheet knows that much; it does not invent a merchant or a memory you have not earned. You are still carrying ${gear}.`;
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

  const sheetAnswer = answerFromSheet(action, state, gear);
  if (sheetAnswer && (intent.kind === 'talk' || /\?/.test(action) || /\bwonder\b/i.test(action))) {
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

  if (isGeneralLookAround(action, intent) || (intent.kind === 'observe' && !focus) || /\blook around\b/i.test(action)) {
    return `${prefix}You look around. ${nearby}`;
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
    return (
      sheetAnswer
      ?? (
        `You put the question plainly. From what you already know: you are in ${place}, carrying ${gear}. `
        + `Anything the sheet and the last scene do not list stays unknown — and you say so, rather than changing the subject.`
      )
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
