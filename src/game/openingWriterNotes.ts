/**
 * Slim opening-page-1 notes for the writer packet and system prompt.
 * Imports types only so the edge graph stays capped (no hook decks).
 */
import type { GameState } from './types';
import { isCampaignHubToken } from './outdoorHubs';
import { genderNoun } from './personNames';
import { pcPov } from './narrativePov';
import { openingRiteWriterOffer } from './openingRiteFacts';

export const STORYTELLER_RETRY_MESSAGE = "The storyteller didn't answer — Try again";
export const STORYTELLER_RETRY_CHIP = 'Try again';

export function openingChoiceCountOf(engineMode: GameState['engineMode'] | undefined): number {
  return engineMode === 'dnd' ? 3 : 4;
}

export function openingChoiceCount(state: GameState): number {
  return openingChoiceCountOf(state.engineMode);
}

/** State, not the spelling of a name, owns the player's pronouns. */
export function formatPlayerPronounRail(state: GameState): string {
  if (state.engineMode === 'pyoa' || state.character?.gender?.trim()) return '';
  const { name } = pcPov(state.character);
  return `${name}'s gender is not given: call ${name} by name or they/them/their. Never he/him or she/her for ${name}. Do not infer gender from a name.`;
}

/** Keep page 1's actual camera, not just the minted place label, until the player leaves. */
export function formatEstablishedOpeningScene(state: GameState): string {
  const est = state.openingEstablishment;
  const inst = est?.instance;
  if (state.engineMode === 'pyoa' || !est?.sceneWritten || !est.sceneProse || !inst) return '';
  if (state.activeDungeon || state.journey || state.circling?.prevPlace) return '';
  if (state.currentLocation?.trim().toLowerCase() !== inst.placeName.trim().toLowerCase()) return '';
  return [
    `ESTABLISHED SCENE: ${inst.placeName} (${inst.placeKind}).`,
    inst.situation && inst.situation.trim().toLowerCase() !== inst.placeKind.trim().toLowerCase()
      ? `Place description: ${inst.situation}`
      : '',
    `Page 1 showed: ${est.sceneProse}`,
    'Continue this established scene. Registration changes the rite and allotment, not the surroundings. Do not relocate the player or replace the scene without a resolved event.',
  ].filter(Boolean).join('\n');
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
    : `LOCKED PEOPLE (use these names, genders, and roles exactly): ${
        inst.cast.map((c) => `${c.name} — ${genderNoun(c.gender)}, ${c.role}`).join('; ') || 'none'
      }`;
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
    formatPlayerPronounRail(state),
    openingRiteWriterOffer(state) ?? '',
    'Return a JSON object with keys prose, options, and journalTitle. No markdown fences.',
    'prose: the first page the player will read. Novel-quality, concrete, present, no director notes, no menu language, no numbered choice list, no XML or angle-bracket tags.',
    optionHint,
    "If an option uses a gendered pronoun (he/she), it must match that person's locked gender. Otherwise phrase the option without a pronoun.",
    "A speaker who introduces themselves (\"Name. I track.\") must be that locked person, with that person's gender and role. Do not put one person's name in another person's mouth.",
    'Use he/him/his for a locked man and she/her/hers for a locked woman. Do not swap those pronouns.',
    'journalTitle: a short title, at most 8 whole words, naming a person, place, or goal from the scene. Do not write a comma-separated list of names and places.',
    `LOCKED PLACE: ${inst.placeName} (${inst.placeKind}) — use this full name in the prose, not a generic word like trail or road.`,
    near,
    people,
    inst.factionName ? `LOCKED FACTION: ${inst.factionName}${inst.factionKind ? ` (${inst.factionKind})` : ''}` : '',
    inst.situation ? `SITUATION (private): ${inst.situation}` : '',
    inst.pressing ? `PRESSURE (private): ${inst.pressing}` : '',
    inst.how ? `HOW YOU ARRIVED (private): ${inst.how}` : '',
    offer,
    retired,
    'Name the locked place in full and every locked person by name in the prose. No "someone here", "a figure", or unnamed stand-ins when a locked name exists.',
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
  const near = inst.nearbyLandmark
    ? `${inst.nearbyLandmark} is still on the map and is a usable campaign hub — later turns may go there.`
    : '';
  if (!locked.length && !retired.length && !near) return '';
  return [
    '【 LOCKED NAMES 】',
    locked.length ? `Keep using these locked names: ${locked.join(', ')}.` : '',
    near,
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
 * Strip BOM and markdown fences only. Further repairs happen on a `{ ... }` slice.
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

function isTypographicDoubleQuote(ch: string): boolean {
  return /[\u201C\u201D\u00AB\u00BB\u201E\u201F]/.test(ch);
}

function isTypographicSingleQuote(ch: string): boolean {
  return /[\u2018\u2019\u201A\u201B]/.test(ch);
}

function isTypographicQuote(ch: string): boolean {
  return isTypographicDoubleQuote(ch) || isTypographicSingleQuote(ch);
}

function typographicFamily(ch: string): 'double' | 'single' | null {
  if (isTypographicDoubleQuote(ch)) return 'double';
  if (isTypographicSingleQuote(ch)) return 'single';
  return null;
}

function skipEscaped(s: string, i: number): number {
  return s[i] === '\\' && i + 1 < s.length ? i + 2 : -1;
}

/**
 * Normalise typographic quotes that delimit JSON keys or string values.
 * Typographic quotes inside an already ASCII-quoted string are left alone.
 * A typographic closer is only treated as the end of a value when it sits
 * before a comma, brace, bracket, colon, or the end of the slice, so
 * dialogue like “Talk is done,” inside a typographic value is preserved.
 */
function normalizeTypographicQuotesAroundKeys(slice: string): string {
  const s = slice ?? '';
  let out = '';
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < s.length) {
        const escaped = skipEscaped(s, i);
        if (escaped > 0) {
          out += s.slice(i, escaped);
          i = escaped;
          continue;
        }
        out += s[i];
        i += 1;
        if (s[i - 1] === '"') break;
      }
      continue;
    }
    const family = typographicFamily(ch);
    if (family) {
      i += 1;
      let body = '';
      let closed = -1;
      while (i < s.length) {
        const escaped = skipEscaped(s, i);
        if (escaped > 0) {
          body += s.slice(i, escaped);
          i = escaped;
          continue;
        }
        const c = s[i]!;
        if (typographicFamily(c) === family) {
          const after = s.slice(i + 1).match(/^\s*([,}\]:]|$)/);
          if (after) {
            closed = i;
            break;
          }
        }
        if (c === '"') body += '\\"';
        else body += c;
        i += 1;
      }
      out += `"${body}"`;
      if (closed >= 0) i = closed + 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function skipJsonString(s: string, i: number): number {
  const ch = s[i]!;
  if (ch === '"') {
    i += 1;
    while (i < s.length) {
      const escaped = skipEscaped(s, i);
      if (escaped > 0) {
        i = escaped;
        continue;
      }
      if (s[i] === '"') return i + 1;
      i += 1;
    }
    return i;
  }
  const family = typographicFamily(ch);
  if (!family) return i + 1;
  i += 1;
  while (i < s.length) {
    const escaped = skipEscaped(s, i);
    if (escaped > 0) {
      i = escaped;
      continue;
    }
    if (typographicFamily(s[i]!) === family) {
      const after = s.slice(i + 1).match(/^\s*([,}\]:]|$)/);
      if (after) return i + 1;
    }
    i += 1;
  }
  return i;
}

