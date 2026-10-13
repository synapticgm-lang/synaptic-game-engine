/**
 * Diegetic LitRPG System window — ledger chrome when the blue panel is in play.
 * Code-owned. Not a GM prompt. Not STATUS "Turn results".
 */
import { isLedgerReadAction } from './completedEventPacket';
import { characterNameIsGeneric, hallTalkAsksPanel } from './openingEstablishment';
import { UNNAMED_ADVENTURER, sanitizePcName } from './pcNameAuthority';
import { isPartOn, writerFacts, type SystemPartId } from './systemHousing';
import { classDisplayName } from './rules/characterClass';
import { unspentStatPoints } from './rules/abilityPoints';
import { ABILITY_KEYS } from './tabletop/characterBuild';
import { CHECK_SKILLS, skillRanksOf } from './skillRanks';
import { skillLabel } from './skillGates';
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
  const items = writerFacts(state).pocket
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
  if ((args.systemLog ?? []).some((l) => /level\s*up|^Class: (?:Class taken|The System assigned)|^Stats:/i.test(l))) return true;
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
  const className = on('level') ? classDisplayName(state) : null;
  if (className) lines.push(`Class: ${className}`);
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
  if (on('level')) {
    const stats = statsLine(state);
    if (stats) lines.push(stats);
  }
  if (on('skills')) {
    const skills = topSkillsLine(state);
    if (skills) lines.push(skills);
  }
  const title = c?.activeTitle?.trim();
  if (title) lines.push(`Title: ${title}`);
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

/** The window never runs past this many lines (it prints at most 14). */
export const SYSTEM_WINDOW_MAX_LINES = 15;
const TOP_SKILLS = 3;

/** Core stats from the engine's ability scores, with any free stat points still waiting. */
function statsLine(state: GameState): string | null {
  const a = state.character?.attributes;
  if (!a) return null;
  const scores = ABILITY_KEYS.filter((k) => typeof a[k] === 'number').map((k) => `${k} ${a[k]}`);
  if (!scores.length) return null;
  const waiting = unspentStatPoints(state);
  const tail = waiting ? ` (${waiting} point${waiting > 1 ? 's' : ''} to spend)` : '';
  return `Stats: ${scores.join(', ')}${tail}`;
}

/** The highest engine skill ranks (rank above 0), most first. */
function topSkillsLine(state: GameState): string | null {
  const ranks = skillRanksOf(state.character);
  const top = CHECK_SKILLS.filter((s) => ranks[s] > 0)
    .sort((x, y) => ranks[y] - ranks[x])
    .slice(0, TOP_SKILLS);
  return top.length ? `Skills: ${top.map((s) => `${skillLabel(s)} ${ranks[s]}`).join(', ')}` : null;
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
  if (housing?.housing === 'leftover_pocket') return `${pocketLine(state, false)}.`;
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

function windowField(line: string): [string, string] {
  const colon = line.indexOf(':');
  if (colon > 0) return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
  const m = line.match(/^(\S+)\s+(.*)$/);
  return m ? [m[1]!, m[2]!.trim()] : [line.trim(), ''];
}

/** "STR 12, DEX 14 (1 point to spend)" → only the scores that moved ("STR 12 → 13"), and the waiting points. */
function statsChange(was: string, now: string): string {
  const scores = (v: string) => new Map([...v.matchAll(/\b([A-Z]{3}) (\d+)/g)].map((m) => [m[1]!, m[2]!]));
  const a = scores(was);
  const out: string[] = [];
  for (const [k, v] of scores(now)) if (a.get(k) !== v) out.push(`${k} ${a.get(k) ?? '—'} → ${v}`);
  const points = (v: string) => v.match(/\((\d+) points? to spend\)/)?.[1] ?? '0';
  if (points(was) !== points(now)) out.push(`points to spend ${points(was)} → ${points(now)}`);
  return `Stats ${out.join(', ')}`;
}

function shortChange(was: string, now: string): [string, string] {
  const a = was.match(/^(\d+)\s*\/\s*(\d+)$/);
  const b = now.match(/^(\d+)\s*\/\s*(\d+)$/);
  return a && b && a[2] === b[2] ? [a[1]!, b[1]!] : [was, now];
}

/** The window the player last saw: the newest GM entry that carries the painted plate. */
function lastPaintedWindow(state: GameState): LitrpgSystemWindow | null {
  const hit = [...(state.log ?? [])].reverse().find((e) => e?.role === 'gm' && e.systemWindow?.lines?.length);
  return hit?.systemWindow ?? null;
}

/**
 * What changed on the window since the last painted plate, field by field ("XP 0 → 75").
 * Null when there is no window or no earlier plate to compare with. The plate itself is the window.
 */
export function ledgerReadChanges(state: GameState): string[] | null {
  const now = buildLitrpgSystemWindow(state);
  const before = now ? lastPaintedWindow(state) : null;
  if (!now || !before) return null;
  const was = new Map(before.lines.map(windowField));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of now.lines) {
    const [k, v] = windowField(line);
    seen.add(k);
    const old = was.get(k);
    if (old === undefined) out.push(line);
    else if (old !== v && k === 'Stats') out.push(statsChange(old, v));
    else if (old !== v) {
      const [a, b] = shortChange(old, v);
      out.push(`${k} ${a} → ${b}`);
    }
  }
  for (const k of was.keys()) if (!seen.has(k)) out.push(`${k} gone`);
  return out;
}

/** The writer's fact for a ledger read: only the change, never the sheet. */
export function ledgerChangeFact(changes: string[] | null | undefined): string {
  if (!changes) return 'First read: the game shows the whole window; there is nothing earlier to compare.';
  return changes.length ? `Changed since the last read: ${changes.join('; ')}.` : 'Nothing changed since the last read.';
}

/** A code-written ledger-read line for a stitch: what the player did, then only what changed. */
export function ledgerReadStitch(housing: string | null | undefined, changes: string[] | null | undefined): string {
  const did =
    housing === 'worn_device' ? 'You read the worn device.'
    : housing === 'private_window' ? 'You looked inward.'
    : housing === 'world_status' ? 'You took stock of what the world knew of you.'
    : housing === 'leftover_pocket' ? 'You reached into the pocket.'
    : 'You read the System window.';
  const what = !changes
    ? 'It showed what it always showed.'
    : changes.length
      ? `Since the last read: ${changes.join('; ')}.`
      : 'Nothing on it had changed since the last read.';
  return `${did} ${what}`;
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
