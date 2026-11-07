/**
 * Seeded dungeon and town shape. No paid inference.
 * Rates in dungeonCardProfile and PLACE_POPULATION are tuning, not a balance proof.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  advanceDungeonCard,
  buildDungeonCard,
  dungeonCardChoices,
  dungeonCardProfile,
  dungeonRoomFacts,
  ensureDungeonCard,
  openDungeonCard,
} from './dungeonCard';
import { LAIR_BOUNDS, ordinaryPlacement, rollLairShape, shapeWithinBounds, type LairKind } from './lairArchetype';
import { applyQuestHooksFromLedger } from './questHooks';
import { PLACE_POPULATION, populationFor, seedTownsfolkHere } from './townsfolk';
import { createHashRng } from './seededRng';
import type { ActiveDungeonState, GameState, NpcMemory } from './types';

const SITES = [
  'Ash Lane Shed',
  'Quiet Cellar',
  'North Store',
  'Mill Loft',
  'Old Warehouse',
  'Brick Vault',
  'Cinder Mine',
  'Salt Cave',
  'Harbour Crypt',
  'West Keep',
  'Low Sewer',
  'Camp Storehouse',
];

function reach(card: ActiveDungeonState): Set<string> {
  const seen = new Set<string>([card.currentNodeId]);
  const queue = [card.currentNodeId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of card.nodes.find((n) => n.id === id)?.connections ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

function roomRole(card: ActiveDungeonState['nodes'][number]): string {
  return card.tags?.find((t) => t.startsWith('role:'))?.slice(5) ?? '';
}

function objectiveReachable(card: ActiveDungeonState): boolean {
  const open = reach(card);
  const holds = (id: string) => {
    const node = card.nodes.find((n) => n.id === id);
    if (!node) return false;
    return (
      (node.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss' || m.role === 'boss') ||
      (node.hidden?.lootables ?? []).length > 0
    );
  };
  if ([...open].some(holds)) return true;
  for (const id of open) {
    for (const secret of card.nodes.find((n) => n.id === id)?.hidden?.secrets ?? []) {
      if (secret.unlocksNodeId && holds(secret.unlocksNodeId)) return true;
    }
  }
  return false;
}

function shape(card: ActiveDungeonState) {
  const mobs = card.nodes.flatMap((n) => n.hidden?.mobs ?? []);
  const loot = card.nodes.flatMap((n) => n.hidden?.lootables ?? []);
  const traps = card.nodes.flatMap((n) => n.hidden?.traps ?? []);
  return {
    boss: mobs.some((m) => m.role === 'miniBoss' || m.role === 'boss'),
    mobs: mobs.length,
    loot: loot.length,
    traps: traps.length,
  };
}

describe('dungeon card variety', () => {
  it('uses archetype bounds, including a noncombat cache and a boss delve', () => {
    expect(dungeonCardProfile('s', 4, true).needBoss).toBe(true);
    const quiet = dungeonCardProfile('quiet-seed', 1, false);
    expect(quiet.needBoss || quiet.needCache).toBe(true);
    expect(quiet.mobChance).toBeGreaterThanOrEqual(0);
    expect(quiet.mobChance).toBeLessThanOrEqual(0.4);

    const state = { ...createInitialState('The Summoned Pact', 'litrpg'), seed: 'variety-seed' };
    const cards = SITES.map((site) => buildDungeonCard(state, site));
    const shapes = cards.map(shape);
    expect(shapes.some((s) => s.boss)).toBe(true);
    expect(shapes.some((s) => !s.boss)).toBe(true);
    expect(new Set(shapes.map((s) => `${s.boss}:${s.mobs}:${s.loot}`)).size).toBeGreaterThan(1);
    const emptyCard = Array.from({ length: 200 }, (_, i) =>
      buildDungeonCard({ ...state, seed: `quiet-${i}` }, 'Plain Shed', { lair: 'warehouse' })
    ).find((c) => shape(c).mobs === 0);
    expect(emptyCard).toBeTruthy();
    expect(shape(emptyCard!).loot).toBeGreaterThan(0);

    for (const card of cards) {
      const seen = reach(card);
      const goal = card.nodes.find(
        (n) =>
          seen.has(n.id) &&
          ((n.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss' || m.role === 'boss') ||
            (n.hidden?.lootables ?? []).length > 0)
      );
      expect(goal, card.dungeonName).toBeTruthy();
      expect(buildDungeonCard(state, card.siteName)).toEqual(card);
      expect(dungeonRoomFacts({ ...state, activeDungeon: card, currentLocation: card.nodes[0]!.name } as GameState)).not.toMatch(/hidden door|loose stone|false panel/i);
    }
  });

  it('a noncombat delve can be finished without a fight and does not pay a clear', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const card = Array.from({ length: 200 }, (_, i) =>
      buildDungeonCard({ ...base, seed: `quiet-${i}` }, 'Plain Shed', { lair: 'warehouse' })
    ).find((c) => shape(c).mobs === 0)!;
    const here = card.nodes.find((n) => n.id === card.currentNodeId)!;
    let state = { ...base, activeDungeon: card, currentLocation: here.name } as GameState;
    const log: string[] = [];
    let opened = false;
    for (let step = 0; step < 24 && state.activeDungeon && !opened; step++) {
      const chips = dungeonCardChoices(state);
      expect(chips.some((c) => /Fight/.test(c))).toBe(false);
      expect(chips.some((c) => /Head back/.test(c))).toBe(true);
      const open = chips.find((c) => /^Open the /.test(c));
      const choice = open ?? (chips.includes('Next unexplored room') ? 'Next unexplored room' : 'Head back to the exit');
      const turn = advanceDungeonCard(state, choice);
      state = turn.state;
      log.push(...turn.receipts);
      if (open) opened = true;
    }
    expect(opened).toBe(true);
    if (state.activeDungeon) {
      const left = advanceDungeonCard(state, 'Head back to the exit');
      state = left.state;
      log.push(...left.receipts);
    }
    const text = log.join(' ');
    expect(text).toMatch(/opened the/);
    expect(text).toMatch(/climbed back out/);
    expect(text).not.toMatch(/every foe|dungeon-cleared|mini-boss/);
    expect((state.sandboxAwardKeys ?? []).filter((k) => k.startsWith('dungeon-entry:'))).toEqual(['dungeon-entry:Plain Shed']);
    const back = openDungeonCard(state, 'Plain Shed');
    expect(back.activeDungeon?.nodes.some((n) => (n.hidden?.lootables ?? []).some((l) => l.opened))).toBe(true);
    const again = advanceDungeonCard(back, 'Head back to the exit');
    expect((again.state.sandboxAwardKeys ?? []).filter((k) => k.startsWith('dungeon-entry:'))).toEqual(['dungeon-entry:Plain Shed']);
    expect(again.receipts.filter((r) => /entered /.test(r))).toHaveLength(0);
    expect(again.receipts.join(' ')).not.toMatch(/dungeon-cleared/);
  });

  it('a crypt clear, even without the hub name in the sentence, still gets a boss', () => {
    const site = 'Cathedral Undercroft';
    const state = {
      ...createInitialState('The Summoned Pact', 'litrpg'),
      seed: 'crypt-clear',
      quests: [
        {
          id: 'meat-shield',
          name: 'Meat Shield',
          status: 'active',
          revealed: true,
          objectives: [
            {
              id: 'c',
              description: 'Clear the infestation in the cathedral’s lower crypts to prove your baseline stats.',
              completed: false,
            },
          ],
        },
      ],
    } as GameState;
    const crypt = buildDungeonCard(state, site);
    expect(shape(crypt).boss).toBe(true);
    const bossRoom = crypt.nodes.find((n) => (n.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss' || m.role === 'boss'))!;
    const atBoss = {
      ...state,
      activeDungeon: { ...crypt, currentNodeId: bossRoom.id },
      currentLocation: bossRoom.name,
    } as GameState;
    expect(dungeonCardChoices(atBoss).some((c) => /Fight/.test(c))).toBe(true);
    const camp = buildDungeonCard(state, "Wren Ash's camp");
    const campMobs = camp.nodes.flatMap((n) => n.hidden?.mobs ?? []);
    expect(campMobs.some((m) => m.role === 'miniBoss')).toBe(true);
    const ordered = buildDungeonCard(
      {
        ...state,
        quests: [
          {
            id: 'named-boss',
            name: 'Named Boss',
            status: 'active',
            revealed: true,
            objectives: [{ id: 'b', description: 'Defeat the boss in Plain Shed', completed: false }],
          },
        ],
      } as GameState,
      'Plain Shed',
      { lair: 'warehouse' }
    );
    expect(shape(ordered).boss).toBe(true);
  });

  it('a lieutenant is not the floor boss and does not finish the boss objective', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const card = Array.from({ length: 40 }, (_, i) =>
      buildDungeonCard({ ...base, seed: `lt-${i}` }, 'Plain Shed', { lair: 'mine' })
    ).find((c) => {
      const boss = c.nodes.find((n) => roomRole(n) === 'boss');
      const other = c.nodes.find(
        (n) => n.id !== boss?.id && (n.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss')
      );
      return !!boss && !!other;
    });
    expect(card).toBeTruthy();
    const boss = card!.nodes.find((n) => roomRole(n) === 'boss')!;
    const other = card!.nodes.find((n) => n.id !== boss.id && (n.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss'))!;
    const lieutenant = other.hidden!.mobs.find((m) => m.role === 'miniBoss')!;
    const quests = [
      {
        id: 'named-boss',
        name: 'Named Boss',
        status: 'active' as const,
        revealed: true,
        objectives: [{ id: 'b', description: 'Defeat the boss in Plain Shed', completed: false }],
      },
    ];
    const standing = {
      ...base,
      quests,
      activeDungeon: { ...card!, currentNodeId: other.id },
      currentLocation: other.name,
    } as GameState;
    const fought = advanceDungeonCard(standing, 'look', [`Encounter cleared: ${lieutenant.name} (victory)`]);
    expect(fought.receipts.join(' ')).not.toMatch(/mini-boss|Floor \d+ cleared/);
    const combat = {
      weaponName: 'sword',
      dealt: 1,
      received: 0,
      enemyName: lieutenant.name,
      enemyHpBefore: 10,
      enemyHpAfter: 0,
      enemyDead: true,
      enemyActs: false,
      enemyActReason: '',
      playerHpAfter: 10,
      xp: 0,
    };
    expect(applyQuestHooksFromLedger(quests, standing, 1, { combat })[0]?.objectives?.[0]?.completed).toBe(false);
    const atBoss = {
      ...fought.state,
      activeDungeon: { ...fought.state.activeDungeon!, currentNodeId: boss.id },
      currentLocation: boss.name,
    } as GameState;
    const bossMob = boss.hidden!.mobs.find((m) => m.role === 'miniBoss')!;
    expect(
      applyQuestHooksFromLedger(quests, { ...standing, activeDungeon: card! }, 1, { combat: { ...combat, enemyName: bossMob.name } })[0]
        ?.objectives?.[0]?.completed
    ).toBe(true);
    const finished = advanceDungeonCard(atBoss, 'look', [`Encounter cleared: ${bossMob.name} (victory)`]);
    expect(finished.receipts.join(' ')).toMatch(/mini-boss/);
    expect(finished.receipts.join(' ')).toMatch(/Floor 1 cleared/);
  });

  it('links population, threat and treasure across many seeds', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const kinds: LairKind[] = ['hoard', 'mine', 'sewer', 'cave', 'crypt', 'warehouse', 'engine', 'keep', 'any'];
    const mineSigs = new Set<string>();
    const hoardTrash: number[] = [];
    const mineTrash: number[] = [];
    let mineWithoutBoss = false;
    for (const kind of kinds) {
      for (let i = 0; i < 20; i++) {
        const saveSeed = `bounds-${kind}-${i}`;
        const cardSeed = `${saveSeed}:Plain Shed`;
        const rolled = rollLairShape({
          kind,
          rng: createHashRng(cardSeed, 'lair-shape'),
          danger: 2,
        });
        expect(shapeWithinBounds(rolled)).toBe(true);
        const card = buildDungeonCard(
          { ...base, seed: saveSeed, character: { ...base.character, level: 9 } },
          'Plain Shed',
          { lair: kind }
        );
        const ordinary = card.nodes.filter((n) => roomRole(n) === 'room' && !n.tags?.includes('landing'));
        const bossNode = card.nodes.find((n) => roomRole(n) === 'boss');
        expect(Boolean(bossNode), `${kind}-${i}`).toBe(rolled.boss);
        const placed = ordinaryPlacement(rolled, ordinary.length);
        const lieutenants = ordinary.flatMap((n) => n.hidden?.mobs ?? []).filter((m) => m.role === 'miniBoss');
        const trash = card.nodes.flatMap((n) => n.hidden?.mobs ?? []).filter((m) => m.role === 'trash');
        expect(lieutenants.length).toBe(rolled.boss ? placed.lieutenant : 0);
        expect(trash.length).toBe(placed.trash + (rolled.boss ? 0 : placed.lieutenant));
        expect(card.areaLevel).toBe(9);
        const side = card.nodes
          .filter((n) => n.id !== bossNode?.id)
          .flatMap((n) => n.hidden?.lootables ?? []);
        const sideRoomCount = card.nodes.filter((n) => n.id !== bossNode?.id && ['cache', 'secret', 'room'].includes(roomRole(n)) && !n.tags?.includes('landing')).length;
        expect(side.length).toBe(Math.min(rolled.sideChests, sideRoomCount));
        expect(side.every((l) => l.loot.grade === rolled.sideGrade)).toBe(true);
        if (bossNode) {
          const bossChest = (bossNode.hidden?.lootables ?? []).find((l) => l.loot.grade === rolled.bossGrade);
          expect(bossChest).toBeTruthy();
          expect((bossNode.hidden?.mobs ?? []).every((m) => m.level === card.dangerTier + 1)).toBe(true);
        }
        const mobs = card.nodes.flatMap((n) => n.hidden?.mobs ?? []);
        expect(mobs.every((m) => m.level !== 9)).toBe(true);
        expect(trash.every((m) => m.level === card.dangerTier)).toBe(true);
        expect(lieutenants.every((m) => m.level === card.dangerTier)).toBe(true);
        for (const node of card.nodes) {
          expect(node.hidden?.doorLock).toBeUndefined();
          for (const loot of node.hidden?.lootables ?? []) expect(loot.lock).toBeUndefined();
          for (const secret of node.hidden?.secrets ?? []) {
            if (secret.unlocksNodeId) expect(card.nodes.some((n) => n.id === secret.unlocksNodeId)).toBe(true);
          }
        }
        expect(objectiveReachable(card), `${kind}-${i}`).toBe(true);
        expect(dungeonRoomFacts({ ...base, activeDungeon: card, currentLocation: card.nodes[0]!.name } as GameState)).not.toMatch(
          /hidden door|loose stone|false panel/i
        );
        if (kind === 'mine') {
          mineSigs.add(`${rolled.boss}:${trash.length}:${side.length}`);
          mineTrash.push(trash.length);
          if (!rolled.boss) mineWithoutBoss = true;
        }
        if (kind === 'hoard') hoardTrash.push(trash.length);
      }
    }
    expect(mineWithoutBoss).toBe(true);
    expect(mineSigs.size).toBeGreaterThan(1);
    expect(new Set(hoardTrash).size).toBeGreaterThan(1);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(hoardTrash)).toBeLessThan(mean(mineTrash));
    expect(LAIR_BOUNDS.hoard.bossGrade).toBe(3);
    expect(LAIR_BOUNDS.mine.bossGrade).toBe(2);

    const named = buildDungeonCard({ ...base, seed: 'dragon-name', character: { ...base.character, level: 8 } }, 'Dragon Hoard');
    const lair = buildDungeonCard({ ...base, seed: 'dragon-lair', character: { ...base.character, level: 8 } }, "Dragon's Lair");
    for (const card of [named, lair]) {
      expect(card.nodes.flatMap((n) => n.hidden?.lootables ?? []).some((l) => (l.loot.grade ?? 1) >= 3)).toBe(false);
    }
  });

  it('a hoard concentrates the rich chest and does not copy the visitor level', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = { ...base, seed: 'hoard', character: { ...base.character, level: 12 } };
    const cards = Array.from({ length: 16 }, (_, i) =>
      buildDungeonCard({ ...state, seed: `hoard-${i}` }, 'Plain Shed', { lair: 'hoard' })
    );
    const trashCounts = new Set<number>();
    for (const card of cards) {
      const ordinary = card.nodes.filter((n) => !(n.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss') && n.id !== card.currentNodeId);
      const trash = card.nodes.flatMap((n) => n.hidden?.mobs ?? []).filter((m) => m.role === 'trash');
      trashCounts.add(trash.length);
      expect(trash.every((m) => m.level === card.dangerTier)).toBe(true);
      expect(trash.some((m) => m.level === 12)).toBe(false);
      const bossNode = card.nodes.find((n) => (n.hidden?.mobs ?? []).some((m) => m.role === 'miniBoss'));
      expect(bossNode).toBeTruthy();
      expect(bossNode!.hidden!.mobs.find((m) => m.role === 'miniBoss')!.level).toBe(card.dangerTier + 1);
      const bossChest = bossNode!.hidden!.lootables.find((l) => l.loot.grade === 3);
      expect(bossChest).toBeTruthy();
      for (const node of card.nodes) {
        if (node.id === bossNode!.id) continue;
        expect(node.hidden?.lootables.some((l) => (l.loot.grade ?? 1) >= 3)).toBe(false);
      }
      expect(trash.length).toBeLessThanOrEqual(Math.ceil(ordinary.length * 0.25) + 1);
    }
    expect(trashCounts.size).toBeGreaterThan(1);
  });

  it('reuses a stored card and does not rescale an older foe', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const first = ensureDungeonCard({ ...base, seed: 'stored-card' }, 'Plain Shed');
    const second = ensureDungeonCard({ ...first.state, character: { ...first.state.character, level: 20 } }, 'Plain Shed');
    expect(second.card).toEqual(first.card);
    const old = first.card;
    const aged = {
      ...old,
      nodes: old.nodes.map((n) =>
        n.hidden?.mobs?.length
          ? { ...n, hidden: { ...n.hidden, mobs: n.hidden.mobs.map((m) => ({ ...m, level: 9 })) } }
          : n
      ),
    };
    const opened = openDungeonCard(
      {
        ...base,
        character: { ...base.character, level: 1 },
        places: [{ id: 'plain-shed', name: 'Plain Shed', allowsDungeon: true, dungeonCard: aged, arcStatus: 'open', mapScale: 'street' }],
        currentLocation: 'Plain Shed',
      } as GameState,
      'Plain Shed'
    );
    const levels = (opened.activeDungeon?.nodes ?? []).flatMap((n) => n.hidden?.mobs ?? []).map((m) => m.level);
    expect(levels.every((n) => n === 9)).toBe(true);
  });
});

describe('place population', () => {
  it('follows place capacity, keeps a witness, and reloads the same people', () => {
    expect(PLACE_POPULATION.town).toEqual({ min: 1, max: 3 });
    expect(PLACE_POPULATION.cell.max).toBe(1);
    expect(PLACE_POPULATION.dungeon).toEqual({ min: 0, max: 0 });
    const counts = ['Greyhollow Inn', 'Mill Camp', 'Salt Road', 'Lock-up'].map((place) =>
      populationFor(
        place.includes('Inn') ? 'inn' : place.includes('Camp') ? 'camp' : place.includes('Road') ? 'road' : 'cell',
        createHashRng('townsfolk', 'summoned-pact', place.toLowerCase())
      )
    );
    expect(counts[0]).toBeGreaterThanOrEqual(1);
    expect(new Set(counts).size).toBeGreaterThan(1);

    const witness: NpcMemory = {
      npcId: 'witness-wren',
      npcName: 'Witness Wren',
      disposition: 'neutral',
      facts: ['Bible roster: saw the fire'],
      lastSeenTurn: 1,
      location: 'Greyhollow Inn',
    };
    const base = {
      turn: 3,
      currentLocation: 'Midnight Well',
      campaignBibleId: 'cursed-keep',
      seed: 'pop-seed',
      npcMemories: [witness],
      openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
      sceneFacts: {},
      inventory: [],
      log: [],
    } as unknown as GameState;
    const opened = seedTownsfolkHere(base);
    const inn = seedTownsfolkHere({ ...opened, turn: 5, currentLocation: 'Greyhollow Inn' });
    const added = inn.npcMemories!.filter((m) => m.sheet);
    expect(added.length).toBeGreaterThanOrEqual(PLACE_POPULATION.inn.min);
    expect(added.length).toBeLessThanOrEqual(PLACE_POPULATION.inn.max);
    expect(inn.npcMemories!.some((m) => m.npcId === 'witness-wren')).toBe(true);
    expect(seedTownsfolkHere({ ...inn, turn: 6 }).npcMemories).toEqual(inn.npcMemories);
    expect(seedTownsfolkHere(base).npcMemories).toEqual(opened.npcMemories);
  });
});
