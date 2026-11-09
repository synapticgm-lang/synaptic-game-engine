/**
 * Code-first fact gate. One verdict per span, no model call unless the unsure flag is on.
 * Colour and allowed facts stay. A new or wrong span is repaired once or removed.
 * An unsure span is removed unless SGM_UNSURE_FACT_CHECK=on (or the call opts in).
 */
import type { FactSheet } from './factSheet';
import { splitProseSentences } from './proseSentences';

export type FactVerdict = 'colour' | 'allowed' | 'new/wrong' | 'UNSURE';

export interface FactSpan {
  id: string;
  text: string;
  verdict: FactVerdict;
  reason: string;
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
    const parts = splitAndOutsideQuotes(sentence);
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
    if (new RegExp(`\\b${dead}\\b`, 'i').test(span) && ACTION.test(span)) {
      return { verdict: 'new/wrong', reason: 'dead foe acts' };
    }
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
  const dest = falseDestination(span, words);
  if (dest) return { verdict: 'new/wrong', reason: `exit not on the sheet: ${dest}` };
  if (playerTransfer(span, pcName)) {
    const item = span.match(ITEMISH)?.[1] ?? span.match(LOOSE_ITEM)?.[1];
    if (item && !heldItem(item, words)) return { verdict: 'new/wrong', reason: `unlisted item: ${item}` };
    if (!item) return { verdict: 'UNSURE', reason: 'transfer of an unnamed object' };
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

function falseDestination(span: string, words: Set<string>): string | null {
  if (!/\b(set out|arrived|walked|headed|went|slipped|stepped|ran|travell?ed)\b/i.test(span)) return null;
  const preps = [...span.matchAll(/\b(?:toward|towards|into|through|across|down|up|at|for|to|out of|out)\s+(?:the\s+)?([a-z][a-z'’-]*(?:\s+[a-z][a-z'’-]*){0,3})/gi)];
  if (!preps.length) return null;
  const dest = preps[preps.length - 1]![1]!.replace(/[.!?…]+$/, '').trim();
  const bits = norm(dest).split(' ').filter((w) => w.length >= 4 && !COMMON.has(w));
  if (!bits.length || bits.every((w) => words.has(w))) return null;
  return dest;
}

function playerTransfer(span: string, pcName?: string): boolean {
  const pc = pcName?.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const who = pc ? `(?:you|your|${pc})` : '(?:you|your)';
  const give = new RegExp(`\\b(?:hands|gives|offers|sells|passes)\\s+${who}\\b`, 'i');
  const take = new RegExp(`\\b${who}\\b[^.!?]{0,48}\\b(?:pocket|pockets|pocketed|picked up|took|stole|draws|draw|drinks|drink|uses|use)\\b`, 'i');
  return give.test(span) || take.test(span);
}

function finish(source: string, spans: FactSpan[], pieces: Piece[], recentProse: string[]): FactGateResult {
  const recent = new Set(recentProse.flatMap((p) => segmentFactSpans(p).map((s) => norm(s))).filter(Boolean));
  let kept = spans.map((s, i) => ({ s, i })).filter(({ s }) => s.verdict === 'colour' || s.verdict === 'allowed');
  if (kept.length > 1) kept = kept.filter(({ s }) => !recent.has(norm(s.text)));
  let prose = '';
  let prev: Piece | null = null;
  for (const { i } of kept) {
    const piece = pieces[i]!;
    const span = spans[i]!;
    if (span.reason === 'repaired') {
      if (prose && !/\s$/.test(prose)) prose += ' ';
      prose += span.text;
      prev = piece;
      continue;
    }
    if (prev) prose += source.slice(prev.end, piece.start);
    prose += source.slice(piece.start, piece.end);
    prev = piece;
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
}): Promise<FactGateResult> {
  const words = allowWords(args.sheet, args.pcName, args.allowNames);
  const blob = packetBlob(args.sheet, args.pcName, args.allowNames);
  const judge = (text: string, id: string): FactSpan => ({
    id,
    text,
    ...classifySpan(text, args.sheet, words, blob, args.pcName, args.thirdPerson),
  });
  const pieces = segmentPieces(args.prose);
  const spans: FactSpan[] = pieces.map((piece, i) => judge(piece.text, `s${i + 1}`));
  if (args.repair) {
    const bad = spans.filter((s) => s.verdict === 'new/wrong');
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
