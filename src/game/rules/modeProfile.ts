/**
 * Shared rules engine — mode profiles. Every mode runs the same maths (rules/*, checkMath, combat,
 * characterXp, recoveryRules); a profile only decides how those numbers reach the player.
 * - Tabletop: rolls, DCs, AC and HP shown openly.
 * - LitRPG: the same numbers as System windows, levels, skill ranks and receipts.
 * - Story RPG: the same numbers, mostly hidden; told as prose and standing.
 */
import type { EngineMode } from '../types';

export interface ModeProfile {
  mode: EngineMode;
  /** Every number on STATUS (tabletop), System receipts (LitRPG), or prose only (story RPG). */
  numbers: 'open' | 'system' | 'hidden';
  /** Level-up STATUS: every number (Hit Die, HP, PB, features) or the one level line. */
  levelUpDetail: boolean;
  /** Rest STATUS: the full rest line (kind, hours, clock, Hit Die) or the short HP line. */
  restDetail: boolean;
  /** How a proficient skill is named: SRD proficiency, a System rank, or growth. */
  skillWord: 'proficiency' | 'rank' | 'growth';
  /**
   * Auto Fight (one-shot resolve) is offered. Tabletop fights run round by round through the round engine,
   * which applies the table rules and death saves; Pick Your Own Adventure has no fights.
   */
  autoFight: boolean;
  /** Rations, Extended Travel saves and Exhaustion on the road (rules/travelDay); off in the story modes. */
  travelSurvival: boolean;
}

const PROFILES: Readonly<Record<EngineMode, ModeProfile>> = {
  dnd: { mode: 'dnd', numbers: 'open', levelUpDetail: true, restDetail: true, skillWord: 'proficiency', autoFight: false, travelSurvival: true },
  litrpg: { mode: 'litrpg', numbers: 'system', levelUpDetail: false, restDetail: false, skillWord: 'rank', autoFight: true, travelSurvival: false },
  rpg: { mode: 'rpg', numbers: 'hidden', levelUpDetail: false, restDetail: false, skillWord: 'growth', autoFight: true, travelSurvival: false },
  pyoa: { mode: 'pyoa', numbers: 'hidden', levelUpDetail: false, restDetail: false, skillWord: 'growth', autoFight: false, travelSurvival: false },
};

export function modeProfile(mode: EngineMode | undefined): ModeProfile {
  return PROFILES[mode ?? 'litrpg'] ?? PROFILES.litrpg;
}
