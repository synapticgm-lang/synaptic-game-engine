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

export function filterSystemLogForEngine(lines: string[], engineMode: EngineMode): string[] {
  const cleaned = lines
    .map((l) => l.replace(/^[ \t]*_>\s*/, '').trim())
    .map(scrubLocationDangerTier)
    .filter(Boolean)
    .filter((l) => !isInventedStreetDangerLine(l))
    .filter((l) => !/^no xp gained\.?$/i.test(l))
    .filter((l) => !/^xp gained:\s*0\b/i.test(l))
    .filter((l) => !/^(?:_>\s*)?SYSTEM LOG$/i.test(l))
    .filter((l) => !/^(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?$/i.test(l));
  if (engineMode === 'dnd') return cleaned;
  return cleaned.filter((l) => !isDiceMechanicsLine(l));
}
