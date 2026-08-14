import type { EngineMode } from './types';

/** Dice / check-math lines must never surface in LitRPG or narrative RPG system logs. */
export function isDiceMechanicsLine(line: string): boolean {
  return /\bd20\b|vs\s*DC|Action Check:|Strength Check:|Rolled d20|\[\s*d\d+|Mod\s*\(|modifier\s*[+\-]?\s*\d|SUCCESS\s*\(Rolled|FAILURE\s*\(Rolled/i.test(line);
}

export function filterSystemLogForEngine(lines: string[], engineMode: EngineMode): string[] {
  const cleaned = lines
    .map((l) => l.replace(/^[ \t]*_>\s*/, '').trim())
    .filter(Boolean)
    .filter((l) => !/^no xp gained\.?$/i.test(l))
    .filter((l) => !/^(?:_>\s*)?SYSTEM LOG$/i.test(l))
    .filter((l) => !/^(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?$/i.test(l));
  if (engineMode === 'dnd') return cleaned;
  return cleaned.filter((l) => !isDiceMechanicsLine(l));
}
