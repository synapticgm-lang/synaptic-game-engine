/**
 * q31-LK1 — locks and alarms (acceptance LK1-a…g).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { runPlayerCheck } from './checkMath';
import {
  defaultLockForKind,
  LOCK_KIND_DEFAULTS,
  lockpickLevel,
  pickToolsOf,
  resolveLockAttempt,
  toolMinSkillLevel,
} from './lockAttempt';
import { applyTabletopSheet, resolveSheet } from './tabletop/characterBuild';
import type { GameState } from './types';
import type { PlayerIntent } from './intentParser';
import type { ActiveDungeonState, SkillGate } from './mapEngine';

const PICK: PlayerIntent = { kind: 'search', label: 'Pick', targets: ['lock'] };

function dungeonWithLock(lock: SkillGate, over: Partial<GameState> = {}): GameState {
  const mode = (over.engineMode as GameState['engineMode']) || 'litrpg';
  const base = createInitialState(undefined, mode) as GameState;
  const d: ActiveDungeonState = {
    dungeonName: 'Test Cell',
    blueprintId: 'test',
    tier: 3,
    currentZLevel: 0,
    currentNodeId: 'r0',
    visitedNodeIds: ['r0'],
    clearedNodeIds: [],
    nodes: [
      {
        id: 'r0',
        name: 'Cell',
        description: 'a test cell',
        connections: [],
        tags: ['entry'],
        hidden: {
          traps: [],
          secrets: [],
          mobs: [],
          lootables: [
            {
              id: 'chest-1',
              label: 'iron chest',
              opened: false,
              loot: { rarity: 'Common', qty: 1, grade: 2 },
              lock,
            },
          ],
        },
      },
    ],
  };
  return {
    ...base,
    ...over,
    seed: 'lk1',
    turn: 3,
    engineMode: mode,
    activeDungeon: d,
    worldHour: over.worldHour ?? 10,
    worldDay: over.worldDay ?? 0,
    openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: over.sceneFacts
      ? ({ ...(base.sceneFacts ?? {}), ...over.sceneFacts } as GameState['sceneFacts'])
      : base.sceneFacts,
    character: { ...base.character, ...(over.character ?? {}) },
    inventory: over.inventory ?? base.inventory,
  };
}

function tools(name = "Thieves' Tools") {
  return [{ id: 'tt-1', name, rarity: 'Common' as const, quantity: 1, itemType: 'accessory' as const, itemLevel: 1, description: 'picks', provenance: 'test' }];
}

function tabletopRogue(): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  const sheet = resolveSheet({
    classId: 'rogue',
    speciesId: 'human',
    backgroundId: 'criminal',
    method: 'point-buy',
    baseScores: { STR: 8, DEX: 15, CON: 14, INT: 10, WIS: 12, CHA: 10 },
    kitId: 'A',
    source: 'build',
  });
  const s = applyTabletopSheet({ ...s0, seed: 'lk1-tt', engineMode: 'dnd', turn: 3 }, sheet);
  return dungeonWithLock(
    { skill: 'thievery', rank: 1, kind: 'chest', dc: 15, tier: 'Apprentice', tryHours: 0.1 },
    {
      engineMode: 'dnd',
      inventory: tools(),
      character: { ...s.character, attributes: { ...s.character.attributes, DEX: 16 }, level: 1 },
    },
  );
}

describe('LK-1: locks and alarms', () => {
  it('LK1-a: holding the key opens with no roll', () => {
    const s = dungeonWithLock(
      { skill: 'thievery', rank: 1, kind: 'chest', dc: 15, key: 'iron key', tryHours: 0.1 },
      {
        inventory: [
          { id: 'k1', name: 'iron key', rarity: 'Common', quantity: 1, itemType: 'accessory', provenance: 'test' },
        ],
      },
    );
    const r = resolveLockAttempt(s, 'unlock the iron chest with the key');
    expect(r?.opened).toBe(true);
    expect(r?.receipts.join(' ')).toMatch(/opens with the iron key/i);
    expect(r?.state.activeDungeon?.nodes[0]?.hidden?.lootables[0]?.opened).toBe(true);
  });

  it('LK1-b: TT without tools refused; with tools SK4 path works', () => {
    const bare = tabletopRogue();
    bare.inventory = [];
    const refuse = resolveLockAttempt(bare, 'pick the lock on the iron chest');
    expect(refuse?.refused).toBe(true);
    expect(refuse?.receipts.join(' ')).toMatch(/you need Thieves' Tools/i);

    const withTools = tabletopRogue();
    const check = runPlayerCheck(withTools, PICK, 'pick the lock', 10);
    const ok = resolveLockAttempt(withTools, 'pick the lock on the iron chest', { pick: check });
    expect(ok?.opened).toBe(true);
  });

  it('LK1-c: each failure advances the clock and can alert earshot (SK-3)', () => {
    const s = dungeonWithLock(
      { skill: 'thievery', rank: 1, kind: 'chest', dc: 15, tier: 'Apprentice', tryHours: 0.5 },
      {
        engineMode: 'litrpg',
        inventory: tools(),
        character: { ...(createInitialState(undefined, 'litrpg') as GameState).character, skills: { thievery: 12 }, name: 'Rook' },
        sceneFacts: { ...(createInitialState(undefined, 'litrpg') as GameState).sceneFacts!, present: ['Guard A'] },
        worldHour: 10,
      },
    );
    const fail = runPlayerCheck(s, PICK, 'pick the lock', 1);
    const r = resolveLockAttempt(s, 'pick the lock on the iron chest', { pick: fail, stealthTotal: 5 });
    expect(r?.opened).toBe(false);
    expect(r?.state.worldHour).not.toBe(10);
    expect(r?.noticed).toBe(true);
    expect(r?.receipts.join(' ')).toMatch(/alerts someone nearby|fails/i);
  });

  it('LK1-d: three failures in a row break the picks; success resets the count', () => {
    let s = dungeonWithLock(
      { skill: 'thievery', rank: 1, kind: 'chest', dc: 15, tier: 'Apprentice', tryHours: 0.1 },
      {
        engineMode: 'litrpg',
        inventory: tools(),
        character: { ...(createInitialState(undefined, 'litrpg') as GameState).character, skills: { thievery: 12 }, name: 'Rook' },
      },
    );
    const fail = runPlayerCheck(s, PICK, 'pick the lock', 1);
    for (let i = 0; i < 2; i++) {
      const r = resolveLockAttempt(s, 'pick the lock on the iron chest', { pick: fail });
      s = r!.state;
      expect(r!.toolsBroken).toBeFalsy();
    }
    const mid = runPlayerCheck(s, PICK, 'pick the lock', 20);
    const win = resolveLockAttempt(s, 'pick the lock on the iron chest', { pick: mid });
    expect(win?.opened).toBe(true);
    expect(win?.state.lockAttempts?.['chest-1']?.failsInRow).toBe(0);

    s = dungeonWithLock(
      { skill: 'thievery', rank: 1, kind: 'chest', dc: 15, tier: 'Apprentice', tryHours: 0.1 },
      {
        engineMode: 'litrpg',
        inventory: tools(),
        character: win!.state.character,
        lockAttempts: {},
      },
    );
    for (let i = 0; i < 3; i++) {
      const r = resolveLockAttempt(s, 'pick the lock on the iron chest', { pick: fail });
      s = r!.state;
      if (i < 2) expect(r!.toolsBroken).toBeFalsy();
      else {
        expect(r!.toolsBroken).toBe(true);
        expect(r!.receipts.join(' ')).toMatch(/picks snap/i);
        expect(pickToolsOf(r!.state)).toBeNull();
      }
    }

    let tts = tabletopRogue();
    for (let i = 0; i < 3; i++) {
      const r = resolveLockAttempt(tts, 'pick the lock on the iron chest', { pick: runPlayerCheck(tts, PICK, 'pick the lock', 1) });
      tts = r!.state;
      if (i === 2) expect(r!.receipts.join(' ')).toMatch(/GM ruling/i);
    }
  });

  it('LK1-e: Master-grade picks refused below tool minimum', () => {
    const s = dungeonWithLock(
      { skill: 'thievery', rank: 1, kind: 'chest', dc: 15, tier: 'Apprentice', tryHours: 0.1 },
      {
        engineMode: 'litrpg',
        inventory: tools('Master-grade picks'),
        character: {
          ...(createInitialState(undefined, 'litrpg') as GameState).character,
          namedSkills: [{ id: 'lockpicking', level: 12, xp: 0, rank: 2, uses: 0 }],
          name: 'Rook',
        },
      },
    );
    expect(lockpickLevel(s)).toBe(12);
    expect(toolMinSkillLevel(pickToolsOf(s)!)).toBe(41);
    const r = resolveLockAttempt(s, 'pick the lock on the iron chest');
    expect(r?.refused).toBe(true);
    expect(r?.receipts.join(' ')).toMatch(/lack the skill for these tools/i);
  });

  it('LK1-f: spot + disarm; unspotted fail sounds the alarm', () => {
    const lock: SkillGate = {
      skill: 'thievery',
      rank: 2,
      kind: 'safe',
      dc: 20,
      tier: 'Expert',
      tryHours: 0.25,
      alarm: { spotDc: 14, disarmDc: 15, sounds: true },
    };
    let s = dungeonWithLock(lock, {
      engineMode: 'litrpg',
      inventory: tools(),
      character: {
        ...(createInitialState(undefined, 'litrpg') as GameState).character,
        skills: { thievery: 22, perception: 3 },
        attributes: { STR: 10, DEX: 14, CON: 12, INT: 12, WIS: 16, CHA: 10 },
        name: 'Rook',
      },
    });
    const spot = resolveLockAttempt(s, 'search for an alarm on the iron chest', { spotD20: 18 });
    expect(spot?.state.lockAttempts?.['chest-1']?.alarmSpotted).toBe(true);
    s = spot!.state;
    const disarm = resolveLockAttempt(s, 'disarm the alarm on the iron chest', { disarmD20: 18 });
    expect(disarm?.state.lockAttempts?.['chest-1']?.alarmDisarmed).toBe(true);

    const loud = dungeonWithLock(lock, {
      engineMode: 'litrpg',
      inventory: tools(),
      character: {
        ...(createInitialState(undefined, 'litrpg') as GameState).character,
        skills: { thievery: 1 },
        name: 'Rook',
      },
    });
    const fail = runPlayerCheck(loud, PICK, 'pick the lock', 1);
    const boom = resolveLockAttempt(loud, 'pick the lock on the iron chest', { pick: fail });
    expect(boom?.alarmSounded).toBe(true);
    expect(boom?.receipts.join(' ')).toMatch(/alarm.*sounds/i);
  });

  it('LK1-g: safe and guarded defaults are harder and include an alarm', () => {
    const door = defaultLockForKind('door');
    const safe = defaultLockForKind('safe');
    const guarded = defaultLockForKind('guarded');
    expect(safe.dc).toBeGreaterThan(door.dc);
    expect(guarded.dc).toBeGreaterThan(door.dc);
    expect(safe.alarm?.sounds).toBe(true);
    expect(guarded.alarm?.sounds).toBe(true);
    expect(LOCK_KIND_DEFAULTS.safe.alarm).toBeTruthy();
    expect(LOCK_KIND_DEFAULTS.door.alarm).toBeFalsy();
  });
});
