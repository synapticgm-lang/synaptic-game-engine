/**
 * WS-4 Wave 1: Encounter Stakes System
 * 
 * Materializes stakes from templates and validates legal actions based on requirements.
 */

import type { GameState } from './types';
import type { EncounterTemplate, EncounterStakes, StakeOutcome } from './encounterBible';

// ============================================================================
// STAKES MATERIALIZATION
// ============================================================================

export interface MaterializedStake {
  headline: string;
  approaches: MaterializedApproach[];
  context: string;
}

export interface MaterializedApproach {
  id: string;
  label: string;
  requirements: string[];
  requirementsMet: boolean;
  method: 'combat' | 'd20' | 'clock' | 'fork' | 'deterministic' | 'hybrid';
  dc?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  onSuccess: string;
  onFailure: string;
  lockout?: string;
}

/**
 * Materialize stakes from a template based on current game state.
 * Evaluates which approaches are legal given player capabilities.
 */
export function materializeStakes(
  template: EncounterTemplate,
  state: GameState
): MaterializedStake {
  const { stakes } = template;
  
  const materializedApproaches = stakes.approaches.map((approach) => {
    const requirementsMet = evaluateRequirements(approach.requirements, state);
    
    return {
      id: approach.id,
      label: approach.label,
      requirements: approach.requirements,
      requirementsMet,
      method: approach.method,
      dc: approach.check?.dc,
      advantage: approach.check?.advantageWhen ? 
        evaluateConditions(approach.check.advantageWhen, state) : false,
      disadvantage: approach.check?.disadvantageWhen ?
        evaluateConditions(approach.check.disadvantageWhen, state) : false,
      onSuccess: approach.onSuccess.summary,
      onFailure: approach.onFailure.summary,
      lockout: approach.lockout,
    };
  });
  
  return {
    headline: stakes.headline,
    approaches: materializedApproaches,
    context: `${materializedApproaches.filter((a) => a.requirementsMet).length}/${materializedApproaches.length} approaches available`,
  };
}

/**
 * Evaluate if requirements are met for an approach.
 */
function evaluateRequirements(requirements: string[], state: GameState): boolean {
  if (!requirements || requirements.length === 0) {
    return true;
  }
  
  for (const req of requirements) {
    if (!evaluateRequirement(req, state)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Evaluate a single requirement against game state.
 * 
 * Requirement format: "category:condition"
 * Examples:
 * - "player:combat_capable"
 * - "inventory:has_rope"
 * - "quest:stage>=2"
 * - "faction:guild>=0"
 */
function evaluateRequirement(requirement: string, state: GameState): boolean {
  const [category, condition] = requirement.split(':', 2);
  
  switch (category) {
    case 'player': {
      if (condition === 'combat_capable') {
        // Check if player has any weapon equipped or unarmed combat capability
        const hasWeapon = state.character?.equippedItems?.weapon != null;
        return hasWeapon || (state.character?.level ?? 1) >= 1;
      }
      if (condition === 'has_companion') {
        return (state.companions?.length ?? 0) > 0;
      }
      if (condition.startsWith('level>=')) {
        const requiredLevel = parseInt(condition.replace('level>=', ''), 10);
        return (state.character?.level ?? 1) >= requiredLevel;
      }
      return true;
    }
    
    case 'inventory': {
      if (condition.startsWith('has_')) {
        const itemName = condition.replace('has_', '').replace(/_/g, ' ');
        return state.character?.inventory?.some(
          (item) => item.name.toLowerCase().includes(itemName)
        ) ?? false;
      }
      return false;
    }
    
    case 'quest': {
      if (condition.includes('stage>=')) {
        const [questPrefix, stageReq] = condition.split('stage>=');
        const requiredStage = parseInt(stageReq, 10);
        const quest = state.quests?.find((q) => q.id.includes(questPrefix.trim()));
        return quest ? (quest.currentStage ?? 0) >= requiredStage : false;
      }
      return false;
    }
    
    case 'faction': {
      if (condition.includes('>=')) {
        const [factionName, valueStr] = condition.split('>=');
        const requiredValue = parseInt(valueStr, 10);
        const standing = state.worldLedger?.factionStandings?.find(
          (f) => f.faction.toLowerCase().includes(factionName.trim().toLowerCase())
        );
        return standing ? standing.standing >= requiredValue : false;
      }
      return false;
    }
    
    case 'scene': {
      if (condition === 'alone') {
        return state.openingEstablishment?.aloneArrival === true;
      }
      if (condition === 'indoor') {
        return state.sceneFacts?.indoor === true;
      }
      return true;
    }
    
    default:
      // Unknown requirement category - default to true (permissive)
      return true;
  }
}

/**
 * Evaluate conditional advantage/disadvantage triggers.
 */
function evaluateConditions(conditions: string[], state: GameState): boolean {
  if (!conditions || conditions.length === 0) {
    return false;
  }
  
  // For Wave 1, just check if any condition matches
  for (const condition of conditions) {
    if (evaluateRequirement(condition, state)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate that an approach is legal (requirements met and not locked out).
 */
export function isApproachLegal(
  approachId: string,
  template: EncounterTemplate,
  state: GameState
): { legal: boolean; reason?: string } {
  const approach = template.stakes.approaches.find((a) => a.id === approachId);
  
  if (!approach) {
    return { legal: false, reason: 'Approach not found' };
  }
  
  // Check if approach was locked out by previous attempt
  const lockoutKey = `${template.id}:${approachId}`;
  const isLockedOut = state.arcDirector?.choiceFingerprints?.some(
    (fp) => fp.fingerprint === lockoutKey
  ) ?? false;
  
  if (isLockedOut) {
    return { legal: false, reason: approach.lockout ?? 'This approach is no longer available' };
  }
  
  // Check requirements
  const requirementsMet = evaluateRequirements(approach.requirements, state);
  
  if (!requirementsMet) {
    const unmet = approach.requirements.find((req) => !evaluateRequirement(req, state));
    return { legal: false, reason: `Requirement not met: ${unmet}` };
  }
  
  return { legal: true };
}

/**
 * Get all legal approaches for a template.
 */
export function getLegalApproaches(
  template: EncounterTemplate,
  state: GameState
): MaterializedApproach[] {
  const materialized = materializeStakes(template, state);
  return materialized.approaches.filter((a) => a.requirementsMet);
}

/**
 * Validate that an action is honest (has a corresponding approach).
 */
export function validateActionHonesty(
  actionText: string,
  template: EncounterTemplate,
  state: GameState
): { honest: boolean; suggestedApproach?: string } {
  const legalApproaches = getLegalApproaches(template, state);
  
  if (legalApproaches.length === 0) {
    return { honest: false };
  }
  
  // Simple keyword matching for Wave 1
  const normalizedAction = actionText.toLowerCase();
  
  for (const approach of legalApproaches) {
    const normalizedLabel = approach.label.toLowerCase();
    
    // Check if action text contains key words from the approach label
    const labelWords = normalizedLabel.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = labelWords.filter((word) => normalizedAction.includes(word)).length;
    
    if (matchCount >= Math.min(2, labelWords.length)) {
      return { honest: true, suggestedApproach: approach.id };
    }
  }
  
  // If no match found, suggest the first legal approach
  return {
    honest: false,
    suggestedApproach: legalApproaches[0]?.id,
  };
}
