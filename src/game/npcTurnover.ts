/**
 * WS-2 Wave B: NPC Turnover Engine
 * 
 * Handles deterministic NPC lifecycle transitions and fallback selection.
 * Coordinates 7 turnover actions with role-specific rules.
 * 
 * Architecture:
 * - Evaluates lifecycle state + role obligations
 * - Selects appropriate turnover action
 * - Spawns successors/replacements when needed
 * - Records departure events in memory ledger
 * - Integrates with coordination layer via receipts
 */

import type { GameState } from './types';
import type { NpcLifecycle, NpcLifecycleState } from './npcLifecycleFsm';
import type { NpcRole } from './npcRoleRegistry';
import type { BaseReceipt } from './types/crossPackageContracts';

export type TurnoverAction = 
  | 'exit'          // NPC leaves permanently
  | 'relocate'      // NPC moves to different location
  | 'transform'     // NPC changes role/identity
  | 'escalate'      // NPC upgrades to more important role
  | 'delegate'      // NPC assigns task to successor
  | 'replace'       // NPC is replaced by new actor
  | 'remain';       // NPC continues in current state

export type TurnoverTrigger =
  | 'completion'    // Obligation satisfied
  | 'deadline'      // Hard deadline reached
  | 'player'        // Player dismissal/choice
  | 'location'      // Player left area
  | 'story'         // Story beat forced exit
  | 'transform'     // Role transformation triggered
  | 'failure';      // Obligation failed

export interface TurnoverDecision {
  npcId: string;
  action: TurnoverAction;
  trigger: TurnoverTrigger;
  reason: string;
  fallbackActorId?: string;
  successorRole?: NpcRole;
  newLocationId?: string;
  transformedIdentity?: {
    newRole: NpcRole;
    newName: string;
    backstory: string;
  };
}

export interface TurnoverReceipt extends BaseReceipt {
  kind: 'npc_turnover';
  schemaVersion: 1;
  npcId: string;
  action: TurnoverAction;
  trigger: TurnoverTrigger;
  fromState: NpcLifecycleState;
  toState: NpcLifecycleState;
  fallbackActorId?: string;
  successorSpawned?: {
    actorId: string;
    role: NpcRole;
    inheritedDebt: string;
  };
  locationChange?: {
    from: string;
    to: string;
  };
  transformation?: {
    oldRole: NpcRole;
    newRole: NpcRole;
    newIdentity: string;
  };
}

export interface FallbackRule {
  /** When to use this fallback */
  condition: 'completion' | 'deadline' | 'location' | 'failure';
  /** Priority (lower = preferred) */
  priority: number;
  /** Type of fallback */
  type: 'successor' | 'heir' | 'delegate' | 'channel' | 'none';
  /** Role for spawned successor (if applicable) */
  successorRole?: NpcRole;
  /** Whether debt is inherited */
  inheritDebt: boolean;
  /** Fallback description for memory ledger */
  description: string;
}

/**
 * Wave B: Decide turnover action based on lifecycle state and triggers
 */
