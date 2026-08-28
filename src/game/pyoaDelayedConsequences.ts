/**
 * WS-5 Wave A: PYOA Delayed Consequences
 * 
 * T50 choice → T150 payoff system.
 * Tracks echo, return, reckoning patterns.
 */

import type { GameState } from './types';
import type { DelayedConsequence, FactWrite, ResourceDelta, RelationshipDelta } from './types/crossPackageContracts';

// ============================================================================
// CONSEQUENCE SCHEDULING
// ============================================================================

/**
 * Schedule delayed consequence
 */
export function scheduleDelayedConsequence(
  state: GameState,
  opts: {
    sourceCrisisId: string;
    sourceForkId: string;
    dueAtTurn: number;
    type: DelayedConsequence['type'];
    payload: DelayedConsequence['payload'];
  }
): GameState {
  const id = `dc-${opts.sourceCrisisId}-${opts.sourceForkId}-${state.turn}`;
  
  const consequence: DelayedConsequence = {
    id,
    sourceCrisisId: opts.sourceCrisisId,
    sourceForkId: opts.sourceForkId,
    committedAtTurn: state.turn,
    dueAtTurn: opts.dueAtTurn,
    status: 'pending',
    type: opts.type,
    payload: opts.payload,
  };
  
  const existing = state.arcDirector?.pyoaDelayedConsequences ?? [];
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      pyoaDelayedConsequences: [...existing, consequence],
    },
  };
}

/**
 * Get due consequences
 */
export function getDueConsequences(state: GameState): DelayedConsequence[] {
  const consequences = state.arcDirector?.pyoaDelayedConsequences ?? [];
  
  return consequences.filter(c => 
    c.status === 'pending' && c.dueAtTurn <= state.turn
  ).sort((a, b) => a.dueAtTurn - b.dueAtTurn);
}

/**
 * Get pending consequences
 */
export function getPendingConsequences(state: GameState): DelayedConsequence[] {
  const consequences = state.arcDirector?.pyoaDelayedConsequences ?? [];
  
  return consequences.filter(c => c.status === 'pending')
    .sort((a, b) => a.dueAtTurn - b.dueAtTurn);
}

/**
 * Mark consequence as delivered
 */
export function markConsequenceDelivered(
  consequenceId: string,
  state: GameState
): GameState {
  const consequences = state.arcDirector?.pyoaDelayedConsequences ?? [];
  
  const updated = consequences.map(c =>
    c.id === consequenceId
      ? { ...c, status: 'delivered' as const }
      : c
  );
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      pyoaDelayedConsequences: updated,
    },
  };
}

/**
 * Cancel consequence
 */
export function cancelConsequence(
  consequenceId: string,
  state: GameState
): GameState {
  const consequences = state.arcDirector?.pyoaDelayedConsequences ?? [];
  
  const updated = consequences.map(c =>
    c.id === consequenceId
      ? { ...c, status: 'cancelled' as const }
      : c
  );
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      pyoaDelayedConsequences: updated,
    },
  };
}

// ============================================================================
// CONSEQUENCE DELIVERY
// ============================================================================

/**
 * Deliver consequence payload
 * 
 * Applies fact writes, resource deltas, relationship deltas.
 */
