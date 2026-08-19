import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveDungeonState } from './mapEngine';
import { parkMobHpAtCurrentNode, isCombatLocked, restoreParkedEncounter } from './dungeonMobLedger';
import { resolveLedgerFlee } from './ledgerCombat';
import { runPlayerCheck } from './checkMath';

function combatState(hp = 8) {
  const base = createInitialState('Test', 'litrpg');
  const dungeon: ActiveDungeonState = {
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
          mobs: [
            {
              id: 'm1',
              name: 'Rat',
              level: 1,
              role: 'trash',
              spawned: true,
              defeated: false,
              hpRemaining: null,
            },
          ],
        },
      },
    ],
  };
  return {
    ...base,
    activeDungeon: dungeon,
    activeEncounter: {
      name: 'Rat',
      level: 1,
      hp,
      maxHp: 16,
      armorClass: 11,
      strength: 11,
      dexterity: 10,
      constitution: 11,
      xpReward: 25,
      goldReward: 0,
    },
  };
}

describe('ledger flee (Slice 2)', () => {
  it('isCombatLocked while encounter hp > 0', () => {
    expect(isCombatLocked(combatState())).toBe(true);
    expect(isCombatLocked({ ...combatState(), activeEncounter: null })).toBe(false);
  });

  it('successful flee parks HP and clears encounter', () => {
    const state = combatState(7);
    const check = runPlayerCheck(state, { kind: 'flee', label: 'Flee / disengage' }, 'run away', 18);
    const resolved = resolveLedgerFlee(state, check);
    expect(resolved?.round.fled).toBe(true);
    expect(resolved?.state.activeEncounter).toBeNull();
    const mob = resolved!.state.activeDungeon!.nodes[0].hidden!.mobs[0];
    expect(mob.hpRemaining).toBe(7);
    expect(mob.defeated).toBe(false);
  });

  it('failed flee deals damage and keeps encounter', () => {
    const state = combatState(7);
    const check = runPlayerCheck(state, { kind: 'flee', label: 'Flee / disengage' }, 'run away', 3);
    const resolved = resolveLedgerFlee(state, check);
    expect(resolved?.round.fled).toBe(false);
    expect(resolved?.state.activeEncounter?.hp).toBe(7);
    expect(resolved?.round.received).toBeGreaterThan(0);
  });

  it('park + restore round-trip preserves wounded HP', () => {
    const state = combatState();
    const parked = parkMobHpAtCurrentNode({ ...state, activeEncounter: null }, 'Rat', 4);
    const restored = restoreParkedEncounter(parked);
    expect(restored.activeEncounter?.hp).toBe(4);
    expect(restored.activeEncounter?.name).toBe('Rat');
  });
});
