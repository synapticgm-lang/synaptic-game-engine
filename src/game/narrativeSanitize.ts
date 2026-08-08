import type { EngineMode } from './types';

const SYSTEM_ROLL_BLOCK =
  /\[?\s*SYSTEM\s+ROLL:[\s\S]*?Outcome:\s*[^\]]+\]?/gi;

/** Full-line skill/ability check math the model often leaks into story prose. */
const CHECK_MATH_LINE =
  /^\s*(?:\*+|_+)?\s*(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|STR|DEX|CON|INT|WIS|CHA|Attack|Skill|Perception|Stealth|Athletics|Acrobatics|Investigation|Persuasion|Intimidation|Insight|Survival|Arcana|Nature|History|Medicine|Religion|Deception|Performance|Sleight of Hand|Initiative)\s*(?:Check|Save|Roll|Attack)?\s*[:：].*$/gim;

/** Inline dice formulas such as d20(14) + Mod(2) = 16 or [d20+5] = 18. */
const INLINE_DICE_MATH =
  /(?:\b(?:rolled?|roll)\s+)?\[?\s*d\d+\s*(?:\(\s*\d+\s*\))?(?:\s*[+-]\s*(?:Mod(?:ifier)?\s*)?(?:\(\s*\d+\s*\)|\d+))?\s*(?:=\s*\d+)?(?:\s*vs\.?\s*DC\s*\d+)?\]?/gi;

const SUCCESS_FAIL_PAREN =
  /\b(?:SUCCESS|FAILURE)\s*\(\s*Rolled\s+d\d+[^)]*\)/gi;

export function extractSystemRollBlocks(text: string): string[] {
  const rolls: string[] = [];
  const re = new RegExp(SYSTEM_ROLL_BLOCK.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) rolls.push(m[0].trim());
  return rolls;
}

/**
 * Pull dice / check math out of player-facing narrative for LitRPG and RPG modes.
 * Extracted lines are returned so callers can merge them into the collapsed system log.
 */
export function sanitizeNarrativeMechanics(
  text: string,
  engineMode: EngineMode
): { text: string; extracted: string[] } {
  const extracted: string[] = [];
  let next = text;

  next = next.replace(SYSTEM_ROLL_BLOCK, (match) => {
    extracted.push(match.trim());
    return '';
  });

  if (engineMode !== 'dnd') {
    next = next.replace(CHECK_MATH_LINE, (match) => {
      const line = match.trim();
      if (line) extracted.push(line);
      return '';
    });
    next = next.replace(SUCCESS_FAIL_PAREN, (match) => {
      extracted.push(match.trim());
      return '';
    });
    next = next.replace(INLINE_DICE_MATH, (match) => {
      const trimmed = match.trim();
      // Keep tiny fragments that are clearly not roll reports (e.g. "dungeon").
      if (/^d\d+/i.test(trimmed) || /rolled?/i.test(trimmed) || /[=+]/.test(trimmed)) {
        extracted.push(trimmed);
        return '';
      }
      return match;
    });
  }

  next = next
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return { text: next, extracted };
}

/**
 * If the model was cut off mid-sentence (common under low max_tokens), drop the
 * dangling fragment after the last sentence terminator so the UI never shows "Your...".
 */
export function trimAbruptCutoff(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return trimmed;
  if (/[.!?…"'`»)\]]\s*$/.test(trimmed)) return trimmed;
  if (/what do you do\??\s*$/i.test(trimmed)) return trimmed;

  const lastTerm = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? '),
    trimmed.lastIndexOf('.\n'),
    trimmed.lastIndexOf('!\n'),
    trimmed.lastIndexOf('?\n')
  );
  if (lastTerm < Math.floor(trimmed.length * 0.4)) return trimmed;

  let cut = trimmed.slice(0, lastTerm + 1).trim();
  if (!/what do you do\??\s*$/i.test(cut)) {
    cut = `${cut}\n\nWhat do you do?`;
  }
  return cut;
}
