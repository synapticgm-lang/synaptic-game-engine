/**
 * q65-DOWNLOCK Package A — LitRPG / Story RPG lifeline numbers (proposals John locked 19 Oct).
 * Code reads these values only from here. Tabletop is out of scope (SRD 5.2.1 death saves).
 */
import type { EngineMode, GameState } from '../types.ts';

export interface ModeRecoveryConfig {
  /** Wake HP as a fraction of max HP (floor of 1). */
  recoveryHpFraction: number;
  /** World-clock hours advanced via advanceClock on lifeline. */
  clockHours: number;
  /** Weakened: percent penalty to damage dealt and to check totals. */
  weakenedPenaltyPct: number;
  /** Weakened lasts this many turns, or until a long rest, whichever first. */
  weakenedTurns: number;
  /** Share of unbanked gold dropped at the death spot. */
  coinDropPct: number;
  /** Turns the coin cache stays recoverable once before it is gone. */
  coinCacheTurns: number;
  /** Turns after waking with no drought/ambush spawn. */
  ambushGraceTurns: number;
}

/** Package A defaults — same numbers for LitRPG and Story RPG. */
const PACKAGE_A: ModeRecoveryConfig = {
  // 50% of max HP on wake (at least 1).
  recoveryHpFraction: 0.5,
  // Eight hours pass while you are carried back.
  clockHours: 8,
  // −10% damage dealt and −10% on check totals while Weakened.
  weakenedPenaltyPct: 10,
  // Weakened for 30 turns unless a long rest clears it sooner.
  weakenedTurns: 30,
  // 10% of unbanked coin left as a cache at the death spot.
  coinDropPct: 10,
  // Cache recoverable once within 50 turns of the drop.
  coinCacheTurns: 50,
  // No forced ambush / drought spawn for 5 turns after waking.
  ambushGraceTurns: 5,
};

const BY_MODE: Partial<Record<EngineMode, ModeRecoveryConfig>> = {
  litrpg: PACKAGE_A,
  rpg: PACKAGE_A,
};

export function recoveryConfig(mode: EngineMode | undefined): ModeRecoveryConfig | null {
  if (mode !== 'litrpg' && mode !== 'rpg') return null;
  return BY_MODE[mode] ?? PACKAGE_A;
}

/** True while Package A Weakened is active on this turn. */
export function isWeakened(state: Pick<GameState, 'weakenedUntilTurn' | 'turn'>): boolean {
  const until = state.weakenedUntilTurn;
  if (until == null) return false;
  return (state.turn ?? 0) < until;
}
