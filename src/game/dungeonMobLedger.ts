import type { ActiveEncounter, GameState } from './types';
import type { ActiveDungeonState, MapNode, NodeHidden } from './mapEngine';
import { currentDungeonNode } from './dungeonSeed';
import { isExplorableDungeon } from './placeAuthority';

/** Bump when repair rules change — independent of CURRENT_SAVE_VERSION. */
export const CURRENT_SAVE_REPAIR_REVISION = 2;

export type NodeMob = NonNullable<NodeHidden['mobs']>[number];
export type LooseNodeItem = NonNullable<NodeHidden['looseItems']>[number];

/** Narrative-only receipt when mob counter hits zero — no auto dungeon exit. */
export const DUNGEON_NEUTRALIZED_MILESTONE =
  '[MILESTONE: All dungeon threats neutralized]';

/** True while a live encounter must be resolved before map movement. */
export function isCombatLocked(state: GameState): boolean {
  return !!(state.activeEncounter && state.activeEncounter.hp > 0);
}

export function mobCountsAsRemaining(mob: NodeMob): boolean {
  if (!mob.spawned) return true;
  if (mob.defeated) return false;
  if (mob.hpRemaining != null && mob.hpRemaining > 0) return true;
  return false;
}

function normalizeMob(mob: NodeMob, note: (msg: string) => void): { mob: NodeMob; changed: boolean } {
  let next: NodeMob = { ...mob };
  let changed = false;

  if (next.defeated == null && next.spawned) {
    next = { ...next, defeated: true, hpRemaining: next.hpRemaining ?? null };
    changed = true;
    note('legacy spawned mob marked defeated');
  }

  if (next.defeated && next.hpRemaining != null && next.hpRemaining > 0) {
    next = { ...next, hpRemaining: null };
    changed = true;
    note('cleared hpRemaining on defeated mob');
  }

  if (!next.spawned && next.defeated) {
    next = { ...next, defeated: false, hpRemaining: null };
    changed = true;
  }

  return { mob: next, changed };
}

function normalizeHidden(hidden: NodeHidden, note: (msg: string) => void): { hidden: NodeHidden; changed: boolean } {
  let changed = false;
  const looseItems = hidden.looseItems ?? [];
  if (hidden.looseItems == null) {
    changed = true;
    note('seeded hidden.looseItems');
  }

  const mobs = hidden.mobs.map((mob) => {
    const normalized = normalizeMob(mob, note);
    changed = changed || normalized.changed;
    return normalized.mob;
  });

  if (!changed && looseItems === hidden.looseItems && mobs === hidden.mobs) {
    return { hidden, changed: false };
  }

  return {
    hidden: { ...hidden, looseItems, mobs },
    changed: true,
  };
}

function normalizeDungeonNodes(
  dungeon: ActiveDungeonState,
  note: (msg: string) => void
): { dungeon: ActiveDungeonState; changed: boolean } {
  let changed = false;
  const nodes = dungeon.nodes.map((node) => {
    if (!node.hidden) return node;
    const normalized = normalizeHidden(node.hidden, note);
    if (!normalized.changed) return node;
    changed = true;
    return { ...node, hidden: normalized.hidden };
  });
  if (!changed) return { dungeon, changed: false };
  return { dungeon: { ...dungeon, nodes }, changed: true };
}

/** Normalize mob ledger + looseItems on explorable dungeons. */
export function normalizeDungeonMobLedger(state: GameState, note: (msg: string) => void): { state: GameState; changed: boolean } {
  if (!isExplorableDungeon(state.activeDungeon)) {
    return { state, changed: false };
  }
  const normalized = normalizeDungeonNodes(state.activeDungeon, note);
  if (!normalized.changed) return { state, changed: false };
  return {
    state: { ...state, activeDungeon: normalized.dungeon },
    changed: true,
  };
}

/** Restore a wounded parked mob at the current node before fresh spawn. */
export function restoreParkedEncounter(state: GameState): GameState {
  if (state.activeEncounter && state.activeEncounter.hp > 0) return state;
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return state;
  const node = currentDungeonNode(dungeon);
  const parked = (node?.hidden?.mobs ?? []).find(
    (m) => m.spawned && !m.defeated && m.hpRemaining != null && m.hpRemaining > 0
  );
  if (!parked || !node) return state;

  const level = Math.max(1, parked.level);
  const maxHp =
    parked.role === 'boss' ? 28 : parked.role === 'miniBoss' ? 22 : 14 + level * 2;
  const hp = Math.min(maxHp, Math.max(1, parked.hpRemaining!));
  const encounter: ActiveEncounter = {
    name: parked.name,
    level,
    hp,
    maxHp,
    armorClass: 10 + Math.min(4, level),
    strength: 10 + level,
    dexterity: 10,
    constitution: 10 + level,
    xpReward: parked.role === 'miniBoss' || parked.role === 'boss' ? 40 : 25,
    goldReward: 0,
  };
  return { ...state, activeEncounter: encounter };
}

/** Park wounded mob HP on the current node after a successful flee. */
export function parkMobHpAtCurrentNode(
  state: GameState,
  enemyName: string,
  hpRemaining: number
): GameState {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return state;
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return state;
  const key = enemyName.trim().toLowerCase();
  const hp = Math.max(1, hpRemaining);
  let touched = false;
  const mobs = node.hidden.mobs.map((mob) => {
    if (touched) return mob;
    if (mob.name.trim().toLowerCase() !== key) return mob;
    touched = true;
    return { ...mob, spawned: true, defeated: false, hpRemaining: hp };
  });
  if (!touched) return state;
  const nodes = dungeon.nodes.map((n) =>
    n.id === node.id ? { ...n, hidden: { ...n.hidden!, mobs } } : n
  );
  return { ...state, activeDungeon: { ...dungeon, nodes } };
}

/** Mark the current room mob defeated when ledger combat kills the active foe. */
export function markDefeatedMobAtCurrentNode(state: GameState, enemyName: string): GameState {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return state;
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return state;
  const key = enemyName.trim().toLowerCase();
  let touched = false;
  const mobs = node.hidden.mobs.map((mob) => {
    if (touched) return mob;
    if (mob.name.trim().toLowerCase() !== key) return mob;
    touched = true;
    return { ...mob, spawned: true, defeated: true, hpRemaining: null };
  });
  if (!touched) return state;
  const nodes = dungeon.nodes.map((n) =>
    n.id === node.id ? { ...n, hidden: { ...n.hidden!, mobs } } : n
  );
  return { ...state, activeDungeon: { ...dungeon, nodes } };
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
