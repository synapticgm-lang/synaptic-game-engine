/**
 * Pressure clock — director spine snippet for stagnation turns 5+.
 */

import type { GameState } from './types';

export interface PressureClockState {
  /** Turns since last arc beat commit. */
  turnsSinceBeat?: number;
  /** Absolute deadline turn (soft). */
  deadlineTurn?: number;
  label?: string;
}

export function initPressureClock(): PressureClockState {
  return { turnsSinceBeat: 0 };
}

export function formatPressureClockSnippet(state: GameState): string | null {
  const clock = state.arcDirector?.pressureClock;
  const stagnation = state.progressGovernor?.turnsSinceProgress ?? 0;
  const turnsSinceBeat = clock?.turnsSinceBeat ?? stagnation;

  if (turnsSinceBeat < 5 && stagnation < 5) return null;

  const deadline = clock?.deadlineTurn ?? state.turn + Math.max(1, 8 - turnsSinceBeat);
  const label = clock?.label ?? 'arc deadline';

  return `PRESSURE CLOCK (${turnsSinceBeat} turns since last arc commit): ${label} — deadline ~T${deadline}. Deliver a receipt this beat (quest stage, encounter round, leverage delta, or crisis fork). Atmosphere alone fails.`;
}

export function tickPressureClock(
  prev: PressureClockState | undefined,
  beatCommitted: boolean,
  turn: number
): PressureClockState {
  const base = prev ?? initPressureClock();
  if (beatCommitted) {
    return {
      turnsSinceBeat: 0,
      deadlineTurn: turn + 8,
      label: base.label ?? 'next arc anchor',
    };
  }
  return {
    ...base,
    turnsSinceBeat: (base.turnsSinceBeat ?? 0) + 1,
    deadlineTurn: base.deadlineTurn ?? turn + 8,
  };
}
