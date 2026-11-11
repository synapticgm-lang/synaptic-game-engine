/**
 * Slim opening-page-1 notes for the writer packet and system prompt.
 * Imports types only so the edge graph stays capped (no hook decks).
 */
import type { GameState } from './types.ts';
import { isCampaignHubToken } from './outdoorHubs.ts';

export const STORYTELLER_RETRY_MESSAGE = "The storyteller didn't answer — Try again";
export const STORYTELLER_RETRY_CHIP = 'Try again';

export function openingChoiceCountOf(engineMode: GameState['engineMode'] | undefined): number {
  return engineMode === 'dnd' ? 3 : 4;
}

export function openingChoiceCount(state: GameState): number {
  return openingChoiceCountOf(state.engineMode);
}

/** Short private rail + locked names. Safe to embed in the system prompt. */
export function formatOpeningPage1Rail(state: GameState): string {
  const est = state.openingEstablishment;
  if (!est || est.sceneWritten) return '';
  const inst = est.instance;
  if (!inst) return '';
  const n = openingChoiceCount(state);
  const people = inst.alone
    ? 'ALONE: do not invent a welcoming committee.'
    : `LOCKED PEOPLE (use these names): ${inst.cast.map((c) => `${c.name} — ${c.role}`).join('; ') || 'none'}`;
  const retiredNames = distinctiveRetiredNames(inst.retiredNames);
  const retired = retiredNames.length ? `Do not use retired catalog names: ${retiredNames.slice(0, 24).join(', ')}.` : '';
  const offer = inst.offerSummary ? `THE OFFER must be unmistakable in the prose: ${inst.offerSummary}` : '';
  const optionHint = inst.offerChips.length
    ? `options: exactly ${n} distinct concrete action labels that follow from the prose. Name the actual offer where there is one. Prefer when they still follow: ${inst.offerChips.map((c) => c.label).join('; ')}.`
    : `options: exactly ${n} distinct concrete action labels that follow from the prose.`;
  const near = inst.nearbyLandmark
    ? `The scene may sit near ${inst.nearbyLandmark}, which is still on the map (for example "on the road toward ${inst.nearbyLandmark}"). The opening takes place at ${inst.placeName}, not at a retired catalog place.`
    : '';
  return [
    '【 OPENING PAGE 1 】',
    'Return a JSON object with keys prose, options, and journalTitle. No markdown fences.',
    'prose: the first page the player will read. Novel-quality, concrete, present, no director notes, no menu language, no numbered choice list.',
    optionHint,
    'If an option uses a gendered pronoun (he/she), it must match how the prose refers to that same person. Otherwise phrase the option without a pronoun.',
    'journalTitle: a short title, at most 8 whole words, naming a person, place, or goal from the scene.',
    `LOCKED PLACE: ${inst.placeName} (${inst.placeKind}) — use this name.`,
    near,
    people,
    inst.factionName ? `LOCKED FACTION: ${inst.factionName}${inst.factionKind ? ` (${inst.factionKind})` : ''}` : '',
    inst.situation ? `SITUATION (private): ${inst.situation}` : '',
    inst.pressing ? `PRESSURE (private): ${inst.pressing}` : '',
    inst.how ? `HOW YOU ARRIVED (private): ${inst.how}` : '',
    offer,
    retired,
    'Name the locked place and every locked person who is here. No "someone here", "a figure", or unnamed stand-ins when a locked name exists.',
    'Follow the Gamebook / GM writing style already in this system prompt.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Full player-input packet for the opening GM call (client builds this). */
export function formatOpeningWriterNotes(state: GameState, retryErrors?: string[]): string {
  const rail = formatOpeningPage1Rail(state);
  const inst = state.openingEstablishment?.instance;
  const extra = inst
    ? [
        inst.whoYouAre ? `WHO YOU ARE (private): ${inst.whoYouAre}` : '',
        inst.offerChips.length
          ? `Concrete offer chips (use these labels when they still follow from your prose):\n${inst.offerChips.map((c, i) => `  ${i + 1}. ${c.label} — ${c.note}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  const retry = retryErrors?.length
    ? `Your last draft failed these checks: ${retryErrors.join('; ')}. Rewrite the opening. Use the locked names exactly. Make the offer unmistakable. Name concrete people and the place.`
    : '';
  return [rail, extra, retry].filter(Boolean).join('\n\n');
}

/** Single words that are not distinctive proper names even when Title-Cased. */
export const COMMON_OPENING_LEXEMES = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'as',
  'you', 'your', 'yours', 'yourself', 'they', 'them', 'their', 'theirs', 'this', 'that', 'these',
  'those', 'who', 'what', 'why', 'how', 'when', 'where', 'both', 'each', 'every', 'some', 'any',
  'all', 'none', 'here', 'there', 'already', 'just', 'still',
  'walk', 'stay', 'take', 'hear', 'keep', 'look', 'wait', 'ask', 'stand', 'sit', 'lie', 'give',
  'sign', 'refuse', 'accept', 'speak', 'say', 'come', 'go', 'run', 'hold', 'carry', 'offer',
  'enter', 'leave', 'follow', 'turn', 'open', 'close', 'step', 'move', 'share', 'raise', 'draw',
  'put', 'hang', 'wake', 'arrive', 'return', 'call', 'tell', 'make', 'bring', 'find', 'see',
  'start', 'stop', 'begin', 'end', 'choose', 'decide', 'try', 'help', 'guard', 'watch', 'rest',
  'sleep', 'eat', 'drink', 'trade', 'buy', 'sell', 'hide', 'search', 'study',
  'salt', 'glass', 'earth', 'heat', 'light', 'water', 'scarf', 'bread', 'blanket', 'kit',
  'work', 'job', 'hunt', 'brand', 'iron', 'pact', 'oath', 'circle', 'panel', 'system',
  'wind', 'dust', 'ash', 'fire', 'stone', 'wood', 'gold', 'coin', 'blade', 'hand', 'pack',
  'gear', 'cloak', 'coat', 'food', 'waterskin', 'people', 'person', 'figure', 'someone',
  'anyone', 'everyone', 'nobody', 'nothing', 'something',
  'trail', 'road', 'camp', 'war', 'inn', 'ford', 'gate', 'keep', 'hall', 'ward', 'harbor',
  'harbour', 'waystation', 'station', 'wake', 'market', 'square', 'hollow', 'lane', 'court',
  'quay', 'mill', 'well', 'bridge', 'pass', 'crossing',
]);

const GENERIC_PLACE_BITS = new Set([
  'trail', 'road', 'camp', 'war', 'inn', 'ford', 'gate', 'keep', 'hall', 'ward', 'circle', 'court',
  'harbor', 'harbour', 'waystation', 'station', 'wake', 'market', 'square', 'hollow', 'lane',
  'quay', 'mill', 'well', 'bridge', 'pass', 'crossing', 'place',
]);

/** Honorifics are not distinctive retired stems — "his brother" must not fail a "Brother Oren" ban. */
const HONORIFIC_BITS = new Set([
  'brother', 'sister', 'father', 'mother', 'sir', 'lady', 'lord', 'captain', 'sergeant',
  'high', 'chanter', 'priest', 'priestess', 'tracker', 'scout', 'novice', 'elder',
  'master', 'mistress', 'doctor', 'dame', 'warden', 'keeper', 'ranger', 'hunter',
]);

export function isCommonOpeningLexeme(word: string): boolean {
  const k = (word ?? '').trim().toLowerCase();
  return !k || COMMON_OPENING_LEXEMES.has(k) || GENERIC_PLACE_BITS.has(k);
}

/**
 * Retired names as whole names. Never a single common English word (cinder, first, talk).
 * Honorific-stripped full names are included (Brother Oren → Oren).
 * A long coined stem of a multi-word place (Cinderwake from Cinderwake Trail) may be included.
 */
export function distinctiveRetiredNames(retiredNames: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (n: string) => {
    const k = n.trim();
    if (!k) return;
    if (k.split(/\s+/).length === 1 && (isCommonOpeningLexeme(k) || GENERIC_PLACE_BITS.has(k.toLowerCase()) || HONORIFIC_BITS.has(k.toLowerCase()))) {
      return;
    }
    const key = k.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(k);
  };
  for (const r of retiredNames ?? []) {
    const t = r.trim();
    if (!t) continue;
    push(t);
    const bare = t.replace(/^(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Sergeant|High Chanter|Priest|Priestess|Tracker|Scout|Novice|Elder|Master|Mistress|Doctor|Dame|Warden|Keeper)\s+/i, '').trim();
    if (bare && bare.toLowerCase() !== t.toLowerCase()) push(bare);
    const parts = bare.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]!;
      if (
        first.length >= 8
        && !isCommonOpeningLexeme(first)
        && !GENERIC_PLACE_BITS.has(first.toLowerCase())
        && !HONORIFIC_BITS.has(first.toLowerCase())
      ) {
        push(first);
      }
    }
  }
  return out;
}

