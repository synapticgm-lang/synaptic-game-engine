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

export const COMBAT_STATUS_CONTRADICTION = 'Contradicts the combat status block: follow the engine wound and distance.';

export function engineFactProblems(state: GameState, sentence: string, playerInput = ''): string[] {
  const out: string[] = [];
  const a = recordReadoutProblem(state, sentence, playerInput);
  if (a) out.push(a);
  const b = posesChoiceProblem(state, sentence);
  if (b) out.push(b);
  const c = agencyProblem(state, sentence, playerInput);
  if (c) out.push(c);
  // A PC blow or action the engine did not allow, or a foe hit or miss the fact did not roll.
  if (rollContradiction(sentence, pcSubject(state), engineFact(state))) out.push(ROLL_CONTRADICTION);
  // TT-X1: prose may not contradict stamped combat status facts (wound / distance).
  const facts = state.roundCombat?.statusFacts;
  if (state.engineMode === 'dnd' && facts && facts.length) {
    const low = (sentence ?? '').toLowerCase();
    let hay = ' ';
    for (let hi = 0; hi < low.length; hi++) {
      const code = low.charCodeAt(hi);
      hay += (code >= 97 && code <= 122) || (code >= 48 && code <= 57) ? low[hi]! : ' ';
    }
    hay += ' ';
    for (let i = 0; i < facts.length; i++) {
      const f = facts[i]!;
      const name = f.gateName.toLowerCase();
      if (!hay.includes(` ${name} `) && !hay.includes(` ${name}s `)) continue;
      const w = f.wound;
      if (w !== 'unhurt' && hay.includes(' unhurt ')) out.push(COMBAT_STATUS_CONTRADICTION);
      else if (w !== 'Bloodied' && hay.includes(' bloodied ')) out.push(COMBAT_STATUS_CONTRADICTION);
      else if (w !== 'near death' && hay.includes(' near death ')) out.push(COMBAT_STATUS_CONTRADICTION);
      else if (w !== 'hurt' && hay.includes(' hurt ') && !hay.includes(' unhurt ')) out.push(COMBAT_STATUS_CONTRADICTION);
      if (f.distanceFt > 5 && hay.includes(' within 5 ') && hay.includes(` ${name} `)) {
        out.push(COMBAT_STATUS_CONTRADICTION);
      }
    }
  }
  return out;
}
