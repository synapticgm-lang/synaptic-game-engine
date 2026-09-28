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
      const use = String(rec.use ?? '').trim() as TokenUse;
      if (!tok || !id || !TOKEN_USES.has(use)) return null;
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

function findEnum(enumRefs: LedgerRef[], tok: string, id?: string): LedgerRef | undefined {
  const t = tok.replace(/^@/, '').toLowerCase();
  const byTok = enumRefs.find((r) => r.tok.toLowerCase() === t);
  if (byTok) return byTok;
  if (id) {
    const want = id.toLowerCase();
    return enumRefs.find((r) => r.id.toLowerCase() === want);
  }
  return undefined;
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
  for (const name of [...enumRefs.map((r) => r.display), ...knownNames]
    .filter((n) => !!n && /[A-Z]/.test(n))
    .sort((a, b) => b.length - a.length)) {
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

export function renderTokenBeat(beat: TokenBeat, enumRefs: LedgerRef[]): string {
  const byTok = new Map(enumRefs.map((r) => [r.tok.toLowerCase(), r.display]));
  for (const ref of beat.refs) {
    const row = findEnum(enumRefs, ref.tok, ref.id);
    if (row) byTok.set(ref.tok.replace(/^@/, '').toLowerCase(), row.display);
  }
  const sentences = beat.lines.map((line) => {
    let next = line.text;
    next = next.replace(TOK_RE, (_m, n: string) => byTok.get(`t${n}`) ?? '');
    next = next.replace(/@t(\d+)\b/g, (_m, n: string) => byTok.get(`t${n}`) ?? '');
    return tidy(next);
  }).filter((s) => s.length > 0);
  return tidy(sentences.join(' '));
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

export function acceptTokenOrLedgerStory(
  raw: string,
  state: GameState,
  packet?: CompletedEventPacket,
  opts?: { alreadyRepaired?: boolean; alt?: string }
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
    const beat = parseTokenBeat(cand);
    if (!beat) continue;
    if (isFullyClean(beat, enumRefs, known)) {
      const prose = renderTokenBeat(beat, enumRefs);
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
    if (clean.length >= 3 && fns.has('place') && fns.has('action')) {
      if (!bestPartial || clean.length > bestPartial.lines.length) {
        bestPartial = { lines: clean, beat: { ...beat, lines: clean } };
      }
    }
  }

  if (bestPartial) {
    const prose = renderTokenBeat(bestPartial.beat, enumRefs);
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
  const parsedAny = candidates.map(parseTokenBeat).find(Boolean);
  if (parsedAny && !opts?.alreadyRepaired) {
    const clean = keepCleanLines(parsedAny, enumRefs, known);
    const miss = missingFns(clean.length ? clean : parsedAny.lines);
    if (miss.includes('place') || miss.includes('action') || clean.length < 3) {
      needsRepair = { missingFns: miss.length ? miss : ['place', 'action'] };
    }
  }

  const freeform =
    candidates.find((c) => !parseTokenBeat(c) && !looksLikeTokenJson(c))
    ?? (looksLikeTokenJson(raw) ? '' : raw);
  const obeyed = acceptObeyedStoryBody(freeform, state, packet);
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
