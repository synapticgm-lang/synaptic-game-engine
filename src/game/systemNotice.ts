/**
 * LitRPG presenter for STATUS: one System notice format, "<Kind> — <what>.", for quests (accepted, updated,
 * complete), XP, level, skill, title, achievement, loot (each item with its rarity) and party. Display only: the saved
 * engine lines stay as they are, because other code reads them. Other modes keep their lines unchanged.
 */
import type { EngineMode } from './types';

const RARITY = '(Common|Uncommon|Rare|Epic|Legendary|Mythic|Unique)';
const end = (s: string) => s.trim().replace(/[.!]+$/, '');

function lootBody(body: string): string {
  return end(body).replace(new RegExp(`\\[${RARITY}\\]\\s*(.+?)(?=,\\s*\\[|\\s+\\(|\\s+—|$)`, 'g'), (_m, r: string, n: string) => `${n.trim()} (${r})`);
}

const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Quest (?:Unlocked|add):\s*(.+)$/i, (m) => `Quest accepted — ${end(m[1]!)}.`],
  [/^Quest complete:\s*(.+)$/i, (m) => `Quest complete — ${end(m[1]!)}.`],
  [/^Quest:\s*(.+)$/, (m) => `Quest updated — ${end(m[1]!)}.`],
  [/^XP Gained:\s*(\d+)\s*\(quest step:\s*(.+)\)\s*$/i, (m) => `Quest updated — ${end(m[2]!)}. +${m[1]} XP.`],
  [/^XP Gained:\s*(\d+)\s*\(quest complete:\s*(.+)\)\s*$/i, (m) => `Quest complete — ${end(m[2]!)}. +${m[1]} XP.`],
  [/^XP Gained:\s*(\d+)\s*\((.+)\)\s*$/i, (m) => `XP — +${m[1]} (${end(m[2]!)}).`],
  [/^Level Up!\s*Now level (\d+)\.?$/i, (m) => `Level up — level ${m[1]}.`],
  [/^Skill (?:up:\s*(.+?),\s*(Novice|Apprentice|Journeyman|Expert|Master)\s+(\d+)|rank up:\s*(.+?)\s*\(rank (\d+)\))\.?$/i, (m) =>
    m[1] ? `Skill up — ${m[1]}, ${m[2]} ${m[3]}.` : `Skill up — ${m[4]}, rank ${m[5]}.`],
  [/^Technique learned:\s*(.+?)\s*\((.+?) evolved\)\.?$/i, (m) => `Skill evolved — ${m[2]} into ${m[1]}.`],
  [/^Technique used:\s*(.+?)\s*\((.+)\)\.?$/i, (m) => `Skill used — ${m[1]} (${m[2]}).`],
  [/^(?:Perk gained|Skill learned):\s*(.+)$/i, (m) => `Skill — ${end(m[1]!)}.`],
  [/^Title earned:\s*(.+)$/i, (m) => `Title earned — ${end(m[1]!)}.`],
  [/^Title:\s*(.+)$/i, (m) => `Title — ${end(m[1]!)}.`],
  [/^Achievement:\s*(.+)$/i, (m) => `Achievement — ${end(m[1]!)}.`],
  [/^Loot:\s*(.+)$/i, (m) => `Loot — ${lootBody(m[1]!)}.`],
  [/^Companion:\s*(.+)$/i, (m) => `Party — ${end(m[1]!)}.`],
  [/^Floor:\s*(.+)$/i, (m) => `Floor — ${end(m[1]!)}.`],
  [/^(Promise|Deal|Agreement) (kept|broken|expired):\s*(.+)$/i, (m) => `${m[1]} ${m[2]!.toLowerCase()} — ${end(m[3]!)}.`],
];

export function systemNotice(line: string): string {
  const t = (line ?? '').trim();
  for (const [re, fmt] of RULES) {
    const m = t.match(re);
    if (m) return fmt(m);
  }
  return line;
}

