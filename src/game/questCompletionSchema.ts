/**
 * P1.3 - Quest Completion Schema
 * 
 * Every quest gets entry condition, active obstacle, progress signal, terminal success/failure,
 * reward/cost, and follow-on hook.
 * 
 * Not: Just add quest-tied options.
 * 
 * Target:
 * - ≥1 completed or failed objective arc within 50 turns
 * - LitRPG: quest-tied option ≤10t after registration
 * - PYOA: ≥1 mutually exclusive crisis fork by T30
 */

import type { GameState, Quest, EngineMode } from './types';

export interface QuestCompletionSchema {
  questId: string;
  questName: string;
  /** Entry condition - what unlocked this quest */
  entryCondition: string;
  /** Active obstacle - what blocks progress */
  activeObstacle?: string;
  /** Progress signals - how player knows they're advancing */
  progressSignals: ProgressSignal[];
  /** Terminal states */
  terminalStates: TerminalState[];
  /** Rewards for success */
  rewards: QuestReward[];
  /** Costs for failure */
  costs: QuestCost[];
  /** Follow-on hook - what unlocks after */
  followOnHook?: string;
  /** Turn quest was revealed */
  revealedTurn: number;
  /** Last turn with quest-related option */
  lastQuestOptionTurn?: number;
  /** Last turn with progress */
  lastProgressTurn?: number;
}

export interface ProgressSignal {
  turn: number;
  signal: string;
  /** What changed */
  delta: string;
}

export interface TerminalState {
  condition: string;
  outcome: 'success' | 'failure' | 'partial';
  description: string;
}

export interface QuestReward {
  type: 'xp' | 'item' | 'gold' | 'reputation' | 'unlock' | 'relationship';
  amount?: number;
  description: string;
}

export interface QuestCost {
  type: 'reputation' | 'relationship' | 'access' | 'opportunity';
  description: string;
}

/**
 * Build quest completion schema from a quest.
 */
export function buildQuestSchema(quest: Quest, state: GameState): QuestCompletionSchema {
  const entryCondition = quest.provenance || 'Unknown trigger';
  
  // Determine active obstacle from objectives
  let activeObstacle: string | undefined;
  const incompleteObjective = (quest.objectives ?? []).find(o => !o.completed);
  if (incompleteObjective) {
    activeObstacle = incompleteObjective.description;
  }
  
  // Extract progress signals from timeline
  const progressSignals: ProgressSignal[] = [];
  const questKeywords = quest.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  for (const fact of state.timeline ?? []) {
    const matchesQuest = questKeywords.some(kw => fact.text.toLowerCase().includes(kw));
    if (matchesQuest) {
      progressSignals.push({
        turn: fact.turn,
        signal: fact.text,
        delta: `Quest-related event at T${fact.turn}`,
      });
    }
  }
  
  // Define terminal states
  const terminalStates: TerminalState[] = [
    {
      condition: 'All objectives completed',
      outcome: 'success',
      description: `${quest.name} successfully completed`,
    },
    {
      condition: 'Critical objective failed or quest abandoned',
      outcome: 'failure',
      description: `${quest.name} failed`,
    },
  ];
  
  // If quest has multiple objectives, add partial success
  if ((quest.objectives ?? []).length > 1) {
    terminalStates.push({
      condition: 'Some objectives completed, others failed',
      outcome: 'partial',
      description: `${quest.name} partially completed`,
    });
  }
  
  // Determine rewards based on quest type
  const rewards: QuestReward[] = [];
  const baseXp = quest.type === 'main' ? 100 : quest.type === 'side' ? 50 : 25;
  
  rewards.push({
    type: 'xp',
    amount: baseXp,
    description: `${baseXp} XP for completion`,
  });
  
  // Check for specific reward mentions in quest description
  if (quest.description?.toLowerCase().includes('reward')) {
    rewards.push({
      type: 'item',
      description: 'Quest-specific reward item',
    });
  }
  
  // Determine costs for failure
  const costs: QuestCost[] = [];
  
  if (quest.type === 'main') {
    costs.push({
      type: 'access',
      description: 'May block story progression',
    });
  }
  
  // Follow-on hook
  let followOnHook: string | undefined;
  if (quest.type === 'main') {
    followOnHook = 'Unlocks next story chapter';
  } else if (quest.type === 'side') {
    followOnHook = 'May unlock related side quests or NPC interactions';
  }
  
  return {
    questId: quest.id,
    questName: quest.name,
    entryCondition,
    activeObstacle,
    progressSignals: progressSignals.slice(-5), // Keep last 5
    terminalStates,
    rewards,
    costs,
    followOnHook,
    revealedTurn: state.turn, // Approximate - should track from quest reveal
  };
}

/**
 * Check if quest needs a progress option soon.
 */
