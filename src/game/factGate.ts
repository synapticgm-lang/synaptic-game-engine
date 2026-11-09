/**
 * Hybrid fact gate. A span is colour only when every word is scenery or already on the sheet.
 * Anything uncertain is a candidate for one batched hosted check.
 */
import type { FactSheet } from './factSheet';
import { splitProseSentences } from './proseSentences';

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
}

export interface FactGateResult {
  prose: string;
  withheld: boolean;
  spans: FactSpan[];
  removed: number;
  unsure: number;
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
}

export type FactChecker = (input: {
  sheet: FactSheet;
  lines: Array<{ n: number; text: string; speech?: boolean }>;
}) => Promise<CandidateCheck[]>;

function norm(s: string): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function allowWords(sheet: FactSheet, pcName?: string, allowNames?: string[]): Set<string> {
  const blob: string[] = [
    sheet.place?.name ?? '',
    ...(sheet.place?.exits ?? []),
    ...(sheet.place?.features ?? []),
    ...(sheet.present ?? []).flatMap((p) => [p.name, p.role ?? '']),
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
  ];
  const words = new Set<string>();
  for (const item of blob) {
    for (const w of norm(item).split(' ')) {
      if (w.length >= 3) words.add(w);
    }
  }
  return words;
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

function splitAndOutsideQuotes(sentence: string): string[] {
  const parts: string[] = [];
  let buf = '';
  let quoted = false;
  for (let i = 0; i < sentence.length; i++) {
    const ch = sentence[i]!;
    if (ch === '"' || ch === '\u201c' || ch === '\u201d') quoted = !quoted;
    if (!quoted && sentence.slice(i, i + 5).toLowerCase() === ' and ') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      i += 4;
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

type Piece = { text: string; start: number; end: number };

/** Sentences, then a split on " and " outside quotes so one true clause cannot cover the next. */
export function segmentFactSpans(prose: string): string[] {
  return segmentPieces(prose).map((p) => p.text);
}

function segmentPieces(prose: string): Piece[] {
  const out: Piece[] = [];
  let cursor = 0;
  for (const sentence of splitProseSentences(prose)) {
    const at = prose.indexOf(sentence, cursor);
    const start = at >= 0 ? at : cursor;
    const end = start + sentence.length;
    const parts = /nodded and agreed|did as (?:she|he|they) (?:was|were) told|went along quietly/i.test(sentence)
      ? [sentence]
      : splitAndOutsideQuotes(sentence);
    if (parts.length <= 1) {
      if (sentence.trim()) out.push({ text: sentence, start, end });
    } else {
      let local = 0;
      for (const part of parts) {
        const rel = sentence.indexOf(part, local);
        const from = rel >= 0 ? rel : local;
        out.push({ text: sentence.slice(from, from + part.length), start: start + from, end: start + from + part.length });
        local = from + part.length;
      }
    }
    cursor = end;
  }
  return out;
}

function nameOutside(span: string, words: Set<string>, pcName?: string): string | null {
  const quoted = span.replace(/["“][^"”]*["”]/g, ' ');
  const quotes = span.match(/["“][^"”]*["”]/g) ?? [];
  const chunks = [quoted, ...quotes.map((q) => q.slice(1, -1))];
  for (const chunk of chunks) {
    for (const m of chunk.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)) {
      const raw = m[1]!;
      const atStart = (m.index ?? 0) < 2;
      if (atStart && !raw.includes(' ')) continue;
      if (pcName && norm(raw) === norm(pcName)) continue;
      const parts = norm(raw).split(' ').filter((w) => w.length >= 3 && !COMMON.has(w));
      if (!parts.length) continue;
      if (parts.some((w) => !words.has(w))) return raw;
    }
  }
  return null;
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

function classifySpan(
  span: string,
  sheet: FactSheet,
  words: Set<string>,
  blob: string,
  pcName?: string,
  thirdPerson?: boolean
): Pick<FactSpan, 'verdict' | 'reason'> {
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
  const outsider = nameOutside(span, words, pcName);
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
    const item = span.match(ITEMISH)?.[1] ?? span.match(LOOSE_ITEM)?.[1];
    if (item && !heldItem(item, words)) return { verdict: 'new/wrong', reason: `unlisted item: ${item}` };
    if (!item) return { verdict: 'UNSURE', reason: 'possession change with no named item' };
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

function isSpeech(span: string): boolean {
  if (!/["“]/.test(span)) return false;
  const narration = span.replace(/["“][^"”]*["”]/g, ' ').trim();
  if (!narration) return true;
  if (playerTransfer(narration) || partyPossession(narration) || MOVE.test(narration)) return false;
  if (falseDestination(narration, new Set())) return false;
  const words = narration
    .replace(/[^A-Za-z' ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(said|says|asked|whispered|told|replied|answers|answered|called)$/i.test(w));
  return words.length <= 6;
}

function mechanicalNow(span: string): boolean {
  const quoted = [...span.matchAll(/["“]([^"”]*)["”]/g)].map((m) => m[1] ?? '').join(' ');
  const claim = quoted || span;
  return /\byou(?:'re| are) (?:dead|wounded|holding|carrying)\b/i.test(claim)
    || /\byou (?:now )?(?:hold|have|carry|pocket|receive|die)\b/i.test(claim)
    || /\byour (?:hp|health|hit points)\b/i.test(claim);
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
  lines: Array<{ n: number; text: string; speech?: boolean }>;
}): string {
  return [
    'Fact check. One verdict for every numbered line: keep, remove, or repair-once.',
    'A line marked [narration] is the narrator. A line marked [speech] is an NPC talking.',
    'Speech may be rumour, opinion, or a story: keep those. Remove a speech line only when it states that the player, the party, or someone present gains an object, goes somewhere, or obeys.',
    'Objects held in someone else\'s hands, or lying in the scenery, are allowed unless the player or the party gains them.',
    'keep = scenery, harmless speech, or a fact already on the sheet. remove = a new or wrong fact. repair-once = replace that line once.',
    'Reply as JSON: [{"n":1,"verdict":"keep"}]. A repair-once row may include "text".',
    'SHEET:',
    JSON.stringify(input.sheet),
    'LINES:',
    ...input.lines.map((line) => `${line.n}. ${line.speech ? '[speech]' : '[narration]'} ${line.text}`),
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
          const rec = row as { n?: unknown; verdict?: unknown; text?: unknown };
          const n = Number(rec.n);
          const verdict = String(rec.verdict ?? '').toLowerCase();
          if (!Number.isInteger(n)) continue;
          if (verdict !== 'keep' && verdict !== 'remove' && verdict !== 'repair-once') continue;
          rows.push({
            n,
            verdict,
            text: typeof rec.text === 'string' ? rec.text : undefined,
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
  return { input: Math.ceil(body.length / 4), output: Math.max(8, lines.length * 12) };
}

function finish(source: string, spans: FactSpan[], pieces: Piece[], recentProse: string[]): FactGateResult {
  const recent = new Set(recentProse.flatMap((p) => segmentFactSpans(p).map((s) => norm(s))).filter(Boolean));
  let kept = spans.map((s, i) => ({ s, i })).filter(({ s }) => s.verdict === 'colour' || s.verdict === 'allowed');
  if (kept.length > 1) kept = kept.filter(({ s }) => !recent.has(norm(s.text)));
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
    const slice = source.slice(piece.start, piece.end);
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
  };
}

function quotedText(span: string): string {
  return [...span.matchAll(/["“]([^"”]*)["”]/g)].map((m) => m[1] ?? '').join(' ');
}

function quoteAssertsChange(span: string, sheet: FactSheet, pcName?: string): boolean {
  const quoted = quotedText(span);
  if (!quoted.trim()) return false;
  if (playerTransfer(quoted, pcName) || partyPossession(quoted, pcName)) return true;
  const person = partySubject(quoted, sheet, pcName) || /\byou\b/i.test(quoted);
  if (/\b(did as (?:she|he|they) (?:was|were) told|nodded and agreed|obeyed|went along quietly|complied|agreed to)\b/i.test(quoted) && person) {
    return true;
  }
  return (motionCue(quoted) || MOVE.test(quoted)) && partySubject(quoted, sheet, pcName);
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
  if (isSpeech(text) && quoteAssertsChange(text, sheet, pcName)) return 'candidate';
  if (isSpeech(text) && !mechanicalNow(text)) return 'colour';
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
  const blob = packetBlob(args.sheet, args.pcName, args.allowNames);
  const judge = (text: string, id: string): FactSpan => {
    const judged = classifySpan(text, args.sheet, words, blob, args.pcName, args.thirdPerson);
    const talk = isSpeech(text);
    const claim = talk && quoteAssertsChange(text, args.sheet, args.pcName);
    const verdict = talk && !claim ? 'colour' : judged.verdict;
    const reason = claim ? 'speech claim' : talk ? 'speech' : judged.reason;
    return {
      id,
      text,
      verdict,
      reason,
      speech: claim,
      route: routeSpan(text, verdict, reason, args.sheet, args.pcName, words),
    };
  };
  const pieces = segmentPieces(args.prose);
  const spans: FactSpan[] = pieces.map((piece, i) => judge(piece.text, `s${i + 1}`));
  const factOn = (args.factCheckEnabled ?? isFactCheckEnabled()) && !!args.factCheck;
  if (factOn && args.factCheck) {
    const candidates = spans.filter((s) => s.route === 'candidate');
    if (candidates.length) {
      let reply: CandidateCheck[] = [];
      try {
        const got = await args.factCheck({
          sheet: args.sheet,
          lines: candidates.map((s, i) => ({ n: i + 1, text: s.text, speech: s.speech })),
        });
        reply = Array.isArray(got) ? got : [];
      } catch {
        reply = [];
      }
      candidates.forEach((span, i) => {
        const got = oneVerdict(reply, i + 1);
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
  return finish(args.prose, spans, pieces, args.recentProse ?? []);
}
