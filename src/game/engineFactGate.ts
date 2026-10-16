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

/** A sentence that pastes the travel record (leg list / trip time). Quest steps stay off the packet; word-overlap is not a gate. */
export function recordReadoutProblem(state: GameState, sentence: string, _playerInput = ''): string | null {
  return travelRecordRead(sentence, engineFact(state)) ? RECORD_READOUT : null;
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
    // A PC blow or action the engine did not allow, or a foe hit or miss the fact did not roll.
    rollContradiction(sentence, pcSubject(state), engineFact(state)) ? ROLL_CONTRADICTION : null,
  ].filter((p): p is string => !!p);
}
