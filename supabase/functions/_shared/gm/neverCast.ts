/**
 * 02aa — Never-CAST lock.
 * Ledger place / concept titles are never people: not present[], not CAST,
 * not Talk/Ask targets, not person-subjects in prose.
 * Titles come from HERE / hubs / atlas / pins / hooks / quests / lore — not a
 * novel Gemini token list.
 */

import { getRegisteredLocations } from './entityRegistry.ts';
import { ledgerPlaceTitles, placeTitleNeedles } from './slotGlue.ts';

const PERSON_SUBJECT_VERB =
  '(?:looks?|stands?|says?|asks?|nods?|watches?|sits?|steps?|waits?|calls?|shifts?|answers?|speaks?|holds?|glances?|reads?|doesn\'t|does not|jaw|voice|eyes|fingers|hand|hands|gaze)';

const ARTICLE_OR_PREP = /^(?:the|a|an|at|in|on|from|into|near|under|over|to)\s+/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pushUnique(out: string[], raw?: string | null): void {
  const n = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (n.length < 3) return;
  if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
}

/** Extra concept titles from hooks / quests / lore / props — still ledger, not quotes. */
export function ledgerConceptTitles(state?: {
  lorebook?: Array<{ name?: string; type?: string }>;
  quests?: Array<{ name?: string }>;
  openingEstablishment?: { pickedHook?: string; answers?: { where?: string } } | null;
  sceneFacts?: { props?: string[]; hookLock?: { summary?: string } } | null;
} | null): string[] {
  const out: string[] = [];
  const add = (raw?: string | null) => {
    for (const n of placeTitleNeedles(raw)) pushUnique(out, n);
    const bare = (raw ?? '').replace(/\s+/g, ' ').trim().replace(ARTICLE_OR_PREP, '');
    const parts = bare.split(/\s+/).filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    if (parts.length >= 2 && last.length >= 4) {
      pushUnique(out, last);
      pushUnique(out, `The ${last}`);
    }
  };
  for (const card of state?.lorebook ?? []) {
    if (card.type === 'npc') continue;
    add(card.name);
  }
  for (const q of state?.quests ?? []) add(q.name);
  add(state?.openingEstablishment?.pickedHook);
  add(state?.sceneFacts?.hookLock?.summary);
  for (const p of state?.sceneFacts?.props ?? []) add(p);
  return out;
}

export function ledgerNeverCastTitles(state?: Parameters<typeof ledgerPlaceTitles>[0] & {
  sceneFacts?: {
    cameraLock?: { label?: string } | null;
    props?: string[];
    hookLock?: { summary?: string };
  } | null;
  lorebook?: Array<{ name?: string; type?: string }>;
  quests?: Array<{ name?: string }>;
  openingEstablishment?: { pickedHook?: string; answers?: { where?: string } } | null;
} | null): string[] {
  const out: string[] = [];
  const add = (raw?: string | null) => {
    for (const n of placeTitleNeedles(raw)) pushUnique(out, n);
    const bare = (raw ?? '').replace(/\s+/g, ' ').trim().replace(ARTICLE_OR_PREP, '');
    if (bare.length >= 3) {
      pushUnique(out, `At ${bare}`);
      pushUnique(out, `In ${bare}`);
    }
  };
  for (const n of ledgerPlaceTitles(state)) pushUnique(out, n);
  add(state?.sceneFacts?.cameraLock?.label);
  for (const n of ledgerConceptTitles(state)) pushUnique(out, n);
  return out;
}

export function isNeverCastTitle(
  name: string,
  state?: Parameters<typeof ledgerNeverCastTitles>[0] | null
): boolean {
  const t = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!t || t.length < 3) return false;
  const titles = ledgerNeverCastTitles(state);
  const folded = t.toLowerCase();
  const bare = t.replace(ARTICLE_OR_PREP, '').toLowerCase();
  for (const title of titles) {
    const n = title.toLowerCase();
    if (n === folded || n === bare) return true;
    if (folded === `the ${n}` || folded === `at ${n}` || folded === `in ${n}`) return true;
  }
  return false;
}

/** `Scattered Scale shifts` / `The Mark's eyes` / `At Saltmeet watches`. */
export function isPlaceTitlePersonSubject(text: string, titles: string[] = []): boolean {
  const t = text ?? '';
  if (!t.trim() || !titles.length) return false;
  for (const title of titles) {
    const esc = escapeRe(title);
    if (new RegExp(`\\b${esc}['’]s\\s+(?:${PERSON_SUBJECT_VERB})\\b`, 'i').test(t)) return true;
    if (new RegExp(`\\b${esc}\\s+${PERSON_SUBJECT_VERB}\\b`, 'i').test(t)) return true;
  }
  return false;
}

export function isPlaceTitleTalkPad(choice: string, titles: string[] = []): boolean {
  const c = (choice ?? '').trim();
  if (!c || !titles.length) return false;
  const m = c.match(/\b(?:talk(?:\s+to)?|ask|meet|press)\s+(?:the\s+)?(.+)$/i);
  if (!m?.[1]) return false;
  const target = m[1].replace(/\s+/g, ' ').trim();
  const folded = target.toLowerCase();
  return titles.some((title) => {
    const n = title.toLowerCase();
    return n === folded || folded === `the ${n}` || folded.endsWith(n);
  });
}

/** Registered location needles without a full GameState (harvest / CAST). */
export function matchesRegisteredLocationNeedle(name: string, bibleId?: string | null): boolean {
  const t = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  const folded = t.toLowerCase();
  const bare = t.replace(ARTICLE_OR_PREP, '').toLowerCase();
  for (const loc of getRegisteredLocations(bibleId)) {
    if (loc.toLowerCase() === folded || loc.toLowerCase() === bare) return true;
    for (const n of placeTitleNeedles(loc)) {
      if (n.toLowerCase() === folded || n.toLowerCase() === bare) return true;
    }
  }
  return false;
}
