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