export function decideTurnover(
  gs: GameState,
  lifecycle: NpcLifecycle,
  trigger: TurnoverTrigger
): TurnoverDecision {
  const { npcId, state, role, debtSatisfied, obligationDeadline: deadline } = lifecycle;
  
  // Completion trigger (obligation satisfied)
  if (trigger === 'completion') {
    if (state === 'debt_satisfied') {
      // Check role-specific completion actions
      const completionAction = getRoleCompletionAction(role);
      
      if (completionAction === 'transform') {
        const transformedIdentity = getTransformationPath(role, gs);
        if (transformedIdentity) {
          return {
            npcId,
            action: 'transform',
            trigger: 'completion',
            reason: `${role} obligation complete; transforming to ${transformedIdentity.newRole}`,
            transformedIdentity
          };
        }
      }
      
      if (completionAction === 'relocate') {
        const newLocation = selectRelocationTarget(gs, role);
        if (newLocation) {
          return {
            npcId,
            action: 'relocate',
            trigger: 'completion',
            reason: `${role} task complete; moving to ${newLocation}`,
            newLocationId: newLocation
          };
        }
      }
      
      if (completionAction === 'remain') {
        return {
          npcId,
          action: 'remain',
          trigger: 'completion',
          reason: `${role} obligation satisfied; continuing service`
        };
      }
      
      // Default: exit after debt satisfied
      return {
        npcId,
        action: 'exit',
        trigger: 'completion',
        reason: `${role} obligation satisfied; graceful departure`
      };
    }
  }
  
  // Deadline trigger (time limit reached)
  if (trigger === 'deadline') {
    if (deadline && gs.turn >= deadline) {
      // Hard deadline: delegate or exit
      const fallback = selectFallback(gs, lifecycle, 'deadline');
      
      if (fallback.type === 'delegate' || fallback.type === 'successor') {
        return {
          npcId,
          action: 'delegate',
          trigger: 'deadline',
          reason: `${role} deadline at T${deadline}; delegating to successor`,
          successorRole: fallback.successorRole,
          fallbackActorId: fallback.actorId
        };
      }
      
      return {
        npcId,
        action: 'exit',
        trigger: 'deadline',
        reason: `${role} deadline at T${deadline}; abrupt departure with warning`
      };
    }
  }
  
  // Player trigger (explicit dismissal)
  if (trigger === 'player') {
    return {
      npcId,
      action: 'exit',
      trigger: 'player',
      reason: `Player dismissed ${role}; immediate departure`
    };
  }
  
  // Location trigger (player left area)
  if (trigger === 'location') {
    const canRelocate = canNpcRelocate(role);
    
    if (canRelocate) {
      return {
        npcId,
        action: 'relocate',
        trigger: 'location',
        reason: `Player left area; ${role} relocating to hub`,
        newLocationId: gs.currentLocation // Placeholder - should select appropriate hub
      };
    }
    
    return {
      npcId,
      action: 'exit',
      trigger: 'location',
      reason: `Player left area; ${role} stays behind`
    };
  }
  
  // Story trigger (forced by narrative)
  if (trigger === 'story') {
    // Check for transformation opportunities
    const transformedIdentity = getTransformationPath(role, gs);
    if (transformedIdentity) {
      return {
        npcId,
        action: 'transform',
        trigger: 'story',
        reason: `Story beat triggered ${role} transformation`,
        transformedIdentity
      };
    }
    
    return {
      npcId,
      action: 'exit',
      trigger: 'story',
      reason: `Story beat forced ${role} departure`
    };
  }
  
  // Transform trigger (role change)
  if (trigger === 'transform') {
    const transformedIdentity = getTransformationPath(role, gs);
    if (transformedIdentity) {
      return {
        npcId,
        action: 'transform',
        trigger: 'transform',
        reason: `${role} transforming to ${transformedIdentity.newRole}`,
        transformedIdentity
      };
    }
  }
  
  // Failure trigger (obligation failed)
  if (trigger === 'failure') {
    const fallback = selectFallback(gs, lifecycle, 'failure');
    
    if (fallback.type === 'replace') {
      return {
        npcId,
        action: 'replace',
        trigger: 'failure',
        reason: `${role} failed obligation; replaced by credible actor`,
        successorRole: fallback.successorRole,
        fallbackActorId: fallback.actorId
      };
    }
    
    return {
      npcId,
      action: 'exit',
      trigger: 'failure',
      reason: `${role} failed obligation; departure in disgrace`
    };
  }
  
  // Default: remain
  return {
    npcId,
    action: 'remain',
    trigger,
    reason: `${role} continues in ${state} state`
  };
}

/**
 * Wave B: Select appropriate fallback when NPC exits/fails
 */
