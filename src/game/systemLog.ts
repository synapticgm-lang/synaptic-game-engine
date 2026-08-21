import type { EngineMode } from './types';

/** Dice / check-math lines must never surface in LitRPG or narrative RPG system logs. */
export function isDiceMechanicsLine(line: string): boolean {
  return /\bd20\b|vs\s*DC|Action Check:|Strength Check:|Rolled d20|\[\s*d\d+|Mod\s*\(|modifier\s*[+\-]?\s*\d|SUCCESS\s*\(Rolled|FAILURE\s*\(Rolled/i.test(line);
}

/** Street location lines must not invent a dungeon danger tier (e.g. "Tier 2 Urban Ruin"). */
export function scrubLocationDangerTier(line: string): string {
  if (!/^location:/i.test(line)) return line;
  return line
    .replace(/\s*\([^)]*tier[^)]*\)/gi, '')
    .replace(/\s*\([^)]*urban\s+ruin[^)]*\)/gi, '')
    .replace(/\s*[,;:\u2014\-]+\s*tier\s*\d+\b(?:\s+urban\s+ruin)?/gi, '')
    .replace(/\s*[,;:\u2014\-]+\s*urban\s+ruin\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[,;:\-\s]+$/, '');
}

function isInventedStreetDangerLine(line: string): boolean {
  return /^(?:area(?:\s*type)?|zone|biome|danger(?:\s*tier)?|threat(?:\s*level)?):\s*(?:tier\s*\d+\s*)?(?:urban\s+ruin).*$/i.test(line)
    || /^(?:tier\s*[1-4]\s*urban\s+ruin)$/i.test(line);
}

/** Player-facing Status panel — strip internal jargon and idle sheet dumps. */
export function isNoisySystemLogLine(line: string): boolean {
  return (
    /CODE\s*ENFORCED/i.test(line)
    || /^action\s+resolved:/i.test(line)
    || /^action\s+failed:\s*social\b/i.test(line)
    || /warden'?s?\s+expectation/i.test(line)
    || /^check\s+type:/i.test(line)
    || /^outcome:\s*(?:success|failure)\s*$/i.test(line)
    || /^xp:\s*\d+\s*\/\s*\d+\s*$/i.test(line)
    || /^(?:hp|mp|sp|gold):\s*\d+(?:\s*\/\s*\d+)?\s*$/i.test(line)
    || /^social\s+check:\s*(?:success|failure)(?:\s*\(.*\))?\s*$/i.test(line)
    || /\[?\s*system\s+roll/i.test(line)
    || /\bd20\b.*\b(?:mod|dc)\b/i.test(line)
  );
}

/**
 * Collapse Quest Focus / Quest Unlocked / Ledger lines that repeat the same phrase.
 * Prefer Quest Unlocked > Quest Focus > Ledger for the surviving line.
 */
export function dedupeQuestStatusEcho(lines: string[]): string[] {
  const phraseOf = (line: string): string | null => {
    const m = line.match(/^(?:Quest Focus|Quest Unlocked|Ledger):\s*(.+)$/i);
    if (!m?.[1]) return null;
    return m[1].replace(/^Next:\s*/i, '').trim().toLowerCase();
  };
  const rank = (line: string): number => {
    if (/^Quest Unlocked:/i.test(line)) return 0;
    if (/^Quest Focus:/i.test(line)) return 1;
    if (/^Ledger:/i.test(line)) return 2;
    return 9;
  };
  const bestByPhrase = new Map<string, string>();
  const order: string[] = [];
  for (const line of lines) {
    const phrase = phraseOf(line);
    if (!phrase) {
      order.push(line);
      continue;
    }
    const prev = bestByPhrase.get(phrase);
    if (!prev) {
      bestByPhrase.set(phrase, line);
      order.push(`__QUEST__:${phrase}`);
      continue;
    }
    if (rank(line) < rank(prev)) bestByPhrase.set(phrase, line);
  }
  return order.map((token) => {
    if (token.startsWith('__QUEST__:')) {
      return bestByPhrase.get(token.slice('__QUEST__:'.length)) ?? token;
    }
    return token;
  });
}

function normStatusValue(value: string): string {
  return value.replace(/^Next:\s*/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Drop Location / Quest Focus lines that only restate known room + quest after an explore
 * when nothing material changed. Keeps XP/loot/HP/quest-unlock lines.
 */
export function suppressNoOpStatusEcho(
  lines: string[],
  known: { location?: string; questFocus?: string }
): string[] {
  const knownLoc = known.location ? normStatusValue(known.location) : '';
  const knownQuest = known.questFocus ? normStatusValue(known.questFocus) : '';
  return lines.filter((line) => {
    const loc = line.match(/^Location:\s*(.+)$/i);
    if (loc?.[1] && knownLoc && normStatusValue(loc[1]) === knownLoc) return false;
    const qf = line.match(/^Quest Focus:\s*(.+)$/i);
    if (qf?.[1] && knownQuest && normStatusValue(qf[1]) === knownQuest) return false;
    return true;
  });
}

export function filterSystemLogForEngine(lines: string[], engineMode: EngineMode): string[] {
  const cleaned = lines
    .map((l) => l.replace(/^[ \t]*_>\s*/, '').trim())
    .map((l) => l.replace(/\s*\(CODE\s*ENFORCED\)\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim())
    .map(scrubLocationDangerTier)
    .filter(Boolean)
    .filter((l) => !isInventedStreetDangerLine(l))
    .filter((l) => !isNoisySystemLogLine(l))
    .filter((l) => !/^no xp gained\.?$/i.test(l))
    .filter((l) => !/^xp gained:\s*0\b/i.test(l))
    .filter((l) => !/^(?:_>\s*)?SYSTEM LOG$/i.test(l))
    .filter((l) => !/^(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?$/i.test(l));
  const deduped = dedupeQuestStatusEcho(cleaned);
  if (engineMode === 'dnd' || engineMode === 'pyoa') {
    return deduped.filter((l) => !isLitrpgChromeLine(l) && (engineMode === 'pyoa' ? !isDiceMechanicsLine(l) : true));
  }
  return deduped.filter((l) => !isDiceMechanicsLine(l));
}

/** LitRPG System lines must never leak into tabletop chrome. */
export function isLitrpgChromeLine(line: string): boolean {
  return /integration|foundation core|first blood|system-issue|salvage|\bwave\s*\d|xp gained|level\s*up/i.test(line);
}
