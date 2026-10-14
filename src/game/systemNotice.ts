/**
 * LitRPG presenter for STATUS: one System notice format, "<Kind> — <what>.", for quests (accepted, updated,
 * complete), XP, level, skill, title, achievement and loot (each item with its rarity). Display only: the saved
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
  [/^Skill rank up:\s*(.+?)\s*\(rank (\d+)\)\.?$/i, (m) => `Skill up — ${m[1]}, rank ${m[2]}.`],
  [/^Technique learned:\s*(.+?)\s*\((.+?) evolved\)\.?$/i, (m) => `Skill evolved — ${m[2]} into ${m[1]}.`],
  [/^Technique used:\s*(.+?)\s*\((.+)\)\.?$/i, (m) => `Skill used — ${m[1]} (${m[2]}).`],
  [/^(?:Perk gained|Skill learned):\s*(.+)$/i, (m) => `Skill — ${end(m[1]!)}.`],
  [/^Title earned:\s*(.+)$/i, (m) => `Title earned — ${end(m[1]!)}.`],
  [/^Title:\s*(.+)$/i, (m) => `Title — ${end(m[1]!)}.`],
  [/^Achievement:\s*(.+)$/i, (m) => `Achievement — ${end(m[1]!)}.`],
  [/^Loot:\s*(.+)$/i, (m) => `Loot — ${lootBody(m[1]!)}.`],
];

export function systemNotice(line: string): string {
  const t = (line ?? '').trim();
  for (const [re, fmt] of RULES) {
    const m = t.match(re);
    if (m) return fmt(m);
  }
  return line;
}

export function presentSystemNotices(lines: string[], engineMode: EngineMode | undefined): string[] {
  return engineMode === 'litrpg' ? lines.map(systemNotice) : lines;
}
