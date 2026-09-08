/**
 * 02t / 02v / 02y — Slot / object glue.
 * Deixis and kit objects are not people. `the Across`, `open the stranger`,
 * and `Charter looks up` are grammar slots, not CAST. Named companions are
 * not take/push objects. Locked place titles are not body/kit objects.
 * No SNAPSHOT / CRAFT.
 */

import { isAtmospherePlaceName } from './questPlay.ts';
import { getRegisteredLocations } from './entityRegistry.ts';

const PERSON_VERB =
  '(?:looks?|stands?|says?|asks?|nods?|watches?|sits?|steps?|waits?|calls?|shifts?|answers?|speaks?|holds?|glances?|reads?)';

const OBJECT_TAKE = '(?:take|grab|push|pull|open)';

const PLACE_TITLE_STOP = new Set([
  'the', 'and', 'under', 'from', 'into', 'near', 'with', 'this', 'that',
  'your', 'over', 'road', 'street', 'place', 'at', 'of',
]);

const BODY_OR_KIT =
  '(?:hands?|hand|coat|chest|seal|lid|pocket|bag|pack|shoulders?|sleeve|collar|wrist)';

/** After `the <Name>`, legal person/prep grammar — not a slot noun. */
const AFTER_NAME_OK =
  /^(?:looks?|stands?|says?|asks?|nods?|watches?|sits?|steps?|waits?|calls?|shifts?|answers?|speaks?|holds?|glances?|from|with|and|who|that|then|still|here|there|beside|near|behind|after|before|into|onto|across|at|in|on|to|of|for|as|by|is|has|had|was|were)$/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isPlotObjectName(name: string): boolean {
  const t = (name ?? '').trim().replace(/^(the|a|an)\s+/i, '');
  return /^(charter|millstone)$/i.test(t);
}

/** Companions + present named people, plus first token ≥4 (`Wren Holt` → `Wren`). */
export function ledgerSlotPeople(state?: {
  companions?: Array<{ name?: string }>;
  sceneFacts?: { present?: string[] };
} | null): string[] {
  const out: string[] = [];
  const push = (raw?: string) => {
    const n = (raw ?? '').trim();
    if (n.length < 3) return;
    if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
    const first = n.split(/\s+/)[0] ?? '';
    if (first.length >= 4 && !out.some((x) => x.toLowerCase() === first.toLowerCase())) {
      out.push(first);
    }
  };
  for (const c of state?.companions ?? []) push(c.name);
  for (const p of state?.sceneFacts?.present ?? []) push(p);
  return out;
}

/** `take the Wren Holt` / `the Dusk lane` — companion stuffed into an object slot. */
export function isCompanionObjectGlue(text: string, names: string[] = []): boolean {
  const t = text ?? '';
  if (!t.trim() || !names.length) return false;
  for (const name of names) {
    const esc = escapeRe(name);
    if (new RegExp(`\\b${OBJECT_TAKE}\\s+the\\s+${esc}\\b`, 'i').test(t)) return true;
    const adj = t.match(new RegExp(`\\bthe\\s+${esc}\\s+([a-z]{3,})\\b`));
    if (adj?.[1] && !AFTER_NAME_OK.test(adj[1])) return true;
  }
  return false;
}

