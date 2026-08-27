/**
 * P0.3 - Option-Set Diversity Contract (upgraded from pad filter)
 * 
 * Require distinct action-target-consequence profiles. Default: one objective-forward option,
 * one risky/high-upside, one social/world, one disengage/reposition when legal.
 * Dedupe operates on semantic role, not only wording.
 * 
 * Not: Just compare exact option text.
 * 
 * Target:
 * - LitRPG gateQueueOptionHits ≤5 alone
 * - PYOA charter-option ≤1 per 5 turns once examined
 * - Replacement options grounded in legal scene entities with distinct outcomes
 */

import type { GameState, EngineMode } from './types';
import { canonicalizeIntent, intentSimilarity, type SemanticIntent } from './semanticLoopDetector';

export interface ChoiceProfile {
  /** The choice text */
  text: string;
  /** Semantic intent */
  intent: SemanticIntent;
  /** Role in the choice set */
  role: ChoiceRole;
  /** Likely outcome type */
  outcomeType: OutcomeType;
}

export type ChoiceRole =
  | 'objective_forward'  // Advances active quest/goal
  | 'risky_upside'       // High risk, high reward
  | 'social_world'       // Interaction, relationship, info gathering
  | 'disengage'          // Exit, defer, reposition
  | 'safe_explore'       // Low-risk investigation
  | 'generic';           // Fallback

export type OutcomeType =
  | 'progress'           // Quest stage, unlock, discovery
  | 'risk'               // Potential failure, cost, danger
  | 'relationship'       // NPC interaction, faction
  | 'information'        // Learn facts, clues
  | 'resource'           // Gain/lose items, HP, etc.
  | 'position'           // Move, travel, reposition
  | 'stall';             // No meaningful change

export interface DiversityContract {
  /** Required roles for this situation */
  requiredRoles: ChoiceRole[];
  /** Minimum options needed */
  minOptions: number;
  /** Maximum semantic similarity allowed between options (0-1) */
  maxSimilarity: number;
}

export interface OptionCooldown {
  /** Canonical form of the option */
  canonical: string;
  /** Last turn this option was offered */
  lastOfferedTurn: number;
  /** Number of times offered in recent window */
  offerCount: number;
  /** Minimum turns before can offer again */
  cooldownTurns: number;
}

export interface DiversityViolation {
  kind: 'missing_role' | 'too_similar' | 'on_cooldown' | 'semantic_duplicate';
  description: string;
  choices?: string[];
}

/**
 * Classify a choice's role based on its semantic intent and context.
 */
export function classifyChoiceRole(
  choice: string,
  intent: SemanticIntent,
  state: GameState
): ChoiceRole {
  const lower = choice.toLowerCase();
  
  // Check if this advances an active quest
  const activeQuests = (state.quests ?? []).filter(q => q.status === 'active' && q.revealed);
  for (const quest of activeQuests) {
    const questKeywords = quest.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (questKeywords.some(kw => lower.includes(kw))) {
      return 'objective_forward';
    }
    
    // Check objectives
    for (const obj of quest.objectives ?? []) {
      if (!obj.completed && obj.description) {
        const objKeywords = obj.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        if (objKeywords.some(kw => lower.includes(kw))) {
          return 'objective_forward';
        }
      }
    }
  }
  
  // Disengage patterns
  if (intent.action === 'disengage' || /\b(walk away|leave|exit|decline|refuse)\b/i.test(lower)) {
    return 'disengage';
  }
  
  // Risky patterns
  if (/\b(attack|fight|confront|challenge|demand|threaten|force)\b/i.test(lower)) {
    return 'risky_upside';
  }
  
  // Social patterns
  if (intent.action === 'ask' || /\b(talk|speak|negotiate|persuade|charm|befriend)\b/i.test(lower)) {
    return 'social_world';
  }
  
  // Safe exploration
  if (intent.action === 'inspect' || intent.action === 'search' || intent.action === 'listen') {
    return 'safe_explore';
  }
  
  return 'generic';
}

/**
 * Predict likely outcome type for a choice.
 */
export function predictOutcomeType(choice: string, role: ChoiceRole, intent: SemanticIntent): OutcomeType {
  if (role === 'objective_forward') return 'progress';
  if (role === 'risky_upside') return 'risk';
  if (role === 'social_world') return 'relationship';
  if (role === 'disengage') return 'position';
  
  const lower = choice.toLowerCase();
  
  if (/\b(take|grab|acquire|loot|claim)\b/i.test(lower)) return 'resource';
  if (/\b(ask|question|learn|discover|investigate)\b/i.test(lower)) return 'information';
  if (/\b(travel|move|go to|enter)\b/i.test(lower)) return 'position';
  if (/\b(wait|observe|listen|browse)\b/i.test(lower)) return 'stall';
  
  return 'information';
}

/**
 * Build choice profiles for a set of options.
 */
export function buildChoiceProfiles(choices: string[], state: GameState, turn: number): ChoiceProfile[] {
  return choices.map(choice => {
    const intent = canonicalizeIntent(choice, turn);
    const role = classifyChoiceRole(choice, intent, state);
    const outcomeType = predictOutcomeType(choice, role, intent);
    
    return {
      text: choice,
      intent,
      role,
      outcomeType,
    };
  });
}

