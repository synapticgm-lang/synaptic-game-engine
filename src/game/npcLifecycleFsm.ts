/**
 * WS-2 Wave A: NPC Lifecycle FSM
 * 
 * Six-state lifecycle: entering → functioning → debt_satisfied → exiting → transformed → absent
 * Tracks role obligations, deadlines, and turnover logic.
 */

import type { GameState } from './types';
import type { NpcRole } from './npcRoleRegistry';
import {
  ROLE_OBLIGATIONS,
  calculateRoleDeadline,
  isRoleSatisfied,
  formatRoleObligation,
  formatExitMandate,
} from './npcRoleRegistry';

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
 * Get or create lifecycle for NPC
 */
export function getOrCreateLifecycle(
  npcId: string,
  role: NpcRole,
  state: GameState
): NpcLifecycle {
  const existing = (state.arcDirector?.npcLifecycles ?? []).find(
    lc => lc.npcId === npcId && !lc.exitedAtTurn
  );
  
  if (existing) return existing;
  
  return initNpcLifecycle(npcId, role, state);
}

// ============================================================================
// LIFECYCLE TRANSITIONS
// ============================================================================

/**
 * Turnover check result
 */
export interface TurnoverCheck {
  shouldAdvance: boolean;
  reason?: string;
  targetState?: NpcLifecycleState;
}

/**
 * Check if lifecycle should transition (turnover check)
 */
export function checkLifecycleTurnover(
  lifecycle: NpcLifecycle,
  currentTurn: number
): TurnoverCheck {
  const currentState = lifecycle.state;
  
  switch (currentState) {
    case 'entering': {
      // entering → functioning (immediately)
      return {
        shouldAdvance: true,
        reason: 'NPC role assigned and active',
        targetState: 'functioning',
      };
    }
    
    case 'functioning': {
      // Check if debt satisfied
      // Note: This requires full game state, so we return false here
      // The caller should use updateNpcLifecycle for full state checks
      if (lifecycle.debtSatisfied && !lifecycle.satisfiedAtTurn) {
        return {
          shouldAdvance: true,
          reason: 'Role obligation satisfied',
          targetState: 'debt_satisfied',
        };
      }
      
      // Check deadline
      if (
        lifecycle.obligationDeadline !== null &&
        currentTurn >= lifecycle.obligationDeadline + GRACE_PERIOD_TURNS
      ) {
        return {
          shouldAdvance: true,
          reason: 'Deadline missed',
          targetState: 'exiting',
        };
      }
      
      return { shouldAdvance: false };
    }
    
    case 'debt_satisfied': {
      // Check if exit window exceeded
      const windowStart = lifecycle.satisfiedAtTurn ?? currentTurn;
      const windowExpired = currentTurn >= windowStart + EXIT_WINDOW_TURNS;
      
      if (windowExpired) {
        return {
          shouldAdvance: true,
          reason: 'Exit window exceeded',
          targetState: 'exiting',
        };
      }
      
      return { shouldAdvance: false };
    }
    
    case 'exiting': {
      // exiting → absent (next turn)
      if (lifecycle.exitedAtTurn && currentTurn > lifecycle.exitedAtTurn) {
        return {
          shouldAdvance: true,
          reason: 'Exit complete',
          targetState: 'absent',
        };
      }
      
      return { shouldAdvance: false };
    }
    
    case 'transformed':
    case 'absent': {
      // Terminal states, no transitions
      return { shouldAdvance: false };
    }
  }
}

/**
 * Advance lifecycle state (simple state transition)
 */
