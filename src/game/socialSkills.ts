/**
 * WS-7 Wave 1: Social Skills Resolution
 * 
 * Hybrid resolution (automatic/roll), modifiers, outcome bands, and fingerprinting.
 */

import type { GameState } from './types';
import type {
  SocialSkill,
  SocialSkillCheck,
  OutcomeBand,
  ResolutionTier,
} from './socialCrisisTypes';
import { resolveResolutionTier } from './socialCrisisTypes';

// ============================================================================
// PROPOSITION FINGERPRINTING
// ============================================================================

/**
 * Generate fingerprint for proposition (skill + target + approach)
 * 
 * Used to detect exact-repeat checks without state delta.
 */
export function generatePropositionFingerprint(
  skill: SocialSkill,
  targetNpc: string,
  approach: string
): string {
  const normalized = approach.toLowerCase().trim().replace(/\s+/g, ' ');
  return `${skill}:${targetNpc.toLowerCase()}:${normalized}`;
}

/**
 * Check if proposition has been tried before without state change
 * 
 * Block: Exact repeat of skill + target + approach that failed to change state
 */
export function hasPropositionBeenTried(
  fingerprint: string,
  state: GameState
): boolean {
  const tried = state.arcDirector?.socialCrises?.flatMap(c => c.propositionFingerprints ?? []) ?? [];
  return tried.includes(fingerprint);
}

/**
 * Record proposition fingerprint for future blocking
 */
export function recordPropositionFingerprint(
  fingerprint: string,
  state: GameState
): GameState {
  const crisis = state.arcDirector?.socialCrises?.[0];
  if (!crisis) return state;
  
  const fingerprints = crisis.propositionFingerprints ?? [];
  if (fingerprints.includes(fingerprint)) return state;
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      socialCrises: [
        {
          ...crisis,
          propositionFingerprints: [...fingerprints, fingerprint],
        },
        ...(state.arcDirector?.socialCrises?.slice(1) ?? []),
      ],
    },
  };
}

// ============================================================================
// MODIFIER CALCULATION
// ============================================================================

export interface SocialModifiers {
  skill: number;
  relationship: number;
  evidence: number;
  leverage: number;
  faction: number;
}

/**
 * Calculate social skill modifiers
 * 
 * Five components:
 * - skill: Base skill level (0-5)
 * - relationship: Trust, respect, fear (-3 to +3)
 * - evidence: Supporting facts (0-3)
 * - leverage: Active leverage asset (-6 to +6)
 * - faction: Faction standing modifier (-2 to +2)
 */
export function calculateSocialModifiers(
  skill: SocialSkill,
  targetNpc: string,
  state: GameState,
  opts: {
    evidenceIds?: string[];
    leverageAssetId?: string;
  }
): SocialModifiers {
  const modifiers: SocialModifiers = {
    skill: 0,
    relationship: 0,
    evidence: 0,
    leverage: 0,
    faction: 0,
  };
  
  // Skill level (placeholder - real skill system TBD)
  modifiers.skill = 2; // Default modest skill
  
  // Relationship (from WS-7 relationship system)
  const relationships = state.arcDirector?.npcRelationships ?? [];
  const rel = relationships.find(r => r.npcName.toLowerCase() === targetNpc.toLowerCase());
  if (rel) {
    // Trust: -60 to +60 → -3 to +3
    modifiers.relationship = Math.floor((rel.trust ?? 0) / 20);
    modifiers.relationship = Math.max(-3, Math.min(3, modifiers.relationship));
  }
  
  // Evidence (per provided evidence ID)
  if (opts.evidenceIds && opts.evidenceIds.length > 0) {
    modifiers.evidence = Math.min(3, opts.evidenceIds.length);
  }
  
  // Leverage (from active leverage asset)
  if (opts.leverageAssetId) {
    const assets = state.arcDirector?.leverageAssets ?? [];
    const asset = assets.find(a => a.id === opts.leverageAssetId);
    if (asset && !asset.exhausted) {
      // Leverage modifier is pre-calculated in leverageMechanics.ts
      // Here we just apply it
      modifiers.leverage = asset.modifier ?? 0;
    }
  }
  
  // Faction standing (if NPC belongs to faction)
  const factions = state.worldLedger?.factionStandings ?? [];
  for (const faction of factions) {
    // Check if NPC is faction member (simple heuristic for Wave 1)
    const factionMembers = faction.members ?? [];
    if (factionMembers.includes(targetNpc.toLowerCase())) {
      // Standing: -50 to +50 → -2 to +2
      modifiers.faction = Math.floor((faction.standing ?? 0) / 25);
      modifiers.faction = Math.max(-2, Math.min(2, modifiers.faction));
      break;
    }
  }
  
  return modifiers;
}