export function retiredNameNeedles(retired: string): string[] {
  return distinctiveRetiredNames([retired]);
}

export function isRetiredCatalogToken(token: string, retiredNames: string[] | undefined): boolean {
  if (!retiredNames?.length) return false;
  const t = (token ?? '').replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!t) return false;
  if (isCommonOpeningLexeme(t)) {
    return retiredNames.some((r) => r.toLowerCase() === t.toLowerCase() && !isCommonOpeningLexeme(r));
  }
  const lower = t.toLowerCase();
  for (const needle of distinctiveRetiredNames(retiredNames)) {
    const n = needle.toLowerCase();
    if (lower === n) return true;
    if (n.split(/\s+/).length >= 2 && (lower.includes(n) || n.includes(lower))) return true;
    const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(t)) return true;
  }
  return false;
}

export function filterRetiredFromAllowlist(names: string[], retiredNames: string[] | undefined): string[] {
  if (!retiredNames?.length) return names;
  return names.filter((n) => !isRetiredCatalogToken(n, retiredNames));
}

/** Short later-turn ban so retired catalog names cannot re-enter the system prompt after page 1. */
export function formatLaterTurnNameRail(state: GameState): string {
  const est = state.openingEstablishment;
  if (!est?.instance || !est.sceneWritten) return '';
  if (state.engineMode === 'pyoa') return '';
  const inst = est.instance;
  const locked = [
    inst.placeName,
    inst.settlementName,
    inst.factionName,
    ...(inst.cast ?? []).map((c) => c.name),
  ].filter(Boolean) as string[];
  const retired = distinctiveRetiredNames(inst.retiredNames)
    .filter((n) => !isCampaignHubToken(n, state.campaignBibleId))
    .slice(0, 20);
  if (!locked.length && !retired.length) return '';
  return [
    '【 LOCKED NAMES 】',
    locked.length ? `Keep using these locked names: ${locked.join(', ')}.` : '',
    retired.length ? `Do not use retired catalog names: ${retired.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** True while a non-PYOA New Game is waiting for its live opening page. */
export function isUnwrittenLiveOpening(state: {
  engineMode?: GameState['engineMode'] | string;
  openingEstablishment?: { instance?: unknown; sceneWritten?: boolean } | null;
}): boolean {
  return (
    state.engineMode !== 'pyoa'
    && !!state.openingEstablishment?.instance
    && !state.openingEstablishment.sceneWritten
  );
}

/** Strict OpenRouter json_schema for the opening call (prose + options + journal title). */
export const OPENING_PAGE_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    prose: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } },
    journalTitle: { type: 'string' },
  },
  required: ['prose', 'options', 'journalTitle'],
};

export interface OpeningStructuredOutput {
  prose: string;
  options: string[];
  journalTitle: string;
}

/**
 * ASCII or typographic quotes that may wrap a JSON key or string value.
 * Typographic dialogue quotes in prose are only relevant when they wrap these keys.
 */
const JSON_STRING_QUOTE = '["\'\u201C\u201D\u00AB\u00BB\u201E\u201F]';
const JSON_VALUE_START = '["\'\u201C\u201D\u00AB\u00BB\u201E\u201F[{]';
const OPENING_STRUCTURED_KEYS = 'prose|options|journalTitle';

/** Key + colon + a JSON value start (quote, `[`, or `{`). A bare-word value does not match. */
export function openingStructuredKeyValueRe(): RegExp {
  return new RegExp(
    `${JSON_STRING_QUOTE}\\s*(?:${OPENING_STRUCTURED_KEYS})\\s*${JSON_STRING_QUOTE}\\s*:\\s*${JSON_VALUE_START}`,
    'i'
  );
}

/**
 * True when a raw writer reply contains a structured opening key with a JSON value start,
 * anywhere in the text (after fences are stripped). Does not guess from the first character.
 * A bare-word value such as `"options": walk or stay` does not count.
 * Only for the raw response, once, at parse time — never a substitute for the commit-time leak gate.
 */
export function looksLikeOpeningStructuredText(raw: string): boolean {
  const t = stripFencesAndPreamble(raw ?? '');
  if (!t) return false;
  return openingStructuredKeyValueRe().test(t);
}

/**
 * Strip BOM and markdown fences. Do not slice from the first `{` — leading story prose
 * before a trailing JSON block must stay available for cut-and-keep recovery, and a
 * missing opening brace must not hide an unwrapped `"prose":` dump.
 */
export function stripFencesAndPreamble(raw: string): string {
  let text = (raw ?? '').replace(/^\uFEFF/, '').trim();
  if (!text) return '';
  if (/^```/.test(text)) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```(?:\s*)$/i, '').trim();
  } else if (text.includes('```')) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) text = fenced[1].trim();
  }
  return text;
}

function normalizeSmartQuotes(text: string): string {
  return (text ?? '')
    .replace(/[\u201C\u201D\u00AB\u00BB\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'");
}

function stripTrailingCommas(text: string): string {
  return (text ?? '').replace(/,(\s*[}\]])/g, '$1');
}

function closeUnbalancedBraces(slice: string): string {
  const opens = (slice.match(/{/g) ?? []).length;
  const closes = (slice.match(/}/g) ?? []).length;
  if (opens > closes) return slice + '}'.repeat(opens - closes);
  return slice;
}

function jsonObjectSlice(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  const end = text.lastIndexOf('}');
  if (end > start) return text.slice(start, end + 1);
  return closeUnbalancedBraces(text.slice(start));
}

function tryParseJsonObject(slice: string): Record<string, unknown> | null {
  const variants = [
    slice,
    stripTrailingCommas(slice),
    normalizeSmartQuotes(slice),
    stripTrailingCommas(normalizeSmartQuotes(slice)),
    closeUnbalancedBraces(stripTrailingCommas(normalizeSmartQuotes(slice))),
  ];
  const seen = new Set<string>();
  for (const v of variants) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    try {
      const obj = JSON.parse(v) as unknown;
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Record<string, unknown>;
    } catch {
      /* try the next repair */
    }
  }
  return null;
}

/** Turn JSON string escapes into real characters once (for almost-JSON field extraction). */
export function unescapeExtractedString(raw: string): string {
  const t = (raw ?? '').trim();
  if (!t) return '';
  try {
    return String(JSON.parse(`"${t}"`));
  } catch {
    return t.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
  }
}

/** Pull a JSON string field out of almost-JSON, even when parse still fails. */
export function extractOpeningJsonStringField(raw: string, key: string): string | undefined {
  const text = normalizeSmartQuotes(stripFencesAndPreamble(raw));
  if (!text) return undefined;
  const keys = key === 'prose' ? ['prose', 'text'] : key === 'journalTitle' ? ['journalTitle', 'title'] : [key];
  for (const k of keys) {
    const re = new RegExp(`["']${k}["']\\s*:\\s*["']`, 'i');
    const m = re.exec(text);
    if (!m) continue;
    const quote = text[m.index + m[0].length - 1] ?? '"';
    let i = m.index + m[0].length;
    let out = '';
    while (i < text.length) {
      const ch = text[i]!;
      if (ch === '\\' && i + 1 < text.length) {
        out += ch + text[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) break;
      out += ch;
      i += 1;
    }
    const value = unescapeExtractedString(out).replace(/\s+/g, ' ').trim();
    if (value) return value;
  }
  return undefined;
}

function extractOpeningJsonStringArray(raw: string, key: string): string[] {
  const text = normalizeSmartQuotes(stripFencesAndPreamble(raw));
  const re = new RegExp(`["']${key}["']\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
  const m = re.exec(text);
  if (!m?.[1]) return [];
  const body = m[1];
  const out: string[] = [];
  const item = /["']([^"']*)["']/g;
  let hit: RegExpExecArray | null;
  while ((hit = item.exec(body))) {
    const v = (hit[1] ?? '').replace(/\s+/g, ' ').trim();
    if (v) out.push(v);
  }
  return out;
}

function fieldsFromObject(obj: Record<string, unknown>): OpeningStructuredOutput | null {
  const prose = String(obj.prose ?? obj.text ?? '').replace(/\s+/g, ' ').trim();
  if (!prose) return null;
  const options = Array.isArray(obj.options)
    ? obj.options.map((s) => String(s ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    : [];
  const journalTitle = String(obj.journalTitle ?? obj.title ?? '').replace(/\s+/g, ' ').trim();
  return { prose, options, journalTitle };
}

function isStructuredRemainder(rest: string): boolean {
  const t = (rest ?? '').trim();
  if (!t || !openingStructuredKeyValueRe().test(t)) return false;
  if (t.startsWith('{') || t.startsWith('[') || /^["'\u201C\u201D]/.test(t)) {
    if (t.startsWith('{')) {
      const slice = jsonObjectSlice(t);
      if (slice && tryParseJsonObject(slice)) return true;
    }
    return true;
  }
  return false;
}

function looksLikeGoodLeadingProse(text: string): boolean {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length < 80) return false;
  if (!/[.!?]/.test(t)) return false;
  if (openingStructuredKeyValueRe().test(t)) return false;
  return true;
}

/**
 * If extraction of a prose field fails, keep good leading narration and drop a trailing
 * JSON object or key block (`{ "options": [...] }` or a bare `"options": [` dump).
 */
function splitLeadingProseFromTrailingStructured(text: string): OpeningStructuredOutput | null {
  const re = openingStructuredKeyValueRe();
  const m = re.exec(text);
  if (!m) return null;
  const keyAt = m.index;
  const before = text.slice(0, keyAt);
  const brace = before.lastIndexOf('{');
  let blockStart = keyAt;
  if (brace >= 0 && before.slice(0, brace).trim()) blockStart = brace;
  const leading = text.slice(0, blockStart).replace(/\s+/g, ' ').trim();
  const rest = text.slice(blockStart).trim();
  if (!looksLikeGoodLeadingProse(leading) || !isStructuredRemainder(rest)) return null;
  return {
    prose: leading,
    options: extractOpeningJsonStringArray(rest, 'options'),
    journalTitle: extractOpeningJsonStringField(rest, 'journalTitle') ?? '',
  };
}

function parseUnwrappedStructuredObject(text: string): Record<string, unknown> | null {
  const normalized = normalizeSmartQuotes(text).trim();
  if (!normalized || normalized.startsWith('{') || normalized.startsWith('[')) return null;
  if (!/^["'](?:prose|options|journalTitle)["']\s*:/.test(normalized)) return null;
  return tryParseJsonObject(closeUnbalancedBraces(stripTrailingCommas(`{${normalized}`)));
}

/**
 * Final leak gate for already-extracted (or caller-supplied) prose. Independent of
 * looksLikeOpeningStructuredText: even if detection missed, this must fail closed.
 * A bare-word `"options": walk or stay` does not trip the key pattern; typographic
 * dialogue and mid-prose `{ward` do not count as JSON-punctuation lines.
 */
export function openingProseLeaksStructuredJson(prose: string): boolean {
  const text = (prose ?? '').trim();
  if (!text) return false;
  if (openingStructuredKeyValueRe().test(text)) return true;
  for (const line of text.split(/\n+/)) {
    if (lineIsMostlyJsonPunctuation(line)) return true;
  }
  return false;
}

function lineIsMostlyJsonPunctuation(line: string): boolean {
  const compact = (line ?? '').trim().replace(/\s+/g, '');
  if (compact.length < 3) return false;
  const jsonChars = (compact.match(/[{}\[\]",:\\]/g) ?? []).length;
  return jsonChars >= 3 && jsonChars / compact.length >= 0.5;
}

/**
 * Read prose/options/journalTitle from a structured opening reply.
 * Tolerates fences, preamble, trailing commas, smart quotes, a missing opening or
 * closing brace, and typographic quotes around keys. If parse still fails, pulls
 * the "prose" string field out by regex, or cuts good prose away from a trailing
 * JSON object / key block. Returns null for free prose, or for structured text
 * whose prose cannot be recovered.
 */
export function readOpeningStructuredOutput(raw: string): OpeningStructuredOutput | null {
  const original = (raw ?? '').trim();
  if (!original) return null;
  const text = stripFencesAndPreamble(original);
  if (!text) return null;

  const slice = jsonObjectSlice(text);
  if (slice) {
    const obj = tryParseJsonObject(slice);
    if (obj) {
      const parsed = fieldsFromObject(obj);
      if (parsed) return parsed;
    }
  }

  const unwrapped = parseUnwrappedStructuredObject(text);
  if (unwrapped) {
    const parsed = fieldsFromObject(unwrapped);
    if (parsed) return parsed;
  }

  const prose = extractOpeningJsonStringField(text, 'prose');
  if (prose) {
    return {
      prose,
      options: extractOpeningJsonStringArray(text, 'options'),
      journalTitle: extractOpeningJsonStringField(text, 'journalTitle') ?? '',
    };
  }

  const structured = looksLikeOpeningStructuredText(original) || looksLikeOpeningStructuredText(text);
  if (structured) {
    const split = splitLeadingProseFromTrailingStructured(text);
    if (split?.prose) return split;
    return null;
  }
  return null;
}

/**
 * Narration the player may hear or read. Recovers prose from almost-JSON;
 * never returns `{`-leading or JSON-looking raw text.
 */
export function recoverOpeningNarration(raw: string): string {
  const parsed = readOpeningStructuredOutput(raw);
  if (parsed?.prose) {
    if (openingProseLeaksStructuredJson(parsed.prose)) return '';
    return parsed.prose;
  }
  const text = stripFencesAndPreamble(raw ?? '').trim();
  if (!text) return '';
  if (looksLikeOpeningStructuredText(raw) || looksLikeOpeningStructuredText(text)) return '';
  return text;
}
