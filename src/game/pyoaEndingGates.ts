/**
 * WS-5 Wave C: PYOA Ending Gates
 * 
 * Complete ending system with:
 * - Ending gate catalog (6-8 endings per bible)
 * - Prerequisite evaluation
 * - Priority-based ending selection
 * - T150 deadline enforcement
 * - Terminal commit logic
 */

import type { GameState } from './types';
import type {
  EndingGateSpec,
  EndingReceipt,
  FactId,
  Turn,
  BibleId,
} from './pyoaTypes';
import { evaluatePredicateGroup, extractFactsFromGameState } from './pyoaExclusiveFacts';

// ============================================================================
// ENDING GATE CATALOG
// ============================================================================

/**
 * Thornferry Road ending gates
 */
export const THORNFERRY_ENDINGS: EndingGateSpec[] = [
  {
    schemaVersion: 1,
    id: 'thornferry-road:ending:keeper-under-stone',
    bibleId: 'thornferry-road',
    name: 'Keeper Under Stone',
    class: 'secret',
    priority: 120,
    window: {
      earliest: 125,
      target: 140,
      latest: 150,
    },
    prerequisites: {
      all: [
        { factId: 'thornferry-road.trust.miller', op: 'exists' },
        { factId: 'thornferry-road.truth.concealed', op: 'exists' },
        { factId: 'thornferry-road.method.diplomacy', op: 'exists' },
        { factId: 'thornferry-road.alliance.accepted', op: 'exists' },
      ],
    },
    triggerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    terminalWrites: [
      {
        factId: 'thornferry-road.outcome.triumph',
        value: true,
        visibility: 'known',
        journalText: 'You became the keeper of the ancient binding',
      },
    ],
    terminalText: 'You renew the binding with the miller as witness, refusing every crown while becoming the road\'s living keeper.',
    journalTeaser: 'One bargain can outlast every banner.',
  },
  {
    schemaVersion: 1,
    id: 'thornferry-road:ending:lord-champion',
    bibleId: 'thornferry-road',
    name: 'The Lord\'s Champion',
    class: 'triumph',
    priority: 105,
    window: {
      earliest: 125,
      target: 140,
      latest: 150,
    },
    prerequisites: {
      all: [
        { factId: 'thornferry-road.allegiance.lord', op: 'exists' },
        { factId: 'thornferry-road.alliance.accepted', op: 'exists' },
      ],
      any: [
        { factId: 'thornferry-road.method.force', op: 'exists' },
        { factId: 'thornferry-road.method.diplomacy', op: 'exists' },
      ],
    },
    triggerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    terminalWrites: [
      {
        factId: 'thornferry-road.outcome.triumph',
        value: true,
        visibility: 'known',
        journalText: 'You secured Thornferry for the lord',
      },
    ],
    terminalText: 'You secure Thornferry for the lord; the road opens, and the levy becomes law.',
    journalTeaser: 'A banner waits beyond the crossing.',
  },
  {
    schemaVersion: 1,
    id: 'thornferry-road:ending:rebel-hero',
    bibleId: 'thornferry-road',
    name: 'Hero of the Briar',
    class: 'triumph',
    priority: 100,
    window: {
      earliest: 125,
      target: 140,
      latest: 150,
    },
    prerequisites: {
      all: [
        { factId: 'thornferry-road.allegiance.rebels', op: 'exists' },
        { factId: 'thornferry-road.village.saved', op: 'exists' },
        { factId: 'thornferry-road.truth.revealed', op: 'exists' },
      ],
    },
    triggerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    terminalWrites: [
      {
        factId: 'thornferry-road.outcome.triumph',
        value: true,
        visibility: 'known',
        journalText: 'Hushwater\'s survivors carry the truth',
      },
    ],
    terminalText: 'Hushwater\'s survivors carry the truth across the river, and the briar masks come off in daylight.',
    journalTeaser: 'A road can belong to those who walk it.',
  },
  {
    schemaVersion: 1,
    id: 'thornferry-road:ending:free-road',
    bibleId: 'thornferry-road',
    name: 'The Free Road',
    class: 'transformation',
    priority: 95,
    window: {
      earliest: 125,
      target: 140,
      latest: 150,
    },
    prerequisites: {
      all: [
        { factId: 'thornferry-road.allegiance.neutral', op: 'exists' },
        { factId: 'thornferry-road.village.saved', op: 'exists' },
        { factId: 'thornferry-road.truth.revealed', op: 'exists' },
        { factId: 'thornferry-road.method.diplomacy', op: 'exists' },
      ],
    },
    triggerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    terminalWrites: [
      {
        factId: 'thornferry-road.outcome.triumph',
        value: true,
        visibility: 'known',
        journalText: 'You broke the toll compact',
      },
    ],
    terminalText: 'You break the toll compact and leave Thornferry governed by ferrymen, millers, and travelers instead of banners.',
    journalTeaser: 'No lord owns every mile.',
  },
  {
    schemaVersion: 1,
    id: 'thornferry-road:ending:lone-wanderer',
    bibleId: 'thornferry-road',
    name: 'Lone Wanderer',
    class: 'escape',
    priority: 70,
    window: {
      earliest: 125,
      target: 140,
      latest: 150,
    },
    prerequisites: {
      all: [
        { factId: 'thornferry-road.alliance.rejected', op: 'exists' },
        { factId: 'thornferry-road.method.stealth', op: 'exists' },
      ],
    },
    triggerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    terminalWrites: [
      {
        factId: 'thornferry-road.outcome.escape',
        value: true,
        visibility: 'known',
        journalText: 'You took the unmarked path',
      },
    ],
    terminalText: 'You take the unmarked path beyond Thornferry; the conflict survives behind you, but no faction owns your name.',
    journalTeaser: 'There is still a path with no witnesses.',
  },
  {
    schemaVersion: 1,
    id: 'thornferry-road:ending:road-takes-its-due',
    bibleId: 'thornferry-road',
    name: 'The Road Takes Its Due',
    class: 'failure',
    priority: 1,
    window: {
      earliest: 150,
      target: 150,
      latest: 150,
    },
    prerequisites: {
      // No prerequisites - this is the deadline fallback
    },
    triggerCrisisId: 'thornferry-road:crisis:6_final_crossing',
    terminalWrites: [
      {
        factId: 'thornferry-road.outcome.failure',
        value: true,
        visibility: 'known',
        journalText: 'The deadline passed',
      },
    ],
    terminalText: 'At the deadline, flood, riders, and the waking thing beneath the stones close every remaining path.',
    journalTeaser: 'Every road eventually collects its debt.',
  },
];

