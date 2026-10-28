/**
 * 29z9 — a who / want / where question put to someone here is answered in their own quoted words.
 * Runs on the committed draft after the one writer call. When the draft has no quote from them, code
 * prints that person's authored line for the question. No authored line means nothing is added: an
 * earlier quote is never reused, the turn stays as written and the miss is logged. Nothing here writes
 * new dialogue.
 */
import type { GameState, NpcMemory } from './types';
import {
  hallTalkTopic,
  openingCastLabel,
  openingCastNames,
  shortCardWant,
} from './openingEstablishment';
import { openingCastRecords, presentNpcRecords, resolveNpcRecord } from './npcRecords';
import { authoredTopicsFor } from './manusTopicBanks';
import { isCrowdFillerToken } from './chromeAuthority';
import { fuzzyTypedName } from './typedNameMatch';
import { motiveAnswer, motiveLinesFor, pickNpcSheet, sheetPlaceFor } from './npcSheet';
import { peopleHere } from './chipLegality';

export type SpokenTopic = 'who' | 'want' | 'where';

export type SpokenAnswer =
  | { status: 'not-asked' | 'nobody-here' }
  | { status: 'already-quoted'; speaker: string }
  | { status: 'added'; speaker: string; source: 'authored'; line: string }
  | { status: 'no-line'; speaker: string };

type Speaker = { label: string; record?: NpcMemory; names: string[] };

const TOPIC_ALIASES: Record<SpokenTopic, RegExp> = {
  who: /^(?:who|name|introduce|intro)$/i,
  want: /^(?:want|why|job|need|offer)$/i,
  where: /^(?:where|place|here|this place)$/i,
};
const HONORIFIC = /^(?:captain|father|mother|brother|sister|sergeant|lord|lady|sir|dame|master|mistress|elder|old|young|the)$/i;
const QUOTE = /["“]([^"“”]{2,}?)["”]/g;
const QUESTION_OR_CHIP = /^(?:who|what|where|why|how|ask|look|talk|wait|inspect|travel|check|attack|flee)$/i;

function asked(playerInput: string): SpokenTopic | null {
  const topic = hallTalkTopic(playerInput);
  return topic === 'who' || topic === 'want' || topic === 'where' ? topic : null;
}

/** Words that pick this person out in prose: full name, aliases, and name parts that are not titles. */
function nameParts(label: string, record?: NpcMemory): string[] {
  const full = [label, ...(record?.aliases ?? [])].map((n) => n.trim()).filter(Boolean);
  const parts = full.flatMap((n) => n.split(/\s+/)).filter((w) => w.length >= 3 && !HONORIFIC.test(w));
  return [...new Set([...full, ...parts])];
}

const sameSpeaker = (a: string, b: string) => {
  const bare = (s: string) => s.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  return !!bare(a) && bare(a) === bare(b);
};

function speakersHere(state: GameState): Speaker[] {
  // T10AA — same universe as turnCheck/peopleHere (road companions in sceneFacts.present
  // + presentNpcRecords). Prefer records when known; never drop a present walker because
  // another record already filled the list (T10X/Y group path kept as fallback).
  // SRD 5.2.1 Communicating — brief speech is free; the addressed party here may answer.
  const seen = new Set<string>();
  const out: Speaker[] = [];
  const push = (label: string, record?: NpcMemory) => {
    if (isCrowdFillerToken(label) || !isCleanName(label)) return;
    const key = label.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const rec = record ?? resolveNpcRecord(state, label) ?? undefined;
    const prefer =
      /^(?:the|a|an)\s+/i.test(label)
        ? label
        : (state.sceneFacts?.present ?? []).find((x) => sameSpeaker(x, label) && /^(?:the|a|an)\s+/i.test(x)) ?? label;
    out.push({ label: prefer, record: rec, names: nameParts(prefer, rec) });
  };
  for (const p of peopleHere(state)) push(p);
  if (out.length) return out;
  // T10X — ledger present groups (roof-thieves) speak; crowd fillers do not.
  // T10Y — one speaker per bare name ("the crew" / "crew" collapse).
  for (const r of presentNpcRecords(state)) push(r.npcName, r);
  for (const p of state.sceneFacts?.present ?? []) push(p);
  return out;
}

/**
 * Typed ask fallback with content: motive → opening-card want for cast lead.
 * No new canned refusal bank (merge RULES) — ledger lines only; else honest silence.
 * T10X — present groups get the same picker as named NPCs (reaction slot + cast want).
 * T10Y — RPG opening cast (the crew) uses the same card want; silence is one sentence only.
 * SRD 5.2.1 Communicating — brief speech is free; the addressed party answers from what they know.
 */
function spokenExchangeLine(state: GameState, speaker: Speaker): { line: string; words?: string } {
  const own = motiveAnswer(state, [speaker.label, ...speaker.names]);
  if (own?.spoken?.words) return { line: own.line, words: own.spoken.words };
  if (own?.line) return { line: own.line };
  const cast = openingCastNames(state);
  const isCast =
    cast.some((n) => sameSpeaker(n, speaker.label)) ||
    sameSpeaker(openingCastLabel(state), speaker.label);
  const want = isCast ? shortCardWant(state).replace(/\s+/g, ' ').trim() : '';
  if (want) {
    const words = want.replace(/^["“]|["”]$/g, '').trim();
    return {
      line: `${capitalize(speaker.label)} said, "${words}"`,
      words,
    };
  }
  // T10AA — road/companion walkers often lack a saved sheet (seedTownsfolk skips journeys).
  // Derive the same seed-stable motive the sheet would have given; no new canned bank.
  const memory = speaker.record;
  if (!memory?.sheet?.motive && !memory?.motiveLines?.length) {
    const sheet = pickNpcSheet(speaker.label, sheetPlaceFor(state.currentLocation), {
      campaignId: state.campaignBibleId,
      roleHint: memory?.roleHint,
    });
    const words = (motiveLinesFor(sheet.motive)[0] ?? sheet.motive ?? '').replace(/\s+/g, ' ').trim();
    if (words) {
      return {
        line: `${capitalize(speaker.label)} said, "${words}"`,
        words,
      };
    }
  }
  // Ledger silence once — no second shrug sentence (writer may already have said nothing).
  return { line: `${capitalize(speaker.label)} said nothing.` };
}

/** Content-free silence already on the beat for this speaker (do not stack another shrug). */
function proseHasSpeakerSilence(prose: string, speaker: Speaker): boolean {
  const bare = speaker.label.replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!bare) return false;
  const re = new RegExp(
    `\\b${esc(bare)}\\b[^.!?]{0,80}\\b(?:said nothing|offered nothing|stayed completely quiet|gave up nothing|waved (?:him|her|them) off)\\b`,
    'i',
  );
  return re.test(prose);
}

