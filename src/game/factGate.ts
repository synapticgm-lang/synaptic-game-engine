/**
 * Hybrid fact gate. A span is colour only when every word is scenery or already on the sheet.
 * Anything uncertain is a candidate for one batched hosted check.
 */
import type { FactSheet } from './factSheet';
import type { FactObjectNote, FactObjectTag } from './roomProps';
import { isPlacedIndefinite, readObjectTag } from './roomProps';

export type FactVerdict = 'colour' | 'allowed' | 'new/wrong' | 'UNSURE';

export type FactRoute = 'colour' | 'allowed' | 'new/wrong' | 'candidate';

export interface FactSpan {
  id: string;
  text: string;
  verdict: FactVerdict;
  /** How code routed the span before any checker. */
  route: FactRoute;
  reason: string;
  /** True when this span is an NPC quote the checker must judge as speech. */
  speech?: boolean;
  /** True when this span is a notice, sign, or page. It is not a fact. */
  writing?: boolean;
  /** True when the only reason this span is a candidate is a placed a/an noun. No tag keeps the prose. */
  objectOnly?: boolean;
}

export interface FactGateResult {
  prose: string;
  withheld: boolean;
  spans: FactSpan[];
  removed: number;
  unsure: number;
  /** Object tags from kept narration spans. Empty when the check did not run. */
  objectNotes: FactObjectNote[];
}

export interface UnsureVerdict {
  id: string;
  verdict: 'colour' | 'allowed' | 'new/wrong';
}

const MOVE = /\b(set out for|arrived at|walked toward|headed (?:for|toward)|travell?ed to|went to|stepped out|the trail lay open)\b/i;
const OBEY = /\b(obeyed|agreed to|complied|went to guard|went along)\b/i;
const IMPLIED = /\b(worth|secret|trade|killed|owns|never tells)\b/i;
const ACTION = /\b(walked|said|told|attacked|struck|ran|opened|joined)\b/i;
const ITEMISH = /\b(health tonic|[a-z]*blade|[a-z]*sword|tonic|treasure|potion|key|knife|ring|letter|cloak|bag|vault)\b/i;
const LOOSE_ITEM = /\b(coin|coins|gold)\b/i;
/** Closed sensory and grammar words. A word outside this set and the sheet is uncertain. */
const SAFE = new Set([
  'steam', 'curl', 'curls', 'curled', 'curling', 'air', 'warm', 'warmth', 'cold', 'hot', 'cool',
  'light', 'lights', 'dark', 'quiet', 'silence', 'still', 'soft', 'damp', 'wet', 'dry', 'pale',
  'dull', 'thin', 'low', 'even', 'smell', 'smelled', 'smells', 'scent', 'hung', 'hang', 'hangs',
  'sat', 'sit', 'sits', 'sitting', 'lay', 'lies', 'lying', 'rose', 'rise', 'rises', 'pooled',
  'pool', 'pools', 'faded', 'fade', 'ticked', 'tick', 'ticks', 'creaked', 'creak', 'burned',
  'burn', 'burns', 'shifted', 'shift', 'pressed', 'press', 'filled', 'fill', 'showed', 'show',
  'lingered', 'linger', 'settled', 'settle', 'beaded', 'bead', 'fogged', 'fog', 'cooled',
  'night', 'shadow', 'shadows', 'smoke', 'dust', 'rain', 'fire', 'water', 'heat', 'glow',
  'gleam', 'hush', 'draft', 'sound', 'late', 'early', 'slow', 'faint', 'deep', 'high', 'small',
  'old', 'gray', 'grey', 'black', 'white', 'once', 'back', 'inch', 'its', 'own', 'their',
  'them', 'they', 'who', 'how', 'all', 'one', 'some', 'any', 'each', 'both', 'more', 'most',
  'other', 'another', 'around', 'along', 'through', 'without', 'within', 'between', 'among',
  'against', 'during', 'until', 'onto', 'inside', 'outside', 'below', 'behind', 'again',
  'away', 'down', 'very', 'too', 'also', 'than', 'then', 'off', 'did', 'does',
]);

const COMMON = new Set([
  'whatever', 'they', 'them', 'their', 'roads', 'road', 'the', 'and', 'but', 'she', 'her', 'his',
  'you', 'your', 'yours', 'that', 'this', 'then', 'there', 'when', 'where', 'what', 'which',
  'while', 'with', 'from', 'into', 'over', 'after', 'before', 'about', 'just', 'only', 'still',
  'here', 'now', 'not', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'out',
  'above', 'across', 'beyond', 'near', 'under', 'upon', 'folks',
]);

export function isUnsureFactCheckEnabled(): boolean {
  return process.env.SGM_UNSURE_FACT_CHECK === 'on';
}

/**
 * The batched fact check uses the hosted gm-turn path.
 * SGM_FACT_CHECK=off keeps the code verdicts. The test runner stays offline
 * unless a test passes its own checker.
 */
export function isFactCheckEnabled(): boolean {
  const flag = process.env.SGM_FACT_CHECK ?? (import.meta.env?.VITE_SGM_FACT_CHECK as string | undefined);
  if (flag === 'off') return false;
  if (flag === 'on') return true;
  if (process.env.VITEST === 'true' || import.meta.env?.MODE === 'test') return false;
  return true;
}

export interface CandidateCheck {
  n: number;
  verdict: 'keep' | 'remove' | 'repair-once';
  text?: string;
  objects?: FactObjectTag[];
}

export type FactChecker = (input: {
  sheet: FactSheet;
  lines: Array<{ n: number; text: string; speech?: boolean; writing?: boolean }>;
}) => Promise<CandidateCheck[]>;

function norm(s: string): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordSet(parts: string[]): Set<string> {
  const words = new Set<string>();
  for (const item of parts) {
    for (const w of norm(item).split(' ')) {
      if (w.length >= 3) words.add(w);
    }
  }
  return words;
}

