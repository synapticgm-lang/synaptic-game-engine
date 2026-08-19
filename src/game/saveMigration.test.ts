import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { repairSaveSchema } from './saveMigration';
import { CURRENT_SAVE_REPAIR_REVISION } from './dungeonMobLedger';
import type { ActiveDungeonState } from './mapEngine';

function dungeonWithMobs(
  mobs: Array<{ id: string; name: string; spawned: boolean; defeated?: boolean; hpRemaining?: number | null }>
): ActiveDungeonState {
  return {
    blueprintId: 'test-dungeon',
    dungeonName: 'Test Pit',
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

describe('repairSaveSchema', () => {
  it('defaults playPhase to live on legacy saves', () => {
    const base = createInitialState('Test', 'litrpg');
    const { state, dirty } = repairSaveSchema({ ...base, playPhase: undefined });
    expect(state.playPhase).toBe('live');
    expect(dirty).toBe(true);
    expect(state.saveRepairRevision).toBe(CURRENT_SAVE_REPAIR_REVISION);
  });

  it('marks legacy spawned mobs as defeated and notifies once', () => {
    const base = createInitialState('Test', 'litrpg');
    const { state, dirty, severity, shouldNotify } = repairSaveSchema({
      ...base,
      activeDungeon: dungeonWithMobs([
        { id: 'm1', name: 'Rat', spawned: true },
        { id: 'm2', name: 'Bat', spawned: false },
      ]),
    });
    expect(dirty).toBe(true);
    expect(severity).toBe('semantic');
    expect(shouldNotify).toBe(true);
    const mobs = state.activeDungeon!.nodes[0].hidden!.mobs;
    expect(mobs[0].defeated).toBe(true);
    expect(mobs[1].defeated).toBeUndefined();
    expect(mobs[1].spawned).toBe(false);
    expect(state.saveRepairRevision).toBe(CURRENT_SAVE_REPAIR_REVISION);
  });

  it('is idempotent after repair revision is set', () => {
    const base = createInitialState('Test', 'litrpg');
    const first = repairSaveSchema({
      ...base,
      activeDungeon: dungeonWithMobs([{ id: 'm1', name: 'Rat', spawned: true }]),
    });
    const second = repairSaveSchema(first.state);
    expect(second.dirty).toBe(false);
    expect(second.shouldNotify).toBe(true);
    const third = repairSaveSchema({
      ...first.state,
      lastSeenSaveRepairRevision: CURRENT_SAVE_REPAIR_REVISION,
    });
    expect(third.shouldNotify).toBe(false);
  });
});
