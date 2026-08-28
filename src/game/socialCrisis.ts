/**
 * WS-7 Wave 1: Social Crisis Loader and Scheduler
 * 
 * Loads crisis catalog, evaluates eligibility, selects crises on 30-turn cadence.
 */

import type { GameState } from './types';
import type { SocialCrisis, CrisisPattern, SocialStakes } from './socialCrisisTypes';

// ============================================================================
// CRISIS CATALOG (5-8 patterns for Wave 1 ship)
// ============================================================================

/**
 * Crisis catalog (start with 5 patterns, expand to 15 in P1)
 * 
 * Wave 1 ships: SC-01, SC-02, SC-03, SC-05, SC-07
 * Future: SC-04, SC-06, SC-08 through SC-15
 */
export const CRISIS_CATALOG: SocialCrisis[] = [
  {
    id: 'SC-01',
    name: 'Social Standoff',
    modes: ['dnd', 'rpg', 'pyoa'],
    eligibility: {
      minTurn: 10,
      requiresTwoActors: true,
      requiresFaction: false,
      requiresQuest: false,
      incompatibleWithCombat: true,
    },
    stakesTemplates: [
      {
        gain: 'Both parties agree to truce, player gains trust from both',
        loss: 'Standoff escalates to combat or one party leaves in anger',
        owner: 'both',
        magnitude: 'moderate',
      },
      {
        gain: 'One party concedes, player gains favor from winner',
        loss: 'Standoff unresolved, both parties blame player',
        owner: 'both',
        magnitude: 'minor',
      },
    ],
    suppressionTurns: 60,
    targetCadence: 30,
  },
  
  {
    id: 'SC-02',
    name: 'Public Challenge',
    modes: ['dnd', 'rpg', 'litrpg'],
    eligibility: {
      minTurn: 15,
      requiresTwoActors: false,
      requiresFaction: false,
      requiresQuest: false,
      incompatibleWithCombat: true,
    },
    stakesTemplates: [
      {
        gain: 'Authority backs down, player gains reputation',
        loss: 'Authority prevails, player loses face or access',
        owner: 'both',
        magnitude: 'moderate',
      },
    ],
    suppressionTurns: 60,
    targetCadence: 30,
  },
  
  {
    id: 'SC-03',
    name: 'Faction Dispute',
    modes: ['dnd', 'rpg', 'litrpg'],
    eligibility: {
      minTurn: 20,
      requiresTwoActors: false,
      requiresFaction: true,
      requiresQuest: false,
      incompatibleWithCombat: true,
    },
    stakesTemplates: [
      {
        gain: 'Alliance with chosen faction, standing +20',
        loss: 'Enemy status with rejected faction, standing -30',
        owner: 'faction',
        magnitude: 'major',
      },
    ],
    suppressionTurns: 80,
    targetCadence: 40,
  },
  
  {
    id: 'SC-05',
    name: 'Resource Competition',
    modes: ['dnd', 'rpg', 'litrpg', 'pyoa'],
    eligibility: {
      minTurn: 12,
      requiresTwoActors: true,
      requiresFaction: false,
      requiresQuest: false,
      incompatibleWithCombat: true,
    },
    stakesTemplates: [
      {
        gain: 'Player gets resource, NPC accepts alternate compensation',
        loss: 'NPC takes resource, player must find alternate',
        owner: 'both',
        magnitude: 'moderate',
      },
    ],
    suppressionTurns: 50,
    targetCadence: 25,
  },
  
  {
    id: 'SC-07',
    name: 'Social Debt',
    modes: ['dnd', 'rpg', 'pyoa'],
    eligibility: {
      minTurn: 18,
      requiresTwoActors: false,
      requiresFaction: false,
      requiresQuest: false,
      incompatibleWithCombat: true,
    },
    stakesTemplates: [
      {
        gain: 'Debt repaid, relationship restored or improved',
        loss: 'Debt unpaid, NPC becomes hostile or spreads rumor',
        owner: 'npc',
        magnitude: 'moderate',
      },
    ],
    suppressionTurns: 60,
    targetCadence: 30,
  },
];

// ============================================================================
// ELIGIBILITY CHECKS
// ============================================================================

/**
 * Check if crisis is eligible to spawn
 */