/** First `{` to its matching `}`, or the last `}` if the close is missing. */
function jsonObjectSlice(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '"' || isTypographicQuote(ch)) {
      i = skipJsonString(text, i);
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
    i += 1;
  }
  const last = text.lastIndexOf('}');
  if (last > start) return text.slice(start, last + 1);
  return closeUnbalancedBraces(text.slice(start));
}

function stripTrailingCommas(text: string): string {
  return (text ?? '').replace(/,(\s*[}\]])/g, '$1');
}

/** Count `{` / `}` only outside JSON strings so braces inside prose are not closed. */
export function closeUnbalancedBraces(slice: string): string {
  let opens = 0;
  let closes = 0;
  let i = 0;
  while (i < slice.length) {
    const ch = slice[i]!;
    if (ch === '"' || isTypographicQuote(ch)) {
      i = skipJsonString(slice, i);
      continue;
    }
    if (ch === '{') opens += 1;
    else if (ch === '}') closes += 1;
    i += 1;
  }
  if (opens > closes) return slice + '}'.repeat(opens - closes);
  return slice;
}

function tryParseJsonObject(slice: string): Record<string, unknown> | null {
  const variants = [
    slice,
    stripTrailingCommas(slice),
    normalizeTypographicQuotesAroundKeys(slice),
    stripTrailingCommas(normalizeTypographicQuotesAroundKeys(slice)),
    closeUnbalancedBraces(stripTrailingCommas(normalizeTypographicQuotesAroundKeys(slice))),
  ];
  const seen = new Set<string>();
  for (const v of variants) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    try {
      const obj = JSON.parse(v) as unknown;
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Record<string, unknown>;
    } catch {
      /* try the next allowed repair */
    }
  }
  return null;
}