/**
 * True for a character level-up or skill rank-up STATUS / system line (engine or LitRPG presenter).
 * False for per-use practice, Technique used, XP ticks, and other chrome.
 */
export function isLevelOrRankUpLine(line: string): boolean {
  const t = (line ?? '').trim();
  if (!t) return false;
  if (/^Level\s*up\b|^Level Up!/i.test(t)) return true;
  if (/^Skill\s+(?:up|rank\s*up)\b/i.test(t)) return true;
  if (/^(?:You\s+)?leveled?\s*up\b/i.test(t)) return true;
  return false;
}

/** Per-use technique / practice receipts — never System notifications. */
export function isPerUseSkillLine(line: string): boolean {
  const t = (line ?? '').trim();
  return /^Technique used\b/i.test(t) || /^Skill used\b/i.test(t);
}

/**
 * True when a STATUS line belongs in the Check System / notices panel:
 * level-up, skill rank-up, quest complete, XP / loot / gold rewards.
 * Display helper only — does not change engine awards.
 */
export function isSystemNotificationLine(line: string): boolean {
  const t = (line ?? '').trim();
  if (!t || isPerUseSkillLine(t)) return false;
  if (isLevelOrRankUpLine(t)) return true;
  if (/^Quest complete\b/i.test(t)) return true;
  if (/^XP(?:\s*Gained)?\s*[—:\-]/i.test(t) && !/^XP\s*Gained:\s*0\b/i.test(t)) return true;
  if (/^Loot\b/i.test(t)) return true;
  if (/^Gold Gained\b/i.test(t)) return true;
  return false;
}

/** Modes that collapse reward STATUS into a brief cue + Check System chip. Tabletop / PYOA stay unchanged. */
export function usesSystemNoticeChip(engineMode: EngineMode | undefined): boolean {
  return engineMode === 'litrpg' || engineMode === 'rpg';
}

export function briefSystemNoticeCue(engineMode: EngineMode | undefined): string {
  return engineMode === 'rpg' ? 'You have a new notice.' : 'You have a new System notification.';
}

export function checkSystemChipLabel(engineMode: EngineMode | undefined, unread: number): string {
  const base = engineMode === 'rpg' ? 'Check notices' : 'Check System';
  return unread > 0 ? `${base} (${unread})` : base;
}

/** LitRPG / Story RPG notice-inbox chip (not a scene object — FOURSLOT3 unrelated-chip exempt). */
export function isCheckSystemChip(label: string | null | undefined): boolean {
  const t = (label ?? '').replace(/\s+/g, ' ').trim();
  return /^(?:check system|check notices)(?:\s*\(\d+\))?$/i.test(t);
}

/** Presented notification lines from a turn's STATUS (display derivation only). */
export function deriveSystemNotifications(
  lines: string[],
  engineMode: EngineMode | undefined,
): string[] {
  if (!usesSystemNoticeChip(engineMode)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    if (!isSystemNotificationLine(raw)) continue;
    const shown = engineMode === 'litrpg' ? systemNotice(raw) : raw;
    const key = shown.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(shown);
  }
  return out;
}

/**
 * Chat/STATUS display: replace notification lines with one brief cue; leave other STATUS lines alone.
 * Tabletop / PYOA: passthrough.
 */
export function collapseNotificationStatus(
  lines: string[],
  engineMode: EngineMode | undefined,
): string[] {
  if (!usesSystemNoticeChip(engineMode)) return lines;
  let had = false;
  const kept: string[] = [];
  for (const line of lines) {
    if (isSystemNotificationLine(line)) {
      had = true;
      continue;
    }
    kept.push(line);
  }
  if (!had) return lines;
  return [briefSystemNoticeCue(engineMode), ...kept];
}

export function presentSystemNotices(lines: string[], engineMode: EngineMode | undefined): string[] {
  return engineMode === 'litrpg' ? lines.map(systemNotice) : lines;
}
