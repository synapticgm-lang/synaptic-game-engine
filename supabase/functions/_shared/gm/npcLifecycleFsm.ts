/**
 * WS-2 Wave A: NPC Lifecycle FSM
 * 
 * Six-state lifecycle: entering → functioning → debt_satisfied → exiting → transformed → absent
 * Tracks role obligations, deadlines, and turnover logic.
 */

import type { GameState } from './types.ts';
import type { NpcRole } from './npcRoleRegistry.ts';
import {
  ROLE_OBLIGATIONS,
  inferNpcRole,
  calculateRoleDeadline,
  isRoleSatisfied,
  formatRoleObligation,
  formatExitMandate,
} from './npcRoleRegistry.ts';

// ============================================================================
// LIFECYCLE STATES
// ============================================================================

export type NpcLifecycleState =
  | 'entering'        // NPC spawns, role assigned
  | 'functioning'     // NPC serves role obligation
  | 'debt_satisfied'  // Obligation met, exit window starts
  | 'exiting'         // NPC leaving scene
  | 'transformed'     // Role changed, new lifecycle starts
  | 'absent';         // NPC gone from game

// ============================================================================
// LIFECYCLE DATA
// ============================================================================

function lifecyclesOf(state: GameState): NpcLifecycle[] {
  return (state.arcDirector as { npcLifecycles?: NpcLifecycle[] } | undefined)?.npcLifecycles ?? [];
}

export interface NpcLifecycle {
  /** NPC identifier */
  npcId: string;
  
  /** Current state */
  state: NpcLifecycleState;
  
  /** Assigned role */
  role: NpcRole;
  
  /** Turn when NPC entered */
  enteredAtTurn: number;
  
  /** Obligation deadline (null if no deadline) */
  obligationDeadline: number | null;
  
  /** Whether debt is satisfied */
  debtSatisfied: boolean;
  
  /** Turn when debt was satisfied (starts exit window) */
  satisfiedAtTurn?: number;
  
  /** Turn when NPC exited */
  exitedAtTurn?: number;
  
  /** Exit reason */
  exitReason?: 'function_complete' | 'deadline_missed' | 'player_choice' | 'story_beat' | 'transform';
  
  /** Previous role (if transformed) */
  previousRole?: NpcRole;
  
