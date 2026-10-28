import type { GameState } from './types.ts';
import { filterKidModeText } from './kidModeSafety.ts';
import {
  findUnsupportedItemClaims,
  findUngroundedNamedClaims,
  referencesAbsentCompanion,
  fallbackSuggestionForState,
} from './suggestionValidation.ts';
import { isSystemStatusChip } from './systemHousing.ts';
import { isAggregatePersonToken, isCrowdFillerToken } from './chromeAuthority.ts';
import { openingCastLabel } from './openingEstablishment.ts';
import { presentNpcRecords } from './npcRecords.ts';
import { isJourneyUnderway } from './travelJourney.ts';

/**
 * Deleted injection (2026-08-30W). Was `groundPlayerAction` for attack/flee
 * with no threat. Must never appear on the bubble, in GM playerAction, or in prose.
 */
export const CANNED_SAFER_SCENE_LINE =
  'I scan for any hostile threat before committing — if none is present, I stay alert and choose a safer scene action.';

export function isSaferSceneLeak(text: string): boolean {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (t.includes(CANNED_SAFER_SCENE_LINE)) return true;
  return (
    /\bchoose a safer scene action\b/i.test(t)
    || /\bif none is present\b/i.test(t)
    || /\bscan\b[\s\S]{0,80}\bbefore committing\b/i.test(t)
    || /\bstay alert and choose a safer\b/i.test(t)
  );
}

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
  /** The act's target is the actor's own body (Order S): the engine settles it as a self cause, never a death. */
  targetsSelf?: boolean;
}

/** The act aimed at its actor, any person: a harm verb whose object is the actor ("cast Cure Wounds on myself" has none). */
const SELF_AIMED =
  /\b(?:turn|aim|drive|plunge|fall)(?:s|ed|ing)?\b[^.!?]{0,30}\b(?:on|at|into|against|upon)\s+(?:my|your|him|her|them)sel(?:f|ves)\b|\b(?:kill|stab|cut|hang|drown|burn|poison|shoot|slash|impale|end)(?:s|ed|ing)?\s+(?:my|your|him|her|them)sel(?:f|ves)\b(?!\s+(?:free|loose|off|out|down))|\blets?\s+(?:it|the\s+(?:fire|flames?|water|sea|river|fall|cold|dark|blade))\s+(?:take|have|claim|consume|kill|end)\s+(?:me|you|him|her|them)\b|\b(?:open|slit|cut)(?:s|ting)?\s+(?:my|your|his|her|their)\s+(?:own\s+)?(?:wrists?|throat|veins)\b|\bfall(?:s|ing)?\s+on\s+(?:my|your|his|her|their)\s+(?:own\s+)?(?:sword|blade|spear|dagger|knife)\b|\bso\s+(?:that\s+)?(?:it\s+all|everything)\s+ends\b/i;

export function aimsAtSelf(text: string): boolean {
  return SELF_AIMED.test(text ?? '');
}

export interface GroundedPlayerAction {
  /** Text to send to the GM (may be soft-rewritten). */
  text: string;
  intent: PlayerIntent;
  rewritten: boolean;
  notes: string[];
}

/**
 * Visible player bubble. Typed/spoken words stay, any mode, opening or later.
 * Kid Mode may mask slurs / sex / gore. No safer-scene, stance, flee, or repair template.
 */
