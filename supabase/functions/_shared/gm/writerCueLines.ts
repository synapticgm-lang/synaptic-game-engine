/**
 * T10E — one shared shape for writer cue lines.
 * Built here for the writer (typedFreeText.clauseWriterFact); recognised and converted here for the
 * player-facing path (writerEngineResult / lastResortUsable / applyGovernanceToProse).
 * Writer still receives every cue; player-visible text never keeps cue chrome.
 * SRD 5.2.1 Communicating — brief speech is free; the engine does not invent the PC's line
 * (Wizards of the Coast, CC BY 4.0).
 *
 * T10P — Must narrate clauses convert to third-person act lines (never paste raw first-person).
 * Cue blocks are cut on cue headers, not on every ". ", so a period inside a clause cannot leak.
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
 * as one NPC (no reaction slot). When `presentHere` is supplied (including `[]` = alone), a named
 * who must be on that list or the cue is absence (T10P). Omitting the list keeps the legacy
 * named-slot behaviour for callers that only pass a who. Unnamed talk with people here addresses
 * them — never "empty scene" (T10M). Else empty-scene speech.
 */
export function speechAddressCue(who: string | null, presentHere?: string[] | null): string {
  if (who && isAggregatePersonToken(who)) {
    return `Speech event: you address ${who}. No one present to answer.`;
  }
  if (who) {
    if (presentHere != null) {
      const here = presentHere.map((n) => (n ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (!nameOnList(who, here)) {
        return `Speech event: you address ${who}. No one present to answer.`;
      }
    }
    return `Speech event: you address ${who}. NPC reaction slot open for ${who}.`;
  }
  const here = (presentHere ?? []).map((n) => (n ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (here.length === 1) {
    return `Speech event: you address ${here[0]}. NPC reaction slot open for ${here[0]}.`;
  }
  if (here.length > 1) {
    return `Speech event: you address the people here. NPC reaction slot open for the people here.`;
  }
  return `Speech event: you address the empty scene. No one present to answer.`;
}

function nameOnList(who: string, here: string[]): boolean {
  const w = who.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!w) return false;
  for (let i = 0; i < here.length; i++) {
    const h = here[i]!.toLowerCase();
    if (h === w || h.includes(w) || w.includes(h)) return true;
  }
  return false;
}

export function showActCue(): string {
  return 'The story must show this act.';
}

/** Writer-facing fact for one clause (same strings the player path later converts). */
export function buildClauseWriterFact(
  clause: string,
  speech: boolean,
  opts?: { said?: string; addressee?: string | null; presentHere?: string[] | null },
): string {
  const parts: string[] = [mustNarrateCue(clause)];
  const here = opts?.presentHere ?? null;
  if (speech) {
    const said = (opts?.said ?? '').replace(/\s+/g, ' ').trim();
    const who = opts?.addressee?.trim() || null;
    if (said) parts.push(pcSaysExactlyCue(said));
    parts.push(speechAddressCue(who, here));
  } else {
    const who = opts?.addressee?.trim() || null;
    // T10P — offering / holding out to a named person who is not here is absence, not a reaction.
    if (who && here != null && !nameOnList(who, here)) {
      parts.push(speechAddressCue(who, here));
    } else {
      parts.push(showActCue());
    }
  }
  return parts.join(' ');
}

/** First-person / bare imperative clause → one third-person sentence (fallback book body). */
export function clauseToThirdPerson(clause: string, subject = 'They'): string {
  let c = (clause ?? '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/g, '');
  if (!c) return '';
  const who = (subject || 'They').trim() || 'They';
  // Strip a leading I / I'm so we do not double the subject.
  c = c.replace(/^(?:I(?:'m| am)?|i)\s+/i, '');
  c = c
    .replace(/\bI'm\b/gi, `${who} is`)
    .replace(/\bI've\b/gi, `${who} have`)
    .replace(/\bI'll\b/gi, `${who} will`)
    .replace(/\bI\b/g, who)
    .replace(/\bmy\b/gi, 'their')
    .replace(/\bmine\b/gi, 'theirs')
    .replace(/\bme\b/gi, 'them');
  // Bare imperative / already third → "They faced the thugs."
  const body = c.charAt(0).toLowerCase() + c.slice(1);
  const line = `${who} ${body}`.replace(/\s+/g, ' ').trim();
  return line.endsWith('.') ? line : `${line}.`;
}

const CUE_HEAD =
  /(?:Must narrate:|PC says exactly:|Speech event:|The story must show this act\.?|NPC reaction slot open for |No one present to answer\.?)/gi;

/**
 * One sentence from writerEngineResult's ". "-split (legacy single-sentence path).
 * Prefer convertWriterCueFact for full engine facts (handles periods inside Must narrate).
 */
export function plainFromWriterCueSentence(s: string): { cue: true; plain: string } | { cue: false } {
  const raw = (s ?? '').trim();
  if (!raw) return { cue: false };
  const body = raw.endsWith('.') ? raw.slice(0, -1) : raw;

  if (body.startsWith('Must narrate:')) {
    const clause = body.slice('Must narrate:'.length).trim();
    return { cue: true, plain: clauseToThirdPerson(clause) };
  }
  if (/^The story must show this act$/i.test(body)) return { cue: true, plain: '' };
  if (/^No one present to answer$/i.test(body)) {
    return { cue: true, plain: 'No one was there to answer.' };
  }
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

/**
 * T10P — convert a full engine-fact string (may contain several cue clauses) to player prose.
 * Cuts on cue headers so a period inside "Must narrate: …" cannot leak as raw first-person.
 */
export function convertWriterCueFact(fact: string): string {
  const raw = (fact ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const out: string[] = [];
  let hadMustNarrate = false;
  let hadExactSay = false;
  let absentAnswer = false;

  const push = (plain: string) => {
    const p = (plain ?? '').replace(/\s+/g, ' ').trim();
    if (!p) return;
    out.push(p.endsWith('.') || p.endsWith('?') || p.endsWith('!') ? p : `${p}.`);
  };

  // Walk cue-headed spans; non-cue prose (Travel: / Fight: / roll lines) passes through.
  CUE_HEAD.lastIndex = 0;
  const hits: { index: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = CUE_HEAD.exec(raw)) != null) {
    hits.push({ index: m.index, text: m[0]! });
  }
  if (!hits.length) return raw;

  if (hits[0]!.index > 0) {
    const head = raw.slice(0, hits[0]!.index).trim().replace(/[.]+$/g, '');
    if (head) push(head.endsWith('.') ? head : `${head}.`);
  }

  for (let i = 0; i < hits.length; i++) {
    const start = hits[i]!.index;
    const end = i + 1 < hits.length ? hits[i + 1]!.index : raw.length;
    const span = raw.slice(start, end).trim();
    const head = hits[i]!.text;

    if (/^Must narrate:/i.test(head)) {
      const clause = span.slice(head.length).trim().replace(/[.]+$/g, '');
      // Drop a trailing "Speech event…" that was glued without its own hit (should not happen).
      const cut = clause.search(/\bSpeech event:|\bPC says exactly:|\bThe story must show/i);
      const body = (cut >= 0 ? clause.slice(0, cut) : clause).trim().replace(/[.]+$/g, '');
      if (body) {
        push(clauseToThirdPerson(body));
        hadMustNarrate = true;
      }
      continue;
    }
    if (/^PC says exactly:/i.test(head)) {
      const sayHead = 'PC says exactly: "';
      const sayTail = '" (do not rewrite)';
      const endQ = span.lastIndexOf(sayTail);
      if (span.toLowerCase().startsWith(sayHead.toLowerCase()) && endQ > sayHead.length) {
        push(`You said, "${span.slice(sayHead.length, endQ)}".`);
        hadExactSay = true;
      }
      continue;
    }
    if (/^Speech event:/i.test(head)) {
      const noOne = /No one present to answer/i.test(span);
      const whoMatch = span.match(/Speech event:\s*you address\s+(.+?)(?:\.|$)/i);
      const who = (whoMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();
      if (noOne) {
        absentAnswer = true;
        if (who && !/^the empty scene$/i.test(who)) {
          push(`${who} was not there to answer.`);
        } else {
          push('No one was there to answer.');
        }
        continue;
      }
      // Act already narrated from Must narrate, or exact say already painted — skip stub "You spoke".
      if (hadMustNarrate || hadExactSay) continue;
      if (who) push(`You spoke to ${who}.`);
      continue;
    }
    if (/^The story must show/i.test(head)) continue;
    if (/^NPC reaction slot open for /i.test(head)) continue;
    if (/^No one present to answer/i.test(head)) {
      if (!absentAnswer) push('No one was there to answer.');
      absentAnswer = true;
      continue;
    }
  }

  return out.join(' ').replace(/\s+/g, ' ').trim();
}
