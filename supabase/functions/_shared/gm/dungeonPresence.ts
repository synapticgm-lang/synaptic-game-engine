import type { GameState } from './types.ts';
import { isExplorableDungeon } from './placeAuthority.ts';

export function remainingDungeonMobs(state: GameState): { alive: number; names: string[] } {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) {
    const live = state.activeEncounter && state.activeEncounter.hp > 0 ? [state.activeEncounter.name] : [];
    return { alive: live.length, names: live };
  }
  const names: string[] = [];
  for (const node of dungeon.nodes) {
    for (const mob of node.hidden?.mobs ?? []) {
      if (!mob.spawned) names.push(`${mob.name} (${node.name})`);
    }
  }
  if (state.activeEncounter && state.activeEncounter.hp > 0) {
    names.unshift(`${state.activeEncounter.name} (here)`);
  }
  return { alive: names.length, names };
}
