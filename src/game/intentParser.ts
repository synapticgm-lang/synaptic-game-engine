import type { GameState } from './types';
import {
  findUnsupportedItemClaims,
  findUngroundedNamedClaims,
  referencesAbsentCompanion,
  fallbackSuggestionForState,
} from './suggestionValidation';

export type IntentKind =
  | 'observe'
  | 'move'
  | 'talk'
  | 'attack'
  | 'use_item'
  | 'cast'
  | 'rest'
  | 'search'
  | 'flee'
  | 'refuse'
  | 'other';

export interface PlayerIntent {
  kind: IntentKind;
  label: string;
  targets: string[];
  itemName?: string;
}

export interface GroundedPlayerAction {
  /** Text to send to the GM (may be soft-rewritten). */
  text: string;
  intent: PlayerIntent;
  rewritten: boolean;
  notes: string[];
}

const RULES: { kind: IntentKind; re: RegExp; label: string }[] = [
  { kind: 'flee', re: /\b(flee|run away|retreat|escape|back away)\b/i, label: 'Flee / disengage' },
  {
    kind: 'refuse',
    re: /\b(i\s+refuse|i\s+won'?t|didn'?t\s+agree|don'?t\s+agree|not\s+agreeing|i\s+didn'?t\s+(?:sign|ask|want)|no\s+thanks|i\s+decline)\b/i,
    label: 'Refuse / protest',
  },
  // Practice / gear tests before attack so "practice swings" is not treated as combat.
  { kind: 'observe', re: /\b(practice|test\s+(?:the\s+)?[\w'-]+(?:\s+[\w'-]+){0,3}\s+balance|a\s+few\s+swings|warm[- ]?up)\b/i, label: 'Practice' },
  { kind: 'attack', re: /\b(attack|strike|slash|stab|shoot|fight|hit|melee|cast fireball|swing\s+(?:at|toward|towards))\b/i, label: 'Attack' },
  { kind: 'cast', re: /\b(cast|channel|invoke|spell)\b/i, label: 'Cast / magic' },
  { kind: 'use_item', re: /\b(use|drink|eat|equip|wield|draw|throw|deploy)\b/i, label: 'Use item' },
  { kind: 'talk', re: /\b(ask|tell|speak|talk|shout|yell|call out|persuade|intimidate|negotiate|greet)\b/i, label: 'Talk' },
  { kind: 'search', re: /\b(search|loot|rummage|open chest|pick lock)\b/i, label: 'Search / interact' },
  { kind: 'observe', re: /\b(observ|scan|listen|look|study|inspect|watch|assess|examin)\b/i, label: 'Observe' },
  { kind: 'move', re: /\b(go|move|walk|sneak|climb|enter|leave|head|approach|edge toward)\b/i, label: 'Move' },
  { kind: 'rest', re: /\b(rest|sleep|camp|recover|bandage)\b/i, label: 'Rest' },
];

const THREAT_PRESENT =
  /\b(creature|enemy|beast|monster|figure|silhouette|threat|hostile|attacker|foe|adversary|bandit|raider|goblin|predator)\b/i;

/** Player wants a nearby person to answer — not a narrator lecture. */
export function isAskNearbyPerson(action: string): boolean {
  return (
    /\b(ask|tell|speak(?:\s+to)?|talk(?:\s+to)?|shout|yell|call out)\b[\s\S]{0,80}\b(some\s*one|somebody|anyone|anybody|everyone|every\s+one|else|person|people|stranger|near(?:by)?|them)\b/i.test(
      action
    )
    || /\b(shout|yell|call out)\b/i.test(action)
    || /\b(ask|see)\s+if\s+(?:they|someone|some\s+one|anybody|anyone|everyone)\b/i.test(action)
    || /\bif they see\b/i.test(action)
  );
}