/**
 * Get diversity contract requirements for current situation.
 */
export function getDiversityContract(state: GameState): DiversityContract {
  const activeQuests = (state.quests ?? []).filter(q => q.status === 'active' && q.revealed);
  const inCombat = !!state.activeEncounter;
  const inDungeon = !!state.activeDungeon;
  const alone = state.openingEstablishment?.aloneArrival === true && !state.activeEncounter;
  
  const requiredRoles: ChoiceRole[] = [];
  
  // Always need at least one meaningful action
  if (activeQuests.length > 0) {
    requiredRoles.push('objective_forward');
  }
  
  // Combat has different requirements
  if (inCombat) {
    return {
      requiredRoles: ['risky_upside', 'disengage'], // Attack and flee
      minOptions: 2,
      maxSimilarity: 0.7,
    };
  }
  
  // Exploration/social situations
  if (!alone) {
    requiredRoles.push('social_world');
  }
  
  // Always allow disengage unless in forced situation
  if (!inCombat && !inDungeon) {
    requiredRoles.push('disengage');
  }
  
  // Default: need diverse options
  return {
    requiredRoles: requiredRoles.length > 0 ? requiredRoles : ['safe_explore', 'social_world', 'disengage'],
    minOptions: 3,
    maxSimilarity: 0.75,
  };
}

/**
 * Check if choice set satisfies diversity contract.
 */
export function checkDiversityContract(
  profiles: ChoiceProfile[],
  contract: DiversityContract
): DiversityViolation[] {
  const violations: DiversityViolation[] = [];
  
  // Check minimum options
  if (profiles.length < contract.minOptions) {
    violations.push({
      kind: 'missing_role',
      description: `Need at least ${contract.minOptions} options, have ${profiles.length}`,
    });
  }
  
  // Check required roles
  const presentRoles = new Set(profiles.map(p => p.role));
  for (const required of contract.requiredRoles) {
    if (!presentRoles.has(required)) {
      violations.push({
        kind: 'missing_role',
        description: `Missing required role: ${required}`,
      });
    }
  }
  
  // Check semantic similarity (pairwise)
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const similarity = intentSimilarity(profiles[i].intent, profiles[j].intent);
      if (similarity > contract.maxSimilarity) {
        violations.push({
          kind: 'too_similar',
          description: `Options too similar (${(similarity * 100).toFixed(0)}%): "${profiles[i].text.slice(0, 40)}" vs "${profiles[j].text.slice(0, 40)}"`,
          choices: [profiles[i].text, profiles[j].text],
        });
      }
    }
  }
  
  // Check for semantic duplicates (same action + target + purpose)
  const seen = new Map<string, string>();
  for (const profile of profiles) {
    const key = `${profile.intent.action}:${profile.intent.target}:${profile.intent.purpose}`;
    if (seen.has(key)) {
      violations.push({
        kind: 'semantic_duplicate',
        description: `Duplicate semantic intent: "${profile.text.slice(0, 40)}" matches "${seen.get(key)?.slice(0, 40)}"`,
        choices: [profile.text, seen.get(key)!],
      });
    }
    seen.set(key, profile.text);
  }
  
  return violations;
}

/**
 * Canonicalize option for cooldown tracking.
 */
export function canonicalizeOption(choice: string): string {
  const intent = canonicalizeIntent(choice, 0);
  return `${intent.action}:${intent.target}:${intent.purpose}`;
}

/**
 * Check if an option is on cooldown.
 */
export function isOnCooldown(
  choice: string,
  currentTurn: number,
  cooldowns: Map<string, OptionCooldown>
): { onCooldown: boolean; turnsRemaining?: number; cooldown?: OptionCooldown } {
  const canonical = canonicalizeOption(choice);
  const cooldown = cooldowns.get(canonical);
  
  if (!cooldown) {
    return { onCooldown: false };
  }
  
  const turnsSinceLast = currentTurn - cooldown.lastOfferedTurn;
  if (turnsSinceLast < cooldown.cooldownTurns) {
    return {
      onCooldown: true,
      turnsRemaining: cooldown.cooldownTurns - turnsSinceLast,
      cooldown,
    };
  }
  
  return { onCooldown: false, cooldown };
}

/**
 * Update cooldown state after offering choices.
 */
export function updateCooldowns(
  choices: string[],
  currentTurn: number,
  cooldowns: Map<string, OptionCooldown>
): Map<string, OptionCooldown> {
  const updated = new Map(cooldowns);
  
  for (const choice of choices) {
    const canonical = canonicalizeOption(choice);
    const existing = updated.get(canonical);
    
    if (existing) {
      // Update existing cooldown
      updated.set(canonical, {
        ...existing,
        lastOfferedTurn: currentTurn,
        offerCount: existing.offerCount + 1,
        // Increase cooldown if offered too frequently
        cooldownTurns: existing.offerCount >= 3 ? Math.min(10, existing.cooldownTurns + 2) : existing.cooldownTurns,
      });
    } else {
      // Create new cooldown
      const baseCooldown = getBaseCooldown(choice);
      updated.set(canonical, {
        canonical,
        lastOfferedTurn: currentTurn,
        offerCount: 1,
        cooldownTurns: baseCooldown,
      });
    }
  }
  
  // Clean up old cooldowns (>50 turns ago)
  for (const [key, cooldown] of updated.entries()) {
    if (currentTurn - cooldown.lastOfferedTurn > 50) {
      updated.delete(key);
    }
  }
  
  return updated;
}

