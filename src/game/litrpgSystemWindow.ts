/**
 * Diegetic LitRPG System window — ledger chrome when the blue panel is in play.
 * Code-owned. Not a GM prompt. Not STATUS "Turn results".
 */
import { isLedgerReadAction } from './completedEventPacket';
import { characterNameIsGeneric, hallTalkAsksPanel } from './openingEstablishment';
import { UNNAMED_ADVENTURER, sanitizePcName } from './pcNameAuthority';
import { isPartOn, type SystemPartId } from './systemHousing';
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
  return hallTalkAsksPanel(input);
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

function pocketLine(state: GameState, withNotes: boolean): string {
  const items = (state.inventory ?? [])
    .map((i) => {
      const nm = i?.name?.trim();
      if (!nm) return '';
      const note = withNotes ? i.description?.trim() : '';
      return note ? `${nm} (${note})` : nm;
    })
    .filter(Boolean);
  return `Pocket: ${items.length ? items.join(', ') : 'empty'}`;
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
  if (isLedgerReadAction(args.playerInput ?? '')) return true;
  if (playerLockedNameThisLine(args.playerInput ?? '')) return true;
  if ((args.systemLog ?? []).some((l) => /level\s*up/i.test(l))) return true;
  return false;
}

export function buildLitrpgSystemWindow(state: GameState): LitrpgSystemWindow | null {
  if (state.engineMode !== 'litrpg') return null;
  const c = state.character;
  const name = lockedSystemName(state);
  const registered = !!name;
  const housing = state.systemHousing;
  if (housing?.housing === 'leftover_pocket') {
    return { heading: 'SYSTEM', lines: [`Name: ${name ?? '—'}`, pocketLine(state, false)] };
  }
  const on = (part: SystemPartId) => !housing || isPartOn(housing, part);
  const lines: string[] = [`Name: ${name ?? '—'}`];
  if (on('level')) lines.push(`Level ${c?.level ?? 1}`);
  if (on('health')) lines.push(`HP ${c?.hp ?? 0} / ${c?.maxHp ?? 0}`);
  if (on('power_pool') && typeof c?.mp === 'number' && (c.maxMp ?? 0) > 0) {
    lines.push(`MP ${c.mp} / ${c.maxMp}`);
  }
  if (housing && isPartOn(housing, 'active_effects') && (c?.conditions ?? []).length) {
    lines.push(`Effects: ${(c?.conditions ?? []).join(', ')}`);
  }
  if (housing && isPartOn(housing, 'pocket')) {
    lines.push(pocketLine(state, housing.housing === 'worn_device'));
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
  if (on('experience')) lines.push(`XP ${c?.xp ?? 0}/${c?.xpToNext ?? 0}`);
  return { heading: 'SYSTEM', lines };
}

/**
 * The field labels and values this save's window actually prints (Level, XP, Pocket, Mark, Registration…).
 * Prose quoting the window may name them; a housing without a part has no label for it.
 */
export function systemWindowFieldNames(state: GameState): string[] {
  const sheet = buildLitrpgSystemWindow(state);
  if (!sheet) return [];
  const out: string[] = [];
  for (const line of sheet.lines) {
    const label = line.match(/^([A-Z][A-Za-z]*)(?=[:\s])/)?.[1];
    if (label) out.push(label);
    const value = line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : '';
    if (value && /[A-Z]/.test(value)) out.push(value);
  }
  return [...new Set(out)];
}

function ledgerReadsPrefix(housing: string | undefined): string {
  switch (housing) {
    case 'worn_device': return 'The device reads:';
    case 'private_window': return 'The window reads:';
    case 'world_status': return 'Known in the world:';
    default: return 'The panel read:';
  }
}

/** Ledger sheet in prose for a status read. The label follows the frozen housing. HP and MP stay off this line. A leftover pocket prints the pocket only. */
export function ledgerSheetLine(state: GameState): string {
  const housing = state.systemHousing;
  if (housing?.housing === 'leftover_pocket') {
    const items = (state.inventory ?? []).map((i) => i?.name?.trim()).filter((nm): nm is string => !!nm);
    return `Pocket: ${items.length ? items.join(', ') : 'empty'}.`;
  }
  const sheet = buildLitrpgSystemWindow(state);
  if (!sheet) return '';
  const quest = (state.quests ?? []).find((q) => q.status === 'active');
  const next = quest?.objectives?.find((o) => !o.completed)?.description;
  const parts = sheet.lines.filter((l) => !/^(?:HP|MP)\s/.test(l));
  if (quest?.name && (!housing || isPartOn(housing, 'quest_list'))) {
    parts.push(next ? `Quest: ${quest.name}, next: ${next}` : `Quest: ${quest.name}`);
  }
  return `${ledgerReadsPrefix(housing?.housing)} ${parts.join('; ')}.`;
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
