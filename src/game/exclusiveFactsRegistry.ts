/**
 * Exclusive Facts Registry
 * 
 * Central mutex validation for facts written by WS-2, WS-4, and WS-5.
 * Prevents conflicting facts from being written to the same run.
 * 
 * Example: Only one terminal outcome allowed per run (victory OR defeat OR fled OR ending_triumph)
 */

import type { ExclusiveFactGroup, FactWrite } from './crossPackageContracts';

// ============================================================================
// REGISTERED FACT GROUPS
// ============================================================================

/**
 * Shared exclusive fact groups across all three packages
 */
export const SHARED_FACT_GROUPS: readonly ExclusiveFactGroup[] = [
  // -------------------------------------------------------------------------
  // TERMINAL OUTCOMES (Cross-package)
  // -------------------------------------------------------------------------
  {
    id: 'terminal_outcome',
    mode: 'at-most-one',
    members: [
      // WS-4 encounter terminals
      'encounter_victory',
      'encounter_defeat',
      'encounter_fled',
      'encounter_parley',
      // WS-5 ending terminals
      'ending_triumph',
      'ending_transformation',
      'ending_costly_victory',
      'ending_escape',
      'ending_failure',
    ],
    ownerPackage: 'ws4', // WS-4 owns encounter terminals, WS-5 owns ending terminals
    description: 'Only one terminal outcome per run',
  },

  // -------------------------------------------------------------------------
  // PYOA PRIMARY ALLEGIANCE (WS-5)
  // -------------------------------------------------------------------------
  {
    id: 'pyoa_primary_allegiance',
    mode: 'exactly-one-after-crisis',
    members: [
      'allegiance_faction_a',
      'allegiance_faction_b',
      'allegiance_independent',
    ],
    ownerPackage: 'ws5',
    ownerCrisisId: 'alliance-fork',
    description: 'Must choose exactly one allegiance after alliance crisis',
  },

  // -------------------------------------------------------------------------
  // PYOA TRUST VERDICT (WS-5)
  // -------------------------------------------------------------------------
  {
    id: 'pyoa_trust_verdict',
    mode: 'at-most-one',
    members: [
      'trusted_mentor',
      'distrusted_mentor',
      'mentor_unknown',
    ],
    ownerPackage: 'ws5',
    description: 'At most one trust verdict per mentor',
  },

  // -------------------------------------------------------------------------
  // PYOA TRUTH DISPOSITION (WS-5)
  // -------------------------------------------------------------------------
  {
    id: 'pyoa_truth_disposition',
    mode: 'at-most-one',
    members: [
      'truth_revealed',
      'truth_concealed',
      'truth_distorted',
    ],
    ownerPackage: 'ws5',
    description: 'At most one truth disposition',
  },

  // -------------------------------------------------------------------------
  // PYOA FINAL METHOD (WS-5)
  // -------------------------------------------------------------------------
  {
    id: 'pyoa_final_method',
    mode: 'at-most-one',
    members: [
      'method_stealth',
      'method_force',
      'method_diplomacy',
      'method_sacrifice',
    ],
    ownerPackage: 'ws5',
    description: 'At most one final method',
  },

  // -------------------------------------------------------------------------
  // NPC ROLE STATES (WS-2)
  // -------------------------------------------------------------------------
  {
    id: 'npc_lifecycle_state',
    mode: 'exactly-one-after-crisis',
    members: [
      'npc_entering',
      'npc_functioning',
      'npc_debt_satisfied',
      'npc_exiting',
      'npc_transformed',
      'npc_absent',
    ],
    ownerPackage: 'ws2',
    description: 'NPCs must be in exactly one lifecycle state',
  },

  // -------------------------------------------------------------------------
  // ENCOUNTER SPAWN LOCKS (WS-4)
  // -------------------------------------------------------------------------
  {
    id: 'encounter_type_once_per_location',
    mode: 'at-most-one',
    members: [
      'encounter_boss_cleared',
      'encounter_elite_cleared',
      'encounter_trap_triggered',
      'encounter_puzzle_solved',
    ],
    ownerPackage: 'ws4',
    description: 'Certain encounter types can only occur once per location',
  },
];

// ============================================================================
// VALIDATION API
// ============================================================================

/**
 * Error thrown when exclusive fact constraints are violated
 */
