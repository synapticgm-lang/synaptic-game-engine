import type { GameState } from './types';
import type { PlayerCheckResult } from './checkMath';
import { currentDungeonNode } from './dungeonSeed';
import { isExplorableDungeon } from './placeAuthority';

export interface LedgerTrapRound {
  trapId: string;
  trapKind?: string;
  damage: number;
  disarmed: boolean;
  sprung: boolean;
  playerHpAfter: number;
  summary: string;
}

function markTrapOnNode(
  state: GameState,
  trapId: string,
  patch: { disarmed?: boolean; revealed?: boolean }
): GameState {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return state;
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return state;
  const nodes = dungeon.nodes.map((n) => {
    if (n.id !== node.id || !n.hidden) return n;
    return {
      ...n,
      hidden: {
        ...n.hidden,
        traps: n.hidden.traps.map((t) =>
          t.id === trapId ? { ...t, ...patch, disarmed: patch.disarmed ?? t.disarmed, revealed: patch.revealed ?? true } : t
        ),
      },
    };
  });
  return { ...state, activeDungeon: { ...dungeon, nodes } };
}

/** Deterministic trap resolution before the GM call. */
export function resolveLedgerTrap(
  state: GameState,
  check: PlayerCheckResult,
  trapId?: string
): { state: GameState; round: LedgerTrapRound } | null {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return null;
  const node = currentDungeonNode(dungeon);
  const trap = trapId
    ? node?.hidden?.traps.find((t) => t.id === trapId && !t.disarmed)
    : node?.hidden?.traps.find((t) => !t.disarmed);
  if (!trap || !node) return null;

  const baseDmg = Math.max(0, trap.damage ?? 0);
  let damage = 0;
  let disarmed = trap.disarmed;
  let sprung = false;

  if (check.isSuccess && !check.isCriticalFailure) {
    damage = 0;
    disarmed = true;
  } else if (check.isCriticalFailure) {
    damage = baseDmg;
    disarmed = true;
    sprung = true;
  } else {
    damage = baseDmg > 0 ? Math.max(1, Math.floor(baseDmg / 2)) : 0;
    disarmed = true;
    sprung = true;
  }

  const playerHpAfter = Math.max(0, (state.character.hp ?? 0) - damage);
  let next = {
    ...state,
    character: { ...state.character, hp: playerHpAfter },
  };
  next = markTrapOnNode(next, trap.id, { disarmed, revealed: true });

  const round: LedgerTrapRound = {
    trapId: trap.id,
    trapKind: (trap as { kind?: string }).kind,
    damage,
    disarmed,
    sprung,
    playerHpAfter,
    summary:
      damage === 0
        ? `Trap ${trap.id} disarmed cleanly.`
        : `Trap ${trap.id} sprung for ${damage} HP${disarmed ? ' (spent)' : ''}.`,
  };
  return { state: next, round };
}

export function formatTrapReceipt(round: LedgerTrapRound): string {
  return `Trap: ${round.summary} Your HP ${round.playerHpAfter}.`;
}

/** Armed trap on current node — used by Token D classifier. */
export function armedTrapOnNode(state: GameState) {
  const node = currentDungeonNode(state.activeDungeon);
  return node?.hidden?.traps.find((t) => !t.disarmed) ?? null;
}
