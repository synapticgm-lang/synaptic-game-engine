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
} from './dungeonCard';
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
  it('uses conservative seeded profiles, including a noncombat cache and a boss delve', () => {
    expect(dungeonCardProfile('s', 4, false).needBoss).toBe(true);
    expect(dungeonCardProfile('s', 1, true)).toMatchObject({ needBoss: true, mobChance: 0.55 });
    const quiet = dungeonCardProfile('quiet-seed', 1, false);
    expect(quiet.needBoss || quiet.needCache).toBe(true);
    if (!quiet.needBoss) expect(quiet).toMatchObject({ needCache: true, mobChance: 0 });

    const state = { ...createInitialState('The Summoned Pact', 'litrpg'), seed: 'variety-seed' };
    const cards = SITES.map((site) => buildDungeonCard(state, site));
    const shapes = cards.map(shape);
    expect(shapes.some((s) => s.boss)).toBe(true);
    expect(shapes.some((s) => !s.boss && s.mobs === 0 && s.loot > 0)).toBe(true);
    expect(new Set(shapes.map((s) => `${s.boss}:${s.mobs}:${s.loot}`)).size).toBeGreaterThan(1);

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

  it('a noncombat delve can be left without a fight and does not pay a clear', () => {
    const state = { ...createInitialState('The Summoned Pact', 'litrpg'), seed: 'variety-seed' };
    const card = SITES.map((site) => buildDungeonCard(state, site)).find((c) => shape(c).mobs === 0)!;
    expect(card).toBeTruthy();
    const here = card.nodes.find((n) => n.id === card.currentNodeId)!;
    const inside = { ...state, activeDungeon: card, currentLocation: here.name } as GameState;
    const chips = dungeonCardChoices(inside);
    expect(chips.some((c) => /Fight/.test(c))).toBe(false);
    expect(chips.some((c) => /Search|Open|Pick|Next unexplored|Head back/.test(c))).toBe(true);
    const left = advanceDungeonCard(inside, 'Head back to the exit');
    expect(left.receipts.join(' ')).toMatch(/climbed back out/);
    expect(left.receipts.join(' ')).not.toMatch(/every foe|dungeon-cleared|mini-boss/);
    const entered = left.receipts.filter((r) => /entered /.test(r));
    expect(entered.length).toBeLessThanOrEqual(1);
    const again = advanceDungeonCard(left.state, 'Head back to the exit');
    expect(again.receipts.filter((r) => /entered /.test(r))).toHaveLength(0);
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
    expect(shape(buildDungeonCard(state, site)).boss).toBe(true);
    const camp = buildDungeonCard(state, "Wren Ash's camp");
    const campMobs = camp.nodes.flatMap((n) => n.hidden?.mobs ?? []);
    expect(campMobs.some((m) => m.role === 'miniBoss')).toBe(true);
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
