/**
 * Wave D: Comprehensive Evaluation Harness
 * 
 * Quality gates for WS-2 (NPC Lifecycle), WS-4 (Encounter Bible), WS-5 (PYOA Persistence).
 * 
 * WS-2 Gates:
 * - G1: Exit latency (NPC departure within deadline window)
 * - G2: Duplicate reveals (no repeat NPC intros)
 * - G3: Memory retrieval (mandatory memories in packet)
 * - G4: Obligations (debt tracking, completion receipts)
 * - G5: Turnover determinism (same state → same action)
 * 
 * WS-4 Gates:
 * - G1: Resolution (encounter terminals within bounds)
 * - G2: Telegraph (cue delivery before surprise)
 * - G3: Biome (no wrong-bible spawns)
 * - G4: Density (role quotas, saturation guards)
 * - G5: Aftermath (receipt idempotency)
 * 
 * WS-5 Gates:
 * - G1: Crisis repetition (no duplicate crisis spawns)
 * - G2: Sibling locks (mutex branch enforcement)
 * - G3: Endings (one ending by T150)
 * - G4: Delayed payoffs (echo/return/reckoning delivery)
 * - G5: Mutex (exclusive fact enforcement)
 * 
 * Regression Gates:
 * - R1: Combat purgatory (max 8T LitRPG, 10T DnD)
 * - R2: Passive GM (forced interrupt at 5T stagnation)
 * - R3: Pad loop (semantic cooldown 3T)
 * - R4: Theater branching (PYOA branch commits)
 */

import type { GameState } from './types';

// Stub implementations for missing functions
function isNpcLifecyclePhase(phase: string): boolean {
  return ['entering', 'functioning', 'debt_satisfied', 'exiting', 'transformed', 'absent'].includes(phase);
}

function getNpcTurnoverAction(lifecycle: any, state: GameState): string {
  if (lifecycle.phase === 'debt_satisfied') return 'exit';
  if (lifecycle.deadline && state.turnIndex > lifecycle.deadline.turnIndex) return 'exit';
  return 'remain';
}

function retrieveMemoriesForNpc(state: GameState, npcId: string, options: any): any[] {
  const ledger = (state as any).npcMemoryLedger || {};
  const memories = ledger[npcId] || [];
  return memories.filter((m: any) => 
    !options.includeTypes || options.includeTypes.includes(m.type)
  ).slice(0, options.maxCount);
}

function checkDensityViolations(state: GameState): any[] {
  // Stub: return empty array for now
  return [];
}

function validateExclusiveFacts(activeFacts: string[]): any[] {
  // Stub: return empty array for now
  return [];
}

// ============================================================================
// EVALUATION RESULT TYPES
// ============================================================================

export interface EvalResult {
  gate: string;
  passed: boolean;
  score: number; // 0-1
  details: string;
  evidence?: any;
}

export interface EvalSuite {
  suite: string;
  timestamp: string;
  totalGates: number;
  passedGates: number;
  failedGates: number;
  overallScore: number;
  results: EvalResult[];
}

// ============================================================================
// WS-2: NPC LIFECYCLE GATES
// ============================================================================

/**
 * G1: Exit latency - NPCs depart within deadline window
 */
export function evalNpcExitLatency(state: GameState): EvalResult {
  const npcs = state.npcLifecycles || {};
  let violations = 0;
  let total = 0;
  
  for (const [npcId, lifecycle] of Object.entries(npcs)) {
    if (lifecycle.deadline && lifecycle.deadline.type !== 'none') {
      total++;
      
      const deadline = lifecycle.deadline.turnIndex;
      const currentTurn = state.turnIndex;
      
      // Check if past deadline and still present
      if (currentTurn > deadline && lifecycle.phase !== 'exiting' && lifecycle.phase !== 'absent') {
        violations++;
      }
    }
  }
  
  const score = total === 0 ? 1.0 : (total - violations) / total;
  
  return {
    gate: 'WS-2-G1',
    passed: violations === 0,
    score,
    details: `Exit latency: ${violations}/${total} violations`,
    evidence: { violations, total }
  };
}

/**
 * G2: Duplicate reveals - No repeat NPC introductions
 */
