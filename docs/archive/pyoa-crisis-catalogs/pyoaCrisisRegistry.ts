/**
 * WS-5 Wave A: PYOA Crisis Registry
 * 
 * Crisis deck catalog with fork definitions.
 * 5-8 crises per bible with exclusive facts and delayed payoffs.
 */

import type { GameState } from './types';
import type { DelayedConsequence } from './types/crossPackageContracts';

// ============================================================================
// CRISIS SCHEMA
// ============================================================================

export interface PYOACrisis {
  /** Crisis ID */
  id: string;
  
  /** Crisis name */
  name: string;
  
  /** Bible ID */
  bibleId: string;
  
  /** Telegraph turn window */
  telegraphWindow: [number, number]; // [earliest, latest]
  
  /** Crisis forks */
  forks: PYOACrisisFork[];
  
  /** Prerequisites */
  prerequisites?: {
    facts?: string[];
    turn?: { min?: number; max?: number };
    location?: string;
  };
  
  /** Convergence contract (if applicable) */
  convergenceContract?: {
    convergesToCrisis: string;
    convergenceFacts: string[];
  };
}

export interface PYOACrisisFork {
  /** Fork ID */
  id: string;
  
  /** Fork label */
  label: string;
  
  /** Exclusive facts written */
  exclusiveFacts: string[];
  
  /** Delayed consequences */
  delayedConsequences?: Array<{
    type: DelayedConsequence['type'];
    delayTurns: [number, number]; // [min, max]
    narrativeBeat: string;
  }>;
  
  /** Ending path opened/closed */
  endingEffects?: Array<{
    endingId: string;
    effect: 'open' | 'close';
  }>;
}

// ============================================================================
// CRISIS CATALOG
// ============================================================================

/**
 * Standard crisis catalog for Thornferry Road
 */
export const THORNFERRY_ROAD_CRISES: PYOACrisis[] = [
  {
    id: 'millstone-charter',
    name: 'The Millstone Charter',
    bibleId: 'thornferry-road',
    telegraphWindow: [20, 40],
    forks: [
      {
        id: 'sign-alliance',
        label: 'Sign the charter (ally with lord)',
        exclusiveFacts: ['lordAlly'],
        delayedConsequences: [
          {
            type: 'reward',
            delayTurns: [80, 100],
            narrativeBeat: 'Lord rewards loyalty with resources and access',
          },
        ],
        endingEffects: [
          { endingId: 'lords-champion', effect: 'open' },
          { endingId: 'rebel-hero', effect: 'close' },
        ],
      },
      {
        id: 'reject-charter',
        label: 'Reject the charter (ally with rebels)',
        exclusiveFacts: ['rebelAlly'],
        delayedConsequences: [
          {
            type: 'penalty',
            delayTurns: [80, 100],
            narrativeBeat: 'Lord sends enforcers to punish rejection',
          },
        ],
        endingEffects: [
          { endingId: 'rebel-hero', effect: 'open' },
          { endingId: 'lords-champion', effect: 'close' },
        ],
      },
    ],
  },
  
  {
    id: 'trust-miller',
    name: 'Trust the Miller',
    bibleId: 'thornferry-road',
    telegraphWindow: [40, 60],
    forks: [
      {
        id: 'trust-offer',
        label: 'Trust the miller',
        exclusiveFacts: ['millerTrusted'],
        delayedConsequences: [
          {
            type: 'reveal',
            delayTurns: [120, 150],
            narrativeBeat: 'Miller reveals nobles\' plan - or betrays you',
          },
        ],
      },
      {
        id: 'doubt-miller',
        label: 'Doubt the miller',
        exclusiveFacts: ['millerDoubt'],
        delayedConsequences: [
          {
            type: 'reveal',
            delayTurns: [120, 150],
            narrativeBeat: 'You discover nobles\' plan without miller help',
          },
        ],
      },
    ],
    convergenceContract: {
      convergesToCrisis: 'confront-nobles',
      convergenceFacts: ['noblesPlanKnown'],
    },
  },
  
  {
    id: 'bandits-or-villagers',
    name: 'Bandits or Villagers',
    bibleId: 'thornferry-road',
    telegraphWindow: [50, 70],
    forks: [
      {
        id: 'side-bandits',
        label: 'Side with bandits',
        exclusiveFacts: ['banditAlly'],
        delayedConsequences: [
          {
            type: 'relationship_shift',
            delayTurns: [60, 80],
            narrativeBeat: 'Bandits support you in final crisis',
          },
        ],
        endingEffects: [
          { endingId: 'chaotic-ending', effect: 'open' },
        ],
      },
      {
        id: 'side-villagers',
        label: 'Side with villagers',
        exclusiveFacts: ['villagerAlly'],
        delayedConsequences: [
          {
            type: 'relationship_shift',
            delayTurns: [60, 80],
            narrativeBeat: 'Villagers support you in final crisis',
          },
        ],
        endingEffects: [
          { endingId: 'order-ending', effect: 'open' },
        ],
      },
    ],
  },
  
  {
    id: 'reveal-secret',
    name: 'Reveal the Secret',
    bibleId: 'thornferry-road',
    telegraphWindow: [70, 90],
    forks: [
      {
        id: 'tell-truth',
        label: 'Tell the truth',
        exclusiveFacts: ['secretRevealed'],
        delayedConsequences: [
          {
            type: 'relationship_shift',
            delayTurns: [100, 120],
            narrativeBeat: 'NPC becomes ally after truth revealed',
          },
        ],
      },
      {
        id: 'conceal-secret',
        label: 'Conceal the secret',
        exclusiveFacts: ['secretHidden'],
        delayedConsequences: [
          {
            type: 'betrayal',
            delayTurns: [100, 120],
            narrativeBeat: 'Secret exposed by enemy, NPC becomes enemy',
          },
        ],
      },
    ],
  },
  
  {
    id: 'alliance-proposal',
    name: 'Alliance Proposal',
    bibleId: 'thornferry-road',
    telegraphWindow: [80, 100],
    forks: [
      {
        id: 'join-faction',
        label: 'Join the faction',
        exclusiveFacts: ['factionMember'],
        delayedConsequences: [
          {
            type: 'reward',
            delayTurns: [80, 100],
            narrativeBeat: 'Faction provides resources for final confrontation',
          },
        ],
        endingEffects: [
          { endingId: 'faction-ending', effect: 'open' },
          { endingId: 'solo-ending', effect: 'close' },
        ],
      },
      {
        id: 'stay-solo',
        label: 'Stay solo',
        exclusiveFacts: ['soloPath'],
        endingEffects: [
          { endingId: 'solo-ending', effect: 'open' },
          { endingId: 'faction-ending', effect: 'close' },
        ],
      },
    ],
  },
];

