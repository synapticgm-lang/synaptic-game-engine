/**
 * 28u — one beat names a place or a person in full once. Later mentions in the same beat take the
 * short form the ledger label already holds ("The Quiet Bell chapel" → "the chapel", "Wren Holt" → "Wren").
 * Also repairs article glue around painted labels ("the mud-rutted The road", "the Wren Holt's").
 * Works from ledger refs only — no word lists of story content.
 */
import type { LedgerRef } from './completedEventPacket';

const LINK_RE = /\s+(?:at|of|on|in|near|outside|toward|towards|by|beside|past|off|under|over|behind|below|above)\s+|,\s*/i;
const DIRECTION_RE = /^(?:east|west|north|south|eastward|westward|northward|southward|up|down|ahead)$/i;
const HONORIFIC_RE =
  /^(?:mr|mrs|ms|miss|sir|dame|lord|lady|king|queen|prince|princess|duke|duchess|count|countess|baron|captain|commander|sergeant|general|magistrate|brother|sister|father|mother|elder|master|mistress|archivist|doctor|dr|professor|saint|st|old|young)\.?$/i;

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "the ferry inn at Thornferry" → "the inn"; proper-name tails ("West Wall") have no short form. */
export function placeShortForm(display: string): string | null {
  const core = (display ?? '').replace(/^(?:the|a|an)\s+/i, '').replace(/\s+/g, ' ').trim();
  if (core.split(' ').length < 2) return null;
  const head = (core.split(LINK_RE)[0] ?? '').trim().split(' ').filter(Boolean);
  while (head.length > 1 && DIRECTION_RE.test(head[head.length - 1]!)) head.pop();
  const noun = head[head.length - 1] ?? '';
  if (noun.length < 3 || !/^[a-z]/.test(noun)) return null;
  const short = `the ${noun.replace(/[^a-z'-]/gi, '')}`;
  return short.toLowerCase() === display.trim().toLowerCase() ? null : short;
}

/** "Wren Holt" → "Wren"; titled names ("Magistrate Pell") and role labels stay whole. */
export function personShortForm(display: string, givenNameCounts: Map<string, number>): string | null {
  const m = (display ?? '').trim().match(/^([A-Z][a-z'’-]+)\s+([A-Z][a-z'’-]+)$/);
  if (!m) return null;
  const given = m[1]!;
  if (HONORIFIC_RE.test(given)) return null;
  if ((givenNameCounts.get(given.toLowerCase()) ?? 0) > 1) return null;
  return given;
}

function atSentenceStart(text: string, index: number): boolean {
  const before = text.slice(0, index);
  return !before.trim() || /[.!?]["”’)]?\s+$/.test(before);
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Article glue around painted labels. */
export function repairLabelArticles(prose: string, refs: LedgerRef[]): string {
  let next = (prose ?? '')
    .replace(/\b(the|a|an)\s+((?:[a-z][\w-]*\s+)?)The\s+/g, (_m, art: string, adj: string) => `${art} ${adj}`)
    .replace(/(\w)\s+(['’]s)\b/g, '$1$2');
  for (const ref of refs) {
    if (ref.klass !== 'person' && ref.klass !== 'companion') continue;
    const display = ref.display.trim();
    if (!/^[A-Z]/.test(display)) continue;
    next = next.replace(new RegExp(`\\b[Tt]he\\s+(${escRe(display)})\\b`, 'g'), (m, name: string, offset: number) =>
      atSentenceStart(next, offset) ? capitalize(name) : name
    );
  }
  return next;
}

/** Second and later mentions of a full ledger label in one beat take its short form. */
export function varyRepeatMentions(prose: string, refs: LedgerRef[]): string {
  let next = prose ?? '';
  if (!next.trim() || !refs.length) return next;
  const givenCounts = new Map<string, number>();
  for (const r of refs) {
    if (r.klass !== 'person' && r.klass !== 'companion') continue;
    const given = r.display.trim().split(/\s+/)[0]?.toLowerCase();
    if (given) givenCounts.set(given, (givenCounts.get(given) ?? 0) + 1);
  }
  const rows = [...refs].sort((a, b) => b.display.length - a.display.length);
  for (const ref of rows) {
    const isPlace = ref.klass === 'place';
    const isPerson = ref.klass === 'person' || ref.klass === 'companion';
    if (!isPlace && !isPerson) continue;
    const short = isPlace ? placeShortForm(ref.display) : personShortForm(ref.display, givenCounts);
    if (!short) continue;
    const core = isPlace ? ref.display.replace(/^(?:the|a|an)\s+/i, '').trim() : ref.display.trim();
    const re = new RegExp(`${isPlace ? '\\b(?:(?:the|a|an)\\s+)?' : '\\b'}${escRe(core)}\\b`, 'gi');
    let seen = 0;
    const source = next;
    next = source.replace(re, (m: string, offset: number) => {
      seen += 1;
      if (seen === 1) return m;
      return atSentenceStart(source, offset) ? capitalize(short) : short;
    });
  }
  return next;
}

export function polishMentions(prose: string, refs: LedgerRef[]): string {
  return varyRepeatMentions(repairLabelArticles(prose, refs), refs);
}
