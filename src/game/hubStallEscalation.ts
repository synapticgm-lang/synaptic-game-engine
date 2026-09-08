/**
 * Batch 08f — hub stall escalation (ArcDirector + choice pad).
 * Hash(HERE, inventory signature, quest signature); consecutive no-delta turns:
 *   T3: prune ambient; leave exits + active quest pads
 *   T4+: inject Tag&Trigger / travel / rumor / environmental progression BEFORE ambush
 * Ambush ONLY if turns_since_last_combat >= drought limit AND peril>0.
 */

import type { GameState } from './types';
import { tagTriggerPads } from './tagTrigger';
import { isAmbientStylePad } from './padExhaustion';
import { hubsForBibleId, matchHub } from './outdoorHubs';

/** Local drought mirror — avoid circular import with arcDirector. */
function droughtReady(state: GameState): boolean {
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return false;
  if (state.engineMode === 'pyoa') return false;
  const kill = state.sceneFacts?.lastKill;
  if (kill?.remains && state.turn - (kill.turn ?? 0) <= 1) return false;
  const turnsSinceLast = state.arcDirector?.turnsSinceCombatReceipt ?? state.turn;
  const mode = state.engineMode;
  if (mode === 'rpg') return turnsSinceLast >= (state.turn < 25 ? 15 : 20);
  if (state.turn < 25) {
    const cadence = mode === 'dnd' ? 12 : 8;
    return turnsSinceLast >= cadence;
  }
  return turnsSinceLast >= (mode === 'dnd' ? 15 : 12);
}

export type HubStallPhase = 'none' | 'prune' | 'progress' | 'ambush';

export type HubStallSnapshot = {
  hash: string;
  consecutiveNoDelta: number;
  phase: HubStallPhase;
  peril: number;
};

function invSig(state: GameState): string {
  const items = (state.inventory ?? [])
    .map((i) => String(i?.name ?? i?.id ?? '').toLowerCase().trim())
    .filter(Boolean)
    .sort();
  return items.slice(0, 24).join('|');
}

function questSig(state: GameState): string {
  const qs = (state.quests ?? [])
    .filter((q) => q && (q.status === 'active' || q.status === 'revealed' || !q.status))
    .map((q) => `${q.id ?? q.title}:${q.stage ?? q.objectiveIndex ?? 0}`)
    .sort();
  return qs.slice(0, 12).join('|');
}

export function hubStallHash(state: GameState): string {
  const here = String(state.currentLocation ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return `${here}::${invSig(state)}::${questSig(state)}`;
}

/** Crude peril: outdoor hub with no lastKill cooldown + not alone empty ruin. */
export function hubPerilScore(state: GameState): number {
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return 0;
  if (state.engineMode === 'pyoa') return 0;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const atHub = !!matchHub(hubs, state.currentLocation);
  if (!atHub) return 0;
  const kill = state.sceneFacts?.lastKill;
  if (kill?.remains && state.turn - (kill.turn ?? 0) <= 2) return 0;
  const crowd = String(state.sceneFacts?.crowd ?? '').toLowerCase();
  if (crowd === 'none' || crowd === 'alone') return 1;
  return 2;
}

export function readHubStall(state: GameState): HubStallSnapshot {
  const mem = state.sceneFacts?.hubStall;
  const hash = hubStallHash(state);
  if (!mem || mem.hash !== hash) {
    return { hash, consecutiveNoDelta: 0, phase: 'none', peril: hubPerilScore(state) };
  }
  const n = mem.consecutiveNoDelta ?? 0;
  const peril = hubPerilScore(state);
  let phase: HubStallPhase = 'none';
  if (n >= 4) {
    phase = droughtReady(state) && peril > 0 ? 'ambush' : 'progress';
  } else if (n >= 3) {
    phase = 'prune';
  }
  return { hash, consecutiveNoDelta: n, phase, peril };
}

/** Call after each committed turn — bump or reset consecutive no-delta. */
export function tickHubStall(state: GameState, opts?: { hadDelta?: boolean }): GameState {
  const hash = hubStallHash(state);
  const prev = state.sceneFacts?.hubStall;
  let consecutive = 0;
  if (opts?.hadDelta) {
    consecutive = 0;
  } else if (prev?.hash === hash) {
    consecutive = (prev.consecutiveNoDelta ?? 0) + 1;
  } else {
    consecutive = 1;
  }
  const snap = readHubStall({
    ...state,
    sceneFacts: {
      ...state.sceneFacts!,
      hubStall: { hash, consecutiveNoDelta: consecutive },
    },
  });
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
      hubStall: {
        hash,
        consecutiveNoDelta: consecutive,
        phase: snap.phase,
      },
    },
  };
}

export function isProgressionOrExitPad(label: string): boolean {
  return /\b(travel|leave|exit|walk away|quest|claim|rumor|ask about the bounty|look for a way|follow the sound|check the board|press on|head toward|return to)\b/i.test(
    label
  );
}

/** T3+: drop ambient; keep exits + quest/tag pads. */
export function pruneAmbientForStall(choices: string[], phase: HubStallPhase): string[] {
  if (phase !== 'prune' && phase !== 'progress' && phase !== 'ambush') return choices;
  return choices.filter((c) => !isAmbientStylePad(c) || isProgressionOrExitPad(c));
}

/** T4+ progression pads injected before ambush. */
export function hubProgressionPads(state: GameState): string[] {
  const pads: string[] = [];
  for (const t of tagTriggerPads(state)) pads.push(t);
  pads.push('Ask about a rumor at the board');
  pads.push('Follow a new sound down the lane');
  pads.push('Look for a way out of this spot');
  const hubs = hubsForBibleId(state.campaignBibleId);
  const here = String(state.currentLocation ?? '').toLowerCase();
  for (const h of hubs) {
    if (!h.name || h.name.toLowerCase() === here) continue;
    pads.push(`Travel toward ${h.name}`);
    break;
  }
  return pads.slice(0, 4);
}

export function shouldForceHubAmbush(state: GameState): boolean {
  const snap = readHubStall(state);
  return snap.phase === 'ambush' && droughtReady(state) && snap.peril > 0;
}
