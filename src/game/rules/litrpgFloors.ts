/**
 * Shared rules engine — the LitRPG floor ladder on top of the dungeon card. Each dungeon whose boss (the card's
 * mini-boss) falls is one numbered floor; the ladder keeps the boss of every floor, and the stairs to the next
 * floor unlock when that boss is down. Danger still comes from the dungeon card's own tier. Other modes: nothing.
 */
import type { GameState, LitrpgFloorLadder } from '../types';

export function floorLadder(state: Pick<GameState, 'litrpgFloors'>): LitrpgFloorLadder {
  return state.litrpgFloors ?? { cleared: 0, bosses: [] };
}

/** The floor the player is on or heading for (1 before any boss falls). */
export function currentFloor(state: Pick<GameState, 'litrpgFloors'>): number {
  return floorLadder(state).cleared + 1;
}

/** The boss of `dungeon` fell: that dungeon becomes the next floor (once per dungeon) and the next stairs unlock. */
export function climbFloor(state: GameState, dungeon: string, boss: string): { state: GameState; receipts: string[] } {
  if (state.engineMode !== 'litrpg') return { state, receipts: [] };
  const ladder = floorLadder(state);
  if (ladder.bosses.some((b) => b.dungeon === dungeon)) return { state, receipts: [] };
  const floor = ladder.cleared + 1;
  const next: LitrpgFloorLadder = {
    cleared: floor,
    bosses: [...ladder.bosses, { floor, dungeon, boss, turn: state.turn ?? 0 }],
  };
  return {
    state: { ...state, litrpgFloors: next },
    receipts: [`Floor: Floor ${floor} cleared — ${boss} defeated. Stairs to Floor ${floor + 1} unlocked.`],
  };
}

/** The System window's floor line, once a floor is cleared. */
export function floorWindowLine(state: GameState): string | null {
  const ladder = floorLadder(state);
  if (state.engineMode !== 'litrpg' || !ladder.cleared) return null;
  const last = ladder.bosses[ladder.bosses.length - 1]!;
  return `Floor: ${ladder.cleared} cleared (last boss: ${last.boss}) — Floor ${ladder.cleared + 1} open`;
}