export function deliverConsequence(
  consequence: DelayedConsequence,
  state: GameState
): {
  state: GameState;
  receipts: string[];
  mandate: string;
} {
  const receipts: string[] = [];
  let next = state;
  
  // Apply fact writes
  if (consequence.payload.writes) {
    for (const write of consequence.payload.writes) {
      // Would commit via cross-package coordination
      receipts.push(`Fact: ${write.factId}=${write.value}`);
    }
  }
  
  // Apply resource deltas
  if (consequence.payload.resourceDeltas) {
    for (const delta of consequence.payload.resourceDeltas) {
      receipts.push(`${delta.resourceId}: ${delta.delta > 0 ? '+' : ''}${delta.delta} (${delta.reason})`);
      
      // Apply to character resources
      if (delta.resourceId === 'health') {
        const hp = (next.character?.hitPoints ?? 0) + delta.delta;
        next = {
          ...next,
          character: {
            ...next.character,
            hitPoints: Math.max(0, hp),
          },
        };
      }
    }
  }
  
  // Apply relationship deltas
  if (consequence.payload.relationshipDeltas) {
    for (const delta of consequence.payload.relationshipDeltas) {
      receipts.push(`Relationship: ${delta.npcId} ${delta.aspect} ${delta.delta > 0 ? '+' : ''}${delta.delta}`);
    }
  }
  
  // Unlock crisis
  if (consequence.payload.unlockCrisisId) {
    receipts.push(`Crisis unlocked: ${consequence.payload.unlockCrisisId}`);
  }
  
  // Unlock ending
  if (consequence.payload.unlockEndingId) {
    receipts.push(`Ending unlocked: ${consequence.payload.unlockEndingId}`);
  }
  
  // Build mandate for GM
  const mandate = buildConsequenceMandate(consequence);
  
  // Mark as delivered
  next = markConsequenceDelivered(consequence.id, next);
  
  return { state: next, receipts, mandate };
}

/**
 * Build GM mandate for consequence
 */
function buildConsequenceMandate(consequence: DelayedConsequence): string {
  const lines: string[] = ['DELAYED CONSEQUENCE DELIVERY'];
  lines.push(`Source: ${consequence.sourceCrisisId} (${consequence.sourceForkId})`);
  lines.push(`Type: ${consequence.type}`);
  lines.push(`Narrative: ${consequence.payload.narrativeBeat}`);
  
  return lines.join('\n');
}

// ============================================================================
// CONSEQUENCE PATTERNS
// ============================================================================

/**
 * Create echo consequence (20-40 turn delay)
 * 
 * Echo: Minor callback, reminder of choice
 */
export function createEchoConsequence(
  state: GameState,
  crisisId: string,
  forkId: string,
  narrativeBeat: string,
  writes?: readonly FactWrite[]
): GameState {
  const delayTurns = 20 + Math.floor(Math.random() * 20);
  
  return scheduleDelayedConsequence(state, {
    sourceCrisisId: crisisId,
    sourceForkId: forkId,
    dueAtTurn: state.turn + delayTurns,
    type: 'reveal',
    payload: {
      writes,
      narrativeBeat,
      journalHint: 'A consequence echoes from your past choice...',
    },
  });
}

/**
 * Create return consequence (50-80 turn delay)
 * 
 * Return: NPC/faction remembers choice, significant impact
 */
export function createReturnConsequence(
  state: GameState,
  crisisId: string,
  forkId: string,
  narrativeBeat: string,
  relationshipDeltas?: readonly RelationshipDelta[]
): GameState {
  const delayTurns = 50 + Math.floor(Math.random() * 30);
  
  return scheduleDelayedConsequence(state, {
    sourceCrisisId: crisisId,
    sourceForkId: forkId,
    dueAtTurn: state.turn + delayTurns,
    type: 'relationship_shift',
    payload: {
      relationshipDeltas,
      narrativeBeat,
      journalHint: 'Someone returns from your past...',
    },
  });
}

/**
 * Create reckoning consequence (100-150 turn delay)
 * 
 * Reckoning: Major consequence, near ending
 */
export function createReckoningConsequence(
  state: GameState,
  crisisId: string,
  forkId: string,
  narrativeBeat: string,
  opts: {
    writes?: readonly FactWrite[];
    resourceDeltas?: readonly ResourceDelta[];
    unlockEndingId?: string;
  }
): GameState {
  const delayTurns = 100 + Math.floor(Math.random() * 50);
  
  return scheduleDelayedConsequence(state, {
    sourceCrisisId: crisisId,
    sourceForkId: forkId,
    dueAtTurn: state.turn + delayTurns,
    type: opts.unlockEndingId ? 'ending_unlock' : 'world_state',
    payload: {
      ...opts,
      narrativeBeat,
      journalHint: 'The reckoning approaches...',
    },
  });
}

