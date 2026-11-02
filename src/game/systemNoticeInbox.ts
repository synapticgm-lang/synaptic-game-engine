/**
 * XP-D1 OPEN3 — Check System notice stack (LitRPG / Story RPG).
 * Engine-owned unread inbox: not a scene-choice chip, never costs a turn or XP.
 * STATUS may hide XP lines (housing); the inbox still receives notification lines.
 */
import type { EngineMode, GameState } from './types';
import {
  deriveSystemNotifications,
  usesSystemNoticeChip,
} from './systemNotice';

export interface SystemNoticeInbox {
  /** Unopened notification count (badge). */
  unread: number;
  /** Presented lines waiting / recently stacked (newest last). */
  lines: string[];
}

export function emptySystemNoticeInbox(): SystemNoticeInbox {
  return { unread: 0, lines: [] };
}

export function systemNoticeInboxOf(state: GameState | undefined | null): SystemNoticeInbox {
  const inbox = state?.systemNoticeInbox;
  if (!inbox) return emptySystemNoticeInbox();
  return {
    unread: Math.max(0, Math.floor(inbox.unread ?? 0)),
    lines: Array.isArray(inbox.lines) ? inbox.lines.slice(-40) : [],
  };
}

/**
 * Append notification lines derived from this turn's STATUS / XP notes.
 * No-op for tabletop / PYOA. Opening never changes XP.
 */
export function appendSystemNotices(
  state: GameState,
  rawLines: string[],
  engineMode: EngineMode | undefined = state.engineMode
): GameState {
  if (!usesSystemNoticeChip(engineMode)) return state;
  const derived = deriveSystemNotifications(rawLines, engineMode);
  if (!derived.length) return state;
  const prev = systemNoticeInboxOf(state);
  const seen = new Set(prev.lines.map((l) => l.replace(/\s+/g, ' ').trim().toLowerCase()));
  const added: string[] = [];
  for (const line of derived) {
    const key = line.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    added.push(line);
  }
  if (!added.length) return state;
  const lines = [...prev.lines, ...added].slice(-40);
  return {
    ...state,
    systemNoticeInbox: {
      unread: prev.unread + added.length,
      lines,
    },
  };
}

/** Open / dismiss the Check System panel — clears unread; keeps history lines. Free action. */
export function openSystemNotices(state: GameState): GameState {
  const prev = systemNoticeInboxOf(state);
  if (prev.unread <= 0 && !prev.lines.length) {
    return { ...state, systemNoticeInbox: emptySystemNoticeInbox() };
  }
  return {
    ...state,
    systemNoticeInbox: { unread: 0, lines: prev.lines },
  };
}

export function unopenedSystemNotices(state: GameState | undefined | null): number {
  return systemNoticeInboxOf(state).unread;
}

export function checkSystemOffered(state: GameState | undefined | null): boolean {
  return unopenedSystemNotices(state) > 0;
}
