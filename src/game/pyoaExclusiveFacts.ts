/**
 * WS-5 Wave A: PYOA Exclusive Facts System
 * 
 * Mutex enforcement for branch facts.
 * Choosing "ally with lord" makes "ally with rebels" impossible.
 */

import type { GameState } from './types';
import type { FactWrite } from './types/crossPackageContracts';

// ============================================================================
// EXCLUSIVE FACT GROUPS
// ============================================================================

export interface ExclusiveFactGroup {
  /** Group ID */
  id: string;
  
  /** Group name */
  name: string;
  
  /** Mutex mode */
  mode: 'at-most-one' | 'exactly-one-after-crisis';
  
  /** Member fact IDs */
  members: readonly string[];
  
  /** Owner crisis (if exactly-one-after-crisis) */
  ownerCrisisId?: string;
  
  /** Description */
  description: string;
}

/**
 * Standard exclusive fact groups for PYOA
 */
export const STANDARD_EXCLUSIVE_GROUPS: ExclusiveFactGroup[] = [
  // Alliance groups
  {
    id: 'alliance-millstone',
    name: 'Millstone Charter Alliance',
    mode: 'exactly-one-after-crisis',
    members: ['lordAlly', 'rebelAlly'],
    ownerCrisisId: 'millstone-charter',
    description: 'Player must choose lord or rebels',
  },
  {
    id: 'trust-miller',
    name: 'Miller Trust',
    mode: 'exactly-one-after-crisis',
    members: ['millerTrusted', 'millerDoubt'],
    ownerCrisisId: 'trust-miller',
    description: 'Player must trust or doubt miller',
  },
  {
    id: 'bandits-villagers',
    name: 'Bandit or Villager Alliance',
    mode: 'exactly-one-after-crisis',
    members: ['banditAlly', 'villagerAlly'],
    ownerCrisisId: 'bandits-or-villagers',
    description: 'Player must side with bandits or villagers',
  },
  {
    id: 'faction-membership',
    name: 'Faction Membership',
    mode: 'exactly-one-after-crisis',
    members: ['factionMember', 'soloPath'],
    ownerCrisisId: 'alliance-proposal',
    description: 'Player joins faction or stays solo',
  },
  
  // Secret groups
  {
    id: 'secret-revelation',
    name: 'Secret Revelation',
    mode: 'exactly-one-after-crisis',
    members: ['secretRevealed', 'secretHidden'],
    ownerCrisisId: 'reveal-secret',
    description: 'Player reveals or conceals secret',
  },
  {
    id: 'nobles-plan',
    name: 'Nobles Plan Knowledge',
    mode: 'at-most-one',
    members: ['noblesPlanKnown'],
    description: 'Player knows nobles plan (convergence point)',
  },
];

// ============================================================================
// FACT REGISTRY
// ============================================================================

export class ExclusiveFactRegistry {
  private groups: Map<string, ExclusiveFactGroup>;
  private factToGroup: Map<string, string>;
  
