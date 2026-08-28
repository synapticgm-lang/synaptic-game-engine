/**
 * WS-7 Wave 1: Social Crisis Types
 * 
 * Domain types for social crises, stakes, resolutions, and leverage mechanics.
 * Based on Manus WS-7 Social Gameplay specification.
 */

import type { GameState } from './types';

// ============================================================================
// SOCIAL CRISIS TYPES
// ============================================================================

export type CrisisPattern =
  | 'SC-01' // Social Standoff: Two opposed actors, player mediates
  | 'SC-02' // Public Challenge: Authority figure challenges player
  | 'SC-03' // Faction Dispute: Two factions demand allegiance
  | 'SC-04' // Betrayal Accusation: NPC accuses player of betrayal
  | 'SC-05' // Resource Competition: NPC and player want same resource
  | 'SC-06' // Oath Conflict: Two incompatible promises
  | 'SC-07' // Social Debt: NPC demands repayment of favor
  | 'SC-08' // Inheritance Dispute: Competing heirs
  | 'SC-09' // Territory Claim: Overlapping domain claims
  | 'SC-10' // Honor Duel: Challenge to reputation
  | 'SC-11' // Trade Negotiation: High-stakes deal
  | 'SC-12' // Alliance Pressure: Faction demands commitment
  | 'SC-13' // Moral Dilemma: Two opposed moral stances
  | 'SC-14' // Authority Challenge: Subordinate questions orders
  | 'SC-15'; // Secret Leverage: NPC threatens to reveal secret

/**
 * Social stakes committed before GM prose
 */
export interface SocialStakes {
  /** What player gains on success */
  gain: string;
  
  /** What player loses on failure */
  loss: string;
  
  /** Who owns these stakes (player, NPC, faction, both) */
  owner: 'player' | 'npc' | 'faction' | 'both';
  
  /** Turn deadline (soft constraint, not hard gate) */
  deadline?: number;
  
  /** Stakes magnitude (for XP scaling) */
  magnitude: 'minor' | 'moderate' | 'major' | 'critical';
}

/**
 * Social crisis definition (from catalog)
 */
export interface SocialCrisis {
  /** Crisis pattern ID */
  id: CrisisPattern;
  
  /** Crisis name */
  name: string;
  
  /** Mode eligibility */
  modes: Array<'litrpg' | 'dnd' | 'rpg' | 'pyoa'>;
  
  /** Eligibility conditions */
  eligibility: {
    /** Minimum turn */
    minTurn: number;
    
    /** Requires two named NPCs present */
    requiresTwoActors: boolean;
    
    /** Requires faction standing */
    requiresFaction: boolean;
    
    /** Requires active quest */
    requiresQuest: boolean;
    
    /** Incompatible with active combat */
    incompatibleWithCombat: boolean;
  };
  
  /** Stakes templates */
  stakesTemplates: Array<{
    gain: string;
    loss: string;
    owner: SocialStakes['owner'];
    magnitude: SocialStakes['magnitude'];
  }>;
  
  /** Suppression window (turns before can spawn again) */
  suppressionTurns: number;
  
  /** Target spawn cadence (turns between spawns) */
  targetCadence: number;
}

// ============================================================================
// LEVERAGE TYPES
// ============================================================================

export type LeverageType =
  | 'physical_threat'     // -18 trust, requires combat advantage
  | 'economic_pressure'   // -12 trust, requires wealth/resources
  | 'social_exposure'     // -15 trust, requires reputation/witnesses
  | 'legal_authority'     // -10 trust, requires official status
  | 'moral_appeal'        // +8 trust, requires shared values
  | 'favor_reminder';     // +6 trust, requires past favor

/**
 * Leverage asset (tracked per NPC target)
 */
export interface LeverageAsset {
  /** Asset ID (for tracking exhaustion) */
  id: string;
  
  /** Leverage type */
  type: LeverageType;
  
  /** Target NPC */
  targetNpc: string;
  
  /** Evidence strength (0-1, affects modifier) */
  evidenceStrength: number;
  
  /** Source credibility (0-1, affects modifier) */
  credibility: number;
  
  /** Turn first used */
  firstUsedTurn: number;
  
  /** Exhausted (one-use per NPC target) */
  exhausted: boolean;
}

/**
 * Leverage pressure profile (per NPC)
 */
export interface LeveragePressureProfile {
  /** NPC name */
  npc: string;
  
  /** Fears (what NPC wants to avoid) */
  fears: string[];
  
  /** Wants (what NPC desires) */
  wants: string[];
  
  /** Duties (what NPC feels obligated to do) */
  duties: string[];
  
  /** Taboos (what NPC will never do) */
  taboos: string[];
}