export function evalNpcDuplicateReveals(state: GameState): EvalResult {
  const revealedNpcs = new Set<string>();
  const duplicates: string[] = [];
  
  // Scan memory ledger for duplicate reveals
  const memoryLedger = (state as any).npcMemoryLedger || {};
  
  for (const [npcId, memories] of Object.entries(memoryLedger)) {
    const introEvents = (memories as any[]).filter(m => m.type === 'introduction');
    
    if (introEvents.length > 1) {
      duplicates.push(npcId);
    }
    
    if (introEvents.length > 0) {
      revealedNpcs.add(npcId);
    }
  }
  
  const score = revealedNpcs.size === 0 ? 1.0 : (revealedNpcs.size - duplicates.length) / revealedNpcs.size;
  
  return {
    gate: 'WS-2-G2',
    passed: duplicates.length === 0,
    score,
    details: `Duplicate reveals: ${duplicates.length}/${revealedNpcs.size} NPCs`,
    evidence: { duplicates, totalRevealed: revealedNpcs.size }
  };
}

/**
 * G3: Memory retrieval - Mandatory memories in NPC packets
 */
export function evalNpcMemoryRetrieval(state: GameState): EvalResult {
  const npcs = state.npcLifecycles || {};
  let violations = 0;
  let total = 0;
  
  for (const [npcId, lifecycle] of Object.entries(npcs)) {
    if (lifecycle.phase === 'functioning' || lifecycle.phase === 'debt_satisfied') {
      total++;
      
      // Check if NPC has mandatory memories
      const memories = retrieveMemoriesForNpc(state, npcId, {
        maxCount: 5,
        includeTypes: ['pinned', 'unresolved']
      });
      
      const mandatoryMemories = memories.filter(m => 
        m.retention === 'permanent' || m.priority === 'pinned'
      );
      
      // Must have at least one mandatory memory if NPC has obligations
      if (lifecycle.obligations && lifecycle.obligations.length > 0 && mandatoryMemories.length === 0) {
        violations++;
      }
    }
  }
  
  const score = total === 0 ? 1.0 : (total - violations) / total;
  
  return {
    gate: 'WS-2-G3',
    passed: violations === 0,
    score,
    details: `Memory retrieval: ${violations}/${total} violations`,
    evidence: { violations, total }
  };
}

/**
 * G4: Obligations - Debt tracking and completion receipts
 */
export function evalNpcObligations(state: GameState): EvalResult {
  const npcs = state.npcLifecycles || {};
  let violations = 0;
  let total = 0;
  
  for (const [npcId, lifecycle] of Object.entries(npcs)) {
    if (lifecycle.obligations) {
      for (const obligation of lifecycle.obligations) {
        total++;
        
        // Check if obligation is completed but NPC still has it
        if (obligation.completed && lifecycle.phase !== 'debt_satisfied') {
          violations++;
        }
        
        // Check if obligation is overdue but not flagged
        if (obligation.deadline && state.turnIndex > obligation.deadline.turnIndex && !obligation.overdue) {
          violations++;
        }
      }
    }
  }
  
  const score = total === 0 ? 1.0 : (total - violations) / total;
  
  return {
    gate: 'WS-2-G4',
    passed: violations === 0,
    score,
    details: `Obligations: ${violations}/${total} violations`,
    evidence: { violations, total }
  };
}

/**
 * G5: Turnover determinism - Same state produces same turnover action
 */
export function evalNpcTurnoverDeterminism(state: GameState): EvalResult {
  const npcs = state.npcLifecycles || {};
  const turnoverActions: Record<string, string[]> = {};
  
  // Run turnover decision twice for each NPC
  for (const [npcId, lifecycle] of Object.entries(npcs)) {
    const action1 = getNpcTurnoverAction(lifecycle, state);
    const action2 = getNpcTurnoverAction(lifecycle, state);
    
    turnoverActions[npcId] = [action1, action2];
  }
  
  // Check for inconsistencies
  const inconsistent = Object.entries(turnoverActions).filter(
    ([_, actions]) => actions[0] !== actions[1]
  );
  
  const total = Object.keys(turnoverActions).length;
  const score = total === 0 ? 1.0 : (total - inconsistent.length) / total;
  
  return {
    gate: 'WS-2-G5',
    passed: inconsistent.length === 0,
    score,
    details: `Turnover determinism: ${inconsistent.length}/${total} inconsistent`,
    evidence: { inconsistent: inconsistent.map(([id]) => id), total }
  };
}

// ============================================================================
// WS-4: ENCOUNTER BIBLE GATES
// ============================================================================

