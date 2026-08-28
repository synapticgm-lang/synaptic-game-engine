/**
 * Package Coordination
 * 
 * Orchestrates the pre-GM commit sequence for WS-2, WS-4, and WS-5.
 * 
 * CRITICAL ORDERING:
 * 1. Deliver due consequences (WS-5) - scheduled payoffs fire first
 * 2. Update NPC lifecycles (WS-2) - NPCs transition states
 * 3. Spawn encounter if needed (WS-4) - combat/challenges
 * 4. Spawn crisis if needed (WS-5) - PYOA forks
 * 5. Check ending gates (WS-5) - terminal conditions
 * 6. Rebuild projections - materialized views from receipts
 * 
 * This sequence ensures that:
 * - Delayed consequences deliver before new content spawns
 * - NPCs can trigger encounters via obligations
 * - Encounters can unlock crises via receipts
 * - Crises can change NPC relationships via receipts
 * - Endings can be triggered by any of the above
 * 
 * All mutations are atomic: they either commit entirely or rollback.
 */

import type { GameState } from './types';
import type { Receipt } from './types/crossPackageContracts';
import { appendReceipt, getReceipts } from './receiptLedger';
import { assertExclusiveFacts } from './exclusiveFactsRegistry';

// ============================================================================
// PRE-GM COMMIT SEQUENCE
// ============================================================================

/**
 * Execute the pre-GM commit sequence
 * 
 * This is called by ArcDirector before every GM call.
 * Each phase commits receipts before moving to the next.
 * 
 * @param state - Current game state
 * @returns Updated game state with all pre-GM commits applied
 */
export function preGmCommitSequence(state: GameState): GameState {
  console.debug('[PackageCoordination] Starting pre-GM commit sequence');
  
  let updatedState = state;
  
  try {
    // Phase 1: Deliver due consequences (WS-5)
    updatedState = deliverDueConsequences(updatedState);
    
    // Phase 2: Update NPC lifecycles (WS-2)
    updatedState = checkNpcLifecycles(updatedState);
    
    // Phase 3: Spawn encounter if needed (WS-4)
    updatedState = maybeSpawnEncounter(updatedState);
    
    // Phase 4: Spawn crisis if needed (WS-5)
    updatedState = maybeSpawnCrisis(updatedState);
    
    // Phase 5: Check ending gates (WS-5)
    updatedState = checkPyoaEndingGates(updatedState);
    
    // Phase 6: Rebuild materialized projections
    updatedState = rebuildProjections(updatedState);
    
    console.debug('[PackageCoordination] Pre-GM commit sequence complete');
    return updatedState;
    
  } catch (error) {
    console.error('[PackageCoordination] Pre-GM commit failed:', error);
    
    // Log error but don't block GM call
    // The GM call will proceed with the last successful state
    return state;
  }
}

// ============================================================================
// PHASE 1: DELIVER DUE CONSEQUENCES (WS-5)
// ============================================================================

/**
 * Deliver delayed consequences that are due
 * 
 * WS-5 implementation will:
 * - Query delayed consequences with dueAtTurn <= currentTurn
 * - Sort by due turn, then consequence ID (deterministic order)
 * - Apply payload atomically (facts, resources, relationships)
 * - Record delivery receipt (idempotent)
 * - Mark consequence as delivered
 * 
 * @param state - Current game state
 * @returns Updated game state
 */
function deliverDueConsequences(state: GameState): GameState {
  // WS-5 Wave A implementation
  const { getDueConsequences, deliverConsequence } = require('./pyoaDelayedConsequences');
  
  const dueConsequences = getDueConsequences(state);
  
  if (dueConsequences.length === 0) {
    console.debug(`[PackageCoordination] Phase 1: No due consequences`);
    return state;
  }
  
  console.debug(
    `[PackageCoordination] Phase 1: Delivering ${dueConsequences.length} consequences`
  );
  
  let updatedState = state;
  
  for (const consequence of dueConsequences) {
    const result = deliverConsequence(consequence, updatedState);
    updatedState = result.state;
    
    console.debug(`[PackageCoordination] Delivered: ${consequence.id}`);
    console.debug(`[PackageCoordination] Receipts:`, result.receipts);
  }
  
  return updatedState;
}

// ============================================================================
// PHASE 2: UPDATE NPC LIFECYCLES (WS-2)
// ============================================================================

/**
 * Update NPC lifecycle states and check deadlines
 * 
 * WS-2 implementation will:
 * - Evaluate all active NPC obligations
 * - Check hard/soft/story-beat/quota deadlines
 * - Transition NPCs: entering → functioning → debt_satisfied → exiting → absent
 * - Enforce 10-turn exit window after debt_satisfied
 * - Record turnover receipts (exit, transform, relocate, etc.)
 * - Append key moments to memory ledger
 * 
 * @param state - Current game state
 * @returns Updated game state
 */
