/**
 * Edge-minimal mob ledger helpers (client: src/game/dungeonMobLedger.ts).
 * Keep in sync when mobCountsAsRemaining rules change.
 */

import type { NodeHidden } from './mapEngine.ts';

export type NodeMob = NonNullable<NodeHidden['mobs']>[number];

export function mobCountsAsRemaining(mob: NodeMob): boolean {
  if (!mob.spawned) return true;
  if (mob.defeated) return false;
  if (mob.hpRemaining != null && mob.hpRemaining > 0) return true;
  return false;
}