  constructor() {
    this.groups = new Map();
    this.factToGroup = new Map();
    
    // Register standard groups
    for (const group of STANDARD_EXCLUSIVE_GROUPS) {
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
}

// Global registry instance
export const EXCLUSIVE_FACT_REGISTRY = new ExclusiveFactRegistry();

// ============================================================================
// FACT VALIDATION
// ============================================================================

/**
 * Check if fact write conflicts with existing facts
 */
export function checkFactConflict(
  factWrite: FactWrite,
  existingFacts: readonly string[],
  registry: ExclusiveFactRegistry = EXCLUSIVE_FACT_REGISTRY
): {
  hasConflict: boolean;
  conflictingFact?: string;
  groupId?: string;
  reason?: string;
} {
  const group = registry.getGroupForFact(factWrite.factId);
  if (!group) {
    // Not in any exclusive group, no conflict
    return { hasConflict: false };
  }
  
  // Check if any other member of this group is already true
  for (const member of group.members) {
    if (member === factWrite.factId) continue; // Skip self
    
    if (existingFacts.includes(member)) {
      return {
        hasConflict: true,
        conflictingFact: member,
        groupId: group.id,
        reason: `Cannot set ${factWrite.factId}=true because ${member}=true (group: ${group.name})`,
      };
    }
  }
  
  return { hasConflict: false };
}

/**
 * Validate all fact writes in a batch
 */
export function validateFactWrites(
  factWrites: readonly FactWrite[],
  state: GameState,
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
  const existingFacts = getExistingFacts(state);
  const conflicts: Array<{
    factId: string;
    conflictingFact: string;
    groupId: string;
    reason: string;
  }> = [];
  
  // Also check within the batch itself
  const batchFacts = new Set<string>(existingFacts);
  
  for (const write of factWrites) {
    // Skip if value is false (unsetting doesn't conflict)
    if (write.value === false) continue;
    
    const conflict = checkFactConflict(write, Array.from(batchFacts), registry);
    
    if (conflict.hasConflict) {
      conflicts.push({
        factId: write.factId,
        conflictingFact: conflict.conflictingFact!,
        groupId: conflict.groupId!,
        reason: conflict.reason!,
      });
    } else {
      // Add to batch facts for next iteration
      batchFacts.add(write.factId);
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Get existing facts from game state
 */
function getExistingFacts(state: GameState): string[] {
  const facts: string[] = [];
  
  // Extract from pyoaBranchLedger
  const ledger = state.pyoaBranchLedger;
  if (!ledger) return facts;
  
  // Parse committed paths for fact patterns
  const paths = ledger.committedPaths ?? [];
  for (const path of paths) {
    if (path.startsWith('locked:')) {
      const locked = path.replace('locked:', '');
      
      // Map locked branches to facts
      switch (locked) {
        case 'millstone-commit':
          facts.push('lordAlly');
          break;
        case 'solo-road':
          facts.push('soloPath');
          break;
        case 'ally-path':
          facts.push('factionMember');
          break;
      }
    }
  }
  
  // Also check branchLocked
  if (ledger.branchLocked) {
    switch (ledger.branchLocked) {
      case 'millstone-commit':
        facts.push('lordAlly');
        break;
      case 'solo-road':
        facts.push('soloPath');
        break;
      case 'ally-path':
        facts.push('factionMember');
        break;
    }
  }
  
  return facts;
}

// ============================================================================
// FACT COMMIT
// ============================================================================

/**
 * Commit fact write to game state
 * 
 * Validates exclusive facts before committing.
 */
export function commitFactWrite(
  factWrite: FactWrite,
  state: GameState
): GameState {
  const existingFacts = getExistingFacts(state);
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
  
  // Map fact to branch lock
  let branchLock: string | false = ledger.branchLocked ?? false;
  
  switch (factWrite.factId) {
    case 'lordAlly':
      branchLock = 'millstone-commit';
      break;
    case 'rebelAlly':
      branchLock = 'millstone-commit'; // Same lock, different side
      break;
    case 'millerTrusted':
    case 'millerDoubt':
      branchLock = 'trust-miller';
      break;
    case 'banditAlly':
    case 'villagerAlly':
      branchLock = 'bandits-or-villagers';
      break;
    case 'factionMember':
      branchLock = 'ally-path';
      break;
    case 'soloPath':
      branchLock = 'solo-road';
      break;
    case 'secretRevealed':
    case 'secretHidden':
      branchLock = 'reveal-secret';
      break;
  }
  
  return {
    ...state,
    pyoaBranchLedger: {
      ...ledger,
      branchLocked: branchLock,
      branchClosed: true,
      committedPaths: [
        ...(ledger.committedPaths ?? []),
        `fact:${factWrite.factId}`,
        `locked:${branchLock}`,
      ].slice(-24),
    },
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Check if fact is true
 */
export function isFactTrue(factId: string, state: GameState): boolean {
  const facts = getExistingFacts(state);
  return facts.includes(factId);
}

/**
 * Get conflicting facts
 */
export function getConflictingFacts(
  factId: string,
  state: GameState
): string[] {
  const group = EXCLUSIVE_FACT_REGISTRY.getGroupForFact(factId);
  if (!group) return [];
  
  const existingFacts = getExistingFacts(state);
  const conflicts: string[] = [];
  
  for (const member of group.members) {
    if (member !== factId && existingFacts.includes(member)) {
      conflicts.push(member);
    }
  }
  
  return conflicts;
}

/**
 * Build exclusive facts situation section
 */
export function buildExclusiveFactsSituationSection(state: GameState): string {
  const facts = getExistingFacts(state);
  if (facts.length === 0) return '';
  
  const lines: string[] = ['### EXCLUSIVE FACTS'];
  lines.push('Branch locks currently active:');
  
  for (const fact of facts) {
    const group = EXCLUSIVE_FACT_REGISTRY.getGroupForFact(fact);
    if (group) {
      lines.push(`- **${fact}**: ${group.description}`);
    } else {
      lines.push(`- **${fact}**`);
    }
  }
  
  return lines.join('\n');
}