/** Drop stacked content-free silence clauses for this speaker before attaching a real exchange. */
function stripSpeakerSilence(prose: string, speaker: Speaker): string {
  const bare = speaker.label.replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!bare) return prose;
  const re = new RegExp(
    `[^.!?]*\\b${esc(bare)}\\b[^.!?]*(?:said nothing|offered nothing|stayed completely quiet|gave up nothing)[^.!?]*[.!?]?\\s*`,
    'gi',
  );
  return prose.replace(re, ' ').replace(/\s+/g, ' ').trim();
}

/** A speaker label must read as a name: one line, a few words, no question or chip word ("Greyhollow Who"). */
function isCleanName(p: string): boolean {
  if (!p || /[\n\r?!:;]/.test(p)) return false;
  const words = p.trim().split(/\s+/);
  if (words.length > 5) return false;
  return !words.some((w) => QUESTION_OR_CHIP.test(w));
}

/** The person the question is put to: the one the player named, else the opening lead, else the first here. */
function addressee(state: GameState, playerInput: string): { speaker: Speaker; alone: boolean } | null {
  const here = speakersHere(state);
  if (!here.length) return null;
  const said = playerInput.toLowerCase();
  const named =
    here.find((s) => s.names.some((n) => new RegExp(`\\b${esc(n.toLowerCase())}\\b`).test(said))) ??
    here.find((s) => s.label === fuzzyTypedName(playerInput, here.map((h) => h.label)));
  const leadIds = new Set(openingCastRecords(state).map((r) => r.npcId));
  const lead = here.find((s) => s.record && leadIds.has(s.record.npcId));
  return { speaker: named ?? lead ?? here[0]!, alone: here.length === 1 };
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The sentence around a quote (outside the quote marks), used to tell who said it. */
function quoteContext(text: string, start: number, end: number): string {
  const before = text.slice(0, start);
  const lead = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '));
  const after = text.slice(end);
  const stop = after.search(/[.!?](?:\s|$)/);
  return `${before.slice(lead + 1)} ${stop < 0 ? after : after.slice(0, stop + 1)}`;
}

function mentions(context: string, names: string[]): boolean {
  return names.some((n) => new RegExp(`\\b${esc(n)}\\b`, 'i').test(context));
}

/** The sentence right before a quote — an action beat (`Sera looked him over. "…"`) attributes the line. */
function beatBefore(text: string, start: number): string {
  const before = text.slice(0, start);
  const own = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '));
  const head = before.slice(0, own + 1);
  const prev = Math.max(head.lastIndexOf('. ', head.length - 2), head.lastIndexOf('! ', head.length - 2), head.lastIndexOf('? ', head.length - 2));
  return head.slice(prev + 1);
}

/** Quotes in a text that belong to this speaker. An unattributed quote counts when they are the only one here. */
function quotesBy(text: string, speaker: Speaker, alone: boolean, others: Speaker[]): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(QUOTE)) {
    let context = quoteContext(text, m.index!, m.index! + m[0].length);
    const named = (c: string) => mentions(c, speaker.names) || others.some((o) => mentions(c, o.names));
    if (!named(context)) context = `${beatBefore(text, m.index!)} ${context}`;
    const theirs = mentions(context, speaker.names);
    const someoneElse = others.some((o) => mentions(context, o.names));
    if (theirs ? !someoneElse : alone && !someoneElse) out.push(m[1]!.trim());
  }
  return out;
}