export function selectFallback(
  gs: GameState,
  lifecycle: NpcLifecycle,
  condition: 'completion' | 'deadline' | 'location' | 'failure'
): {
  type: FallbackRule['type'];
  actorId?: string;
  successorRole?: NpcRole;
  description: string;
} {
  const { role } = lifecycle;
  
  // Get role-specific fallback rules
  const rules = getRoleFallbackRules(role);
  const matchingRules = rules
    .filter(r => r.condition === condition)
    .sort((a, b) => a.priority - b.priority);
  
  if (matchingRules.length === 0) {
    return {
      type: 'none',
      description: `No fallback for ${role} on ${condition}`
    };
  }
  
  const rule = matchingRules[0];
  
  // Spawn successor if needed
  if (rule.type === 'successor' || rule.type === 'heir') {
    const successorId = generateSuccessorId(lifecycle.npcId);
    return {
      type: rule.type,
      actorId: successorId,
      successorRole: rule.successorRole || role,
      description: rule.description
    };
  }
  
  // Delegate to existing credible actor
  if (rule.type === 'delegate') {
    const credibleActor = findCredibleActor(gs, role);
    if (credibleActor) {
      return {
        type: 'delegate',
        actorId: credibleActor,
        successorRole: role,
        description: `Delegating to existing ${role}: ${credibleActor}`
      };
    }
    
    // Fall back to spawning new actor
    const successorId = generateSuccessorId(lifecycle.npcId);
    return {
      type: 'successor',
      actorId: successorId,
      successorRole: rule.successorRole || role,
      description: `No credible delegate found; spawning successor`
    };
  }
  
  // Channel (world-level mechanism)
  if (rule.type === 'channel') {
    return {
      type: 'channel',
      description: rule.description
    };
  }
  
  return {
    type: 'none',
    description: rule.description
  };
}

/**
 * Wave B: Spawn successor NPC with inherited debt
 */
export function spawnSuccessor(
  gs: GameState,
  decision: TurnoverDecision,
  parentLifecycle: NpcLifecycle
): {
  actorId: string;
  role: NpcRole;
  name: string;
  inheritedDebt: string;
} {
  const successorId = decision.fallbackActorId || generateSuccessorId(parentLifecycle.npcId);
  const successorRole = decision.successorRole || parentLifecycle.role;
  const successorName = generateSuccessorName(successorRole);
  
  const inheritedDebt = parentLifecycle.debtSatisfied
    ? 'none' // Parent completed obligation
    : `Inherited from ${parentLifecycle.npcId}: ${parentLifecycle.role} obligation incomplete`;
  
  return {
    actorId: successorId,
    role: successorRole,
    name: successorName,
    inheritedDebt
  };
}

/**
 * Wave B: Create turnover receipt for coordination layer
 */