export function playerVisibleActionText(
  typed: string,
  contentMode?: string | null
): string {
  const trimmed = (typed ?? '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  if (contentMode === 'kid') return filterKidModeText(trimmed);
  return trimmed;
}

/** Log line + optional GM-grounded text. Bubble is never the grounded rewrite. */
export function resolvePlayerActionLines(
  typed: string,
  state: GameState,
  storyProse = '',
  contentMode?: string | null
): { displayText: string; gmText: string; intent: PlayerIntent; rewritten: boolean; notes: string[] } {
  const displayText = playerVisibleActionText(typed, contentMode);
  const grounded = groundPlayerAction(displayText, state, storyProse);
  const gmText = gmFacingPlayerAction(displayText, grounded);
  return {
    displayText,
    gmText,
    intent: grounded.intent,
    rewritten: grounded.rewritten && gmText !== displayText,
    notes: grounded.notes,
  };
}

/** GM playerAction: typed words, never the safer-scene template or inspect→speech rewrite. */
export function gmFacingPlayerAction(typed: string, grounded: GroundedPlayerAction): string {
  const display = (typed ?? '').replace(/\s+/g, ' ').trim();
  if (!display) return grounded.text;
  if (isSaferSceneLeak(grounded.text) || isSaferSceneLeak(display)) return display;
  // T10T — never feed the "does not exist here" soft-reframe when the player asked/spoke.
  if (playerTypedDialogue(display) || TALK_VERB.test(display)) return display;
  if (/\bI address\b/i.test(grounded.text)) return display;
  if (/\binstead of assuming\b/i.test(grounded.text)) return display;
  return grounded.text;
}

/** Quotes or say/ask/talk — not scan/inspect/flee/leave. */
export function playerTypedDialogue(action: string): boolean {
  const t = (action ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^["'“]/.test(t)) return true;
  if (/\b(say|said|ask|tell|speak|talk|shout|yell|whisper|call out)\b/i.test(t)) return true;
  return isSpeechOrProtest(t);
}

/** Words that make a line talk: one family for the intent parse and the event packet's verb. */
export const TALK_VERB = /\b(ask|tell|speak|talk|shout|yell|call out|persuade|intimidate|negotiate|greet)\b/i;

const RULES: { kind: IntentKind; re: RegExp; label: string }[] = [
  // T10AB — bare "escape" matched "cut off Silas's escape" as player flee; require PC flee verbs.
  { kind: 'flee', re: /\b(flee|run away|retreat|back away)\b|\bi\s+escape\b|\bescape\s+(?:the|from|to|into)\b/i, label: 'Flee / disengage' },
  {
    kind: 'refuse',
    re: /\b(i\s+refuse|i\s+won'?t|didn'?t\s+agree|don'?t\s+agree|not\s+agreeing|i\s+didn'?t\s+(?:sign|ask|want)|no\s+thanks|i\s+decline)\b/i,
    label: 'Refuse / protest',
  },
  // Practice / gear tests before attack so "practice swings" is not treated as combat.
  { kind: 'observe', re: /\b(practice|test\s+(?:the\s+)?[\w'-]+(?:\s+[\w'-]+){0,3}\s+balance|a\s+few\s+swings|warm[- ]?up)\b/i, label: 'Practice' },
  { kind: 'attack', re: /\b(attack|strike|slash|stab|shoot|fight|hit|melee|cast fireball|swing\s+(?:at|toward|towards)|grapple|shove|punch|wrestle|brawl|fistfight|unarmed)\b/i, label: 'Attack' },
  { kind: 'cast', re: /\b(cast|channel|invoke|spell)\b/i, label: 'Cast / magic' },
  { kind: 'use_item', re: /\b(use|drink|eat|equip|wield|draw|throw|deploy|attune)\b/i, label: 'Use item' },
  { kind: 'talk', re: TALK_VERB, label: 'Talk' },
  { kind: 'search', re: /\b(search|loot|rummage|investig\w*|open chest|pick lock)\b/i, label: 'Search / interact' },
  // T10AB — "Read <person>" is Wisdom (Insight); document/search "read the page" stays search/observe below.
  { kind: 'observe', re: /\bread\s+[A-Z]/i, label: 'Insight' },
  { kind: 'observe', re: /\b(observ\w*|scan|listen|look|study|inspect|watch|assess|examin\w*)\b/i, label: 'Observe' },
  { kind: 'move', re: /\b(go|move|walk|sneak|climb|enter|leave|head|approach|edge toward)\b/i, label: 'Move' },
  { kind: 'rest', re: /\b(rest|sleep|camp|recover|bandage)\b/i, label: 'Rest' },
];

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
  /\b(look around|look towards?|look at|look for|scout|search|inspect|scan|examin|assess|watch|study|enter|sneak|attack|go to|walk to|walk away|head to|approach|circle|survey|flee|run away|retreat|escape|back away|leave|what'?s?\s+(?:is\s+)?around|around me|surroundings)\b/i;

const SPEECH_OR_PROTEST =
  /\b(who'?s in charge|who is in charge|didn'?t agree|don'?t agree|are you joking|are you (?:serious|kidding)|i didn'?t (?:sign(?:\s+up)?|ask for|agree)|not agreeing|good luck\b|who'?s responsible|who (?:runs|controls) this|this is (?:a joke|ridiculous)|i didn'?t (?:ask|want) (?:for )?this|bend the knee|why should i|not much use|what(?:'s| is) (?:in )?it for me|don'?t (?:tell me|order me|make me)|who (?:are you|do you think)|i(?:'| a)?m not (?:your|here to)|i just (?:bend|kneel|obey|agree))\b/i;

/** Room exits / windows / layout — observe, never dialogue. */
const ROOM_LAYOUT_ASK =
  /\b(?:is there|are there|any other|other)\b[\s\S]{0,40}\b(?:doors?|doorways?|windows?|exits?|crawlspaces?|corridors?|hallways?|passages?)\b|\b(?:doors?|doorways?|windows?)\b[\s\S]{0,20}\bor\b[\s\S]{0,20}\b(?:doors?|doorways?|windows?)\b|\b(?:doorways?|windows?|exits?)\b[\s\S]{0,30}\bin (?:the |this )?room\b/i;

/** Look / layout questions about the current room — Perception, not Talk. */
export function isRoomLayoutExploreAsk(action: string): boolean {
  const t = action.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (ROOM_LAYOUT_ASK.test(t)) return true;
  if (
    /\b(door|doors|doorway|doorways|window|windows|exit|exits|crawlspace|corridor|hallway)\b/i.test(t)
    && /\b(is there|are there|any other|other|in (?:the |this )?room|around)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Joke, objection, refusal, or "who's in charge" — dialogue, not a physical action.
 * Look-around / scout / enter still wins when mixed into the same line.
 */
export function isSpeechOrProtest(action: string): boolean {
  const t = action.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (LOOK_OR_PHYSICAL.test(t)) return false;
  if (isRoomLayoutExploreAsk(t)) return false;
  if (SPEECH_OR_PROTEST.test(t)) return true;
  if (/^(?:who|what|why|how|where|wait|hey|excuse me)\b/i.test(t)) return true;
  if (
    /^(i (?:don't|dont|do not|think|feel|hate|like|trust|won't|will not)|ugh|wow|yeah|no way)\b/i.test(t)
    && t.split(/\s+/).length <= 24
  ) {
    return true;
  }
  if (
    !/\b(search|loot|attack|run|walk|go|enter|grab|draw|swing|look around|scan|inspect|flee|leave|retreat|escape)\b/i.test(t)
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
 * Quote spans stay whole (T10F) — same splitter as parsePlayerSteps.
 */
export function primaryActionClause(input: string): string {
  const text = input.replace(/\s+/g, ' ').trim();
  const parts = splitClauses(text).filter((s) => s.length >= 3);
  if (parts.length < 2) return text.replace(/[?]+$/g, '').trim() || text;
  const talk = [...parts].reverse().find(
    (p) =>
      isAskNearbyPerson(p)
      || isSpeechOrProtest(p)
      // Mid-clause ask ("…and ask if he knows…") counts — not only a clause that opens on the verb.
      || TALK_VERB.test(p)
  );
  if (talk && talk.split(/\s+/).length >= 3) return talk;
  const last = parts[parts.length - 1];
  if (last && last.split(/\s+/).length >= 3) return last;
  return text;
}

/**
 * Map free-text player input to a coarse programmatic intent.
 * Used for Warden rules and turn summaries — not a full command language yet.
 */
export function parsePlayerIntent(input: string, _state?: GameState): PlayerIntent {
  const intent = readIntent(input);
  return aimsAtSelf(input) ? { ...intent, targetsSelf: true } : intent;
}

function readIntent(input: string): PlayerIntent {
  const text = primaryActionClause(input);
  if (isRoomLayoutExploreAsk(text) || isRoomLayoutExploreAsk(input)) {
    return { kind: 'observe', label: 'Observe', targets: [] };
  }
  if (isSpeechOrProtest(text) || isSpeechOrProtest(input)) {
    if (/\b(refuse|won'?t|didn'?t\s+agree|don'?t\s+agree|decline)\b/i.test(text + ' ' + input)) {
      return { kind: 'refuse', label: 'Refuse / protest', targets: [] };
    }
    return { kind: 'talk', label: 'Talk / protest', targets: [] };
  }
  // T10T — ask/talk beats inventory `drink`/`eat` misuse ("places to grab a drink nearby").
  // RULES listed use_item before talk, so a conversational drink noun became use_item → reframe.
  if (TALK_VERB.test(text) || TALK_VERB.test(input)) {
    if (/\b(refuse|won'?t|didn'?t\s+agree|don'?t\s+agree|decline)\b/i.test(text + ' ' + input)) {
      return { kind: 'refuse', label: 'Refuse / protest', targets: [] };
    }
    return { kind: 'talk', label: 'Talk / protest', targets: [] };
  }
  const statusChip = isSystemStatusChip(input);
  for (const rule of RULES) {
    if (statusChip && rule.kind === 'talk') continue;
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

/**
 * Soft-ground free-typed actions before they hit the GM.
 * Typed text is never replaced by a canned missing-item sentence (T10A): real
 * inventory USE/EQUIP/GIVE misses stay notes / hard-gate facts; other clauses keep the player's words.
 * Absent companions and ungrounded targets may still clarify.
 * T10T — talk/ask about an absent noun keeps the typed line (no "does not exist" reframe).
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

  // A chip from this turn's committed pad was built by the engine from the sheet and scene, and already judged by
  // chip legality: it is never a claim of gear or people the PC lacks ("Cast Fire Bolt" is not "fire a bolt").
  const pad = state.offeredPad;
  const offeredChip =
    pad?.turn === (state.turn ?? 0) && (pad.choices ?? []).some((c) => c.trim().toLowerCase() === trimmed.toLowerCase());
  const missingItems = offeredChip ? [] : findUnsupportedItemClaims(trimmed, state);
  if (missingItems.length) {
    // Note only — do not rewrite the typed line. Carried names are the full sheet (equipped or not).
    const carried =
      (state.inventory ?? [])
        .map((i) => i.name)
        .filter(Boolean)
        .slice(0, 8)
        .join(', ') || 'nothing on the sheet';
    notes.push(`Missing item(s): ${missingItems.join(', ')} (carry: ${carried})`);
  }

  if (referencesAbsentCompanion(trimmed, state)) {
    notes.push('No companion present');
    parts.push(
      'I look for a companion to help, but none are with me — I act alone based on what is present in the scene.'
    );
  }

  const ungrounded = offeredChip ? [] : findUngroundedNamedClaims(trimmed, state, storyProse);
  if (ungrounded.length && intent.kind !== 'other') {
    // T10T — a question about something the scene lacks is still the player's act; the NPC answers
    // (or declines). Never replace the narrated ask with an "X was not there / does not exist" reframe.
    const asking = playerTypedDialogue(trimmed) || TALK_VERB.test(trimmed);
    if (asking || intent.kind === 'talk' || intent.kind === 'refuse') {
      notes.push(`Ungrounded talk target(s): ${ungrounded.join(', ')}`);
      // Keep the typed line — soft "I address…" rewrites fed Must narrate instead of the ask.
    } else if (intent.kind === 'attack' || intent.kind === 'search' || intent.kind === 'use_item') {
      // Soft-rewrite when the claim is central (attack/search/use), not every Proper noun.
      notes.push(`Ungrounded target(s): ${ungrounded.join(', ')}`);
      parts.push(
        `I focus on what is actually here instead of assuming "${ungrounded[0]}" exists — ${fallbackSuggestionForState(state).toLowerCase()}.`
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
    // Keep typed text; notes may still name a real USE/EQUIP/GIVE miss (T10A).
    return { text: trimmed, intent, rewritten: false, notes };
  }

  const rewritten = parts.join(' ');
  return {
    text: rewritten,
    intent: parsePlayerIntent(rewritten, state),
    rewritten: true,
    notes,
  };
}

// ---------- M2 multi-step reader (proto parseIntent idea; offline, no model) ----------
/** SRD 5.2.1 Communicating: brief speech is free; only mechanical aims become game actions. */
export const DEAL_KINDS = ['loan', 'borrow', 'repay', 'collect', 'promise', 'trade', 'favour'] as const;
export type DealKind = (typeof DEAL_KINDS)[number];

export type IntentStepAction =
  | IntentKind
  | 'ask_about'
  | 'deal'
  | 'persuade'
  | 'intimidate'
  | 'deceive'
  | 'sneak'
  | 'take'
  | 'buy'
  | 'recall';

export interface IntentDeal {
  kind: DealKind;
  amount?: number | null;
  item?: string | null;
  getItem?: string | null;
  dueDays?: number | null;
  terms?: string | null;
}

export type IntentTone = 'friendly' | 'neutral' | 'rude' | 'threatening' | 'flattering';

export interface IntentStep {
  action: IntentStepAction;
  target?: string | null;
  addressee?: string | null;
  topic?: string | null;
  say?: string | null;
  destination?: string | null;
  tone?: IntentTone | null;
  deal?: IntentDeal | null;
  /** Move with no grounded destination — does not travel. */
  unplacedMove?: boolean;
  /** Player clause this step came from. */
  clause?: string;
}

/** One player message → ordered steps + separate claim / system lists (never steps, never facts). */
export interface IntentRead {
  steps: IntentStep[];
  claims: string[];
  systemText: string[];
  scale: 'normal' | 'heroic' | 'absurd';
}

/** People / places / items the guard may accept (player words ∪ FactSheet / scene). */
export interface IntentSheetContext {
  people: string[];
  /** Named people actually here this beat (scene present ∪ live encounter). Speech reactions only open for these. */
  present?: string[];
  places: string[];
  items: string[];
  lastAddressee?: string | null;
}

export interface StepResolution {
  tried: string;
  done: boolean;
  reason: string;
  engineResult: string;
  /** M3 — SRD action-economy slot this step tried to spend (speech is free). */
  economySlot?: 'action' | 'bonus' | 'movement' | 'reaction' | 'object' | 'speech';
}

const MAX_STEPS = 6;

function low(s: string): string {
  return (s ?? '').toLowerCase();
}

/** Token appears in the player's own words (shared guard — not a deny-list). */
export function inPlayerText(needle: string | null | undefined, playerText: string): boolean {
  const n = low(needle ?? '').trim();
  if (!n || n.length < 2) return false;
  const t = low(playerText);
  const parts = n.split(/[^a-z0-9']+/i).filter((w) => w.length > 2);
  if (!parts.length) return t.includes(n);
  return parts.some((w) => t.includes(w));
}

/** Token is on the sheet / scene allowlist (display names only). */
export function onSheet(needle: string | null | undefined, ctx: IntentSheetContext): boolean {
  const n = low(needle ?? '').trim();
  if (!n) return false;
  const pools = [...ctx.people, ...ctx.places, ...ctx.items];
  return pools.some((p) => {
    const pl = low(p);
    return pl === n || pl.includes(n) || n.includes(pl);
  });
}

/** Ground a ref: player's words or FactSheet people/places/items; else null. */
export function groundRef(
  raw: string | null | undefined,
  playerText: string,
  ctx: IntentSheetContext
): string | null {
  const v = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!v) return null;
  if (inPlayerText(v, playerText) || onSheet(v, ctx)) return v;
  return null;
}

/** Build guard context from live state (FactSheet people/places/items shape, no FactSheet import). */
export function sheetContextFromState(state?: GameState | null): IntentSheetContext {
  if (!state) return { people: [], present: [], places: [], items: [] };
  // T10G/T10P: listen pool = who is actually here. presentNpcRecords owns road trim
  // (drops inn cast while travelling). sceneFacts.present strings still join when NOT on the
  // road so a cast stamp without a memory row (Vessa) still listens — but never while underway.
  // T10V — opening card cast (e.g. Ash Court priests) enriches a populated scene so
  // "ask the priest" resolves when harvest left only bystanders.
  // T10V-fix — never invent a listener into an empty present[] (empty-scene speech cue).
  const basePresent = [
    ...presentNpcRecords(state).map((m) => m.npcName).filter(Boolean),
    ...(isJourneyUnderway(state) ? [] : state.sceneFacts?.present ?? []),
  ].filter(Boolean) as string[];
  const openingCast = (() => {
    if (isJourneyUnderway(state) || state.openingEstablishment?.aloneArrival === true) return [] as string[];
    if (basePresent.length === 0) return [] as string[];
    const label = openingCastLabel(state).replace(/\s+/g, ' ').trim();
    // T10X — crowd fillers stay out; ledger cast groups (roof-thieves) enrich the listen pool.
    if (!label || isCrowdFillerToken(label)) return [] as string[];
    if (/^(?:the panel|the people who pulled you|the people here)$/i.test(label)) return [] as string[];
    return [label];
  })();
  const present = [
    ...basePresent,
    ...openingCast,
    ...(state.activeEncounter?.name ? [state.activeEncounter.name] : []),
  ].filter(Boolean) as string[];
  const people = [
    ...present,
    ...(state.npcMemories ?? []).map((m) => m.npcName).filter(Boolean),
    ...(state.companions ?? []).map((c) => c.name).filter(Boolean),
  ].filter(Boolean) as string[];
  const places = [
    state.currentLocation,
    ...(state.places ?? []).map((p) => p.name).filter(Boolean),
  ].filter(Boolean) as string[];
  const items = [
    ...(state.inventory ?? []).map((i) => i.name).filter(Boolean),
    ...(state.sceneFacts?.props ?? []),
  ].filter(Boolean) as string[];
  const uniq = (arr: string[]) => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of arr) {
      const k = low(x);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(x);
    }
    return out;
  };
  return {
    people: uniq(people),
    present: uniq(present),
    places: uniq(places),
    items: uniq(items),
    lastAddressee: state.sceneFacts?.lastAddressee ?? null,
  };
}

/** Letter/digit — apostrophe neighbours for I'll / 'em / don't (not a quote delimiter). */
function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57);
}

/**
 * T10F — quote span: opening mark to matching closer.
 * An apostrophe inside a word (I'll, don't) or a leading contraction ('em) is not a closer.
 * T10L — an unclosed opening quote runs to the end of the typed line (player left the closer off).
 * SRD 5.2.1 Communicating — "The speaker can say anything they want… without spending an action"
 * (Wizards of the Coast SRD 5.2.1, CC BY 4.0): the player's quoted words stay theirs in full.
 */
export function extractQuotedSpan(text: string): string | null {
  const s = text ?? '';
  /** Only unclosed spans trim a dangling end mark the player never closed. */
  const unclosed = (inner: string) => inner.replace(/[.,;:]+$/g, '').trim();
  for (const [open, close] of [
    ['"', '"'],
    ['\u201c', '\u201d'],
  ] as const) {
    const a = s.indexOf(open);
    if (a < 0) continue;
    const b = s.indexOf(close, a + 1);
    if (b > a) {
      const inner = s.slice(a + 1, b).trim();
      if (inner) return inner;
    } else {
      // T10L — unclosed double/curly open: span to end.
      const inner = unclosed(s.slice(a + 1));
      if (inner) return inner;
    }
  }
  // Straight or curly opening single quote; closer may be ' or ’
  let openAt = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch !== "'" && ch !== '\u2018') continue;
    // Mid-word apostrophe is never an opener (I'll).
    if (isWordChar(s[i - 1]) && isWordChar(s[i + 1])) continue;
    openAt = i;
    break;
  }
  if (openAt < 0) return null;
  for (let i = openAt + 1; i < s.length; i++) {
    const ch = s[i]!;
    if (ch !== "'" && ch !== '\u2019') continue;
    const prev = s[i - 1];
    const next = s[i + 1];
    // I'll / don't
    if (isWordChar(prev) && isWordChar(next)) continue;
    // 'em / 'tis while still inside the quote — not the closer
    if (isWordChar(next) && !isWordChar(prev)) continue;
    const inner = s.slice(openAt + 1, i).trim();
    return inner || null;
  }
  // T10L — unclosed single open: span to end.
  const rest = unclosed(s.slice(openAt + 1));
  return rest || null;
}

/** First quoted say in the player's typed line (full span; apostrophes stay inside). */
export function extractPlayerQuotedSay(input: string): string | null {
  return extractQuotedSpan((input ?? '').replace(/\s+/g, ' ').trim());
}

const SPEECH_VERB = 'said|says|asked|asks|replied|replies|whispered|shouted|called|answered';
/** One name token — letters, digits, apostrophes, hyphens (`salt-burners`). */
const NAME_TOK = String.raw`[A-Za-z][\w'\-]*`;
/** Name then verb then quote: `Rusk said, "…"` / `The salt-burners said, "…"`. */
const NPC_SAID_QUOTE = new RegExp(
  String.raw`\b(` + NAME_TOK + String.raw`(?:\s+` + NAME_TOK + String.raw`){0,2})\s+(` + SPEECH_VERB + String.raw`)\s*([,:]?\s*)(["“])([^"”]+)(["”])`,
  'gi',
);
/** Trailing attribution: `"…," Commander Rusk said` (T10L s3002 T6). */
const TRAILING_SAID_QUOTE = new RegExp(
  String.raw`(["“])([^"”]+)(["”])\s*,?\s*(` + NAME_TOK + String.raw`(?:\s+` + NAME_TOK + String.raw`){0,2})\s+(` + SPEECH_VERB + String.raw`)\b`,
  'gi',
);

function foldSpeech(t: string): string {
  // T10S — curly apostrophes / quotes must not block PC-quote reattribution (Silas’s vs Silas's).
  return t
    .toLowerCase()
    .replace(/[\u2018\u2019\u201b]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function pcFirstOf(pcName?: string | null): string {
  return (pcName ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
}

function isPcSpeaker(speaker: string, pcFirst: string): boolean {
  const first = speaker.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return first === 'you' || (pcFirst.length >= 2 && first === pcFirst);
}

function quoteMatchesPcSay(quote: string, want: string): boolean {
  const bare = (t: string) => foldSpeech(t).replace(/[.,;:!?]+$/g, '');
  const q = bare(quote);
  const w = bare(want);
  if (q.length < 4 || w.length < 6) return false;
  return w === q || w.includes(q) || q.includes(w);
}

/**
 * True when prose attributes a quote to someone other than the PC and that quote is
 * the player's own quoted words (or a contiguous slice of them).
 * SRD 5.2.1 Communicating — "The speaker can say anything they want… without spending an action"
 * (Wizards of the Coast SRD 5.2.1, CC BY 4.0): those words stay the PC's.
 */
export function npcHoldsPcQuote(prose: string, playerInput: string, pcName?: string | null): boolean {
  const said = extractPlayerQuotedSay(playerInput);
  if (!said || said.length < 6) return false;
  const want = foldSpeech(said);
  const pcFirst = pcFirstOf(pcName);
  const text = (prose ?? '').replace(/\s+/g, ' ');
  for (const m of text.matchAll(NPC_SAID_QUOTE)) {
    if (isPcSpeaker(m[1] ?? '', pcFirst)) continue;
    if (quoteMatchesPcSay(m[5] ?? '', want)) return true;
  }
  for (const m of text.matchAll(TRAILING_SAID_QUOTE)) {
    if (isPcSpeaker(m[4] ?? '', pcFirst)) continue;
    if (quoteMatchesPcSay(m[2] ?? '', want)) return true;
  }
  return false;
}

/**
 * T10H / T10L — when an NPC is tagged speaking the player's own quoted words, put the quote on the PC.
 * Covers `Name said, "…"` and trailing `"…," Name said`. Same ownership rule as `npcHoldsPcQuote`.
 */
export function givePcTheirQuote(prose: string, playerInput: string, pcName?: string | null): string {
  const said = extractPlayerQuotedSay(playerInput);
  if (!said || said.length < 6) return prose ?? '';
  const want = foldSpeech(said);
  const pc = (pcName ?? '').trim().split(/\s+/)[0] || 'You';
  const pcFirst = pc.toLowerCase();
  let next = (prose ?? '').replace(/\s+/g, ' ');
  next = next.replace(NPC_SAID_QUOTE, (full, speaker: string, verb: string, punct: string, open: string, quote: string, close: string) => {
    if (isPcSpeaker(speaker, pcFirst)) return full;
    if (!quoteMatchesPcSay(quote, want)) return full;
    return `${pc} ${verb}${punct ?? ', '}${open}${quote}${close}`;
  });
  next = next.replace(TRAILING_SAID_QUOTE, (full, open: string, quote: string, close: string, speaker: string, verb: string) => {
    if (isPcSpeaker(speaker, pcFirst)) return full;
    if (!quoteMatchesPcSay(quote, want)) return full;
    return `${pc} ${verb}, ${open}${quote}${close}`;
  });
  return next;
}

/**
 * T10L — drop NPC-attributed lines that are not theirs to say:
 * chip/menu label echoed as dialogue, a fragment lifted from the player's own text, or speech
 * when the engine opened no reaction slot / opened it for someone else.
 * SRD 5.2.1 Communicating — the speaker owns their words; NPCs do not speak the player's line
 * (Wizards of the Coast SRD 5.2.1, CC BY 4.0).
 */
export function stripUnauthorizedNpcSpeech(
  prose: string,
  playerInput: string,
  pcName?: string | null,
  engineFact?: string,
): string {
  const text = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return prose ?? '';
  const action = foldSpeech(playerInput);
  const pcSaid = foldSpeech(extractPlayerQuotedSay(playerInput) ?? '');
  const pcFirst = pcFirstOf(pcName);
  const fact = engineFact ?? '';
  const noSlot = /No one present to answer/i.test(fact);
  const slotWho = fact.match(/NPC reaction slot open for\s+([^.]+)/i)?.[1]?.trim() ?? null;
  const slotFold = slotWho ? foldSpeech(slotWho) : '';

  const bare = (t: string) => foldSpeech(t).replace(/[.,;:!?]+$/g, '');
  // T10V — a crowd / "people here" slot is not a single speaker: any person may answer.
  // Empty-scene "No one present" still drops invented NPC quotes; absence for a named miss does too.
  const slotIsCrowd =
    !!slotWho
    && (isAggregatePersonToken(slotWho)
      || /^(?:the\s+)?people here$/i.test(slotWho)
      || /^(?:the\s+)?people who pulled you$/i.test(slotWho));
  const emptySceneAbsence = noSlot && /empty scene/i.test(fact);
  const drop = (speaker: string, quote: string): boolean => {
    if (isPcSpeaker(speaker, pcFirst)) return false;
    const q = bare(quote);
    if (q.length < 4) return false;
    // Chip / menu label spoken back as dialogue.
    if (action.length >= 4 && (bare(action) === q || q === bare(action))) return true;
    // Fragment of the player's own text (not their deliberate quoted say — that goes to givePcTheirQuote).
    if (!pcSaid && q.length >= 6 && bare(action).includes(q)) return true;
    if (emptySceneAbsence) return true;
    if (noSlot && !slotIsCrowd) {
      // Named addressee absent: drop only that person's invented line, keep other present speakers.
      const sp = foldSpeech(speaker);
      const absent = fact.match(/Speech event:\s*you address\s+([^.]+)/i)?.[1]?.trim() ?? '';
      if (absent) {
        const af = foldSpeech(absent);
        if (sp === af || af.includes(sp) || sp.includes(af)) return true;
        return false;
      }
      return true;
    }
    if (slotFold && !slotIsCrowd) {
      const sp = foldSpeech(speaker);
      if (sp !== slotFold && !slotFold.includes(sp) && !sp.includes(slotFold)) return true;
    }
    return false;
  };

  let next = text;
  next = next.replace(NPC_SAID_QUOTE, (full, speaker: string, _verb: string, _punct: string, _o: string, quote: string) =>
    drop(speaker, quote) ? '' : full,
  );
  next = next.replace(TRAILING_SAID_QUOTE, (full, _o: string, quote: string, _c: string, speaker: string) =>
    drop(speaker, quote) ? '' : full,
  );
  // T10O — after a quote is stripped, collapse double stops and drop empty speech shells
  // ("Jax … spoke.." / "said what they had come to say" with no remaining quote).
  next = next.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?])/g, '$1').replace(/([.!?]){2,}/g, '$1').trim();
  if (!next) return next;
  const kept: string[] = [];
  for (const raw of next.split(/(?<=[.!?])\s+/)) {
    let s = raw.trim();
    if (!s) continue;
    // T10P — invented PC dialogue drops when the player typed no quotes: PC-tagged lines,
    // and orphan quote-led sentences (continuation of invented PC talk).
    if (!pcSaid && /["“]/.test(s)) {
      let invented = false;
      for (const m of s.matchAll(NPC_SAID_QUOTE)) {
        if (isPcSpeaker(m[1] ?? '', pcFirst)) invented = true;
      }
      for (const m of s.matchAll(TRAILING_SAID_QUOTE)) {
        if (isPcSpeaker(m[4] ?? '', pcFirst)) invented = true;
      }
      if (!invented && pcFirst) {
        const lead = new RegExp(
          String.raw`["“][^"”]+["”]\s*,?\s*(?:${pcFirst}|you)\s+(?:${SPEECH_VERB})\b`,
          'i',
        );
        const mid = new RegExp(
          String.raw`\b(?:${pcFirst}|you)\s+(?:${SPEECH_VERB})\b[^.!?"“]{0,40}["“][^"”]+["”]`,
          'i',
        );
        if (lead.test(s) || mid.test(s)) invented = true;
      }
      if (!invented && /^["“]/.test(s)) {
        let npcTagged = false;
        for (const m of s.matchAll(NPC_SAID_QUOTE)) {
          if (!isPcSpeaker(m[1] ?? '', pcFirst)) npcTagged = true;
        }
        for (const m of s.matchAll(TRAILING_SAID_QUOTE)) {
          if (!isPcSpeaker(m[4] ?? '', pcFirst)) npcTagged = true;
        }
        if (!npcTagged) invented = true;
      }
      if (invented) continue;
    }
    if (/["“]/.test(s)) {
      kept.push(s);
      continue;
    }
    // T10S — a person "answered" with no quote claims a reply that isn't on the page.
    // Ambient "the street answered" / "nobody answered" stay. Else → said nothing.
    if (
      !/\b(?:nobody|no\s+one|nothing)\b/i.test(s)
      && /\b(?:he|she|they|one of them|[A-Z][\w'-]*(?:\s+[A-Z][\w'-]*){0,2})\s+answered\b/.test(s)
    ) {
      s = s.replace(/\banswered\b/gi, 'said nothing');
    }
    // T10T — content-free voice shell ("Osric Coyne's voice rasped out, words he could not quite catch").
    // Same gap as empty "answered": claims speech with no words shown → said nothing.
    if (
      !/["“]/.test(s)
      && /\b(?:voice|words)\s+(?:rasped|came|followed|escaped|drifted)\b/i.test(s)
      && /\b(?:could not|couldn't|barely|not quite)\s+(?:catch|make out|hear|follow)\b/i.test(s)
    ) {
      const who = s.match(/\b([A-Z][\w'-]*(?:\s+[A-Z][\w'-]*){0,2})'s\s+voice\b/)?.[1] ?? null;
      s = who ? `${who} said nothing.` : 'They said nothing.';
    }
    // Bare speech verb left after the quote was removed — not a beat.
    if (/\b(?:said|spoke|asked|replied|whispered|shouted|called|answered)\s*[.!?]?$/i.test(s)) continue;
    // Speech verb + vague complement with no quote (stub rebuild after strip / invented warning).
    if (
      /\b(?:said|spoke|asked|replied)\s+(?:what they had come to say|something(?:\s+about\b)?|the warning\b)/i.test(
        s,
      )
    ) {
      continue;
    }
    kept.push(s);
  }
  return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
}

/** Split on then/and/while/?/; but never inside a quoted span (T10F). */
function splitClauses(text: string): string[] {
  const raw = text.replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const parts: string[] = [];
  let start = 0;
  let i = 0;
  /** null | '"' | "'" — which closer family is open. */
  let q: '"' | "'" | null = null;
  const push = (from: number, to: number) => {
    const s = raw.slice(from, to).replace(/^[.!,;]+|[.!,;]+$/g, '').trim();
    if (s.length >= 2) parts.push(s);
  };
  while (i < raw.length) {
    const ch = raw[i]!;
    if (q === '"') {
      if (ch === '"' || ch === '\u201d') q = null;
      i += 1;
      continue;
    }
    if (q === "'") {
      if (ch === "'" || ch === '\u2019') {
        const prev = raw[i - 1];
        const next = raw[i + 1];
        if (!(isWordChar(prev) && isWordChar(next)) && !(isWordChar(next) && !isWordChar(prev))) {
          q = null;
        }
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === '\u201c') {
      q = '"';
      i += 1;
      continue;
    }
    if ((ch === "'" || ch === '\u2018') && !(isWordChar(raw[i - 1]) && isWordChar(raw[i + 1]))) {
      q = "'";
      i += 1;
      continue;
    }
    // T10R — sentence end before a new opening quote starts a speech clause
    // (`…rattle. "Alright…` / `…table. "Oskar…`), so the quote is not glued into the act.
    if (ch === '.' || ch === '!' || ch === '?') {
      const after = raw.slice(i + 1).match(/^\s*(["\u201c\u2018])/);
      if (after) {
        push(start, i + 1);
        i += 1;
        while (i < raw.length && raw[i] === ' ') i += 1;
        start = i;
        continue;
      }
    }
    const rest = raw.slice(i);
    // Do not split a gerund adjunct off as its own subject-less clause (`while staring at Oskar`).
    const m = rest.match(/^(?:\s+(?:and then|then|, then|and)\s+|[?]+|;+)/i);
    if (m) {
      push(start, i);
      i += m[0].length;
      start = i;
      continue;
    }
    // `while` only splits when the next word is not a gerund (finite clause).
    const whileSplit = rest.match(/^\s+while\s+(?![\w']+ing\b)/i);
    if (whileSplit) {
      push(start, i);
      i += whileSplit[0].length;
      start = i;
      continue;
    }
    i += 1;
  }
  push(start, raw.length);
  return parts.length ? parts : [raw];
}

/** Instruction aimed at the game / rules / AI — never a world step. */
export function isSystemFacingText(clause: string): boolean {
  const t = clause.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^\//.test(t)) return true;
  if (/\bignore\s+(?:your|the)\s+rules\b/i.test(t)) return true;
  if (/\b(?:as|to)\s+(?:the\s+)?(?:ai|gm|game|system)\b/i.test(t) && /\b(?:set|give|make|ignore|override)\b/i.test(t)) {
    return true;
  }
  if (/\bset\s+(?:my\s+)?(?:hp|mp|gold|xp|level)\b/i.test(t)) return true;
  if (/\bgive\s+me\s+(?:god\s*mode|infinite|max)\b/i.test(t)) return true;
  return false;
}

/** Player asserts something as already true — claim list only, never a step / fact. */
export function isClaimClause(clause: string): boolean {
  const t = clause.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (isSystemFacingText(t)) return false;
  if (/\bas\s+\w[\w\s'-]{0,40}\s+told\s+me\b/i.test(t)) return true;
  if (/\bi\s+already\s+(?:paid|gave|did|told|have|was|were)\b/i.test(t)) return true;
  if (/\b(?:the\s+)?(?:guard|priest|merchant|elder)\s+(?:lets?|let|agrees?|agreed|said)\b/i.test(t)
    && !/\b(?:ask|tell|talk|attack|move|go|walk|borrow|lend|repay)\b/i.test(t)) {
    return true;
  }
  if (/\bit\s+falls?\s+dead\b|\bi\s+hit\s+for\s+\d+\b/i.test(t)) return true;
  return false;
}

function readDeal(clause: string): IntentDeal | null {
  const t = clause;
  const amount = (() => {
    const m = t.match(/\b(\d+)\s*(?:gold|gp|coins?)?\b/i);
    return m ? Number(m[1]) : null;
  })();
  const due = (() => {
    const m = t.match(/\bin\s+(\d+)\s+days?\b/i);
    return m ? Number(m[1]) : null;
  })();
  // Direction: "lend me" / "borrow" / "spare me" = they give → borrow (proto guard).
  if (/\b(?:lend|loan|spare|advance)\s+me\b|\bcan\s+i\s+borrow\b|\bborrow\b|\bon\s+credit\b/i.test(t)
    && !/\b(?:i|we)\s+(?:lend|loan)\b/i.test(t)) {
    return { kind: 'borrow', amount, dueDays: due, terms: t.slice(0, 80) };
  }
  if (/\b(?:i|we)\s+(?:lend|loan)\b|\bloan\s+(?:them|him|her)\b/i.test(t)) {
    return { kind: 'loan', amount, dueDays: due, terms: t.slice(0, 80) };
  }
  if (/\brepay\b|\bpay\s+(?:you\s+)?back\b|\bpay\s+(?:the\s+)?debt\b/i.test(t)) {
    return { kind: 'repay', amount, dueDays: due, terms: t.slice(0, 80) };
  }
  if (/\bcollect\b|\bpay\s+me\s+back\b|\bowe\s+me\b/i.test(t)) {
    return { kind: 'collect', amount, dueDays: due, terms: t.slice(0, 80) };
  }
  // T10AB — "I swear I'll break your fingers" is a threat oath, not a promise deal.
  if (/\bpromise\b|\bi\s+swear\s+to\b/i.test(t)) {
    return { kind: 'promise', amount, dueDays: due, terms: t.slice(0, 80) };
  }
  if (/\btrade\b|\bswap\b|\bexchange\b/i.test(t)) {
    return { kind: 'trade', amount, item: null, getItem: null, terms: t.slice(0, 80) };
  }
  if (/\bfavou?r\b/i.test(t)) {
    return { kind: 'favour', terms: t.slice(0, 80) };
  }
  return null;
}

function readTone(clause: string): IntentTone | null {
  if (/\b(?:threaten|or\s+else|watch\s+yourself)\b/i.test(clause)) return 'threatening';
  if (/\b(?:insult|fool|idiot|shut\s+up)\b/i.test(clause)) return 'rude';
  if (/\b(?:flatter|handsome|wise|brave)\b/i.test(clause)) return 'flattering';
  if (/\b(?:greet|please|thank|friend)\b/i.test(clause)) return 'friendly';
  return null;
}

/** Whole-word hit so a person token ("Vale") does not match inside a place ("Valespire"). */
function wordHit(hay: string, needle: string): number {
  const n = low(needle).trim();
  if (!n || n.length < 2) return -1;
  const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const m = low(hay).match(re);
  return m?.index ?? -1;
}

function pickFromPool(clause: string, pool: string[]): string | null {
  let best: string | null = null;
  let bestIdx = Infinity;
  const article = new Set(['the', 'a', 'an']);
  for (const name of pool) {
    const n = low(name);
    if (n.length < 2) continue;
    const idx = wordHit(clause, n);
    if (idx >= 0 && idx < bestIdx) {
      best = name;
      bestIdx = idx;
      continue;
    }
    // Prefer a contentful token (not an article) so "the priest" does not match every "the …".
    // T10V — "ask the priest" must hit cast "Ash Court priests" (singular ↔ plural role noun).
    const tokens = n.split(/\s+/).filter((w) => w.length > 2 && !article.has(w));
    for (const tok of tokens) {
      const forms = [tok];
      if (/ies$/i.test(tok) && tok.length > 4) forms.push(tok.replace(/ies$/i, 'y'));
      else if (/s$/i.test(tok) && !/ss$/i.test(tok) && tok.length > 3) forms.push(tok.replace(/s$/i, ''));
      for (const form of forms) {
        const j = wordHit(clause, form);
        if (j >= 0 && j < bestIdx) {
          best = name;
          bestIdx = j;
        }
      }
    }
  }
  return best;
}

/**
 * Quoted words the player typed (double or single); never a paraphrase.
 * Only a speech-framed quote counts — a mention like `not "yet"` is not PC speech,
 * and `waiting for you to say something` is not PC say `"something"` (T10L).
 * Ask/chip paraphrases are never say (T10L — no `You said, "Ask if…"` / chip echo).
 * SRD 5.2.1 Communicating — "The speaker can say anything they want…" (WotC SRD 5.2.1, CC BY 4.0).
 */
/**
 * T10U — last truly unclosed opening quote (pair-depth). A closer after a finished
 * `"…!"` must not reopen and swallow a trailing action adjunct (`while scanning…`).
 */
function trailingUnclosedQuoteSpan(t: string): string | null {
  let depth = 0;
  let openAt = -1;
  let kind: '"' | "'" | null = null;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (kind === null) {
      if (ch === '"' || ch === '\u201c') {
        kind = '"';
        depth = 1;
        openAt = i;
      } else if (
        (ch === "'" || ch === '\u2018')
        && !(isWordChar(t[i - 1]) && isWordChar(t[i + 1]))
      ) {
        kind = "'";
        depth = 1;
        openAt = i;
      }
      continue;
    }
    if (kind === '"') {
      if (ch === '"' || ch === '\u201d') {
        depth = 0;
        kind = null;
        openAt = -1;
      }
      continue;
    }
    if (ch === "'" || ch === '\u2019') {
      const prev = t[i - 1];
      const next = t[i + 1];
      if (isWordChar(prev) && isWordChar(next)) continue;
      if (isWordChar(next) && !isWordChar(prev)) continue;
      depth = 0;
      kind = null;
      openAt = -1;
    }
  }
  if (depth !== 1 || openAt < 0) return null;
  return extractQuotedSpan(t.slice(openAt));
}

function extractSay(clause: string): string | null {
  const t = (clause ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  // Clause that is itself a quoted utterance (incl. unclosed → end of line).
  if (/^["'“‘]/.test(t)) {
    return extractQuotedSpan(t);
  }
  // Quote after a speech verb — stems match clauseHasSpeechMarker (shouting / yelling / …).
  // Optional comma: `call out, '…'`. Unquoted rest after the verb is never say (T10J / T10L).
  // extractQuotedSpan stops at the closer, so `shouting "…!" while scanning…` keeps only the quote.
  const after = t.match(
    /\b(?:say|said|tell|shout(?:ing)?|yell(?:ing)?|whisper(?:ing)?|call(?:ing)?\s+out)\b[,:]?\s+(.+)$/i
  );
  if (after?.[1]) {
    return extractQuotedSpan(after[1].trim());
  }
  // T10R — trailing utterance after an act (`…on the table. "Oskar, look…` already split;
  // same-clause `…lap. "Stop hiding…` without a speech verb still counts when substantial).
  // T10U — only a truly unclosed opener; never reinterpret a finished closer as a new open.
  const inner = trailingUnclosedQuoteSpan(t);
  if (inner) {
    const words = inner.split(/\s+/).filter(Boolean);
    if (words.length >= 3 || /[.!?…]$/.test(inner)) {
      return inner;
    }
  }
  return null;
}

/** Strip PC quoted spans — body names are speech content, not the listener (except vocative). */
function clauseWithoutQuotedSpeech(clause: string): string {
  return (clause ?? '')
    .replace(/"[^"]*"/g, ' ')
    .replace(/\u201c[^\u201d]*\u201d/g, ' ')
    .replace(/'[^']*'/g, ' ')
    .replace(/\u2018[^\u2019]*\u2019/g, ' ')
    // Unclosed trailing quote (T10R / T10L) — rest of clause is still utterance content.
    .replace(/["\u201c\u2018][^"\u201d\u2019]*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Leading vocative in a PC quote (`"Oskar, look…"`) — name + comma/! right after the opener.
 * Mid-quote names (`who pays Yara`) are topics, not this shape.
 */
function leadingQuoteVocative(clause: string, pools: string[][]): string | null {
  const m = (clause ?? '').match(
    /["'\u201c\u2018]\s*([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,2})\s*[,!]/,
  );
  if (!m?.[1] || /^(?:if|whether|what|who|where|why|how|about)\b/i.test(m[1])) return null;
  for (const pool of pools) {
    const hit = pickFromPool(m[1], pool) ?? pickFromPool(`the ${m[1]}`, pool);
    if (hit) return hit;
  }
  return null;
}

/**
 * T10L / T10R-fix — who the player spoke to: ask/talk-to / possessive / quote vocative,
 * not a name that only appears as the topic of the question (`find Commander Rusk`, `who pays Yara`).
 * Framed address + vocative may resolve against the full roster (absent → absence cue).
 * Fallback pool hits only people here; quote *body* is never an addressee source.
 */
function speechAddressee(
  clause: string,
  listenPool: string[],
  roster: string[] = listenPool,
): string | null {
  const addressPools = [listenPool, roster];
  // Address framing lives outside the PC utterance (T10C: "…to Vessa and say, '…Yara.'").
  const spokenAt = clauseWithoutQuotedSpeech(clause);
  const framed = spokenAt.match(
    /\b(?:ask|tell|talk\s+to|speak\s+to|address)\s+(?:the\s+)?([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,2})/i,
  );
  if (framed?.[1] && !/^(?:if|whether|what|who|where|why|how|about)\b/i.test(framed[1])) {
    for (const pool of addressPools) {
      const hit =
        pickFromPool(framed[1], pool) ?? pickFromPool(`the ${framed[1]}`, pool);
      if (hit) return hit;
    }
  }
  if (/\b(?:ask|tell|talk|speak)\b/i.test(spokenAt)) {
    const poss = spokenAt.match(/\b(?:the\s+)?([A-Za-z][\w'-]*)'s\b/i);
    if (poss?.[1]) {
      for (const pool of addressPools) {
        const hit =
          pickFromPool(poss[1], pool) ?? pickFromPool(`the ${poss[1]}`, pool);
        if (hit) return hit;
      }
    }
  }
  // `"Oskar, look…"` — vocative is the listener; `"…who pays Yara"` is not.
  const vocative = leadingQuoteVocative(clause, addressPools);
  if (vocative) return vocative;
  // Drop topic tails so "find Commander Rusk" does not steal the addressee slot.
  const withoutTopic = spokenAt
    .replace(/\b(?:find|where(?:\s+(?:to\s+)?find)?|about|regarding|concerning)\s+.+$/i, '')
    .replace(/\bif\s+(?:he|she|they)\s+knows?\b.+$/i, '');
  // Present listeners only — roster names mentioned as topics must not win the slot.
  return pickFromPool(withoutTopic.trim() || spokenAt, listenPool);
}

/** Explicit speech marker — multi-step classification never uses the broad first-person protest heuristic. */
function clauseHasSpeechMarker(clause: string): boolean {
  const t = (clause ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^["'“]/.test(t)) return true;
  // Stem forms (asking / telling / speaking) count — `\bask\b` alone missed "asking if…" (T10P).
  if (
    /\b(?:say|said|asking|ask|telling|tell|speaking|speak|talking|talk|shout(?:ing)?|yell(?:ing)?|whisper(?:ing)?|call(?:ing)?\s+out|greet(?:ing)?)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  // T10R — a trailing quoted utterance on an act clause is still speech.
  if (extractSay(t)) return true;
  return false;
}

function nameIsPresent(name: string | null | undefined, ctx: IntentSheetContext): boolean {
  const n = low(name ?? '').trim();
  if (!n) return false;
  // Legacy callers with no present list: any sheet person may listen.
  const pool = ctx.present != null ? ctx.present : ctx.people;
  if (!pool.length) return false;
  return pool.some((p) => {
    const pl = low(p);
    return pl === n || pl.includes(n) || n.includes(pl);
  });
}

function extractTopic(clause: string): string | null {
  const m = clause.match(/\b(?:about|regarding|concerning)\s+(.+)$/i);
  if (m?.[1]) return m[1].replace(/[.!?]+$/, '').trim().slice(0, 80);
  return null;
}

function extractDestination(clause: string, ctx: IntentSheetContext): string | null {
  const toward = clause.match(
    /\b(?:to|toward|towards|into|for)\s+(?:the\s+)?([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,3})/i
  );
  const raw = toward?.[1]?.trim() ?? pickFromPool(clause, ctx.places);
  return raw || null;
}

function classifyStepAction(clause: string): IntentStepAction {
  const deal = readDeal(clause);
  if (deal) return 'deal';
  if (/\bask\s+(?:about|regarding)\b|\bask\s+\w[\w\s'-]{0,30}\s+about\b/i.test(clause)) return 'ask_about';
  if (/\bpersuade\b|\bconvince\b/i.test(clause)) return 'persuade';
  if (/\bintimidate\b|\bthreaten\b/i.test(clause)) return 'intimidate';
  if (/\bdeceive\b|\blie\s+to\b|\bbluff\b/i.test(clause)) return 'deceive';
  if (/\bsneak\b|\bstealth\b/i.test(clause)) return 'sneak';
  if (/\bbuy\b|\bpurchase\b/i.test(clause)) return 'buy';
  // M6 — steal verbs classify as take (engine resolves Sleight of Hand on the spine).
  if (/\b(steal|pickpocket|filch|swipe|palm)\b/i.test(clause)) return 'take';
  if (/\btake\b|\bpick\s+up\b|\bgrab\b/i.test(clause)) return 'take';
  if (/\bparley\b|\btalk\s+(?:it|them)\s+down\b|\bnegotiate\b/i.test(clause)) return 'persuade';
  if (/\brecall\b|\bwhat\s+did\s+\w+\s+tell\b/i.test(clause)) return 'recall';
  // Explicit speech only — never the broad first-person protest heuristic (that ate physical clauses).
  if (clauseHasSpeechMarker(clause)) return 'talk';
  for (const rule of RULES) {
    if (rule.kind === 'talk' || rule.kind === 'refuse') continue;
    if (rule.re.test(clause)) {
      return rule.kind as IntentStepAction;
    }
  }
  return 'other';
}

/**
 * ONE reader: free text → ordered steps (max 6) + claims + system_text.
 * Never rejects. Claims and system text never become steps.
 * Engine guards: addressee / target / destination from player words or sheet; last addressee carries over.
 */
export function parsePlayerSteps(
  input: string,
  ctx: IntentSheetContext = { people: [], places: [], items: [] }
): IntentRead {
  const text = (input ?? '').replace(/\s+/g, ' ').trim();
  const claims: string[] = [];
  const systemText: string[] = [];
  if (!text) return { steps: [], claims, systemText, scale: 'normal' };

  const clauses = splitClauses(text);
  const draft: IntentStep[] = [];
  // Listeners = present when the sheet stamped it (empty = alone); else legacy people pool.
  const listenPool = ctx.present != null ? ctx.present : ctx.people;
  // T10AB — "grab his collar" after naming Silas in a prior clause of the same message.
  let priorPerson: string | null = null;
  for (const clause of clauses) {
    if (isSystemFacingText(clause)) {
      systemText.push(clause);
      continue;
    }
    if (isClaimClause(clause)) {
      claims.push(clause);
      continue;
    }
    const deal = readDeal(clause);
    let action = classifyStepAction(clause);
    const say = extractSay(clause);
    const topic = extractTopic(clause);
    const tone = readTone(clause);
    // Speech addressee only from people here — memories/roster names are not listeners.
    const speechLike =
      action === 'talk'
      || action === 'ask_about'
      || action === 'persuade'
      || action === 'intimidate'
      || action === 'deceive'
      || action === 'refuse'
      || !!deal
      || !!say;
    // T10R — resolve aimed/physical targets against the full people roster, then presence
    // decides reaction vs absence (listenPool alone misses "the priest" aimed while underway).
    // Speech: framed address may use roster; fallback is presence-only and ignores quote topics.
    const roster = [...new Set([...(listenPool ?? []), ...(ctx.people ?? [])])].filter(Boolean);
    let peopleHit = speechLike
      ? speechAddressee(clause, listenPool ?? [], roster.length ? roster : (listenPool ?? []))
      : pickFromPool(clause, roster.length ? roster : listenPool);
    // Possessive body-grab ("grab his collar") inherits the person named earlier in this message.
    if (
      !peopleHit
      && priorPerson
      && /\b(his|her|their)\s+(collar|throat|arm|wrist|coat|shirt)\b/i.test(clause)
    ) {
      peopleHit = priorPerson;
    }
    if (peopleHit) priorPerson = peopleHit;
    let destination: string | null = null;
    let target: string | null = null;
    let addressee: string | null = null;
    if (action === 'move' || action === 'sneak') {
      destination = extractDestination(clause, ctx);
    } else if (action === 'use_item' || action === 'take' || action === 'buy') {
      target = pickFromPool(clause, ctx.items) ?? peopleHit;
      // Aimed-at person on a toss/give/wink still needs the addressee slot for presence.
      // Person-aimed take/grab stays `take` at parse (T10X); typedFreeText resolves grapple/threat.
      if (peopleHit) addressee = peopleHit;
    } else if (action === 'attack' || action === 'search' || action === 'observe') {
      target = peopleHit ?? pickFromPool(clause, ctx.items) ?? pickFromPool(clause, ctx.places);
      if (peopleHit) addressee = peopleHit;
    } else {
      addressee = peopleHit;
      target = peopleHit;
    }
    if (deal && !addressee) addressee = peopleHit;
    if (say && !addressee) addressee = peopleHit;
    // T10AB — free-typed blade/pin/grab (or cutting off escape) at a present person resolves as
    // intimidate/grapple (SRD), not a content-free General athletics shrug.
    if (
      action === 'other'
      && peopleHit
      && (tone === 'threatening'
        || /\b(grab|collar|grapple|pin|throat|blade|dagger|sword|knife|cut\s+off\s+\w+['']?s?\s+escape)\b/i.test(
          clause,
        ))
    ) {
      action = 'intimidate';
      addressee = peopleHit;
      target = peopleHit;
    }
    // Threat/grab steps win over a soft promise-deal parse of the same clause.
    const useDeal = !!deal && action !== 'intimidate' && action !== 'attack' && action !== 'take';
    draft.push({
      action: useDeal ? 'deal' : action,
      target,
      addressee,
      topic,
      // T10L — only quoted say; never the whole ask/chip clause as PC says exactly.
      say,
      destination,
      tone,
      deal: useDeal ? deal : null,
      clause,
    });
  }

  // Engine-side guards (proto idea): refs must come from player words or the sheet.
  // Carry-over / named addressee only sticks when that person is actually present.
  let lastWho = ctx.lastAddressee?.trim() || null;
  if (lastWho && !nameIsPresent(lastWho, ctx)) lastWho = null;
  const steps: IntentStep[] = [];
  for (const st of draft) {
    const clause = st.clause ?? text;
    let addressee = groundRef(st.addressee, clause, ctx) ?? groundRef(st.addressee, text, ctx);
    const target = groundRef(st.target, clause, ctx) ?? groundRef(st.target, text, ctx);
    let destination = groundRef(st.destination, clause, ctx) ?? groundRef(st.destination, text, ctx);
    const speechLike =
      st.action === 'talk'
      || st.action === 'ask_about'
      || st.action === 'persuade'
      || st.action === 'intimidate'
      || st.action === 'deceive'
      || st.action === 'deal'
      || st.action === 'refuse';
    if (!addressee && speechLike) {
      // Carry-over when the player names nobody this clause — only if still here.
      addressee = lastWho;
    }
    // T10R — keep an absent named addressee on the step so buildClauseWriterFact can emit
    // "No one present to answer" (nulling here made pebble/wink/toss invent them as present).
    // Carry-over only sticks when they are actually here.
    if (addressee && nameIsPresent(addressee, ctx)) {
      if (inPlayerText(addressee, text)) lastWho = addressee;
      else if (onSheet(addressee, ctx) && inPlayerText(addressee, clause)) lastWho = addressee;
    }

    let action = st.action;
    let unplacedMove = false;
    if ((action === 'move' || action === 'sneak') && !destination) {
      // A move with no named/described destination does not travel.
      unplacedMove = true;
      action = 'other';
      destination = null;
    }
    steps.push({
      ...st,
      action,
      addressee: addressee,
      target: target,
      destination,
      unplacedMove,
      deal: st.deal && DEAL_KINDS.includes(st.deal.kind) ? st.deal : null,
    });
    if (steps.length >= MAX_STEPS) break;
  }

  // Pure claims/system with no actionable step → empty steps (resolver records "nothing the world can act on").
  return {
    steps: steps.slice(0, MAX_STEPS),
    claims,
    systemText,
    scale: 'normal',
  };
}

/** Map a step onto the legacy single PlayerIntent (chips / checkMath). */
export function intentFromStep(step: IntentStep): PlayerIntent {
  const kind: IntentKind =
    step.action === 'ask_about'
    || step.action === 'persuade'
    || step.action === 'intimidate'
    || step.action === 'deceive'
    || step.action === 'deal'
    || step.action === 'recall'
      ? 'talk'
      : step.action === 'sneak' || step.action === 'take' || step.action === 'buy'
        ? step.action === 'sneak'
          ? 'move'
          : step.action === 'buy'
            ? 'use_item'
            : 'search'
        : (step.action as IntentKind);
  const targets = [step.addressee, step.target, step.destination].filter(Boolean) as string[];
  return {
    kind: kind in { observe: 1, move: 1, talk: 1, attack: 1, use_item: 1, cast: 1, rest: 1, search: 1, flee: 1, refuse: 1, other: 1 }
      ? kind
      : 'other',
    label: step.deal ? `Deal (${step.deal.kind})` : step.action,
    targets: targets.slice(0, 3),
    itemName: step.deal?.item ?? undefined,
  };
}

/** Describe a step for TurnLog / FactSheet beat lines. */
export function describeIntentStep(step: IntentStep): string {
  return [
    step.action,
    step.target,
    step.addressee ? `to ${step.addressee}` : '',
    step.topic,
    step.destination ? `-> ${step.destination}` : '',
    step.deal ? `deal:${step.deal.kind}` : '',
    step.unplacedMove ? '(unplaced move)' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
