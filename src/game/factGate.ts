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
const GAIN = /\b(pockets|pocketed|picked up|stole|took the|handed|hands\s+(?:you|him|her|them)\s+the|received|has|holds|carries|keeps)\b/i;
const IMPLIED = /\b(worth|secret|trade|killed|owns|never tells)\b/i;
const ACTION = /\b(walked|said|told|attacked|struck|ran|opened|joined)\b/i;
const ITEMISH = /\b(health tonic|[a-z]*blade|[a-z]*sword|tonic|treasure|potion|key|knife|ring|letter|cloak|bag|vault)\b/i;
const LOOSE_ITEM = /\b(coin|coins|gold)\b/i;
const FALSE_EXIT = /\b(?:out|through|into|down)\s+(?:the\s+)?([a-z]{4,})\b/i;
const EXIT_NOUNS = new Set(['alley', 'lane', 'road', 'cellar', 'yard', 'gate', 'stair', 'stairs', 'tunnel', 'path', 'trail', 'square', 'bridge', 'passage', 'street']);
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

/** Sentences, then a split on " and " outside quotes so one true clause cannot cover the next. */
export function segmentFactSpans(prose: string): string[] {
  const out: string[] = [];
  for (const sentence of splitProseSentences(prose)) {
    const parts = splitAndOutsideQuotes(sentence);
    if (parts.length <= 1) {
      if (sentence.trim()) out.push(sentence.trim());
      continue;
    }
    parts.forEach((part, i) => {
      const text = i === parts.length - 1 && /[.!?…]$/.test(sentence) && !/[.!?…]$/.test(part) ? part : part.replace(/[.!?…]+$/, '');
      out.push(text);
    });
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
  const exitWord = span.match(FALSE_EXIT)?.[1]?.toLowerCase();
  if (exitWord && EXIT_NOUNS.has(exitWord) && !words.has(exitWord)) {
    return { verdict: 'new/wrong', reason: `exit not on the sheet: ${exitWord}` };
  }
  const itemWord = span.match(ITEMISH)?.[1]?.toLowerCase();
  if (itemWord && !heldItem(itemWord, words)) return { verdict: 'new/wrong', reason: `unlisted item: ${itemWord}` };
  if (GAIN.test(span)) {
    const loose = span.match(LOOSE_ITEM)?.[1]?.toLowerCase();
    if (loose && !heldItem(loose.replace(/s$/, ''), words)) {
      return { verdict: 'new/wrong', reason: `unlisted item: ${loose}` };
    }
    const item = itemWord;
    if (item && !heldItem(item, words)) {
      return { verdict: 'new/wrong', reason: `unlisted item: ${item}` };
    }
    if (!item && /\b(it|them|that)\b/i.test(span)) return { verdict: 'UNSURE', reason: 'transfer of an unnamed object' };
    if (item) return { verdict: 'allowed', reason: 'item is on the sheet' };
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

function finish(spans: FactSpan[], recentProse: string[]): FactGateResult {
  const recent = new Set(recentProse.flatMap((p) => segmentFactSpans(p).map((s) => norm(s))).filter(Boolean));
  let kept = spans.filter((s) => s.verdict === 'colour' || s.verdict === 'allowed');
  if (kept.length > 1) {
    kept = kept.filter((s) => !recent.has(norm(s.text)));
  }
  const prose = kept.map((s) => s.text.replace(/[.!?…]+$/, '')).filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
  const published = prose ? (/[.!?…]$/.test(prose) ? prose : `${prose}.`) : '';
  return {
    prose: published,
    withheld: !published,
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
  const spans: FactSpan[] = segmentFactSpans(args.prose).map((text, i) => judge(text, `s${i + 1}`));
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
  return finish(spans, args.recentProse ?? []);
}