  /** Transform reason */
  transformReason?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Exit window: NPCs must exit within 10 turns of debt satisfaction */
export const EXIT_WINDOW_TURNS = 10;

/** Grace period: Extra turns before hard deadline */
export const GRACE_PERIOD_TURNS = 3;

// ============================================================================
// LIFECYCLE INITIALIZATION
// ============================================================================

/**
 * Initialize NPC lifecycle
 */
export function initNpcLifecycle(
  npcId: string,
  role: NpcRole,
  state: GameState
): NpcLifecycle {
  const deadline = calculateRoleDeadline(role, state.turn, state);
  
  return {
    npcId,
    state: 'entering',
    role,
    enteredAtTurn: state.turn,
    obligationDeadline: deadline,
    debtSatisfied: false,
  };
}

/**
 * Start a lifecycle for each present named NPC whose role is known
 * (bible roleHint, else keyword inference). One live lifecycle per NPC.
 */
export function seedPresentNpcLifecycles(
  state: GameState,
  records: ReadonlyArray<{ npcName: string; roleHint?: string; facts?: readonly string[] }>
): GameState {
  const existing = lifecyclesOf(state);
  const known = new Set(existing.map((lc) => lc.npcId.trim().toLowerCase()));
  const added: NpcLifecycle[] = [];
  for (const r of records) {
    const name = r.npcName?.trim();
    if (!name || known.has(name.toLowerCase())) continue;
    const hint = (r.roleHint ?? '').trim().toLowerCase();
    const role: NpcRole | null = hint && hint in ROLE_OBLIGATIONS
      ? (hint as NpcRole)
      : inferNpcRole([hint, ...(r.facts ?? [])]);
    if (!role) continue;
    known.add(name.toLowerCase());
    added.push(initNpcLifecycle(name, role, state));
  }
  if (!added.length) return state;
  return {
    ...state,
    arcDirector: { ...state.arcDirector, npcLifecycles: [...existing, ...added] },
  };
}

/**
 * Update NPC lifecycle state
 * 
 * Called every turn from packageCoordination pre-GM sequence.
 */
export function updateNpcLifecycle(
  lifecycle: NpcLifecycle,
  state: GameState
): {
  lifecycle: NpcLifecycle;
  transition?: {
    from: NpcLifecycleState;
    to: NpcLifecycleState;
    reason: string;
  };
  mandate?: string;
} {
  const currentState = lifecycle.state;
  const next = { ...lifecycle };
  let transition: { from: NpcLifecycleState; to: NpcLifecycleState; reason: string } | undefined;
  let mandate: string | undefined;
  
  switch (currentState) {
    case 'entering': {
      // entering → functioning (immediately)
      next.state = 'functioning';
      transition = {
        from: 'entering',
        to: 'functioning',
        reason: 'NPC role assigned and active',
      };
      mandate = formatRoleObligation(
        lifecycle.role,
        lifecycle.npcId,
        lifecycle.obligationDeadline
      );
      break;
    }
    
    case 'functioning': {
      // Check if debt satisfied
      const satisfied = isRoleSatisfied(lifecycle.role, lifecycle.npcId, state);
      
      if (satisfied && !next.debtSatisfied) {
        // functioning → debt_satisfied
        next.state = 'debt_satisfied';
        next.debtSatisfied = true;
        next.satisfiedAtTurn = state.turn;
        transition = {
          from: 'functioning',
          to: 'debt_satisfied',
          reason: 'Role obligation satisfied',
        };
        mandate = `NPC OBLIGATION MET (${lifecycle.npcId}): Role debt satisfied. Exit window starts (${EXIT_WINDOW_TURNS} turns).`;
      } else if (
        lifecycle.obligationDeadline !== null &&
        state.turn >= lifecycle.obligationDeadline + GRACE_PERIOD_TURNS
      ) {
        // functioning → exiting (deadline missed)
        next.state = 'exiting';
        next.exitedAtTurn = state.turn;
        next.exitReason = 'deadline_missed';
        transition = {
          from: 'functioning',
          to: 'exiting',
          reason: 'Deadline missed',
        };
        mandate = formatExitMandate(lifecycle.role, lifecycle.npcId, 'deadline');
      }
      break;
    }
    
    case 'debt_satisfied': {
      // Check if exit window exceeded
      const windowStart = next.satisfiedAtTurn ?? state.turn;
      const windowExpired = state.turn >= windowStart + EXIT_WINDOW_TURNS;
      
      if (windowExpired) {
        // debt_satisfied → exiting (exit window exceeded)
        next.state = 'exiting';
        next.exitedAtTurn = state.turn;
        next.exitReason = 'function_complete';
        transition = {
          from: 'debt_satisfied',
          to: 'exiting',
          reason: 'Exit window exceeded',
        };
        mandate = `NPC EXIT (${lifecycle.npcId}): Exit window exceeded. NPC must leave scene now.`;
      }
      break;
    }
    
    case 'exiting': {
      // exiting → absent (next turn)
      // GM should narrate exit on this turn, absent next turn
      if (next.exitedAtTurn && state.turn > next.exitedAtTurn) {
        next.state = 'absent';
        transition = {
          from: 'exiting',
          to: 'absent',
          reason: 'Exit complete',
        };
      }
      break;
    }
    
    case 'transformed':
    case 'absent': {
      // Terminal states, no transitions
      break;
    }
  }
  
  return { lifecycle: next, transition, mandate };
}

// ============================================================================
// BULK LIFECYCLE UPDATES
// ============================================================================

/**
 * Update all NPC lifecycles
 * 
 * Called from packageCoordination.checkNpcLifecycles()
 */
export function updateAllNpcLifecycles(
  state: GameState
): {
  state: GameState;
  transitions: Array<{
    npcId: string;
    from: NpcLifecycleState;
    to: NpcLifecycleState;
    reason: string;
  }>;
  mandates: string[];
} {
  const lifecycles = lifecyclesOf(state);
  const transitions: Array<{
    npcId: string;
    from: NpcLifecycleState;
    to: NpcLifecycleState;
    reason: string;
  }> = [];
  const mandates: string[] = [];
  
  const nextLifecycles = lifecycles.map(lc => {
    const result = updateNpcLifecycle(lc, state);
    
    if (result.transition) {
      transitions.push({
        npcId: lc.npcId,
        ...result.transition,
      });
    }
    
    if (result.mandate) {
      mandates.push(result.mandate);
    }
    
    return result.lifecycle;
  });
  
  return {
    state: {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcLifecycles: nextLifecycles,
      },
    },
    transitions,
    mandates,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/** Active lifecycles (not absent). */
export function getActiveLifecycles(state: GameState): NpcLifecycle[] {
  const all = lifecyclesOf(state);
  const out: NpcLifecycle[] = [];
  for (let i = 0; i < all.length; i++) if (all[i]!.state !== 'absent') out.push(all[i]!);
  return out;
}

/** NPC lifecycle section for the situation packet. */
export function buildLifecycleSituationSection(state: GameState, presentNames?: string[]): string {
  const here: string[] = [];
  if (presentNames) {
    for (let i = 0; i < presentNames.length; i++) {
      const n = presentNames[i]!.trim().toLowerCase();
      if (n) here.push(n);
    }
  }
  const active: NpcLifecycle[] = [];
  const all = getActiveLifecycles(state);
  for (let i = 0; i < all.length; i++) {
    const lc = all[i]!;
    if (here.length && !here.includes(lc.npcId.trim().toLowerCase())) continue;
    active.push(lc);
  }
  if (active.length === 0) return '';

  const lines: string[] = ['NPC roles here:'];
  for (let i = 0; i < active.length; i++) {
    const lc = active[i]!;
    const obligation = ROLE_OBLIGATIONS[lc.role];
    let status = 'Active';
    if (lc.state === 'entering' || lc.state === 'functioning') status = lc.debtSatisfied ? 'Done' : 'Active';
    else if (lc.state === 'debt_satisfied') status = 'Done';
    else if (lc.state === 'exiting') status = 'Leaving';
    else if (lc.state === 'transformed') status = `Transformed from ${lc.previousRole}`;
    lines.push(`- ${lc.npcId} (${lc.role}): ${status}`);
    lines.push(`  Function: ${obligation.description}`);
    const doneWhen = obligation.obligations.successCriteria[0];
    if (lc.state === 'functioning' && !lc.debtSatisfied && doneWhen) lines.push(`  Done when: ${doneWhen}`);
  }
  return lines.join('\n');
}
