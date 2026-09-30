/**
 * 29z9 — a who / want / where question put to someone here is answered in their own quoted words.
 * Runs on the committed draft after the one writer call. When the draft has no quote from them, code
 * prints one short line taken from what the ledger already holds for that person (an authored topic
 * line, their sheet name, the place name, or the last thing they actually said). No real line means
 * nothing is added: the turn stays as written and the miss is logged. Nothing here writes new dialogue.
 */
import type { GameState, NpcMemory } from './types';
import { hallTalkTopic } from './openingEstablishment';
import { openingCastRecords, presentNpcRecords } from './npcRecords';
import { authoredTopicsFor } from './manusTopicBanks';
import { realPresentPeople } from './chromeAuthority';

export type SpokenTopic = 'who' | 'want' | 'where';

export type SpokenAnswer =
  | { status: 'not-asked' | 'nobody-here' }
  | { status: 'already-quoted'; speaker: string }
  | { status: 'added'; speaker: string; source: 'authored' | 'sheet' | 'place' | 'last-said'; line: string }
  | { status: 'no-line'; speaker: string };

type Speaker = { label: string; record?: NpcMemory; names: string[] };

const TOPIC_ALIASES: Record<SpokenTopic, RegExp> = {
  who: /^(?:who|name|introduce|intro)$/i,
  want: /^(?:want|why|job|need|offer)$/i,
  where: /^(?:where|place|here|this place)$/i,
};
const HONORIFIC = /^(?:captain|father|mother|brother|sister|sergeant|lord|lady|sir|dame|master|mistress|elder|old|young|the)$/i;
const CROWD = /\b(?:bystanders|crowd|people|locals|onlookers|folk|patrons|handlers|guards|figures)\b/i;
const QUOTE = /["“]([^"“”]{2,}?)["”]/g;

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

function speakersHere(state: GameState): Speaker[] {
  const records = presentNpcRecords(state);
  if (records.length) return records.map((r) => ({ label: r.npcName, record: r, names: nameParts(r.npcName, r) }));
  return realPresentPeople(state.sceneFacts?.present ?? [])
    .filter((p) => !CROWD.test(p))
    .map((p) => ({ label: p, names: nameParts(p) }));
}

/** The person the question is put to: the one the player named, else the opening lead, else the first here. */
function addressee(state: GameState, playerInput: string): { speaker: Speaker; alone: boolean } | null {
  const here = speakersHere(state);
  if (!here.length) return null;
  const said = playerInput.toLowerCase();
  const named = here.find((s) => s.names.some((n) => new RegExp(`\\b${esc(n.toLowerCase())}\\b`).test(said)));
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

function realLine(state: GameState, topic: SpokenTopic, speaker: Speaker, others: Speaker[]): { line: string; source: 'authored' | 'sheet' | 'place' | 'last-said' } | null {
  const authored = authoredTopicsFor(speaker.label).find((t) => t.aliases.some((a) => TOPIC_ALIASES[topic].test(a)));
  if (authored) return { line: firstSentence(authored.line), source: 'authored' };
  if (topic === 'who' && speaker.record) return { line: `${speaker.record.npcName}.`, source: 'sheet' };
  const here = (state.currentLocation ?? '').trim();
  if (topic === 'where' && here) return { line: `${here}.`, source: 'place' };
  const gm = (state.log ?? []).filter((e) => e.role === 'gm').map((e) => e.content ?? '').reverse();
  for (const body of gm) {
    const said = quotesBy(body, speaker, false, others);
    if (said.length) return { line: firstSentence(said[said.length - 1]!), source: 'last-said' };
  }
  return null;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Ensure a who / want / where answer carries the addressee's own quoted words, from the ledger only. */
export function ensureSpokenAnswer(
  prose: string,
  state: GameState,
  playerInput: string
): { prose: string; answer: SpokenAnswer } {
  const topic = asked(playerInput);
  if (!topic) return { prose, answer: { status: 'not-asked' } };
  const who = addressee(state, playerInput);
  if (!who) return { prose, answer: { status: 'nobody-here' } };
  const { speaker, alone } = who;
  const others = speakersHere(state).filter((s) => s.label !== speaker.label);
  if (quotesBy(prose, speaker, alone, others).length) {
    return { prose, answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  const real = realLine(state, topic, speaker, others);
  if (!real) return { prose, answer: { status: 'no-line', speaker: speaker.label } };
  // A name given back already says who is speaking; naming them twice would echo it.
  const line = real.source === 'sheet'
    ? `"${real.line.replace(/\.$/, ',')}" came the answer.`
    : `${capitalize(speaker.label)} said, "${real.line}"`;
  const body = prose.trim();
  return {
    prose: body ? `${body} ${line}` : line,
    answer: { status: 'added', speaker: speaker.label, source: real.source, line },
  };
}
