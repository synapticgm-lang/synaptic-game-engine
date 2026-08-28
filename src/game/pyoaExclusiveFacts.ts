/**
 * WS-5 Wave B: PYOA Exclusive Facts System
 * 
 * Complete mutex enforcement for branch facts with:
 * - Registry of exclusive fact groups
 * - Conflict detection for mutually exclusive states
 * - Fact write validation
 * - Integration with pyoaBranchLedger
 */

import type { GameState } from './types';
import type { FactWrite, ExclusiveFactGroup, FactPredicate, PredicateGroup } from './pyoaTypes';

// ============================================================================
// EXCLUSIVE FACT GROUPS REGISTRY
// ============================================================================

/**
 * Thornferry Road exclusive fact groups
 */
export const THORNFERRY_EXCLUSIVE_GROUPS: ExclusiveFactGroup[] = [
  {
    id: 'thornferry-road.allegiance',
    mode: 'exactly-one-after-crisis',
    members: [
      'thornferry-road.allegiance.lord',
      'thornferry-road.allegiance.rebels',
      'thornferry-road.allegiance.neutral',
    ],
    ownerCrisisId: 'thornferry-road:crisis:2_lord_vs_rebels',
    description: 'Player allegiance in the conflict',
  },
  {
    id: 'thornferry-road.miller_verdict',
    mode: 'exactly-one-after-crisis',
    members: [
      'thornferry-road.trust.miller',
      'thornferry-road.trust.miller_doubted',
    ],
    ownerCrisisId: 'thornferry-road:crisis:1_millstone_charter',
    description: 'Trust decision regarding the miller',
  },
  {
    id: 'thornferry-road.village_fate',
    mode: 'exactly-one-after-crisis',
    members: [
      'thornferry-road.village.saved',
      'thornferry-road.village.abandoned',
    ],
    ownerCrisisId: 'thornferry-road:crisis:3_bandits_vs_villagers',
    description: 'Outcome of Hushwater village crisis',
  },
  {
    id: 'thornferry-road.truth_disposition',
    mode: 'exactly-one-after-crisis',
    members: [
      'thornferry-road.truth.revealed',
      'thornferry-road.truth.concealed',
    ],
    ownerCrisisId: 'thornferry-road:crisis:4_secret_under_road',
    description: 'Secret revelation decision',
  },
  {
    id: 'thornferry-road.final_method',
    mode: 'exactly-one-after-crisis',
    members: [
      'thornferry-road.method.force',
      'thornferry-road.method.stealth',
      'thornferry-road.method.diplomacy',
    ],
    ownerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    description: 'Method used at final crossing',
  },
];

/**
 * Global exclusive fact registry
 */
export class ExclusiveFactRegistry {
  private groups: Map<string, ExclusiveFactGroup>;
  private factToGroup: Map<string, string>;
  
  constructor() {
    this.groups = new Map();
    this.factToGroup = new Map();
    
    // Register all standard groups
    for (const group of THORNFERRY_EXCLUSIVE_GROUPS) {
      this.registerGroup(group);
    }
  }
  
  registerGroup(group: ExclusiveFactGroup): void {
    this.groups.set(group.id, group);
    
    // Map each member fact to this group
    for (const member of group.members) {
      this.factToGroup.set(member, group.id);
    }
  }
  
  getGroup(groupId: string): ExclusiveFactGroup | null {
    return this.groups.get(groupId) ?? null;
  }
  
  getGroupForFact(factId: string): ExclusiveFactGroup | null {
    const groupId = this.factToGroup.get(factId);
    return groupId ? this.getGroup(groupId) : null;
  }
  
  getAllGroups(): ExclusiveFactGroup[] {
    return Array.from(this.groups.values());
  }
  
  getAllFactsInGroup(groupId: string): readonly string[] {
    const group = this.getGroup(groupId);
    return group ? group.members : [];
  }
}

// Global registry instance
export const EXCLUSIVE_FACT_REGISTRY = new ExclusiveFactRegistry();

// ============================================================================
// FACT CONFLICT DETECTION
// ============================================================================

export interface FactConflict {
  hasConflict: boolean;
  conflictingFact?: string;
  groupId?: string;
  reason?: string;
}

/**
 * Check if fact write conflicts with existing facts
 */