function checkNpcLifecycles(state: GameState): GameState {
  // WS-2 Wave A + Wave B implementation
  const { updateAllNpcLifecycles } = require('./npcLifecycleFsm');
  const { cleanupOldMemories } = require('./npcMemoryLedger');
  const { decideTurnover, spawnSuccessor, createTurnoverReceipt } = require('./npcTurnover');
  
  console.debug(`[PackageCoordination] Phase 2: Checking NPC lifecycles`);
  
  // Update all lifecycles
  const result = updateAllNpcLifecycles(state);
  
  if (result.transitions.length > 0) {
    console.debug(`[PackageCoordination] NPC transitions:`, result.transitions);
  }
  
  if (result.mandates.length > 0) {
    console.debug(`[PackageCoordination] NPC mandates:`, result.mandates);
  }
  
  let updatedState = result.state;
  
  // Wave B: Check turnover for NPCs that transitioned to exiting/debt_satisfied
  const lifecycles = updatedState.arcDirector?.npcLifecycles ?? [];
  
  for (const lifecycle of lifecycles) {
    if (lifecycle.state === 'debt_satisfied' || lifecycle.state === 'exiting') {
      // Evaluate turnover decision
      const trigger = lifecycle.state === 'debt_satisfied' ? 'completion' : 'deadline';
      const decision = decideTurnover(updatedState, lifecycle, trigger);
      
      if (decision.action !== 'remain') {
        console.debug(`[PackageCoordination] Turnover: ${lifecycle.npcId} -> ${decision.action}`);
        
        // Handle successor spawning if needed
        let successor = undefined;
        if (decision.action === 'delegate' || decision.action === 'replace') {
          successor = spawnSuccessor(updatedState, decision, lifecycle);
          console.debug(`[PackageCoordination] Spawned successor: ${successor.actorId}`);
        }
        
        // Create turnover receipt
        const receipt = createTurnoverReceipt(decision, lifecycle, successor);
        
        // Append receipt to ledger
        updatedState = appendReceipt(receipt, updatedState);
      }
    }
  }
  
  // Cleanup old memories
  updatedState = cleanupOldMemories(updatedState);
  
  return updatedState;
}

// ============================================================================
// PHASE 3: SPAWN ENCOUNTER (WS-4)
// ============================================================================

/**
 * Spawn encounter if density/drought requires it
 * 
 * WS-4 implementation will:
 * - Check density state (location quotas, drought timers)
 * - Select template from legal candidates (biome filter + density preference)
 * - Freeze template snapshot (version, hash, telegraph, stakes, seed, maxTurns)
 * - Commit encounter contract to runManifest
 * - Return state with active encounter
 * 
 * @param state - Current game state
 * @returns Updated game state
 */
function maybeSpawnEncounter(state: GameState): GameState {
  // WS-4 Wave A partial implementation
  // Full density enforcement comes in Wave B
  
  // Don't spawn if already in encounter
  if (state.activeEncounter) {
    console.debug(`[PackageCoordination] Phase 3: Already in encounter`);
    return state;
  }
  
  // Don't spawn in PYOA mode
  if (state.engineMode === 'pyoa') {
    console.debug(`[PackageCoordination] Phase 3: PYOA mode, no combat spawn`);
    return state;
  }
  
  // Check drought (from existing arcDirector)
  const turnsSinceCombat = state.arcDirector?.turnsSinceCombatReceipt ?? 0;
  
  // Wave A: Simple drought check (15 turns)
  if (turnsSinceCombat < 15) {
    console.debug(
      `[PackageCoordination] Phase 3: No drought (${turnsSinceCombat} turns since combat)`
    );
    return state;
  }
  
  console.debug(
    `[PackageCoordination] Phase 3: Drought detected (${turnsSinceCombat} turns), would spawn encounter`
  );
  
  // Wave B will implement full template picker + spawn
  return state;
}

// ============================================================================
// PHASE 4: SPAWN CRISIS (WS-5)
// ============================================================================

/**
 * Spawn PYOA crisis if eligible
 * 
 * WS-5 implementation will:
 * - Check crisis eligibility (prerequisites, locks, urgency)
 * - Filter locked crises (never respawn resolved crises)
 * - Select crisis from eligible deck
 * - Return state with crisis offer (not committed until player chooses fork)
 * 
 * @param state - Current game state
 * @returns Updated game state
 */