function allowWords(sheet: FactSheet, pcName?: string, allowNames?: string[]): Set<string> {
  return wordSet([
    sheet.place?.name ?? '',
    ...(sheet.place?.exits ?? []),
    ...(sheet.place?.features ?? []),
    ...(sheet.present ?? []).flatMap((p) => [p.name, p.role ?? '', ...(p.carried ?? []), p.signature ?? '']),
    ...(sheet.gear?.worn ?? []),
    ...(sheet.gear?.carrying ?? []),
    sheet.gear?.inHand ?? '',
    ...(sheet.openLedger ?? []).map((e) => e.line),
    ...(sheet.quests ?? []).flatMap((q) => [q.title, q.step ?? '']),
    sheet.beat?.engineResult ?? '',
    sheet.beat?.outcome ?? '',
    ...(sheet.beat?.steps ?? []).flatMap((s) => [s.detail ?? '', s.outcome]),
    sheet.player?.typed ?? '',
    ...(sheet.recent ?? []),
    pcName ?? '',
    ...(allowNames ?? []),
  ]);
}

/** Current holdings and presence only. Beat prose, denials, and other free text do not list an item. */
function holdingWords(sheet: FactSheet): Set<string> {
  return wordSet([
    ...(sheet.gear?.worn ?? []),
    ...(sheet.gear?.carrying ?? []),
    sheet.gear?.inHand ?? '',
    ...(sheet.place?.features ?? []),
    ...(sheet.present ?? []).flatMap((p) => [p.name]),
    ...(sheet.granted ?? []),
  ]);
}

function packetBlob(sheet: FactSheet, pcName?: string, allowNames?: string[]): string {
  return norm(
    [
      sheet.beat?.engineResult ?? '',
      ...(sheet.beat?.steps ?? []).map((s) => `${s.outcome} ${s.detail ?? ''}`),
      ...(sheet.recent ?? []),
      ...(allowNames ?? []),
      pcName ?? '',
    ].join(' ')
  );
}

function noMove(sheet: FactSheet): boolean {
  const text = `${sheet.beat?.engineResult ?? ''} ${(sheet.beat?.steps ?? []).map((s) => s.detail ?? '').join(' ')}`;
  return /No move this turn|Do not narrate leaving/i.test(text);
}

function disagreeActors(sheet: FactSheet): string[] {
  const text = `${sheet.beat?.engineResult ?? ''} ${(sheet.beat?.steps ?? []).map((s) => s.detail ?? '').join(' ')}`;
  const found: string[] = [];
  for (const m of text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+disagrees\b/g)) {
    if (m[1]) found.push(m[1]);
  }
  return found;
}

function disagrees(sheet: FactSheet): boolean {
  const text = `${sheet.beat?.engineResult ?? ''} ${(sheet.beat?.steps ?? []).map((s) => `${s.outcome} ${s.detail ?? ''}`).join(' ')}`;
  return /disagrees/i.test(text);
}

function deadNames(sheet: FactSheet): string[] {
  const text = `${sheet.beat?.engineResult ?? ''} ${(sheet.beat?.steps ?? []).map((s) => s.detail ?? '').join(' ')}`;
  const found: string[] = [];
  for (const m of text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b(?=[^.]{0,24}\b(?:is dead|corpse)\b)|\bkilled\s+([A-Z][a-z]+)/g)) {
    const name = m[1] || m[2];
    if (name) found.push(name);
  }
  return found;
}

function isLetter(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z]/.test(ch);
}

function isSingleQuote(ch: string): boolean {
  return ch === "'" || ch === '\u2018' || ch === '\u2019';
}

/** don't, Mara's, o'clock. Not an opening or closing quote. */
function isApostrophe(text: string, i: number): boolean {
  return isLetter(text[i - 1]) && isLetter(text[i + 1]);
}

function speakerBefore(text: string, i: number): boolean {
  return /([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*)?)\s+$/.test(text.slice(0, i));
}

/** Quoted speech and em-dash speech. Apostrophes are not quotes. Ranges are [start, end). */
function lineBreakAt(text: string, i: number): number {
  if (text[i] === '\r' && text[i + 1] === '\n') return 2;
  if (text[i] === '\n' || text[i] === '\r') return 1;
  return 0;
}

