/**
 * 02t — Slot / object glue.
 * Deixis and kit objects are not people. `the Across`, `open the stranger`,
 * and `Charter looks up` are grammar slots, not CAST. No SNAPSHOT / CRAFT.
 */

const PERSON_VERB =
  '(?:looks?|stands?|says?|asks?|nods?|watches?|sits?|steps?|waits?|calls?)';

export function isPlotObjectName(name: string): boolean {
  const t = (name ?? '').trim().replace(/^(the|a|an)\s+/i, '');
  return /^(charter|millstone)$/i.test(t);
}

export function isSlotGlueViolation(text: string): boolean {
  const t = text ?? '';
  if (!t.trim()) return false;
  if (/\bthe\s+Across\b/.test(t)) return true;
  if (/\bAcross\s+and\b/.test(t)) return true;
  if (/\bthe\s+Strangers\b/.test(t)) return true;
  if (/\bopen(?:s|ed|ing)?\s+the\s+stranger\b/i.test(t)) return true;
  if (/\bgroans\s+open\s+the\s+stranger\b/i.test(t)) return true;
  if (new RegExp(`\\bCharter\\s+${PERSON_VERB}\\b`).test(t)) return true;
  if (/\bthe\s+stranger\s+call\b/i.test(t)) return true;
  return false;
}

export function isObjectPersonPad(choice: string): boolean {
  return /\b(?:talk(?:\s+to)?|ask|meet|press)\s+(?:the\s+)?charter\b/i.test(choice ?? '');
}

export function scrubSlotGlue(text: string): string {
  let next = text ?? '';
  if (!next) return next;
  next = next.replace(/\bthe\s+Across\b/g, 'the far side');
  next = next.replace(/\bAcross\s+and\b/g, 'Someone nearby and');
  next = next.replace(/\bthe\s+Strangers\b/g, 'the group');
  next = next.replace(/\bgroans\s+open\s+the\s+stranger\b/gi, 'groans open');
  next = next.replace(/\bopen(?:s|ed|ing)?\s+the\s+stranger\b/gi, 'open');
  next = next.replace(new RegExp(`\\bCharter\\s+(${PERSON_VERB})\\b`, 'g'), 'Someone $1');
  next = next.replace(/\bthe\s+stranger\s+call\b/gi, 'they call');
  return next.replace(/\s{2,}/g, ' ').trim();
}
