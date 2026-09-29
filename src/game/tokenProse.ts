/**
 * Batch 14a — Token Prose.
 * Writer returns JSON { refs, lines }; code paints ledger display names.
 * Player never sees @t1. Unparseable JSON falls through to 13c (not a 2-line bank).
 * Classifier only — no Continuity-Warden LLM, no SNAPSHOT/CRAFT pile.
 */
import type { GameState } from './types';
import {
  compileRefEnum,
  formatRefEnumForWriter,
  isDroughtStubProse,
  lastResortStoryBody,
  tokenUseMatchesClass,
  type CompletedEventPacket,
  type LedgerRef,
  type TokenUse,
  type TokenUseRef,
} from './completedEventPacket';
import { acceptObeyedStoryBody } from './ledgerNounObey';
import { pcPov } from './narrativePov';

export type LineFn = 'place' | 'action' | 'speech' | 'react' | 'hook';

export interface TokenLine {
  fn: LineFn;
  text: string;
  speaker_tok?: string;
}

export interface TokenBeat {
  refs: TokenUseRef[];
  lines: TokenLine[];
}

export type TokenAcceptPath = 'json' | 'json-partial' | '13c' | 'last-resort';

const LINE_FNS = new Set<LineFn>(['place', 'action', 'speech', 'react', 'hook']);
const TOKEN_USES = new Set<TokenUse>([
  'speaker', 'actor', 'addressed', 'corpse', 'prop_used', 'worn', 'place',
]);

/** Writers shorten the enum ("prop", "location"); one unknown word must not throw away the whole beat. */
const TOKEN_USE_ALIAS: Record<string, TokenUse> = {
  prop: 'prop_used',
  item: 'prop_used',
  object: 'prop_used',
  thing: 'prop_used',
  kit: 'worn',
  gear: 'worn',
  equipped: 'worn',
  location: 'place',
  setting: 'place',
  person: 'actor',
  npc: 'actor',
  character: 'actor',
  subject: 'actor',
  target: 'addressed',
  listener: 'addressed',
  body: 'corpse',
};

function readTokenUse(raw: string): TokenUse | null {
  const u = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (TOKEN_USES.has(u as TokenUse)) return u as TokenUse;
  return TOKEN_USE_ALIAS[u] ?? null;
}

/** Fixed lexicon. Do not grow this list per incident. */
const UNBOUND_ANIMATE =
  /\b(?:a|an|the)\s+(?:chanter|vendor|guard|stranger|merchant|priest|innkeep|handler|clerk|official|registrar|witness|archivist)\b/i;

const TOK_RE = /@t(\d+)\b/g;

export const TOKEN_PROSE_JSON_SCHEMA = {
  name: 'token_prose',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      refs: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tok: { type: 'string' },
            id: { type: 'string' },
            use: {
              type: 'string',
              enum: ['speaker', 'actor', 'addressed', 'corpse', 'prop_used', 'worn', 'place'],
            },
          },
          required: ['tok', 'id', 'use'],
        },
      },
      lines: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fn: { type: 'string', enum: ['place', 'action', 'speech', 'react', 'hook'] },
            text: { type: 'string' },
            speaker_tok: { type: 'string' },
          },
          required: ['fn', 'text'],
        },
      },
    },
    required: ['refs', 'lines'],
  },
} as const;

