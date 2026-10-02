import type { GameState, Quest } from './types';
import type { LedgerCombatRound } from './ledgerCombat';


/** A step that is beating a threat at a named place (not a talk objective). */
export function isSiteBoundClearObjective(description: string): boolean {
  const d = (description ?? '').trim();
  if (!d) return false;
  if (/\binfestation\b/i.test(d) && /\b(clear|cathedral|crypt|undercroft)\b/i.test(d)) return true;
  return /\bclear\b/i.test(d) && /\b(?:in|at|inside)\s+the\b/i.test(d);
}

/**
 * The place-bound clear is actually won where it says, not by a street thug fight.
 * 'Clear the infestation in the cathedral lower crypts' needs a non-thug victory
 * in the undercroft or crypt.
 */
export function siteClearWonHere(description: string, location: string, foeName: string, won: boolean): boolean {
  if (!won || !isSiteBoundClearObjective(description)) return false;
  const here = (location ?? '').toLowerCase();
  const foe = (foeName ?? '').toLowerCase();
  if (/\bthugs?\b|\bbandits?\b|\bcutpurses?\b|\bhighwaymen\b/.test(foe)) return false;
  if (/\bback streets?\b/.test(here)) return false;
  const desc = description.toLowerCase();
  const needsCrypt = /crypt|undercroft|lower/.test(desc);
  const atCrypt = /crypt|undercroft/.test(here);
  if (needsCrypt && !atCrypt) return false;
  if (/cathedral/.test(desc) && !/cathedral|undercroft|crypt/.test(here)) return false;
  return true;
}

export function applySiteClearObjectives(
  quests: Quest[],
  location: string,
  foeName: string,
  won: boolean
): Quest[] {
  if (!won) return quests;
  let changed = false;
  const next = quests.map((q) => {
    if (q.status !== 'active') return q;
    let questChanged = false;
    const objectives = (q.objectives ?? []).map((o) => {
      if (o.completed || !siteClearWonHere(o.description ?? '', location, foeName, true)) return o;
      questChanged = true;
      changed = true;
      return { ...o, completed: true };
    });
    return questChanged ? { ...q, objectives } : q;
  });
  return changed ? next : quests;
}

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

  if (combat?.enemyDead) {
    next = applySiteClearObjectives(next, state.currentLocation ?? '', combat.enemyName, true);
  }

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
