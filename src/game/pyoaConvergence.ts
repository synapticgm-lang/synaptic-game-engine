/**
 * WS-5 Wave C: PYOA Convergence Detection
 * 
 * Detects when divergent branches converge or merge with:
 * - Branch state comparison
 * - Convergence point detection
 * - Merge validation
 * - Catalog structure inspection
 * 
 * Architecture:
 * - Compares exclusive facts across branches
 * - Detects when branches reach equivalent states
 * - Validates merge legality (no fact conflicts)
 * - Inspects crisis catalog for convergence points
 */

import type { GameState } from './types';
import type { FactWrite } from './types/crossPackageContracts';

export interface BranchState {
  branchId: string;
  activeFacts: Set<string>;
  excludedFacts: Set<string>;
  crisisPath: string[];
  convergencePoint?: string;
}

export interface ConvergencePoint {
  crisisId: string;
  convergingBranches: string[];
  sharedFacts: string[];
  requiredFacts: string[];
  description: string;
}

export interface ConvergenceCheck {
  isConverging: boolean;
  convergencePoint?: ConvergencePoint;
  reason?: string;
}

export interface MergeValidation {
  valid: boolean;
  conflicts: string[];
  warnings: string[];
}

// ============================================================================
// Branch State Comparison
// ============================================================================

/**
 * Wave C: Extract branch state from game state
 */
export function extractBranchState(
  branchId: string,
  gs: GameState
): BranchState {
  // Get exclusive facts from registry
  const exclusiveFacts = gs.arcDirector?.exclusiveFacts ?? {};
  const activeFacts = new Set<string>();
  const excludedFacts = new Set<string>();
  
  for (const [factId, value] of Object.entries(exclusiveFacts)) {
    if (value === true) {
      activeFacts.add(factId);
    } else if (value === false) {
      excludedFacts.add(factId);
    }
  }
  
  // Get crisis path
  const crisisPath = gs.arcDirector?.pyoaCrisisHistory ?? [];
  
  return {
    branchId,
    activeFacts,
    excludedFacts,
    crisisPath
  };
}

/**
 * Wave C: Compare two branch states for equivalence
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
  
  // States are equivalent if they share all critical facts
  // and have no conflicting facts
  const equivalent = differentFacts.length === 0 &&
    stateA.activeFacts.size === stateB.activeFacts.size;
  
  return {
    equivalent,
    sharedFacts,
    differentFacts
  };
}

// ============================================================================
// Convergence Detection
// ============================================================================

/**
 * Wave C: Detect convergence points in catalog
 */
export function detectConvergencePoints(
  bibleId: string
): ConvergencePoint[] {
  // Placeholder - real implementation would load from crisis catalog
  // This would analyze the crisis graph structure to find natural merge points
  
  if (bibleId === 'thornferry-road') {
    return [
      {
        crisisId: 'thornferry_convergence_main',
        convergingBranches: ['ally_path', 'betray_path', 'solo_path'],
        sharedFacts: ['reached_thornferry', 'confronted_threat'],
        requiredFacts: ['primary_allegiance'],
        description: 'All paths converge at Thornferry crossroads'
      }
    ];
  }
  
  return [];
}

/**
 * Wave C: Check if current state is approaching convergence
 */
export function checkConvergence(
  gs: GameState,
  knownConvergencePoints: ConvergencePoint[]
): ConvergenceCheck {
  const currentState = extractBranchState('current', gs);
  
  // Check each known convergence point
  for (const point of knownConvergencePoints) {
    // Check if we have all required facts for this convergence
    const hasRequiredFacts = point.requiredFacts.every(fact =>
      currentState.activeFacts.has(fact)
    );
    
    if (hasRequiredFacts) {
      // Check if we're at or near the convergence crisis
      const recentCrises = currentState.crisisPath.slice(-3);
      const isAtConvergence = recentCrises.includes(point.crisisId);
      
      if (isAtConvergence || recentCrises.length === 0) {
        return {
          isConverging: true,
          convergencePoint: point,
          reason: `Approaching convergence: ${point.description}`
        };
      }
    }
  }
  
  return {
    isConverging: false,
    reason: 'No convergence point reached'
  };
}

