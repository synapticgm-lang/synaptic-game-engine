import type { GameState } from './types';
import type { PlayerIntent } from './intentParser';
import { stripChoiceList } from './parser';
import { playerFacingLocation } from './locationName';

export { playerFacingLocation } from './locationName';

/**
 * Cross-mode guarantee: every player action must receive a concrete narrative resolution.
 * Prevents empty "You follow through…" bridges and choice-only GM replies.
 */

const BRIDGE_MARKERS =
  /you follow through —|the moment settles as you take in what changed|you press for clarity —|you commit to the action|the immediate result lands in/i;

const FINDING_CUES =
  /\b(find|found|see|saw|seen|notice|noticed|spot|spotted|hear|heard|reveal|reveals|empty|locked|ajar|open|door|entrance|exit|alley|wall|corner|shadow|quiet|noise|nothing|glint|track|tracks|window|side|rear|front|roof|balance|grip|weight|swing|hum|buzz|flicker|smell|dust|crack|gap|boarded|intact|threat|movement|stillness|cool|warm|heavy|panel|menu|level|hp|mp|greyed|grayed|readout|list|entry|entries|light in (?:your|the) hand)\b/i;

const NEEDS_FINDINGS_ACTION =
  /\b(scout|circle|search|look|inspect|examin|listen|check\s+for|find|survey|recon|practice|test|ask|what|where|how|who|why|observe|scan|watch|study)\b/i;

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
  const prose = proseOnly(narrative);
  if (!prose || prose.length < 60) return true;
  if (isGenericBridgeNarrative(narrative)) return true;

  const needsFindings =
    NEEDS_FINDINGS_ACTION.test(playerAction)
    || intent.kind === 'observe'
    || intent.kind === 'search'
    || intent.kind === 'move'
    || intent.kind === 'talk';

  if (needsFindings && !FINDING_CUES.test(prose)) return true;

  const tokens = (playerAction.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(
    (t) => !/^(with|from|that|this|have|into|your|their|about|would|could|should|first|other|more|closely|additional)$/.test(t)
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
Your prior reply did NOT resolve the player action (empty, bridge-only, or missing findings).
Player action: "${action}"
Intent: ${intent.label} (${intent.kind})
REQUIRED:
1. Write at least 3 full sentences of story prose that resolve THIS action with concrete sensory results.
2. If they scout/circle/search/inspect: say what they see, hear, and whether doors/paths/threats are present or absent.
3. If they practice/test gear: describe feel, balance, sound, confidence — not a quest redirect. Use ONLY equipped/inventory gear.
4. If they ask a question: answer from established state; say what is still unknown.
5. Do NOT reply with "you follow through", "you commit to the action", or "the result lands in [category]".
6. Do NOT invent loot, named cities/hubs, or named enemies without tags; ordinary scenery (walls, doors, alleys, silence) is allowed.
7. Do NOT echo the player's wording back as the story. Narrate what happens.
Then give 3–4 choices grounded in what you just described.
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

/**
 * Last-resort local resolution when the model still fails after retry.
 * Must resolve the player's stated action — never a substituted drill or category label.
 */
export function synthesizeActionResolution(
  playerAction: string,
  intent: PlayerIntent,
  state: GameState
): string {
  const place = playerFacingLocation(state);
  const action = playerAction.replace(/\s+/g, ' ').trim().slice(0, 160);
  const gear = carriedGearLine(state);
  const weapon = equippedWeaponName(state);
  const pack = containerName(state);
  const level = state.character?.level ?? 1;

  if (/\b(system\s+panel|status\s+panel|character\s+sheet|menus?|additional menus|system\s+want)\b/i.test(action)
    || (intent.kind === 'observe' && /\b(panel|system|menu|options?)\b/i.test(action))) {
    const locked = level < 5
      ? 'A few headings sit greyed out with a level gate — they will not open yet, and they are not choices you can take.'
      : 'The menus you have unlocked respond; nothing extra invents itself.';
    return (
      `You bring the System panel in close. Level ${level} is current, vitals match what you already feel, and the gear list shows ${gear}`
      + `${pack ? ` stored in ${pack}` : ''}. ${locked} `
      + `No distant hubs, cities, or encyclopedia headings force themselves onto the screen. The panel only reports what you have already earned.`
    );
  }

  if (/\b(what'?s around|around me now|surroundings|scan (?:the )?(?:area|room|street))\b/i.test(action)
    || intent.kind === 'search'
    || intent.kind === 'move'
    || /\b(scout|circle|check for|survey|recon)\b/i.test(action)) {
    const exits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
    const interactables = (state.locationSheet?.interactables ?? [])
      .map((i) => i.name)
      .filter(Boolean)
      .slice(0, 3);
    const foe = state.activeEncounter?.name;
    const exitLine = exits.length
      ? `Obvious ways onward: ${exits.join('; ')}.`
      : `You mark the main approach and watch for secondary gaps — some sealed, some merely shadowed.`;
    const propLine = interactables.length
      ? `You also clock ${interactables.join(', ')} as worth a closer look later.`
      : `No fresh landmarks announce themselves; the place feels still rather than empty of detail.`;
    const foeLine = foe
      ? ` ${foe} is already in view from nearby cover — not teleported in, and not a surprise the world forgot to mention.`
      : ` You finish the look-around with a clearer mental map and no ambush sprung — for now.`;
    return (
      `You take a slow circuit of ${place}, eyes on corners, approaches, and anything that could be another way in. `
      + `${exitLine} ${propLine}${foeLine}`
    );
  }

  if (/\b(practice|test|swing|balance|warm[- ]?up)\b/i.test(action)) {
    const named = weapon ?? 'your ready hands';
    return (
      `You take a moment with ${named} — testing weight, grip, and the arc of a controlled motion. `
      + `The balance is workable; the motion steadies your breathing more than it threatens anything nearby. `
      + `${place} stays where it is while you finish. Nothing answers the sound but ordinary quiet.`
    );
  }

  if (intent.kind === 'talk' || /\?/.test(action)) {
    return (
      `You press the question in earnest. What your senses and the System have already confirmed stays firm; `
      + `what is still opaque remains opaque. No distant city names or locked menus resolve the doubt for you. `
      + `You leave the beat with a sharper sense of what you can actually act on next, still carrying ${gear}.`
    );
  }

  if (/\b(inventory|what (?:do i|i actually) carry|check (?:my |what i )?(?:gear|pack|bag))\b/i.test(action)) {
    return (
      `You check what you actually carry: ${gear}`
      + `${pack ? `, held in ${pack}` : ''}. `
      + `Nothing extra has appeared, and nothing you listed is missing. You act with that kit — not with gear you do not have.`
    );
  }

  const snippet = action.replace(/[.?!]+$/g, '');
  return (
    `You try ${snippet}. In ${place} the result is immediate and local: you learn what changed, what stayed put, and what you can reach with ${gear}. `
    + `No encyclopedia heading swallows the beat, and the world does not skip ahead of you.`
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