// ============================================================================
// CRISIS REGISTRY
// ============================================================================

export class PYOACrisisRegistry {
  private crises: Map<string, PYOACrisis>;
  private byBible: Map<string, PYOACrisis[]>;
  
  constructor() {
    this.crises = new Map();
    this.byBible = new Map();
    
    // Register Thornferry Road crises
    for (const crisis of THORNFERRY_ROAD_CRISES) {
      this.registerCrisis(crisis);
    }
  }
  
  registerCrisis(crisis: PYOACrisis): void {
    this.crises.set(crisis.id, crisis);
    
    const bibleCrises = this.byBible.get(crisis.bibleId) ?? [];
    this.byBible.set(crisis.bibleId, [...bibleCrises, crisis]);
  }
  
  getCrisis(crisisId: string): PYOACrisis | null {
    return this.crises.get(crisisId) ?? null;
  }
  
  getCrisesForBible(bibleId: string): PYOACrisis[] {
    return this.byBible.get(bibleId) ?? [];
  }
}

// Global registry instance
export const PYOA_CRISIS_REGISTRY = new PYOACrisisRegistry();

// ============================================================================
// CRISIS ELIGIBILITY
// ============================================================================

/**
 * Check if crisis is eligible to spawn
 */
export function isCrisisEligible(
  crisis: PYOACrisis,
  state: GameState
): {
  eligible: boolean;
  reason?: string;
} {
  // Check if already spawned
  const ledger = state.pyoaBranchLedger;
  const paths = ledger?.committedPaths ?? [];
  
  if (paths.some(p => p.includes(crisis.id))) {
    return { eligible: false, reason: 'Already spawned' };
  }
  
  // Check if any fork is locked
  if (ledger?.branchLocked) {
    const lockedFacts = crisis.forks.flatMap(f => f.exclusiveFacts);
    // If any exclusive fact is already set, crisis is locked
    // (Would check against existing facts here)
  }
  
  // Check turn window
  const turn = state.turn;
  if (turn < crisis.telegraphWindow[0] || turn > crisis.telegraphWindow[1]) {
    return {
      eligible: false,
      reason: `Outside turn window (${crisis.telegraphWindow[0]}-${crisis.telegraphWindow[1]})`,
    };
  }
  
  // Check prerequisites
  if (crisis.prerequisites) {
    // Would check facts, turn, location here
    // For Wave A, simplified check
  }
  
  return { eligible: true };
}

/**
 * Get eligible crises for bible
 */
export function getEligibleCrises(
  bibleId: string,
  state: GameState
): PYOACrisis[] {
  const crises = PYOA_CRISIS_REGISTRY.getCrisesForBible(bibleId);
  
  return crises.filter(c => isCrisisEligible(c, state).eligible);
}

/**
 * Pick crisis to spawn
 */
export function pickCrisis(
  bibleId: string,
  state: GameState,
  seed: number
): PYOACrisis | null {
  const eligible = getEligibleCrises(bibleId, state);
  if (eligible.length === 0) return null;
  
  // Seed-stable pick
  const index = Math.abs(seed) % eligible.length;
  return eligible[index];
}
