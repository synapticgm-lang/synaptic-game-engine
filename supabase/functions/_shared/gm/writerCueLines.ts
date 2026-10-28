/**
 * T10E — one shared shape for writer cue lines.
 * Built here for the writer (typedFreeText.clauseWriterFact); recognised and converted here for the
 * player-facing path (writerEngineResult / lastResortUsable / applyGovernanceToProse).
 * Writer still receives every cue; player-visible text never keeps cue chrome.
 * SRD 5.2.1 Communicating — brief speech is free; the engine does not invent the PC's line
 * (Wizards of the Coast, CC BY 4.0).
 */

import { isAggregatePersonToken } from './chromeAuthority.ts';

/** Chrome that must never appear on the player book. */
export const WRITER_CUE_CHROME =
  /Must narrate|PC says exactly|Speech event|reaction slot|No one present to answer|The story must show/i;

export function hasWriterCueChrome(text: string): boolean {
  return WRITER_CUE_CHROME.test(text ?? '');
}

export function mustNarrateCue(clause: string): string {
  return `Must narrate: ${clause}.`;
}

export function pcSaysExactlyCue(said: string): string {
  return `PC says exactly: "${said}" (do not rewrite).`;
}

/**
 * Present named addressee → reaction slot. Crowd/aggregate labels are addressed but do not speak
 * as one NPC (no reaction slot). Else empty-scene speech.
 */
export function speechAddressCue(who: string | null): string {
  if (who && isAggregatePersonToken(who)) {
    return `Speech event: you address ${who}. No one present to answer.`;
  }
  if (who) return `Speech event: you address ${who}. NPC reaction slot open for ${who}.`;
  return `Speech event: you address the empty scene. No one present to answer.`;
}

export function showActCue(): string {
  return 'The story must show this act.';
}

/** Writer-facing fact for one clause (same strings the player path later converts). */
export function buildClauseWriterFact(
  clause: string,
  speech: boolean,
  opts?: { said?: string; addressee?: string | null },
): string {
  const parts: string[] = [mustNarrateCue(clause)];
  if (speech) {
    const said = (opts?.said ?? '').replace(/\s+/g, ' ').trim();
    const who = opts?.addressee?.trim() || null;
    if (said) parts.push(pcSaysExactlyCue(said));
    parts.push(speechAddressCue(who));
  } else {
    parts.push(showActCue());
  }
  return parts.join(' ');
}

/**
 * One sentence from writerEngineResult's ". "-split.
 * Returns { cue: true, plain } when this sentence is cue chrome (plain may be '' to drop);
 * { cue: false } when it is ordinary story/receipt text.
 */
export function plainFromWriterCueSentence(s: string): { cue: true; plain: string } | { cue: false } {
  const raw = (s ?? '').trim();
  if (!raw) return { cue: false };
  const body = raw.endsWith('.') ? raw.slice(0, -1) : raw;

  if (body.startsWith('Must narrate:')) return { cue: true, plain: '' };
  if (/^The story must show this act$/i.test(body)) return { cue: true, plain: '' };
  if (/^No one present to answer$/i.test(body)) return { cue: true, plain: '' };
  if (/^NPC reaction slot open for /i.test(body)) return { cue: true, plain: '' };

  const sayHead = 'PC says exactly: "';
  const sayTail = '" (do not rewrite)';
  if (body.startsWith(sayHead)) {
    const end = body.lastIndexOf(sayTail);
    if (end > sayHead.length) {
      return { cue: true, plain: `You said, "${body.slice(sayHead.length, end)}".` };
    }
    return { cue: true, plain: '' };
  }

  const speechHead = 'Speech event: you address ';
  if (body.startsWith(speechHead)) {
    const who = body.slice(speechHead.length).trim();
    return { cue: true, plain: who ? `You spoke to ${who}.` : '' };
  }

  return { cue: false };
}