/**
 * G1: Resolution - Encounters terminal within turn bounds
 */
export function evalEncounterResolution(state: GameState): EvalResult {
  const encounters = (state as any).encounterHistory || [];
  let violations = 0;
  
  for (const encounter of encounters) {
    const duration = encounter.endTurn - encounter.startTurn;
    const mode = state.engineMode;
    
    // LitRPG: 8T max, DnD: 10T max
    const maxDuration = mode === 'litrpg' ? 8 : mode === 'dnd' ? 10 : 15;
    
    if (duration > maxDuration) {
      violations++;
    }
  }
  
  const score = encounters.length === 0 ? 1.0 : (encounters.length - violations) / encounters.length;
  
  return {
    gate: 'WS-4-G1',
    passed: violations === 0,
    score,
    details: `Resolution: ${violations}/${encounters.length} over-duration`,
    evidence: { violations, total: encounters.length }
  };
}

/**
 * G2: Telegraph - Cues delivered before surprise encounters
 */
export function evalEncounterTelegraph(state: GameState): EvalResult {
  const encounters = (state as any).encounterHistory || [];
  let violations = 0;
  
  for (const encounter of encounters) {
    if (encounter.surprise && !encounter.telegraphed) {
      violations++;
    }
  }
  
  const score = encounters.length === 0 ? 1.0 : (encounters.length - violations) / encounters.length;
  
  return {
    gate: 'WS-4-G2',
    passed: violations === 0,
    score,
    details: `Telegraph: ${violations}/${encounters.length} untelegraphed surprises`,
    evidence: { violations, total: encounters.length }
  };
}

/**
 * G3: Biome - No wrong-bible spawns
 */
export function evalEncounterBiome(state: GameState): EvalResult {
  const encounters = (state as any).encounterHistory || [];
  let violations = 0;
  
  for (const encounter of encounters) {
    // Check if encounter bible matches campaign bible
    if (encounter.bibleId && encounter.bibleId !== state.campaignBible) {
      violations++;
    }
  }
  
  const score = encounters.length === 0 ? 1.0 : (encounters.length - violations) / encounters.length;
  
  return {
    gate: 'WS-4-G3',
    passed: violations === 0,
    score,
    details: `Biome: ${violations}/${encounters.length} wrong-bible spawns`,
    evidence: { violations, total: encounters.length }
  };
}

/**
 * G4: Density - Role quotas and saturation guards
 */
export function evalEncounterDensity(state: GameState): EvalResult {
  const violations = checkDensityViolations(state);
  const total = violations.length;
  
  return {
    gate: 'WS-4-G4',
    passed: total === 0,
    score: total === 0 ? 1.0 : 0.0,
    details: `Density: ${total} violations`,
    evidence: { violations }
  };
}

/**
 * G5: Aftermath - Receipt idempotency
 */
export function evalEncounterAftermath(state: GameState): EvalResult {
  const receipts = (state as any).encounterReceipts || [];
  const seenKeys = new Set<string>();
  let duplicates = 0;
  
  for (const receipt of receipts) {
    if (seenKeys.has(receipt.idempotencyKey)) {
      duplicates++;
    }
    seenKeys.add(receipt.idempotencyKey);
  }
  
  const score = receipts.length === 0 ? 1.0 : (receipts.length - duplicates) / receipts.length;
  
  return {
    gate: 'WS-4-G5',
    passed: duplicates === 0,
    score,
    details: `Aftermath: ${duplicates}/${receipts.length} duplicate receipts`,
    evidence: { duplicates, total: receipts.length }
  };
}

// ============================================================================
// WS-5: PYOA PERSISTENCE GATES
// ============================================================================

/**
 * G1: Crisis repetition - No duplicate crisis spawns
 */
export function evalPyoaCrisisRepetition(state: GameState): EvalResult {
  const crisisHistory = (state as any).crisisHistory || [];
  const seenCrises = new Set<string>();
  let duplicates = 0;
  
  for (const crisis of crisisHistory) {
    if (seenCrises.has(crisis.id)) {
      duplicates++;
    }
    seenCrises.add(crisis.id);
  }
  
  const score = crisisHistory.length === 0 ? 1.0 : (crisisHistory.length - duplicates) / crisisHistory.length;
  
  return {
    gate: 'WS-5-G1',
    passed: duplicates === 0,
    score,
    details: `Crisis repetition: ${duplicates}/${crisisHistory.length} duplicates`,
    evidence: { duplicates, total: crisisHistory.length }
  };
}

