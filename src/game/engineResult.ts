/**
 * s77 Root C — the writer's ENGINE RESULT is every receipt the engine wrote this turn for a change
 * in the world (a fight, a flee, an arrival, a move, loot, an offer taken), minus chrome: ledger
 * figures and bookkeeping that belong on STATUS, not in the story.
 */
import type { EngineMode } from './types';

const CHROME_RECEIPT =
  /^(?:XP Gained|Arc XP|Level Up|HP:|Hit Die:|Approach:|Quest(?: stage)?:|Social(?: track)?:|NPC Lifecycle:|Voice:|Threat building:|Threat still live|Encounter (?:cleared|cooldown|density)\b|Caught —|Parley (?:in progress|exhausted)|Warden:|Commit gate:|Cooldown|Treasure cache|d\d+ = |Rounds? \d+(?:–\d+)? —|Opening strike —|Initiative —|Death save:|Level \d+ —|New features?:|Ability Score Improvement:|Spell slots:|New spells?:|Spell:|Arcane Recovery:)/i;

/** A foe's health figure ("Wardline Bandit HP: 9/16 (−4)"). */
const FOE_HP_FIGURE = /^[^:]{1,60} HP: \d+\/\d+/;

export function isChromeReceipt(receipt: string): boolean {
  const r = receipt.trim();
  return !r || CHROME_RECEIPT.test(r) || FOE_HP_FIGURE.test(r);
}

/** An engine level figure on a foe or meeting ("(level 2)", "(level 3, 18 HP)", "— level 1"). */
const ENGINE_LEVEL_FIGURE = /\s*\(level \d+(?:, \d+ HP)?\)|\s+[—-] level \d+\b/gi;

/** An item's rarity tag ("[Common] Worn Hand Axe"). */
const RARITY_TAG = /\[(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)\]\s*/gi;

/**
 * Outside LitRPG an encounter's level is bookkeeping: the writer never sees it, so prose cannot paste it.
 * Story RPG has no rarity tiers, so loot reaches the writer by name alone.
 */
function withoutEngineLevel(receipt: string, mode: EngineMode | undefined): string {
  if (!mode || mode === 'litrpg') return receipt;
  const plain = receipt.replace(ENGINE_LEVEL_FIGURE, '');
  return mode === 'rpg' ? plain.replace(RARITY_TAG, '') : plain;
}

/** This turn's world-change receipts as one plain fact line (empty when nothing changed). */
export function engineResultFact(receipts: readonly string[], mode?: EngineMode): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of receipts) {
    const r = withoutEngineLevel((raw ?? '').replace(/\s+/g, ' ').trim(), mode);
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
  /** The failed check that let the foe force the fight (a parley or a flee), when the result names one. */
  forcedBy?: 'parley' | 'flee';
};

/** s82 Root A — the fight the engine settled this turn, read from the ENGINE RESULT (null when none). */
export function terminalFightOutcome(engineFact: string | undefined): TerminalFight | null {
  const fact = engineFact ?? '';
  const fight = fact.match(/Fight: (VICTORY|DEFEAT) vs (.+?) in (\d+ rounds?)/);
  if (fight) {
    const forced = new RegExp(`Fight: ${fight[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} forces the fight`).test(fact);
    const forcedBy = /Parley check: [^.]*— failure/.test(fact) ? 'parley' : /Flee check: [^.]*— failure/.test(fact) ? 'flee' : undefined;
    return {
      outcome: fight[1] === 'VICTORY' ? 'victory' : 'defeat',
      foe: fight[2].trim(),
      rounds: fight[3],
      forced,
      ...(forced && forcedBy ? { forcedBy } : {}),
    };
  }
  if (/Flee check: [^.]*— success/.test(fact)) return { outcome: 'escaped', foe: '', rounds: '', forced: false };
  const escaped = fact.match(/Fight: ESCAPED from (.+?) after (\d+ rounds?)/);
  if (escaped) return { outcome: 'escaped', foe: escaped[1]!.trim(), rounds: escaped[2]!, forced: false };
  return null;
}

/** A fight told as over, whoever won ("the fight ended", "the battle was over"). */
const FIGHT_OVER = '(?:fight|battle|combat|struggle|brawl|skirmish) (?:was|is|had|has)? ?(?:over|ended|done|finished)|(?:fight|battle|combat|struggle|brawl|skirmish) ended';

/** Someone in the fight went down, told the same way whichever side it was. */
const WENT_DOWN =
  `went down|goes down|go down|was down|is down|stayed down|fell|fallen|falls|collapsed|crumpled|lay still|lies still|stopped moving|(?:did|could) not (?:get|rise)|(?:knocked|struck|thrown|threw|slammed) (?:\\w+ )?(?:down|out|flat)|beaten|defeated|${FIGHT_OVER}`;

