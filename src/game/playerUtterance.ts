import type { OpeningPromptKind } from '@/data/campaigns/types';
import type { Settings } from './types';
import { callSmallModel } from './choicePipeline';
import { parsePlayerIntent, type IntentKind, type PlayerIntent } from './intentParser';

/**
 * One interpreter for messy player chat — opening answers and in-play actions.
 * Regex is a fast path. When speech is mixed, hedged, or questioning, a small
 * model reads the line so we do not keep adding one-off strips (trailing "why?", etc.).
 */

const INTENT_LABEL: Record<IntentKind, string> = {
  observe: 'Observe',
  move: 'Move',
  talk: 'Talk',
  attack: 'Attack',
  use_item: 'Use item',
  cast: 'Cast / magic',
  rest: 'Rest',
  search: 'Search / interact',
  flee: 'Flee / disengage',
  refuse: 'Refuse / protest',
  other: 'Free action',
};

const INTENT_KINDS = new Set<IntentKind>(Object.keys(INTENT_LABEL) as IntentKind[]);

export interface SetupAnswers {
  name: string | null;
  location: string | null;
  appearance: string | null;
  kit: string | null;
  species: string | null;
}

export interface InterpretedUtterance {
  raw: string;
  messy: boolean;
  questionOnly: boolean;
  /** Cleaned action or answer — what the engine should resolve. */
  meaning: string;
  intent: PlayerIntent;
  questions: string[];
  answers: SetupAnswers;
  askedWho: boolean;
  askedWhat: boolean;
}

const EMPTY_ANSWERS: SetupAnswers = {
  name: null,
  location: null,
  appearance: null,
  kit: null,
  species: null,
};

