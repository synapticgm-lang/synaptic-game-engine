import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveDungeonState } from './mapEngine';
import { runPlayerCheck } from './checkMath';
import { resolveLedgerTrap } from './ledgerTrap';
import {
  classifyRemoteThrow,
  resolveAmbientTrapBypass,
  resolveInventoryTrapThrow,
} from './tokenD';
import { parkInventoryOnNode, pickUpLooseItem, parseLooseItemPickup } from './looseItems';
import { applyPlayPhaseAfterHp, deathQuestReceipt, isPlayInputLocked } from './playPhase';
import { applyQuestHooksFromLedger } from './questHooks';
import { applyQuestFailGuard } from './questGuards';
import type { Quest } from './types';

function trapDungeonState(hp = 20) {
  const base = createInitialState('Test', 'litrpg');
  const dungeon: ActiveDungeonState = {
    blueprintId: 'test-dungeon',
    dungeonName: 'Trap Room',
    tier: 4,
    dangerTier: 1,
    currentZLevel: 0,
    currentNodeId: 'room-a',
    visitedNodeIds: ['room-a'],
    clearedNodeIds: [],
    nodes: [
      {
        id: 'room-a',
        name: 'Entry',
        description: 'A trapped room',
        connections: [],
        hidden: {
          traps: [{ id: 't1', damage: 6, dc: 12, disarmed: false, revealed: false }],
          lootables: [],
          secrets: [],
          mobs: [],
          looseItems: [],
        },
      },
    ],
  };
  return {
    ...base,
    character: { ...base.character, hp, maxHp: hp },
    activeDungeon: dungeon,
    inventory: [{ id: 'dagger-1', name: 'Iron Dagger', rarity: 'Common' as const, quantity: 1 }],
  };
}

describe('ledger Slice 3 — traps + Token D + loose items', () => {
  it('T01: failed disarm deals partial HP and spends trap', () => {
    const state = trapDungeonState(20);
    const check = runPlayerCheck(state, { kind: 'search', label: 'Disarm trap' }, 'disarm the trap', 5);
    const resolved = resolveLedgerTrap(state, check);
    expect(resolved).not.toBeNull();
    expect(resolved!.round.damage).toBeGreaterThan(0);
    expect(resolved!.round.disarmed).toBe(true);
    expect(resolved!.state.character.hp).toBeLessThan(20);
    const trap = resolved!.state.activeDungeon!.nodes[0].hidden!.traps[0];
    expect(trap.disarmed).toBe(true);
  });

  it('T01 success: clean disarm costs 0 HP', () => {
    const state = trapDungeonState(20);
    const check = runPlayerCheck(state, { kind: 'search', label: 'Disarm trap' }, 'disarm the trap', 20);
    const resolved = resolveLedgerTrap(state, check);
    expect(resolved!.round.damage).toBe(0);
    expect(resolved!.state.character.hp).toBe(20);
  });

  it('D01: throw rock at armed trap — ambient bypass, 0 HP', () => {
    const state = trapDungeonState(20);
    const token = classifyRemoteThrow(state, 'throw a rock at the trap');
    expect(token.kind).toBe('ambient');
    if (token.kind !== 'ambient') return;
    const next = resolveAmbientTrapBypass(state, token.trapId);
    expect(next.character.hp).toBe(20);
    expect(next.activeDungeon!.nodes[0].hidden!.traps[0].disarmed).toBe(true);
  });

  it('inventory throw parks item and spends trap without HP', () => {
    const state = trapDungeonState(20);
    const token = classifyRemoteThrow(state, 'throw Iron Dagger at the trap');
    expect(token.kind).toBe('inventory');
    if (token.kind !== 'inventory') return;
    const next = resolveInventoryTrapThrow(state, token);
    expect(next.character.hp).toBe(20);
    expect(next.inventory?.find((i) => i.id === 'dagger-1')).toBeUndefined();
    expect(next.activeDungeon!.nodes[0].hidden!.looseItems?.length).toBe(1);
    expect(next.activeDungeon!.nodes[0].hidden!.traps[0].disarmed).toBe(true);
  });

  it('L01: pick up parked loose item restores inventory', () => {
    let state = trapDungeonState(20);
    state = parkInventoryOnNode(state, 'dagger-1', 'Iron Dagger');
    expect(parseLooseItemPickup('pick up Iron Dagger')).toBe('Iron Dagger');
    const picked = pickUpLooseItem(state, 'Iron Dagger');
    expect(picked.item?.name).toBe('Iron Dagger');
    expect(picked.state.inventory?.some((i) => i.name === 'Iron Dagger')).toBe(true);
    expect(picked.state.activeDungeon!.nodes[0].hidden!.looseItems?.length ?? 0).toBe(0);
  });
});

describe('ledger Slice 4 — quest fail + hooks', () => {
  const baseQuest: Quest = {
    id: 'q1',
    name: 'Clear the pit',
    status: 'active',
    revealed: true,
    runScoped: true,
    objectives: [{ id: 'o1', description: 'Defeat the boss', completed: false }],
  };

  it('Q01: quest-fail guard marks failed with reason', () => {
    const state = createInitialState('Test', 'litrpg');
    const withQuest = { ...state, quests: [baseQuest] };
    const result = applyQuestFailGuard(withQuest, 'q1', 5, 'You fled the dungeon.');
    expect(result.blocked).toBe(false);
    expect(result.failedQuest?.status).toBe('failed');
    expect(result.failedQuest?.failReason).toBe('You fled the dungeon.');
  });

  it('boss kill hook ticks boss objective', () => {
    const state = trapDungeonState();
    state.activeDungeon!.nodes[0].hidden!.mobs = [
      { id: 'b1', name: 'Stockboy', level: 3, role: 'boss', spawned: true, defeated: false, hpRemaining: null },
    ];
    const quests = applyQuestHooksFromLedger([baseQuest], state, 10, {
      combat: {
        enemyName: 'Stockboy',
        enemyDead: true,
        dealt: 10,
        received: 0,
        playerHpAfter: 15,
        fled: false,
      },
      bossKill: true,
    });
    expect(quests[0].objectives?.[0].completed).toBe(true);
  });
});

describe('ledger Slice 5 — playPhase + archive lock', () => {
  it('E01: ended and down lock input', () => {
    const live = createInitialState('Test', 'litrpg');
    expect(isPlayInputLocked(live)).toBe(false);
    expect(isPlayInputLocked({ ...live, playPhase: 'down' })).toBe(true);
    expect(isPlayInputLocked({ ...live, playPhase: 'ended' })).toBe(true);
  });

  it('Q02/E01: LitRPG HP→0 goes down; story RPG goes ended + fails run-scoped quests', () => {
    const lit = createInitialState('Test', 'litrpg');
    const down = applyPlayPhaseAfterHp({ ...lit, character: { ...lit.character, hp: 0 } }, 0, 12);
    expect(down.playPhase).toBe('down');

    const story = createInitialState('Test', 'story');
    const quest: Quest = {
      id: 'q2',
      name: 'Survive',
      status: 'active',
      revealed: true,
      runScoped: true,
    };
    const ended = applyPlayPhaseAfterHp(
      { ...story, character: { ...story.character, hp: 0 }, quests: [quest] },
      0,
      8
    );
    expect(ended.playPhase).toBe('ended');
    expect(ended.quests?.[0].status).toBe('failed');
    expect(deathQuestReceipt(ended)).toMatch(/Survive/);
  });
});
