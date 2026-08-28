/**
 * WS-5 Wave B: PYOA Convergence Detection
 * 
 * Complete convergence system with:
 * - Branch state comparison
 * - Convergence point detection
 * - Merge validation
 * - Catalog structure inspection
 * - Provenance preservation
 */

import type { GameState } from './types';
import type {
  ConvergenceSpec,
  ConvergenceReceipt,
  FactId,
  PredicateGroup,
  Turn,
} from './pyoaTypes';
import { evaluatePredicateGroup, extractFactsFromGameState } from './pyoaExclusiveFacts';

// ============================================================================
// CONVERGENCE SPECIFICATIONS
// ============================================================================

/**
 * Thornferry Road convergence points
 */
export const THORNFERRY_CONVERGENCES: ConvergenceSpec[] = [
  {
    schemaVersion: 1,
    id: 'thornferry-road:convergence:1_road_merges',
    bibleId: 'thornferry-road',
    title: 'All Roads Reach the Buried Mile',
    window: {
      earliest: 88,
      target: 92,
      latest: 96,
    },
    eligibleWhen: {
      any: [
        { factId: 'thornferry-road.truth.revealed', op: 'exists' },
        { factId: 'thornferry-road.truth.concealed', op: 'exists' },
      ],
    },
    equivalentOn: ['thornferry-road.state.secret_resolved'],
    preserveProvenanceFacts: [
      'thornferry-road.allegiance.lord',
      'thornferry-road.allegiance.rebels',
      'thornferry-road.allegiance.neutral',
      'thornferry-road.truth.revealed',
      'thornferry-road.truth.concealed',
      'thornferry-road.village.saved',
      'thornferry-road.village.abandoned',
    ],
    spawnCrisisId: 'thornferry-road:crisis:5_alliance_proposal',
    oncePerRun: true,
    journalText: 'All paths converge at the buried mile. Your earlier choices remain known.',
  },
  {
    schemaVersion: 1,
    id: 'thornferry-road:convergence:2_end_of_road',
    bibleId: 'thornferry-road',
    title: 'Thornferry Crossing',
    window: {
      earliest: 116,
      target: 120,
      latest: 124,
    },
    eligibleWhen: {
      any: [
        { factId: 'thornferry-road.alliance.accepted', op: 'exists' },
        { factId: 'thornferry-road.alliance.rejected', op: 'exists' },
      ],
    },
    equivalentOn: ['thornferry-road.state.alliance_resolved'],
    preserveProvenanceFacts: [
      'thornferry-road.alliance.accepted',
      'thornferry-road.alliance.rejected',
      'thornferry-road.allegiance.lord',
      'thornferry-road.allegiance.rebels',
      'thornferry-road.allegiance.neutral',
      'thornferry-road.truth.revealed',
      'thornferry-road.truth.concealed',
    ],
    spawnCrisisId: 'thornferry-road:crisis:6_final_crossing',
    oncePerRun: true,
    journalText: 'The road ends at Thornferry. All decisions lead here.',
  },
];

// ============================================================================
// BRANCH STATE
// ============================================================================

export interface BranchState {
  branchId: string;
  activeFacts: Set<string>;
  excludedFacts: Set<string>;
  crisisPath: string[];
  convergencePoint?: string;
}

/**
 * Extract branch state from game state
 */
export function extractBranchState(
  branchId: string,
  gs: GameState
): BranchState {
  const facts = extractFactsFromGameState(gs);
  const activeFacts = new Set<string>();
  const excludedFacts = new Set<string>();
  
  for (const [factId, value] of Object.entries(facts)) {
    if (value === true) {
      activeFacts.add(factId);
    } else if (value === false) {
      excludedFacts.add(factId);
    }
  }
  
  // Get crisis path
  const ledger = gs.pyoaBranchLedger;
  const paths = ledger?.committedPaths ?? [];
  const crisisPath = paths.filter(p => p.startsWith('crisis:') || p.includes(':crisis:'));
  
  return {
    branchId,
    activeFacts,
    excludedFacts,
    crisisPath,
  };
}

/**
 * Compare two branch states for equivalence
 */
export function compareBranchStates(
  stateA: BranchState,
  stateB: BranchState
): {
  equivalent: boolean;
  sharedFacts: string[];
  differentFacts: string[];
} {
  const sharedFacts: string[] = [];
  const differentFacts: string[] = [];
  
  // Check active facts
  for (const fact of stateA.activeFacts) {
    if (stateB.activeFacts.has(fact)) {
      sharedFacts.push(fact);
    } else {
      differentFacts.push(fact);
    }
  }
  
  // Check facts only in B
  for (const fact of stateB.activeFacts) {
    if (!stateA.activeFacts.has(fact)) {
      differentFacts.push(fact);
    }
  }
  
  const equivalent = differentFacts.length === 0 &&
    stateA.activeFacts.size === stateB.activeFacts.size;
  
  return {
    equivalent,
    sharedFacts,
    differentFacts,
  };
}