// ============================================================================
// SITUATION PACKET INTEGRATION
// ============================================================================

/**
 * Build delayed consequences situation section
 */
export function buildDelayedConsequencesSituationSection(
  state: GameState
): string {
  const due = getDueConsequences(state);
  const pending = getPendingConsequences(state).slice(0, 3); // Show next 3
  
  if (due.length === 0 && pending.length === 0) return '';
  
  const lines: string[] = ['### DELAYED CONSEQUENCES'];
  
  if (due.length > 0) {
    lines.push('\n**Due now:**');
    for (const c of due) {
      lines.push(`- ${c.type}: ${c.payload.narrativeBeat.slice(0, 60)}...`);
    }
  }
  
  if (pending.length > 0) {
    lines.push('\n**Coming soon:**');
    for (const c of pending) {
      const turnsRemaining = c.dueAtTurn - state.turn;
      lines.push(`- T${c.dueAtTurn} (${turnsRemaining} turns): ${c.payload.journalHint}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Build journal hints for delayed consequences
 */
export function buildJournalConsequenceHints(state: GameState): string[] {
  const pending = getPendingConsequences(state).slice(0, 5);
  const hints: string[] = [];
  
  for (const c of pending) {
    if (c.dueAtTurn - state.turn <= 10) {
      // Only hint if close (10 turns or less)
      hints.push(c.payload.journalHint);
    }
  }
  
  return hints;
}

// ============================================================================
// Wave B: Enhanced Delivery and Ending Gates
// ============================================================================

export interface EndingGate {
  endingId: string;
  requirements: EndingRequirement[];
  eligible: boolean;
  reason?: string;
}

export interface EndingRequirement {
  type: 'fact' | 'consequence' | 'relationship' | 'turn';
  required: string | number;
  current: string | number;
  satisfied: boolean;
}

/**
 * Wave B: Deliver consequence with enhanced patterns
 */
export function deliverEnhancedConsequence(
  consequence: DelayedConsequence,
  state: GameState
): {
  state: GameState;
  narrative: string;
  effects: string[];
} {
  const { type, payload } = consequence;
  let narrative = payload.narrativeBeat;
  const effects: string[] = [];
  
  // Apply based on pattern
  switch (type) {
    case 'echo':
      // Echo: subtle reminder with minor consequences
      narrative = `**Echo of your choice:** ${narrative}`;
      effects.push('Memory surfaces');
      break;
      
    case 'return':
      // Return: delayed consequence materializes
      narrative = `**The consequence returns:** ${narrative}`;
      for (const delta of payload.resourceDeltas) {
        effects.push(`${delta.resourceType}: ${delta.amount > 0 ? '+' : ''}${delta.amount}`);
      }
      break;
      
    case 'reckoning':
      // Reckoning: major plot consequence
      narrative = `**Reckoning:** ${narrative}`;
      for (const delta of payload.relationshipDeltas) {
        effects.push(`Relationship with ${delta.entity}: ${delta.change > 0 ? '+' : ''}${delta.change}`);
      }
      break;
  }
  
  // Apply resource deltas
  let nextState = state;
  for (const delta of payload.resourceDeltas) {
    nextState = applyResourceDelta(delta, nextState);
  }
  
  // Apply relationship deltas
  for (const delta of payload.relationshipDeltas) {
    nextState = applyRelationshipDelta(delta, nextState);
  }
  
  // Mark as delivered
  nextState = markConsequenceDelivered(consequence.id, nextState);
  
  return {
    state: nextState,
    narrative,
    effects
  };
}

/**
 * Wave B: Check T150 deadline enforcement
 */
export function enforceT150Deadline(state: GameState): {
  enforced: boolean;
  pendingCount: number;
  reason?: string;
} {
  if (state.turn < 150) {
    return { enforced: false, pendingCount: 0 };
  }
  
  const pending = getPendingConsequences(state);
  
  if (pending.length === 0) {
    return { enforced: false, pendingCount: 0 };
  }
  
  return {
    enforced: true,
    pendingCount: pending.length,
    reason: `T150 deadline reached with ${pending.length} undelivered consequences. Story must conclude.`
  };
}

/**
 * Wave B: Check ending gate eligibility
 */
export function checkEndingEligibility(
  endingId: string,
  state: GameState
): EndingGate {
  // Get ending requirements from catalog
  const requirements = getEndingRequirements(endingId, state);
  
  // Check each requirement
  const checkedRequirements = requirements.map(req => ({
    ...req,
    satisfied: checkRequirement(req, state)
  }));
  
  const allSatisfied = checkedRequirements.every(r => r.satisfied);
  
  return {
    endingId,
    requirements: checkedRequirements,
    eligible: allSatisfied,
    reason: allSatisfied 
      ? undefined 
      : `Missing requirements: ${checkedRequirements.filter(r => !r.satisfied).map(r => r.type).join(', ')}`
  };
}

/**
 * Wave B: Get all eligible endings
 */
export function getEligibleEndings(state: GameState): EndingGate[] {
  // Get all possible endings for current campaign
  const endingIds = getCampaignEndings(state);
  
  return endingIds
    .map(id => checkEndingEligibility(id, state))
    .filter(gate => gate.eligible);
}

/**
 * Wave B: Build fog-of-war journal entry
 */
export function buildFogOfWarEntry(
  consequence: DelayedConsequence,
  revealed: boolean
): {
  visible: string;
  hidden: string;
} {
  if (revealed) {
    return {
      visible: consequence.payload.journalHint,
      hidden: consequence.payload.narrativeBeat
    };
  }
  
  // Obscured - only vague hints
  const vagueness = Math.floor((consequence.dueAtTurn - consequence.committedAtTurn) / 20);
  const vagueHints = [
    'Something you did will matter...',
    'A choice echoes forward...',
    'Consequences loom...',
    'The past is not forgotten...',
    'Your decision will return...'
  ];
  
  return {
    visible: vagueHints[Math.min(vagueness, vagueHints.length - 1)],
    hidden: '[Hidden until delivery]'
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function applyResourceDelta(delta: ResourceDelta, state: GameState): GameState {
  // Simplified - real implementation would handle all resource types
  if (delta.resourceType === 'hp') {
    return {
      ...state,
      hp: Math.max(0, Math.min((state.hp ?? 100) + delta.amount, state.maxHp ?? 100))
    };
  }
  
  return state;
}

function applyRelationshipDelta(delta: RelationshipDelta, state: GameState): GameState {
  // Simplified - real implementation would update faction standings
  return state;
}

function getEndingRequirements(
  endingId: string,
  state: GameState
): EndingRequirement[] {
  // Placeholder - real implementation would load from campaign catalog
  return [
    {
      type: 'fact',
      required: 'ally_chosen',
      current: 'unknown',
      satisfied: false
    },
    {
      type: 'turn',
      required: 50,
      current: state.turn,
      satisfied: state.turn >= 50
    }
  ];
}

function checkRequirement(req: EndingRequirement, state: GameState): boolean {
  switch (req.type) {
    case 'turn':
      return state.turn >= (req.required as number);
    case 'fact':
      // Check if fact exists in exclusive facts registry
      return false; // Placeholder
    case 'consequence':
      // Check if consequence was delivered
      return false; // Placeholder
    case 'relationship':
      // Check relationship threshold
      return false; // Placeholder
    default:
      return false;
  }
}

function getCampaignEndings(state: GameState): string[] {
  // Placeholder - real implementation would load from campaign bible
  const bibleId = state.bibleId;
  
  if (bibleId === 'thornferry-road') {
    return [
      'thornferry_ally_ending',
      'thornferry_betray_ending',
      'thornferry_solo_ending',
      'thornferry_party_ending',
      'thornferry_inner_ending',
      'thornferry_outer_ending'
    ];
  }
  
  return [];
}
