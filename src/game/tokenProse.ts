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
import { splitProseSentences } from './proseSentences';
import { formatNpcMemoriesForPrompt, presentNpcRecords } from './npcRecords';
import { isNounAdjunctBefore } from './npcMemory';
import { weaponsNotInHand } from './infoSheet';
import { systemWindowFieldNames } from './litrpgSystemWindow';
import { writerFacts } from './systemHousing';
import { buildGroundTruthLedger } from './writerInfoLayer';

export type LineFn = 'place' | 'action' | 'speech' | 'react' | 'hook';

export interface TokenLine {
  fn: LineFn;
  text: string;
  speaker_tok?: string;
  /** Speech line read as speaker ref + spoken words: `text` is the words; code paints the tag and quote marks. */
  spoken?: boolean;
}

/** One accepted writer speech line: who said it (ledger ref) and the words, as code painted them. */
export interface SpokenLine {
  speakerId: string;
  speaker: string;
  words: string;
}

export interface TokenBeat {
  refs: TokenUseRef[];
  lines: TokenLine[];
}

export type TokenAcceptPath = 'json' | 'json-partial' | '13c' | 'last-resort';

const LINE_FNS = new Set<LineFn>(['place', 'action', 'speech', 'react', 'hook']);
/** A line whose plain (untokened) subject speaks: the PC, the one name the writer types without a token. */
const PC_SPEAKS = /^[A-Z][\w'’-]*\s+(?:spoke|said|asked|called|shouted|told|answered|replied|whispered|demanded)\b/;
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

/**
 * Fixed lexicon of job roles a ledger cast slot fills. Do not grow this list per incident.
 * An unnamed passer-by ("the stranger", "a figure") claims no slot and is not on it.
 */
const UNBOUND_ANIMATE =
  /\b(?:a|an|the)\s+(?:chanter|vendor|guard|merchant|priest|innkeep|handler|clerk|official|registrar|witness|archivist)\b/i;

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
      if (!tok) return null;
      const use = readTokenUse(String(rec.use ?? '')) ?? 'actor';
      if (id.includes('<')) continue;
      refs.push({ tok, id, use });
    }
    // A speech line with no speaker_tok belongs to the beat's one declared speaker; with none declared, to its one
    // actor or addressee, unless the line before has the PC (written plainly, never a token) speaking: those are
    // the PC's own words, which keep no speaker and fail the line.
    const speakers = refs.filter((r) => r.use === 'speaker');
    const others = refs.filter((r) => r.use !== 'speaker' && PERSON_USES.has(r.use));
    const soleSpeaker = speakers.length === 1 ? speakers[0]!.tok : '';
    const soleOther = !speakers.length && others.length === 1 ? others[0]!.tok : '';
    const lines: TokenLine[] = [];
    for (const row of parsed.lines) {
      if (!row || typeof row !== 'object') continue;
      const rec = row as { fn?: unknown; text?: unknown; speaker_tok?: unknown };
      const fn = String(rec.fn ?? '').trim() as LineFn;
      const text = String(rec.text ?? '').trim();
      // 28g/28h — skip echoed prompt placeholders (... @t1 ... or <placeholder>).
      if (!LINE_FNS.has(fn) || !text || /^(?:\.{2,}\s*)?@t\d+\s*(?:\.{2,}|\.)?$/.test(text) || /<[^<>]{2,40}>/.test(text)) continue;
      const typed = rec.speaker_tok != null ? String(rec.speaker_tok).replace(/^@/, '').trim() : '';
      const prev = lines[lines.length - 1];
      const pcSpoke = !!prev && prev.fn !== 'speech' && PC_SPEAKS.test(prev.text);
      const untagged = fn === 'speech' && !namesDeclaredPerson(text, refs);
      const speaker = typed || (untagged ? soleSpeaker || (pcSpoke ? '' : soleOther) : '');
      const line: TokenLine = speaker ? { fn, text, speaker_tok: speaker } : { fn, text };
      lines.push(fn === 'speech' ? readSpeechLine(line, refs) : line);
    }
    if (!lines.length) return null;
    return { refs, lines };
  } catch {
    return null;
  }
}

const OPEN_Q = `"\u201c`;
const CLOSE_Q = `"\u201d`;
const QUOTED_RE = new RegExp(`[${OPEN_Q}]([^${OPEN_Q}${CLOSE_Q}]+)[${CLOSE_Q}]`, 'g');

