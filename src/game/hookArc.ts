/**
 * HookArc — soft-offer guard.
 * Offers (ads, packs, beauty taps) only after identity → meaningful choice → visible consequence.
 * Never mid-combat / mid-error / before opening complete.
 */

import type { GameState } from './types';
import { adsKilled } from './opsKillSwitches';

export type HookArcStage =
  | 'pre_identity'
  | 'identity'
  | 'first_choice'
  | 'consequence'
  | 'open';

export interface HookArcState {
  stage: HookArcStage;
  identityDone: boolean;
  firstChoiceDone: boolean;
  consequenceSeen: boolean;
  updatedTurn: number;
}

export function emptyHookArc(): HookArcState {
  return {
    stage: 'pre_identity',
    identityDone: false,
    firstChoiceDone: false,
    consequenceSeen: false,
    updatedTurn: 0,
  };
}

function hasIdentity(state: GameState): boolean {
  const name = state.character?.name?.trim() ?? '';
  if (!name || /^(survivor|adventurer|hero|player|you)$/i.test(name)) {
    // Still ok if opening marked complete with answers
    const answers = state.openingEstablishment?.answers;
    if (answers?.name || answers?.appearance || answers?.kit) return true;
    return state.openingEstablishment?.complete === true;
  }
  return true;
}

function hasFirstChoice(state: GameState): boolean {
  const playerTurns = (state.log ?? []).filter((e) => e.role === 'player').length;
  return playerTurns >= 1 || (state.turn ?? 0) >= 1;
}

function hasConsequence(state: GameState): boolean {
  if ((state.stateTxLog ?? []).length > 0) return true;
  if ((state.campaignMemory?.pins ?? []).length > 0) return true;
  // Story progressed past opening
  return (state.turn ?? 0) >= 2 && state.openingEstablishment?.complete === true;
}

export function deriveHookArc(state: GameState): HookArcState {
  const identityDone = hasIdentity(state);
  const firstChoiceDone = hasFirstChoice(state);
  const consequenceSeen = hasConsequence(state);
  let stage: HookArcStage = 'pre_identity';
  if (!identityDone) stage = 'pre_identity';
  else if (!firstChoiceDone) stage = 'identity';
  else if (!consequenceSeen) stage = 'consequence';
  else stage = 'open';

  return {
    stage,
    identityDone,
    firstChoiceDone,
    consequenceSeen,
    updatedTurn: state.turn,
  };
}

export function withUpdatedHookArc(state: GameState): GameState {
  return { ...state, hookArc: deriveHookArc(state) };
}

export interface SoftOfferContext {
  contentMode?: string | null;
  midCombat?: boolean;
  midError?: boolean;
  busy?: boolean;
}

/**
 * Soft offers (ads, pack CTAs after out-of-turns, beauty prompts) require HookArc open
 * and safe scene boundary.
 */
export function canSoftOffer(state: GameState | null | undefined, ctx: SoftOfferContext = {}): boolean {
  if (!state) return false;
  if (adsKilled() && ctx.contentMode !== 'force') {
    // ads kill switch is checked by callers for ads; still gate pack soft-ups on HookArc
  }
  if (ctx.midCombat || ctx.midError || ctx.busy) return false;
  if (state.activeEncounter) return false;
  if (state.pendingTurn) return false;
  if (state.pendingContentRewrite) return false;
  if (state.openingEstablishment && !state.openingEstablishment.complete) return false;

  const arc = state.hookArc ?? deriveHookArc(state);
  return arc.stage === 'open';
}

/** Prompt-facing one-liner for debugging / Expert. */
export function formatHookArcStatus(state: GameState): string {
  const arc = state.hookArc ?? deriveHookArc(state);
  return `HookArc: ${arc.stage} (identity=${arc.identityDone} choice=${arc.firstChoiceDone} consequence=${arc.consequenceSeen})`;
}
