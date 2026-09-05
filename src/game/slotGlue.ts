/**
 * 02t / 02v — Slot / object glue.
 * Deixis and kit objects are not people. `the Across`, `open the stranger`,
 * and `Charter looks up` are grammar slots, not CAST. Named companions are
 * not take/push objects. No SNAPSHOT / CRAFT.
 */

const PERSON_VERB =
  '(?:looks?|stands?|says?|asks?|nods?|watches?|sits?|steps?|waits?|calls?)';

const OBJECT_TAKE = '(?:take|grab|push|pull)';

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

export function isSlotGlueViolation(text: string, namedPeople: string[] = []): boolean {
  const t = text ?? '';
  if (!t.trim()) return false;
  if (/\bthe\s+Across\b/.test(t)) return true;
  if (/\bAcross\s+and\b/.test(t)) return true;
  if (/\bthe\s+Strangers\b/.test(t)) return true;
  if (/\bopen(?:s|ed|ing)?\s+the\s+stranger\b/i.test(t)) return true;
  if (/\bgroans\s+open\s+the\s+stranger\b/i.test(t)) return true;
  if (new RegExp(`\\bCharter\\s+${PERSON_VERB}\\b`).test(t)) return true;
  if (/\bthe\s+stranger\s+call\b/i.test(t)) return true;
  if (isCompanionObjectGlue(t, namedPeople)) return true;
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

export function scrubSlotGlue(text: string, namedPeople: string[] = []): string {
  let next = text ?? '';
  if (!next) return next;
  next = next.replace(/\bthe\s+Across\b/g, 'the far side');
  next = next.replace(/\bAcross\s+and\b/g, 'Someone nearby and');
  next = next.replace(/\bthe\s+Strangers\b/g, 'the group');
  next = next.replace(/\bgroans\s+open\s+the\s+stranger\b/gi, 'groans open');
  next = next.replace(/\bopen(?:s|ed|ing)?\s+the\s+stranger\b/gi, 'open');
  next = next.replace(new RegExp(`\\bCharter\\s+(${PERSON_VERB})\\b`, 'g'), 'Someone $1');
  next = next.replace(/\bthe\s+stranger\s+call\b/gi, 'they call');
  for (const name of namedPeople) {
    const esc = escapeRe(name);
    next = next.replace(new RegExp(`\\b(${OBJECT_TAKE}\\s+)the\\s+${esc}\\b`, 'gi'), '$1');
    next = next.replace(
      new RegExp(`\\bthe\\s+${esc}\\s+([a-z]{3,})\\b`, 'g'),
      (full, word: string) => (AFTER_NAME_OK.test(word) ? full : `the ${word}`)
    );
  }
  next = scrubNobodyInflection(next);
  return next.replace(/\s{2,}/g, ' ').trim();
}
