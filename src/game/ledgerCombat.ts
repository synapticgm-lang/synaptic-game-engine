import type { ActiveEncounter, GameState, Item } from './types';
import type { PlayerCheckResult } from './checkMath';
import { currentDungeonNode } from './dungeonSeed';
import { parkMobHpAtCurrentNode, restoreParkedEncounter } from './dungeonMobLedger';
import { isExplorableDungeon } from './placeAuthority';

export { remainingDungeonMobs } from './dungeonPresence';

export interface LedgerFleeRound {
  enemyName: string;
  enemyHpBefore: number;
  enemyHpParked: number | null;
  fled: boolean;
  received: number;
  playerHpAfter: number;
  fleeReason: string;
}

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

/** Spawn the first unspawned mob in this room as the live encounter. */
export function spawnRoomEncounter(state: GameState): GameState {
  const restored = restoreParkedEncounter(state);
  if (restored.activeEncounter && restored.activeEncounter.hp > 0) {
    return restored;
  }
  if (state.activeEncounter && state.activeEncounter.hp > 0) return state;
  const dungeon = restored.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return restored;
  const node = currentDungeonNode(dungeon);
  const mob = (node?.hidden?.mobs ?? []).find((m) => !m.spawned && !m.defeated);
  if (!mob) return restored;
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
        mobs: n.hidden.mobs.map((m) =>
          m.id === mob.id ? { ...m, spawned: true, defeated: false, hpRemaining: null } : m
        ),
      },
    };
  });
  return {
    ...restored,
    activeEncounter: encounter,
    activeDungeon: { ...dungeon, nodes },
  };
}

/** Stealth check during live combat — success parks mob HP on node and clears encounter. */
export function resolveLedgerFlee(
  state: GameState,
  check: PlayerCheckResult
): { state: GameState; round: LedgerFleeRound } | null {
  const encounter = state.activeEncounter;
  if (!encounter || encounter.hp <= 0) return null;

  const enemyName = encounter.name;
  const enemyHpBefore = encounter.hp;
  const fled = check.isSuccess && !check.isCriticalFailure;

  if (fled) {
    const parked = parkMobHpAtCurrentNode(state, enemyName, enemyHpBefore);
    const round: LedgerFleeRound = {
      enemyName,
      enemyHpBefore,
      enemyHpParked: enemyHpBefore,
      fled: true,
      received: 0,
      playerHpAfter: state.character.hp ?? 0,
      fleeReason: check.isCriticalSuccess
        ? 'You slip away clean — it loses your trail.'
        : 'You break contact and disengage.',
    };
    return {
      state: { ...parked, activeEncounter: null },
      round,
    };
  }

  const received = Math.max(1, 3 + Math.floor(encounter.level / 2));
  const playerHpAfter = Math.max(1, (state.character.hp ?? 0) - received);
  const round: LedgerFleeRound = {
    enemyName,
    enemyHpBefore,
    enemyHpParked: null,
    fled: false,
    received,
    playerHpAfter,
    fleeReason: check.isCriticalFailure
      ? 'You stumble — it closes the gap.'
      : 'It cuts off your escape.',
  };
  return {
    state: {
      ...state,
      character: { ...state.character, hp: playerHpAfter },
      activeEncounter: encounter,
    },
    round,
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
