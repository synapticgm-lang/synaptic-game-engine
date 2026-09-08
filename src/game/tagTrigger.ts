/**
 * Batch 08c — thin Tag & Trigger stub (Option 2 / MUD-modern).
 *
 * SHIPPED (real):
 * - On Summoned Pact combat clear (justKilled / CLEAR receipt), write
 *   `sgm.sp.skirmishClearBounty` into sceneFacts.worldTags.
 * - When that tag is set and the player is at Lowmarket (or any SP outdoor hub),
 *   ChoiceCompiler adds one pad: "Claim Lowmarket bounty".
 * - Claiming the pad consumes the tag and appends a STATUS receipt line.
 *
 * STUB (not this batch):
 * - Full JSON bible matrices of tags × hubs × pads for all premades.
 * - Multi-step bounty quest FSM / gold pay / faction deltas beyond a receipt line.
 * - Cross-mode generic worldFlags table UI.
 *
 * See docs/research/tag-trigger-stub-2026-09-08c.md
 */

import type { GameState } from './types';
import type { CompletedEventPacket } from './completedEventPacket';
import { hubsForBibleId, matchHub } from './outdoorHubs';

export const TAG_SKIRMISH_BOUNTY = 'sgm.sp.skirmishClearBounty';
export const CLAIM_BOUNTY_PAD = 'Claim Lowmarket bounty';

function bibleId(state: GameState): string {
  return String(state.campaignBibleId ?? '').trim();
}

function tagsOf(state: GameState): string[] {
  const raw = state.sceneFacts?.worldTags;
  return Array.isArray(raw) ? raw.filter((t): t is string => typeof t === 'string' && !!t.trim()) : [];
}

export function hasWorldTag(state: GameState, tag: string): boolean {
  return tagsOf(state).includes(tag);
}

export function withWorldTag(state: GameState, tag: string): GameState {
  const prev = tagsOf(state);
  if (prev.includes(tag)) return state;
  return {
    ...state,
    sceneFacts: {
      crowd: state.sceneFacts?.crowd ?? 'unknown',
      noise: state.sceneFacts?.noise ?? 'unknown',
      present: state.sceneFacts?.present ?? [],
      props: state.sceneFacts?.props ?? [],
      lastBeat: state.sceneFacts?.lastBeat ?? '',
      updatedTurn: state.turn,
      ...state.sceneFacts,
      worldTags: [...prev, tag],
    },
  };
}

export function withoutWorldTag(state: GameState, tag: string): GameState {
  const next = tagsOf(state).filter((t) => t !== tag);
  if (next.length === tagsOf(state).length) return state;
  return {
    ...state,
    sceneFacts: {
      crowd: state.sceneFacts?.crowd ?? 'unknown',
      noise: state.sceneFacts?.noise ?? 'unknown',
      present: state.sceneFacts?.present ?? [],
      props: state.sceneFacts?.props ?? [],
      lastBeat: state.sceneFacts?.lastBeat ?? '',
      updatedTurn: state.turn,
      ...state.sceneFacts,
      worldTags: next,
    },
  };
}

/** Write bounty tag after a Summoned Pact skirmish clear. */
export function applyCombatClearTag(
  state: GameState,
  packet?: CompletedEventPacket | null
): GameState {
  if (bibleId(state) !== 'summoned-pact') return state;
  const cleared =
    packet?.justKilled === true
    || packet?.outcome === 'killed'
    || (!!state.sceneFacts?.lastKill?.remains
      && state.sceneFacts.lastKill.outcome === 'victory'
      && state.sceneFacts.lastKill.turn === state.turn);
  if (!cleared) return state;
  return withWorldTag(state, TAG_SKIRMISH_BOUNTY);
}

function atSummonedPactHub(state: GameState): boolean {
  if (bibleId(state) !== 'summoned-pact') return false;
  const hubs = hubsForBibleId('summoned-pact');
  const loc = String(state.currentLocation ?? '').trim();
  if (!loc) return false;
  return !!matchHub(hubs, loc);
}

/**
 * Extra pads when a world tag is live. Only Lowmarket/SP hubs for the stub.
 * Prefer Claim pad at Lowmarket; other hubs get a softer "Ask about the bounty board".
 */
export function tagTriggerPads(state: GameState): string[] {
  if (!hasWorldTag(state, TAG_SKIRMISH_BOUNTY)) return [];
  if (!atSummonedPactHub(state)) return [];
  const hubs = hubsForBibleId('summoned-pact');
  const loc = String(state.currentLocation ?? '').trim();
  const hub = matchHub(hubs, loc);
  if (hub?.id === 'sp-hub-lowmarket' || /lowmarket/i.test(loc)) {
    return [CLAIM_BOUNTY_PAD];
  }
  return ['Ask about the bounty board'];
}

export function isClaimBountyPad(label: string): boolean {
  return /claim\s+lowmarket\s+bounty/i.test(label) || /ask about the bounty board/i.test(label);
}

/**
 * Consume tag when player picks the claim pad. Returns receipt line if consumed.
 */
export function consumeTagTriggerOnInput(
  state: GameState,
  playerInput: string
): { state: GameState; receipt?: string } {
  if (!hasWorldTag(state, TAG_SKIRMISH_BOUNTY)) return { state };
  if (!isClaimBountyPad(playerInput)) return { state };
  const next = withoutWorldTag(state, TAG_SKIRMISH_BOUNTY);
  return {
    state: next,
    receipt: 'BOUNTY: claimed (Lowmarket board) — stub pay',
  };
}