export function needsQuestOption(
  schema: QuestCompletionSchema,
  currentTurn: number,
  maxTurnsSinceOption: number = 10
): {
  needed: boolean;
  reason?: string;
  urgency: 'low' | 'medium' | 'high';
} {
  // No last option - needs one immediately
  if (!schema.lastQuestOptionTurn) {
    return {
      needed: true,
      reason: `No quest option offered yet for ${schema.questName}`,
      urgency: 'high',
    };
  }
  
  const turnsSinceOption = currentTurn - schema.lastQuestOptionTurn;
  
  // High urgency if exceeded max turns
  if (turnsSinceOption >= maxTurnsSinceOption) {
    return {
      needed: true,
      reason: `${turnsSinceOption} turns since last ${schema.questName} option (max ${maxTurnsSinceOption})`,
      urgency: 'high',
    };
  }
  
  // Medium urgency if getting close
  if (turnsSinceOption >= maxTurnsSinceOption * 0.7) {
    return {
      needed: true,
      reason: `${turnsSinceOption} turns since last ${schema.questName} option`,
      urgency: 'medium',
    };
  }
  
  // Check for progress stall
  const turnsSinceProgress = schema.lastProgressTurn
    ? currentTurn - schema.lastProgressTurn
    : currentTurn - schema.revealedTurn;
  
  if (turnsSinceProgress >= 20) {
    return {
      needed: true,
      reason: `No progress on ${schema.questName} in ${turnsSinceProgress} turns`,
      urgency: 'high',
    };
  }
  
  return { needed: false, urgency: 'low' };
}

/**
 * Format quest pressure mandate for situation packet.
 */
export function formatQuestPressureMandate(
  schemas: QuestCompletionSchema[],
  currentTurn: number
): string | null {
  const urgent = schemas.filter(s => {
    const check = needsQuestOption(s, currentTurn);
    return check.needed && check.urgency === 'high';
  });
  
  if (urgent.length === 0) return null;
  
  const quest = urgent[0]; // Focus on first urgent quest
  
  return `QUEST PRESSURE (${quest.questName}): Include ONE concrete option to advance this quest objective: "${quest.activeObstacle || quest.questName}". The option must be actionable (not just "think about the quest") and grounded in current scene entities.`;
}

/**
 * Check if quest is ready for terminal resolution.
 */
export function checkQuestTerminalState(
  quest: Quest,
  schema: QuestCompletionSchema
): {
  isTerminal: boolean;
  terminalState?: TerminalState;
  reason?: string;
} {
  // Check if all objectives completed
  const objectives = quest.objectives ?? [];
  const allCompleted = objectives.length > 0 && objectives.every(o => o.completed);
  
  if (allCompleted) {
    return {
      isTerminal: true,
      terminalState: schema.terminalStates.find(t => t.outcome === 'success'),
      reason: 'All objectives completed',
    };
  }
  
  // Check if quest status is already terminal
  if (quest.status === 'completed' || quest.status === 'failed') {
    const outcome = quest.status === 'completed' ? 'success' : 'failure';
    return {
      isTerminal: true,
      terminalState: schema.terminalStates.find(t => t.outcome === outcome),
      reason: `Quest status is ${quest.status}`,
    };
  }
  
  // Check for partial completion (some objectives done, others impossible)
  const completedCount = objectives.filter(o => o.completed).length;
  if (completedCount > 0 && completedCount < objectives.length) {
    // Check if remaining objectives are blocked
    // This would require more context, but for now just flag partial
    return {
      isTerminal: false,
      reason: `Partial progress: ${completedCount}/${objectives.length} objectives`,
    };
  }
  
  return { isTerminal: false };
}

/**
 * Build quest completion outcome.
 */
export function buildQuestCompletion(
  quest: Quest,
  schema: QuestCompletionSchema,
  success: boolean
): {
  rewards: QuestReward[];
  consequences: string[];
  followOn?: string;
} {
  const rewards: QuestReward[] = [];
  const consequences: string[] = [];
  
  if (success) {
    // Apply rewards
    rewards.push(...schema.rewards);
    consequences.push(`Completed: ${schema.questName}`);
    
    // Follow-on hook
    if (schema.followOnHook) {
      consequences.push(schema.followOnHook);
    }
  } else {
    // Apply costs
    for (const cost of schema.costs) {
      consequences.push(`Failed ${schema.questName}: ${cost.description}`);
    }
    
    // Partial rewards for failure
    const failureXp = schema.rewards.find(r => r.type === 'xp');
    if (failureXp && failureXp.amount) {
      rewards.push({
        type: 'xp',
        amount: Math.floor(failureXp.amount * 0.5),
        description: `${Math.floor(failureXp.amount * 0.5)} XP for attempting`,
      });
    }
  }
  
  return {
    rewards,
    consequences,
    followOn: success ? schema.followOnHook : undefined,
  };
}