/** Distinctive tokens from a ledger place title — not a Sevenfold deny list. */
export function placeTitleNeedles(name: string | undefined | null): string[] {
  const raw = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || raw.length < 3) return [];
  const out: string[] = [];
  const push = (s: string) => {
    const n = s.replace(/\s+/g, ' ').trim();
    if (n.length < 3) return;
    if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
  };
  push(raw);
  const bare = raw.replace(/^(the|a|an)\s+/i, '');
  push(bare);
  if (bare.length >= 4) push(`The ${bare}`);
  if (bare.length >= 3) push(`At ${bare}`);
  for (const w of bare.split(/\s+/)) {
    const tok = w.replace(/[^A-Za-z'-]/g, '');
    if (tok.length >= 6 && !PLACE_TITLE_STOP.has(tok.toLowerCase())) push(tok);
    if (tok.length >= 6) push(`The ${tok}`);
  }
  return out;
}

export function ledgerPlaceTitles(state?: {
  currentLocation?: string;
  previousLocationSheet?: { name?: string } | null;
  locationSheet?: { name?: string } | null;
  openingEstablishment?: { answers?: { where?: string } } | null;
  places?: Array<{ name?: string; loreName?: string; aliases?: string[] }>;
  worldAtlas?: { settlements?: Array<{ name?: string }> } | null;
  bibleId?: string | null;
  campaignBibleId?: string | null;
} | null): string[] {
  const out: string[] = [];
  const add = (raw?: string | null) => {
    for (const n of placeTitleNeedles(raw)) {
      if (!out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
    }
  };
  add(state?.currentLocation);
  add(state?.locationSheet?.name);
  add(state?.previousLocationSheet?.name);
  add(state?.openingEstablishment?.answers?.where);
  add((state as { sceneFacts?: { cameraLock?: { label?: string } } } | null)?.sceneFacts?.cameraLock?.label);
  for (const p of state?.places ?? []) {
    add(p.name);
    add(p.loreName);
    for (const a of p.aliases ?? []) add(a);
  }
  for (const s of state?.worldAtlas?.settlements ?? []) add(s.name);
  for (const loc of getRegisteredLocations(state?.bibleId ?? state?.campaignBibleId)) add(loc);
  return out;
}

/** `take The Sevenfold hands` / `open your The Sevenfold` — place title stuffed into an object slot. */
export function isPlaceTitleObjectGlue(text: string, placeTitles: string[] = []): boolean {
  const t = text ?? '';
  if (!t.trim() || !placeTitles.length) return false;
  for (const title of placeTitles) {
    if (isAtmospherePlaceName(title)) continue;
    const esc = escapeRe(title);
    if (new RegExp(`\\b${OBJECT_TAKE}\\s+(?:your\\s+)?(?:the\\s+)?${esc}\\s+${BODY_OR_KIT}\\b`, 'i').test(t)) {
      return true;
    }
    if (new RegExp(`\\b(?:open|take|grab)\\s+your\\s+(?:the\\s+)?${esc}\\b`, 'i').test(t)) {
      return true;
    }
    const adj = t.match(new RegExp(`\\b(?:the|your)\\s+${esc}\\s+([a-z]{3,})\\b`, 'i'));
    if (adj?.[1] && new RegExp(`^${BODY_OR_KIT}$`, 'i').test(adj[1])) return true;
  }
  return false;
}

export function isSlotGlueViolation(
  text: string,
  namedPeople: string[] = [],
  placeTitles: string[] = []
): boolean {
  const t = text ?? '';
  if (!t.trim()) return false;
  if (/\bthe\s+Across\b/.test(t)) return true;
  if (/\bAcross\s+and\b/.test(t)) return true;
  if (/\bthe\s+Strangers\b/.test(t)) return true;
  if (/\bopen(?:s|ed|ing)?\s+the\s+stranger\b/i.test(t)) return true;
  if (/\bgroans\s+open\s+the\s+stranger\b/i.test(t)) return true;
  if (new RegExp(`\\bCharter\\s+${PERSON_VERB}\\b`).test(t)) return true;
  if (/\bthe\s+stranger\s+call\b/i.test(t)) return true;
  if (/\b(?:examine|inspect|study|tip|nod(?:s)?\s+toward)\s+the\s+(?:Brother|Sister|Father|Mother|Captain)\s+[A-Z][a-z'-]+\b/i.test(t)) {
    return true;
  }
  if (isCompanionObjectGlue(t, namedPeople)) return true;
  if (isPlaceTitleObjectGlue(t, placeTitles)) return true;
  if (isPlaceTitleAsPersonSubject(t, placeTitles)) return true;
  return false;
}

/** Ledger title used as a person subject / possessor — not a place adverbial. */
export function isPlaceTitleAsPersonSubject(text: string, placeTitles: string[] = []): boolean {
  const t = text ?? '';
  if (!t.trim() || !placeTitles.length) return false;
  for (const title of placeTitles) {
    if (isAtmospherePlaceName(title)) continue;
    const esc = escapeRe(title);
    if (new RegExp(`\\b${esc}['’]s\\s+(?:${PERSON_VERB}|eyes?|fingers?|voice|jaw|hand|hands|gaze)\\b`, 'i').test(t)) {
      return true;
    }
    if (new RegExp(`\\b${esc}\\s+${PERSON_VERB}\\b`, 'i').test(t)) return true;
  }
  return false;
}

export function isObjectPersonPad(choice: string, namedPeople: string[] = []): boolean {
  const c = choice ?? '';
  if (/\b(?:talk(?:\s+to)?|ask|meet|press)\s+(?:the\s+)?charter\b/i.test(c)) return true;
  for (const name of namedPeople) {
    const esc = escapeRe(name);
    if (new RegExp(`\\b${OBJECT_TAKE}\\s+(?:the\\s+)?${esc}\\b`, 'i').test(c)) return true;
  }
  return false;
}

export function isPlaceTitleTalkPad(choice: string, placeTitles: string[] = []): boolean {
  const c = (choice ?? '').trim();
  if (!c || !placeTitles.length) return false;
  const m = c.match(/\b(?:talk(?:\s+to)?|ask|meet|press)\s+(?:the\s+)?(.+)$/i);
  if (!m?.[1]) return false;
  const target = m[1].replace(/\s+/g, ' ').trim().toLowerCase();
  return placeTitles.some((title) => {
    const n = title.toLowerCase();
    return n === target || target === `the ${n}` || target.endsWith(n);
  });
}

/** 02u — "no one" conjugated into a fake noun/adjective. Legal "no one else" stays. */
export function isNobodyInflectionSalad(text: string): boolean {
  const t = text ?? '';
  if (!t.trim()) return false;
  return /\bno\s+oneed\b/i.test(t) || /\bno\s+ones\b/i.test(t) || /\bno\s+oneked\b/i.test(t);
}

export function scrubNobodyInflection(text: string): string {
  let next = text ?? '';
  if (!next) return next;
  next = next.replace(/\bno\s+oneed\b/gi, 'empty');
  next = next.replace(/\bno\s+oneked\b/gi, '');
  next = next.replace(/\bthe\s+no\s+ones\b/gi, 'the lanes');
  next = next.replace(/\bno\s+ones\b/gi, 'lanes');
  next = next.replace(/\bin the no one\b/gi, 'in the lane');
  return next.replace(/\s{2,}/g, ' ').trim();
}

export function scrubSlotGlue(
  text: string,
  namedPeople: string[] = [],
  placeTitles: string[] = []
): string {
  let next = text ?? '';
  if (!next) return next;
  next = next.replace(/\bthe\s+Across\b/g, 'the far side');
  next = next.replace(/\bAcross\s+and\b/g, 'Someone nearby and');
  next = next.replace(/\bthe\s+Strangers\b/g, 'the group');
  next = next.replace(/\bgroans\s+open\s+the\s+stranger\b/gi, 'groans open');
  next = next.replace(/\bopen(?:s|ed|ing)?\s+the\s+stranger\b/gi, 'open');
  next = next.replace(new RegExp(`\\bCharter\\s+(${PERSON_VERB})\\b`, 'g'), 'Someone $1');
  next = next.replace(/\bthe\s+stranger\s+call\b/gi, 'they call');
  next = next.replace(
    /\b((?:examine|inspect|study|tip|nod(?:s)?\s+toward)\s+)the\s+((?:Brother|Sister|Father|Mother|Captain)\s+[A-Z][a-z'-]+)\b/gi,
    '$1$2'
  );
  for (const name of namedPeople) {
    const esc = escapeRe(name);
    next = next.replace(new RegExp(`\\b(${OBJECT_TAKE}\\s+)the\\s+${esc}\\b`, 'gi'), '$1');
    next = next.replace(
      new RegExp(`\\bthe\\s+${esc}\\s+([a-z]{3,})\\b`, 'g'),
      (full, word: string) => (AFTER_NAME_OK.test(word) ? full : `the ${word}`)
    );
  }
  for (const title of placeTitles) {
    const esc = escapeRe(title);
    next = next.replace(
      new RegExp(`\\b${esc}['’]s\\s+(${PERSON_VERB}|eyes?|fingers?|voice|jaw|hand|hands|gaze)\\b`, 'gi'),
      'Someone nearby $1'
    );
    next = next.replace(new RegExp(`\\b${esc}\\s+(${PERSON_VERB})\\b`, 'gi'), 'Someone nearby $1');
    next = next.replace(
      new RegExp(`\\b(${OBJECT_TAKE}\\s+)(?:your\\s+)?(?:the\\s+)?${esc}\\s+(${BODY_OR_KIT})\\b`, 'gi'),
      '$1the $2'
    );
    next = next.replace(
      new RegExp(`\\b((?:open|take|grab)\\s+)your\\s+(?:the\\s+)?${esc}\\b`, 'gi'),
      '$1'
    );
  }
  next = scrubNobodyInflection(next);
  return next.replace(/\s{2,}/g, ' ').trim();
}
