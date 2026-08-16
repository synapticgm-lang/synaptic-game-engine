import type { EngineMode } from './types';
import { stripChoiceList } from './parser';

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
  if (/what do you do\??\s*$/i.test(trimmed)) {
    return trimmed.replace(/\s*what do you do\??\s*$/i, '').trim();
  }

  const lastTerm = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? '),
    trimmed.lastIndexOf('.\n'),
    trimmed.lastIndexOf('!\n'),
    trimmed.lastIndexOf('?\n')
  );
  if (lastTerm < Math.floor(trimmed.length * 0.4)) return trimmed;

  return trimmed.slice(0, lastTerm + 1).trim();
}

const PLAYER_HARM_CUES =
  /\b(you\s+(?:are\s+)?(?:hit|struck|wounded|hurt|injured|clawed|bitten|slashed|pierced|slammed|knocked)|(?:take|took|suffer(?:ed)?)\s+(?:\d+\s+)?(?:damage|wound)|pain\s+(?:flares|lances|shoots)|blood|your\s+(?:armor|flesh|side|arm|leg|chest|shoulder|ribs?)\b)/i;

const MEANINGFUL_PROSE_MIN = 90;

/** Strip residual mechanic XML the model left in player-facing prose. */
export function stripResidualMechanicTags(text: string): string {
  return text
    .replace(/<\/?(?:enemy|damage|heal|item-gain|item-use|system-log|quest-[\w-]+|encounter-end|milestone-event|campaign-ending|loot-video|visual-update|turn-frame|dungeon-[\w-]+|map-floor-change|hex-move|lore-card|world-deal|world-holding|world-order|world-clock|world-actor|time-pass)[^>]*>/gi, '')
    .replace(/^[ \t]*(?:_>\s*)?SYSTEM LOG\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function narrativeMentionsPlayerHarm(prose: string): boolean {
  return PLAYER_HARM_CUES.test(prose);
}

/**
 * Guarantee the turn has readable story prose (not just choices / system lines).
 * If the model returned nearly empty narrative, acknowledge the player's action.
 */
export function ensureTurnProse(cleanText: string, playerAction: string): string {
  // Never treat a numbered option list as the story — strip it first.
  const withoutChoices = stripChoiceList(cleanText);
  const prose = withoutChoices
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[SYSTEM[^\]]*\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hasSentence = /[.!]/.test(prose) || (/\?/.test(prose) && prose.length >= MEANINGFUL_PROSE_MIN);
  if (prose.length >= MEANINGFUL_PROSE_MIN && hasSentence) {
    // Keep non-choice body; choices render as buttons separately.
    return withoutChoices.trim() || cleanText;
  }

  // Thin GM copy stays as-is. Never pad with "You follow through".
  return withoutChoices.trim() || cleanText;
}

/**
 * When HP drops from combat tags/logs but prose never describes being hit, inject a short line
 * so the player can follow why their health changed.
 */
export function ensureDamageNarration(
  cleanText: string,
  amount: number,
  enemyName?: string | null
): string {
  if (amount <= 0 || narrativeMentionsPlayerHarm(cleanText)) return cleanText;
  const foe = enemyName?.trim() || 'your foe';
  const line = `Before you can fully recover your footing, ${foe} lashes out — you take ${amount} damage.`;
  return cleanText.trim() ? `${cleanText.trim()}\n\n${line}` : line;
}

/**
 * If an enemy entered the encounter but prose never says where they came from, add a beat.
 */
export function ensureEncounterNarration(
  cleanText: string,
  _enemyName: string,
  _location?: string | null
): string {
  // Never inject a canned origin line. The writer + outcome token own the beat.
  return cleanText;
}

/**
 * If system-log awards XP but the story never explains why, add a one-line beat.
 */
function isPositiveXpLogLine(line: string): boolean {
  if (/\bno\s+xp\b/i.test(line)) return false;
  if (/xp\s+gained:\s*0\b/i.test(line)) return false;
  return /(?:^|[^\w])(?:xp gained|gained\s+\d+\s*xp)\b/i.test(line) && /\d+/.test(line);
}

export function ensureXpNarration(cleanText: string, systemLog: string[]): string {
  const xpLine = systemLog.find(isPositiveXpLogLine);
  if (!xpLine) return stripUnearnedXpProse(cleanText);
  if (/\b(experience|xp\b|reward(?:ed)?|defeat(?:ed)?|slain|victory|triumph)/i.test(cleanText)) {
    return cleanText;
  }
  const amount = xpLine.match(/(\d+)/)?.[1];
  const line = amount
    ? `The clash leaves you wiser — you gain ${amount} XP.`
    : `The clash leaves you wiser — you gain experience.`;
  return cleanText.trim() ? `${cleanText.trim()}\n\n${line}` : line;
}

/** Remove story XP claims when the ledger did not award any. */
export function stripUnearnedXpProse(text: string): string {
  return text
    .replace(/\s*The clash leaves you wiser[^.?!]*[.?!]/gi, '')
    .replace(/\s*You gain(?:ed)?(?:\s+\d+)?\s+(?:XP|experience)[^.?!]*[.?!]/gi, '')
    .replace(/^[ \t]*XP Gained:\s*0\s*$/gim, '')
    .replace(/\s*XP Gained:\s*0\b[^.!\n]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