export function isCrisisEligible(
  crisis: SocialCrisis,
  state: GameState
): boolean {
  const mode = state.engineMode || 'rpg';
  const turn = state.turn ?? 0;
  
  // Mode check
  if (!crisis.modes.includes(mode)) {
    return false;
  }
  
  // Turn check
  if (turn < crisis.eligibility.minTurn) {
    return false;
  }
  
  // Active combat check
  if (crisis.eligibility.incompatibleWithCombat && state.activeEncounter) {
    return false;
  }
  
  // Two actors check
  if (crisis.eligibility.requiresTwoActors) {
    const present = state.sceneFacts?.present ?? [];
    const namedNpcs = present.filter(p => p && !/^(a|an|the|some)\s/i.test(p));
    if (namedNpcs.length < 2) {
      return false;
    }
  }
  
  // Faction check
  if (crisis.eligibility.requiresFaction) {
    const factions = state.worldLedger?.factionStandings ?? [];
    if (factions.length === 0) {
      return false;
    }
  }
  
  // Quest check
  if (crisis.eligibility.requiresQuest) {
    const activeQuests = (state.quests ?? []).filter(q => q.status === 'active');
    if (activeQuests.length === 0) {
      return false;
    }
  }
  
  // Suppression check (last spawn)
  const lastSpawn = getLastCrisisSpawn(state, crisis.id);
  if (lastSpawn && (turn - lastSpawn) < crisis.suppressionTurns) {
    return false;
  }
  
  return true;
}

/**
 * Get turn of last crisis spawn
 */
function getLastCrisisSpawn(state: GameState, crisisId: CrisisPattern): number | null {
  const crises = state.arcDirector?.socialCrises ?? [];
  const last = crises
    .filter(c => c.id === crisisId)
    .sort((a, b) => (b.spawnedTurn ?? 0) - (a.spawnedTurn ?? 0))
    [0];
  
  return last?.spawnedTurn ?? null;
}

// ============================================================================
// CRISIS SELECTION
// ============================================================================

/**
 * Select eligible crisis on 30-turn cadence
 * 
 * Called by ArcDirector pre-GM. Returns null if:
 * - Too soon (< 30 turns since last crisis)
 * - No eligible crises
 */
export function selectEligibleCrisis(state: GameState): SocialCrisis | null {
  const turn = state.turn ?? 0;
  
  // Check 30-turn cadence
  const lastCrisisTurn = getLastAnyCrisisSpawn(state);
  if (lastCrisisTurn && (turn - lastCrisisTurn) < 30) {
    return null;
  }
  
  // Get eligible crises
  const eligible = CRISIS_CATALOG.filter(c => isCrisisEligible(c, state));
  if (eligible.length === 0) {
    return null;
  }
  
  // Seed-stable pick
  const seed = (state.turn ?? 0) + (state.character.name?.length ?? 0);
  const index = Math.abs(seed) % eligible.length;
  
  return eligible[index];
}

/**
 * Get turn of last crisis spawn (any pattern)
 */
function getLastAnyCrisisSpawn(state: GameState): number | null {
  const crises = state.arcDirector?.socialCrises ?? [];
  if (crises.length === 0) return null;
  
  const sorted = [...crises].sort((a, b) => (b.spawnedTurn ?? 0) - (a.spawnedTurn ?? 0));
  return sorted[0]?.spawnedTurn ?? null;
}

// ============================================================================
// STAKES MATERIALIZATION
// ============================================================================

/**
 * Materialize stakes from template
 * 
 * Picks stakes template and fills in context-specific details.
 */
export function materializeStakes(
  crisis: SocialCrisis,
  state: GameState
): SocialStakes {
  // Pick template (seed-stable)
  const templates = crisis.stakesTemplates;
  const seed = (state.turn ?? 0) + crisis.id.charCodeAt(0);
  const index = Math.abs(seed) % templates.length;
  const template = templates[index];
  
  // Fill in details
  const stakes: SocialStakes = {
    gain: template.gain,
    loss: template.loss,
    owner: template.owner,
    magnitude: template.magnitude,
  };
  
  // Add deadline (soft constraint, 15 turns)
  stakes.deadline = (state.turn ?? 0) + 15;
  
  return stakes;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate crisis catalog
 * 
 * Called at build time to ensure catalog is well-formed.
 */
export function validateCrisisCatalog(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const crisis of CRISIS_CATALOG) {
    // ID check
    if (!crisis.id.startsWith('SC-')) {
      errors.push(`Invalid crisis ID: ${crisis.id}`);
    }
    
    // Name check
    if (!crisis.name) {
      errors.push(`Crisis ${crisis.id} missing name`);
    }
    
    // Mode check
    if (crisis.modes.length === 0) {
      errors.push(`Crisis ${crisis.id} has no modes`);
    }
    
    // Stakes check
    if (crisis.stakesTemplates.length === 0) {
      errors.push(`Crisis ${crisis.id} has no stakes templates`);
    }
    
    // Cadence check
    if (crisis.targetCadence < 20 || crisis.targetCadence > 60) {
      errors.push(`Crisis ${crisis.id} has invalid cadence: ${crisis.targetCadence}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
