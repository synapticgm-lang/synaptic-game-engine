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
  if (engineMode === 'dnd' || engineMode === 'pyoa') {
    return cleaned.filter((l) => !isLitrpgChromeLine(l) && (engineMode === 'pyoa' ? !isDiceMechanicsLine(l) : true));
  }
  return cleaned.filter((l) => !isDiceMechanicsLine(l));
}

/** LitRPG System lines must never leak into tabletop chrome. */
export function isLitrpgChromeLine(line: string): boolean {
  return /integration|foundation core|first blood|system-issue|salvage|\bwave\s*\d|xp gained|level\s*up/i.test(line);
}