/**
 * Format quest completion for narrative.
 */
export function formatQuestCompletionNarrative(
  quest: Quest,
  schema: QuestCompletionSchema,
  success: boolean
): string {
  const outcome = buildQuestCompletion(quest, schema, success);
  
  const lines: string[] = [];
  
  if (success) {
    lines.push(`Quest Complete: ${schema.questName}`);
  } else {
    lines.push(`Quest Failed: ${schema.questName}`);
  }
  
  if (outcome.rewards.length > 0) {
    lines.push('\nRewards:');
    for (const reward of outcome.rewards) {
      lines.push(`- ${reward.description}`);
    }
  }
  
  if (outcome.consequences.length > 0) {
    lines.push('\nConsequences:');
    for (const consequence of outcome.consequences) {
      lines.push(`- ${consequence}`);
    }
  }
  
  if (outcome.followOn) {
    lines.push(`\nFollow-on: ${outcome.followOn}`);
  }
  
  return lines.join('\n');
}

/**
 * Build PYOA crisis fork (mutually exclusive branches).
 */
export function buildCrisisFork(
  state: GameState,
  turn: number
): {
  forkId: string;
  prompt: string;
  branches: CrisisBranch[];
} | null {
  const engineMode = state.engineMode;
  
  if (engineMode !== 'pyoa') return null;
  
  // Check if we're in a good position for a crisis fork
  const activeQuests = (state.quests ?? []).filter(q => q.status === 'active' && q.revealed);
  if (activeQuests.length === 0) return null;
  
  const quest = activeQuests[0];
  
  return {
    forkId: `fork-${turn}-${quest.id}`,
    prompt: `CRISIS FORK (${quest.name}): Present a MUTUALLY EXCLUSIVE choice with irreversible consequences. Each branch must lead to different outcomes that cannot be undone. Make the stakes clear and the consequences permanent.`,
    branches: [
      {
        label: 'Path A: High-risk, high-reward',
        consequences: ['Gain significant advantage', 'Risk relationship loss or danger'],
        lockout: 'Path B becomes impossible',
      },
      {
        label: 'Path B: Safe, but limited reward',
        consequences: ['Maintain relationships', 'Miss opportunity for major gain'],
        lockout: 'Path A becomes impossible',
      },
    ],
  };
}

export interface CrisisBranch {
  label: string;
  consequences: string[];
  lockout: string;
}

/**
 * Telemetry for quest metrics.
 */
export interface QuestTelemetry {
  turn: number;
  activeQuests: number;
  completedQuests: number;
  failedQuests: number;
  averageTurnsToComplete: number;
  averageTurnsSinceQuestOption: number;
  questsWithRecentProgress: number;
}

/**
 * Track quest metrics for telemetry.
 */
export function trackQuestMetrics(
  schemas: QuestCompletionSchema[],
  allQuests: Quest[],
  currentTurn: number
): QuestTelemetry {
  const active = allQuests.filter(q => q.status === 'active' && q.revealed).length;
  const completed = allQuests.filter(q => q.status === 'completed').length;
  const failed = allQuests.filter(q => q.status === 'failed').length;
  
  // Calculate average turns to complete
  const completedSchemas = schemas.filter(s =>
    allQuests.find(q => q.id === s.questId && q.status === 'completed')
  );
  const turnsToComplete = completedSchemas.map(s =>
    (s.lastProgressTurn || currentTurn) - s.revealedTurn
  );
  const averageTurnsToComplete = turnsToComplete.length > 0
    ? turnsToComplete.reduce((sum, t) => sum + t, 0) / turnsToComplete.length
    : 0;
  
  // Calculate average turns since quest option
  const activeSchemas = schemas.filter(s =>
    allQuests.find(q => q.id === s.questId && q.status === 'active')
  );
  const turnsSinceOption = activeSchemas
    .filter(s => s.lastQuestOptionTurn !== undefined)
    .map(s => currentTurn - (s.lastQuestOptionTurn || currentTurn));
  const averageTurnsSinceQuestOption = turnsSinceOption.length > 0
    ? turnsSinceOption.reduce((sum, t) => sum + t, 0) / turnsSinceOption.length
    : 0;
  
  // Count quests with recent progress (last 10 turns)
  const questsWithRecentProgress = schemas.filter(s =>
    s.lastProgressTurn && (currentTurn - s.lastProgressTurn) <= 10
  ).length;
  
  return {
    turn: currentTurn,
    activeQuests: active,
    completedQuests: completed,
    failedQuests: failed,
    averageTurnsToComplete,
    averageTurnsSinceQuestOption,
    questsWithRecentProgress,
  };
}
