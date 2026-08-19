import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveDungeonState } from './mapEngine';
import {
  markDefeatedMobAtCurrentNode,
  mobCountsAsRemaining,
  restoreParkedEncounter,
} from './dungeonMobLedger';
import { remainingDungeonMobs } from './dungeonPresence';
import { spawnRoomEncounter } from './ledgerCombat';

function testDungeon(
  mobs: Array<{
    id: string;
    name: string;
    spawned: boolean;
    defeated?: boolean;
    hpRemaining?: number | null;
  }>,
  currentNodeId = 'room-a'
): ActiveDungeonState {
  return {
    blueprintId: 'test-dungeon',
    dungeonName: 'Test Pit',
    tier: 4,
    dangerTier: 1,
    currentZLevel: 0,
    currentNodeId,
    visitedNodeIds: [currentNodeId],
    clearedNodeIds: [],
    nodes: [
      {
        id: 'room-a',
        name: 'Entry',
        description: 'A test room',
        connections: [],
        hidden: {
          traps: [],
          lootables: [],
          secrets: [],
          mobs: mobs.map((m) => ({
            ...m,
            level: 1,
            role: 'trash' as const,
          })),
        },
      },
    ],
  };
}

describe('dungeon mob ledger', () => {
  it('counts unspawned, parked, and excludes defeated mobs', () => {
    expect(mobCountsAsRemaining({ id: '1', name: 'A', level: 1, role: 'trash', spawned: false })).toBe(true);
    expect(
      mobCountsAsRemaining({
        id: '2',
        name: 'B',
        level: 1,
        role: 'trash',
        spawned: true,
        defeated: true,
      })
    ).toBe(false);
    expect(
      mobCountsAsRemaining({
        id: '3',
        name: 'C',
        level: 1,
        role: 'trash',
        spawned: true,
        defeated: false,
        hpRemaining: 4,
      })
    ).toBe(true);
  });

  it('remainingDungeonMobs dedupes live encounter when mob is parked here', () => {
    const base = createInitialState('Test', 'litrpg');
    const state = {
      ...base,
      activeDungeon: testDungeon([
        { id: 'm1', name: 'Rat', spawned: true, defeated: false, hpRemaining: 3 },
      ]),
      activeEncounter: {
        name: 'Rat',
        level: 1,
        hp: 3,
        maxHp: 16,
        armorClass: 11,
        strength: 11,
        dexterity: 10,
        constitution: 11,
        xpReward: 25,
        goldReward: 0,
      },
    };
    const { alive, names } = remainingDungeonMobs(state);
    expect(alive).toBe(1);
    expect(names).toEqual(['Rat (Entry)']);
  });

  it('restoreParkedEncounter revives wounded blob before fresh spawn', () => {
    const base = createInitialState('Test', 'litrpg');
    const state = {
      ...base,
      activeEncounter: null,
      activeDungeon: testDungeon([
        { id: 'm1', name: 'Rat', spawned: true, defeated: false, hpRemaining: 5 },
      ]),
    };
    const restored = restoreParkedEncounter(state);
    expect(restored.activeEncounter?.name).toBe('Rat');
    expect(restored.activeEncounter?.hp).toBe(5);
  });

  it('markDefeatedMobAtCurrentNode clears hpRemaining on kill', () => {
    const base = createInitialState('Test', 'litrpg');
    const state = {
      ...base,
      activeDungeon: testDungeon([
        { id: 'm1', name: 'Rat', spawned: true, defeated: false, hpRemaining: 2 },
      ]),
    };
    const next = markDefeatedMobAtCurrentNode(state, 'Rat');
    const mob = next.activeDungeon!.nodes[0].hidden!.mobs[0];
    expect(mob.defeated).toBe(true);
    expect(mob.hpRemaining).toBeNull();
  });

  it('ledger spawn skips defeated mobs and marks fresh spawn', () => {
    const base = createInitialState('Test', 'litrpg');
    const state = {
      ...base,
      activeEncounter: null,
      activeDungeon: testDungeon([
        { id: 'm1', name: 'Rat', spawned: true, defeated: true },
        { id: 'm2', name: 'Bat', spawned: false },
      ]),
    };
    const next = spawnRoomEncounter(state);
    expect(next.activeEncounter?.name).toBe('Bat');
    const mobs = next.activeDungeon!.nodes[0].hidden!.mobs;
    expect(mobs[1].spawned).toBe(true);
    expect(mobs[1].defeated).toBe(false);
  });
});