/**
 * Get base cooldown turns for an option based on its semantic type.
 */
function getBaseCooldown(choice: string): number {
  const lower = choice.toLowerCase();
  
  // High cooldown for stalling actions
  if (/\b(walk away|check (?:the|your) bag|wait|observe)\b/i.test(lower)) {
    return 5;
  }
  
  // Medium cooldown for repetitive exploration
  if (/\b(listen|browse|inspect surroundings)\b/i.test(lower)) {
    return 3;
  }
  
  // Low cooldown for specific targeted actions
  return 2;
}

/**
 * Filter choices on cooldown and return filtered set.
 */
export function filterCooldownChoices(
  choices: string[],
  currentTurn: number,
  cooldowns: Map<string, OptionCooldown>
): {
  filtered: string[];
  removed: Array<{ choice: string; reason: string }>;
} {
  const filtered: string[] = [];
  const removed: Array<{ choice: string; reason: string }> = [];
  
  for (const choice of choices) {
    const check = isOnCooldown(choice, currentTurn, cooldowns);
    if (check.onCooldown) {
      removed.push({
        choice,
        reason: `On cooldown: ${check.turnsRemaining} turns remaining (offered ${check.cooldown?.offerCount} times recently)`,
      });
    } else {
      filtered.push(choice);
    }
  }
  
  return { filtered, removed };
}

/**
 * Build retry block for diversity violations.
 */
export function buildDiversityRetryBlock(
  violations: DiversityViolation[],
  contract: DiversityContract,
  engineMode: EngineMode
): string {
  const issues = violations.map(v => `- ${v.kind}: ${v.description}`).join('\n');
  
  const roleDescriptions: Record<ChoiceRole, string> = {
    objective_forward: 'Advance active quest/goal with concrete progress',
    risky_upside: 'High-risk action with potential reward (attack, confront, demand)',
    social_world: 'Interact with NPCs, build relationships, gather information socially',
    disengage: 'Exit, defer, or reposition without commitment',
    safe_explore: 'Low-risk investigation, inspection, observation',
    generic: 'General action',
  };
  
  const required = contract.requiredRoles
    .map(role => `  • ${role}: ${roleDescriptions[role]}`)
    .join('\n');
  
  return `=== CHOICE DIVERSITY RETRY (BINDING) ===
Your prior choice set violated the diversity contract.

Violations:
${issues}

Required roles for this situation:
${required || '  • At least 3 diverse options with distinct outcomes'}

REQUIREMENTS:
1. Each option must have a DISTINCT likely outcome (progress, risk, relationship, information, resource, position)
2. No two options should be semantically similar (same action + target + purpose)
3. Options must be grounded in established scene entities (NPCs, props, locations from SNAPSHOT)
4. Include at least one option that advances the current objective (if any active)
5. ${engineMode === 'litrpg' ? 'Include combat/risk options when appropriate for the zone danger level' : engineMode === 'dnd' ? 'Include investigation and positioning options for tactical play' : engineMode === 'pyoa' ? 'Include meaningful choice forks with irreversible consequences' : 'Include social and exploration options'}

Do not offer: "Walk away", "Check bag", "Inspect surroundings" more than once per 5 turns.
Do not invent: Props, NPCs, or locations not in SNAPSHOT or recent story.
================================================`;
}

/**
 * Telemetry for diversity metrics.
 */
export interface DiversityTelemetry {
  turn: number;
  choiceCount: number;
  uniqueRoles: number;
  violations: number;
  violationKinds: string[];
  maxSimilarity: number;
  cooldownsActive: number;
  choicesRemoved: number;
}

/**
 * Track diversity metrics for telemetry.
 */
export function trackDiversityMetrics(
  profiles: ChoiceProfile[],
  violations: DiversityViolation[],
  cooldowns: Map<string, OptionCooldown>,
  removed: number,
  turn: number
): DiversityTelemetry {
  const uniqueRoles = new Set(profiles.map(p => p.role)).size;
  
  // Calculate max similarity
  let maxSimilarity = 0;
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const similarity = intentSimilarity(profiles[i].intent, profiles[j].intent);
      if (similarity > maxSimilarity) maxSimilarity = similarity;
    }
  }
  
  return {
    turn,
    choiceCount: profiles.length,
    uniqueRoles,
    violations: violations.length,
    violationKinds: violations.map(v => v.kind),
    maxSimilarity,
    cooldownsActive: cooldowns.size,
    choicesRemoved: removed,
  };
}
