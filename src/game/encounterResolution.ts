/**
 * P1.2 - Encounter Resolution Contract (upgraded from "threat spawn")
 * 
 * Every spawned threat needs stakes, legal player responses, success/failure resolution,
 * resource or relationship effects, and aftermath.
 * 
 * Not: Just spawn an ambush.
 * 
 * Target:
 * - ≥1 forced encounter by T50 (LitRPG/DnD maxlevel)
 * - Encounters include: initiation → 3 decision points → resolution → resource change → aftermath
 * - Genre-appropriate (not just combat for RPG/PYOA)
 */

import type { GameState, EngineMode } from './types';

export interface EncounterSpec {
  /** Unique ID for this encounter */
  id: string;
  /** Turn this encounter was initiated */
  initiationTurn: number;
  /** Type of encounter */
  type: EncounterType;
  /** What triggered this encounter */
  trigger: EncounterTrigger;
  /** Stakes - what's at risk */
  stakes: string;
  /** Legal player responses */
  legalResponses: EncounterResponse[];
  /** Current phase */
  phase: EncounterPhase;
  /** Decision points completed */
  decisionsCompleted: number;
  /** Minimum decisions required */
  minDecisions: number;
  /** Is this encounter resolved? */
  resolved: boolean;
  /** Resolution outcome */
  outcome?: EncounterOutcome;
}

export type EncounterType =
  | 'combat'            // Physical confrontation
  | 'social'            // Negotiation, persuasion, deception
  | 'crisis'            // Time-sensitive problem
  | 'ambush'            // Surprise attack
  | 'challenge'         // Skill check or puzzle
  | 'moral_choice'      // Ethical dilemma
  | 'betrayal';         // Relationship conflict

export type EncounterTrigger =
  | 'stagnation'        // Player looping/stalling
  | 'zone_timer'        // Zone threat timer expired
  | 'quest_deadline'    // Quest time limit reached
  | 'npc_agenda'        // NPC acting on their goals
  | 'faction_response'  // Faction reacting to player actions
  | 'location_hazard'   // Environmental danger
  | 'narrative';        // Story-driven event

export type EncounterResponse =
  | 'fight'             // Engage in combat
  | 'flee'              // Attempt to escape
  | 'negotiate'         // Try to talk it out
  | 'trick'             // Deception or misdirection
  | 'sacrifice'         // Pay a cost to resolve
  | 'ally'              // Call for help
  | 'skill'             // Use ability or skill
  | 'wait'              // See what happens
  | 'accept'            // Accept consequences
  | 'refuse';           // Reject terms

export type EncounterPhase =
  | 'initiation'        // Encounter begins, stakes established
  | 'escalation'        // Tension rises, decisions needed
  | 'climax'            // Critical moment
  | 'resolution'        // Outcome determined
  | 'aftermath';        // Consequences applied

export interface EncounterOutcome {
  /** Did player succeed? */
  success: boolean;
  /** Resource changes (HP, items, gold, etc.) */
  resourceChanges: ResourceChange[];
  /** Relationship changes (NPC, faction) */
  relationshipChanges: RelationshipChange[];
  /** New facts or consequences */
  consequences: string[];
  /** XP awarded */
  xpAwarded: number;
  /** Narrative summary */
  summary: string;
}

export interface ResourceChange {
  type: 'hp' | 'mp' | 'item' | 'gold' | 'time';
  amount: number;
  reason: string;
}

export interface RelationshipChange {
  entity: string;
  change: number; // -100 to +100
  reason: string;
}

/**
 * Check if an encounter is needed based on game state.
 */
export function shouldTriggerEncounter(
  state: GameState,
  loopDetection: { isLoop: boolean; loopCount: number; escalationLevel: number },
  turnsSinceLastEncounter: number
): {
  shouldTrigger: boolean;
  trigger?: EncounterTrigger;
  type?: EncounterType;
  reason?: string;
} {
  const turn = state.turn;
  const engineMode = state.engineMode;
  const activeQuests = (state.quests ?? []).filter(q => q.status === 'active' && q.revealed);
  const inDungeon = !!state.activeDungeon;
  
  // LitRPG/DnD: Force encounter by T50 if maxlevel and none yet
  if ((engineMode === 'litrpg' || engineMode === 'dnd') && turn >= 50 && turnsSinceLastEncounter >= 50) {
    return {
      shouldTrigger: true,
      trigger: 'zone_timer',
      type: 'combat',
      reason: 'Zone threat timer: forced encounter by T50',
    };
  }
  
  // Stagnation trigger (loop escalation level 5+)
  if (loopDetection.isLoop && loopDetection.escalationLevel >= 5) {
    const type = (engineMode === 'litrpg' || engineMode === 'dnd') ? 'combat' : 'crisis';
    return {
      shouldTrigger: true,
      trigger: 'stagnation',
      type,
      reason: `Player stagnation: ${loopDetection.loopCount} repeated actions`,
    };
  }
  
  // Quest deadline pressure (active quest + no progress in 20+ turns)
  if (activeQuests.length > 0 && turnsSinceLastEncounter >= 20) {
    return {
      shouldTrigger: true,
      trigger: 'quest_deadline',
      type: engineMode === 'pyoa' ? 'moral_choice' : 'crisis',
      reason: 'Quest deadline pressure: time running out',
    };
  }
  
  // Dungeon ambush (in dungeon + no encounter in 15+ turns)
  if (inDungeon && turnsSinceLastEncounter >= 15) {
    return {
      shouldTrigger: true,
      trigger: 'location_hazard',
      type: 'ambush',
      reason: 'Dungeon patrol: extended exploration without threat',
    };
  }
  
  return { shouldTrigger: false };
}

