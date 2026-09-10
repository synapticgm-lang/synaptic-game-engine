/**
 * Diegetic LitRPG System window — ledger chrome when the blue panel is in play.
 * Code-owned. Not a GM prompt. Not STATUS "Turn results".
 */
import { characterNameIsGeneric } from './openingEstablishment';
import { UNNAMED_ADVENTURER, sanitizePcName } from './pcNameAuthority';
import type { GameState, LogEntry } from './types';

export interface LitrpgSystemWindow {
  heading: string;
  lines: string[];
}

const OPENING_PING =
  /^(Registration incomplete|Interface online|Awaiting designation|Stamp:|Gift channel:)/i;

export function storyMentionsSystemPanel(text: string): boolean {
  return /\b(?:blue panel|system panel|blue screen|system (?:window|screen|interface))\b/i.test(
    text ?? ''
  );
}

export function playerAskedAboutSystemPanel(input: string): boolean {
  const t = (input ?? '').trim();
  if (!t) return false;
  return (
    /\bblue\s+(?:screen|panel|window)\b/i.test(t)
    || /\bsystem\s+(?:panel|screen|window|interface|display)\b/i.test(t)
    || /\b(?:inspect|examine|read|check|look at|study)\b.{0,48}\b(?:panel|screen|interface|system)\b/i.test(t)
    || /\bwhat(?:'s| is) (?:the |this )?(?:blue )?(?:screen|panel)\b/i.test(t)
  );
}

export function playerLockedNameThisLine(input: string): boolean {
  return /\b(?:my name is|i am called|i'm called|call me)\s+[A-Za-z]/i.test(input ?? '');
}

export function isOpeningSystemPingLine(line: string): boolean {
  return OPENING_PING.test((line ?? '').trim());
}

function lockedSystemName(state: GameState): string | null {
  const fromCover = sanitizePcName(state.openingEstablishment?.answers?.name);
  if (fromCover && !characterNameIsGeneric(fromCover)) return fromCover;
  const fromChar = sanitizePcName(state.character?.name);
  if (
    fromChar
    && fromChar !== UNNAMED_ADVENTURER
    && !characterNameIsGeneric(fromChar)
  ) {
    return fromChar;
  }
  return null;
}

function priorGmCount(state: GameState): number {
  return (state.log ?? []).filter((e) => e?.role === 'gm').length;
}

export function shouldAttachLitrpgSystemWindow(args: {
  state: GameState;
  story?: string;
  playerInput?: string;
  systemLog?: string[];
}): boolean {
  if (args.state.engineMode !== 'litrpg') return false;
  if (priorGmCount(args.state) === 0) return true;
  if (playerAskedAboutSystemPanel(args.playerInput ?? '')) return true;
  if (playerLockedNameThisLine(args.playerInput ?? '')) return true;
  if ((args.systemLog ?? []).some((l) => /level\s*up/i.test(l))) return true;
  return false;
}

export function buildLitrpgSystemWindow(state: GameState): LitrpgSystemWindow | null {
  if (state.engineMode !== 'litrpg') return null;
  const c = state.character;
  const name = lockedSystemName(state);
  const registered = !!name;
  const lines: string[] = [
    `Name: ${name ?? '—'}`,
    `Level ${c?.level ?? 1}`,
    `HP ${c?.hp ?? 0} / ${c?.maxHp ?? 0}`,
  ];
  if (typeof c?.mp === 'number' && (c.maxMp ?? 0) > 0) {
    lines.push(`MP ${c.mp} / ${c.maxMp}`);
  }
  if (state.campaignBibleId === 'summoned-pact') {
    lines.push(registered ? 'Registration: designation locked' : 'Registration: incomplete');
    lines.push('Mark: Pactborn / Calamity Mark — unresolved');
    if (!state.openingEstablishment?.complete) {
      lines.push('Gift: unresolved — Appraisal names it');
    }
  } else {
    lines.push(registered ? 'Interface: online' : 'Interface: online — awaiting designation');
  }
  return { heading: 'SYSTEM', lines };
}

export function withLitrpgSystemWindow(
  entry: LogEntry,
  state: GameState,
  playerInput = ''
): LogEntry {
  if (
    !shouldAttachLitrpgSystemWindow({
      state,
      story: entry.content,
      playerInput,
      systemLog: entry.systemLog,
    })
  ) {
    return entry;
  }
  const systemWindow = buildLitrpgSystemWindow(state);
  if (!systemWindow) return entry;
  return {
    ...entry,
    systemWindow,
    systemLog: (entry.systemLog ?? []).filter((l) => !isOpeningSystemPingLine(l)),
  };
}
