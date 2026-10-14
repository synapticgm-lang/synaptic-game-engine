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
  /** The mode's player-facing name. */
  label: string;
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
  dnd: { mode: 'dnd', label: 'Tabletop', numbers: 'open', levelUpDetail: true, restDetail: true, skillWord: 'proficiency', autoFight: false, travelSurvival: true },
  litrpg: { mode: 'litrpg', label: 'LitRPG', numbers: 'system', levelUpDetail: false, restDetail: false, skillWord: 'rank', autoFight: true, travelSurvival: false },
  rpg: { mode: 'rpg', label: 'Story RPG', numbers: 'hidden', levelUpDetail: false, restDetail: false, skillWord: 'growth', autoFight: true, travelSurvival: false },
  pyoa: { mode: 'pyoa', label: 'Pick Your Own Adventure', numbers: 'hidden', levelUpDetail: false, restDetail: false, skillWord: 'growth', autoFight: false, travelSurvival: false },
};

export function modeProfile(mode: EngineMode | undefined): ModeProfile {
  return PROFILES[mode ?? 'litrpg'] ?? PROFILES.litrpg;
}

/**
 * Whether a mode-bound setting shows. With a story loaded it shows only for that story's mode. With no save
 * loaded it shows, named with every mode it applies to.
 */
export function settingScope(loaded: EngineMode | undefined, applies: (p: ModeProfile) => boolean): { show: boolean; modes: string } {
  if (loaded) return { show: applies(modeProfile(loaded)), modes: '' };
  return { show: true, modes: Object.values(PROFILES).filter(applies).map((p) => p.label).join(' / ') };
}