function fieldsFromObject(obj: Record<string, unknown>): OpeningStructuredOutput | null {
  if (typeof obj.prose !== 'string') return null;
  const prose = obj.prose.replace(/\s+/g, ' ').trim();
  if (!prose) return null;
  const options = Array.isArray(obj.options)
    ? obj.options.map((s) => String(s ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    : [];
  const journalTitle = typeof obj.journalTitle === 'string' ? obj.journalTitle.replace(/\s+/g, ' ').trim() : '';
  return { prose, options, journalTitle };
}

/**
 * Read a strict opening-page object from the writer reply.
 * Allowed repairs only: strip fences, slice from the first `{` to its matching
 * or last `}`, add a missing closing brace, fix trailing commas, and normalise
 * typographic quotes around keys. Anything else is a parse failure.
 */
export function readOpeningStructuredOutput(raw: string): OpeningStructuredOutput | null {
  const text = stripFencesAndPreamble(raw ?? '');
  if (!text) return null;
  const slice = jsonObjectSlice(text);
  if (!slice) return null;
  const obj = tryParseJsonObject(slice);
  if (!obj) return null;
  return fieldsFromObject(obj);
}

/** Parsed `prose` or empty. Never falls back to free prose or raw almost-JSON. */
export function recoverOpeningNarration(raw: string): string {
  return readOpeningStructuredOutput(raw)?.prose ?? '';
}

const STRUCTURED_KEY = 'prose|options|choices|journalTitle|journal_title|story|title|text|narration|scene';
function looksLikeQuotedJsonKeyColon(text: string): boolean {
  const quotedKey = new RegExp(
    `["\u201C\u201D](?:${STRUCTURED_KEY})["\u201C\u201D]\\s*:`,
    'i'
  );
  const typographicOrSingleKey = new RegExp(
    `[\u2018\u2019'](?:${STRUCTURED_KEY})[\u2018\u2019']\\s*:`,
    'i'
  );
  return quotedKey.test(text) || typographicOrSingleKey.test(text);
}

function schemaKeyThenJsonValue(text: string): boolean {
  return new RegExp(
    `\\b(?:${STRUCTURED_KEY})\\b\\s*["'\u201C\u201D\u2018\u2019]?\\s*:\\s*[\\[\\{]`,
    'i'
  ).test(text);
}

function schemaKeyThenCommaQuoteKey(text: string): boolean {
  return new RegExp(
    `\\b(?:${STRUCTURED_KEY})\\b\\s*["'\u201C\u201D\u2018\u2019]?\\s*:\\s*["\u201C\u201D\u2018\u2019'].*?["\u201C\u201D\u2018\u2019']\\s*,\\s*["\u201C\u201D\u2018\u2019'][A-Za-z]`,
    'i'
  ).test(text);
}

function bareSchemaKeyQuotedValueLine(text: string): boolean {
  const re = new RegExp(
    `^(?:${STRUCTURED_KEY})\\s*:\\s*["\u201C\u201D\u2018\u2019'].*["\u201C\u201D\u2018\u2019']\\s*$`,
    'i'
  );
  return text.split(/\n/).some((line) => re.test(line.trim()));
}

/**
 * Independent final leak gate for already-extracted (or caller-supplied) prose.
 * Written separately from the parser and must not call parser/detection helpers.
 * Callers must parse, then rewrite markup, then run this gate — never gate raw
 * writer text that still contains `<system>` tags the rewrite would convert.
 *
 * Plain colons after ordinary words ("The scene:", "Your options:", "the miners':",
 * speaker colons) do not fail, including when what follows is a plain quoted
 * phrase such as `Your options: "walk" or "stay."`. A colon only fails when it
 * is a quoted/schema key, is followed by `[` or `{`, the quoted value is
 * followed by a comma-quote-key pattern, or a line is a bare `key: "value"`
 * field. The game's own `[ SYSTEM ]` registrar line is allowed; any other
 * line that starts with `[` / `{` / `}` / `]` fails. Leftover tag-like
 * `<` followed by a letter (including unclosed forms) also fails.
 */
export function openingProseLeaksStructuredJson(prose: string): boolean {
  const text = prose ?? '';
  if (!text.trim()) return false;
  if (/<\/?[A-Za-z]/.test(text)) return true;
  for (const line of text.split(/\n/)) {
    const trimmed = line.replace(/^\s+/, '');
    if (/^\[\s*SYSTEM\s*\]\s*$/.test(trimmed)) continue;
    if (/^[{}\[\]]/.test(trimmed)) return true;
  }
  if (looksLikeQuotedJsonKeyColon(text)) return true;
  if (schemaKeyThenJsonValue(text) || schemaKeyThenCommaQuoteKey(text) || bareSchemaKeyQuotedValueLine(text)) {
    return true;
  }
  for (const line of text.split(/\n/)) {
    const compact = line.trim().replace(/\s+/g, '');
    if (compact.length < 3) continue;
    const punct = (compact.match(/[{}\[\]",:\u201C\u201D\u2018\u2019]/g) ?? []).length;
    if (punct >= 3 && punct / compact.length >= 0.5) return true;
  }
  return false;
}

const SYSTEM_TAG_BLOCK = /<system\b[^>]*>([\s\S]*?)<\/system>/gi;
const ANY_TAG = /<\/?[A-Za-z][\w:-]*\b[^>]*>/g;

/** Strip Markdown emphasis (`**`, `__`) and leading heading markers (`#`). */
function stripOpeningMarkdown(text: string): string {
  let s = text.replace(/(\*\*|__)([\s\S]+?)\1/g, '$2');
  s = s.replace(/\*\*|__/g, '');
  s = s.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
  return s;
}

/**
 * Convert or strip raw markup in opening narration.
 * LitRPG `<system>` blocks become the same `[ SYSTEM ]` registrar lines later turns use
 * (FormattedText already renders those as an in-world System panel). Other tags are
 * stripped, inner text kept. Markdown emphasis and heading markers are stripped.
 * Text with no markup is returned unchanged.
 */
export function rewriteOpeningMarkup(text: string, engineMode?: string): string {
  const raw = text ?? '';
  let s = stripOpeningMarkdown(raw);
  if (!/<\/?[A-Za-z]/.test(s)) return s;
  if (engineMode === 'litrpg') {
    s = s.replace(SYSTEM_TAG_BLOCK, (_full, body: string) => {
      const inner = String(body ?? '')
        .replace(/^\s*\[\s*(SYSTEM|THE AUDITOR|THE TALE|THE STORY)\s*\]\s*/i, '')
        .trim();
      if (!inner) return '';
      return `\n[ SYSTEM ]\n${inner}\n`;
    });
  } else {
    s = s.replace(SYSTEM_TAG_BLOCK, (_full, body: string) => {
      const inner = String(body ?? '').replace(/\[\s*SYSTEM\s*\]/gi, '').trim();
      return inner ? ` ${inner} ` : ' ';
    });
  }
  s = s.replace(ANY_TAG, ' ');
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
}