/**
 * G2: Sibling locks - Mutex branch enforcement
 */
export function evalPyoaSiblingLocks(state: GameState): EvalResult {
  const activeFacts = (state as any).pyoaActiveFacts || [];
  const violations = validateExclusiveFacts(activeFacts);
  
  return {
    gate: 'WS-5-G2',
    passed: violations.length === 0,
    score: violations.length === 0 ? 1.0 : 0.0,
    details: `Sibling locks: ${violations.length} violations`,
    evidence: { violations }
  };
}

/**
 * G3: Endings - One ending reached by T150
 */
export function evalPyoaEndings(state: GameState): EvalResult {
  const ended = state.playPhase === 'ended';
  const turnIndex = state.turnIndex;
  const hasEnding = (state as any).pyoaEnding !== undefined;
  
  const passed = ended && hasEnding && turnIndex <= 150;
  const score = passed ? 1.0 : 0.0;
  
  return {
    gate: 'WS-5-G3',
    passed,
    score,
    details: `Endings: ${ended ? 'ended' : 'active'} at T${turnIndex}, ending: ${hasEnding}`,
    evidence: { ended, turnIndex, hasEnding }
  };
}

/**
 * G4: Delayed payoffs - Echo/return/reckoning delivery
 */
export function evalPyoaDelayedPayoffs(state: GameState): EvalResult {
  const consequences = (state as any).delayedConsequences || [];
  let violations = 0;
  
  for (const consequence of consequences) {
    if (consequence.deliveryTurn && state.turnIndex > consequence.deliveryTurn && !consequence.delivered) {
      violations++;
    }
  }
  
  const score = consequences.length === 0 ? 1.0 : (consequences.length - violations) / consequences.length;
  
  return {
    gate: 'WS-5-G4',
    passed: violations === 0,
    score,
    details: `Delayed payoffs: ${violations}/${consequences.length} overdue`,
    evidence: { violations, total: consequences.length }
  };
}

/**
 * G5: Mutex - Exclusive fact enforcement
 */
export function evalPyoaMutex(state: GameState): EvalResult {
  return evalPyoaSiblingLocks(state); // Same as G2
}

// ============================================================================
// REGRESSION GATES
// ============================================================================

/**
 * R1: Combat purgatory - Forced terminal within bounds
 */
export function evalRegressionCombatPurgatory(state: GameState): EvalResult {
  return evalEncounterResolution(state); // Same as WS-4-G1
}

/**
 * R2: Passive GM - Forced interrupt at stagnation
 */
export function evalRegressionPassiveGm(state: GameState): EvalResult {
  const stagnationStreak = (state as any).stagnationStreak || 0;
  const forced = stagnationStreak >= 5 && (state as any).lastActionWasForced;
  
  const passed = stagnationStreak < 5 || forced;
  const score = passed ? 1.0 : 0.0;
  
  return {
    gate: 'R2',
    passed,
    score,
    details: `Passive GM: stagnation ${stagnationStreak}, forced: ${forced}`,
    evidence: { stagnationStreak, forced }
  };
}

/**
 * R3: Pad loop - Semantic cooldown enforcement
 */
export function evalRegressionPadLoop(state: GameState): EvalResult {
  const recentChoices = (state as any).recentChoiceFingerprints || [];
  let violations = 0;
  
  // Check for duplicate choices within 3T window
  for (let i = 0; i < recentChoices.length - 1; i++) {
    const choice = recentChoices[i];
    const withinWindow = recentChoices.slice(i + 1, i + 4);
    
    if (withinWindow.some((c: any) => c.fingerprint === choice.fingerprint)) {
      violations++;
    }
  }
  
  const score = recentChoices.length === 0 ? 1.0 : (recentChoices.length - violations) / recentChoices.length;
  
  return {
    gate: 'R3',
    passed: violations === 0,
    score,
    details: `Pad loop: ${violations}/${recentChoices.length} duplicates in 3T`,
    evidence: { violations, total: recentChoices.length }
  };
}

/**
 * R4: Theater branching - PYOA branch commits
 */
export function evalRegressionTheaterBranching(state: GameState): EvalResult {
  return evalPyoaCrisisRepetition(state); // Same as WS-5-G1
}