/**
 * Leverage resolution (pre-GM commit)
 */
export interface LeverageResolution {
  /** Leverage asset used */
  assetId: string;
  
  /** Target NPC */
  targetNpc: string;
  
  /** Modifier (-6 to +6) */
  modifier: number;
  
  /** Trust delta */
  trustDelta: number;
  
  /** Outcome */
  outcome: 'success' | 'partial' | 'failure';
  
  /** Cost paid */
  cost?: string;
}

// ============================================================================
// SOCIAL SKILLS TYPES
// ============================================================================

export type SocialSkill = 'persuasion' | 'intimidation' | 'deception' | 'insight';

export type OutcomeBand = 'critical_success' | 'success' | 'partial' | 'failure' | 'critical_failure';

/**
 * Social skill check resolution
 */
export interface SocialSkillCheck {
  /** Skill used */
  skill: SocialSkill;
  
  /** DC (if using roll tier) */
  dc?: number;
  
  /** Roll result (if using roll tier) */
  roll?: number;
  
  /** Modifiers applied */
  modifiers: {
    skill: number;
    relationship: number;
    evidence: number;
    leverage: number;
    faction: number;
  };
  
  /** Total modifier */
  totalModifier: number;
  
  /** Outcome band */
  outcome: OutcomeBand;
  
  /** Margin (roll - DC, or auto-tier delta) */
  margin: number;
}

// ============================================================================
// CRISIS RESOLUTION TYPES
// ============================================================================

export type ResolutionTier = 'automatic' | 'roll';

/**
 * Determines if crisis uses automatic or roll resolution
 * 
 * Automatic (no dice):
 * - routine: modifiers clearly favor success (≥ +8)
 * - impossible: modifiers clearly favor failure (≤ -8)
 * 
 * Roll (d20):
 * - plausible: modifiers in uncertain range (-7 to +7)
 */
export function resolveResolutionTier(totalModifier: number): {
  tier: ResolutionTier;
  outcome?: OutcomeBand;
} {
  if (totalModifier >= 8) {
    return { tier: 'automatic', outcome: 'success' };
  } else if (totalModifier <= -8) {
    return { tier: 'automatic', outcome: 'failure' };
  } else {
    return { tier: 'roll' };
  }
}

/**
 * Social crisis resolution (pre-GM commit)
 */
export interface SocialResolution {
  /** Crisis pattern */
  crisisId: CrisisPattern;
  
  /** Committed stakes */
  stakes: SocialStakes;
  
  /** Resolution tier */
  tier: ResolutionTier;
  
  /** Skill check (if roll tier) */
  skillCheck?: SocialSkillCheck;
  
  /** Leverage used */
  leverage?: LeverageResolution;
  
  /** Outcome */
  outcome: OutcomeBand;
  
  /** State mutations (applied atomically before GM) */
  consequences: Array<{
    path: string;
    value: unknown;
  }>;
  
  /** Turn committed */
  committedTurn: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get trust delta for leverage type
 */
export function getLeverageTrustDelta(type: LeverageType): number {
  switch (type) {
    case 'physical_threat': return -18;
    case 'economic_pressure': return -12;
    case 'social_exposure': return -15;
    case 'legal_authority': return -10;
    case 'moral_appeal': return +8;
    case 'favor_reminder': return +6;
  }
}

/**
 * Calculate leverage modifier (-6 to +6)
 */
export function calculateLeverageModifier(
  asset: LeverageAsset,
  profile: LeveragePressureProfile
): number {
  let modifier = 0;
  
  // Base modifier from evidence and credibility
  modifier += Math.floor(asset.evidenceStrength * 3); // 0-3
  modifier += Math.floor(asset.credibility * 3); // 0-3
  
  // Pressure profile fit
  const typeKeyword = asset.type.replace(/_/g, ' ');
  
  // Check fears (wants to avoid)
  if (profile.fears.some(f => f.toLowerCase().includes(typeKeyword))) {
    modifier += 2;
  }
  
  // Check wants (desires)
  if (profile.wants.some(w => w.toLowerCase().includes(typeKeyword))) {
    modifier += 1;
  }
  
  // Check taboos (will never do)
  if (profile.taboos.some(t => t.toLowerCase().includes(typeKeyword))) {
    modifier -= 4;
  }
  
  // Clamp to -6 to +6
  return Math.max(-6, Math.min(6, modifier));
}

/**
 * Generate proposition fingerprint for duplicate detection
 */
export function generatePropositionFingerprint(
  skill: SocialSkill,
  targetNpc: string,
  approach: string
): string {
  const normalized = approach.toLowerCase().trim();
  return `${skill}:${targetNpc}:${normalized}`;
}
