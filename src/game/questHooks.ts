import type { GameState, Quest } from './types';
import type { LedgerCombatRound } from './ledgerCombat';

/** Code-driven quest objective ticks from ledger events (idempotent). */
export function applyQuestHooksFromLedger(
  quests: Quest[],
  state: GameState,
  turn: number,
  opts?: { combat?: LedgerCombatRound | null; bossKill?: boolean }
): Quest[] {
  let next = [...quests];
  const combat = opts?.combat;
  const bossKill =
    opts?.bossKill
    ?? (combat?.enemyDead
      && state.activeDungeon?.nodes.some((n) =>
        n.hidden?.mobs.some(
          (m) =>
            m.name.trim().toLowerCase() === combat.enemyName.trim().toLowerCase()
            && (m.role === 'boss' || m.role === 'miniBoss')
        )
      ));

  if (bossKill && combat) {
    next = next.map((q) => {
      if (q.status !== 'active') return q;
      const objs = q.objectives ?? [];
      const bossObj = objs.find((o) => /boss|mini-boss|stockboy|final/i.test(o.description));
      if (!bossObj || bossObj.completed) return q;
      return {
        ...q,
        objectives: objs.map((o) =>
          o.id === bossObj.id ? { ...o, completed: true } : o
        ),
      };
    });
  }

  return next;
}
