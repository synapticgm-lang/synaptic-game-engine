/**
 * 29a Encounter Terminal FSM — code owns clear; GM narrates.
 * idle → engaged → resolving → terminal → idle (ledger retained via receipts).
 */

import type { ActiveEncounter, EngineMode, GameState } from './types.ts';

export type EncounterPhase = 'engaged' | 'resolving' | 'terminal';
export type TerminalOutcome =
  | 'escape'
  | 'victory'
  | 'defeat'
  | 'capture'
  | 'parleyResolved';

export interface EncounterClearedReceipt {
  encounterId: string;
  outcome: TerminalOutcome;
  turn: number;
  resolutionReason: string;
  engagedTurnCount: number;
  failedFleeCount: number;
  failedParleyCount: number;
  name: string;
}

export interface EncounterCaps {
  maxEngagedTurns: number;
  maxFailedFlee: number;
  maxFailedParley: number;
}

export function encounterCapsForMode(mode: EngineMode | undefined): EncounterCaps {
  if (mode === 'dnd') {
    return { maxEngagedTurns: 10, maxFailedFlee: 2, maxFailedParley: 2 };
  }
  // LitRPG default; RPG/PYOA reuse short combat caps if a combat encounter exists
  return { maxEngagedTurns: 8, maxFailedFlee: 2, maxFailedParley: 1 };
}

