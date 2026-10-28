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

/** Quote one ledger/authored line as this speaker's reply (shared attach shape). */
function quotedReply(speaker: Speaker, words: string): { line: string; words: string } {
  const w = words.replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim();
  return { line: `${capitalize(speaker.label)} said, "${w}"`, words: w };
}

/**
 * Engine-recorded mute only (corpse / lastKill). SRD undead mute is owned by motiveLinesOf
 * (empty group lines); here lastKill is the shared corpse lock.
 * SRD 5.2.1 Communicating — brief speech is free unless they cannot speak.
 */
function engineMuteLine(state: GameState, speaker: Speaker): { line: string } | null {
  const kill = (state.sceneFacts?.lastKill ?? '').replace(/\s+/g, ' ').trim();
  if (!kill) return null;
  if (!sameSpeaker(kill, speaker.label) && !speaker.names.some((n) => sameSpeaker(kill, n))) return null;
  return { line: `${capitalize(speaker.label)} was already down and said nothing.` };
}

/**
 * Typed ask fallback with content that fits the ask: authored topic → ledger agenda →
 * cast want → motive deflection → seed sheet. Stock motive never outranks ledger need/goal.
 * Silence only when the engine records a mute reason (lastKill). No new canned refusal bank.
 * T10X/T10Y — present groups + opening cast use the same picker.
 * SRD 5.2.1 Communicating — brief speech is free; the addressed party answers from what they know.
 */
function spokenExchangeLine(
  state: GameState,
  speaker: Speaker,
  playerInput = '',
): { line: string; words?: string } {
  const mute = engineMuteLine(state, speaker);
  if (mute) return mute;

  const memory = speaker.record;
  const ask = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const askTopic =
    ask.match(/Follow up with[^:]+:\s*(.+)$/i)?.[1]?.trim() ??
    ask.match(/\babout\s+(.+?)[.?!]?$/i)?.[1]?.trim() ??
    '';

  // Authored topic bank (who/want/where lines) before archetype motive.
  const authored = authoredTopicsFor(speaker.label)[0];
  if (authored?.line) {
    const words = firstSentence(authored.line).replace(/^["“]|["”]$/g, '').trim();
    if (words) return quotedReply(speaker, words);
  }

  // T10AF / T10AD — durable need/goal/offer before stock motive (Keep Gate steward need, not
  // "fair and square"). Prefer the bit that overlaps the Follow-up / about-topic when present.
  const ledgerBits = [
    (memory?.need ?? '').replace(/\s+/g, ' ').trim(),
    (memory?.goal?.target ?? '').replace(/\s+/g, ' ').trim(),
    (memory?.offer ?? '').replace(/\s+/g, ' ').trim(),
  ].filter((w) => w.length >= 3);
  if (ledgerBits.length) {
    const topicLow = askTopic.toLowerCase();
    const fit =
      (topicLow
        ? ledgerBits.find((b) => {
            const bl = b.toLowerCase();
            return bl.includes(topicLow) || topicLow.includes(bl) || topicLow.split(/\s+/).some((t) => t.length >= 4 && bl.includes(t));
          })
        : undefined) ?? ledgerBits[0]!;
    return quotedReply(speaker, fit);
  }

  const cast = openingCastNames(state);
  const isCast =
    cast.some((n) => sameSpeaker(n, speaker.label)) ||
    sameSpeaker(openingCastLabel(state), speaker.label);
  const want = isCast ? shortCardWant(state).replace(/\s+/g, ' ').trim() : '';
  if (want) return quotedReply(speaker, want);

  // Deflection naming what they want — only when no ledger agenda (T10AF: never append on top of silence).
  const own = motiveAnswer(state, [speaker.label, ...speaker.names]);
  if (own?.spoken?.words) return { line: own.line, words: own.spoken.words };
  if (own?.line) {
    const q = own.line.match(/["“]([^"”]+)["”]/);
    return { line: own.line, words: (q?.[1] ?? '').replace(/\s+/g, ' ').trim() || undefined };
  }

  // T10AA — road walkers / empty memory: seed-stable sheet motive (same as ensureNpcSheet).
  const sheet = pickNpcSheet(speaker.label, sheetPlaceFor(state.currentLocation), {
    campaignId: state.campaignBibleId,
    roleHint: memory?.roleHint,
  });
  const words = (motiveLinesFor(sheet.motive)[0] ?? sheet.motive ?? '').replace(/\s+/g, ' ').trim();
  if (words) return quotedReply(speaker, words);

  // No engine mute and no ledger line — still one seed motive word if pick returned empty parts.
  return { line: `${capitalize(speaker.label)} said nothing.` };
}

/** Name tokens that identify this speaker in a clause (full label + non-title parts). */
function speakerNameTokens(label: string): string[] {
  const bare = label.replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!bare) return [];
  const parts = bare.split(/\s+/).filter((w) => w.length >= 3 && !HONORIFIC.test(w));
  return [...new Set([bare, ...parts])];
}