/**
 * Calculate total modifier
 */
export function calculateTotalModifier(modifiers: SocialModifiers): number {
  return modifiers.skill +
         modifiers.relationship +
         modifiers.evidence +
         modifiers.leverage +
         modifiers.faction;
}

// ============================================================================
// HYBRID RESOLUTION
// ============================================================================

/**
 * Resolve social skill check (hybrid automatic/roll)
 * 
 * Automatic tier (no dice):
 * - routine: total modifier ≥ +8 → automatic success
 * - impossible: total modifier ≤ -8 → automatic failure
 * 
 * Roll tier (d20):
 * - plausible: modifier in -7 to +7 → roll d20
 */
export function resolveSocialSkillCheck(
  skill: SocialSkill,
  targetNpc: string,
  state: GameState,
  opts: {
    evidenceIds?: string[];
    leverageAssetId?: string;
    dc?: number;
  }
): SocialSkillCheck {
  // Calculate modifiers
  const modifiers = calculateSocialModifiers(skill, targetNpc, state, opts);
  const totalModifier = calculateTotalModifier(modifiers);
  
  // Determine resolution tier
  const { tier, outcome: autoOutcome } = resolveResolutionTier(totalModifier);
  
  let roll: number | undefined;
  let dc: number | undefined;
  let outcome: OutcomeBand;
  let margin: number;
  
  if (tier === 'automatic') {
    // Automatic resolution (no dice)
    outcome = autoOutcome!;
    margin = totalModifier;
  } else {
    // Roll resolution (d20)
    dc = opts.dc ?? 15; // Default DC
    roll = rollD20(state);
    const total = roll + totalModifier;
    margin = total - dc;
    
    // Outcome bands
    if (roll === 20) {
      outcome = 'critical_success';
    } else if (roll === 1) {
      outcome = 'critical_failure';
    } else if (margin >= 5) {
      outcome = 'success';
    } else if (margin >= 0) {
      outcome = 'partial';
    } else if (margin >= -5) {
      outcome = 'failure';
    } else {
      outcome = 'critical_failure';
    }
  }
  
  return {
    skill,
    dc,
    roll,
    modifiers,
    totalModifier,
    outcome,
    margin,
  };
}

/**
 * Seed-stable d20 roll
 */
function rollD20(state: GameState): number {
  const seed = (state.turn ?? 0) + (state.character.name?.length ?? 0);
  const pseudo = Math.abs(Math.sin(seed) * 10000);
  return Math.floor(pseudo % 20) + 1;
}

// ============================================================================
// OUTCOME BANDS
// ============================================================================

/**
 * Get outcome description for display
 */
export function getOutcomeDescription(outcome: OutcomeBand): string {
  switch (outcome) {
    case 'critical_success':
      return 'Critical Success - Exceptional outcome, bonus rewards';
    case 'success':
      return 'Success - Goal achieved as intended';
    case 'partial':
      return 'Partial Success - Goal achieved with cost or complication';
    case 'failure':
      return 'Failure - Goal not achieved, can retry with different approach';
    case 'critical_failure':
      return 'Critical Failure - Goal failed badly, consequences worsen';
  }
}

/**
 * Get XP multiplier for outcome
 */
export function getOutcomeXpMultiplier(outcome: OutcomeBand): number {
  switch (outcome) {
    case 'critical_success': return 1.5;
    case 'success': return 1.0;
    case 'partial': return 0.7;
    case 'failure': return 0.3;
    case 'critical_failure': return 0.1;
  }
}
