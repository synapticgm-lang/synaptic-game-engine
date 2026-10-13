/**
 * House rules the shared engine obeys, built from Settings once per turn and read from GameState.houseRules.
 * Cleave and flanking are common optional table rules, not SRD rules; they are off unless the player turns them on.
 */
import type { GameState, HouseRules, Settings } from '../types';

export const DEFAULT_HOUSE_RULES: HouseRules = {
  secretDeathSaves: false,
  cleave: false,
  flanking: false,
  strictEncumbrance: false,
  combatFrequency: 50,
  socialRoleplay: 50,
  worldBuilding: 50,
};

const slider = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50);

export function houseRulesFromSettings(s: Partial<Settings> | null | undefined): HouseRules {
  return {
    secretDeathSaves: s?.secretDeathSaves === true,
    cleave: s?.cleaveMechanics === true,
    flanking: s?.flankingAdvantage === true,
    strictEncumbrance: s?.strictEncumbrance === true,
    combatFrequency: slider(s?.combatFrequency),
    socialRoleplay: slider(s?.socialRoleplay),
    worldBuilding: slider(s?.worldBuilding),
  };
}

export function houseRulesOf(state: Pick<GameState, 'houseRules'> | null | undefined): HouseRules {
  return state?.houseRules ?? DEFAULT_HOUSE_RULES;
}

/** Stamp this turn's Settings onto the state the engine reads. Tabletop only; other modes keep the defaults. */
export function withHouseRules<T extends GameState>(state: T, settings: Partial<Settings> | null | undefined): T {
  if (state.engineMode !== 'dnd') return state;
  return { ...state, houseRules: houseRulesFromSettings(settings) };
}

/**
 * Turns between drought encounters at this Combat Frequency: 50 keeps the base, 100 halves it, 0 doubles it.
 */
export function scaledCadence(base: number, combatFrequency: number): number {
  const factor = Math.max(0.5, Math.min(2, 50 / Math.max(1, combatFrequency)));
  return Math.max(1, Math.round(base * factor));
}

/** Copies of a pool entry at this slider value: 0–4, with 50 giving 2 (every kind weighs the same). */
export function pillarCopies(value: number): number {
  return Math.max(0, Math.min(4, Math.round(value / 25)));
}