const TERMINAL_WORDS: Record<TerminalFight['outcome'], RegExp> = {
  victory: new RegExp(`\\b(?:${WENT_DOWN}|dead|died|dies|killed|slain|lifeless|limp|corpse|finished (?:it|him|her|them)|victorious|victory|won(?![’']))\\b`, 'i'),
  defeat: new RegExp(`\\b(?:${WENT_DOWN}|lost|blacked out|overpowered|pinned|on the ground)\\b`, 'i'),
  // The pursuers losing the PC is the escape told from their side ("the dead lost the trail and faded").
  escaped: /\b(?:escaped|got away|broke away|broke free|got clear|fled|outran|shook (?:it|him|her|them) off|lost (?:it|him|her|them)|lost (?:the|their|its|his|her) (?:trail|track|scent)|lost track of (?:\w+ )?\w+|left (?:them|it|the \w+) behind)\b/i,
};

/** The beat states the settled fight outcome (foe down / player down / escaped). */
export function beatCarriesTerminalFight(prose: string, fight: TerminalFight): boolean {
  return TERMINAL_WORDS[fight.outcome].test(prose ?? '');
}

const FORCED_ATTEMPT_WORDS: Record<'parley' | 'flee', RegExp> = {
  parley: /\b(?:talk(?:ed|ing)?|words?|spoke|speak|reason(?:ed)?|parley(?:ed)?|bargain(?:ed)?|negotiat\w*|plead(?:ed)?|persuad\w*|convinc\w*|terms|truce|would not listen|wouldn['’]t listen)\b/i,
  flee: /\b(?:flee|fled|run|ran|break away|broke away|bolt(?:ed)?|escape|retreat(?:ed)?|backed away|slip(?:ped)? (?:away|past)|get away|got away|cut off|blocked)\b/i,
};

/** A fight forced by a failed parley or flee: the beat tells that attempt (no forced attempt is always told). */
export function beatCarriesForcedAttempt(prose: string, fight: TerminalFight): boolean {
  if (!fight.forced || !fight.forcedBy) return true;
  return FORCED_ATTEMPT_WORDS[fight.forcedBy].test(prose ?? '');
}

/** Who the painted beat follows: the PC's name and object pronoun ("Jax" / "them"), or "you" / "you". */
export type FightPov = { who: string; him: string };

const capFirst = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** Where the fight was: "at the inn", or "on the open road …" while a journey is underway. */
function fightWhere(where: string, onRoad?: boolean): string {
  return where ? ` ${onRoad ? 'on' : 'at'} ${where}` : '';
}

/** The settled outcome as one plain sentence (foe down, PC down, or got clear). */
export function terminalOutcomeSentence(fight: TerminalFight, pov: FightPov = { who: 'you', him: 'you' }): string {
  const who = capFirst(pov.who);
  if (fight.outcome === 'escaped') return `${who} broke away and got clear.`;
  return fight.outcome === 'victory'
    ? `${capFirst(fight.foe)} went down and did not get up, and the fight was over.`
    : `${who} went down, and the fight was lost.`;
}

/** The failed parley or flee that forced the fight, as one plain sentence ('' when none forced it). */
export function forcedAttemptSentence(fight: TerminalFight, pov: FightPov = { who: 'you', him: 'you' }, where = '', onRoad?: boolean): string {
  if (!fight.forced || !fight.forcedBy) return '';
  const who = capFirst(pov.who);
  const at = fightWhere(where, onRoad);
  return fight.forcedBy === 'parley'
    ? `${who} tried to talk ${fight.foe} down${at}, but ${fight.foe} would not listen and forced the fight.`
    : `${who} tried to break away${at}, but ${fight.foe} would not let ${pov.him} go and forced the fight.`;
}

/** The foe hits on the PC the engine rolled this turn, as one plain sentence ('' when none). */
export function foeHitSentence(engineFact: string | undefined, pov: FightPov = { who: 'you', him: 'you' }): string {
  const hits = [...(engineFact ?? '').matchAll(/(?:^|[.;:\n]\s*)([^.;:\n]*?)\s+(?:hits|lands a critical blow on) you\b([^.;\n]*)/g)];
  if (!hits.length) return '';
  const foe = hits[0]![1]!.trim() || 'the foe';
  // "with a scimitar as you break away" → "with a scimitar".
  const by = hits[0]![2]!.match(/^\s+with\s+[^,]+?(?=\s+as\s+you\b|$)/)?.[0] ?? '';
  return hits.length > 1 ? `${capFirst(foe)} hit ${pov.him} ${hits.length} times.` : `${capFirst(foe)} hit ${pov.him}${by}.`;
}

/** The settled fight as a plain past-tense beat, painted only when the writer returned nothing usable. */
export function terminalFightBeat(
  fight: TerminalFight,
  where: string,
  pov: FightPov = { who: 'you', him: 'you' },
  onRoad?: boolean
): string {
  const at = fightWhere(where, onRoad);
  const who = capFirst(pov.who);
  if (fight.outcome === 'escaped') return `${who} broke away${at} and got clear. Nothing followed ${pov.him} out.`;
  const opener = forcedAttemptSentence(fight, pov, where, onRoad) || `${who} closed with ${fight.foe}${at}.`;
  return `${opener} It lasted ${fight.rounds}. ${terminalOutcomeSentence(fight, pov)}`;
}
