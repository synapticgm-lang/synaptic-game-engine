/**
 * Edge-minimal mob ledger helpers (client: src/game/dungeonMobLedger.ts).
 * Keep in sync when mobCountsAsRemaining rules change.
 */

import type { ActiveDungeonState, NodeHidden } from './mapEngine.ts';

export type NodeMob = NonNullable<NodeHidden['mobs']>[number];

export function mobCountsAsRemaining(mob: NodeMob): boolean {
  if (!mob.spawned) return true;
  if (mob.defeated) return false;
  if (mob.hpRemaining != null && mob.hpRemaining > 0) return true;
  return false;
}

export function countRemainingMobsOnDungeon(dungeon: ActiveDungeonState): string[] {
  const names: string[] = [];
  for (const node of dungeon.nodes) {
    for (const mob of node.hidden?.mobs ?? []) {
      if (mobCountsAsRemaining(mob)) {
        names.push(`${mob.name} (${node.name})`);
      }
    }
  }
  return names;
}