function tidy(text: string): string {
  return (text ?? '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();
}

export function looksLikeTokenJson(raw: string): boolean {
  const t = (raw ?? '').trim();
  return t.startsWith('{') || /```json/i.test(t) || /"refs"\s*:/.test(t);
}

function extractJsonObject(raw: string): string | null {
  const t = (raw ?? '').trim();
  if (!t) return null;
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? t).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0) return null;
  const cut = end > start ? body.slice(start, end + 1) : '';
  if (cut) {
    try {
      JSON.parse(cut);
      return cut;
    } catch {
      /* 28g — the writer often drops the final bracket(s); close them below */
    }
  }
  const balanced = balanceJson(body.slice(start));
  try {
    JSON.parse(balanced);
    return balanced;
  } catch {
    return cut || null;
  }
}

/** 28g — close unclosed strings / arrays / objects at the end of a cut-off JSON reply. */
function balanceJson(s: string): string {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  let out = s.trimEnd();
  if (inStr) out += '"';
  out = out.replace(/,\s*$/, '');
  return out + stack.reverse().join('');
}

export function parseTokenBeat(raw: string): TokenBeat | null {
  const json = extractJsonObject(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as {
      candidates?: unknown;
      refs?: unknown;
      lines?: unknown;
    };
    if (Array.isArray(parsed.candidates)) return null;
    if (!Array.isArray(parsed.refs) || !Array.isArray(parsed.lines)) return null;
    const refs: TokenUseRef[] = [];
    for (const row of parsed.refs) {
      if (!row || typeof row !== 'object') continue;
      const rec = row as { tok?: unknown; id?: unknown; use?: unknown };
      const tok = String(rec.tok ?? '').replace(/^@/, '').trim();
      const id = String(rec.id ?? '').trim();
      if (!tok || !id) return null;
      const use = readTokenUse(String(rec.use ?? '')) ?? 'actor';
      if (id.includes('<')) continue;
      refs.push({ tok, id, use });
    }
    const lines: TokenLine[] = [];
    for (const row of parsed.lines) {
      if (!row || typeof row !== 'object') continue;
      const rec = row as { fn?: unknown; text?: unknown; speaker_tok?: unknown };
      const fn = String(rec.fn ?? '').trim() as LineFn;
      const text = String(rec.text ?? '').trim();
      // 28g/28h — skip echoed prompt placeholders (... @t1 ... or <placeholder>).
      if (!LINE_FNS.has(fn) || !text || /^(?:\.{2,}\s*)?@t\d+\s*(?:\.{2,}|\.)?$/.test(text) || /<[^<>]{2,40}>/.test(text)) continue;
      const speaker = rec.speaker_tok != null ? String(rec.speaker_tok).replace(/^@/, '').trim() : '';
      lines.push(speaker ? { fn, text, speaker_tok: speaker } : { fn, text });
    }
    if (!lines.length) return null;
    return { refs, lines };
  } catch {
    return null;
  }
}

export function extractTokenCandidates(raw: string): string[] {
  const json = extractJsonObject(raw);
  if (json) {
    try {
      const parsed = JSON.parse(json) as { candidates?: unknown };
      if (Array.isArray(parsed.candidates)) {
        return parsed.candidates.map((c) => String(c ?? '')).filter((s) => s.trim());
      }
    } catch {
      /* single object */
    }
  }
  return raw?.trim() ? [raw] : [];
}

export function lineHasMidSentenceCapital(text: string): boolean {
  const stripped = (text ?? '').replace(TOK_RE, '·');
  let sentenceStart = true;
  const parts = stripped.split(/(\s+)/);
  for (const part of parts) {
    if (/^\s+$/.test(part)) continue;
    const word = part.replace(/^["'`([{]+/, '');
    if (!word) continue;
    // 28g — a capital right after an opening quote starts spoken words, not an invented name.
    const opensQuote = /^["'`\u201c\u2018]/.test(part);
    if (!sentenceStart && !opensQuote && /^[A-Z][A-Za-z''-]*$/.test(word.replace(/[.,!?;:)"'\]]+$/, ''))) {
      return true;
    }
    sentenceStart = /[.!?]["')\]]*$/.test(part);
  }
  return false;
}

export function lineHasUnboundAnimate(text: string): boolean {
  return UNBOUND_ANIMATE.test(text ?? '');
}

function toksInText(text: string): string[] {
  const found: string[] = [];
  const re = new RegExp(TOK_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text ?? ''))) {
    found.push(`t${m[1]}`);
  }
  return found;
}

export function refEnumOf(state: GameState, packet?: CompletedEventPacket): LedgerRef[] {
  if (packet?.refEnum?.length) return packet.refEnum;
  const hallTalk = packet?.verb === 'spoke' || packet?.outcome === 'spoke';
  return compileRefEnum(state, [], { hallTalk });
}

/**
 * 29y — a declared ref binds by its id. The writer's own numbering can differ from the REF ENUM
 * ({"tok":"t3","id":"kit:shortsword"} while t3 is a person), so the tok only decides when no id is given
 * or the id is itself a token ("t6"). An id the ledger does not hold binds to nothing.
 */
function findEnum(enumRefs: LedgerRef[], tok: string, id?: string): LedgerRef | undefined {
  const byTokOf = (s: string) => {
    const t = s.replace(/^@/, '').toLowerCase();
    return enumRefs.find((r) => r.tok.toLowerCase() === t);
  };
  if (id?.trim()) {
    const want = id.trim().toLowerCase();
    const byId = enumRefs.find((r) => r.id.toLowerCase() === want);
    if (byId) return byId;
    if (/^@?t\d+$/.test(want)) return byTokOf(want);
    return undefined;
  }
  return byTokOf(tok);
}

/** Toks the reply declared with an id the ledger does not hold: their lines cannot be painted honestly. */
function unboundDeclaredToks(beat: TokenBeat, enumRefs: LedgerRef[]): Set<string> {
  const out = new Set<string>();
  for (const ref of beat.refs) {
    if (!findEnum(enumRefs, ref.tok, ref.id)) out.add(ref.tok.replace(/^@/, '').toLowerCase());
  }
  return out;
}

export type LineVerdict = { ok: boolean; reason?: string };

/** 28g — diagnostics only: why each writer JSON line was kept or dropped (run telemetry). */
export function tokenLineVerdicts(raw: string, state: GameState, packet?: CompletedEventPacket): string[] {
  const enumRefs = refEnumOf(state, packet);
  const beat = extractTokenCandidates(raw ?? '').map(parseTokenBeat).find((b): b is TokenBeat => !!b);
  if (!beat) return [looksLikeTokenJson(raw ?? '') ? 'json-unparsed' : 'not-json'];
  const out = bindCheckFails(beat, enumRefs).map((n) => `ref ${n}`);
  for (const line of beat.lines) {
    const v = classifyTokenLine(line, beat, enumRefs, knownProperNames(state));
    out.push(`${line.fn}:${v.ok ? 'ok' : v.reason ?? 'bad'}`);
  }
  return out;
}

export function classifyTokenLine(
  line: TokenLine,
  beat: TokenBeat,
  enumRefs: LedgerRef[],
  knownNames: string[] = []
): LineVerdict {
  // 28g — names the ledger already knows (REF ENUM, places, exits, the player) are not inventions.
  let capText = line.text;
  const whole = [...enumRefs.map((r) => r.display), ...knownNames].filter((n) => !!n && /[A-Z]/.test(n));
  // 29z3 — a short form of a held name ("the Scout" for Integration Scar Scout) is not an invention.
  const parts = whole.flatMap((n) => {
    const words = n.split(/[\s—–-]+/).filter((w) => /^[A-Z][a-z'’]{3,}$/.test(w));
    return words.length > 1 || n.split(/\s+/).length > 1 ? words : [];
  });
  for (const name of [...new Set([...whole, ...parts])].sort((a, b) => b.length - a.length)) {
    capText = capText.split(name).join('·');
  }
  if (lineHasMidSentenceCapital(capText)) {
    return { ok: false, reason: 'capital' };
  }
  if (lineHasUnboundAnimate(line.text)) {
    return { ok: false, reason: 'unbound-animate' };
  }
  const used = toksInText(line.text);
  if (line.speaker_tok) used.push(line.speaker_tok.replace(/^@/, ''));
  for (const tok of used) {
    const declared = beat.refs.find((r) => r.tok.replace(/^@/, '').toLowerCase() === tok.toLowerCase());
    if (!declared) return { ok: false, reason: 'unbound-tok' };
    const row = findEnum(enumRefs, declared.tok, declared.id);
    if (!row) return { ok: false, reason: 'unknown-id' };
    if (!tokenUseMatchesClass(declared.use, row.klass)) {
      return { ok: false, reason: 'use-class' };
    }
  }
  return { ok: true };
}

export function bindCheckFails(beat: TokenBeat, enumRefs: LedgerRef[]): string[] {
  const notes: string[] = [];
  for (const ref of beat.refs) {
    const row = findEnum(enumRefs, ref.tok, ref.id);
    if (!row) {
      notes.push(`unknown:${ref.id}`);
      continue;
    }
    if (ref.id && row.id.toLowerCase() !== ref.id.toLowerCase() && row.tok.toLowerCase() !== ref.tok.toLowerCase()) {
      notes.push(`mismatch:${ref.id}`);
    }
    if (!tokenUseMatchesClass(ref.use, row.klass)) {
      notes.push(`use-class:${ref.id}:${ref.use}`);
    }
  }
  return notes;
}

const DETERMINER_RE =
  /^(?:the|a|an|this|that|these|those|their|his|her|its|your|my|our|one|each|every|some|any|no)$/i;

/** True when one of the two words before `offset` (same clause) already determines the noun. */
function hasDeterminerBefore(text: string, offset: number): boolean {
  const before = text.slice(0, offset);
  const clause = before.split(/[.,;:!?—–()"“”]/).pop() ?? '';
  const words = clause.trim().split(/\s+/).filter(Boolean).slice(-2);
  return words.some((w) => DETERMINER_RE.test(w.replace(/['’]s$/i, '')) || /['’]s$/i.test(w));
}

/**
 * 29z3 — a thing painted with no determiner ("blue panel flickered", "They kept clothes bunched")
 * gets one: kit takes the PC's possessive, a prop or bare common-noun place takes "the".
 */
function paintDisplay(row: { display: string; klass?: string }, text: string, offset: number, possessive: string): string {
  const display = row.display;
  if (!display) return display;
  const thing = row.klass === 'kit' || row.klass === 'prop';
  if (!thing || /^[A-Z]/.test(display) || ARTICLE_RE.test(display) || /^(?:their|his|her|your|my|its)\s/i.test(display)) {
    return display;
  }
  if (hasDeterminerBefore(text, offset)) return display;
  return `${row.klass === 'kit' ? possessive : 'the'} ${display}`;
}

/** The PC possessive this beat already uses: "your" when the lines address the PC as you, else the PC pronoun. */
export function beatPcPossessive(lines: { text: string }[], state?: GameState): string {
  const outsideQuotes = lines.map((l) => l.text.replace(/["“][^"”]*["”]/g, ' ')).join(' ');
  if (/\byour?\b/i.test(outsideQuotes)) return 'your';
  return pcPov(state?.character).his;
}

export function renderTokenBeat(beat: TokenBeat, enumRefs: LedgerRef[], opts?: { possessive?: string }): string {
  const byTok = new Map(enumRefs.map((r) => [r.tok.toLowerCase(), r as { display: string; klass?: string }]));
  const unbound = unboundDeclaredToks(beat, enumRefs);
  for (const tok of unbound) byTok.delete(tok);
  for (const ref of beat.refs) {
    const row = findEnum(enumRefs, ref.tok, ref.id);
    if (row) byTok.set(ref.tok.replace(/^@/, '').toLowerCase(), row);
  }
  const possessive = opts?.possessive ?? beatPcPossessive(beat.lines);
  const painted = new Set<string>();
  const lines = beat.lines.filter((line) => {
    const used = toksInText(line.text).map((t) => t.toLowerCase());
    if (line.speaker_tok) used.push(line.speaker_tok.replace(/^@/, '').toLowerCase());
    return !used.some((t) => unbound.has(t) || !byTok.get(t)?.display);
  });
  const sentences = lines.map((line) => {
    let next = line.text.replace(/@t(\d+)\b/g, (_m, n: string, offset: number, src: string) => {
      const row = byTok.get(`t${n}`);
      if (!row?.display) return '';
      painted.add(row.display);
      return paintDisplay(row, src, offset, possessive);
    });
    for (const display of painted) next = collapseEchoedLabel(next, display);
    return capitalizeSentenceStarts(tidy(next));
  }).filter((s) => s.length > 0);
  return tidy(sentences.join(' '));
}

const ARTICLE_RE = /^(?:the|a|an)\s+/i;

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Writer typed the head of a ledger label and then the token ("The quarry circle outside @t1",
 * @t1 = "a quarry circle outside Valespire's east wall"): drop the typed echo before the painted label.
 */
export function collapseEchoedLabel(text: string, display: string): string {
  const core = display.replace(ARTICLE_RE, '').trim();
  const words = core.split(/\s+/);
  if (words.length < 3) return text;
  let next = text;
  for (let k = Math.min(words.length - 1, 6); k >= 2; k--) {
    const head = words.slice(0, k).join(' ');
    const echo = new RegExp(
      `\\b(?:(?:the|a|an)\\s+)?${escRe(head)}\\s+(?=(?:(?:the|a|an)\\s+)?${escRe(core)})`,
      'gi'
    );
    next = next.replace(echo, '');
  }
  return next;
}

function capitalizeSentenceStarts(text: string): string {
  return text.replace(/(^|[.!?]["”’)]?\s+)([a-z])/g, (_m, lead: string, ch: string) => `${lead}${ch.toUpperCase()}`);
}

function isFullyClean(beat: TokenBeat, enumRefs: LedgerRef[], knownNames: string[] = []): boolean {
  if (bindCheckFails(beat, enumRefs).length) return false;
  return beat.lines.every((line) => classifyTokenLine(line, beat, enumRefs, knownNames).ok);
}

function keepCleanLines(beat: TokenBeat, enumRefs: LedgerRef[], knownNames: string[] = []): TokenLine[] {
  return beat.lines.filter((line) => classifyTokenLine(line, beat, enumRefs, knownNames).ok);
}

/** 28g — proper names the ledger already holds: places, their exits, the current location, the player. */
export function knownProperNames(state: GameState): string[] {
  const names = [
    state.currentLocation,
    state.character?.name,
    ...(state.places ?? []).flatMap((p) => [p.name, ...(p.exits ?? [])]),
  ];
  return [...new Set(names.filter((n): n is string => !!n && n.trim().length > 1).map((n) => n.trim()))];
}

function missingFns(lines: TokenLine[]): LineFn[] {
  const have = new Set(lines.map((l) => l.fn));
  return (['place', 'action', 'speech', 'react', 'hook'] as LineFn[]).filter((fn) => !have.has(fn));
}

export function formatTokenRepairFacing(
  packet: CompletedEventPacket,
  missing: LineFn[]
): string {
  const need = missing.length ? missing.join(', ') : 'place, action';
  return [
    `TOKEN REPAIR: return JSON filling only these missing fn slots: ${need}.`,
    'Same shape: { refs, lines }. Do not invent ids.',
    formatRefEnumForWriter(packet.refEnum ?? []),
    '',
    `PLAYER: ${packet.playerAction || '(opening)'}`,
  ].join('\n');
}

/**
 * 28l — code fixes what code knows: a declared ref whose `use` does not fit its ledger class takes the
 * first use that does, and an @tN written in a line but not declared binds to that REF ENUM row.
 */
export function normalizeBeatRefs(
  beat: TokenBeat,
  enumRefs: LedgerRef[],
  opts?: { thingsOnly?: boolean }
): TokenBeat {
  const firstUse = (row: LedgerRef): TokenUse =>
    [...TOKEN_USES].find((u) => tokenUseMatchesClass(u, row.klass)) ?? 'actor';
  // 29z3 — a place or thing declared with the wrong use is a label slip; a person used as a thing stays a bind fail.
  const retype = (row: LedgerRef) => !opts?.thingsOnly || row.klass === 'place' || row.klass === 'prop' || row.klass === 'kit';
  const refs: TokenUseRef[] = beat.refs.map((ref) => {
    const row = findEnum(enumRefs, ref.tok, ref.id);
    if (!row) return ref;
    return tokenUseMatchesClass(ref.use, row.klass) || !retype(row) ? ref : { ...ref, use: firstUse(row) };
  });
  const declared = new Set(refs.map((r) => r.tok.replace(/^@/, '').toLowerCase()));
  for (const line of beat.lines) {
    for (const tok of toksInText(line.text)) {
      if (declared.has(tok.toLowerCase())) continue;
      const row = findEnum(enumRefs, tok);
      if (!row || !retype(row)) continue;
      refs.push({ tok, id: row.id, use: firstUse(row) });
      declared.add(tok.toLowerCase());
    }
  }
  return { ...beat, refs };
}

/**
 * 28l — tolerant read of a token reply the JSON parser cannot use (broken, cut off, or wrong shape):
 * every `"text"` value becomes a sentence, tokens painted from the reply's own refs or the REF ENUM.
 */
export function salvageTokenJsonProse(raw: string, enumRefs: LedgerRef[]): string {
  const src = raw ?? '';
  const displayByTok = new Map<string, string>();
  const unbound = new Set<string>();
  for (const m of src.matchAll(/"tok"\s*:\s*"@?(t\d+)"[^{}]*?"id"\s*:\s*"([^"]+)"/g)) {
    const row = findEnum(enumRefs, m[1], m[2]);
    if (row) displayByTok.set(m[1].toLowerCase(), row.display);
    else unbound.add(m[1].toLowerCase());
  }
  const texts: string[] = [];
  for (const m of src.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/g)) {
    let text = m[1];
    try {
      text = JSON.parse(`"${text}"`) as string;
    } catch {
      text = text.replace(/\\"/g, '"').replace(/\\n/g, ' ');
    }
    if (/^(?:\.{2,}\s*)?@t\d+\s*(?:\.{2,}|\.)?$/.test(text.trim()) || /<[^<>]{2,40}>/.test(text)) continue;
    if ([...text.matchAll(/@t(\d+)\b/gi)].some((t) => unbound.has(`t${t[1]}`) && !displayByTok.has(`t${t[1]}`))) continue;
    const painted = text.replace(/@t(\d+)\b/gi, (_m, n: string) =>
      displayByTok.get(`t${n}`) ?? findEnum(enumRefs, `t${n}`)?.display ?? '');
    const line = tidy(painted);
    if (line) texts.push(/[.!?]["')\]]*$/.test(line) ? line : `${line}.`);
  }
  return tidy(texts.join(' '));
}

function storySentences(prose: string): number {
  return (prose.match(/[^.!?]+[.!?]+["')\]]*/g) ?? []).filter((s) => s.trim().split(/\s+/).length >= 3).length;
}

export function acceptTokenOrLedgerStory(
  raw: string,
  state: GameState,
  packet?: CompletedEventPacket,
  opts?: {
    alreadyRepaired?: boolean;
    alt?: string;
    /** 28l — fix ref uses in code and keep any clean lines (thinness is judged by the caller). */
    lenient?: boolean;
    /** 28l — return empty prose instead of the ledger stitch / last-resort body. */
    noLedgerFallback?: boolean;
  }
): {
  prose: string;
  path: TokenAcceptPath;
  notes: string[];
  refs?: TokenUseRef[];
  needsRepair?: { missingFns: LineFn[] };
  usedLastResort: boolean;
} {
  const enumRefs = refEnumOf(state, packet);
  const known = knownProperNames(state);
  const candidates = [
    ...extractTokenCandidates(raw),
    ...(opts?.alt ? extractTokenCandidates(opts.alt) : []),
  ].filter((s, i, arr) => arr.findIndex((x) => x === s) === i);

  let bestPartial: { lines: TokenLine[]; beat: TokenBeat } | null = null;

  for (const cand of candidates) {
    const parsed = parseTokenBeat(cand);
    if (!parsed) continue;
    const beat = normalizeBeatRefs(parsed, enumRefs, { thingsOnly: !opts?.lenient });
    if (isFullyClean(beat, enumRefs, known)) {
      const prose = renderTokenBeat(beat, enumRefs, { possessive: beatPcPossessive(beat.lines, state) });
      if (prose && !isDroughtStubProse(prose) && !/@t\d+\b/.test(prose)) {
        return {
          prose,
          path: 'json',
          notes: ['token-json'],
          refs: beat.refs,
          usedLastResort: false,
        };
      }
    }
    const clean = keepCleanLines(beat, enumRefs, known);
    const fns = new Set(clean.map((l) => l.fn));
    const partialOk = opts?.lenient
      ? clean.length >= 1
      : clean.length >= 3 && fns.has('place') && fns.has('action');
    if (partialOk) {
      if (!bestPartial || clean.length > bestPartial.lines.length) {
        bestPartial = { lines: clean, beat: { ...beat, lines: clean } };
      }
    }
  }

  if (bestPartial) {
    const prose = renderTokenBeat(bestPartial.beat, enumRefs, {
      possessive: beatPcPossessive(bestPartial.beat.lines, state),
    });
    // Lenient: a partial that kept only a line or two (e.g. just a place name) loses to the whole
    // reply read as prose, which the ledger-noun obey pass still polices.
    if (opts?.lenient && prose && storySentences(prose) < 2) {
      const whole = acceptObeyedStoryBody(salvageTokenJsonProse(raw, enumRefs), state, packet);
      if (!whole.usedLastResort && whole.prose && !isDroughtStubProse(whole.prose)
        && storySentences(whole.prose) > storySentences(prose)) {
        return { prose: whole.prose, path: '13c', notes: [...whole.notes, 'token-salvage'], usedLastResort: false };
      }
    }
    if (prose && !isDroughtStubProse(prose) && !/@t\d+\b/.test(prose)) {
      return {
        prose,
        path: 'json-partial',
        notes: ['token-partial'],
        refs: bestPartial.beat.refs,
        usedLastResort: false,
      };
    }
  }

  // 27h — a repair request still returns engine fallback prose below, so raw JSON never reaches the player.
  let needsRepair: { missingFns: LineFn[] } | undefined;
  const parsedRaw = candidates.map(parseTokenBeat).find(Boolean);
  const parsedAny = parsedRaw ? normalizeBeatRefs(parsedRaw, enumRefs, { thingsOnly: !opts?.lenient }) : parsedRaw;
  if (parsedAny && !opts?.alreadyRepaired) {
    const clean = keepCleanLines(parsedAny, enumRefs, known);
    const miss = missingFns(clean.length ? clean : parsedAny.lines);
    if (miss.includes('place') || miss.includes('action') || clean.length < 3) {
      needsRepair = { missingFns: miss.length ? miss : ['place', 'action'] };
    }
  }

  const freeform =
    candidates.find((c) => !parseTokenBeat(c) && !looksLikeTokenJson(c))
    ?? (looksLikeTokenJson(raw) ? (opts?.lenient ? salvageTokenJsonProse(raw, enumRefs) : '') : raw);
  const obeyed = acceptObeyedStoryBody(freeform, state, packet);
  if (opts?.noLedgerFallback && (obeyed.usedLastResort || !obeyed.prose || isDroughtStubProse(obeyed.prose))) {
    return { prose: '', path: 'last-resort', notes: ['no-usable-prose'], usedLastResort: false };
  }
  if (obeyed.prose && !isDroughtStubProse(obeyed.prose)) {
    return {
      prose: obeyed.prose,
      path: obeyed.usedLastResort ? 'last-resort' : '13c',
      notes: [...obeyed.notes, '13c-fallback'],
      usedLastResort: obeyed.usedLastResort,
      ...(needsRepair ? { needsRepair } : {}),
    };
  }
  const resort = lastResortStoryBody(state, packet);
  return {
    prose: resort.prose,
    path: 'last-resort',
    notes: ['last-resort'],
    usedLastResort: true,
    ...(needsRepair ? { needsRepair } : {}),
  };
}
