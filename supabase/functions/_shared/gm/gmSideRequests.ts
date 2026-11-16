/**
 * Phase 0 (gm-turn lockdown) — the repair and check calls send DATA, not a prompt.
 *
 * The browser builds a small typed payload; the gm-turn edge function validates it and builds the
 * prompt text itself with the same render functions below (synced to supabase/functions/_shared/gm).
 * The rendered text is byte-for-byte what the old client-built request strings were, so the model
 * sees the same prompt. A caller can no longer send free text as the repair or check prompt.
 */
import { engineFactForRepair } from './writerCueLines.ts';

export type SentenceRepairItem = { sentence: string; flag: string; note?: string };

export type GmRepairPayload =
  | { kind: 'sentences'; flagged: SentenceRepairItem[]; engineFact: string }
  | {
      kind: 'answer';
      /** The player's character name ('' when none). */
      pc: string;
      here: string[];
      /** "Name: line" pairs the people here are known to say. */
      known: string[];
      said: string[];
      prose: string;
      engineFact: string;
    };

export type FactCheckLine = { n: number; text: string; speech?: boolean; writing?: boolean };
export type GmCheckPayload = { kind: 'fact-check'; sheet: unknown; lines: FactCheckLine[] };

/** One request: only the flagged sentence(s), why each failed, and the engine fact. */
function renderSentenceRepair(flagged: SentenceRepairItem[], engineFact: string): string {
  const many = flagged.length > 1;
  return [
    many
      ? `Rewrite these ${flagged.length} sentences of your story. Reply with one rewritten sentence per line, in order, as plain prose. No JSON, no numbers, no other text.`
      : 'Rewrite this one sentence of your story. Reply with only the rewritten sentence as plain prose. No JSON, no other text.',
    ...flagged.map(
      (f, i) =>
        `${many ? `${i + 1}. ` : ''}Sentence: "${f.sentence}"\n${many ? '   ' : ''}Problem: ${f.flag}${f.note ? ` ${f.note}` : ''}`
    ),
    // T10S — strip Must narrate / PC says cues so a rewrite cannot mirror the player's act onto an NPC.
    `Engine fact: ${engineFactForRepair(engineFact).trim() || 'Keep only what the scene already established.'}`,
  ].join('\n');
}

/** The one request for a missing answer. The player's character is never the speaker: the player speaks for them. */
function renderAnswerRepair(p: Extract<GmRepairPayload, { kind: 'answer' }>): string {
  const pc = p.pc.trim();
  return [
    'Your story left out the answer. Write ONE sentence in which a person here answers the player.',
    'Format: the spoken words inside quote marks, plus who said it outside the quotes, e.g. "Words they say," Name said. Use a name from People here as the speaker.',
    'The spoken words say only what that person is known to say below, in their own voice: first person (I, me, my), never their own name, and never a copy of a note. Add no new fact, person, place, object or task.',
    ...(pc ? [`${pc} is the player's character: never write words, a reply or a decision for ${pc}.`] : []),
    'Reply with only that sentence as plain prose. No JSON, no other text.',
    // T10ECHO — do not paste the typed line into repair input (UI already shows it).
    `Player spoke (already shown in UI; answer with world/NPC consequence — do not restate their words).`,
    `People here: ${p.here.join('; ')}`,
    `Known to say: ${p.known.join(' | ')}`,
    ...(p.said.length ? [`Already said (say something new): ${p.said.slice(-4).map((s) => `"${s.slice(0, 100)}"`).join(' ')}`] : []),
    `Your story so far: ${p.prose.slice(0, 600)}`,
    // T10S — repair must not see Must-narrate PC acts converted to story (that pasted player clauses onto NPCs).
    `Engine fact: ${engineFactForRepair(p.engineFact).trim() || 'Keep only what the scene already established.'}`,
  ].join('\n');
}

export function renderRepairRequest(p: GmRepairPayload): string {
  return p.kind === 'answer' ? renderAnswerRepair(p) : renderSentenceRepair(p.flagged, p.engineFact);
}