/**
 * A speech line is a speaker ref and the spoken words. The writer may send the words wrapped in quotes,
 * with escaped quotes, or with its own `@t2 said,` tag (even the whole line wrapped again): read that
 * shape into plain words + speaker_tok. Indirect speech with no quoted words and a token in it stays as written.
 */
function readSpeechLine(line: TokenLine, refs: TokenUseRef[]): TokenLine {
  let text = line.text.replace(/\\+(["'\u201c\u201d\u2018\u2019])/g, '$1').trim();
  const wrapped = text.match(new RegExp(`^[${OPEN_Q}]\\s*(@t\\d+\\b[\\s\\S]*[${CLOSE_Q}])\\s*[${CLOSE_Q}]$`));
  if (wrapped) text = wrapped[1]!.trim();
  const quoted = [...text.matchAll(QUOTED_RE)].map((m) => m[1]!.trim()).filter(Boolean);
  const outside = text.replace(QUOTED_RE, ' ');
  const tagTok = outside.match(/@(t\d+)\b/)?.[1];
  const speaker = line.speaker_tok || tagTok || '';
  // The speaker's own token heading capitalised words ("@t2 I require…", "@t2: Come here") is the tag, not indirect speech.
  const tagged = line.speaker_tok
    ? text.match(new RegExp(`^@${line.speaker_tok.replace(/^@/, '')}\\b\\s*(?:[:,\u2014\u2013-]\\s*|said\\s*,?\\s*)?(?=[A-Z])([\\s\\S]+)$`))
    : null;
  let words: string;
  if (quoted.length) {
    words = quoted.map((q, i) => (i < quoted.length - 1 ? q.replace(/,$/, '.') : q)).join(' ');
  } else if (tagged) {
    words = tagged[1]!;
  } else if (line.speaker_tok && !namesDeclaredPerson(text, refs)) {
    words = text.replace(new RegExp(`^[${OPEN_Q}]|[${CLOSE_Q}]$`, 'g'), '');
  } else {
    return { ...line, text };
  }
  if (!speaker) return { ...line, text };
  words = tidy(words).replace(/,$/, '');
  if (!/[.!?\u2026]$/.test(words)) words += '.';
  return { fn: 'speech', text: words, speaker_tok: speaker, spoken: true };
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
    const bare = word.replace(/[.,!?;:)"'\]\u201d\u2019]+$/, '');
    // The pronoun "I" ("What I want", "I'm") is grammar in any spoken line, never an invented name.
    const pronounI = /^I(?:['\u2019](?:m|ll|ve|d))?$/.test(bare);
    if (!sentenceStart && !opensQuote && !pronounI && /^[A-Z][A-Za-z''-]*$/.test(bare)) {
      return true;
    }
    sentenceStart = /[.!?]["')\]]*$/.test(part);
  }
  return false;
}

const NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const WORD_FOR_NUM = Object.fromEntries(Object.entries(NUM_WORDS).map(([w, n]) => [n, w])) as Record<number, string>;
const COUNT_START = `\\d+|${Object.keys(NUM_WORDS).filter((w) => w !== 'one').join('|')}`;
/** One whole number phrase ("twenty-five", "two hundred twenty-five"); "one" alone is not a count. */
const COUNT_RE = new RegExp(`\\b((?:${COUNT_START})(?:(?:-|\\s+)(?:one|${COUNT_START.replace('\\d+|', '')}|hundred|thousand))*)\\b`, 'gi');
/** A count of ways out is the PLACES exit count's to judge, and body parts / paces / "of them" are not world facts. */
const COUNT_NOT_A_FACT =
  /^\s+(?:\w+\s+){0,2}?(?:roads?|exits?|ways?|paths?|doors?|doorways?|lanes?|streets?|routes?|gates?|tracks?|trails?|passages?|stairs?)\b|^\s*(?:o'clock|times?|steps?|paces?|breaths?|heartbeats?|fingers?|hands|eyes|arms|feet)\b|^\s+of (?:them|us|you)\b/i;

function countValue(phrase: string): number {
  let total = 0;
  let cur = 0;
  for (const w of phrase.toLowerCase().split(/[-\s]+/)) {
    if (/^\d+$/.test(w)) cur += Number(w);
    else if (w === 'hundred') cur *= 100;
    else if (w === 'thousand') { total += cur * 1000; cur = 0; }
    else cur += NUM_WORDS[w] ?? 0;
  }
  return total + cur;
}

/**
 * Everything a count may come from this turn: the sheet, the info sheet, the engine result, the REF ENUM and
 * mention list, and the page so far. Lowercased.
 */
export function handedCountText(state: GameState, packet?: CompletedEventPacket): string {
  const page = (state.log ?? []).filter((e) => e.role === 'gm').map((e) => String(e.content ?? ''));
  const hasSheet = Array.isArray(state.inventory) && Array.isArray(state.character?.conditions);
  return [
    hasSheet ? buildGroundTruthLedger(state, { compact: true }) : '',
    packet?.infoSheet ?? '',
    packet?.engineResult ?? '',
    ...(packet?.ledgerChanges ?? []),
    ...(packet?.allowlist ?? []),
    ...refEnumOf(state, packet).map((r) => r.display),
    ...page,
  ].join('\n').toLowerCase();
}

/** A count in the line that no handed fact and no earlier page holds ("for six years", "fifteen more points"). */
export function lineHasUnhandedCount(text: string, handed: string): boolean {
  const src = (text ?? '').replace(new RegExp(TOK_RE.source, 'g'), ' ');
  for (const m of src.matchAll(COUNT_RE)) {
    const after = src.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 24);
    if (COUNT_NOT_A_FACT.test(after)) continue;
    const n = countValue(m[1]!);
    const word = WORD_FOR_NUM[n];
    const said = new RegExp(`\\b(?:${n}${word ? `|${word}` : ''})\\b`);
    if (!said.test(handed) && !handed.includes(m[1]!.toLowerCase())) return true;
  }
  return false;
}

export function lineHasUnboundAnimate(text: string): boolean {
  const s = text ?? '';
  for (const m of s.matchAll(new RegExp(UNBOUND_ANIMATE.source, 'gi'))) {
    // "the official stamp": the role word describes a thing; no person stands in the line.
    const rest = s.slice((m.index ?? 0) + m[0].length).match(/^ ([a-z]+)(?:\s+([A-Za-z'-]+))?/);
    if (rest && isNounAdjunctBefore(rest[1]!, rest[2])) continue;
    return true;
  }
  return false;
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

const PERSON_USES = new Set<TokenUse>(['speaker', 'actor', 'addressed']);

/** The line names a declared person by token: indirect speech ("@t2 told Jax…") carries its own speaker. */
function namesDeclaredPerson(text: string, refs: TokenUseRef[]): boolean {
  return toksInText(text).some((t) => refs.some((r) => r.tok === t && PERSON_USES.has(r.use)));
}

export function refEnumOf(state: GameState, packet?: CompletedEventPacket): LedgerRef[] {
  if (packet?.refEnum?.length) return packet.refEnum;
  const hallTalk = packet?.verb === 'spoke' || packet?.outcome === 'spoke';
  return compileRefEnum(state, [], { hallTalk });
}

function refSlug(s: string): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * A typed id agrees with a row when it is the row's id, its token, the id without its class prefix, the display
 * slug, or the row's own class column ("person" for a person row). A class prefix on the typed id is not part
 * of the name: "present:Nell Rudd" is the Nell Rudd row.
 */
function idAgreesWithRow(row: LedgerRef, id: string): boolean {
  const want = id.trim().replace(/^@/, '').toLowerCase();
  const rid = row.id.toLowerCase();
  const ridName = rid.slice(rid.indexOf(':') + 1);
  const slugs = [refSlug(want), refSlug(want.slice(want.indexOf(':') + 1))].filter(Boolean);
  return (
    want === rid ||
    want === row.tok.toLowerCase() ||
    want === row.klass ||
    want === ridName ||
    slugs.some((slug) => slug === refSlug(row.display) || slug === ridName)
  );
}

/**
 * s77 Root A — a declared ref binds by its REF ENUM token: `tok` is the enum row's own token and code
 * looks up the id. A typed id that names something else contradicts the tok, so the ref binds to nothing.
 * A typed id only binds on its own when the tok is not an enum token at all.
 */
function findEnum(enumRefs: LedgerRef[], tok: string, id?: string): LedgerRef | undefined {
  const byTokOf = (s: string) => {
    const t = s.replace(/^@/, '').toLowerCase();
    return enumRefs.find((r) => r.tok.toLowerCase() === t);
  };
  const byTok = byTokOf(tok);
  if (byTok) return !id?.trim() || idAgreesWithRow(byTok, id) ? byTok : undefined;
  if (id?.trim()) {
    const want = id.trim().toLowerCase();
    const byId = enumRefs.find((r) => r.id.toLowerCase() === want);
    if (byId) return byId;
    if (/^@?t\d+$/.test(want)) return byTokOf(want);
  }
  return undefined;
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
  const counts = handedCountText(state, packet);
  for (const line of beat.lines) {
    const v = classifyTokenLine(line, beat, enumRefs, handedProperNames(state, packet), counts);
    out.push(`${line.fn}:${v.ok ? 'ok' : v.reason ?? 'bad'}`);
  }
  return out;
}

export function classifyTokenLine(
  line: TokenLine,
  beat: TokenBeat,
  enumRefs: LedgerRef[],
  knownNames: string[] = [],
  /** Lowercased handed facts and page so far (`handedCountText`); a count none of them holds fails the line. */
  handedCounts?: string
): LineVerdict {
  if (line.fn === 'speech' && line.text.includes('\\')) return { ok: false, reason: 'speech-shape' };
  if (handedCounts != null && lineHasUnhandedCount(line.text, handedCounts)) return { ok: false, reason: 'count' };
  // Spoken words with no speaker would paint as narration.
  if (line.fn === 'speech' && !line.spoken && !namesDeclaredPerson(line.text, beat.refs)) {
    return { ok: false, reason: 'speech-no-speaker' };
  }
  // 28g — names the ledger already knows (REF ENUM, places, exits, the player) are not inventions.
  // A handed name typed with the other apostrophe ("Summons' Price" for "Summons’ Price") is the same name.
  const apos = (s: string) => s.replace(/[\u2018\u2019]/g, "'");
  let capText = apos(line.text);
  const whole = [...enumRefs.map((r) => r.display), ...knownNames].filter((n) => !!n && /[A-Z]/.test(n)).map(apos);
  // 29z3 — a short form of a held name ("the Scout" for Integration Scar Scout) is not an invention.
  // A possessive word of a held name stands bare too ("the Circle" for The Circle's Price).
  const parts = whole.flatMap((n) => {
    const words = n.split(/[\s—–-]+/).filter((w) => /^[A-Z][a-z'’]{3,}$/.test(w));
    if (!(words.length > 1 || n.split(/\s+/).length > 1)) return [];
    return words.flatMap((w) => {
      const bare = w.replace(/'s?$/, '');
      return bare !== w && bare.length >= 4 ? [w, bare] : [w];
    });
  });
  for (const name of [...new Set([...whole, ...parts])].sort((a, b) => b.length - a.length)) {
    capText = capText.split(name).join('·');
  }
  if (lineHasMidSentenceCapital(capText)) {
    return { ok: false, reason: 'capital' };
  }
  let animateText = line.text;
  for (const name of [...enumRefs.map((r) => r.display), ...knownNames].filter(Boolean).sort((a, b) => b.length - a.length)) {
    animateText = animateText.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '·');
  }
  if (lineHasUnboundAnimate(animateText)) {
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
    // "a @t11-old mace" pastes "crates" into a word; only a proper name may lead a hyphen word ("Lowmarket-bound").
    if (!/^[A-Z]/.test(row.display ?? '') && new RegExp(`@${tok.replace(/^@/, '')}-[a-z]`, 'i').test(line.text)) {
      return { ok: false, reason: 'glued-tok' };
    }
    // A named person takes no article; "the @t2 run of streets" uses the person as a place or thing.
    // The live foe's row is its kind ("the Grave-risen Carrion Crow Flock"), which does take one.
    if (
      row.klass === 'person' &&
      !row.id.startsWith('encounter:') &&
      /^[A-Z]/.test(row.display ?? '') &&
      new RegExp(`\\b(?:the|a|an)\\s+@${tok.replace(/^@/, '')}\\b`, 'i').test(line.text)
    ) {
      return { ok: false, reason: 'article-person' };
    }
  }
  // A speaker is a person or companion here. A named person here may open with their own name; a role or
  // catalog display ("a traveler", a foe's title) said as the line is an echo.
  if (line.spoken && line.speaker_tok) {
    const tok = line.speaker_tok.replace(/^@/, '').toLowerCase();
    const declared = beat.refs.find((r) => r.tok.replace(/^@/, '').toLowerCase() === tok);
    const row = declared ? findEnum(enumRefs, declared.tok, declared.id) : findEnum(enumRefs, tok);
    if (!row || (row.klass !== 'person' && row.klass !== 'companion')) return { ok: false, reason: 'speaker-class' };
    const bare = (s: string) => s.toLowerCase().replace(/^(?:the|a|an)\s+/, '').replace(/[^a-z0-9' -]+/g, '').trim();
    const first = splitProseSentences(line.text.replace(/@t(\d+)\b/gi, (_m, n: string) => findEnum(enumRefs, `t${n}`)?.display ?? ''))[0] ?? '';
    if (bare(first) && bare(first) === bare(row.display) && !row.id.startsWith('present:')) {
      return { ok: false, reason: 'speaker-echo' };
    }
  }
  return { ok: true };
}

export function bindCheckFails(beat: TokenBeat, enumRefs: LedgerRef[]): string[] {
  const notes: string[] = [];
  for (const ref of beat.refs) {
    const row = findEnum(enumRefs, ref.tok, ref.id);
    if (!row) {
      notes.push(`unknown:${ref.id || ref.tok}`);
      continue;
    }
    if (!tokenUseMatchesClass(ref.use, row.klass)) {
      notes.push(`use-class:${row.id}:${ref.use}`);
    }
  }
  return notes;
}

const DETERMINER_RE =
  /^(?:the|a|an|this|that|these|those|their|his|her|its|your|my|our|one|each|every|some|any|no)$/i;

const PREPOSITION_RE =
  /^(?:in|on|at|of|to|into|onto|from|with|without|by|for|over|under|through|across|past|toward|towards|behind|beside|near|against|around|between|along|inside|outside)$/i;

const isDeterminerWord = (w: string) => DETERMINER_RE.test(w.replace(/['’]s$/i, '')) || /['’]s$/i.test(w);

/**
 * True when the noun phrase before `offset` (same clause) has already begun. After a preposition
 * within three words, any word between it and the noun starts the phrase ("in the same worn @t3",
 * "in worn @t3"), so a determiner there would land mid-phrase. Otherwise a determiner within three words.
 */
function hasDeterminerBefore(text: string, offset: number): boolean {
  const before = text.slice(0, offset);
  const clause = before.split(/[.,;:!?—–()"“”]/).pop() ?? '';
  const near = clause.trim().split(/\s+/).filter(Boolean).slice(-3);
  const cut = near.map((w) => PREPOSITION_RE.test(w)).lastIndexOf(true);
  if (cut >= 0) return cut < near.length - 1;
  return near.some(isDeterminerWord);
}

/**
 * 29z3 — a thing painted with no determiner ("blue panel flickered", "They kept clothes bunched")
 * gets one: kit takes the PC's possessive, a prop or bare common-noun place takes "the".
 */
function paintDisplay(row: { display: string; klass?: string }, text: string, offset: number, possessive: string): string {
  const display = row.display;
  if (!display) return display;
  // "the Stair Descent inside @t1" with display "Cathedral Undercroft — Stair Descent": the room is already written.
  const [place, room] = display.split(/\s+[—–]\s+/);
  if (place && room) {
    const roomRe = new RegExp(`\\b${room.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (roomRe.test(text.slice(0, offset))) return place;
  }
  // "onto the @t2" with display "a ruined bathhouse": the writer's determiner already starts the phrase.
  if (ARTICLE_RE.test(display) && hasDeterminerBefore(text, offset)) return display.replace(ARTICLE_RE, '');
  const thing = row.klass === 'kit' || row.klass === 'carried' || row.klass === 'prop' || row.klass === 'window';
  if (!thing || /^[A-Z]/.test(display) || ARTICLE_RE.test(display) || /^(?:their|his|her|your|my|its)\s/i.test(display)) {
    return display;
  }
  if (hasDeterminerBefore(text, offset)) return display;
  return `${row.klass === 'kit' ? possessive : 'the'} ${display}`;
}

/** The PC possessive this beat already uses: "your" when the lines address the PC as you, else the PC pronoun. */
export function beatPcPossessive(lines: { text: string; spoken?: boolean }[], state?: GameState): string {
  const outsideQuotes = lines
    .filter((l) => !l.spoken)
    .map((l) => l.text.replace(/["“][^"”]*["”]/g, ' '))
    .join(' ');
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
    const said = line.spoken && line.speaker_tok ? `@${line.speaker_tok} said, "${line.text}"` : line.text;
    const once = dropTypedNameAfterToken(said, (tok) => byTok.get(tok)?.display);
    let next = once.replace(
      /(\b(?:the|a|an)\s+)?@t(\d+)\b(['’]s\b)?/gi,
      (_m, art: string | undefined, n: string, poss: string | undefined, offset: number, src: string) => {
        const row = byTok.get(`t${n}`);
        if (!row?.display) return art ?? '';
        painted.add(row.display);
        const paint = paintDisplay(row, src, offset + (art?.length ?? 0), possessive);
        // A display that brings its own determiner ("one frightened priest") takes no second article.
        const lead = art && isDeterminerWord(paint.split(/\s+/)[0] ?? '') ? '' : (art ?? '');
        // A plural common noun takes the bare apostrophe ("the smugglers' silence").
        const plural = /(?:^|\s)[a-z][a-z'-]*[^s']s$/.test(paint);
        return `${lead}${paint}${poss ? (plural ? poss[0] : poss) : ''}`;
      }
    );
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

/** A token paints once: the label the writer also typed right after the token ("@t5 Hobb Dunmore") is the same mention. */
export function dropTypedNameAfterToken(text: string, display: (tok: string) => string | undefined): string {
  let out = '';
  let at = 0;
  for (const m of (text ?? '').matchAll(/@t(\d+)\b/gi)) {
    const end = (m.index ?? 0) + m[0].length;
    if (end < at) continue;
    out += text.slice(at, end);
    at = end;
    const core = (display(`t${m[1]}`.toLowerCase()) ?? '').replace(ARTICLE_RE, '').trim();
    if (!core) continue;
    const echo = text.slice(end).match(new RegExp(`^\\s+(?:(?:the|a|an)\\s+)?${escRe(core)}(?![\\w'-])`, 'i'));
    if (echo) at = end + echo[0].length;
  }
  return out + text.slice(at);
}

/** Sentence starts, and the first spoken word after a said-tag's opening quote (`said, "the tabard…`). */
function capitalizeSentenceStarts(text: string): string {
  return text.replace(/(^|[.!?]["”’)]?\s+|[,:]\s+["“])([a-z])/g, (_m, lead: string, ch: string) => `${lead}${ch.toUpperCase()}`);
}

function isFullyClean(beat: TokenBeat, enumRefs: LedgerRef[], knownNames: string[] = [], handedCounts?: string): boolean {
  if (bindCheckFails(beat, enumRefs).length) return false;
  return beat.lines.every((line) => classifyTokenLine(line, beat, enumRefs, knownNames, handedCounts).ok);
}

/** Line-gate reasons about how a token was declared, not about what the line says. */
const BINDING_ONLY_REASONS = new Set(['unbound-tok', 'unknown-id', 'use-class']);

function keepCleanLines(beat: TokenBeat, enumRefs: LedgerRef[], knownNames: string[] = [], handedCounts?: string): TokenLine[] {
  return beat.lines.filter((line) => classifyTokenLine(line, beat, enumRefs, knownNames, handedCounts).ok);
}

/**
 * 28g — proper names the ledger already holds: places, their exits, the current location, the player, people here, what they carry,
 * and the field labels the System window prints for this housing.
 * A weapon still in the pack is not in hand, so the writer may not name it (same as the REF ENUM).
 */
export function knownProperNames(state: GameState): string[] {
  const unheld = new Set(weaponsNotInHand(state));
  const names = [
    state.currentLocation,
    state.character?.name,
    ...(state.places ?? []).flatMap((p) => [p.name, ...(p.exits ?? [])]),
    ...presentNpcRecords(state).flatMap((m) => [m.npcName, ...(m.aliases ?? [])]),
    ...(state.inventory ?? []).map((item) => item.name).filter((n) => !unheld.has(n)),
    ...systemWindowFieldNames(state),
  ];
  return [...new Set(names.filter((n): n is string => !!n && n.trim().length > 1).map((n) => n.trim()))];
}

/** Multi-word names in the People here notes the writer is handed ("Sells: Health Tonic; Iron Nail"). */
function peopleHereNoteNames(state: GameState): string[] {
  const people = presentNpcRecords(state);
  if (!people.length) return [];
  const notes = formatNpcMemoriesForPrompt(people, 4, state.character?.name);
  return notes.match(/\b[A-Z][a-z'’]+(?:[ -][A-Z][a-z'’]+)+\b/g) ?? [];
}

/**
 * Names the writer was handed this turn: the ledger's own names, the People here notes, the packet's
 * mention list and the writer's quest titles. A capital the packet gave the writer is not an invention.
 * A weapon not in hand stays out, however it is listed.
 */
export function handedProperNames(state: GameState, packet?: CompletedEventPacket): string[] {
  const unheld = new Set(weaponsNotInHand(state));
  const names = [
    ...knownProperNames(state),
    ...peopleHereNoteNames(state),
    ...(packet?.allowlist ?? []),
    ...writerFacts(state).quests.map((q) => q.name),
  ];
  return [...new Set(names.filter((n): n is string => !!n && n.trim().length > 1 && !unheld.has(n.trim())).map((n) => n.trim()))];
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
  const retype = (row: LedgerRef) => !opts?.thingsOnly || row.klass === 'place' || row.klass === 'prop' || row.klass === 'kit' || row.klass === 'carried' || row.klass === 'window';
  const refs: TokenUseRef[] = beat.refs.map((ref) => {
    const row = findEnum(enumRefs, ref.tok, ref.id);
    if (!row) return ref;
    const bound = { ...ref, id: row.id };
    return tokenUseMatchesClass(ref.use, row.klass) || !retype(row) ? bound : { ...bound, use: firstUse(row) };
  });
  const declared = new Set(refs.map((r) => r.tok.replace(/^@/, '').toLowerCase()));
  for (const line of beat.lines) {
    for (const tok of [...toksInText(line.text), ...(line.speaker_tok ? [line.speaker_tok] : [])]) {
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
    const display = (tok: string) =>
      displayByTok.get(tok) ?? (unbound.has(tok) ? undefined : findEnum(enumRefs, tok)?.display);
    const line = paintTokensOrDrop(text, display);
    if (line) texts.push(/[.!?]["')\]]*$/.test(line) ? line : `${line}.`);
  }
  return capitalizeSentenceStarts(tidy(texts.join(' ')));
}

/**
 * 29z8 — paint every @tN from `display`; a sentence holding a token nothing can paint is dropped whole,
 * so a beat never keeps a hole where a name was ("the kept its slow boots coming").
 */
export function paintTokensOrDrop(text: string, display: (tok: string) => string | undefined): string {
  const sentences = splitProseSentences(dropTypedNameAfterToken(text ?? '', display));
  const kept = sentences.filter((s) => [...s.matchAll(/@t(\d+)\b/gi)].every((t) => display(`t${t[1]}`.toLowerCase())));
  return tidy(kept.map((s) => s.replace(/@t(\d+)\b/gi, (_m, n: string) => display(`t${n}`.toLowerCase()) ?? '')).join(' '));
}

/** The accepted speech lines of a beat: the declared speaker's ledger row and the words, tokens painted. */
export function spokenLinesOf(beat: TokenBeat, enumRefs: LedgerRef[]): SpokenLine[] {
  const rowOf = (tok: string) => {
    const t = tok.replace(/^@/, '').toLowerCase();
    const ref = beat.refs.find((r) => r.tok.replace(/^@/, '').toLowerCase() === t);
    return ref ? findEnum(enumRefs, ref.tok, ref.id) : findEnum(enumRefs, t);
  };
  const out: SpokenLine[] = [];
  for (const line of beat.lines) {
    if (!line.spoken || !line.speaker_tok) continue;
    const row = rowOf(line.speaker_tok);
    if (!row?.display) continue;
    const words = tidy(line.text.replace(/@t(\d+)\b/gi, (_m, n: string) => rowOf(`t${n}`)?.display ?? ''));
    if (words) out.push({ speakerId: row.id, speaker: row.display, words });
  }
  return out;
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
  /** Token JSON paths only: the accepted speech lines (empty when nobody spoke). */
  speech?: SpokenLine[];
  needsRepair?: { missingFns: LineFn[] };
  usedLastResort: boolean;
} {
  const enumRefs = refEnumOf(state, packet);
  const known = handedProperNames(state, packet);
  const counts = handedCountText(state, packet);
  const candidates = [
    ...extractTokenCandidates(raw),
    ...(opts?.alt ? extractTokenCandidates(opts.alt) : []),
  ].filter((s, i, arr) => arr.findIndex((x) => x === s) === i);

  let bestPartial: { lines: TokenLine[]; beat: TokenBeat; full: TokenBeat } | null = null;

  for (const cand of candidates) {
    const parsed = parseTokenBeat(cand);
    if (!parsed) continue;
    const beat = normalizeBeatRefs(parsed, enumRefs, { thingsOnly: !opts?.lenient });
    if (isFullyClean(beat, enumRefs, known, counts)) {
      const prose = renderTokenBeat(beat, enumRefs, { possessive: beatPcPossessive(beat.lines, state) });
      if (prose && !isDroughtStubProse(prose) && !/@t\d+\b/.test(prose)) {
        return {
          prose,
          path: 'json',
          notes: ['token-json'],
          refs: beat.refs,
          speech: spokenLinesOf(beat, enumRefs),
          usedLastResort: false,
        };
      }
    }
    const clean = keepCleanLines(beat, enumRefs, known, counts);
    const fns = new Set(clean.map((l) => l.fn));
    const partialOk = opts?.lenient
      ? clean.length >= 1
      : clean.length >= 3 && fns.has('place') && fns.has('action');
    if (partialOk) {
      if (!bestPartial || clean.length > bestPartial.lines.length) {
        bestPartial = { lines: clean, beat: { ...beat, lines: clean }, full: beat };
      }
    }
  }

  if (bestPartial) {
    const prose = renderTokenBeat(bestPartial.beat, enumRefs, {
      possessive: beatPcPossessive(bestPartial.beat.lines, state),
    });
    // Lenient: a partial that kept only a line or two (e.g. just a place name) loses to the whole
    // reply read as prose, which the ledger-noun obey pass still polices. The reply parsed, so a line the
    // gate failed on what it says stays out and a speech line keeps its speaker; only a binding slip is read.
    if (opts?.lenient && prose && storySentences(prose) < 2) {
      const full = bestPartial.full;
      const readable = full.lines.filter((line) => {
        const v = classifyTokenLine(line, full, enumRefs, known, counts);
        return v.ok || BINDING_ONLY_REASONS.has(v.reason ?? '');
      });
      const wholeBody = renderTokenBeat({ ...full, lines: readable }, enumRefs, {
        possessive: beatPcPossessive(readable, state),
      });
      const whole = acceptObeyedStoryBody(wholeBody, state, packet);
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
        speech: spokenLinesOf(bestPartial.beat, enumRefs),
        usedLastResort: false,
      };
    }
  }

  // 27h — a repair request still returns engine fallback prose below, so raw JSON never reaches the player.
  let needsRepair: { missingFns: LineFn[] } | undefined;
  const parsedRaw = candidates.map(parseTokenBeat).find(Boolean);
  const parsedAny = parsedRaw ? normalizeBeatRefs(parsedRaw, enumRefs, { thingsOnly: !opts?.lenient }) : parsedRaw;
  if (parsedAny && !opts?.alreadyRepaired) {
    const clean = keepCleanLines(parsedAny, enumRefs, known, counts);
    const miss = missingFns(clean.length ? clean : parsedAny.lines);
    if (miss.includes('place') || miss.includes('action') || clean.length < 3) {
      needsRepair = { missingFns: miss.length ? miss : ['place', 'action'] };
    }
  }

  const freeform =
    candidates.find((c) => !parseTokenBeat(c) && !looksLikeTokenJson(c))
    ?? (looksLikeTokenJson(raw) ? (opts?.lenient ? salvageTokenJsonProse(raw, enumRefs) : '') : raw);
  // 29z8 — plain prose that still uses @tN tags: paint them from the REF ENUM, never leave a hole.
  const obeyed = acceptObeyedStoryBody(
    /@t\d+\b/i.test(freeform) ? paintTokensOrDrop(freeform, (tok) => findEnum(enumRefs, tok)?.display) : freeform,
    state,
    packet
  );
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
