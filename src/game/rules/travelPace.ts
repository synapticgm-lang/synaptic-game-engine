/**
 * Shared rules engine — travel pace.
 * The Travel Pace table and its effects are from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the
 * Coast LLC, available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode):
 * Fast 4 miles an hour (Disadvantage on Perception, Survival and Stealth), Normal 3 (Disadvantage on Stealth),
 * Slow 2 (Advantage on Perception and Survival).
 * The pace is a table rule; only a tabletop save carries one (other modes keep the house-rule default, Normal).
 * Tabletop also keeps the pace no faster than the ground's SRD maximum pace (Travel Terrain table, Good Roads).
 */
import type { AdvState } from '../checkRules';
import type { GameState, HouseRules, JourneyTerrain } from '../types';
import { houseRulesOf } from './houseRules';
import { paceOnGround } from './travelDay';

export type TravelPace = HouseRules['travelPace'];

export const TRAVEL_PACE: Record<TravelPace, { mph: number; perDay: number }> = {
  fast: { mph: 4, perDay: 30 },
  normal: { mph: 3, perDay: 24 },
  slow: { mph: 2, perDay: 18 },
};

type PaceState = Pick<GameState, 'houseRules' | 'engineMode'>;

/** The save's pace; on known ground, no faster than that ground allows. */
export function travelPaceOf(state: PaceState, terrain?: JourneyTerrain | null): TravelPace {
  if (state.engineMode !== 'dnd') return 'normal';
  const pace = houseRulesOf(state).travelPace;
  return terrain ? paceOnGround(pace, terrain) : pace;
}

/** Hours for ground the map times at Normal pace (3 miles an hour), at this save's pace. */
export function hoursAtPace(state: PaceState, normalHours: number, terrain?: JourneyTerrain | null): number {
  const pace = travelPaceOf(state, terrain);
  if (pace === 'normal' || normalHours <= 0) return normalHours;
  return Math.round(((normalHours * TRAVEL_PACE.normal.mph) / TRAVEL_PACE[pace].mph) * 4) / 4;
}

/** The receipt tag for a pace other than Normal (" at a fast pace"). */
export function paceTag(state: PaceState, terrain?: JourneyTerrain | null): string {
  const pace = travelPaceOf(state, terrain);
  return pace === 'normal' ? '' : ` at a ${pace} pace`;
}

const PACE_CHECKS: Record<TravelPace, Partial<Record<'perception' | 'survival' | 'stealth', AdvState>>> = {
  fast: { perception: 'disadvantage', survival: 'disadvantage', stealth: 'disadvantage' },
  normal: { stealth: 'disadvantage' },
  slow: { perception: 'advantage', survival: 'advantage' },
};

/** Advantage or Disadvantage a check takes from the pace while a journey is underway (tabletop only). */
export function paceCheckAdv(state: PaceState & Pick<GameState, 'journey'>, skill: string | undefined): AdvState {
  const j = state.journey;
  if (state.engineMode !== 'dnd' || !j || j.legsDone >= j.legsTotal || !skill) return 'normal';
  return PACE_CHECKS[travelPaceOf(state, j.terrain)][skill as 'perception'] ?? 'normal';
}
