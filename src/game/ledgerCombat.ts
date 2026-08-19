import type { ActiveEncounter, GameState, Item } from './types';
import type { PlayerCheckResult } from './checkMath';
import { currentDungeonNode } from './dungeonSeed';
import { isExplorableDungeon } from './placeAuthority';

export interface LedgerCombatRound {
  weaponName: string;
  dealt: number;
  received: number;
  enemyName: string;
  enemyHpBefore: number;
  enemyHpAfter: number;
  enemyDead: boolean;
  enemyActs: boolean;
  enemyActReason: string;
  playerHpAfter: number;
  xp: number;
}

export function equippedWeaponName(state: GameState): string {
  const held = (state.inventory ?? []).find(
    (i) => i.equipped && /hand|weapon|main/i.test(i.slot ?? '')
  );
  if (held?.name) return held.name;
  const anyWeapon = (state.inventory ?? []).find((i) =>
    /\b(knife|blade|sword|axe|club|bat|spear|staff|pistol|gun)\b/i.test(i.name)
  );
  return anyWeapon?.name ?? 'bare hands';
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
      if (!mob.spawned) names.push(`${mob.name} (${node.name})`);
    }
  }
  if (state.activeEncounter && state.activeEncounter.hp > 0) {
    names.unshift(`${state.activeEncounter.name} (here)`);
  }
  return { alive: names.length, names };
}

/** Spawn the first unspawned mob in this room as the live encounter. */
export function spawnRoomEncounter(state: GameState): GameState {
  if (state.activeEncounter && state.activeEncounter.hp > 0) return state;
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return state;
  const node = currentDungeonNode(dungeon);
  const mob = (node?.hidden?.mobs ?? []).find((m) => !m.spawned);
  if (!mob) return state;
  const level = Math.max(1, mob.level);
  const maxHp = mob.role === 'boss' ? 28 : mob.role === 'miniBoss' ? 22 : 14 + level * 2;
  const encounter: ActiveEncounter = {
    name: mob.name,
    level,
    hp: maxHp,
    maxHp,
    armorClass: 10 + Math.min(4, level),
    strength: 10 + level,
    dexterity: 10,
    constitution: 10 + level,
    xpReward: mob.role === 'miniBoss' || mob.role === 'boss' ? 40 : 25,
    goldReward: 0,
  };
  const nodes = dungeon.nodes.map((n) => {
    if (n.id !== node?.id || !n.hidden) return n;
    return {
      ...n,
      hidden: {
        ...n.hidden,
        mobs: n.hidden.mobs.map((m) => (m.id === mob.id ? { ...m, spawned: true } : m)),
      },
    };
  });
  return {
    ...state,
    activeEncounter: encounter,
    activeDungeon: { ...dungeon, nodes },
  };
}

export function resolveLedgerCombat(
  state: GameState,
  check: PlayerCheckResult
): { state: GameState; round: LedgerCombatRound } | null {
  const encounter = state.activeEncounter;
  if (!encounter || encounter.hp <= 0) return null;
  const weaponName = equippedWeaponName(state);
  const hit = check.isSuccess || check.isCriticalSuccess;
  const base = check.isCriticalSuccess ? 10 : hit ? 6 : 0;
  const dealt = hit ? Math.max(1, base + Math.floor((state.character.level ?? 1) / 2)) : 0;
  const enemyHpAfter = Math.max(0, encounter.hp - dealt);
  const enemyDead = enemyHpAfter <= 0;
  const enemyActs = !enemyDead && (hit || !check.isCriticalFailure);
  const received = enemyActs ? Math.max(1, 3 + Math.floor(encounter.level / 2)) : 0;
  const playerHpAfter = Math.max(1, (state.character.hp ?? 0) - received);
  const round: LedgerCombatRound = {
    weaponName,
    dealt,
    received,
    enemyName: encounter.name,
    enemyHpBefore: encounter.hp,
    enemyHpAfter,
    enemyDead,
    enemyActs,
    enemyActReason: enemyDead
      ? 'It is down — it does not attack back.'
      : enemyActs
        ? 'It fights back this turn.'
        : 'It does not land a return — stunned or it missed you.',
    playerHpAfter,
    xp: enemyDead ? encounter.xpReward || 25 : 0,
  };
  const nextEncounter: ActiveEncounter | null = enemyDead
    ? { ...encounter, hp: 0 }
    : { ...encounter, hp: enemyHpAfter };
  return {
    state: {
      ...state,
      character: { ...state.character, hp: playerHpAfter },
      activeEncounter: nextEncounter,
    },
    round,
  };
}

export function itemLooksLikeWeapon(item: Item): boolean {
  return /\b(knife|sword|blade|axe|club|bat|spear|staff|pistol|gun|dagger|mace|hammer|bow)\b/i.test(item.name);
}
