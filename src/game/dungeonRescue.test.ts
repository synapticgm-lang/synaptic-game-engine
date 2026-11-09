/**
 * Dungeon rescue. Offline. The card is cleared before a captive is released.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildDungeonCard } from './dungeonCard';
import {
  captiveAttackableByCardMob,
  cardIsClear,
  commitRescueAction,
  dungeonCaptiveStillHeld,
  findRescueKey,
  markEscortOut,
  rescuePickChance,
  seatRescueDwellers,
  seedDungeonRescue,
} from './dungeonRescue';
import { recordStanceFromAction } from './npcStance';
import type { ActiveDungeonState, DungeonDwell, MapNode } from './mapEngine';
import type { GameState } from './types';

function node(id: string, name: string, mob = false, secret = false): MapNode {
  return {
    id,
    name,
    description: name,
    connections: [],
    tags: id === 'r0' ? ['entry'] : [],
    isSecret: secret,
    hidden: { traps: [], lootables: [], secrets: [], mobs: mob ? [{ id: `${id}-mob`, name: 'Warden', role: 'trash', spawned: false, defeated: false, level: 1 }] : [] },
  };
}

function card(nodes: MapNode[], dwell?: DungeonDwell[]): ActiveDungeonState {
  return {
    blueprintId: 'dungeon-card',
    dungeonName: 'Old Crypt',
    siteName: 'Old Crypt',
    tier: 4,
    currentZLevel: 0,
    currentNodeId: nodes[0]?.id ?? 'r0',
    visitedNodeIds: [nodes[0]?.id ?? 'r0'],
    clearedNodeIds: [],
    nodes,
    ...(dwell ? { dwell } : {}),
  };
}

function play(c: ActiveDungeonState): GameState {
  const seeded = seedDungeonRescue(c, 'rescue-test');
  return {
    ...createInitialState('Rescue', 'dnd'),
    seed: 'rescue-test',
    activeDungeon: seeded,
    currentLocation: 'Sealed Niche Row',
    character: { ...createInitialState('Rescue', 'dnd').character, namedSkills: [{ id: 'lockpicking', level: 1, xp: 0, rank: 0, uses: 0 }] },
  } as GameState;
}

function clearMobs(state: GameState): GameState {
  const d = state.activeDungeon!;
  const nodes = d.nodes.map((n) => ({
    ...n,
    hidden: n.hidden
      ? { ...n.hidden, mobs: (n.hidden.mobs ?? []).map((m) => ({ ...m, spawned: true, defeated: true, hpRemaining: 0 })) }
      : n.hidden,
  }));
  return { ...state, activeDungeon: { ...d, nodes } };
}

describe('dungeon rescue', () => {
  it('seeds two captives in a niche and a vault, and none when no holding room exists', () => {
    const seeded = seedDungeonRescue(card([
      node('r0', 'Stair Descent'),
      node('a', 'Sealed Niche Row'),
      node('b', 'Offering Vault'),
      node('c', 'Quiet Hall'),
    ]), 'two');
    const captives = (seeded.dwell ?? []).filter((d) => d.kind === 'captive');
    expect(captives.length).toBeGreaterThanOrEqual(2);
    expect(new Set(captives.map((d) => d.id)).size).toBe(captives.length);
    expect(seeded.nodes.every((n) => !(n.hidden?.mobs ?? []).some((m) => captives.some((c) => c.name === m.name)))).toBe(true);
    expect(seeded.rescue?.questId).toMatch(/^card-rescue:/);
    const bare = seedDungeonRescue(card([node('r0', 'Cave Mouth'), node('a', 'Dripping Passage')]), 'none');
    expect(bare.dwell?.filter((d) => d.kind === 'captive')).toEqual([]);
    expect(bare.rescue).toBeUndefined();
  });

  it('puts an inhabitant only in a room with no mob', () => {
    const seeded = seedDungeonRescue(card([
      node('r0', 'Stair Descent'),
      node('mob', 'Bone Gallery', true),
      node('quiet', 'Candle Hall'),
    ]), 'home');
    const people = (seeded.dwell ?? []).filter((d) => d.kind === 'inhabitant');
    expect(people.every((p) => p.nodeId === 'quiet')).toBe(true);
    expect(people.every((p) => p.disposition === 'friendly')).toBe(true);
  });

  it('does not roll a new person when the card already has a dwell list', () => {
    const once = seedDungeonRescue(card([node('r0', 'Stair'), node('a', 'Offering Vault')]), 'same');
    const twice = seedDungeonRescue(once, 'other-seed');
    expect(twice.dwell).toEqual(once.dwell);
    const legacy = card([node('r0', 'Stair'), node('a', 'Offering Vault')]);
    delete (legacy as { dwell?: unknown }).dwell;
    expect(seatRescueDwellers({ ...createInitialState('R', 'dnd'), activeDungeon: legacy } as GameState).npcMemories ?? []).toEqual(
      createInitialState('R', 'dnd').npcMemories ?? [],
    );
  });

  it('does not release, spend a key, or pay XP until the card is clear and the action commits', () => {
    let state = play(card([node('r0', 'Stair'), node('a', 'Offering Vault', true)]));
    state = {
      ...state,
      activeDungeon: {
        ...state.activeDungeon!,
        currentNodeId: 'a',
        rescue: state.activeDungeon!.rescue ? { ...state.activeDungeon!.rescue, requireHeal: false } : undefined,
      },
    };
    const captive = state.activeDungeon!.dwell!.find((d) => d.kind === 'captive')!;
    state = findRescueKey(state, state.activeDungeon!.rescue!.keys[0]!.id);
    const early = commitRescueAction(state, `Unlock the shackles and free ${captive.name}`);
    expect(early.released).toBe(false);
    expect(early.state.activeDungeon!.dwell!.find((d) => d.id === captive.id)!.status).toBe('held');
    expect(early.state.inventory?.some((i) => (i.quantity ?? 0) > 0)).toBe(true);
    const xp = early.state.character.xp;
    state = clearMobs(early.state);
    expect(cardIsClear(state.activeDungeon)).toBe(true);
    const freed = commitRescueAction(state, `Use the key and free ${captive.name}`);
    expect(freed.released).toBe(true);
    expect(freed.state.activeDungeon!.dwell!.find((d) => d.id === captive.id)!.status).toBe('released');
    expect(freed.state.character.xp).toBe(xp);
    expect(captiveAttackableByCardMob(freed.state, captive.id)).toBe(false);
    expect(dungeonCaptiveStillHeld(freed.state, captive.id)).toBe(false);
  });

  it('uses up each found key and keeps a jailer key', () => {
    const nodes = [node('r0', 'Stair'), node('a', 'Offering Vault'), node('b', 'Locked Strong-room')];
    let state = clearMobs(play(card(nodes)));
    const captives = state.activeDungeon!.dwell!.filter((d) => d.kind === 'captive');
    expect(captives.length).toBeGreaterThanOrEqual(2);
    const keys = state.activeDungeon!.rescue!.keys;
    if (keys[0]?.consumable) {
      state = { ...state, activeDungeon: { ...state.activeDungeon!, currentNodeId: captives[0]!.nodeId } };
      state = findRescueKey(state, keys[0]!.id);
      const one = commitRescueAction(state, `Use the key on ${captives[0]!.name}`);
      expect(one.state.activeDungeon!.dwell!.find((d) => d.id === captives[0]!.id)!.status).toBe('released');
      expect(one.state.inventory?.find((i) => i.id === `rescue-key:${keys[0]!.id}`)?.quantity).toBe(0);
      const other = commitRescueAction(one.state, `Use the key on ${captives[1]!.name}`);
      expect(other.state.activeDungeon!.dwell!.find((d) => d.id === captives[1]!.id)!.status).toBe('held');
    } else {
      const boss = state.activeDungeon!;
      boss.nodes[0]!.hidden!.mobs = [{ id: 'boss', name: 'Jailer', role: 'miniBoss', spawned: true, defeated: true, level: 2 }];
      state = { ...state, activeDungeon: boss };
      const got = commitRescueAction(state, 'look');
      expect(got.state.inventory?.some((i) => i.name === 'jailer key' && (i.quantity ?? 0) > 0)).toBe(true);
      state = { ...got.state, activeDungeon: { ...got.state.activeDungeon!, currentNodeId: captives[0]!.nodeId } };
      const first = commitRescueAction(state, `Use the jailer key on ${captives[0]!.name}`);
      const second = commitRescueAction(
        { ...first.state, activeDungeon: { ...first.state.activeDungeon!, currentNodeId: captives[1]!.nodeId } },
        `Use the jailer key on ${captives[1]!.name}`,
      );
      expect(second.state.inventory?.find((i) => i.name === 'jailer key')?.quantity).toBe(1);
      expect(second.state.activeDungeon!.dwell!.filter((d) => d.kind === 'captive' && d.status === 'released').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('still allows a low skill on a high lock, and pays lock-picking XP only when that hard pick commits', () => {
    expect(rescuePickChance(1, 7)).toBeCloseTo(1e-6);
    expect(rescuePickChance(8, 4)).toBeGreaterThan(0.5);
    let state = clearMobs(play(card([node('r0', 'Stair'), node('a', 'Offering Vault')])));
    const captive = state.activeDungeon!.dwell!.find((d) => d.kind === 'captive')!;
    const lock = state.activeDungeon!.rescue!.locks.find((l) => l.captiveId === captive.id)!;
    state = {
      ...state,
      activeDungeon: {
        ...state.activeDungeon!,
        currentNodeId: captive.nodeId,
        rescue: {
          ...state.activeDungeon!.rescue!,
          locks: state.activeDungeon!.rescue!.locks.map((l) => l.captiveId === captive.id ? { ...l, requiredLevel: 9, unpickable: false } : l),
        },
      },
    };
    const before = state.character.xp;
    const skillBefore = state.character.namedSkills?.find((s) => s.id === 'lockpicking')?.xp ?? 0;
    let rolled = state;
    let hit = false;
    for (let turn = 0; turn < 40 && !hit; turn++) {
      rolled = { ...state, turn, seed: `pick-${turn}` };
      const out = commitRescueAction(rolled, `Pick the lock holding ${captive.name}`);
      hit = out.released;
      if (hit) rolled = out.state;
    }
    if (hit) {
      expect(rolled.character.xp).toBe(before);
      expect(rolled.character.namedSkills?.find((s) => s.id === 'lockpicking')?.xp ?? 0).toBeGreaterThan(skillBefore);
    } else {
      expect(lock.requiredLevel).toBeGreaterThan(0);
      const failed = commitRescueAction({ ...state, seed: 'no', turn: 0 }, `Pick the lock holding ${captive.name}`);
      expect(failed.released).toBe(false);
      expect(failed.state.character.namedSkills?.find((s) => s.id === 'lockpicking')?.xp ?? 0).toBe(skillBefore);
    }
  });

  it('refuses a pick or a force on an unpickable lock and still opens it with its key', () => {
    let state = clearMobs(play(card([node('r0', 'Stair'), node('a', 'Offering Vault')])));
    const captive = state.activeDungeon!.dwell!.find((d) => d.kind === 'captive')!;
    state = {
      ...state,
      activeDungeon: {
        ...state.activeDungeon!,
        currentNodeId: captive.nodeId,
        rescue: {
          ...state.activeDungeon!.rescue!,
          requireHeal: false,
          locks: [{ captiveId: captive.id, requiredLevel: 4, unpickable: true, keyId: state.activeDungeon!.rescue!.keys[0]!.id }],
        },
      },
    };
    expect(commitRescueAction(state, `Pick the lock on ${captive.name}`).released).toBe(false);
    expect(commitRescueAction(state, `Force the lock on ${captive.name}`).note).toMatch(/cannot be forced/);
    state = findRescueKey(state, state.activeDungeon!.rescue!.keys[0]!.id);
    const opened = commitRescueAction(state, `Use the key and free ${captive.name}`);
    expect(opened.released).toBe(true);
  });

  it('requires a heal only when the quest stored requireHeal', () => {
    let state = clearMobs(play(card([node('r0', 'Stair'), node('a', 'Offering Vault')])));
    const captive = state.activeDungeon!.dwell!.find((d) => d.kind === 'captive')!;
    state = {
      ...state,
      activeDungeon: {
        ...state.activeDungeon!,
        currentNodeId: captive.nodeId,
        rescue: { ...state.activeDungeon!.rescue!, requireHeal: true },
      },
    };
    state = findRescueKey(state, state.activeDungeon!.rescue!.keys[0]!.id);
    const keyId = state.activeDungeon!.rescue!.keys[0]!.id;
    const locked = commitRescueAction(state, `Use the key and free ${captive.name}`);
    const staged = locked.state.activeDungeon!.dwell!.find((d) => d.id === captive.id)!;
    expect(staged.status).toBe('held');
    expect(staged.lockOpen).not.toBe(true);
    expect(locked.state.inventory?.find((i) => i.id === `rescue-key:${keyId}`)?.quantity).toBe(1);
    const healed = commitRescueAction(locked.state, `Heal ${captive.name}`);
    expect(healed.released).toBe(true);
    expect(healed.state.inventory?.find((i) => i.id === `rescue-key:${keyId}`)?.quantity).toBe(0);
    const after = commitRescueAction(healed.state, `I attack ${captive.name}`);
    expect(after.state.activeDungeon!.dwell!.find((d) => d.id === captive.id)!.status).toBe('released');
  });

  it('pays lock-picking XP only when a hard pick and the heal both commit the release', () => {
    let state = clearMobs(play(card([node('r0', 'Stair'), node('a', 'Offering Vault')])));
    const captive = state.activeDungeon!.dwell!.find((d) => d.kind === 'captive')!;
    state = {
      ...state,
      character: { ...state.character, namedSkills: [{ id: 'lockpicking', level: 1, xp: 0, rank: 0, uses: 0 }] },
      activeDungeon: {
        ...state.activeDungeon!,
        currentNodeId: captive.nodeId,
        rescue: {
          ...state.activeDungeon!.rescue!,
          requireHeal: true,
          locks: state.activeDungeon!.rescue!.locks.map((l) =>
            l.captiveId === captive.id ? { ...l, requiredLevel: 2, unpickable: false } : l
          ),
        },
      },
    };
    let staged = state;
    let found = false;
    for (let turn = 0; turn < 30 && !found; turn++) {
      const out = commitRescueAction({ ...state, turn, seed: `hard-${turn}` }, `Pick the lock holding ${captive.name}`);
      if (out.note === 'the pick failed') continue;
      staged = out.state;
      found = true;
    }
    expect(found).toBe(true);
    expect(staged.activeDungeon!.dwell!.find((d) => d.id === captive.id)!.status).toBe('held');
    expect(staged.character.namedSkills?.find((s) => s.id === 'lockpicking')?.xp ?? 0).toBe(0);
    const freed = commitRescueAction(staged, `Heal ${captive.name}`);
    expect(freed.released).toBe(true);
    expect(freed.state.character.namedSkills?.find((s) => s.id === 'lockpicking')?.xp ?? 0).toBeGreaterThan(0);
    expect(freed.state.character.xp).toBe(state.character.xp);
  });

  it('keeps a freed captive resolved, and loses one only on committed harm', () => {
    let state = clearMobs(play(card([node('r0', 'Stair'), node('a', 'Offering Vault')])));
    const captive = state.activeDungeon!.dwell!.find((d) => d.kind === 'captive')!;
    state = {
      ...state,
      activeDungeon: { ...state.activeDungeon!, currentNodeId: captive.nodeId, rescue: { ...state.activeDungeon!.rescue!, requireHeal: false } },
    };
    state = findRescueKey(state, state.activeDungeon!.rescue!.keys[0]!.id);
    const freed = commitRescueAction(state, `Free ${captive.name}`).state;
    const left = markEscortOut(freed, captive.id);
    expect(left.activeDungeon!.dwell!.find((d) => d.id === captive.id)!.status).toBe('out');
    const harmed = commitRescueAction(
      { ...state, activeDungeon: { ...state.activeDungeon!, dwell: state.activeDungeon!.dwell!.map((d) => d.id === captive.id ? { ...d, status: 'held' as const, lockOpen: false } : d) } },
      `Attack ${captive.name}`,
    );
    expect(harmed.state.activeDungeon!.dwell!.find((d) => d.id === captive.id)!.status).toBe('lost');
    const seated = seatRescueDwellers(freed);
    const talk = recordStanceFromAction(seated, `Ask ${captive.name} what happened`);
    expect(talk.activeDungeon?.dwell?.find((d) => d.id === captive.id)?.status).toBe('released');
  });

  it('does not seat a captive in a secret room until that secret is revealed', () => {
    const secret = node('s', 'Offering Vault', false, true);
    secret.hidden!.secrets = [];
    const entry = node('r0', 'Stair');
    entry.hidden!.secrets = [{ id: 'sec', clue: 'a loose panel', revealed: false, unlocksNodeId: 's' }];
    let state = play(card([entry, secret]));
    state = { ...state, activeDungeon: { ...state.activeDungeon!, currentNodeId: 's' }, currentLocation: 'Offering Vault' };
    const hidden = seatRescueDwellers(state);
    expect(hidden.npcMemories?.some((m) => m.location === 'Offering Vault' && m.roleHint === 'captive')).toBe(false);
    const revealed = {
      ...state,
      activeDungeon: {
        ...state.activeDungeon!,
        nodes: state.activeDungeon!.nodes.map((n) => n.id === 'r0'
          ? { ...n, hidden: { ...n.hidden!, secrets: [{ id: 'sec', clue: 'a loose panel', revealed: true, unlocksNodeId: 's' }] } }
          : n),
      },
    };
    const shown = seatRescueDwellers(revealed);
    expect(shown.npcMemories?.some((m) => m.roleHint === 'captive' && m.location === 'Offering Vault')).toBe(true);
  });

  it('builds a crypt card with a dwell list and does not put those people on the mob list', () => {
    const built = buildDungeonCard(createInitialState('Rescue crypt', 'dnd'), 'Old Crypt');
    expect(built.dwell).toBeDefined();
    const names = new Set((built.dwell ?? []).map((d) => d.name));
    const mobNames = built.nodes.flatMap((n) => n.hidden?.mobs ?? []).map((m) => m.name);
    expect(mobNames.some((n) => names.has(n))).toBe(false);
    const again = seedDungeonRescue(built, 'nope');
    expect(again.dwell).toEqual(built.dwell);
  });
});
