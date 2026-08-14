import type { LogEntry } from './types';

/** End-of-turn ask. Never a reply to a command the player already sent. */
export const TURN_ASK = 'What do you do?';

const TURN_CLOSER_LINE =
  /^(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?\s*$/i;

const TURN_CLOSER_TRAILING =
  /(?:\n|\s)+(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?\s*$/i;

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

/**
 * Show the ask only on the latest unanswered GM beat (after story + System log).
 * Hide it once a player message follows, while the world is still resolving, or on
 * superseded GM turns — otherwise it reads as a fake extra GM line under the command.
 */
export function shouldShowTurnAsk(log: LogEntry[], index: number, busy: boolean): boolean {
  const entry = log[index];
  if (!entry || entry.role !== 'gm') return false;
  if (entry.entryKind === 'milestone' || entry.mediaKind === 'video') return false;
  if (busy) return false;
  for (let i = index + 1; i < log.length; i++) {
    const role = log[i].role;
    if (role === 'player' || role === 'gm') return false;
  }
  return true;
}