// ============================================================================
// CONVERGENCE DETECTION
// ============================================================================

export interface ConvergenceCheck {
  isConverging: boolean;
  convergenceSpec?: ConvergenceSpec;
  reason?: string;
}

/**
 * Check if convergence point is eligible
 */
export function isConvergenceEligible(
  spec: ConvergenceSpec,
  state: GameState,
  currentTurn: Turn
): boolean {
  // Check turn window
  if (currentTurn < spec.window.earliest || currentTurn > spec.window.latest) {
    return false;
  }
  
  // Check if already converged
  const ledger = state.pyoaBranchLedger;
  const existing = (ledger?.convergencePoints ?? []).find(
    cp => cp.stateHash === spec.id
  );
  if (existing) {
    return false; // Already converged
  }
  
  // Check prerequisites
  const facts = extractFactsFromGameState(state);
  if (!evaluatePredicateGroup(spec.eligibleWhen, facts)) {
    return false;
  }
  
  return true;
}

/**
 * Check if current state is approaching convergence
 */
export function checkConvergence(
  gs: GameState,
  convergenceSpecs: readonly ConvergenceSpec[]
): ConvergenceCheck {
  const currentTurn = gs.turn;
  
  // Check each known convergence point
  for (const spec of convergenceSpecs) {
    if (isConvergenceEligible(spec, gs, currentTurn)) {
      return {
        isConverging: true,
        convergenceSpec: spec,
        reason: `Approaching convergence: ${spec.title}`,
      };
    }
  }
  
  return {
    isConverging: false,
    reason: 'No convergence point reached',
  };
}

/**
 * Get all eligible convergence points
 */
export function getEligibleConvergencePoints(
  bibleId: string,
  state: GameState
): ConvergenceSpec[] {
  // For now, only Thornferry Road is implemented
  if (bibleId !== 'thornferry-road') {
    return [];
  }
  
  const currentTurn = state.turn;
  return THORNFERRY_CONVERGENCES.filter(spec =>
    isConvergenceEligible(spec, state, currentTurn)
  );
}

// ============================================================================
// MERGE VALIDATION
// ============================================================================

export interface MergeValidation {
  valid: boolean;
  conflicts: string[];
  warnings: string[];
}

/**
 * Validate branch merge legality
 */
export function validateMerge(
  sourceState: BranchState,
  targetState: BranchState
): MergeValidation {
  const conflicts: string[] = [];
  const warnings: string[] = [];
  
  // Check for fact conflicts
  for (const fact of sourceState.activeFacts) {
    if (targetState.excludedFacts.has(fact)) {
      conflicts.push(`Source has "${fact}" active, but target excludes it`);
    }
  }
  
  for (const fact of sourceState.excludedFacts) {
    if (targetState.activeFacts.has(fact)) {
      conflicts.push(`Source excludes "${fact}", but target has it active`);
    }
  }
  
  // Warn about fact asymmetry
  const onlyInSource = Array.from(sourceState.activeFacts).filter(
    f => !targetState.activeFacts.has(f)
  );
  
  const onlyInTarget = Array.from(targetState.activeFacts).filter(
    f => !sourceState.activeFacts.has(f)
  );
  
  if (onlyInSource.length > 0) {
    warnings.push(`${onlyInSource.length} facts only in source: ${onlyInSource.slice(0, 3).join(', ')}`);
  }
  
  if (onlyInTarget.length > 0) {
    warnings.push(`${onlyInTarget.length} facts only in target: ${onlyInTarget.slice(0, 3).join(', ')}`);
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings,
  };
}

// ============================================================================
// CONVERGENCE COMMIT
// ============================================================================

/**
 * Commit convergence to game state
 */
export function commitConvergence(
  spec: ConvergenceSpec,
  state: GameState
): {
  state: GameState;
  receipt: ConvergenceReceipt;
  mandate: string;
} {
  const ledger = state.pyoaBranchLedger ?? {
    activeBranch: 'none',
    committedPaths: [],
    charterUses: 0,
    branchClosed: false,
    convergencePoints: [],
  };
  
  // Compute state hash
  const facts = extractFactsFromGameState(state);
  const hashInput = spec.equivalentOn.map(f => `${f}=${facts[f]}`).join(';');
  const stateHash = simpleHash(hashInput);
  
  // Build receipt
  const receipt: ConvergenceReceipt = {
    kind: 'convergence',
    schemaVersion: 1,
    receiptId: `conv-${spec.id}-${state.turn}`,
    runId: state.saveId ?? 'unknown',
    bibleId: spec.bibleId,
    convergenceId: spec.id,
    projectionHash: stateHash,
    preservedFacts: spec.preserveProvenanceFacts,
    committedAtTurn: state.turn,
    idempotencyKey: `${state.saveId}::${spec.id}`,
  };
  
  // Record convergence point
  const convergencePoint = {
    turn: state.turn,
    branches: [ledger.activeBranch ?? 'unknown'],
    stateHash,
  };
  
  // Update ledger
  const nextLedger = {
    ...ledger,
    convergencePoints: [
      ...(ledger.convergencePoints ?? []),
      convergencePoint,
    ].slice(-10),
    committedPaths: [
      ...(ledger.committedPaths ?? []),
      `convergence:${spec.id}`,
    ].slice(-24),
    // Unlock branch after convergence
    branchLocked: false,
    branchClosed: false,
  };
  
  const nextState = {
    ...state,
    pyoaBranchLedger: nextLedger,
  };
  
  const mandate = `CONVERGENCE (${spec.id}): ${spec.title}\n` +
    `Preserved facts: ${spec.preserveProvenanceFacts.length}\n` +
    `Next crisis: ${spec.spawnCrisisId}`;
  
  return {
    state: nextState,
    receipt,
    mandate,
  };
}