export function checkFactConflict(
  factWrite: FactWrite,
  existingFacts: Readonly<Record<string, unknown>>,
  registry: ExclusiveFactRegistry = EXCLUSIVE_FACT_REGISTRY
): FactConflict {
  // Only check boolean true writes (setting false doesn't conflict)
  if (factWrite.value !== true) {
    return { hasConflict: false };
  }
  
  const group = registry.getGroupForFact(factWrite.factId);
  if (!group) {
    // Not in any exclusive group, no conflict
    return { hasConflict: false };
  }
  
  // Check if any other member of this group is already true
  for (const member of group.members) {
    if (member === factWrite.factId) continue; // Skip self
    
    if (existingFacts[member] === true) {
      return {
        hasConflict: true,
        conflictingFact: member,
        groupId: group.id,
        reason: `Cannot set ${factWrite.factId}=true because ${member}=true (group: ${group.id})`,
      };
    }
  }
  
  // For exactly-one-after-crisis groups, check if crisis is resolved
  if (group.mode === 'exactly-one-after-crisis') {
    const someSet = group.members.some(m => existingFacts[m] === true);
    if (!someSet && !factWrite.value) {
      // No fact set yet, and this write is false/unset - that's ok during setup
      return { hasConflict: false };
    }
  }
  
  return { hasConflict: false };
}

/**
 * Validate all fact writes in a batch
 */