const LOOK_OR_PHYSICAL =
  /\b(look around|look towards?|look at|look for|scout|search|inspect|enter|sneak|attack|go to|walk to|head to|approach|circle|survey|what'?s?\s+(?:is\s+)?around|around me|surroundings)\b/i;

const SPEECH_OR_PROTEST =
  /\b(who'?s in charge|who is in charge|didn'?t agree|don'?t agree|are you joking|are you (?:serious|kidding)|i didn'?t (?:sign(?:\s+up)?|ask for|agree)|not agreeing|good luck\b|who'?s responsible|who (?:runs|controls) this|this is (?:a joke|ridiculous)|i didn'?t (?:ask|want) (?:for )?this|bend the knee|why should i|not much use|what(?:'s| is) (?:in )?it for me|don'?t (?:tell me|order me|make me)|who (?:are you|do you think)|i(?:'| a)?m not (?:your|here to)|i just (?:bend|kneel|obey|agree))\b/i;

/**
 * Joke, objection, refusal, or "who's in charge" — dialogue, not a physical action.
 * Look-around / scout / enter still wins when mixed into the same line.
 */
export function isSpeechOrProtest(action: string): boolean {
  const t = action.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (LOOK_OR_PHYSICAL.test(t)) return false;
  if (SPEECH_OR_PROTEST.test(t)) return true;
  if (/^(?:who|what|why|how|where|wait|hey|excuse me)\b/i.test(t)) return true;
  if (
    /^(i (?:don't|dont|do not|think|feel|hate|like|trust|won't|will not)|ugh|wow|yeah|no way)\b/i.test(t)
    && t.split(/\s+/).length <= 24
  ) {
    return true;
  }
  if (
    !/\b(search|loot|attack|run|walk|go|enter|grab|draw|swing|look around)\b/i.test(t)
    && (/\b(i|i'm|i'd|we|you can'?t|not if|not much)\b/i.test(t) || /^["'“]/.test(t))
    && t.split(/\s+/).length <= 40
  ) {
    return true;
  }
  return false;
}

/**
 * In "dismiss X and look for a door", the last clause is the job.
 * Question marks also split clauses so "what's going on? ask someone" keeps the ask.
 */
export function primaryActionClause(input: string): string {
  const text = input.replace(/\s+/g, ' ').trim();
  const parts = text
    .split(/\s+(?:and then|then|, then|and)\s+|[?]+/)
    .map((s) => s.replace(/^[.!,;]+|[.!,;]+$/g, '').trim())
    .filter((s) => s.length >= 3);
  if (parts.length < 2) return text.replace(/[?]+$/g, '').trim() || text;
  const talk = [...parts].reverse().find(
    (p) =>
      isAskNearbyPerson(p)
      || isSpeechOrProtest(p)
      || /^(ask|tell|speak|talk|shout|yell)\b/i.test(p)
  );
  if (talk && talk.split(/\s+/).length >= 3) return talk;
  const last = parts[parts.length - 1];
  if (last.split(/\s+/).length >= 3) return last;
  return text;
}

/**
 * Map free-text player input to a coarse programmatic intent.
 * Used for Warden rules and turn summaries — not a full command language yet.
 */
export function parsePlayerIntent(input: string, _state?: GameState): PlayerIntent {
  const text = primaryActionClause(input);
  if (isSpeechOrProtest(text) || isSpeechOrProtest(input)) {
    if (/\b(refuse|won'?t|didn'?t\s+agree|don'?t\s+agree|decline)\b/i.test(text + ' ' + input)) {
      return { kind: 'refuse', label: 'Refuse / protest', targets: [] };
    }
    return { kind: 'talk', label: 'Talk / protest', targets: [] };
  }
  for (const rule of RULES) {
    if (rule.re.test(text)) {
      const targets =
        text.match(/\b(?:the|a|an)\s+([a-z][\w'-]+(?:\s+[a-z][\w'-]+){0,2})/gi)?.map((t) =>
          t.replace(/^(the|a|an)\s+/i, '').trim()
        ) ?? [];
      const item =
        text.match(
          /\b(?:use|drink|eat|equip|wield|draw|swing|slash)\s+(?:(?:a|an|the|my|your)\s+)?([a-z][\w'-]+(?:\s+[a-z][\w'-]+){0,2})/i
        )?.[1];
      return {
        kind: rule.kind,
        label: rule.label,
        targets: targets.slice(0, 3),
        itemName: item,
      };
    }
  }
  return { kind: 'other', label: 'Free action', targets: [] };
}

function sceneHasThreat(state: GameState, storyProse: string): boolean {
  if (state.activeEncounter) return true;
  return THREAT_PRESENT.test(storyProse);
}

function sceneSpeaker(state: GameState): string {
  const present = state.sceneFacts?.present ?? [];
  if (present.some((p) => /bystander/i.test(p))) return 'a bystander';
  const named = present.find((p) => !/blue panel|cracked street/i.test(p));
  if (named?.trim()) return named.trim();
  if (state.sceneFacts?.crowd === 'present') return 'the people who are still here';
  const npc = state.npcMemories?.[0]?.npcName?.trim();
  if (npc) return npc;
  return 'whoever is actually in this scene';
}

/**
 * Soft-ground free-typed actions before they hit the GM.
 * Rewrites unowned items, absent companions, and attacks on missing foes into
 * scene-safe clarifications — matches inventory-gate UX (no hard UI break).
 */
export function groundPlayerAction(
  input: string,
  state: GameState,
  storyProse = ''
): GroundedPlayerAction {
  const trimmed = input.trim();
  const intent = parsePlayerIntent(trimmed, state);
  const notes: string[] = [];
  const parts: string[] = [];

  const missingItems = findUnsupportedItemClaims(trimmed, state);
  if (missingItems.length) {
    notes.push(`Missing item(s): ${missingItems.join(', ')}`);
    const carried =
      state.inventory
        .filter((i) => i.equipped)
        .map((i) => i.name)
        .slice(0, 3)
        .join(', ') || 'nothing equipped';
    parts.push(
      `I try to use ${missingItems.join(' / ')}, then realize I do not have it. I check what I actually carry (${carried}) and act only with that.`
    );
  }

  if (referencesAbsentCompanion(trimmed, state)) {
    notes.push('No companion present');
    parts.push(
      'I look for a companion to help, but none are with me — I act alone based on what is present in the scene.'
    );
  }

  if (
    (intent.kind === 'attack' || intent.kind === 'flee') &&
    !sceneHasThreat(state, storyProse)
  ) {
    notes.push('No established threat for combat/flee');
    parts.push(
      'I scan for any hostile threat before committing — if none is present, I stay alert and choose a safer scene action.'
    );
  }

  const ungrounded = findUngroundedNamedClaims(trimmed, state, storyProse);
  if (ungrounded.length && intent.kind !== 'other') {
    // Soft-rewrite when the claim is central (attack/search/use/talk), not every Proper noun.
    if (intent.kind === 'attack' || intent.kind === 'search' || intent.kind === 'use_item') {
      notes.push(`Ungrounded target(s): ${ungrounded.join(', ')}`);
      parts.push(
        `I focus on what is actually here instead of assuming "${ungrounded[0]}" exists — ${fallbackSuggestionForState(state).toLowerCase()}.`
      );
    } else if (intent.kind === 'talk' || intent.kind === 'refuse' || intent.kind === 'observe') {
      notes.push(`Ungrounded talk target(s): ${ungrounded.join(', ')}`);
      const who = sceneSpeaker(state);
      parts.push(
        `I address ${who} who is actually here, not "${ungrounded[0]}". My words stay: ${trimmed}`
      );
    }
  }

  if (
    intent.kind === 'cast' &&
    (state.character.mp ?? 0) <= 0 &&
    /\bspell|magic|mana|cast|channel\b/i.test(trimmed)
  ) {
    notes.push('Insufficient MP');
    parts.push(
      'I try to draw on mana, but I have no MP left — I choose a non-magical action with what I have.'
    );
  }

  if (!parts.length) {
    return { text: trimmed, intent, rewritten: false, notes: [] };
  }

  const rewritten = parts.join(' ');
  return {
    text: rewritten,
    intent: parsePlayerIntent(rewritten, state),
    rewritten: true,
    notes,
  };
}