// ============================================================================
// ENDING ELIGIBILITY
// ============================================================================

export interface EndingEligibilityCheck {
  eligible: boolean;
  reason?: string;
  missingFacts?: string[];
}

/**
 * Check if ending gate is eligible
 */
export function isEndingEligible(
  ending: EndingGateSpec,
  state: GameState,
  currentTurn: Turn
): EndingEligibilityCheck {
  // Check if already ended
  const ledger = state.pyoaBranchLedger;
  if (ledger?.committedPaths?.some(p => p.startsWith('ending:'))) {
    return {
      eligible: false,
      reason: 'Run already has an ending',
    };
  }
  
  // Check turn window
  if (currentTurn < ending.window.earliest) {
    return {
      eligible: false,
      reason: `Too early (window starts at T${ending.window.earliest})`,
    };
  }
  
  if (currentTurn > ending.window.latest) {
    return {
      eligible: false,
      reason: `Too late (window ended at T${ending.window.latest})`,
    };
  }
  
  // Check prerequisites
  if (ending.prerequisites) {
    const facts = extractFactsFromGameState(state);
    
    if (!evaluatePredicateGroup(ending.prerequisites, facts)) {
      // Find missing facts
      const missingFacts: string[] = [];
      
      if (ending.prerequisites.all) {
        for (const pred of ending.prerequisites.all) {
          if (pred.op === 'exists' && !facts[pred.factId]) {
            missingFacts.push(pred.factId);
          }
        }
      }
      
      return {
        eligible: false,
        reason: 'Prerequisites not met',
        missingFacts,
      };
    }
  }
  
  return { eligible: true };
}