/**
 * Build encounter spec appropriate for the genre and situation.
 */
export function buildEncounterSpec(
  trigger: EncounterTrigger,
  type: EncounterType,
  state: GameState
): EncounterSpec {
  const id = `encounter-${state.turn}-${Date.now()}`;
  const engineMode = state.engineMode;
  
  // Determine stakes based on type
  let stakes = '';
  let legalResponses: EncounterResponse[] = [];
  let minDecisions = 3;
  
  switch (type) {
    case 'combat':
      stakes = 'HP damage, potential defeat, equipment durability';
      legalResponses = ['fight', 'flee', 'negotiate', 'ally'];
      minDecisions = 3;
      break;
      
    case 'ambush':
      stakes = 'Surprise round damage, position disadvantage, resource loss';
      legalResponses = ['fight', 'flee', 'trick'];
      minDecisions = 3;
      break;
      
    case 'social':
      stakes = 'NPC relationship, faction standing, information access';
      legalResponses = ['negotiate', 'trick', 'sacrifice', 'refuse'];
      minDecisions = 3;
      break;
      
    case 'crisis':
      stakes = 'Quest failure, location access, NPC safety, time pressure';
      legalResponses = ['skill', 'sacrifice', 'ally', 'accept'];
      minDecisions = 3;
      break;
      
    case 'moral_choice':
      stakes = 'Relationship consequences, faction alignment, conscience';
      legalResponses = ['accept', 'refuse', 'negotiate', 'sacrifice'];
      minDecisions = 2; // PYOA often has binary choices
      break;
      
    case 'challenge':
      stakes = 'Obstacle blocking progress, resource cost, skill test';
      legalResponses = ['skill', 'trick', 'sacrifice', 'flee'];
      minDecisions = 3;
      break;
      
    case 'betrayal':
      stakes = 'Broken trust, relationship damage, potential danger';
      legalResponses = ['fight', 'flee', 'negotiate', 'accept'];
      minDecisions = 3;
      break;
  }
  
  // Adjust for genre
  if (engineMode === 'pyoa') {
    // PYOA: more binary choices, higher stakes
    minDecisions = Math.max(2, minDecisions - 1);
    stakes = `${stakes} (irreversible consequences)`;
  } else if (engineMode === 'litrpg') {
    // LitRPG: always include combat options, XP stakes
    if (!legalResponses.includes('fight')) {
      legalResponses.push('fight');
    }
    stakes = `${stakes}, XP gain/loss`;
  } else if (engineMode === 'dnd') {
    // DnD: tactical options
    if (!legalResponses.includes('skill')) {
      legalResponses.push('skill');
    }
  }
  
  return {
    id,
    initiationTurn: state.turn,
    type,
    trigger,
    stakes,
    legalResponses,
    phase: 'initiation',
    decisionsCompleted: 0,
    minDecisions,
    resolved: false,
  };
}

/**
 * Format encounter initiation for GM prompt.
 */