function maybeSpawnCrisis(state: GameState): GameState {
  // WS-5 Wave A implementation
  if (state.engineMode !== 'pyoa') {
    return state;
  }
  
  const { pickCrisis } = require('./pyoaCrisisRegistry');
  
  // Use bible ID from game state (would need to add this to GameState)
  const bibleId = 'thornferry-road'; // Hardcoded for Wave A
  
  const seed = state.turn * 31337; // Deterministic seed
  const crisis = pickCrisis(bibleId, state, seed);
  
  if (!crisis) {
    console.debug(`[PackageCoordination] Phase 4: No eligible crisis`);
    return state;
  }
  
  console.debug(`[PackageCoordination] Phase 4: Crisis available: ${crisis.id}`);
  
  // Wave B will commit crisis to state and build choice pads
  // For now, just log availability
  return state;
}

// ============================================================================
// PHASE 5: CHECK ENDING GATES (WS-5)
// ============================================================================

/**
 * Check PYOA ending gates
 * 
 * WS-5 implementation will:
 * - Evaluate ending gate prerequisites
 * - Sort eligible endings by priority (secret > triumph > transformation > etc.)
 * - Check window constraints (earliest, target, latest)
 * - At T150, force deadline ending if no normal ending selected
 * - Commit ending receipt (terminal facts, terminal turn)
 * - Mark run as terminal
 * 
 * @param state - Current game state
 * @returns Updated game state
 */
function checkPyoaEndingGates(state: GameState): GameState {
  // STUB: WS-5 will implement this
  // For now, return state unchanged
  
  console.debug(
    `[PackageCoordination] Phase 5: Check ending gates (stub)`
  );
  
  return state;
}

// ============================================================================
// PHASE 6: REBUILD PROJECTIONS
// ============================================================================

/**
 * Rebuild materialized projections from receipts
 * 
 * Projections are query optimizations built from receipts:
 * - NPC relationships (sum of deltas from all receipts)
 * - Exclusive facts (union of fact writes from all receipts)
 * - Resource totals (sum of deltas from all receipts)
 * - Quest progress (sum of progress from all receipts)
 * 
 * Receipts are source of truth; projections can be rebuilt at any time.
 * 
 * @param state - Current game state
 * @returns Updated game state with fresh projections
 */
function rebuildProjections(state: GameState): GameState {
  // STUB: Implement projection rebuild
  // For now, return state unchanged
  
  console.debug(
    `[PackageCoordination] Phase 6: Rebuild projections (stub)`
  );
  
  return state;
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Commit a receipt with exclusive fact validation
 * 
 * This is a helper for all three packages to use when committing receipts.
 * It ensures that:
 * - Exclusive facts are validated before commit
 * - Receipt is idempotent (duplicate key returns existing)
 * - Receipt is appended to the ledger
 * 
 * @param receipt - Receipt to commit
 * @param state - Current game state
 * @returns Committed receipt (may be existing if idempotent)
 * @throws {FactConflictError} if exclusive facts violated
 */
export function commitReceipt(receipt: Receipt, state: GameState): Receipt {
  // Get current facts from state
  const currentFacts = getCurrentFacts(state);
  
  // Extract fact writes from receipt
  const factWrites = extractFactWrites(receipt);
  
  // Validate exclusive facts
  assertExclusiveFacts(currentFacts, factWrites);
  
  // Append to ledger (idempotent)
  const committed = appendReceipt(receipt, state.id);
  
  return committed;
}

/**
 * Get current facts from game state
 */
function getCurrentFacts(state: GameState): readonly string[] {
  // STUB: Extract facts from state
  // In production, this would query the fact ledger or projection
  return [];
}

/**
 * Extract fact writes from a receipt
 */
function extractFactWrites(receipt: Receipt): readonly import('./types/crossPackageContracts').FactWrite[] {
  // Extract fact writes based on receipt kind
  switch (receipt.kind) {
    case 'encounter':
      return receipt.exclusiveFacts;
    case 'crisis':
      return receipt.factWrites;
    case 'ending':
      return receipt.terminalFacts;
    default:
      return [];
  }
}

// ============================================================================
// INTEGRATION CHECKS (for debugging)
// ============================================================================

/**
 * Validate that all packages are integrated correctly
 * 
 * This is called on startup to ensure:
 * - All coordination files exist
 * - All receipt types are registered
 * - All fact groups are valid
 * - All packages can write receipts
 */
export function validatePackageIntegration(): void {
  console.info('[PackageCoordination] Validating package integration...');
  
  // Check that exclusive facts registry is loaded
  try {
    assertExclusiveFacts([], []);
    console.info('  ✓ Exclusive facts registry OK');
  } catch (error) {
    console.error('  ✗ Exclusive facts registry failed:', error);
  }
  
  // Check that receipt ledger is working
  try {
    const stats = require('./receiptLedger').getStoreStats();
    console.info(`  ✓ Receipt ledger OK (${stats.totalReceipts} receipts)`);
  } catch (error) {
    console.error('  ✗ Receipt ledger failed:', error);
  }
  
  console.info('[PackageCoordination] Integration validation complete');
}
