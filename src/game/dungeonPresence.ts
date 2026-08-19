import type { GameState } from './types';
import { isExplorableDungeon } from './placeAuthority';
import { countRemainingMobsOnDungeon, mobCountsAsRemaining } from './dungeonMobLedger';

export function remainingDungeonMobs(state: GameState): { alive: number; names: string[] } {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) {
    const live = state.activeEncounter && state.activeEncounter.hp > 0 ? [state.activeEncounter.name] : [];
    return { alive: live.length, names: live };
  }

  const names = countRemainingMobsOnDungeon(dungeon);

  if (state.activeEncounter && state.activeEncounter.hp > 0) {
    const here = state.activeEncounter.name.trim().toLowerCase();
    const node = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId);
    const parkedHere = (node?.hidden?.mobs ?? []).some(
      (m) =>
        m.name.trim().toLowerCase() === here
        && mobCountsAsRemaining(m)
        && m.hpRemaining != null
        && m.hpRemaining > 0
    );
    if (!parkedHere) {
      names.unshift(`${state.activeEncounter.name} (here)`);
    }
  }

  return { alive: names.length, names };
}