function clauseNamesSpeaker(clause: string, label: string): boolean {
  return speakerNameTokens(label).some((t) => new RegExp(`\\b${esc(t)}\\b`, 'i').test(clause));
}

/**
 * Content-free non-answer for this speaker: named, no quoted speech content, speech denied or empty.
 * One structural check (speech claim + empty/negation) — not a growing synonym list.
 * T10AF — match on any name token ("Bertil" / "Dunn") so "Bertil Pike" silence still strips.
 */
function isSpeakerNonAnswerClause(clause: string, label: string): boolean {
  if (!clauseNamesSpeaker(clause, label)) return false;
  // Ignore orphan quote marks left by splitting on ? inside a prior PC quote.
  const body = clause.replace(/^["\u201c\u201d'\u2018\u2019]+/, '').replace(/["\u201c\u201d'\u2018\u2019]+$/, '');
  if (/["\u201c][^"\u201d]{2,}["\u201d]/.test(body)) return false;
  // "said nothing that the parcel…" is a silence/content splice — whole clause is non-answer.
  if (/\bsaid nothing\s+(?:that|with|about|but)\b/i.test(body)) return true;
  if (/\bgave\b[\s\S]{0,40}\bnothing\b/i.test(body)) return true;
  const speech =
    /\b(?:said|say|says|answer(?:ed|s)?|spoke|speak|tell(?:s|ing)?|told|replied|reply|whisper(?:ed|s)?|offered)\b/i.test(
      body,
    );
  const empty =
    /\b(?:nothing|no answer|not\b[\s\S]{0,24}\b(?:word|answer|speak)|silent|quiet|mute)\b/i.test(body) ||
    /\b(?:went|stayed|remained)\s+(?:stiff\s+and\s+)?(?:quiet|silent)\b/i.test(body) ||
    /\b(?:said|say|says|answer(?:ed|s)?|spoke|speak|offered)\s+no\b/i.test(body);
  return speech && empty;
}

/** Split on .!? outside quotes so a PC "?" does not orphan the next speaker clause (T10AF T6). */
function splitClausesOutsideQuotes(prose: string): string[] {
  const raw = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const out: string[] = [];
  let start = 0;
  let q: '"' | '\u201c' | null = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (q === '"') {
      if (ch === '"' || ch === '\u201d') q = null;
      continue;
    }
    if (q === '\u201c') {
      if (ch === '\u201d') q = null;
      continue;
    }
    if (ch === '"') {
      q = '"';
      continue;
    }
    if (ch === '\u201c') {
      q = '\u201c';
      continue;
    }
    if ((ch === '.' || ch === '!' || ch === '?') && (i + 1 >= raw.length || /\s/.test(raw[i + 1]!))) {
      const piece = raw.slice(start, i + 1).trim();
      if (piece) out.push(piece);
      start = i + 1;
      while (start < raw.length && /\s/.test(raw[start]!)) start += 1;
      i = start - 1;
    }
  }
  const tail = raw.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

/** Content-free silence already on the beat for this speaker (do not stack another shrug). */
function proseHasSpeakerSilence(prose: string, speaker: Speaker): boolean {
  for (const clause of splitClausesOutsideQuotes(prose)) {
    if (isSpeakerNonAnswerClause(clause, speaker.label)) return true;
  }
  return false;
}

/**
 * Drop content-free non-answer clauses for this speaker before attaching a real exchange.
 * T10AF — sentence-boundary only (never start on a prior quote's closer — that left
 * `"..." nothing at all, but his eyes` splices). Also drop orphan silence after a closed quote.
 */
/**
 * When a PC quote and an NPC non-answer share one clause (`…"?" The steward said nothing…`
 * — no period between), drop the non-answer tail after the last closed quote (T10AF / T10AD T6).
 */
function stripNonAnswerTailAfterQuote(clause: string, label: string): string {
  let lastEnd = -1;
  for (const m of clause.matchAll(/["\u201c][^"\u201d]*["\u201d]/g)) {
    lastEnd = m.index! + m[0].length;
  }
  if (lastEnd < 0) return clause;
  const head = clause.slice(0, lastEnd).trim();
  const tail = clause.slice(lastEnd).replace(/^[,;:\s]+/, '').trim();
  if (!tail) return head;
  if (isSpeakerNonAnswerClause(tail, label)) return head;
  return clause;
}

export function stripSpeakerSilence(prose: string, speaker: { label: string }): string {
  const label = (speaker.label ?? '').trim();
  if (!label) return prose;
  const parts = splitClausesOutsideQuotes(prose);
  const kept: string[] = [];
  for (const clause of parts) {
    let next = stripNonAnswerTailAfterQuote(clause, label);
    if (isSpeakerNonAnswerClause(next, label)) continue;
    // Orphan splice after a closed quote (same clause or next): `"…" nothing at all, but…`
    // never starts a new speaker sentence — drop the remnant (T10AF Dunn T147).
    next = next.replace(
      /(["\u201d])\s*(?:nothing at all|said nothing)\b(?!\s*[,:]?\s*["\u201c])[^.!?]*/gi,
      '$1',
    );
    if (
      kept.length &&
      /["\u201d]\s*$/.test(kept[kept.length - 1]!) &&
      /^(?:nothing at all|said nothing)\b/i.test(next) &&
      !clauseNamesSpeaker(next, label)
    ) {
      continue;
    }
    next = next.replace(/\s+/g, ' ').trim();
    if (next) kept.push(next);
  }
  return kept.join(' ').replace(/\s+/g, ' ').trim();
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
  const head = before.slice(lead + 1);
  // T10AD — leading attribution (`Jax said, "…"`) is enough. Trailing same-clause only
  // (`"…," the steward said`) — never a new sentence (`The steward said nothing…`),
  // which falsely credited the PC's quote to the alone NPC at Keep Gate T6.
  const after = text.slice(end);
  if (/^\s*[A-Z]/.test(after)) return head;
  const trail = after.match(
    /^\s*,?\s*((?:the\s+)?[A-Za-z][\w'’ -]{0,40}\s+(?:said|says|asked|asks|replied|replies|whispered|answered)\b)/i,
  );
  if (trail?.[1]) return `${head} ${trail[1].trim()}`;
  return head;
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
function quotesBy(
  text: string,
  speaker: Speaker,
  alone: boolean,
  others: Speaker[],
  pcName?: string | null,
): string[] {
  const out: string[] = [];
  const pcParts = (pcName ?? '').trim() ? nameParts(pcName!.trim()) : [];
  for (const m of text.matchAll(QUOTE)) {
    let context = quoteContext(text, m.index!, m.index! + m[0].length);
    const named = (c: string) => mentions(c, speaker.names) || others.some((o) => mentions(c, o.names));
    // T10AD — do not merge the prior beat when this clause already attributes speech
    // (`Jax said, "…"`). Merging `…to the steward…whisper` made the PC quote look like the
    // steward's answer (alone + name in beatBefore).
    if (!named(context) && !/\b(?:said|says|asked|asks|replied|replies|whispered|answered)\b/i.test(context)) {
      context = `${beatBefore(text, m.index!)} ${context}`;
    }
    const theirs = mentions(context, speaker.names);
    const someoneElse = others.some((o) => mentions(context, o.names));
    // T10AD — PC's own line (`Jax said, "…"`) is never the alone-NPC answer (Keep Gate T6).
    const pcOwns = pcParts.length > 0 && mentions(context, pcParts);
    if (theirs ? !someoneElse : alone && !someoneElse && !pcOwns) out.push(m[1]!.trim());
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
  // T10AF — open-thread chips ("Follow up with Osric: the delivery…") are asks.
  if (/^Follow up with\b/i.test(t)) return true;
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
  // T10AA / T10AC / T10AD - shout/tell/call/ask(ing)/whisper at a present named person needs their reply.
  if (
    state &&
    /\b(?:ask(?:ing)?|tell(?:ing)?|shout(?:ing)?(?:\s+at)?|call(?:ing)?(?:\s+out)?(?:\s+to)?|say\s+to|whisper(?:ing)?(?:\s+to)?)\b/i.test(t)
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
    const pc = state.character?.name ?? null;
    if (quotesBy(prose, speaker, alone, others, pc).length) {
      return { prose, answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    // T10S/T10U/T10X/T10Y/T10AD/T10AF — exchange needs content (ledger / cast / motive deflection).
    // Content-free silence on the page is replaced when words exist; never stacked with a stock quote.
    const exchange = spokenExchangeLine(state, speaker, playerInput);
    let body = (prose ?? '').replace(/(?:^|\s)@+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
    const silenceOnly = !exchange.words && /\bsaid nothing\.?$/i.test(exchange.line);
    if (!silenceOnly) {
      body = stripSpeakerSilence(body, speaker);
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
    if (proseHasSpeakerSilence(body, speaker)) {
      return { prose: body, answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    return {
      prose: body ? `${body} ${exchange.line}` : exchange.line,
      answer: {
        status: 'added',
        speaker: speaker.label,
        source: 'authored',
        line: exchange.line,
      },
    };
  }
  if (!who) return { prose, answer: { status: 'nobody-here' } };
  const { speaker, alone } = who;
  const others = speakersHere(state).filter((s) => s.label !== speaker.label);
  const pc = state.character?.name ?? null;
  if (quotesBy(prose, speaker, alone, others, pc).length) {
    return { prose, answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  const real = realLine(topic, speaker);
  if (!real) {
    // T10AD — typed speech (quote / whisper) still needs motive/ledger exchange when the
    // authored who/want/where bank is empty. Bare chips ("Who are you" / "Ask what they want")
    // keep the prior no-line miss so sheet-name echoes stay off.
    const typedSpeech =
      /["\u201c]/.test(playerInput) || /\bwhisper(?:ing|ed|s)?\b/i.test(playerInput);
    if (!typedSpeech) {
      return { prose, answer: { status: 'no-line', speaker: speaker.label } };
    }
    const exchange = spokenExchangeLine(state, speaker, playerInput);
    let body = (prose ?? '').replace(/(?:^|\s)@+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
    const silenceOnly = !exchange.words && /\bsaid nothing\.?$/i.test(exchange.line);
    if (!silenceOnly) {
      body = stripSpeakerSilence(body, speaker);
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
    if (proseHasSpeakerSilence(body, speaker)) {
      return { prose: body, answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    return {
      prose: body ? `${body} ${exchange.line}` : exchange.line,
      answer: {
        status: 'added',
        speaker: speaker.label,
        source: 'authored',
        line: exchange.line,
      },
    };
  }
  const line = `${capitalize(speaker.label)} said, "${real.line}"`;
  const body = stripSpeakerSilence(prose.trim(), speaker);
  return {
    prose: body ? `${body} ${line}` : line,
    answer: { status: 'added', speaker: speaker.label, source: real.source, line },
  };
}