function firstSentence(words: string): string {
  const t = words.replace(/\s+/g, ' ').trim();
  const s = t.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? t;
  return /[.!?…—-]$/.test(s) ? s : `${s}.`;
}

/** Only the person's authored line for this question. An earlier quote reprinted is an echo, not an answer. */
function realLine(topic: SpokenTopic, speaker: Speaker): { line: string; source: 'authored' } | null {
  const authored = authoredTopicsFor(speaker.label).find((t) => t.aliases.some((a) => TOPIC_ALIASES[topic].test(a)));
  return authored ? { line: firstSentence(authored.line), source: 'authored' } : null;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Typed ask / talk aimed at someone here (not a physical I-act). */
function isTypedAskOrTalk(playerInput: string, state?: GameState): boolean {
  const t = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^(?:talk(?:\s+to)?|speak(?:\s+to)?|ask)\b/i.test(t)) return true;
  if (/["\u201c]/.test(t)) return true;
  // T10AC / T10P — stem forms (asking / telling) match intentParser speech markers.
  // `\bask\b` alone missed "asking Brannoc if…" (s8603 T6).
  if (/\bask(?:ing)?\b[\s\S]{0,60}\bif\b/i.test(t)) return true;
  if (
    /\bask(?:ing)?\s+(?:the\s+)?[\w'-]+(?:\s+[\w'-]+){0,2}\b/i.test(t) &&
    /\b(?:if|whether|about|what|who|where|why|how)\b/i.test(t)
  ) {
    return true;
  }
  // T10AA / T10AC — shout/tell/call/ask(ing) at a present named person needs their reply.
  if (
    state &&
    /\b(?:ask(?:ing)?|tell(?:ing)?|shout(?:ing)?(?:\s+at)?|call(?:ing)?(?:\s+out)?(?:\s+to)?|say\s+to)\b/i.test(t)
  ) {
    const low = t.toLowerCase();
    if (peopleHere(state).some((n) => n.split(/\s+/).some((w) => w.length >= 3 && new RegExp(`\\b${esc(w.toLowerCase())}\\b`).test(low)))) {
      return true;
    }
  }
  return false;
}

/** Ensure a who / want / where answer carries the addressee's own quoted words, from the ledger only. */
export function ensureSpokenAnswer(
  prose: string,
  state: GameState,
  playerInput: string
): { prose: string; answer: SpokenAnswer } {
  const topic = asked(playerInput);
  const who = addressee(state, playerInput);
  // T10R / T10V — Talk chip / typed ask with someone here still needs an exchange beat when
  // stripUnauthorizedNpcSpeech dropped the writer's line (stub + bare `@`, or wrong crowd slot).
  if (!topic) {
    if (!isTypedAskOrTalk(playerInput, state)) return { prose, answer: { status: 'not-asked' } };
    if (!who) return { prose, answer: { status: 'nobody-here' } };
    const { speaker, alone } = who;
    const others = speakersHere(state).filter((s) => s.label !== speaker.label);
    if (quotesBy(prose, speaker, alone, others).length) {
      return { prose, answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    // T10S/T10U/T10X/T10Y — exchange needs content (motive / card want). Silence once, never stacked.
    const exchange = spokenExchangeLine(state, speaker);
    let body = (prose ?? '').replace(/(?:^|\s)@+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
    if (exchange.words) {
      body = stripSpeakerSilence(body, speaker);
    } else if (proseHasSpeakerSilence(body, speaker)) {
      return { prose: body, answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    return {
      prose: body ? `${body} ${exchange.line}` : exchange.line,
      answer: {
        status: 'added',
        speaker: speaker.label,
        source: 'authored',
        line: exchange.words ? `"${exchange.words}"` : exchange.line,
      },
    };
  }
  if (!who) return { prose, answer: { status: 'nobody-here' } };
  const { speaker, alone } = who;
  const others = speakersHere(state).filter((s) => s.label !== speaker.label);
  if (quotesBy(prose, speaker, alone, others).length) {
    return { prose, answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  const real = realLine(topic, speaker);
  if (!real) return { prose, answer: { status: 'no-line', speaker: speaker.label } };
  const line = `${capitalize(speaker.label)} said, "${real.line}"`;
  const body = prose.trim();
  return {
    prose: body ? `${body} ${line}` : line,
    answer: { status: 'added', speaker: speaker.label, source: real.source, line },
  };
}