// ============================================================================
// CATALOG VALIDATION
// ============================================================================

/**
 * Validate convergence catalog
 */
export function validateConvergenceCatalog(
  convergences: readonly ConvergenceSpec[]
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const conv of convergences) {
    // Check window validity
    if (conv.window.earliest > conv.window.target) {
      errors.push(`${conv.id}: earliest (${conv.window.earliest}) > target (${conv.window.target})`);
    }
    if (conv.window.target > conv.window.latest) {
      errors.push(`${conv.id}: target (${conv.window.target}) > latest (${conv.window.latest})`);
    }
    
    // Check equivalence projection
    if (conv.equivalentOn.length === 0) {
      warnings.push(`${conv.id}: no equivalence projection defined`);
    }
    
    // Check provenance preservation
    if (conv.preserveProvenanceFacts.length === 0) {
      warnings.push(`${conv.id}: no provenance facts preserved`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// SITUATION PACKET INTEGRATION
// ============================================================================

/**
 * Build convergence situation section
 */
export function buildConvergenceSituationSection(
  state: GameState,
  check: ConvergenceCheck
): string {
  if (!check.isConverging || !check.convergenceSpec) {
    return '';
  }
  
  const spec = check.convergenceSpec;
  const lines: string[] = ['### CONVERGENCE'];
  lines.push(`**${spec.title}**`);
  lines.push(`Turn window: T${spec.window.earliest}–T${spec.window.latest}`);
  lines.push(`Preserved facts: ${spec.preserveProvenanceFacts.length} commitments remain visible`);
  lines.push(`Next: ${spec.journalText}`);
  
  return lines.join('\n');
}

/**
 * Build fog-of-war journal section
 */
export function buildFogOfWarJournalSection(
  gs: GameState,
  convergenceCheck: ConvergenceCheck
): string {
  const lines: string[] = ['### Your Path'];
  
  // Show crisis history (obscured)
  const ledger = gs.pyoaBranchLedger;
  const crisisHistory = (ledger?.committedPaths ?? [])
    .filter(p => p.includes(':crisis:'))
    .slice(-5);
  
  if (crisisHistory.length > 0) {
    lines.push('', '**Choices Made:**');
    for (const crisisId of crisisHistory) {
      const obscured = crisisId
        .replace(/^.*:crisis:/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`- ${obscured}`);
    }
  }
  
  // Show convergence hint if approaching
  if (convergenceCheck.isConverging && convergenceCheck.convergenceSpec) {
    lines.push('', '**Ahead:**');
    lines.push(`- ${convergenceCheck.convergenceSpec.journalText}`);
  }
  
  // Show pending consequences
  const pendingConsequences = gs.arcDirector?.pyoaDelayedConsequences?.filter(
    c => c.status === 'pending'
  ) ?? [];
  
  if (pendingConsequences.length > 0) {
    lines.push('', '**Echoes Forward:**');
    lines.push(`- ${pendingConsequences.length} choice${pendingConsequences.length > 1 ? 's' : ''} will matter...`);
  }
  
  return lines.join('\n');
}

// ============================================================================
// TELEMETRY
// ============================================================================

/**
 * Get convergence telemetry
 */
export function getConvergenceTelemetry(
  gs: GameState,
  bibleId: string
): {
  branchState: BranchState;
  convergenceSpecs: readonly ConvergenceSpec[];
  convergenceCheck: ConvergenceCheck;
  eligible: readonly ConvergenceSpec[];
} {
  const branchState = extractBranchState('current', gs);
  const convergenceSpecs = bibleId === 'thornferry-road' ? THORNFERRY_CONVERGENCES : [];
  const convergenceCheck = checkConvergence(gs, convergenceSpecs);
  const eligible = getEligibleConvergencePoints(bibleId, gs);
  
  return {
    branchState,
    convergenceSpecs,
    convergenceCheck,
    eligible,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Simple hash function for state projection
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