/**
 * Get all eligible endings
 */
export function getEligibleEndings(
  bibleId: BibleId,
  state: GameState
): EndingGateSpec[] {
  const endings = getEndingsForBible(bibleId);
  const currentTurn = state.turn;
  
  return endings.filter(ending => {
    const check = isEndingEligible(ending, state, currentTurn);
    return check.eligible;
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Get best eligible ending
 */
export function selectBestEnding(
  bibleId: BibleId,
  state: GameState
): EndingGateSpec | null {
  const eligible = getEligibleEndings(bibleId, state);
  return eligible[0] ?? null;
}

// ============================================================================
// T150 DEADLINE ENFORCEMENT
// ============================================================================

export interface DeadlineEnforcement {
  enforced: boolean;
  ending?: EndingGateSpec;
  reason?: string;
}

/**
 * Enforce T150 deadline
 */
export function enforceT150Deadline(
  bibleId: BibleId,
  state: GameState,
  hardDeadline: Turn = 150
): DeadlineEnforcement {
  // Check if already ended
  const ledger = state.pyoaBranchLedger;
  if (ledger?.committedPaths?.some(p => p.startsWith('ending:'))) {
    return {
      enforced: false,
      reason: 'Run already has an ending',
    };
  }
  
  // Check if deadline reached
  if (state.turn < hardDeadline) {
    return {
      enforced: false,
      reason: `Deadline not yet reached (T${state.turn} < T${hardDeadline})`,
    };
  }
  
  // Try to find eligible ending
  const eligible = getEligibleEndings(bibleId, state);
  if (eligible.length > 0) {
    return {
      enforced: true,
      ending: eligible[0],
      reason: 'Deadline reached - selecting best eligible ending',
    };
  }
  
  // Force failure ending
  const failureEnding = getFailureEnding(bibleId);
  if (failureEnding) {
    return {
      enforced: true,
      ending: failureEnding,
      reason: 'Deadline reached - forcing failure ending',
    };
  }
  
  return {
    enforced: true,
    reason: 'Deadline reached but no ending available',
  };
}

/**
 * Get failure ending for bible
 */
export function getFailureEnding(bibleId: BibleId): EndingGateSpec | null {
  const endings = getEndingsForBible(bibleId);
  return endings.find(e => e.class === 'failure') ?? null;
}

// ============================================================================
// ENDING COMMIT
// ============================================================================

/**
 * Commit ending to game state
 */
export function commitEnding(
  ending: EndingGateSpec,
  state: GameState,
  forceAtDeadline = false
): {
  state: GameState;
  receipt: EndingReceipt;
  mandate: string;
} {
  // Validate eligibility unless forced
  if (!forceAtDeadline) {
    const check = isEndingEligible(ending, state, state.turn);
    if (!check.eligible) {
      throw new Error(`Ending ${ending.id} is not eligible: ${check.reason}`);
    }
  }
  
  const ledger = state.pyoaBranchLedger ?? {
    activeBranch: 'none',
    committedPaths: [],
    charterUses: 0,
    branchClosed: false,
    convergencePoints: [],
  };
  
  // Build receipt
  const receipt: EndingReceipt = {
    kind: 'ending',
    schemaVersion: 1,
    receiptId: `ending-${ending.id}-${state.turn}`,
    runId: state.saveId ?? 'unknown',
    bibleId: ending.bibleId,
    endingId: ending.id,
    triggerCrisisId: ending.triggerCrisisId,
    committedAtTurn: state.turn,
    idempotencyKey: `${state.saveId}::ending`,
    terminal: true,
  };
  
  // Update ledger
  const nextLedger = {
    ...ledger,
    committedPaths: [
      ...(ledger.committedPaths ?? []),
      `ending:${ending.id}`,
    ].slice(-24),
    branchClosed: true,
  };
  
  // Apply terminal writes
  for (const write of ending.terminalWrites) {
    nextLedger.committedPaths.push(`fact:${write.factId}`);
  }
  
  const nextState = {
    ...state,
    pyoaBranchLedger: nextLedger,
    playPhase: 'ended' as const,
  };
  
  const mandate = `ENDING (${ending.class}): ${ending.name}\n` +
    `${ending.terminalText}\n` +
    `Terminal writes: ${ending.terminalWrites.length}`;
  
  return {
    state: nextState,
    receipt,
    mandate,
  };
}

// ============================================================================
// CATALOG MANAGEMENT
// ============================================================================

/**
 * Get endings for bible
 */
export function getEndingsForBible(bibleId: BibleId): EndingGateSpec[] {
  if (bibleId === 'thornferry-road') {
    return THORNFERRY_ENDINGS;
  }
  
  // Other bibles not yet implemented
  return [];
}

/**
 * Validate ending catalog
 */
export function validateEndingCatalog(
  endings: readonly EndingGateSpec[]
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check minimum ending count
  if (endings.length < 6) {
    warnings.push(`Only ${endings.length} endings (recommended: 6-8)`);
  }
  
  // Check failure ending exists
  const hasFailure = endings.some(e => e.class === 'failure');
  if (!hasFailure) {
    errors.push('No failure ending defined (required for deadline enforcement)');
  }
  
  // Check each ending
  for (const ending of endings) {
    // Check window validity
    if (ending.window.earliest > ending.window.target) {
      errors.push(`${ending.id}: earliest (${ending.window.earliest}) > target (${ending.window.target})`);
    }
    if (ending.window.target > ending.window.latest) {
      errors.push(`${ending.id}: target (${ending.window.target}) > latest (${ending.window.latest})`);
    }
    
    // Check terminal writes
    if (ending.terminalWrites.length === 0) {
      warnings.push(`${ending.id}: no terminal fact writes`);
    }
    
    // Check priority uniqueness
    const samePriority = endings.filter(e => e.priority === ending.priority && e.id !== ending.id);
    if (samePriority.length > 0) {
      warnings.push(`${ending.id}: priority ${ending.priority} shared with ${samePriority.length} other endings`);
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
 * Build ending gates situation section
 */
export function buildEndingGatesSituationSection(
  state: GameState,
  bibleId: BibleId
): string {
  const eligible = getEligibleEndings(bibleId, state);
  
  if (eligible.length === 0) {
    // Check if deadline approaching
    if (state.turn >= 140) {
      return `### ENDING GATES\nDeadline approaching (T${state.turn}/T150). No eligible endings yet.`;
    }
    return '';
  }
  
  const lines: string[] = ['### ENDING GATES'];
  lines.push(`Eligible endings: ${eligible.length}`);
  lines.push('');
  lines.push('**Best path:**');
  lines.push(`- ${eligible[0].name} (${eligible[0].class}, priority ${eligible[0].priority})`);
  
  if (eligible.length > 1) {
    lines.push('');
    lines.push('**Alternatives:**');
    for (const ending of eligible.slice(1, 3)) {
      lines.push(`- ${ending.name} (${ending.class}, priority ${ending.priority})`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Build ending progress for journal
 */
export interface EndingProgress {
  discovered: number;
  total: number;
  discoveredNames: readonly string[];
  veiledTeasers: readonly string[];
}

/**
 * Get ending progress (fog-of-war safe)
 */
export function getEndingProgress(
  bibleId: BibleId,
  state: GameState,
  discoveredEndingIds: ReadonlySet<string>
): EndingProgress {
  const endings = getEndingsForBible(bibleId);
  const discovered = endings.filter(e => discoveredEndingIds.has(e.id));
  const undiscovered = endings.filter(e => !discoveredEndingIds.has(e.id));
  
  return {
    discovered: discovered.length,
    total: endings.length,
    discoveredNames: discovered.map(e => e.name),
    veiledTeasers: undiscovered.map(e => e.journalTeaser),
  };
}