export function createTurnoverReceipt(
  decision: TurnoverDecision,
  lifecycle: NpcLifecycle,
  successor?: ReturnType<typeof spawnSuccessor>
): TurnoverReceipt {
  const newState = determineNewState(decision.action, lifecycle.state);
  
  return {
    kind: 'npc_turnover',
    schemaVersion: 1,
    receiptId: `turnover_${lifecycle.npcId}_${Date.now()}`,
    turn: lifecycle.lastUpdateTurn,
    npcId: lifecycle.npcId,
    action: decision.action,
    trigger: decision.trigger,
    fromState: lifecycle.state,
    toState: newState,
    fallbackActorId: decision.fallbackActorId,
    successorSpawned: successor ? {
      actorId: successor.actorId,
      role: successor.role,
      inheritedDebt: successor.inheritedDebt
    } : undefined,
    locationChange: decision.newLocationId ? {
      from: lifecycle.currentLocation || 'unknown',
      to: decision.newLocationId
    } : undefined,
    transformation: decision.transformedIdentity ? {
      oldRole: lifecycle.role,
      newRole: decision.transformedIdentity.newRole,
      newIdentity: decision.transformedIdentity.newName
    } : undefined
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRoleCompletionAction(role: NpcRole): 'exit' | 'relocate' | 'transform' | 'remain' {
  // Role-specific completion behaviors
  const completionActions: Partial<Record<NpcRole, 'exit' | 'relocate' | 'transform' | 'remain'>> = {
    guide: 'exit',
    herald: 'exit',
    quest_patron: 'exit',
    merchant: 'remain',
    companion: 'remain',
    trainer: 'relocate',
    faction_envoy: 'exit',
    informant: 'transform', // May become ally or betray
    witness: 'exit',
    rival: 'transform', // May escalate or reconcile
    guardian: 'remain',
    mentor: 'relocate',
    antagonist: 'transform', // May become boss or ally
    contact: 'remain',
    broker: 'remain',
    ally: 'remain',
    betrayer: 'exit', // Usually exits after betrayal reveal
    crisis_catalyst: 'exit',
    revelation_bearer: 'exit',
    prophecy_speaker: 'exit',
    judge: 'exit',
    arbiter: 'exit',
    seeker: 'transform',
    survivor: 'remain',
    refugee: 'relocate'
  };
  
  return completionActions[role] || 'exit';
}

function getTransformationPath(
  role: NpcRole,
  gs: GameState
): TurnoverDecision['transformedIdentity'] | null {
  // Role-specific transformation patterns
  const transformations: Partial<Record<NpcRole, { newRole: NpcRole; prefix: string }>> = {
    informant: { newRole: 'ally', prefix: 'Trusted' },
    rival: { newRole: 'antagonist', prefix: 'Escalated' },
    antagonist: { newRole: 'ally', prefix: 'Reformed' },
    seeker: { newRole: 'revelation_bearer', prefix: 'Enlightened' },
    witness: { newRole: 'informant', prefix: 'Cooperative' }
  };
  
  const transformation = transformations[role];
  if (!transformation) return null;
  
  return {
    newRole: transformation.newRole,
    newName: `${transformation.prefix} ${role}`,
    backstory: `Transformed from ${role} due to story progression`
  };
}

function selectRelocationTarget(gs: GameState, role: NpcRole): string | null {
  // Simple placeholder: return current hub or main settlement
  // Real implementation would check world ledger for appropriate hubs
  return gs.currentLocation || 'main_hub';
}

function canNpcRelocate(role: NpcRole): boolean {
  // Roles that can follow player vs stay in location
  const relocatableRoles: NpcRole[] = [
    'companion',
    'merchant',
    'informant',
    'guide',
    'mentor',
    'ally',
    'broker'
  ];
  
  return relocatableRoles.includes(role);
}

function getRoleFallbackRules(role: NpcRole): FallbackRule[] {
  // Default fallback rules per role
  // Real implementation would load from role registry
  return [
    {
      condition: 'deadline',
      priority: 1,
      type: 'successor',
      successorRole: role,
      inheritDebt: true,
      description: `Spawn successor to continue ${role} obligations`
    },
    {
      condition: 'failure',
      priority: 1,
      type: 'replace',
      successorRole: role,
      inheritDebt: false,
      description: `Replace failed ${role} with new actor`
    },
    {
      condition: 'completion',
      priority: 1,
      type: 'none',
      inheritDebt: false,
      description: `${role} exits after completion`
    },
    {
      condition: 'location',
      priority: 1,
      type: 'none',
      inheritDebt: false,
      description: `${role} stays in location`
    }
  ];
}

function findCredibleActor(gs: GameState, role: NpcRole): string | null {
  // Search for existing NPCs who could fulfill the role
  // Placeholder: real implementation would check NPC roster and memories
  return null;
}

function generateSuccessorId(parentId: string): string {
  const timestamp = Date.now();
  return `${parentId}_successor_${timestamp}`;
}

function generateSuccessorName(role: NpcRole): string {
  // Generate appropriate name based on role
  const prefixes: Partial<Record<NpcRole, string>> = {
    guide: 'Wayfinder',
    herald: 'Messenger',
    quest_patron: 'Patron',
    merchant: 'Trader',
    companion: 'Fellow',
    trainer: 'Master',
    faction_envoy: 'Envoy',
    informant: 'Contact'
  };
  
  const prefix = prefixes[role] || 'Successor';
  return `${prefix} ${Math.floor(Math.random() * 1000)}`;
}

function determineNewState(action: TurnoverAction, currentState: NpcLifecycleState): NpcLifecycleState {
  switch (action) {
    case 'exit':
      return 'absent';
    case 'relocate':
      return 'functioning'; // Continues functioning in new location
    case 'transform':
      return 'transformed';
    case 'escalate':
      return 'functioning'; // Continues in escalated role
    case 'delegate':
      return 'exiting'; // Original NPC transitions to exiting
    case 'replace':
      return 'absent'; // Original NPC becomes absent
    case 'remain':
      return currentState; // No state change
    default:
      return currentState;
  }
}