export function formatEncounterInitiation(spec: EncounterSpec, state: GameState): string {
  const location = state.currentLocation || 'this location';
  const triggerContext = {
    stagnation: 'The player has been stalling. This encounter forces action.',
    zone_timer: 'Zone threat timer has triggered an encounter.',
    quest_deadline: 'Quest time pressure has created an urgent situation.',
    npc_agenda: 'An NPC is acting on their own goals.',
    faction_response: 'A faction is responding to player actions.',
    location_hazard: 'The location itself presents danger.',
    narrative: 'Story progression requires this encounter.',
  };
  
  return `=== ENCOUNTER INITIATION (BINDING) ===
Type: ${spec.type}
Trigger: ${spec.trigger} — ${triggerContext[spec.trigger]}
Location: ${location}

STAKES (what player risks):
${spec.stakes}

LEGAL RESPONSES (options must include these):
${spec.legalResponses.map(r => `- ${r}`).join('\n')}

REQUIRED STRUCTURE:
1. INITIATION: Brief, telegraphed threat/challenge (2-3 sentences)
   - Show the danger/problem clearly
   - Establish what's at risk
   - Present immediately, not "in the distance"

2. DECISIONS (minimum ${spec.minDecisions} turns):
   - Player chooses response from legal options
   - Each choice has concrete consequences
   - Tension escalates with each decision
   - No auto-resolution - player must act

3. RESOLUTION:
   - Success or failure determined by player choices
   - Resource costs applied (HP, items, time, relationships)
   - Outcome is persistent (affects future turns)

4. AFTERMATH:
   - XP awarded for resolution (not just participation)
   - New facts added to timeline
   - Relationship/faction changes recorded
   - Consequences stay on the ledger

Do not: 
- Auto-resolve without player input
- Make choices purely cosmetic
- Reset the situation after resolution
- Spawn then immediately end encounter
- Offer only "fight" or only "flee"

This is a ${spec.type} encounter - narrate genre-appropriately.
================================================`;
}

/**
 * Check if encounter has been properly resolved.
 */
export function validateEncounterResolution(
  spec: EncounterSpec,
  state: GameState
): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!spec.resolved) {
    issues.push('Encounter marked unresolved but should be complete');
  }
  
  if (spec.decisionsCompleted < spec.minDecisions) {
    issues.push(`Only ${spec.decisionsCompleted}/${spec.minDecisions} decisions completed`);
  }
  
  if (!spec.outcome) {
    issues.push('No outcome recorded');
    return { valid: false, issues };
  }
  
  // Check resource changes
  if (spec.outcome.resourceChanges.length === 0) {
    issues.push('No resource changes - encounter had no concrete cost/reward');
  }
  
  // Check consequences
  if (spec.outcome.consequences.length === 0) {
    issues.push('No consequences recorded - encounter had no lasting impact');
  }
  
  // Check XP
  if (spec.outcome.xpAwarded === 0 && spec.outcome.success) {
    issues.push('No XP awarded for successful resolution');
  }
  
  // Check timeline
  const timelineFacts = (state.timeline ?? []).filter(f => f.turn >= spec.initiationTurn);
  if (timelineFacts.length === 0) {
    issues.push('No timeline facts added during encounter');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Build aftermath text for encounter resolution.
 */
export function formatEncounterAftermath(outcome: EncounterOutcome): string {
  const lines: string[] = [];
  
  lines.push(`Encounter ${outcome.success ? 'Resolved' : 'Failed'}: ${outcome.summary}`);
  
  if (outcome.resourceChanges.length > 0) {
    lines.push('\nResource Changes:');
    for (const change of outcome.resourceChanges) {
      const sign = change.amount >= 0 ? '+' : '';
      lines.push(`- ${change.type.toUpperCase()}: ${sign}${change.amount} (${change.reason})`);
    }
  }
  
  if (outcome.relationshipChanges.length > 0) {
    lines.push('\nRelationship Changes:');
    for (const change of outcome.relationshipChanges) {
      const sign = change.change >= 0 ? '+' : '';
      lines.push(`- ${change.entity}: ${sign}${change.change} (${change.reason})`);
    }
  }
  
  if (outcome.consequences.length > 0) {
    lines.push('\nConsequences:');
    for (const consequence of outcome.consequences) {
      lines.push(`- ${consequence}`);
    }
  }
  
  if (outcome.xpAwarded > 0) {
    lines.push(`\nXP Awarded: +${outcome.xpAwarded}`);
  }
  
  return lines.join('\n');
}

/**
 * Telemetry for encounter metrics.
 */
export interface EncounterTelemetry {
  turn: number;
  encounterType: EncounterType;
  trigger: EncounterTrigger;
  decisionsCompleted: number;
  resolved: boolean;
  success: boolean;
  resourceChangeCount: number;
  relationshipChangeCount: number;
  consequenceCount: number;
  xpAwarded: number;
  turnDuration: number;
}

/**
 * Track encounter metrics for telemetry.
 */
export function trackEncounterMetrics(
  spec: EncounterSpec,
  outcome: EncounterOutcome,
  currentTurn: number
): EncounterTelemetry {
  return {
    turn: currentTurn,
    encounterType: spec.type,
    trigger: spec.trigger,
    decisionsCompleted: spec.decisionsCompleted,
    resolved: spec.resolved,
    success: outcome.success,
    resourceChangeCount: outcome.resourceChanges.length,
    relationshipChangeCount: outcome.relationshipChanges.length,
    consequenceCount: outcome.consequences.length,
    xpAwarded: outcome.xpAwarded,
    turnDuration: currentTurn - spec.initiationTurn,
  };
}
