import type { EngineMode } from '@/game/types';

/** Authored encounter row. ArcDirector + existing FSM consume this — not a new combat machine. */
export type EncounterTier = 'trash' | 'elite' | 'boss' | 'crisis';

export interface EncounterSeed {
  id: string;
  mode: EngineMode;
  tier: EncounterTier;
  title: string;
  /** Ledger foe / crisis noun. Director never invents a token outside this list. */
  foeName: string;
  premise: string;
  xpReward: number;
  goldReward: number;
  cooldown: number;
  /** Optional outdoor-hub id (Summoned Pact Phase 3 ties). */
  hubId?: string;
}