export function renderCheckRequest(input: { sheet: unknown; lines: FactCheckLine[] }): string {
  return [
    'Fact check. One verdict for every numbered line: keep, remove, or repair-once.',
    'A line marked [narration] is the narrator. A line marked [speech] is an NPC talking. A line marked [writing] is a notice, sign, letter, or page: keep it as text someone read, and do not treat it as what is now true.',
    'Keep speech that recounts past events, backstory, rumour, legend, opinion, or the speaker\'s own view. Commands, offers, refusals, and lies about what already happened stay.',
    'Remove speech only when it claims that the player, the party, or a present NPC now holds something, or is now somewhere else, and that claim contradicts the sheet.',
    'Words outside the quotation marks are narration.',
    'Objects held in someone else\'s hands, or lying in the scenery, are allowed unless the player or the party gains them.',
    'A scare-quoted or so-called object that is only turned over, looked at, or described is not a gain. Keep that sentence unless it states that someone now newly holds a real item, listed or unlisted.',
    'keep = scenery, harmless speech, or a fact already on the sheet. remove = a new or wrong fact. repair-once = replace that line once.',
    'On a kept [narration] line, add "objects" only for a real portable or fixed physical thing in the place: [{"label":"old rusty sword","kind":"furniture|armour|weapon|tool|coin|other","mount":"fixed|hung|loose","owner":"place"}]. The label must use words from that line. Do not put objects on a [speech] or [writing] line. A line may be here only because it places something. Leaving "objects" off does not remove that line: the sentence stays and nothing is filed.',
    'Reply as JSON: [{"n":1,"verdict":"keep"}]. A repair-once row may include "text". A kept narration row may include "objects".',
    'SHEET:',
    JSON.stringify(input.sheet),
    'LINES:',
    ...input.lines.map((line) => {
      const tag = line.writing ? '[writing]' : line.speech ? '[speech]' : '[narration]';
      return `${line.n}. ${tag} ${line.text}`;
    }),
  ].join('\n');
}

// ── Edge-side validation: shape and size only (no wording rules). ──

const MAX_TEXT = 8_000;
const MAX_ITEMS = 24;
const MAX_SHEET_CHARS = 120_000;

const str = (v: unknown, max = MAX_TEXT): string | null => (typeof v === 'string' && v.length <= max ? v : null);
function strList(v: unknown, maxItems = MAX_ITEMS): string[] | null {
  if (!Array.isArray(v) || v.length > maxItems) return null;
  const out: string[] = [];
  for (const x of v) {
    const s = str(x);
    if (s == null) return null;
    out.push(s);
  }
  return out;
}

/** A repair payload the edge will build a prompt from, or null when the shape is wrong. */
export function readRepairPayload(raw: unknown): GmRepairPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const engineFact = str(r.engineFact, 40_000);
  if (engineFact == null) return null;
  if (r.kind === 'sentences') {
    if (!Array.isArray(r.flagged) || !r.flagged.length || r.flagged.length > MAX_ITEMS) return null;
    const flagged: SentenceRepairItem[] = [];
    for (const f of r.flagged) {
      if (!f || typeof f !== 'object') return null;
      const o = f as Record<string, unknown>;
      const sentence = str(o.sentence);
      const flag = str(o.flag);
      const note = o.note == null ? undefined : str(o.note);
      if (sentence == null || flag == null || note === null) return null;
      flagged.push(note ? { sentence, flag, note } : { sentence, flag });
    }
    return { kind: 'sentences', flagged, engineFact };
  }
  if (r.kind === 'answer') {
    const pc = str(r.pc, 200);
    const here = strList(r.here);
    const known = strList(r.known, 200);
    const said = strList(r.said, 200);
    const prose = str(r.prose, 20_000);
    if (pc == null || !here || !known || !said || prose == null) return null;
    return { kind: 'answer', pc, here, known, said, prose, engineFact };
  }
  return null;
}

/** A fact-check payload the edge will build a prompt from, or null when the shape is wrong. */
export function readCheckPayload(raw: unknown): GmCheckPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.kind !== 'fact-check') return null;
  if (!r.sheet || typeof r.sheet !== 'object' || Array.isArray(r.sheet)) return null;
  if (JSON.stringify(r.sheet).length > MAX_SHEET_CHARS) return null;
  if (!Array.isArray(r.lines) || !r.lines.length || r.lines.length > 64) return null;
  const lines: FactCheckLine[] = [];
  for (const l of r.lines) {
    if (!l || typeof l !== 'object') return null;
    const o = l as Record<string, unknown>;
    const text = str(o.text);
    if (!Number.isInteger(o.n) || text == null) return null;
    lines.push({ n: o.n as number, text, ...(o.speech === true ? { speech: true } : {}), ...(o.writing === true ? { writing: true } : {}) });
  }
  return { kind: 'fact-check', sheet: r.sheet, lines };
}
