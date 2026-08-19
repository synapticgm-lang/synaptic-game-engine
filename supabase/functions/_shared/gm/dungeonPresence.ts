import type { GameState } from './types.ts';
import { isExplorableDungeon } from './placeAuthority.ts';

type NodeMob = NonNullable<
  NonNullable<NonNullable<GameState['activeDungeon']>['nodes'][number]['hidden']>['mobs']
>[number];

function mobCountsAsRemaining(mob: NodeMob): boolean {
  if (!mob.spawned) return true;
  if (mob.defeated) return false;
  if (mob.hpRemaining != null && mob.hpRemaining > 0) return true;
  return false;
}

export function remainingDungeonMobs(state: GameState): { alive: number; names: string[] } {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) {
    const live = state.activeEncounter && state.activeEncounter.hp > 0 ? [state.activeEncounter.name] : [];
    return { alive: live.length, names: live };
  }

  const names: string[] = [];
  for (const node of dungeon.nodes) {
    for (const mob of node.hidden?.mobs ?? []) {
      if (mobCountsAsRemaining(mob)) {
        names.push(`${mob.name} (${node.name})`);
      }
    }
  }

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