export function advanceLifecycleState(
  lifecycle: NpcLifecycle,
  reason: string
): NpcLifecycle {
  const currentState = lifecycle.state;
  
  switch (currentState) {
    case 'entering': {
      return {
        ...lifecycle,
        state: 'functioning',
      };
    }
    
    case 'functioning': {
      if (lifecycle.debtSatisfied) {
        return {
          ...lifecycle,
          state: 'debt_satisfied',
          satisfiedAtTurn: lifecycle.satisfiedAtTurn,
        };
      }
      // Deadline missed
      return {
        ...lifecycle,
        state: 'exiting',
        exitedAtTurn: lifecycle.enteredAtTurn,
        exitReason: 'deadline_missed',
      };
    }
    
    case 'debt_satisfied': {
      return {
        ...lifecycle,
        state: 'exiting',
        exitedAtTurn: lifecycle.enteredAtTurn,
        exitReason: 'function_complete',
      };
    }
    
    case 'exiting': {
      return {
        ...lifecycle,
        state: 'absent',
      };
    }
    
    default:
      return lifecycle;
  }
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
  let next = { ...lifecycle };
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
        mandate = formatExitMandate(lifecycle.role, lifecycle.npcId, 'Deadline missed');
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

/**
 * Transform NPC to new role
 */
export function transformNpcRole(
  lifecycle: NpcLifecycle,
  newRole: NpcRole,
  reason: string,
  state: GameState
): NpcLifecycle {
  return {
    npcId: lifecycle.npcId,
    state: 'transformed',
    role: newRole,
    enteredAtTurn: state.turn,
    obligationDeadline: calculateRoleDeadline(newRole, state.turn, state),
    debtSatisfied: false,
    previousRole: lifecycle.role,
    transformReason: reason,
  };
}

/**
 * Force NPC exit (player choice or story beat)
 */
export function forceNpcExit(
  lifecycle: NpcLifecycle,
  reason: 'player_choice' | 'story_beat',
  state: GameState
): NpcLifecycle {
  return {
    ...lifecycle,
    state: 'exiting',
    exitedAtTurn: state.turn,
    exitReason: reason,
  };
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
  const lifecycles = state.arcDirector?.npcLifecycles ?? [];
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

/**
 * Get active lifecycles (not absent)
 */
export function getActiveLifecycles(state: GameState): NpcLifecycle[] {
  return (state.arcDirector?.npcLifecycles ?? []).filter(
    lc => lc.state !== 'absent'
  );
}

/**
 * Get lifecycles in exit window
 */
export function getExitWindowLifecycles(state: GameState): NpcLifecycle[] {
  return getActiveLifecycles(state).filter(
    lc => lc.state === 'debt_satisfied' || lc.state === 'exiting'
  );
}

/**
 * Get lifecycles approaching deadline
 */
export function getApproachingDeadlines(
  state: GameState,
  warningTurns: number = 5
): Array<{
  lifecycle: NpcLifecycle;
  turnsRemaining: number;
}> {
  const active = getActiveLifecycles(state);
  const approaching: Array<{ lifecycle: NpcLifecycle; turnsRemaining: number }> = [];
  
  for (const lc of active) {
    if (lc.obligationDeadline === null) continue;
    if (lc.debtSatisfied) continue;
    
    const turnsRemaining = lc.obligationDeadline - state.turn;
    if (turnsRemaining > 0 && turnsRemaining <= warningTurns) {
      approaching.push({ lifecycle: lc, turnsRemaining });
    }
  }
  
  return approaching.sort((a, b) => a.turnsRemaining - b.turnsRemaining);
}

/**
 * Check if NPC should exit
 */
export function shouldNpcExit(npcId: string, state: GameState): boolean {
  const lc = getActiveLifecycles(state).find(l => l.npcId === npcId);
  if (!lc) return false;
  
  return lc.state === 'exiting' || lc.state === 'absent';
}

/**
 * Get lifecycle by NPC ID
 */
export function getLifecycle(npcId: string, state: GameState): NpcLifecycle | null {
  return (
    (state.arcDirector?.npcLifecycles ?? []).find(
      lc => lc.npcId === npcId && lc.state !== 'absent'
    ) ?? null
  );
}

// ============================================================================
// SITUATION PACKET INTEGRATION
// ============================================================================

/**
 * Build NPC lifecycle section for situation packet
 */
export function buildLifecycleSituationSection(state: GameState): string {
  const active = getActiveLifecycles(state);
  if (active.length === 0) return '';
  
  const lines: string[] = ['### NPC LIFECYCLES'];
  
  for (const lc of active) {
    const obligation = ROLE_OBLIGATIONS[lc.role];
    const deadlineStr = lc.obligationDeadline
      ? ` (deadline: T${lc.obligationDeadline})`
      : '';
    
    let status = '';
    switch (lc.state) {
      case 'entering':
        status = 'Entering scene';
        break;
      case 'functioning':
        status = lc.debtSatisfied ? 'Debt satisfied' : 'Active';
        break;
      case 'debt_satisfied':
        const windowTurns = EXIT_WINDOW_TURNS - (state.turn - (lc.satisfiedAtTurn ?? state.turn));
        status = `Exit window (${windowTurns} turns remaining)`;
        break;
      case 'exiting':
        status = 'Exiting scene';
        break;
      case 'transformed':
        status = `Transformed from ${lc.previousRole}`;
        break;
      default:
        status = 'Unknown';
    }
    
    lines.push(`- **${lc.npcId}** (${lc.role}${deadlineStr}): ${status}`);
    lines.push(`  Function: ${obligation.function}`);
    
    if (lc.state === 'functioning' && !lc.debtSatisfied) {
      lines.push(`  Exit: ${obligation.exitCondition}`);
    } else if (lc.state === 'debt_satisfied' || lc.state === 'exiting') {
      lines.push(`  **Must exit this scene soon**`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Format lifecycle mandates for situation packet
 */
export function formatLifecycleMandates(mandates: string[]): string {
  if (mandates.length === 0) return '';
  
  return `### NPC LIFECYCLE MANDATES\n\n${mandates.map(m => `- ${m}`).join('\n')}`;
}
