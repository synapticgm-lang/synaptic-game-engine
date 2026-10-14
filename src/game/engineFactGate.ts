/**
 * tt-fix-2 — sentence checks against the turn's engine fact (`completedEvent.engineResult`). The writer tells
 * what happened; it does not read the travel or quest record aloud, pose the player's next choice, decide the
 * PC's mind, or tell a fight roll the engine did not make. Each check is one sentence's reason line for the
 * existing sentence repair (`repairRejectedSentences`): one rewrite against the fact, else the sentence leaves the page.
 * Spoken lines (in quotes) are a person talking, not the narrator, and are not checked.
 * tt-fix-3 — the patterns live in `engineFactPatterns.ts`, shared with `scripts/factCheck.mjs`.
 */
import type { GameState } from './types';
import {
  agencyPatterns,
  choicePosePatterns,
  escRe,
  fightRolls as readFightRolls,
  HIT_WORDS,
  narrationOf,
  pcSpeechPatterns,
  playerLineSpeaks,
  questStepLeak,
  questTitleNamed,
  rollContradiction,
  travelRecordRead,
} from './engineFactPatterns';

export const RECORD_READOUT = 'Reads out the travel or quest record: show the road or the step, not the bookkeeping.';
export const POSES_CHOICE = "Poses the player's next choice: end on what is in front of them, not on what they must decide.";
export const ROLL_CONTRADICTION = 'Tells a fight roll the engine did not make: follow the fight fact hit for hit.';
export const PC_AGENCY = "Decides the player character's feeling or mind: show the scene and let the player decide.";

function pcName(state: GameState): string {
  const n = (state.character?.name ?? '').trim();
  return n.length >= 2 ? n : '';
}

function pcSubject(state: GameState): string {
  const n = pcName(state);
  return n ? `(?:${escRe(n)}|you)` : 'you';
}

const engineFact = (state: GameState) => state.completedEvent?.engineResult ?? '';

function openQuests(state: GameState) {
  return (state.quests ?? []).filter((q) => q.revealed && q.status === 'active');
}

/** A sentence that reads out the trip's legs or time, names a quest's title, or gives away an open quest step. */
export function recordReadoutProblem(state: GameState, sentence: string, playerInput = ''): string | null {
  if (travelRecordRead(sentence, engineFact(state))) return RECORD_READOUT;
  const quests = openQuests(state);
  const titles = quests.map((q) => q.name ?? '');
  if (questTitleNamed(titles, sentence)) return RECORD_READOUT;
  const steps = quests.flatMap((q) => (q.objectives ?? []).filter((o) => !o.completed).map((o) => o.description));
  if (!steps.length) return null;
  const known = [playerInput, engineFact(state), ...(state.log ?? []).map((e) => String(e.content ?? ''))].join(' ');
  return questStepLeak(steps, sentence, known, pcName(state)) ? RECORD_READOUT : null;
}

/** A sentence that leaves the player's decision hanging in the narration instead of ending on the scene. */
export function posesChoiceProblem(state: GameState, sentence: string): string | null {
  const s = narrationOf(sentence);
  return choicePosePatterns(pcSubject(state)).some((re) => re.test(s)) ? POSES_CHOICE : null;
}

/** A sentence in which the narrator decides what the PC feels, is sure of, or likes. */
export function agencyProblem(state: GameState, sentence: string, playerInput?: string): string | null {
  const s = narrationOf(sentence);
  if (agencyPatterns(pcSubject(state)).some((re) => re.test(s))) return PC_AGENCY;
  // The PC speaks only when the player's line is speech; a Dodge or a Wait gives them no words.
  const silent = state.engineMode === 'dnd' && !!playerInput?.trim() && !playerLineSpeaks(playerInput);
  return silent && pcSpeechPatterns(pcSubject(state)).some((re) => re.test(s)) ? PC_AGENCY : null;
}

/** What the fight fact says the PC and the foes did this turn. */
export const fightRolls = readFightRolls;

/** A sentence telling a PC blow or action the engine did not allow, or a foe hit or miss the fact did not roll. */
export function rollContradictionProblem(state: GameState, sentence: string): string | null {
  return rollContradiction(sentence, pcSubject(state), engineFact(state)) ? ROLL_CONTRADICTION : null;
}

/** The fight fact's hits on the PC that the whole beat never shows (a dropped roll). */
export function dropsFightRoll(state: GameState, prose: string): boolean {
  if (state.engineMode !== 'dnd') return false;
  const rolls = readFightRolls(engineFact(state));
  if (!rolls.isFight || rolls.foeHits === 0) return false;
  return !HIT_WORDS.test(narrationOf(prose));
}

export function engineFactProblems(state: GameState, sentence: string, playerInput = ''): string[] {
  return [
    recordReadoutProblem(state, sentence, playerInput),
    posesChoiceProblem(state, sentence),
    agencyProblem(state, sentence, playerInput),
    rollContradictionProblem(state, sentence),
  ].filter((p): p is string => !!p);
}