/** The line before this break ends in . ! ? or an ellipsis, ignoring a closing quote. */
function previousLineEnded(text: string, newlineAt: number): boolean {
  let k = newlineAt - 1;
  while (k >= 0 && /[ \t]/.test(text[k]!)) k -= 1;
  while (k >= 0 && /["'\u201c\u201d\u2018\u2019)\]]/.test(text[k]!)) k -= 1;
  return k >= 0 && /[.!?\u2026]/.test(text[k]!);
}

/**
 * After one newline, dash speech continues when the next line opens with a dash
 * or a quote, or when the previous line did not end (a wrapped sentence).
 */
function nextLineContinuesSpeech(text: string, i: number): boolean {
  const br = lineBreakAt(text, i);
  if (!br) return false;
  let k = i + br;
  if (lineBreakAt(text, k)) return false;
  while (k < text.length && /[ \t]/.test(text[k]!)) k += 1;
  const ch = text[k] ?? '';
  if (ch === '\u2014' || (ch === '-' && text[k + 1] === '-')) return true;
  if (ch === '"' || ch === '\u201c' || ch === '\u2018' || ch === "'") return true;
  return !previousLineEnded(text, i);
}

function isNarrationCue(rest: string, names: string[]): boolean {
  const match = rest.match(/^(He|She|They|[A-Z][a-z'’.-]+(?:\s+[A-Z][a-z'’.-]+)?)\s+\S/);
  if (!match) return false;
  const who = match[1]!;
  if (/^(He|She|They)$/.test(who)) return true;
  const got = who.toLowerCase();
  return names.some((name) => {
    const full = name.trim().toLowerCase();
    const first = full.split(/\s+/)[0] ?? full;
    return got === full || got === first;
  });
}

function speechRanges(prose: string, names: string[] = []): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let i = 0;
  while (i < prose.length) {
    const ch = prose[i]!;
    const dash = ch === '\u2014' ? 1 : ch === '-' && prose[i + 1] === '-' ? 2 : 0;
    if (dash && speakerBefore(prose, i)) {
      let j = i + dash;
      while (j < prose.length) {
        if (lineBreakAt(prose, j)) {
          if (!nextLineContinuesSpeech(prose, j)) break;
          j += lineBreakAt(prose, j);
          continue;
        }
        if (/[.!?\u2026]/.test(prose[j]!)) {
          let k = j + 1;
          while (k < prose.length && /[.!?\u2026"'”’)\]]/.test(prose[k]!)) k += 1;
          let t = k;
          while (t < prose.length && /[ \t]/.test(prose[t]!)) t += 1;
          if (lineBreakAt(prose, t)) {
            if (!nextLineContinuesSpeech(prose, t)) break;
            j = t + lineBreakAt(prose, t);
            continue;
          }
          if (t >= prose.length) {
            j = t;
            break;
          }
          if (isNarrationCue(prose.slice(t), names)) break;
        }
        j += 1;
      }
      ranges.push([i, j]);
      i = Math.max(j, i + dash);
      continue;
    }
    if (ch === '"' || ch === '\u201c') {
      const end = prose.indexOf(ch === '\u201c' ? '\u201d' : '"', i + 1);
      if (end < 0) {
        i += 1;
        continue;
      }
      ranges.push([i, end + 1]);
      i = end + 1;
      continue;
    }
    if (isSingleQuote(ch) && !isApostrophe(prose, i) && !isLetter(prose[i - 1])) {
      let j = i + 1;
      let closed = -1;
      while (j < prose.length) {
        if (isSingleQuote(prose[j]!) && !isApostrophe(prose, j) && !isLetter(prose[j + 1])) {
          closed = j;
          break;
        }
        j += 1;
      }
      if (closed < 0) {
        i += 1;
        continue;
      }
      ranges.push([i, closed + 1]);
      i = closed + 1;
      continue;
    }
    i += 1;
  }
  return ranges;
}

function inSpeech(ranges: Array<[number, number]>, i: number): boolean {
  return ranges.some(([start, end]) => i >= start && i < end);
}

type Piece = { text: string; start: number; end: number };

/** Sentences, then a split on " and " outside quotes so one true clause cannot cover the next. */
export function segmentFactSpans(prose: string): string[] {
  return segmentPieces(prose).map((p) => p.text);
}

function trimPiece(prose: string, start: number, end: number): Piece | null {
  let a = start;
  let b = end;
  while (a < b && /\s/.test(prose[a]!)) a += 1;
  while (b > a && /\s/.test(prose[b - 1]!)) b -= 1;
  if (a >= b) return null;
  return { text: prose.slice(a, b), start: a, end: b };
}

function sentencePieces(prose: string, ranges: Array<[number, number]>): Piece[] {
  const out: Piece[] = [];
  let start = 0;
  for (let i = 0; i < prose.length; i++) {
    const ch = prose[i]!;
    if (!/[.!?\u2026]/.test(ch)) continue;
    let j = i + 1;
    while (j < prose.length && /[.!?\u2026]/.test(prose[j]!)) j += 1;
    while (j < prose.length && /["'\u201c\u201d\u2018\u2019)\]]/.test(prose[j]!)) j += 1;
    const stillInside = ranges.some(([a, b]) => i >= a && i < b && b > j);
    const rest = prose.slice(j);
    const next = rest.match(/^\s*(\S)/)?.[1];
    const newlineAfter = /^(?:[ \t]*(?:\r\n|\n|\r))/.test(rest);
    const boundary = j >= prose.length || newlineAfter || (/\s/.test(prose[j] ?? '') && !!next && !/[a-z]/.test(next));
    const ends = !stillInside && boundary;
    if (!ends) continue;
    const piece = trimPiece(prose, start, j);
    if (piece) out.push(piece);
    start = j;
    i = j - 1;
  }
  const tail = trimPiece(prose, start, prose.length);
  if (tail) out.push(tail);
  return out;
}

function hasOwnVerb(fragment: string): boolean {
  if (MOVE.test(fragment) || OBEY.test(fragment) || SPEECH_VERB.test(fragment)) return true;
  return /\b(is|are|was|were|be|been|do|does|did|has|have|had|waits?|stays?|sits?|lies|lay|said|went|took|made|came|left|sat|rose|gave|kept|held|set|put|turned|opened|closed|watched|looked|nodded|smelled|popped|hung|curled|moved|ran|walked|hands?|gives?|received|pocket(?:s|ed)?|found|lost|dropped|grabbed)\b/i.test(fragment);
}

function splitAndOutsideSpeech(prose: string, sentence: Piece, ranges: Array<[number, number]>): Piece[] {
  if (/nodded and agreed|did as (?:she|he|they) (?:was|were) told|went along quietly/i.test(sentence.text)) {
    return [sentence];
  }
  const parts: Piece[] = [];
  let start = sentence.start;
  for (let i = sentence.start; i < sentence.end - 4; i++) {
    if (inSpeech(ranges, i)) continue;
    if (prose.slice(i, i + 5).toLowerCase() !== ' and ') continue;
    const after = prose.slice(i + 5, sentence.end);
    const nextAnd = after.search(/ and /i);
    const conjunct = nextAnd >= 0 ? after.slice(0, nextAnd) : after;
    if (!hasOwnVerb(conjunct)) continue;
    const piece = trimPiece(prose, start, i);
    if (piece) parts.push(piece);
    start = i + 5;
    i += 4;
  }
  const tail = trimPiece(prose, start, sentence.end);
  if (tail) parts.push(tail);
  return parts.length ? parts : [sentence];
}

function segmentPieces(prose: string, names: string[] = []): Piece[] {
  const ranges = speechRanges(prose, names);
  const out: Piece[] = [];
  for (const sentence of sentencePieces(prose, ranges)) {
    out.push(...splitAndOutsideSpeech(prose, sentence, ranges));
  }
  return out;
}

function stockPhrases(sheet: FactSheet): string[] {
  const out: string[] = [];
  for (const person of sheet.present ?? []) {
    for (const name of stockLabels(person.stock)) {
      const phrase = norm(name);
      if (phrase) out.push(phrase);
    }
  }
  for (const label of sheet.legendLabels ?? []) {
    const phrase = norm(label);
    if (phrase) out.push(phrase);
  }
  return out;
}

/** A stock label counts only as the whole name, not as each of its words. A one-word label counts only after a/an/the. */
function stockNamePhrase(raw: string, before: string, phrases: string[]): boolean {
  const phrase = norm(raw);
  if (!phrase || !phrases.includes(phrase)) return false;
  if (phrase.includes(' ')) return true;
  return /\b(?:a|an|the)\s+$/i.test(before);
}

/** Drop a leading capitalised article. "The" and "An" are long enough to be scanned as part of the name. */
function stripLeadingArticle(raw: string): { name: string; article: boolean } {
  const match = /^(?:A|An|The)\s+(.+)$/.exec(raw);
  if (!match?.[1]) return { name: raw, article: false };
  return { name: match[1], article: true };
}

function nameOutside(span: string, words: Set<string>, pcName?: string, phrases: string[] = []): string | null {
  const quoted = span.replace(/["“][^"”]*["”]/g, ' ');
  const quotes = span.match(/["“][^"”]*["”]/g) ?? [];
  const chunks = [quoted, ...quotes.map((q) => q.slice(1, -1))];
  for (const chunk of chunks) {
    for (const m of chunk.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)) {
      const raw = m[1]!;
      const atStart = (m.index ?? 0) < 2;
      if (atStart && !raw.includes(' ')) continue;
      const { name, article } = stripLeadingArticle(raw);
      const before = article ? 'the ' : chunk.slice(0, m.index ?? 0);
      if (pcName && norm(name) === norm(pcName)) continue;
      if (stockNamePhrase(name, before, phrases)) continue;
      const parts = norm(name).split(' ').filter((w) => w.length >= 3 && !COMMON.has(w));
      if (!parts.length) continue;
      if (parts.some((w) => !words.has(w))) return name;
    }
  }
  return null;
}

function itemNouns(span: string): string[] {
  const out: string[] = [];
  for (const match of span.matchAll(/\b(health tonic|[a-z]*blade|[a-z]*sword|tonic|treasure|potion|key|knife|ring|letter|cloak|bag|vault)\b/gi)) {
    out.push(match[1] ?? match[0]);
  }
  for (const match of span.matchAll(/\b(coin|coins|gold)\b/gi)) {
    out.push(match[1] ?? match[0]);
  }
  return out;
}

function heldItem(item: string, words: Set<string>): boolean {
  const n = norm(item);
  if (!n) return true;
  if (words.has(n)) return true;
  const parts = n.split(' ').filter((w) => w.length >= 3);
  if (parts.length > 1 && parts.every((w) => words.has(w))) return true;
  for (const w of words) {
    if (n.length >= 4 && (w === n || w.includes(n))) return true;
  }
  return false;
}

function stockLabels(stock: FactSheet['present'][number]['stock']): string[] {
  if (!Array.isArray(stock)) return [];
  const out: string[] = [];
  for (const item of stock) {
    const name = typeof item === 'string'
      ? item
      : item && typeof item === 'object' && typeof item.name === 'string'
        ? item.name
        : '';
    if (name.trim()) out.push(name.trim());
  }
  return out;
}

function saleWares(span: string): string[] | null {
  if (!/\b(sells|sold|offers|offered|for sale)\b/i.test(span)) return null;
  const body = span.match(/\b(?:sells|offers|offered|sold)\s+(.+?)(?=\s+for sale\b|\s+from\b|[.]|$)/i)?.[1];
  if (!body) return null;
  const parts = body.split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.replace(/^(?:a|an|the)\s+/i, '').trim())
    .filter((part) => part.length > 0);
  return parts.length ? parts : null;
}

/** Unlisted sale names. A blank stock entry is skipped. Throws never leave this function. */
function unlistedWare(span: string, sheet: FactSheet): string | null {
  try {
    const shops = (sheet.present ?? []).filter((p) => Array.isArray(p.stock));
    if (!shops.length) return null;
    const wares = saleWares(span);
    if (!wares) return null;
    const stock = shops.flatMap((p) => stockLabels(p.stock));
    const missing = wares.filter((name) => !stock.some((have) => have.toLowerCase() === name.toLowerCase()));
    if (!missing.length || missing.length < wares.length) return null;
    return missing[0] ?? null;
  } catch {
    return 'unknown ware';
  }
}

/** Drop unlisted conjuncts from a sale list and keep the wares that are on the shelf. */
export function proseWithoutUnlistedWares(span: string, sheet: FactSheet): { text: string; changed: boolean } {
  try {
    const shops = (sheet.present ?? []).filter((p) => Array.isArray(p.stock));
    const wares = saleWares(span);
    if (!shops.length || !wares || wares.length < 2) return { text: span, changed: false };
    const stock = shops.flatMap((p) => stockLabels(p.stock));
    const missing = wares.filter((name) => !stock.some((have) => have.toLowerCase() === name.toLowerCase()));
    const kept = wares.filter((name) => stock.some((have) => have.toLowerCase() === name.toLowerCase()));
    if (!missing.length || !kept.length) return { text: span, changed: false };
    let text = span;
    for (const name of missing) {
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`\\s*(?:,|and)\\s+(?:a|an|the)\\s+${esc}\\b`, 'i'), '');
      text = text.replace(new RegExp(`\\b(?:a|an|the)\\s+${esc}\\b\\s*(?:,|and)?\\s*`, 'i'), '');
    }
    text = text.replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
    return { text, changed: text !== span };
  } catch {
    return { text: span, changed: false };
  }
}

function classifySpan(
  span: string,
  sheet: FactSheet,
  words: Set<string>,
  holdings: Set<string>,
  blob: string,
  pcName?: string,
  thirdPerson?: boolean
): Pick<FactSpan, 'verdict' | 'reason'> {
  const offShelf = unlistedWare(span, sheet);
  if (offShelf) return { verdict: 'new/wrong', reason: `not in stock: ${offShelf}` };
  if (thirdPerson) {
    const outside = span.replace(/["“][^"”]*["”]/g, ' ');
    if (/\b(you|your|yours)\b/i.test(outside)) return { verdict: 'new/wrong', reason: 'narrator you' };
  }
  if (noMove(sheet) && MOVE.test(span)) return { verdict: 'new/wrong', reason: 'move while the beat says no move' };
  if (MOVE.test(span)) {
    const dest = span.match(/\b(?:arrived at|set out for|walked toward|went to)\s+([^.,]+)/i)?.[1] ?? '';
    const destWords = norm(dest).split(' ').filter((w) => w.length >= 4);
    if (destWords.length && destWords.some((w) => !words.has(w))) {
      return { verdict: 'new/wrong', reason: 'arrival the beat did not grant' };
    }
  }
  if (disagrees(sheet) && OBEY.test(span)) return { verdict: 'new/wrong', reason: 'obeys while the beat says disagrees' };
  for (const dead of deadNames(sheet)) {
    const named = new RegExp(`\\b${dead}\\b`, 'i').test(span);
    if (!named) continue;
    if (/\b(lies|lie|lay|lays|rests|rested|remains|remained)\b/i.test(span)) continue;
    if (new RegExp(`\\b${dead}\\b\\s+\\w+`, 'i').test(span)) {
      return { verdict: 'new/wrong', reason: 'dead foe acts' };
    }
  }
  for (const actor of disagreeActors(sheet)) {
    if (!new RegExp(`\\b${actor}\\b`, 'i').test(span)) continue;
    if (/\b(did as (?:she|he|they) (?:was|were) told|nodded and agreed|obeyed|went along quietly|complied|agreed to)\b/i.test(span)) {
      return { verdict: 'new/wrong', reason: 'obeys while the beat says disagrees' };
    }
  }
  const invented = span.match(/\bnamed\s+([a-z][a-z'-]{2,})\b|\bcalled\s+(?:him|her|them)\s+([a-z][a-z'-]{2,})\b/i);
  const inventedName = (invented?.[1] ?? invented?.[2] ?? '').toLowerCase();
  if (inventedName && !words.has(inventedName) && !COMMON.has(inventedName)) {
    return { verdict: 'new/wrong', reason: `name not on the sheet: ${inventedName}` };
  }
  if (/\b(?=[A-Z0-9_]*[0-9_])[A-Z][A-Za-z0-9_]{5,}\b/.test(span)) {
    return { verdict: 'new/wrong', reason: 'invented token' };
  }
  const outsider = nameOutside(span, words, pcName, stockPhrases(sheet));
  if (outsider) return { verdict: 'new/wrong', reason: `name not on the sheet: ${outsider}` };
  const titled = span.match(/\b(?:captain|ser|sir|lord|lady|dame|king|queen|prince|princess|master)\s+([a-z][a-z'-]{2,})\b/i);
  if (titled && !words.has(titled[1]!.toLowerCase()) && !COMMON.has(titled[1]!.toLowerCase())) {
    return { verdict: 'new/wrong', reason: `name not on the sheet: ${titled[1]}` };
  }
  const agent = span.match(/(?:^|\.\s+)([a-z][a-z'-]{2,})\s+(?:nods|says|said|walks|asks|smiles|steps|whispers)\b/);
  if (agent && !words.has(agent[1]!.toLowerCase()) && !COMMON.has(agent[1]!.toLowerCase())) {
    return { verdict: 'new/wrong', reason: `name not on the sheet: ${agent[1]}` };
  }
  if (partySubject(span, sheet, pcName)) {
    const dest = falseDestination(span, words);
    if (dest) return { verdict: 'new/wrong', reason: `exit not on the sheet: ${dest}` };
  }
  if (playerTransfer(span, pcName) || partyPossession(span, pcName)) {
    const nouns = itemNouns(span);
    if (!nouns.length) return { verdict: 'UNSURE', reason: 'possession change with no named item' };
    const listed = nouns.filter((noun) => heldItem(noun, holdings));
    if (listed.length !== nouns.length) {
      if (listed.length > 0) return { verdict: 'colour', reason: 'gain not fully listed' };
      return { verdict: 'new/wrong', reason: `unlisted item: ${nouns.find((noun) => !heldItem(noun, holdings))}` };
    }
    if (/\b(dropped|lost)\b/i.test(span)) return { verdict: 'new/wrong', reason: 'possession change the beat did not grant' };
    return { verdict: 'allowed', reason: 'item is on the sheet' };
  }
  if (/\b(opens|opened|kills|killed)\b/i.test(span) || /\blands on\b/i.test(span)) {
    const stop = new Set(['with', 'from', 'that', 'this', 'they', 'them', 'then', 'into', 'onto', 'over', 'upon']);
    const unknown = norm(span).split(' ').find((w) => w.length >= 4 && !stop.has(w) && !words.has(w));
    if (unknown) return { verdict: 'new/wrong', reason: `outcome not on the sheet: ${unknown}` };
  }
  const implied = span.match(IMPLIED);
  if (implied && !blob.includes(implied[1]!.toLowerCase())) {
    return { verdict: 'UNSURE', reason: `implied claim not on the sheet: ${implied[1]}` };
  }
  if (/\b(said|told|opened|joined|agreed|killed)\b/i.test(span)) return { verdict: 'allowed', reason: 'outcome sits on the sheet' };
  return { verdict: 'colour', reason: 'no new fact' };
}

function partySubject(span: string, sheet: FactSheet, pcName?: string): boolean {
  if (/^\s*you\b/i.test(span)) return true;
  const names = [pcName ?? '', ...(sheet.present ?? []).map((p) => p.name)].filter((n) => n.length >= 2);
  return names.some((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(span));
}

function falseDestination(span: string, words: Set<string>): string | null {
  if (!/\b(set out|arrived|walked|headed|went|slipped|stepped|ran|travell?ed|moved|crept|hurried|strode)\b/i.test(span)) return null;
  const preps = [...span.matchAll(/\b(?:toward|towards|into|through|across|past|beside|along|around|over|under|down|up|at|for|to|out of|out)\s+(?:the\s+)?([a-z][a-z'’-]*(?:\s+[a-z][a-z'’-]*){0,3})/gi)];
  if (!preps.length) return null;
  const dest = preps[preps.length - 1]![1]!.replace(/[.!?…]+$/, '').trim();
  const bits = norm(dest).split(' ').filter((w) => w.length >= 4 && !COMMON.has(w));
  if (!bits.length) return 'unclear route';
  if (bits.every((w) => words.has(w))) return null;
  return dest;
}

function partyPossession(span: string, pcName?: string): boolean {
  const pc = pcName?.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const who = pc ? `(?:you|your|${pc})` : '(?:you|your)';
  const change = new RegExp(
    `\\b${who}\\b[^.!?]{0,40}\\b(?:found|picked up|dropped|lost|took|received|grabbed)\\b|\\b(?:found|picked up|dropped|lost|took|received|grabbed)\\b[^.!?]{0,40}\\b${who}\\b`,
    'i'
  );
  const grip = new RegExp(`\\b(?:in\\s+)?${who}'s\\s+(?:grip|hands|hand|pack|pocket)\\b`, 'i');
  return change.test(span) || grip.test(span);
}

function playerTransfer(span: string, pcName?: string): boolean {
  const pc = pcName?.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const who = pc ? `(?:you|your|${pc})` : '(?:you|your)';
  const give = new RegExp(`\\b(?:hands|gives|offers|sells|passes)\\s+${who}\\b`, 'i');
  const take = new RegExp(`\\b${who}\\b[^.!?]{0,48}\\b(?:pocket|pockets|pocketed|picked up|took|stole|draws|draw|drinks|drink|uses|use)\\b`, 'i');
  return give.test(span) || take.test(span);
}

const SPEECH_VERB = /\b(said|says|asked|whispered|told|replied|answered|answers)\b/i;

function isWrittenText(text: string): boolean {
  return /\b(?:notice|sign|letter|page|note|placard|inscription|poster)\b[^.!?\n]{0,60}\b(?:read|reads|said|says)\b/i.test(text);
}

/** speech: the span is talk. writing: a sign or notice. narration: a short quote inside a sentence. none: no quote. */
function speechRole(text: string): 'speech' | 'writing' | 'narration' | 'none' {
  if (isWrittenText(text) && speechRanges(text).length > 0) return 'writing';
  const ranges = speechRanges(text);
  const dash = /[A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*)?\s+(?:\u2014|--)/.test(text);
  if (!ranges.length && !dash) return 'none';
  if (dash || SPEECH_VERB.test(text)) return 'speech';
  const quoted = ranges.reduce((n, [start, end]) => n + (end - start), 0);
  if (quoted * 2 >= text.trim().length) return 'speech';
  return 'narration';
}

function narrationOnly(span: string): string {
  const chars = span.split('');
  for (const [start, end] of speechRanges(span)) {
    for (let i = start; i < end && i < chars.length; i++) chars[i] = ' ';
  }
  return chars.join('');
}

function withInlineSpeech(text: string): string {
  const ranges = speechRanges(text);
  if (!ranges.length) return text;
  let out = '';
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start < cursor) continue;
    out += text.slice(cursor, start) + `[speech]${text.slice(start, end)}[/speech]`;
    cursor = end;
  }
  return out + text.slice(cursor);
}

function mentionsFactAgent(span: string, sheet: FactSheet, pcName?: string): boolean {
  if (/\byou(?:r|rs)?\b/i.test(span.replace(/["“][^"”]*["”]/g, ' '))) return true;
  if (partySubject(span, sheet, pcName)) return true;
  return deadNames(sheet).some((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(span));
}

function possessionCue(span: string): boolean {
  if (!/\b(has|have|holds|hold|holding|carries|carry|carrying|keeps|kept|pockets|pocketed|hands|gives|gave|offers|sells|takes|took|taken|found|receives|received|owns)\b/i.test(span)) {
    return false;
  }
  return ITEMISH.test(span) || LOOSE_ITEM.test(span);
}

function motionCue(span: string): boolean {
  const moves = /\b(set out|arrived|walked|headed|went|slipped|stepped|ran|travell?ed|moved|crept|hurried|strode)\b/i.test(span);
  const toward = /\b(toward|towards|into|through|across|past|beside|along|around|over|under|down|up|at|for|to)\b/i.test(span);
  return MOVE.test(span) || (moves && toward);
}

function capStart(text: string): string {
  return text.replace(/^(\s*)([a-z])/, (_, space: string, ch: string) => space + ch.toUpperCase());
}

export function formatFactCheckRequest(input: {
  sheet: FactSheet;
  lines: Array<{ n: number; text: string; speech?: boolean; writing?: boolean }>;
}): string {
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

export function parseFactCheckReply(text: string): CandidateCheck[] {
  const trimmed = (text ?? '').trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
      if (Array.isArray(parsed)) {
        const rows: CandidateCheck[] = [];
        for (const row of parsed) {
          if (!row || typeof row !== 'object') continue;
          const rec = row as { n?: unknown; verdict?: unknown; text?: unknown; objects?: unknown };
          const n = Number(rec.n);
          const verdict = String(rec.verdict ?? '').toLowerCase();
          if (!Number.isInteger(n)) continue;
          if (verdict !== 'keep' && verdict !== 'remove' && verdict !== 'repair-once') continue;
          const objects = Array.isArray(rec.objects)
            ? rec.objects.map(readObjectTag).filter((tag): tag is FactObjectTag => !!tag)
            : undefined;
          rows.push({
            n,
            verdict,
            text: typeof rec.text === 'string' ? rec.text : undefined,
            objects,
          });
        }
        return rows;
      }
    } catch {
      /* A broken JSON blob fails closed per span below. */
    }
  }
  const rows: CandidateCheck[] = [];
  for (const line of trimmed.split('\n')) {
    const match = line.match(/^\s*(\d+)\s*[:.)-]?\s*(keep|remove|repair-once)\b(?:\s*:\s*(.+))?/i);
    if (!match) continue;
    const verdict = match[2]!.toLowerCase() as CandidateCheck['verdict'];
    rows.push({ n: Number(match[1]), verdict, text: match[3]?.trim() });
  }
  return rows;
}

export function makeHostedFactChecker(call: (payload: string) => Promise<string>): FactChecker {
  return async (input) => parseFactCheckReply(await call(formatFactCheckRequest(input)));
}

export function estimateFactCheckTokens(sheet: FactSheet, lines: string[]): { input: number; output: number } {
  const body = formatFactCheckRequest({
    sheet,
    lines: lines.map((text, i) => ({ n: i + 1, text })),
  });
  return { input: Math.ceil(body.length / 4), output: Math.max(40, lines.length * 48) };
}

function finish(source: string, spans: FactSpan[], pieces: Piece[], recentProse: string[], names: string[] = []): FactGateResult {
  const recent = new Set(recentProse.flatMap((p) => segmentFactSpans(p).map((s) => norm(s))).filter(Boolean));
  let kept = spans.map((s, i) => ({ s, i })).filter(({ s }) => s.verdict === 'colour' || s.verdict === 'allowed');
  if (kept.length > 1) kept = kept.filter(({ s }) => !recent.has(norm(s.text)));
  const speech = speechRanges(source, names);
  if (speech.length) {
    const ids = new Set(kept.map(({ i }) => i));
    const doomed = new Set<number>();
    for (const [start, end] of speech) {
      const involved = pieces.map((piece, index) => ({ piece, index })).filter(({ piece }) => piece.start < end && start < piece.end);
      if (involved.some(({ index }) => !ids.has(index))) involved.forEach(({ index }) => doomed.add(index));
    }
    kept = kept.filter(({ i }) => !doomed.has(i));
  }
  let prose = '';
  let prev: Piece | null = null;
  let prevIndex = -1;
  for (const { i } of kept) {
    const piece = pieces[i]!;
    const span = spans[i]!;
    if (span.reason === 'repaired') {
      if (prose && !/\s$/.test(prose)) prose += ' ';
      prose += span.text;
      prev = piece;
      prevIndex = i;
      continue;
    }
    const adjacent = !prev || i === prevIndex + 1;
    if (prev) {
      if (adjacent) prose += source.slice(prev.end, piece.start);
      else if (prose && !/[.!?…]\s*$/.test(prose)) prose += '. ';
      else if (prose && !/\s$/.test(prose)) prose += ' ';
    }
    let slice = source.slice(piece.start, piece.end);
    let termAt = -1;
    for (let p = piece.end; p < source.length; p++) {
      if (/[.!?…]/.test(source[p]!)) {
        termAt = p;
        break;
      }
      if (source[p] === '\n') break;
    }
    const laterKept = [...kept].some(({ i: k }) => k > i && termAt >= 0 && pieces[k]!.start <= termAt);
    if (!laterKept && termAt >= 0 && !/[.!?…]$/.test(slice.trim())) slice += source[termAt]!;
    prose += adjacent ? slice : capStart(slice);
    prev = piece;
    prevIndex = i;
  }
  prose = prose.trim();
  return {
    prose,
    withheld: !prose,
    spans,
    removed: spans.filter((s) => s.verdict === 'new/wrong' || s.verdict === 'UNSURE').length,
    unsure: spans.filter((s) => s.verdict === 'UNSURE').length,
    objectNotes: [],
  };
}

function confidentScenery(span: string, known: Set<string>): boolean {
  const narration = span.replace(/["“][^"”]*["”]/g, ' ');
  const tokens = narration.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
  return tokens.every((token) => token.length < 3 || SAFE.has(token) || COMMON.has(token) || known.has(token));
}

function oneVerdict(reply: CandidateCheck[], n: number): CandidateCheck | null {
  const rows = reply.filter((row) => row.n === n && (row.verdict === 'keep' || row.verdict === 'remove' || row.verdict === 'repair-once'));
  if (!rows.length) return null;
  const kinds = new Set(rows.map((row) => row.verdict));
  if (kinds.size !== 1) return null;
  return rows[rows.length - 1] ?? null;
}

function routeSpan(
  text: string,
  verdict: FactVerdict,
  reason: string,
  sheet: FactSheet,
  pcName: string | undefined,
  known: Set<string>,
): FactRoute {
  if (reason === 'gain not fully listed' || reason === 'speech') return 'candidate';
  if (verdict === 'new/wrong') return 'new/wrong';
  if (verdict === 'allowed' && reason === 'item is on the sheet') return 'allowed';
  if (verdict === 'UNSURE' || mentionsFactAgent(text, sheet, pcName) || possessionCue(text) || motionCue(text)) {
    return 'candidate';
  }
  if (!confidentScenery(text, known)) return 'candidate';
  return 'colour';
}

export async function applyFactGate(args: {
  prose: string;
  sheet: FactSheet;
  pcName?: string;
  allowNames?: string[];
  recentProse?: string[];
  unsureCheckEnabled?: boolean;
  unsureCheck?: (spans: FactSpan[]) => Promise<UnsureVerdict[]>;
  repair?: (spans: FactSpan[]) => Promise<string>;
  /** Close third person: narrator "you" outside quotes is a wrong fact. */
  thirdPerson?: boolean;
  /** One batched check for candidate spans. Tests pass a fake. */
  factCheck?: FactChecker;
  /** Defaults to isFactCheckEnabled(). Off: candidates keep the code verdict. */
  factCheckEnabled?: boolean;
}): Promise<FactGateResult> {
  const words = allowWords(args.sheet, args.pcName, args.allowNames);
  const holdings = holdingWords(args.sheet);
  const blob = packetBlob(args.sheet, args.pcName, args.allowNames);
  const judge = (text: string, id: string): FactSpan => {
    const role = speechRole(text);
    if (role === 'speech' || role === 'writing') {
      return {
        id,
        text,
        verdict: 'colour',
        reason: role,
        speech: role === 'speech',
        writing: role === 'writing',
        route: 'candidate',
      };
    }
    const body = role === 'narration' ? narrationOnly(text) : text;
    const trimmed = proseWithoutUnlistedWares(body, args.sheet);
    const judged = classifySpan(trimmed.text, args.sheet, words, holdings, blob, args.pcName, args.thirdPerson);
    const route = routeSpan(trimmed.text, judged.verdict, judged.reason, args.sheet, args.pcName, words);
    const objectOnly = route === 'colour' && isPlacedIndefinite(trimmed.text);
    return {
      id,
      text: trimmed.changed ? trimmed.text : text,
      verdict: judged.verdict,
      reason: trimmed.changed && judged.verdict !== 'new/wrong' ? 'repaired' : judged.reason,
      speech: false,
      objectOnly,
      route: objectOnly ? 'candidate' : route,
    };
  };
  const people = [args.pcName ?? '', ...(args.sheet.present ?? []).map((p) => p.name)].filter((n) => n.trim().length >= 2);
  const pieces = segmentPieces(args.prose, people);
  const spans: FactSpan[] = pieces.map((piece, i) => judge(piece.text, `s${i + 1}`));
  const factOn = (args.factCheckEnabled ?? isFactCheckEnabled()) && !!args.factCheck;
  const objectNotes: FactObjectNote[] = [];
  if (factOn && args.factCheck) {
    const candidates = spans.filter((s) => s.route === 'candidate');
    if (candidates.length) {
      let reply: CandidateCheck[] = [];
      try {
        const got = await args.factCheck({
          sheet: args.sheet,
          lines: candidates.map((s, i) => ({
            n: i + 1,
            text: s.writing || s.speech ? s.text : withInlineSpeech(s.text),
            speech: s.speech,
            writing: s.writing,
          })),
        });
        reply = Array.isArray(got) ? got : [];
      } catch {
        reply = [];
      }
      candidates.forEach((span, i) => {
        const got = oneVerdict(reply, i + 1);
        const row = reply.find((r) => r.n === i + 1);
        if (span.objectOnly) {
          span.verdict = 'colour';
          span.reason = got?.verdict === 'keep' && row?.objects?.length ? 'checker tagged objects' : 'object candidate, no tag';
          objectNotes.push({
            text: span.text,
            speech: false,
            writing: false,
            kept: true,
            objects: got?.verdict === 'keep' ? row?.objects ?? [] : [],
          });
          return;
        }
        if (!got) {
          span.verdict = 'new/wrong';
          span.reason = 'checker missed this line';
          return;
        }
        if (got.verdict === 'keep') {
          if (span.verdict !== 'allowed') span.verdict = 'colour';
          span.reason = 'checker kept';
          return;
        }
        if (got.verdict === 'repair-once' && got.text?.trim()) {
          const again = judge(got.text.trim(), span.id);
          if (again.verdict === 'new/wrong') {
            span.verdict = 'new/wrong';
            span.reason = 'checker repair still wrong';
            return;
          }
          span.text = got.text.trim();
          span.verdict = again.verdict === 'allowed' ? 'allowed' : 'colour';
          span.reason = 'repaired';
          return;
        }
        span.verdict = 'new/wrong';
        span.reason = 'checker removed';
      });
      candidates.forEach((span, i) => {
        if (span.objectOnly) return;
        const row = reply.find((r) => r.n === i + 1);
        const kept = span.verdict === 'colour' || span.verdict === 'allowed';
        objectNotes.push({
          text: span.text,
          speech: !!span.speech,
          writing: !!span.writing,
          kept,
          objects: kept ? row?.objects ?? [] : [],
        });
      });
    }
  }
  if (args.repair) {
    const bad = spans.filter((s) => s.verdict === 'new/wrong' && !s.reason.startsWith('checker'));
    if (bad.length) {
      const raw = (await args.repair(bad)) ?? '';
      const repaired = segmentFactSpans(raw).map((text, i) => judge(text, `r${i + 1}`));
      const saved = repaired.filter((s) => s.verdict === 'colour' || s.verdict === 'allowed');
      if (saved.length) {
        const first = spans.findIndex((s) => s.verdict === 'new/wrong');
        spans.forEach((s) => {
          if (s.verdict === 'new/wrong') s.verdict = 'UNSURE';
        });
        // Park the repaired sentences as allowed inserts by rewriting the first bad span.
        const host = spans[first];
        if (host) {
          host.text = saved.map((s) => s.text).join('. ');
          host.verdict = 'allowed';
          host.reason = 'repaired';
        }
        spans.forEach((s) => {
          if (s.verdict === 'UNSURE' && s.reason !== 'repaired' && bad.some((b) => b.id === s.id)) {
            s.verdict = 'new/wrong';
          }
        });
      }
    }
  }
  const flag = args.unsureCheckEnabled ?? isUnsureFactCheckEnabled();
  const unsure = spans.filter((s) => s.verdict === 'UNSURE');
  if (flag && args.unsureCheck && unsure.length) {
    let verdicts: UnsureVerdict[] = [];
    try {
      verdicts = await args.unsureCheck(unsure);
    } catch {
      verdicts = [];
    }
    for (const span of unsure) {
      const got = verdicts.find((v) => v.id === span.id);
      if (got?.verdict === 'colour' || got?.verdict === 'allowed') {
        span.verdict = got.verdict;
        span.reason = 'checker cleared';
      }
    }
  }
  const result = finish(args.prose, spans, pieces, args.recentProse ?? [], people);
  result.objectNotes = objectNotes;
  return result;
}
