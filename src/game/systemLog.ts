import type { EngineMode, StatVerbosity } from './types';
import { applyStatusFirewall } from './statusFirewall';

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

/** No-op skill receipts with no dice / no sheet change — STATUS noise. */
export function isNoOpCheckSuccessLine(line: string): boolean {
  return (
    /no mechanical changes/i.test(line)
    || /\[\s*\w[\w\s]*\s*check:\s*SUCCESS\s*[–—\-].*(?:no (?:mechanical )?changes|nothing (?:changes|happens))/i.test(
      line
    )
  );
}

/**
 * Empty / zero-change STATUS filler (GM often writes this when nothing happened).
 * When every remaining line matches, omit STATUS chrome entirely.
 */
export function isEmptyStatusNoiseLine(line: string): boolean {
  const t = line.replace(/^[ \t]*_>\s*/, '').trim();
  return (
    /^no\s+xp\s+or\s+loot\s+changes?\s+this\s+turn\.?$/i.test(t)
    || /^no\s+(?:xp|loot|mechanical|status)\s+changes?\s+this\s+turn\.?$/i.test(t)
    || /^no\s+changes?\s+this\s+turn\.?$/i.test(t)
    || /^nothing\s+(?:material\s+)?(?:changed|changes)\s+this\s+turn\.?$/i.test(t)
    || /^no\s+xp\s+(?:or\s+loot\s+)?(?:gained|awarded)\.?$/i.test(t)
    || /^xp\s+gained:\s*0\b/i.test(t)
    || /^loot:\s*(?:none|nothing|n\/a)\.?$/i.test(t)
  );
}

/** Player-facing Status panel — strip internal jargon and idle sheet dumps. */
export function isMudReceiptLine(line: string): boolean {
  return /^(HERE|ACT|OUTCOME|DMG|FOE HP|CLEAR|CORPSE|XP:|LOOT:|CAST:|ENCOUNTER:|BOUNTY:|GOLD:)\b/i.test(
    line.trim()
  );
}

export function isNoisySystemLogLine(line: string): boolean {
  if (isMudReceiptLine(line)) return false;
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
    // Director mandates must not surface as STATUS without mechanical pads (Batch S)
    || /^SOCIAL CRISIS\b/i.test(line)
    || /^NPC TOPIC EXHAUSTED\b/i.test(line)
    || /^NPC STAGE ADVANCE\b/i.test(line)
    || /^NPC TOPIC SUITE\b/i.test(line)
    || /^FREE T12 HOOK\b/i.test(line)
    || /^LOITER INTERRUPT\b/i.test(line)
    || /^ENCOUNTER TERMINAL\b/i.test(line)
    || /^ARC (?:PENDING|BEAT|DIRECTOR)\b/i.test(line)
    || isNoOpCheckSuccessLine(line)
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

/** Positive XP Gained line (any amount > 0). */
export function isXpGainedLine(line: string): boolean {
  const t = line.replace(/^[ \t]*_>\s*/, '').trim();
  if (/xp\s+gained:\s*0\b/i.test(t)) return false;
  return /^xp\s+gained:\s*\d+/i.test(t);
}

/** Code awards always include a parenthetical reason. */
export function isReasonedXpLine(line: string): boolean {
  return isXpGainedLine(line) && /\(\s*[^()\s].*\)\s*$/.test(line.trim());
}

/**
 * Drop bare GM "XP Gained: N" lines. Keep code-awarded lines that include a reason,
 * or replace bare amounts when a reasoned code note for the same amount exists.
 */
export function reconcileXpStatusLines(lines: string[], codeXpNotes: string[] = []): string[] {
  const reasoned = codeXpNotes.filter(isReasonedXpLine);
  const withoutBareGm = lines.filter((l) => {
    if (!isXpGainedLine(l)) return true;
    return isReasonedXpLine(l);
  });
  // Prefer code notes; avoid duplicate amounts.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of [...withoutBareGm, ...reasoned]) {
    const key = line.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

/**
 * An engine-rolled check receipt ("Parley check: d20 10 + 1 vs DC 15 — failure", or a contest
 * "Flee check: d20 10 + 3 = 13 vs Bandit d20 8 + 1 = 9 — success"). Tabletop shows these.
 */
export function isEngineCheckLine(line: string): boolean {
  const t = line.trim();
  return /^[A-Z][a-z]+ check: d20 \d+ [+−-] \d+ vs DC \d+ — (?:success|failure)$/.test(t)
    || /^[A-Z][a-z]+ check: d20 \d+ [+−-] \d+ = -?\d+ vs .+ d20 \d+ [+−-] \d+ = -?\d+ — (?:success|failure)$/.test(t)
    // tt-fix-7 — `formatCheckRecord` (travel jobs: look-out, navigation, foraging): "Foraging: Wisdom (Survival) d20 (3) + 1 WIS = 4 vs DC 15 — failure".
    || /^[A-Z][^=]* d20 \((?:\d+|(?:adv|dis): \d+, \d+)\)[^=]* = -?\d+ vs DC \d+ — (?:success|failure)$/.test(t)
    || isEngineRoundLine(t);
}

/** A tabletop fight's engine lines (initiative, each round, death saves): every roll in them is shown. */
function isEngineRoundLine(line: string): boolean {
  return /^(?:Initiative|Opening strike|Rounds? \d+(?:–\d+)?) — /.test(line) || /^Death save: /.test(line);
}

/** LitRPG item rarity tag ("[Epic] Masterwork Jerkin"); Story RPG loot reads as plain things. */
const RARITY_TAG = /\[(?:Common|Uncommon|Rare|Epic|Legendary|Mythic|Unique)\]\s*/g;

const REMEMBER_CUE = /^Remember(?:ed)?:\s*/;

/** A story RPG "they'll remember" line: the text to show after the cue mark, or null for any other line. */
export function rememberCueText(line: string): string | null {
  return REMEMBER_CUE.test(line) ? line.replace(REMEMBER_CUE, '') : null;
}

/** The Status Panel Detail setting, for every view that shows STATUS: detailed = all, core = key lines, minimal = none. */
export function statusLinesForVerbosity(lines: string[], verbosity: StatVerbosity | undefined): string[] {
  if (verbosity === 'minimal') return [];
  if (verbosity === 'core') {
    return lines.filter((l) => /success|fail|damage|heal|\bhp\b|defeated|xp|loot|gold|item|level|quest|dungeon|objective|registered|location|skill|technique|title|achievement|remember|condition|inspiration|^encounter cleared:|^ending:|^origin:|^romance:|^floor:/i.test(l));
  }
  return lines;
}

/**
 * One clear line per foe: the engine's machine receipt ("Encounter cleared: X (defeat)") and its STATUS line
 * ("Encounter cleared: X — lost") are the same event; STATUS keeps the readable one.
 */
function dedupeEncounterCleared(lines: string[]): string[] {
  const readable = new Set(
    lines.map((l) => l.match(/^Encounter cleared:\s*(.+?)\s+—\s+\S/)?.[1]?.toLowerCase()).filter((n): n is string => !!n)
  );
  const seen = new Set<string>();
  return lines.filter((l) => {
    const machine = l.match(/^Encounter cleared:\s*(.+?)\s*\([a-z]+\)\s*$/i)?.[1]?.toLowerCase();
    if (machine && readable.has(machine)) return false;
    if (/^Encounter cleared:/i.test(l)) {
      const key = l.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });
}

export function filterSystemLogForEngine(lines: string[], engineMode: EngineMode): string[] {
  const showsChecks = engineMode === 'dnd';
  const cleaned = lines
    .map((l) => l.replace(/^[ \t]*_>\s*/, '').trim())
    .map((l) => l.replace(/\s*\(CODE\s*ENFORCED\)\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim())
    .map(scrubLocationDangerTier)
    .map((l) => (engineMode === 'rpg' ? l.replace(RARITY_TAG, '') : l))
    .filter(Boolean)
    .filter((l) => !isInventedStreetDangerLine(l))
    .filter((l) => (showsChecks && isEngineCheckLine(l)) || !isNoisySystemLogLine(l))
    .filter((l) => !isEmptyStatusNoiseLine(l))
    .filter((l) => !/^no xp gained\.?$/i.test(l))
    .filter((l) => !/^xp gained:\s*0\b/i.test(l))
    .filter((l) => !/^(?:_>\s*)?SYSTEM LOG$/i.test(l))
    .filter((l) => !/^(?:what do you do(?:\s+next)?|what will you do)\s*[?:.]?$/i.test(l));
  const firewalled = applyStatusFirewall(cleaned).lines;
  const deduped = dedupeEncounterCleared(dedupeQuestStatusEcho(firewalled));
  if (engineMode === 'dnd' || engineMode === 'pyoa') {
    return deduped.filter((l) => !isLitrpgChromeLine(l) && (engineMode === 'pyoa' ? !isDiceMechanicsLine(l) : true));
  }
  return deduped.filter((l) => !isDiceMechanicsLine(l));
}

/** LitRPG System lines must never leak into tabletop chrome. */
export function isLitrpgChromeLine(line: string): boolean {
  return /integration|foundation core|first blood|system-issue|salvage|\bwave\s*\d|xp gained|level\s*up/i.test(line);
}
