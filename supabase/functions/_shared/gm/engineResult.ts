/**
 * s77 Root C — the writer's ENGINE RESULT is every receipt the engine wrote this turn for a change
 * in the world (a fight, a flee, an arrival, a move, loot, an offer taken), minus chrome: ledger
 * figures and bookkeeping that belong on STATUS, not in the story.
 */

const CHROME_RECEIPT =
  /^(?:XP Gained|Arc XP|Level Up|HP:|Approach:|Quest(?: stage)?:|Social(?: track)?:|NPC Lifecycle:|Voice:|Threat building:|Threat still live|Encounter (?:cleared|cooldown|density)\b|Caught —|Parley (?:in progress|exhausted)|Warden:|Commit gate:|Cooldown|Treasure cache|d\d+ = )/i;

/** A foe's health figure ("Wardline Bandit HP: 9/16 (−4)"). */
const FOE_HP_FIGURE = /^[^:]{1,60} HP: \d+\/\d+/;

export function isChromeReceipt(receipt: string): boolean {
  const r = receipt.trim();
  return !r || CHROME_RECEIPT.test(r) || FOE_HP_FIGURE.test(r);
}

/** This turn's world-change receipts as one plain fact line (empty when nothing changed). */
export function engineResultFact(receipts: readonly string[]): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of receipts) {
    const r = (raw ?? '').replace(/\s+/g, ' ').trim();
    if (isChromeReceipt(r) || seen.has(r.toLowerCase())) continue;
    seen.add(r.toLowerCase());
    kept.push(/[.!?]$/.test(r) ? r : `${r}.`);
  }
  return kept.join(' ');
}

export type TerminalFight = {
  outcome: 'victory' | 'defeat' | 'escaped';
  foe: string;
  rounds: string;
  forced: boolean;
};

/** s82 Root A — the fight the engine settled this turn, read from the ENGINE RESULT (null when none). */
export function terminalFightOutcome(engineFact: string | undefined): TerminalFight | null {
  const fact = engineFact ?? '';
  const fight = fact.match(/Fight: (VICTORY|DEFEAT) vs (.+?) in (\d+ rounds?)/);
  if (fight) {
    return {
      outcome: fight[1] === 'VICTORY' ? 'victory' : 'defeat',
      foe: fight[2].trim(),
      rounds: fight[3],
      forced: new RegExp(`Fight: ${fight[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} forces the fight`).test(fact),
    };
  }
  if (/Flee check: [^.]*— success/.test(fact)) return { outcome: 'escaped', foe: '', rounds: '', forced: false };
  return null;
}

const TERMINAL_WORDS: Record<TerminalFight['outcome'], RegExp> = {
  victory:
    /\b(?:went down|goes down|go down|was down|is down|stayed down|dead|died|dies|killed|slain|fell|fallen|falls|collapsed|crumpled|lay still|lies still|stopped moving|did not (?:get|rise)|lifeless|limp|corpse|finished (?:it|him|her|them)|beaten)\b/i,
  defeat:
    /\b(?:lost|beaten|went down|was down|knocked (?:down|out|flat)|fell|blacked out|overpowered|pinned|could not get up|on the ground)\b/i,
  escaped: /\b(?:escaped|got away|broke away|broke free|got clear|fled|outran|shook (?:it|him|her|them) off|lost (?:it|him|her|them))\b/i,
};

/** The beat states the settled fight outcome (foe down / player down / escaped). */
export function beatCarriesTerminalFight(prose: string, fight: TerminalFight): boolean {
  return TERMINAL_WORDS[fight.outcome].test(prose ?? '');
}

/** The settled fight as a plain past-tense beat, painted only when the writer will not state it. */
export function terminalFightBeat(fight: TerminalFight, where: string): string {
  const at = where ? ` at ${where}` : '';
  if (fight.outcome === 'escaped') return `You broke away${at} and got clear. Nothing followed you out.`;
  const opener = fight.forced
    ? `You tried to break away${at}, but ${fight.foe} would not let you go and forced the fight.`
    : `You closed with ${fight.foe}${at}.`;
  return fight.outcome === 'victory'
    ? `${opener} It lasted ${fight.rounds}. ${fight.foe} went down and did not get up, and the fight was over.`
    : `${opener} It lasted ${fight.rounds}. You went down, and the fight was lost.`;
}
