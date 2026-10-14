/**
 * tt-fix-2 — sentence checks against the turn's engine fact (`completedEvent.engineResult`). The writer tells
 * what happened; it does not read the travel or quest record aloud, pose the player's next choice, or tell a
 * fight roll the engine did not make. Each check is one sentence's reason line for the existing sentence
 * repair (`repairRejectedSentences`): one rewrite against the fact, else the sentence leaves the page.
 * Spoken lines (in quotes) are a person talking, not the narrator, and are not checked.
 */
import type { GameState } from './types';

export const RECORD_READOUT = 'Reads out the travel or quest record: show the road or the step, not the bookkeeping.';
export const POSES_CHOICE = "Poses the player's next choice: end on what is in front of them, not on what they must decide.";
export const ROLL_CONTRADICTION = 'Tells a fight roll the engine did not make: follow the fight fact hit for hit.';

const QUOTED = /["“][^"”]*["”]/g;
const narration = (s: string) => (s ?? '').replace(QUOTED, ' ');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Leg counts and trip durations are the travel record; the road itself is the story. */
const TRAVEL_RECORD = [
  /\blegs? (?:one|two|three|four|\d+) of (?:one|two|three|four|\d+)\b/i,
  /\b(?:first|second|third|fourth|final|last|next) leg of the (?:journey|trip|travel|road|route|walk)\b/i,
  /\btravel (?:leg|record|log)\b/i,
  /\bthe (?:travel|journey|trip|walk) (?:had )?(?:took|taken|added|cost)\b/i,
  /\btravel(?:l?ed)? for (?:about |nearly |some |another )?(?:\w+ )?(?:minutes?|hours?)\b/i,
  /\b(?:half|part) of the travel\b/i,
];

function pcName(state: GameState): string {
  const n = (state.character?.name ?? '').trim();
  return n.length >= 2 ? n : '';
}

function pcSubject(state: GameState): string {
  const n = pcName(state);
  return n ? `(?:${esc(n)}|you)` : 'you';
}

/** A sentence that reads out the trip's legs or time, or names an open quest step the page never showed. */
export function recordReadoutProblem(state: GameState, sentence: string, playerInput = ''): string | null {
  const s = narration(sentence);
  if (TRAVEL_RECORD.some((re) => re.test(s))) return RECORD_READOUT;
  return questStepLeak(state, s, playerInput) ? RECORD_READOUT : null;
}

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'your', 'their', 'his', 'her', 'its', 'are', 'was', 'were', 'has', 'have', 'had', 'what', 'who', 'any', 'all', 'out', 'off', 'not']);
const wordsOf = (s: string) => (s.toLowerCase().match(/[a-z][a-z'’-]+/g) ?? []);

/** Three content words in a row from an open quest step: the step's own clue, given away. */
function stepRuns(desc: string): string[] {
  const w = wordsOf(desc);
  const out: string[] = [];
  for (let i = 0; i + 3 <= w.length; i += 1) {
    const run = w.slice(i, i + 3);
    if (run.every((x) => x.length >= 3 && !STOP.has(x))) out.push(run.join(' '));
  }
  return out;
}

function questStepLeak(state: GameState, sentence: string, playerInput: string): boolean {
  const open = (state.quests ?? [])
    .filter((q) => q.revealed && q.status === 'active')
    .flatMap((q) => (q.objectives ?? []).filter((o) => !o.completed).map((o) => o.description));
  if (!open.length) return false;
  const said = ` ${wordsOf(sentence).join(' ')} `;
  const known = ` ${wordsOf([
    playerInput,
    state.completedEvent?.engineResult ?? '',
    ...(state.log ?? []).map((e) => String(e.content ?? '')),
  ].join(' ')).join(' ')} `;
  return open.some((desc) => stepRuns(desc).some((run) => said.includes(` ${run} `) && !known.includes(` ${run} `)));
}

/** A sentence that leaves the player's decision hanging in the narration instead of ending on the scene. */
export function posesChoiceProblem(state: GameState, sentence: string): string | null {
  const s = narration(sentence);
  const who = pcSubject(state);
  const pose = [
    new RegExp(`\\b${who} (?:has|had|have|needs?|needed|must|was left) to (?:decide|choose)\\b`, 'i'),
    new RegExp(`\\bwhether (?:or not )?${who}\\b[^.!?]*\\bor\\b`, 'i'),
    new RegExp(`\\bwaits? for ${who} to (?:decide|choose|face|act|answer)\\b`, 'i'),
    /\bthe (?:question|choice|decision) (?:is|was|now|remains|remained) (?:whether|if|which)\b/i,
    /\b(?:a|the) (?:choice|decision)\b[^.!?]*\b(?:waits?|waited|awaits?|awaited|stood|stands|lay|lies) (?:before|for|ahead)\b/i,
  ];
  return pose.some((re) => re.test(s)) ? POSES_CHOICE : null;
}

/** What the fight fact says the PC and the foes did this turn. */
export function fightRolls(engineResult: string | undefined | null) {
  const f = engineResult ?? '';
  const isFight = /\bFight:|ENGINE OUTCOME|\battacks you\b|\bhits you\b|\bYou attack\b|\bYou hit\b|\bunconscious\b|\bdeath save\b/i.test(f);
  return {
    isFight,
    pcLanded: /\bYou (?:hit|land a critical blow on|cast)\b|\bYour blow carries\b|\bEven your miss clips\b|\bonly partly escapes\b/.test(f),
    pcCannotAct: /\bcannot move, speak or act\b|\bYou are dead\b|\bYour breath stops\b|\bYou cannot move or act\b/.test(f),
    foeHits: (f.match(/\b(?:hits|lands a critical blow on) you\b/g) ?? []).length,
    foeMisses: (f.match(/\battacks you\b[^.]*\band misses\b/g) ?? []).length,
  };
}

const NOT_A_FOE = '(?!\\s+(?:the\\s+|a\\s+)?(?:ground|floor|dirt|mud|earth|stone|stones|wall|road|nothing|air|only))';

/** A sentence telling a PC blow the engine did not land, or a miss on the PC when every foe attack hit. */
export function rollContradictionProblem(state: GameState, sentence: string): string | null {
  const rolls = fightRolls(state.completedEvent?.engineResult);
  if (!rolls.isFight) return null;
  const s = narration(sentence);
  const who = pcSubject(state);
  if (!rolls.pcLanded || rolls.pcCannotAct) {
    const strike = new RegExp(
      `\\b${who}(?:['’]s|r)?\\s+(?:\\w+\\s+){0,2}?(?:struck|strikes|hit|hits|landed|lands|connected|connects|slashed|slashes|stabbed|stabs|pierced|pierces|wounded|wounds|sliced|slices)\\b${NOT_A_FOE}`,
      'i'
    );
    if (strike.test(s)) return ROLL_CONTRADICTION;
  }
  if (rolls.foeHits > 0 && rolls.foeMisses === 0) {
    if (new RegExp(`\\b(?:missed|misses|went wide of|glanced off)\\s+${who}\\b`, 'i').test(s)) return ROLL_CONTRADICTION;
  }
  return null;
}

/** The fight fact's hits on the PC that the whole beat never shows (a dropped roll). */
export function dropsFightRoll(state: GameState, prose: string): boolean {
  if (state.engineMode !== 'dnd') return false;
  const rolls = fightRolls(state.completedEvent?.engineResult);
  if (!rolls.isFight || rolls.foeHits === 0) return false;
  return !/\b(?:hit|hits|struck|strikes|bit|bites|bitten|cut|cuts|wound\w*|blood\w*|pain\w*|slash\w*|gash\w*|tore|tears?|sank|sinks|pierc\w*|stab\w*|slam\w*|crack\w*|knock\w*|fell|falls?|collaps\w*|drops?|dropped|reel\w*|stagger\w*|burn\w*|sting\w*|ache\w*|hurt\w*)\b/i.test(
    narration(prose)
  );
}

export function engineFactProblems(state: GameState, sentence: string, playerInput = ''): string[] {
  return [
    recordReadoutProblem(state, sentence, playerInput),
    posesChoiceProblem(state, sentence),
    rollContradictionProblem(state, sentence),
  ].filter((p): p is string => !!p);
}