export function validateFactWrites(
  factWrites: readonly FactWrite[],
  existingFacts: Readonly<Record<string, unknown>>,
  registry: ExclusiveFactRegistry = EXCLUSIVE_FACT_REGISTRY
): {
  valid: boolean;
  conflicts: Array<{
    factId: string;
    conflictingFact: string;
    groupId: string;
    reason: string;
  }>;
} {
  const conflicts: Array<{
    factId: string;
    conflictingFact: string;
    groupId: string;
    reason: string;
  }> = [];
  
  // Build cumulative fact state as we process writes
  const workingFacts = { ...existingFacts };
  
  for (const write of factWrites) {
    const conflict = checkFactConflict(write, workingFacts, registry);
    
    if (conflict.hasConflict) {
      conflicts.push({
        factId: write.factId,
        conflictingFact: conflict.conflictingFact!,
        groupId: conflict.groupId!,
        reason: conflict.reason!,
      });
    } else if (write.value !== undefined) {
      // Apply this write for next iteration
      workingFacts[write.factId] = write.value;
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Check if exactly-one requirement is satisfied
 */
export function validateExactlyOneRequirement(
  group: ExclusiveFactGroup,
  facts: Readonly<Record<string, unknown>>,
  crisisResolved: boolean
): {
  satisfied: boolean;
  reason?: string;
} {
  if (group.mode !== 'exactly-one-after-crisis') {
    return { satisfied: true };
  }
  
  if (!crisisResolved) {
    // Crisis not yet resolved, no requirement
    return { satisfied: true };
  }
  
  const setCount = group.members.filter(m => facts[m] === true).length;
  
  if (setCount === 0) {
    return {
      satisfied: false,
      reason: `Group ${group.id} requires exactly one fact after crisis ${group.ownerCrisisId} resolves, but none are set`,
    };
  }
  
  if (setCount > 1) {
    return {
      satisfied: false,
      reason: `Group ${group.id} requires exactly one fact, but ${setCount} are set`,
    };
  }
  
  return { satisfied: true };
}

// ============================================================================
// PREDICATE EVALUATION
// ============================================================================

/**
 * Evaluate a single fact predicate
 */
export function evaluatePredicate(
  pred: FactPredicate,
  facts: Readonly<Record<string, unknown>>
): boolean {
  const value = facts[pred.factId];
  
  switch (pred.op) {
    case 'exists':
      return value !== undefined && value !== null;
    case 'absent':
      return value === undefined || value === null;
    case 'eq':
      return value === pred.value;
    case 'neq':
      return value !== pred.value;
    case 'gte':
      return typeof value === 'number' && typeof pred.value === 'number' && value >= pred.value;
    case 'lte':
      return typeof value === 'number' && typeof pred.value === 'number' && value <= pred.value;
    default:
      return false;
  }
}

/**
 * Evaluate a predicate group
 */
export function evaluatePredicateGroup(
  group: PredicateGroup,
  facts: Readonly<Record<string, unknown>>
): boolean {
  // Check 'all' predicates
  if (group.all && group.all.length > 0) {
    if (!group.all.every(pred => evaluatePredicate(pred, facts))) {
      return false;
    }
  }
  
  // Check 'any' predicates
  if (group.any && group.any.length > 0) {
    if (!group.any.some(pred => evaluatePredicate(pred, facts))) {
      return false;
    }
  }
  
  // Check 'none' predicates
  if (group.none && group.none.length > 0) {
    if (group.none.some(pred => evaluatePredicate(pred, facts))) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// GAME STATE INTEGRATION
// ============================================================================

/**
 * Extract facts from game state
 */
export function extractFactsFromGameState(state: GameState): Record<string, unknown> {
  const facts: Record<string, unknown> = {};
  
  // Extract from pyoaBranchLedger
  const ledger = state.pyoaBranchLedger;
  if (!ledger) return facts;
  
  // Parse committed paths for fact patterns
  const paths = ledger.committedPaths ?? [];
  for (const path of paths) {
    if (path.startsWith('fact:')) {
      const factId = path.replace('fact:', '');
      facts[factId] = true;
    }
    
    // Map locked branches to facts
    if (path.startsWith('locked:')) {
      const locked = path.replace('locked:', '');
      
      // Map branch locks to exclusive facts
      switch (locked) {
        case 'millstone-commit':
          facts['thornferry-road.trust.miller'] = true;
          break;
        case 'solo-road':
          facts['thornferry-road.allegiance.neutral'] = true;
          break;
        case 'ally-path':
          facts['thornferry-road.allegiance.rebels'] = true;
          break;
        case 'help-overseer':
          facts['thornferry-road.allegiance.lord'] = true;
          break;
      }
    }
  }
  
  return facts;
}

/**
 * Commit fact write to game state
 */
export function commitFactWrite(
  factWrite: FactWrite,
  state: GameState
): GameState {
  const existingFacts = extractFactsFromGameState(state);
  const conflict = checkFactConflict(factWrite, existingFacts);
  
  if (conflict.hasConflict) {
    console.error('[PYOA] Fact conflict:', conflict);
    throw new Error(conflict.reason);
  }
  
  // Commit to ledger
  const ledger = state.pyoaBranchLedger ?? {
    activeBranch: 'none',
    committedPaths: [],
    charterUses: 0,
    branchClosed: false,
    convergencePoints: [],
  };
  
  return {
    ...state,
    pyoaBranchLedger: {
      ...ledger,
      committedPaths: [
        ...(ledger.committedPaths ?? []),
        `fact:${factWrite.factId}`,
      ].slice(-24),
    },
  };
}

/**
 * Build exclusive facts situation section for GM
 */
export function buildExclusiveFactsSituationSection(state: GameState): string {
  const facts = extractFactsFromGameState(state);
  const activeFacts = Object.entries(facts).filter(([_, v]) => v === true);
  
  if (activeFacts.length === 0) return '';
  
  const lines: string[] = ['### EXCLUSIVE FACTS'];
  lines.push('Branch commitments:');
  
  for (const [factId, _] of activeFacts) {
    const group = EXCLUSIVE_FACT_REGISTRY.getGroupForFact(factId);
    if (group) {
      lines.push(`- **${factId}**: ${group.description} (group: ${group.id})`);
    } else {
      lines.push(`- **${factId}**`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Validate all exclusive fact invariants
 */
export function validateExclusiveFactInvariants(
  state: GameState,
  registry: ExclusiveFactRegistry = EXCLUSIVE_FACT_REGISTRY
): {
  valid: boolean;
  errors: string[];
} {
  const facts = extractFactsFromGameState(state);
  const errors: string[] = [];
  
  // Check each group
  for (const group of registry.getAllGroups()) {
    const activeCount = group.members.filter(m => facts[m] === true).length;
    
    if (group.mode === 'at-most-one' && activeCount > 1) {
      errors.push(`Group ${group.id} allows at-most-one but has ${activeCount} active facts`);
    }
    
    if (group.mode === 'exactly-one-after-crisis') {
      // Check if owning crisis is resolved
      const ledger = state.pyoaBranchLedger;
      const paths = ledger?.committedPaths ?? [];
      const crisisResolved = group.ownerCrisisId
        ? paths.some(p => p.includes(group.ownerCrisisId!))
        : false;
      
      if (crisisResolved) {
        const validation = validateExactlyOneRequirement(group, facts, crisisResolved);
        if (!validation.satisfied) {
          errors.push(validation.reason!);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