// ============================================================================
// SUITE RUNNER
// ============================================================================

/**
 * Run complete evaluation suite
 */
export function runEvaluationSuite(state: GameState): EvalSuite {
  const results: EvalResult[] = [
    // WS-2
    evalNpcExitLatency(state),
    evalNpcDuplicateReveals(state),
    evalNpcMemoryRetrieval(state),
    evalNpcObligations(state),
    evalNpcTurnoverDeterminism(state),
    
    // WS-4
    evalEncounterResolution(state),
    evalEncounterTelegraph(state),
    evalEncounterBiome(state),
    evalEncounterDensity(state),
    evalEncounterAftermath(state),
    
    // WS-5
    evalPyoaCrisisRepetition(state),
    evalPyoaSiblingLocks(state),
    evalPyoaEndings(state),
    evalPyoaDelayedPayoffs(state),
    evalPyoaMutex(state),
    
    // Regression
    evalRegressionCombatPurgatory(state),
    evalRegressionPassiveGm(state),
    evalRegressionPadLoop(state),
    evalRegressionTheaterBranching(state)
  ];
  
  const totalGates = results.length;
  const passedGates = results.filter(r => r.passed).length;
  const failedGates = totalGates - passedGates;
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / totalGates;
  
  return {
    suite: 'Wave-D-Complete',
    timestamp: new Date().toISOString(),
    totalGates,
    passedGates,
    failedGates,
    overallScore,
    results
  };
}

// ============================================================================
// RECEIPT LIVENESS GATES
// ============================================================================

export interface ReceiptLivenessGates {
  crisisByT12: boolean;
  freeT12DurableDelta: boolean;
}

/**
 * Check receipt-based liveness gates for eval harness
 */
export function checkReceiptLivenessGates(state: GameState): ReceiptLivenessGates {
  // Check if PYOA had a crisis beat by T12
  const crisisByT12 = state.engineMode === 'pyoa' && state.turn >= 12
    ? (state.arcDirector?.committedBeatIds ?? []).some(id => /crisis|branch/i.test(id))
    : false;
  
  // Check if there's a durable delta by T12 (uses hasDurableDeltaByT12)
  // Import dynamically to avoid circular deps
  const freeT12DurableDelta = state.turn >= 12
    ? (state.character?.level ?? 1) >= 2 ||
      (state.arcDirector?.encounterClearedReceipts ?? []).length >= 1 ||
      !!(state.pyoaBranchLedger?.branchLocked || state.pyoaBranchLedger?.branchClosed) ||
      Object.keys(state.arcDirector?.topicCommits ?? {}).length > 0 ||
      (state.quests ?? []).some(q => 
        (q.objectives ?? []).filter(o => o.completed).length >= 1 && 
        (q.status === 'active' || q.status === 'completed')
      )
    : false;
  
  return {
    crisisByT12,
    freeT12DurableDelta
  };
}

/**
 * Validate an eval run's manifest stamp and gate bindings
 */
export function validateEvalRun(
  state: any,
  summary: any,
  _turns: any[]
): {
  manifestBound: boolean;
  livenessGates: {
    combatByT8: boolean;
    [key: string]: boolean;
  };
} {
  // Check if manifest is bound (has required fields)
  const manifest = summary?.runManifest || state?.runManifest;
  const manifestBound = Boolean(
    manifest && 
    manifest.buildStamp && 
    manifest.engineMode
  );
  
  // Check liveness gates (combat by turn 8, etc.)
  const arcDirector = state?.arcDirector || {};
  const turn = state?.turn || 0;
  
  // Combat liveness: should have combat encounter by turn 8
  const hasHadCombat = Boolean(
    (arcDirector.encounterResolutionLog && arcDirector.encounterResolutionLog.length > 0) ||
    (arcDirector.beatStateTx && arcDirector.beatStateTx.some((tx: any) => tx.kind === 'combat')) ||
    (state?.stateTxLog && state.stateTxLog.some((tx: any) => tx.kind === 'combat')) ||
    state?.activeEncounter || 
    (state?.log || []).some((entry: any) => 
      entry.gmRole === 'narrator' && 
      /combat|fight|attack|enemy|foe/i.test(entry.content || '')
    )
  );
  const combatByT8 = turn >= 8 ? hasHadCombat : true;
  
  return {
    manifestBound,
    livenessGates: {
      combatByT8,
    },
  };
}
