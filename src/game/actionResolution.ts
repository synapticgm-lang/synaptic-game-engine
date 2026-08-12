import type { GameState } from './types';
import type { PlayerIntent } from './intentParser';
import { stripChoiceList } from './parser';

/**
 * Cross-mode guarantee: every player action must receive a concrete narrative resolution.
 * Prevents empty "You follow through…" bridges and choice-only GM replies.
 */

const BRIDGE_MARKERS =
  /you follow through —|the moment settles as you take in what changed|you press for clarity —/i;

const FINDING_CUES =
  /\b(find|found|see|saw|seen|notice|noticed|spot|spotted|hear|heard|reveal|reveals|empty|locked|ajar|open|door|entrance|exit|alley|wall|corner|shadow|quiet|noise|nothing|glint|track|tracks|window|side|rear|front|roof|balance|grip|weight|swing|hum|buzz|flicker|smell|dust|crack|gap|boarded|intact|threat|movement|stillness|cool|warm|heavy|light in (?:your|the) hand)\b/i;

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
  // Bridge + almost nothing else
  if (BRIDGE_MARKERS.test(prose)) {
    const withoutBridge = prose
      .replace(/you follow through —[^.?!]*[.?!]/gi, '')
      .replace(/the moment settles[^.?!]*[.?!]/gi, '')
      .replace(/you press for clarity —[^.?!]*[.?!]/gi, '')
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

  // Action content words should leave some footprint (not a total topic swap).
  const tokens = (playerAction.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(
    (t) => !/^(with|from|that|this|have|into|your|their|about|would|could|should|first|other)$/.test(t)
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
3. If they practice/test gear: describe feel, balance, sound, confidence — not a quest redirect.
4. If they ask a question: answer from established state; say what is still unknown.
5. Do NOT reply with only "you follow through" / "the moment settles".
6. Do NOT invent loot or named enemies without tags; ordinary scenery (walls, doors, alleys, silence) is allowed.
Then give 3–4 choices grounded in what you just described.
===========================================================`;
}

/**
 * Last-resort local resolution when the model still fails after retry.
 * Stays generic enough for all genres; uses location sheet when present.
 */
export function synthesizeActionResolution(
  playerAction: string,
  intent: PlayerIntent,
  state: GameState
): string {
  const place =
    state.locationSheet?.name
    || state.currentLocation
    || state.activeDungeon?.dungeonName
    || 'your surroundings';
  const exits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
  const interactables = (state.locationSheet?.interactables ?? [])
    .map((i) => i.name)
    .filter(Boolean)
    .slice(0, 3);
  const equipped = state.inventory.find((i) => i.equipped && /sword|blade|weapon|knife|axe|bow|staff/i.test(i.name));
  const action = playerAction.replace(/\s+/g, ' ').trim().slice(0, 160);

  if (intent.kind === 'observe' || /\b(practice|test|swing|balance)\b/i.test(action)) {
    const gear = equipped?.name ?? 'your ready weapon';
    return (
      `You take a moment with ${gear} — testing weight, grip, and the arc of a controlled swing. `
      + `The balance is workable for someone newly registered; the motion steadies your breathing more than it threatens anything nearby. `
      + `${place} stays where it is while you finish the drill. Nothing answers the sound but ordinary quiet.`
    );
  }

  if (intent.kind === 'search' || intent.kind === 'move' || /\b(scout|circle|check for|survey|recon)\b/i.test(action)) {
    const exitLine = exits.length
      ? `Obvious ways onward: ${exits.join('; ')}.`
      : `You mark the main approach and watch for secondary gaps — some sealed, some merely shadowed.`;
    const propLine = interactables.length
      ? `You also clock ${interactables.join(', ')} as worth a closer look later.`
      : `No fresh threats announce themselves; the place feels still rather than empty of detail.`;
    return (
      `You follow through on the scout — working around ${place} with eyes on corners, approaches, and anything that could be another way in. `
      + `${exitLine} ${propLine} `
      + `You finish the circuit with a clearer mental map and no ambush sprung — for now.`
    );
  }

  if (intent.kind === 'talk' || /\?/.test(action)) {
    return (
      `You press the question into the open: ${action} `
      + `What the System and your senses already confirmed stays firm; what is still opaque remains opaque. `
      + `No new panel resolves every doubt, but you leave the beat with a sharper sense of what you can act on next.`
    );
  }

  return (
    `You commit to the action — ${action} `
    + `The immediate result lands in ${place}: something shifts in what you can see, hear, or know, enough to choose a next step without the world skipping ahead of you.`
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
