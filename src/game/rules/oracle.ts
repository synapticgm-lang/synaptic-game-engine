/**
 * Shared rules engine — the yes/no oracle for solo play.
 * A logged d100 answers a yes/no question about the world at the odds the player names, so the GM (writer)
 * never decides an open fact on its own. SynapticGM solo design (no SRD rule covers an oracle); the d100 and
 * the "and" extremes follow the common solo-play pattern: the top fifth of the yes band is "Yes, and", the
 * bottom fifth of the no band is "No, and".
 * This module knows no mode; the tabletop glue logs it and puts it on STATUS.
 */
import type { OracleEntry } from '../types';
import { rollDie, type Rng } from './dice';

export type OracleOdds = 'Almost certain' | 'Likely' | 'Even odds' | 'Unlikely' | 'Small chance';

/** Chance of "yes" out of 100 for each named odds. */
export const ORACLE_ODDS: Record<OracleOdds, number> = {
  'Almost certain': 90,
  Likely: 75,
  'Even odds': 50,
  Unlikely: 25,
  'Small chance': 10,
};

const ODDS_WORDS: Array<[RegExp, OracleOdds]> = [
  [/\balmost certain(?:ly)?\b|\bnear(?:ly)? certain\b|\bvery likely\b/i, 'Almost certain'],
  [/\bsmall chance\b|\bvery unlikely\b|\bslim chance\b|\bremote\b/i, 'Small chance'],
  [/\bunlikely\b|\bdoubtful\b/i, 'Unlikely'],
  [/\blikely\b|\bprobably\b/i, 'Likely'],
];

/** The odds a line names; Even odds when it names none. */
export function oddsInInput(text: string): OracleOdds {
  for (const [re, odds] of ODDS_WORDS) if (re.test(text)) return odds;
  return 'Even odds';
}

/**
 * Roll d100 against the chance. 1..chance is yes (the lowest fifth of that band "Yes, and"),
 * above it is no (the highest fifth of the no band "No, and").
 */
export function rollOracle(question: string, odds: OracleOdds, rng: Rng, turn: number): OracleEntry {
  const chance = ORACLE_ODDS[odds];
  const roll = rollDie(100, rng);
  let answer: OracleEntry['answer'];
  if (roll <= chance) answer = roll <= Math.max(1, Math.floor(chance / 5)) ? 'Yes, and' : 'Yes';
  else answer = roll > 100 - Math.max(1, Math.floor((100 - chance) / 5)) ? 'No, and' : 'No';
  return { turn, question, odds, chance, roll, answer };
}

/** What each answer means for the writer (no numbers). */
export const ORACLE_MEANING: Record<OracleEntry['answer'], string> = {
  'Yes, and': 'yes, and more than that: something extra in the same direction is also true',
  Yes: 'yes',
  No: 'no',
  'No, and': 'no, and worse: something extra against the asker is also true',
};

/** "Oracle: Is the bridge guarded? (Likely, 75%) — d100 41: Yes" */
export function oracleLine(e: OracleEntry): string {
  return `Oracle: ${e.question} (${e.odds}, ${e.chance}%) — d100 ${e.roll}: ${e.answer}`;
}
