import type { LogEntry } from './types';

/** End-of-turn ask. Never a reply to a command the player already sent. */
export const TURN_ASK = 'What do you do?';

const TURN_CLOSER_LINE =
  /^(?:\*{0,2}|_{0,2}|["'«]*)(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?\s*(?:\*{0,2}|_{0,2}|["'»]*)\s*$/i;

const TURN_CLOSER_TRAILING =
  /(?:\n|\s)+(?:\*{0,2}|_{0,2})?(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?\s*(?:\*{0,2}|_{0,2})?\s*$/i;

export function isTurnCloserLine(line: string): boolean {
  return TURN_CLOSER_LINE.test(line.trim());
}

/** Remove a trailing "What do you do?" closer without touching story that merely mentions acting. */
export function stripTurnCloser(text: string): string {
  if (!text) return text;
  let next = text.trimEnd();
  while (TURN_CLOSER_TRAILING.test(next) || TURN_CLOSER_LINE.test(next.trim())) {
    const before = next;
    next = next.replace(TURN_CLOSER_TRAILING, '').trimEnd();
    if (TURN_CLOSER_LINE.test(next.trim())) next = '';
    if (next === before) break;
  }
  return next.trim();
}

export function gmStoryText(entry: LogEntry | undefined): string {
  if (!entry) return '';
  const fromPanels = (entry.panels ?? []).map((p) => p.narrative ?? '').join(' ');
  return stripTurnCloser(`${entry.content ?? ''}\n${fromPanels}`)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasRealGmStory(entry: LogEntry | undefined): boolean {
  const story = gmStoryText(entry);
  return story.length >= 24 && /[a-z]/i.test(story);
}

function isHiddenGmRow(entry: LogEntry): boolean {
  return (
    entry.role === 'gm'
    && entry.entryKind !== 'milestone'
    && entry.mediaKind !== 'video'
    && !hasRealGmStory(entry)
    && !(entry.systemLog && entry.systemLog.length > 0)
  );
}

/** Hide a second player bubble when only an empty/hidden GM sits between identical sends. */
export function shouldSkipDuplicatePlayerBubble(log: LogEntry[], index: number): boolean {
  const entry = log[index];
  if (!entry || entry.role !== 'player') return false;
  const text = entry.content.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!text) return false;
  for (let i = index - 1; i >= 0; i--) {
    const prev = log[i];
    if (prev.role === 'system' || isHiddenGmRow(prev)) continue;
    if (prev.role === 'player') {
      return prev.content.replace(/\s+/g, ' ').trim().toLowerCase() === text;
    }
    return false;
  }
  return false;
}

/** True when stripped GM prose is enough to show as a turn (not System-only). */
export function storyHasBody(text: string | undefined): boolean {
  const story = stripTurnCloser(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return story.length >= 24 && /[a-z]/i.test(story);
}

/**
 * Show the ask only after a real GM beat that still has no player reply.
 * Never show it under a command they just sent, on an empty/closer-only GM row,
 * or while the world is still resolving.
 */
export function shouldShowTurnAsk(log: LogEntry[], index: number, busy: boolean): boolean {
  const entry = log[index];
  if (!entry || entry.role !== 'gm') return false;
  if (entry.entryKind === 'milestone' || entry.mediaKind === 'video') return false;
  if (busy) return false;
  if (!hasRealGmStory(entry)) return false;
  for (let i = index + 1; i < log.length; i++) {
    const role = log[i].role;
    if (role === 'player' || role === 'gm') return false;
  }
  return true;
}
