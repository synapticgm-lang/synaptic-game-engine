import type { GameState, PlayPhase } from './types';
import { failRunScopedQuests } from './questGuards';
import { commitDeath, stampLastSafeHub, tryRecoverDeathCoinCache } from './rules/death';
import { turnRng } from './seededRng';

/**
 * T10SM1 — sole writer of `playPhase` (death.ts never writes it; endings/lifeline call here).
 */
export function setPlayPhase(state: GameState, playPhase: PlayPhase): GameState {
  if (state.playPhase === playPhase) return state;
  return { ...state, playPhase };
}

/** Whether player input should be blocked. */
export function isPlayInputLocked(state: GameState): boolean {
  return state.playPhase === 'ended' || state.playPhase === 'down';
}

/** Resolve play phase after HP settles on commit. */
export function applyPlayPhaseAfterHp(
  state: GameState,
  hp: number,
  turn: number,
  opts?: { deathTurn?: boolean }
): GameState {
  let next = stampLastSafeHub({ ...state, turn });
  if (hp > 0) {
    const coin = tryRecoverDeathCoinCache(next);
    next = coin.state;
    if (coin.receipts.length) {
      next = {
        ...next,
        lifelineReceipts: [...(next.lifelineReceipts ?? []), ...coin.receipts],
      };
    }
    // Lazy expire Weakened when the turn window has passed.
    if (next.weakenedUntilTurn != null && turn >= next.weakenedUntilTurn) {
      const conditions = (next.character.conditions ?? []).filter((c) => !/^weakened$/i.test(c));
      next = { ...next, weakenedUntilTurn: null, character: { ...next.character, conditions } };
    }
    if (next.playPhase === 'down') {
      return setPlayPhase(next, 'live');
    }
    return next;
  }

  // Tabletop at 0 HP makes death saves; the run ends on the third failure (or a killing blow).
  if (state.engineMode === 'dnd' && state.deathSaves && !state.deathSaves.dead) {
    return next;
  }

  // LitRPG / Story RPG: Package A lifeline — never 'down' / 'ended' on 0 HP (incl. deathTurn).
  if (state.engineMode === 'litrpg' || state.engineMode === 'rpg') {
    if (next.lifelineFiredTurn === turn && (next.character.hp ?? 0) > 0) {
      return setPlayPhase(next, 'live');
    }
    const end = commitDeath({ ...next, character: { ...next.character, hp: 0 }, turn }, 'danger', turnRng(next, 'lifeline'));
    return setPlayPhase(end.state, 'live');
  }

  // Tabletop (and any other mode): ended + run-scoped quest sweep.
  let ended = setPlayPhase(next, 'ended');
  ended = failRunScopedQuests(ended, turn);
  return ended;
}

export function deathQuestReceipt(state: GameState): string | null {
  const failed = (state.quests ?? []).filter((q) => q.status === 'failed' && q.runScoped);
  if (!failed.length) return null;
  return `Active quests closed (${failed.length}): ${failed.map((q) => q.name).join(', ')}`;
}