// ============================================================================
// Merge Validation
// ============================================================================

/**
 * Wave C: Validate branch merge legality
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
    warnings
  };
}

// ============================================================================
// Catalog Inspection
// ============================================================================

/**
 * Wave C: Inspect crisis catalog structure
 */
export function inspectCatalogStructure(
  bibleId: string
): {
  totalCrises: number;
  branchingPoints: number;
  convergencePoints: number;
  terminalPaths: number;
  warnings: string[];
} {
  // Placeholder - real implementation would load and analyze full catalog
  
  if (bibleId === 'thornferry-road') {
    return {
      totalCrises: 12,
      branchingPoints: 3,
      convergencePoints: 1,
      terminalPaths: 6,
      warnings: []
    };
  }
  
  return {
    totalCrises: 0,
    branchingPoints: 0,
    convergencePoints: 0,
    terminalPaths: 0,
    warnings: ['Unknown bible ID']
  };
}

/**
 * Wave C: Validate catalog consistency
 */
export function validateCatalog(
  bibleId: string
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Placeholder - real implementation would validate:
  // - All crises have valid prerequisites
  // - All forks reference valid facts
  // - All convergence points are reachable
  // - No orphaned crises
  // - No circular dependencies
  
  const structure = inspectCatalogStructure(bibleId);
  
  if (structure.totalCrises === 0) {
    errors.push('No crises defined for this bible');
  }
  
  if (structure.terminalPaths === 0) {
    errors.push('No terminal paths defined');
  }
  
  if (structure.branchingPoints === 0) {
    warnings.push('No branching points - linear story');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Fog-of-War Journal Integration
// ============================================================================

/**
 * Wave C: Build fog-of-war journal section
 */
export function buildFogOfWarJournalSection(
  gs: GameState,
  convergenceCheck: ConvergenceCheck
): string {
  const lines: string[] = ['### Your Path'];
  
  // Show crisis history (obscured)
  const crisisHistory = gs.arcDirector?.pyoaCrisisHistory ?? [];
  
  if (crisisHistory.length > 0) {
    lines.push('', '**Choices Made:**');
    for (const crisisId of crisisHistory) {
      // Obscure crisis names slightly
      const obscured = crisisId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`- ${obscured}`);
    }
  }
  
  // Show convergence hint if approaching
  if (convergenceCheck.isConverging && convergenceCheck.convergencePoint) {
    lines.push('', '**Ahead:**');
    lines.push(`- ${convergenceCheck.convergencePoint.description}`);
  }
  
  // Show pending consequences (vague)
  const pendingConsequences = gs.arcDirector?.pyoaDelayedConsequences?.filter(
    c => c.status === 'pending'
  ) ?? [];
  
  if (pendingConsequences.length > 0) {
    lines.push('', '**Echoes Forward:**');
    lines.push(`- ${pendingConsequences.length} choice${pendingConsequences.length > 1 ? 's' : ''} will matter...`);
  }
  
  return lines.join('\n');
}

/**
 * Wave C: Get convergence telemetry
 */
export function getConvergenceTelemetry(
  gs: GameState,
  bibleId: string
): {
  branchState: BranchState;
  convergencePoints: ConvergencePoint[];
  convergenceCheck: ConvergenceCheck;
  catalogStructure: ReturnType<typeof inspectCatalogStructure>;
} {
  const branchState = extractBranchState('current', gs);
  const convergencePoints = detectConvergencePoints(bibleId);
  const convergenceCheck = checkConvergence(gs, convergencePoints);
  const catalogStructure = inspectCatalogStructure(bibleId);
  
  return {
    branchState,
    convergencePoints,
    convergenceCheck,
    catalogStructure
  };
}
