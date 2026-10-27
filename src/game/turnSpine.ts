/**
 * M3 — one engine-owned turn spine for Fate and live useGame.
 *
 * Order per turn (idea from proto/engine.mjs resolveTurn ~313; not a code copy):
 *   read steps (M2 parsePlayerSteps via resolveTypedFreeText)
 *   → resolve each step in order through the engine (checks, attacks, moves, deals, speech)
 *     with SRD 5.2.1 action economy in fights
 *   → commit state (lastAddressee + receipts)
 *   → caller builds FactSheet (M1) → TurnLog (M1) → writer
 *
 * Free text is never rejected. Only the engine rolls dice.
 * M6 — steal (Sleight of Hand vs Passive Perception) and parley (social Influence + M5 DC)
 * resolve as real engine actions on the step slots.
 */
import type { GameState } from './types';
import type { EconomySlot, EconomyUsed } from './actionEconomy';
import { freshEconomy } from './actionEconomy';
import type { IntentRead, StepResolution } from './intentParser';
import { resolveTypedFreeText, type TypedFreeTextResult } from './typedFreeText';
import { diceRollsFromReceipts, type TurnLogDiceRoll } from './turnLog';

export interface TurnSpineResult {
  /** State with lastAddressee stamped when the reader carried one. */
  state: GameState;
  receipts: string[];
  engineResult: string;
  intentRead?: IntentRead;
  stepResults: StepResolution[];
  /** Dice harvested from engine receipts this spine pass. */
  diceRolls: TurnLogDiceRoll[];
  /** Slots spent this round (fights); speech never increments. */
  economyUsed: EconomyUsed;
  /** Compact reader rows for FactSheet / completed-event packet. */
  readerStepResults: Array<{
    tried: string;
    done: boolean;
    reason: string;
    economySlot?: EconomySlot;
  }>;
}

function stampAddressee(state: GameState, who: string | null | undefined): GameState {
  if (!who || !state.sceneFacts) return state;
  return {
    ...state,
    sceneFacts: { ...state.sceneFacts, lastAddressee: who },
  };
}

function economyFromSteps(steps: StepResolution[]): EconomyUsed {
  const used = freshEconomy();
  for (const s of steps) {
    const slot = s.economySlot;
    if (!slot || slot === 'speech' || !s.done) continue;
    used[slot] = (used[slot] ?? 0) + 1;
  }
  return used;
}

/**
 * Shared engine pass before FactSheet / TurnLog / writer.
 * Same function for Fate autoplay and live useGame sendAction.
 */
export function runTurnSpine(state: GameState, input: string): TurnSpineResult {
  const typed: TypedFreeTextResult = resolveTypedFreeText(state, input);
  const stepResults = typed.stepResults ?? [];
  const base = typed.state ?? state;
  const next = stampAddressee(base, typed.lastAddressee);
  const receipts = typed.receipts ?? [];
  const diceRolls = diceRollsFromReceipts([
    ...receipts,
    typed.engineResult,
    ...stepResults.map((s) => s.engineResult),
  ]);
  const readerStepResults = stepResults.map((s) => ({
    tried: s.tried,
    done: s.done,
    reason: s.reason,
    ...(s.economySlot ? { economySlot: s.economySlot } : {}),
  }));
  return {
    state: next,
    receipts,
    engineResult: typed.engineResult,
    intentRead: typed.intentRead,
    stepResults,
    diceRolls,
    economyUsed: economyFromSteps(stepResults),
    readerStepResults,
  };
}
