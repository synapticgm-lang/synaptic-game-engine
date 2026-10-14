/**
 * Player-typed names → the people, items and places the game already knows (Fuse.js, Apache-2.0).
 * Exact whole-word wins; the fuzzy pass only forgives a typo in a word of four letters or more that
 * starts with the same letter, so "a", "i" or "talk" never become somebody.
 */

import Fuse from 'fuse.js';

const STOP = new Set([
  'about', 'after', 'again', 'there', 'their', 'them', 'they', 'this', 'that', 'what', 'when', 'where',
  'which', 'while', 'with', 'from', 'into', 'onto', 'over', 'your', 'have', 'here', 'just', 'tell',
  'talk', 'speak', 'greet', 'listen', 'travel', 'toward', 'towards', 'back', 'head', 'walk',
  'move', 'return', 'going', 'want', 'need', 'look', 'around', 'please', 'does', 'will', 'would',
  'could', 'should', 'some', 'else', 'then', 'than', 'very', 'know', 'name',
]);

const MIN_FUZZY = 4;
const THRESHOLD = 0.3;

interface Part {
  part: string;
  candidate: string;
}

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? []).map((w) => w.replace(/'s$/, ''));
}

function partsOf(candidates: string[]): Part[] {
  const out: Part[] = [];
  for (const candidate of candidates) {
    const label = (candidate ?? '').trim();
    if (!label) continue;
    for (const part of new Set(words(label))) {
      if (part.length >= 3) out.push({ part, candidate: label });
    }
  }
  return out;
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A known name (or one of its words) typed as a whole word. */
export function exactTypedName(typed: string, candidates: string[]): string | null {
  const said = ` ${words(typed).join(' ')} `;
  for (const candidate of candidates) {
    const label = (candidate ?? '').trim();
    if (!label) continue;
    const full = words(label).join(' ');
    if (full && new RegExp(` ${esc(full)} `).test(said)) return label;
  }
  for (const { part, candidate } of partsOf(candidates)) {
    if (new RegExp(` ${esc(part)} `).test(said)) return candidate;
  }
  return null;
}

function fuzzyWord(word: string, fuse: Fuse<Part>): { candidate: string; score: number } | null {
  if (word.length < MIN_FUZZY || STOP.has(word)) return null;
  const hit = fuse
    .search(word)
    .find((r) => r.item.part[0] === word[0] && Math.abs(r.item.part.length - word.length) <= 2 && r.item.part.length >= MIN_FUZZY);
  return hit ? { candidate: hit.item.candidate, score: hit.score ?? 1 } : null;
}

function fuseOver(candidates: string[]): Fuse<Part> | null {
  const parts = partsOf(candidates);
  if (!parts.length) return null;
  return new Fuse(parts, { keys: ['part'], includeScore: true, ignoreLocation: true, threshold: THRESHOLD });
}

/** Any word in a sentence ("ask silus about the key") that is a near-miss for a known name. */
export function fuzzyTypedName(typed: string, candidates: string[]): string | null {
  const fuse = fuseOver(candidates);
  if (!fuse) return null;
  let best: { candidate: string; score: number } | null = null;
  for (const w of words(typed)) {
    const hit = fuzzyWord(w, fuse);
    if (hit && (!best || hit.score < best.score)) best = hit;
  }
  return best?.candidate ?? null;
}

/** The whole phrase is the name ("rusty dager"): every word that counts must land on the same candidate. */
export function fuzzyTypedPhrase(typed: string, candidates: string[]): string | null {
  const ws = words(typed).filter((w) => !STOP.has(w) && w !== 'the' && w !== 'a' && w !== 'an');
  if (!ws.length) return null;
  for (const candidate of candidates) {
    const label = (candidate ?? '').trim();
    if (!label) continue;
    const own = words(label);
    const fuse = fuseOver([label]);
    if (!fuse) continue;
    if (ws.every((w) => own.includes(w) || fuzzyWord(w, fuse) != null)) return label;
  }
  return null;
}

/** Exact first, then a forgiven typo. */
export function matchTypedName(typed: string, candidates: string[]): string | null {
  return exactTypedName(typed, candidates) ?? fuzzyTypedName(typed, candidates);
}