const FILLER_HEAD =
  /^(erm|uh+|um+|uhh+|hmm+|like|so+|well|idk|i dunno|i don't know|i guess|kinda|sort of)\s+/i;

const INSULT_NAME = /\b(?:you\s+)?(perve?|creep|weirdo|freak|sicko|pervert)\b/i;

/** Insults and asides are not clothes, kit, or a System name. */
const NAMED_CLOTHES =
  /\b(jeans|boots|t-?shirt|tee|hoodie|jacket|coat|jumper|sweater|trainers|sneakers|docs?|doc\s*martens?|metallica)\b/i;

export function hasNamedClothes(raw: string): boolean {
  return NAMED_CLOTHES.test(raw);
}

export function isSetupRefusal(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (hasNamedClothes(t)) return false;
  if (/\bwhy should(?: i)? (?:give|tell|say|share|provide)\b/i.test(t)) return true;
  if (/\bwhy (?:do|would) (?:i|you) (?:give|tell|want to know|need)\b/i.test(t)) return true;
  if (/\bwhat i(?:'?m| am) wearing\b/i.test(t) && /\b(why|perve?|creep|weirdo)\b/i.test(t)) return true;
  if (/\b(none of your business|not telling|won'?t tell|mind your own|rather not)\b/i.test(t)) return true;
  if (/\bi don'?t (?:have to|want to) (?:tell|say|answer|give)\b/i.test(t)) return true;
  if (INSULT_NAME.test(t) && !extractSystemRename(t)) return true;
  if (/^(no|nope|pass|skip|whatever)\b/i.test(t) && t.split(/\s+/).length <= 6) return true;
  return false;
}

export function isJunkSetupValue(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return true;
  if (hasNamedClothes(t)) return false;
  if (isSetupRefusal(t)) return true;
  if (INSULT_NAME.test(t) && !extractSystemRename(t)) return true;
  if (/^you\s+\w+$/i.test(t)) return true;
  if (/^why\b/i.test(t)) return true;
  if (/\bwhy should\b/i.test(t)) return true;
  if (/\b(?:you'?re|your)\s+pushy\b/i.test(t)) return true;
  if (/\bgive you (?:my )?(?:name|location|designation)\b/i.test(t)) return true;
  if (/\?/.test(t) && !/\b(?:i(?:'m|m|\s+am)\s+(?:wearing|in|at)|my name is|i have|call me)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** Only an explicit rename — not "you perve". */
export function extractSystemRename(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  const patterns = [
    /\b(?:i(?:'ll| will)\s+)?(?:call|name|rename)\s+(?:you|the\s+system|it)\s+(?:to\s+)?["']?([A-Za-z][A-Za-z0-9' -]{1,24})["']?/i,
    /\b(?:your|the\s+system'?s)\s+name\s+is\s+["']?([A-Za-z][A-Za-z0-9' -]{1,24})["']?/i,
    /\b(?:i(?:'m| am) (?:naming|calling) (?:you|the\s+system))\s+["']?([A-Za-z][A-Za-z0-9' -]{1,24})["']?/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const name = m?.[1]?.trim().replace(/[.?!]+$/g, '');
    if (!name || INSULT_NAME.test(name) || /^(you|the|system|it)$/i.test(name)) continue;
    return name.replace(/\s+/g, ' ').slice(0, 32);
  }
  return null;
}

export function utteranceIsQuestionOnly(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim().replace(/[?!.,]+$/g, '');
  if (isSetupRefusal(raw)) return true;
  return /^(who are you|what'?s going on|what is this|what(?:'s| is) happening|why|huh|what|where am i|how|idk|i don'?t know)$/i.test(
    t
  );
}

/** Hedged, mixed, or questioning speech — not a clean button label. */
export function utteranceIsMessy(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (utteranceIsQuestionOnly(t)) return false;
  if (/[?]/.test(t)) return true;
  if (FILLER_HEAD.test(t)) return true;
  if (/\b(erm|uh+|um+|idk|i dunno|i guess|or what|wait|lol|lmao|tbh)\b/i.test(t)) return true;
  if (/\b(why|what|who|how|where)\b/i.test(t) && t.split(/\s+/).length > 3) return true;
  if (t.split(/[.!]/).filter((s) => s.trim().length > 2).length >= 2) return true;
  if (t.length > 90) return true;
  return false;
}

/** Drop hedges and a trailing aside-question without wiping the rest of the line. */
export function stripSpeechFiller(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(FILLER_HEAD, '')
    .replace(/\s+\b(or what|i guess|idk|i dunno)\??\s*$/i, '')
    .replace(/\s+\b(why|what'?s going on|who are you|what is this|what(?:'s| is) happening)\??\s*$/i, '')
    .replace(/[?]+$/g, '')
    .trim();
}

function collectQuestions(raw: string): string[] {
  const found: string[] = [];
  if (/\bwho\s+are\s+you\b/i.test(raw)) found.push('who are you');
  if (/\bwhat(?:'s|\s+is)\s+going\s+on\b/i.test(raw) || /\bwhat(?:'s|\s+is)\s+happening\b/i.test(raw)) {
    found.push("what's going on");
  }
  if (/\bwhy\??\s*$/i.test(raw) || /\bwhy\s+(?:is|are|do|does|did)\b/i.test(raw)) found.push('why');
  if (/\bwhere\s+am\s+i\b/i.test(raw)) found.push('where am I');
  return found;
}

function intentFromKind(kind: IntentKind, text: string): PlayerIntent {
  const parsed = parsePlayerIntent(text);
  if (parsed.kind === kind) return parsed;
  return { kind, label: INTENT_LABEL[kind], targets: parsed.targets, itemName: parsed.itemName };
}

function parseKind(raw: unknown): IntentKind | null {
  if (typeof raw !== 'string') return null;
  const k = raw.trim().toLowerCase();
  if (k === 'answer' || k === 'question') return 'other';
  return INTENT_KINDS.has(k as IntentKind) ? (k as IntentKind) : null;
}

const INTERPRET_PROMPT = `You interpret messy tabletop-RPG player chat into what they meant.
Players type like people: hedges, jokes, trailing questions, several facts in one line.
Return JSON only, no markdown:
{"meaning":"","intent":"observe|move|talk|attack|use_item|cast|rest|search|flee|other","questions":[],"name":null,"location":null,"appearance":null,"kit":null,"species":null}

Rules:
- meaning = one clear phrase of what they answered or want to do. No filler (erm, uh, like). No trailing why/what.
- A question at the end does NOT cancel a description or an action in the same line.
- If they answered setup (name, clothes/look, place, pockets, folk/body), fill those fields. meaning = the cleaned answer as a short noun phrase (no I/my).
- kit = ordinary pocket items only. Legendary/combat-grade claims → kit null.
- location = a real place they are in, never clothes.
- If they refuse a setup question (why should I give you my name, why should I tell you, why do you want to know what I'm wearing) or insult the System (you perve), all answer fields stay null. That is not clothing, kit, or a name.
- Only fill a System rename if they explicitly name it ("I'll call you X", "your name is X"). "You perve" is not a rename.
- If they only asked a question and gave no answer/action, meaning is that question, intent talk, fields null.
- If they protest, joke, refuse, or ask who is in charge, intent is talk — not a physical action.
- If they want to act in the scene, meaning is the action ("Ask someone nearby what is happening", "Hide behind the nearest car").
- intent is the primary act. Talk if they address people, protest, or ask. Observe if they look/listen. Move if they go somewhere.
- Use null for unused answer fields. questions = short strings they asked (why, what's going on, who are you).`;

function localInterpret(raw: string): InterpretedUtterance {
  const questionOnly = utteranceIsQuestionOnly(raw);
  const messy = utteranceIsMessy(raw);
  const meaning = questionOnly ? raw.replace(/\s+/g, ' ').trim() : stripSpeechFiller(raw) || raw.trim();
  const questions = collectQuestions(raw);
  return {
    raw,
    messy,
    questionOnly,
    meaning,
    intent: parsePlayerIntent(meaning),
    questions,
    answers: { ...EMPTY_ANSWERS },
    askedWho: questions.includes('who are you'),
    askedWhat: questions.some((q) => q === "what's going on" || q === 'why'),
  };
}

function mergeAnswers(base: SetupAnswers, extra: Partial<SetupAnswers>): SetupAnswers {
  return {
    name: base.name ?? extra.name ?? null,
    location: base.location ?? extra.location ?? null,
    appearance: base.appearance ?? extra.appearance ?? null,
    kit: base.kit ?? extra.kit ?? null,
    species: base.species ?? extra.species ?? null,
  };
}

export async function interpretPlayerUtterance(params: {
  raw: string;
  mode: 'opening' | 'play';
  pendingKinds?: OpeningPromptKind[];
  pendingQuestions?: string[];
  lastScene?: string;
  settings?: Settings;
  /** Opening: current field still empty after the fast path. */
  forceModel?: boolean;
  /** Play: skip the small-model call when local parse already has the act. */
  skipModel?: boolean;
}): Promise<InterpretedUtterance> {
  const raw = params.raw.replace(/\s+/g, ' ').trim();
  const local = localInterpret(raw);
  const shouldAskModel =
    !!params.settings &&
    !params.skipModel &&
    !local.questionOnly &&
    (local.messy || !!params.forceModel);

  if (!shouldAskModel) return local;

  const pending =
    params.pendingKinds?.length && params.pendingQuestions?.length
      ? params.pendingKinds.map((k, i) => `- ${k}: ${params.pendingQuestions?.[i] ?? ''}`).join('\n')
      : params.pendingKinds?.length
        ? params.pendingKinds.map((k) => `- ${k}`).join('\n')
        : '(none — they are already playing)';

  try {
    const text = await callSmallModel(
      params.settings!,
      INTERPRET_PROMPT,
      [
        `Mode: ${params.mode}`,
        `Pending setup fields:\n${pending}`,
        params.lastScene ? `Last scene (short):\n${params.lastScene.slice(0, 400)}` : '',
        `Player said:\n${raw}`,
      ]
        .filter(Boolean)
        .join('\n\n')
    );
    const json = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(json.match(/\{[\s\S]*\}/)?.[0] ?? json) as Record<string, unknown>;
    const asStr = (key: string) => {
      const v = parsed[key];
      return typeof v === 'string' && v.trim() && v !== 'null' ? v.trim() : null;
    };
    const meaning = asStr('meaning') || local.meaning;
    const kind = parseKind(parsed.intent) ?? local.intent.kind;
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      : local.questions;
    const answers = mergeAnswers(local.answers, {
      name: asStr('name'),
      location: asStr('location'),
      appearance: asStr('appearance'),
      kit: asStr('kit'),
      species: asStr('species'),
    });
    return {
      raw,
      messy: local.messy,
      questionOnly: local.questionOnly,
      meaning,
      intent: intentFromKind(kind, meaning),
      questions: questions.length ? questions : local.questions,
      answers,
      askedWho: local.askedWho || questions.some((q) => /who/i.test(q)),
      askedWhat: local.askedWhat || questions.some((q) => /what|why/i.test(q)),
    };
  } catch {
    return local;
  }
}