export function initEncounterTerminal(
  enc: ActiveEncounter,
  state: GameState,
  opts?: { forcedSpawnKey?: string; source?: string }
): ActiveEncounter {
  const caps = encounterCapsForMode(state.engineMode);
  const id =
    enc.encounterId ??
    `enc-${state.turn}-${(enc.name || 'threat').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;
  return {
    ...enc,
    encounterId: id,
    phase: enc.phase ?? 'engaged',
    startedTurn: enc.startedTurn ?? state.turn,
    engagedTurnCount: enc.engagedTurnCount ?? 0,
    failedFleeCount: enc.failedFleeCount ?? 0,
    failedParleyCount: enc.failedParleyCount ?? 0,
    maxEngagedTurns: enc.maxEngagedTurns ?? caps.maxEngagedTurns,
    maxFailedFlee: enc.maxFailedFlee ?? caps.maxFailedFlee,
    maxFailedParley: enc.maxFailedParley ?? caps.maxFailedParley,
    source: enc.source ?? opts?.source ?? 'arcDirector',
    forcedSpawnKey: enc.forcedSpawnKey ?? opts?.forcedSpawnKey,
  };
}

function isFleeIntent(input: string): boolean {
  return /\b(flee|run away|escape|retreat|withdraw|bolt)\b/i.test(input);
}

function isParleyIntent(input: string): boolean {
  return /\b(parley|negotiate|talk (?:it|them) down|surrender|truce|bargain)\b/i.test(input);
}

function isAttackIntent(input: string): boolean {
  return /\b(attack|fight|strike|press the attack|engage|slash|stab|shoot|cast|punch|fists?|continue (?:the )?(?:assault|attack|pressing)|follow-up strike|lash out)\b/i.test(input);
}

/** Idle under threat: loot / scout / wait / room inspect — must not farm max_engaged victory XP. */
export function isEncounterIdleIntent(input: string): boolean {
  const t = (input ?? '').trim();
  if (!t) return true;
  if (isAttackIntent(t) || isFleeIntent(t) || isParleyIntent(t)) return false;
  return (
    /\b(open|check|search|loot|rummage|scavenge)\b/i.test(t)
    || /\b(crate|chest|box|barrel|trunk|bag|pockets?)\b/i.test(t)
    || /\b(scout|wait|watch|look around|examine the (?:room|area)|inspect the (?:room|area)|get (?:your )?bearings)\b/i.test(t)
    || /\b(travel|go to|head to|browse|merchant|shop)\b/i.test(t)
  );
}

export function fleeAvailable(enc: ActiveEncounter | null | undefined): boolean {
  if (!enc || enc.phase === 'resolving' || enc.phase === 'terminal') return false;
  if (enc.caught) return false;
  return (enc.failedFleeCount ?? 0) < (enc.maxFailedFlee ?? 2);
}

export function parleyAvailable(enc: ActiveEncounter | null | undefined): boolean {
  if (!enc || enc.phase === 'resolving' || enc.phase === 'terminal') return false;
  return (enc.failedParleyCount ?? 0) < (enc.maxFailedParley ?? 1);
}

function resolveForcedOutcome(enc: ActiveEncounter, reason: string): TerminalOutcome {
  if (enc.hp <= 0) return 'victory';
  if (reason === 'flee_success') return 'escape';
  if (reason === 'parley_success') return 'parleyResolved';
  if (reason === 'flee_cap') {
    // Batch W — caught, not escaped. Stay engaged until fight/parley/victory.
    return 'victory';
  }
  if (reason === 'max_engaged') {
    // Batch X — clock clear is victory on the ledger, never a free escape.
    return 'victory';
  }
  if (reason === 'parley_cap') return 'victory';
  return 'victory';
}

export interface TickEncounterResult {
  state: GameState;
  cleared?: EncounterClearedReceipt;
  receipts: string[];
  forcedTerminal: boolean;
  /** 29b — XP awarded on clear (victory / costly escape / parley). */
  xpAward?: { amount: number; reason: string };
}

/** Turns before the same forcedSpawnKey may re-engage after a clear. */
export const ENCOUNTER_REENGAGE_COOLDOWN = 12;

/**
 * Tick encounter FSM on accepted player input while engaged.
 * Successful flee/parley/kill clear immediately; caps force terminal.
 */
export function tickEncounterTerminal(
  state: GameState,
  playerInput: string,
  opts?: {
    fleeSucceeded?: boolean;
    enemyDead?: boolean;
    playerDead?: boolean;
    /** Batch F — explicit ledger success (not unearned free-clear). */
    parleySucceeded?: boolean;
  }
): TickEncounterResult {
  const enc0 = state.activeEncounter;
  if (!enc0) return { state, receipts: [], forcedTerminal: false };

  let enc = initEncounterTerminal(enc0, state);
  const receipts: string[] = [];
  const input = playerInput || '';

  if (opts?.playerDead) {
    return commitClear(state, enc, 'defeat', 'player_hp_zero');
  }
  if (opts?.enemyDead || enc.hp <= 0) {
    return commitClear(state, enc, 'victory', 'enemy_hp_zero');
  }
  if (opts?.fleeSucceeded) {
    return commitClear(state, enc, 'escape', 'flee_success');
  }
  if (opts?.parleySucceeded) {
    return commitClear(state, enc, 'parleyResolved', 'parley_success');
  }

  const idle = isEncounterIdleIntent(input);
  enc = {
    ...enc,
    // Batch G — only fight/flee/parley advance the clear clock; idle loot/scout never farms victory XP.
    engagedTurnCount: idle
      ? (enc.engagedTurnCount ?? 0)
      : (enc.engagedTurnCount ?? 0) + 1,
    phase: 'engaged',
  };

  if (isFleeIntent(input)) {
    enc = { ...enc, failedFleeCount: (enc.failedFleeCount ?? 0) + 1, caught: true };
    receipts.push(`Flee attempt failed (${enc.failedFleeCount}/${enc.maxFailedFlee})`);
    receipts.push('Caught — fight, parley, or press the attack to resolve');
    // Batch W — flee cap does not soft-clear; threat stays live on the ledger.
  } else if (isParleyIntent(input)) {
    // Batch F — park as resolving; success/fail settled from GM prose (not auto-clear).
    enc = { ...enc, phase: 'resolving' };
    receipts.push('Parley in progress — resolve from beat');
  } else if (isAttackIntent(input)) {
    // Soft HP pressure so long loops still reach victory without ledger combat
    const maxHp = Math.max(1, enc.maxHp || enc.hp || 16);
    const curHp = typeof enc.hp === 'number' && !Number.isNaN(enc.hp) ? enc.hp : maxHp;
    const dmg = Math.max(3, Math.floor(maxHp / Math.max(3, enc.maxEngagedTurns ?? 8)));
    enc = {
      ...enc,
      maxHp,
      hp: Math.max(0, curHp - dmg),
    };
    receipts.push(`${enc.name} HP: ${enc.hp}/${maxHp} (−${dmg})`);
    if (enc.hp <= 0) {
      return commitClear(state, enc, 'victory', 'enemy_hp_zero');
    }
  } else if (idle) {
    receipts.push('Threat still live — idle loot/scout does not clear the encounter');
  }

  const terminalIntent = isAttackIntent(input) || isFleeIntent(input) || isParleyIntent(input);
  if (terminalIntent && (enc.engagedTurnCount ?? 0) >= (enc.maxEngagedTurns ?? 8)) {
    return commitClear(state, enc, resolveForcedOutcome(enc, 'max_engaged'), 'max_engaged');
  }

  return {
    state: { ...state, activeEncounter: enc },
    receipts,
    forcedTerminal: false,
  };
}

/** Diegetic cues that the foe accepted a truce / stood down (Batch F). */
export function detectParleySuccessInProse(prose: string): boolean {
  const t = prose ?? '';
  if (!t.trim()) return false;
  const refused =
    /\b(refuses?|rejects?|won't hear|will not (?:hear|listen)|lunges?|strikes?|attacks?|charges?)\b/i.test(t)
    && !/\b(?:then|before|until|but).{0,48}\b(?:stands? down|backs? (?:off|away)|lowers?)\b/i.test(t);
  if (refused) return false;
  return (
    /\b(stands?\s+down|backs?\s+(?:off|away)|lowers?\s+(?:their|his|her|the|its)\s+(?:weapon|blade|guard|spear))\b/i.test(t)
    || /\b(accepts?\s+(?:the\s+)?(?:truce|terms|parley)|agrees?\s+to\s+(?:talk|leave|withdraw|a truce))\b/i.test(t)
    || /\b(withdraws?(?:\s+from (?:the )?(?:fight|melee))?|walks?\s+away|lets?\s+you\s+(?:pass|go)|truce\s+(?:holds|accepted)|parley\s+succeeds)\b/i.test(t)
  );
}

/**
 * After GM narrates a parley attempt: ledger-resolve on success cues;
 * otherwise count a refusal (exhausted still keeps combat — Batch E).
 */
export function settleParleyAfterProse(
  state: GameState,
  prose: string,
  playerInput: string
): TickEncounterResult {
  const enc0 = state.activeEncounter;
  if (!enc0) return { state, receipts: [], forcedTerminal: false };

  const pending =
    enc0.phase === 'resolving'
    || isParleyIntent(playerInput || '');
  if (!pending) return { state, receipts: [], forcedTerminal: false };

  const enc = initEncounterTerminal(enc0, state);
  if (detectParleySuccessInProse(prose)) {
    return commitClear(state, enc, 'parleyResolved', 'parley_success');
  }

  const failed = (enc.failedParleyCount ?? 0) + 1;
  const next: ActiveEncounter = {
    ...enc,
    failedParleyCount: failed,
    phase: 'engaged',
  };
  const receipts = [`Parley refused (${failed}/${next.maxFailedParley ?? 1})`];
  if (failed >= (next.maxFailedParley ?? 1)) {
    receipts.push('Parley exhausted — combat continues on the ledger');
  }
  return {
    state: { ...state, activeEncounter: next },
    receipts,
    forcedTerminal: false,
  };
}

function clearXpForOutcome(enc: ActiveEncounter, outcome: TerminalOutcome): number {
  const base = enc.xpReward || 25;
  if (outcome === 'victory') return base;
  if (outcome === 'parleyResolved') return Math.max(10, Math.floor(base * 0.6));
  if (outcome === 'escape') return Math.max(5, Math.floor(base * 0.35));
  if (outcome === 'capture') return Math.max(8, Math.floor(base * 0.5));
  return 0;
}

function commitClear(
  state: GameState,
  enc: ActiveEncounter,
  outcome: TerminalOutcome,
  reason: string
): TickEncounterResult {
  const receipt: EncounterClearedReceipt = {
    encounterId: enc.encounterId ?? `enc-${state.turn}`,
    outcome,
    turn: state.turn,
    resolutionReason: reason,
    engagedTurnCount: enc.engagedTurnCount ?? 0,
    failedFleeCount: enc.failedFleeCount ?? 0,
    failedParleyCount: enc.failedParleyCount ?? 0,
    name: enc.name,
  };
  const prior = state.arcDirector?.encounterClearedReceipts ?? [];
  const statusLine = formatEncounterClearedStatus(receipt);
  const xpAmount = clearXpForOutcome(enc, outcome);
  const spawnKey = enc.forcedSpawnKey ?? enc.name;
  const cooldownKeys = {
    ...(state.arcDirector?.encounterCooldownUntil ?? {}),
    [spawnKey]: state.turn + ENCOUNTER_REENGAGE_COOLDOWN,
  };
  const receipts = [
    `Encounter cleared: ${enc.name} (${outcome})`,
    statusLine,
  ];
  if (xpAmount > 0) {
    receipts.push(`Arc XP: +${xpAmount} (encounter clear: ${enc.name})`);
  }
  return {
    state: {
      ...state,
      activeEncounter: null,
      arcDirector: {
        ...state.arcDirector,
        encounterClearedReceipts: [...prior, receipt].slice(-12),
        turnsSinceCombatReceipt: 0,
        lastEncounterClearedTurn: state.turn,
        encounterCooldownUntil: cooldownKeys,
      },
    },
    cleared: receipt,
    receipts,
    forcedTerminal: true,
    xpAward:
      xpAmount > 0
        ? { amount: xpAmount, reason: `Encounter clear: ${enc.name} (${outcome})` }
        : undefined,
  };
}

/** True when this spawn key is still cooling down after a clear. */
export function isEncounterOnCooldown(state: GameState, spawnKey: string): boolean {
  const until = state.arcDirector?.encounterCooldownUntil?.[spawnKey];
  if (until == null) return false;
  return state.turn < until;
}

export function formatEncounterClearedStatus(receipt: EncounterClearedReceipt): string {
  const label =
    receipt.outcome === 'escape'
      ? 'escaped'
      : receipt.outcome === 'parleyResolved'
        ? 'parley resolved'
        : receipt.outcome === 'defeat'
          ? 'defeated'
          : receipt.outcome === 'capture'
            ? 'captured'
            : 'victory';
  return `Encounter cleared: ${receipt.name} — ${label}`;
}

/** Force clear if still engaged past hard safety (eval T50 / stuck saves). */
export function forceClearIfStale(state: GameState, maxTurnSpan = 50): TickEncounterResult {
  const enc = state.activeEncounter;
  if (!enc) return { state, receipts: [], forcedTerminal: false };
  const started = enc.startedTurn ?? state.turn;
  if (state.turn - started < maxTurnSpan && (enc.engagedTurnCount ?? 0) < (enc.maxEngagedTurns ?? 8)) {
    return { state, receipts: [], forcedTerminal: false };
  }
  const ready = initEncounterTerminal(enc, state);
  return commitClear(state, ready, resolveForcedOutcome(ready, 'max_engaged'), 'stale_force_clear');
}

export function isEncounterEngaged(state: GameState): boolean {
  const p = state.activeEncounter?.phase;
  return !!state.activeEncounter && (p == null || p === 'engaged' || p === 'resolving');
}

/** Batch W — live encounter blocks travel snap / soft clear. */
export function encounterBlocksTravel(state: GameState): boolean {
  return isEncounterEngaged(state) || !!state.activeEncounter || !!state.sceneFacts?.pendingEncounter;
}