export class FactConflictError extends Error {
  constructor(
    public readonly groupId: string,
    public readonly conflictingFacts: readonly string[],
    public readonly attemptedWrite: FactWrite
  ) {
    super(
      `Exclusive fact conflict in group "${groupId}": ` +
      `existing facts [${conflictingFacts.join(', ')}] conflict with ` +
      `attempted write "${attemptedWrite.factId}"`
    );
    this.name = 'FactConflictError';
  }
}

/**
 * Validate proposed fact writes against exclusive fact groups
 * 
 * @param currentFacts - Facts currently in the ledger
 * @param proposedWrites - Facts to be written
 * @throws {FactConflictError} if mutex violated
 */
export function assertExclusiveFacts(
  currentFacts: readonly string[],
  proposedWrites: readonly FactWrite[]
): void {
  const currentFactSet = new Set(currentFacts);
  
  // Check each proposed write
  for (const write of proposedWrites) {
    // Find all groups that contain this fact
    const relevantGroups = SHARED_FACT_GROUPS.filter(group =>
      group.members.includes(write.factId)
    );
    
    // Check each relevant group
    for (const group of relevantGroups) {
      // Find existing facts in this group
      const existingInGroup = group.members.filter(factId =>
        currentFactSet.has(factId)
      );
      
      // Check mutex constraint
      if (group.mode === 'at-most-one') {
        // At most one fact in group
        if (existingInGroup.length > 0 && !existingInGroup.includes(write.factId)) {
          throw new FactConflictError(group.id, existingInGroup, write);
        }
      } else if (group.mode === 'exactly-one-after-crisis') {
        // Exactly one after owner crisis resolves
        // (This is checked by WS-5 crisis resolver; we just validate no duplicates)
        if (existingInGroup.length > 0 && !existingInGroup.includes(write.factId)) {
          throw new FactConflictError(group.id, existingInGroup, write);
        }
      }
    }
  }
  
  // Also check: no more than one write per group in the same transaction
  const factIdsByGroup = new Map<string, string[]>();
  for (const write of proposedWrites) {
    for (const group of SHARED_FACT_GROUPS) {
      if (group.members.includes(write.factId)) {
        const existingInTx = factIdsByGroup.get(group.id) ?? [];
        if (existingInTx.length > 0 && !existingInTx.includes(write.factId)) {
          throw new FactConflictError(
            group.id,
            existingInTx,
            write
          );
        }
        factIdsByGroup.set(group.id, [...existingInTx, write.factId]);
      }
    }
  }
}

/**
 * Get all fact groups that contain the given fact ID
 */
export function getFactGroups(factId: string): readonly ExclusiveFactGroup[] {
  return SHARED_FACT_GROUPS.filter(group => group.members.includes(factId));
}

/**
 * Check if a fact ID is in any exclusive group
 */
export function isExclusiveFact(factId: string): boolean {
  return SHARED_FACT_GROUPS.some(group => group.members.includes(factId));
}

/**
 * Get the package that owns a fact group
 */
export function getGroupOwner(groupId: string): 'ws2' | 'ws4' | 'ws5' | null {
  const group = SHARED_FACT_GROUPS.find(g => g.id === groupId);
  return group?.ownerPackage ?? null;
}

// ============================================================================
// REGISTRY VALIDATION
// ============================================================================

/**
 * Validate the registry itself (called on startup)
 * 
 * Checks:
 * - No duplicate group IDs
 * - No fact appears in multiple at-most-one groups
 * - All groups have at least 2 members
 */
export function validateRegistry(): void {
  const groupIds = new Set<string>();
  const factIds = new Set<string>();
  const atMostOneFactIds = new Set<string>();
  
  for (const group of SHARED_FACT_GROUPS) {
    // Check duplicate group IDs
    if (groupIds.has(group.id)) {
      throw new Error(`Duplicate group ID: ${group.id}`);
    }
    groupIds.add(group.id);
    
    // Check group has enough members
    if (group.members.length < 2) {
      throw new Error(`Group ${group.id} has fewer than 2 members`);
    }
    
    // Check for overlapping at-most-one groups
    if (group.mode === 'at-most-one') {
      for (const factId of group.members) {
        if (atMostOneFactIds.has(factId)) {
          throw new Error(
            `Fact ${factId} appears in multiple at-most-one groups`
          );
        }
        atMostOneFactIds.add(factId);
      }
    }
    
    // Track all facts
    for (const factId of group.members) {
      factIds.add(factId);
    }
  }
  
  console.info(
    `[ExclusiveFactsRegistry] Validated ${SHARED_FACT_GROUPS.length} groups ` +
    `with ${factIds.size} unique facts`
  );
}

// Run validation on module load
validateRegistry();
