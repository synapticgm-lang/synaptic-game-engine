/**
 * 28d — engine loot (LOOT-RESEARCH.md): source profiles, 5e treasure with dice (D&D), rarity-only LitRPG,
 * no duplicate Legendary, 80% class fit, shared difficulty table.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { rollLootRarityWithPity } from './dungeonSeed';
import { simulateCombat } from './combat';
import { milestoneXp, LITRPG_MILESTONE_XP } from './xpRules';
import {
  LEGENDARY_POOL,
  LOOT_PROFILES,
  chestProfileForGrade,
  classFitCategories,
  profileForEncounter,
  rollLoot,
  type LootProfile,
} from './lootTableRegistry';
import type { GameState, Item } from './types';

const RANK = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const rank = (r: string) => RANK.indexOf(r);

function st(mode: 'dnd' | 'litrpg', patch: Partial<GameState> = {}): GameState {
  const s = createInitialState('Ria', mode);
  return { ...s, gmStrictness: 'standard', lootPity: { byTier: {} }, ...patch } as GameState;
}

function many(profile: LootProfile, state: GameState, n: number, extra: { tier?: number; firstKill?: boolean } = {}) {
  return Array.from({ length: n }, (_, i) => rollLoot({ profile, state, seed: `t${i}`, ...extra }));
}

describe('28d loot engine', () => {
  it('profile table matches LOOT-RESEARCH §4', () => {
    expect(LOOT_PROFILES.mob).toMatchObject({ rolls: 1, noDropPct: 35 });
    expect(LOOT_PROFILES.miniBoss).toMatchObject({ rolls: 2, floor: 'Uncommon' });
    expect(LOOT_PROFILES.boss).toMatchObject({ rolls: 3, floor: 'Rare', firstKillFloor: 'Epic' });
    expect(LOOT_PROFILES.rareEncounter).toMatchObject({ tierBonus: 2, floor: 'Epic', resetsPity: true });
    expect([1, 2, 3].map(chestProfileForGrade)).toEqual(['chestBronze', 'chestSilver', 'chestGold']);
    expect(profileForEncounter({ encounterId: 'LITRPG-BOSS-001' })).toBe('boss');
    expect(profileForEncounter({ encounterId: 'n3_elite' })).toBe('miniBoss');
    expect(profileForEncounter({ name: 'Rat' })).toBe('mob');
  });

  it('mob has ~35% NoDrop; LitRPG shows items with rarity only', () => {
    const rs = many('mob', st('litrpg'), 1000);
    const none = rs.filter((r) => r.noDrop).length / rs.length;
    expect(none).toBeGreaterThan(0.29);
    expect(none).toBeLessThan(0.41);
    const drop = rs.find((r) => !r.noDrop)!;
    expect(drop.displayLines[0]).toMatch(/^\[(Common|Uncommon|Rare|Epic|Legendary)\] /);
    expect(rs.flatMap((r) => r.displayLines).some((l) => /\d+d\d+|d100/.test(l))).toBe(false);
    expect(drop.dice).toEqual([]);
  });

  it('boss guarantees Rare (Epic on first kill); mini-boss Uncommon; rare encounter Epic and resets pity', () => {
    for (const r of many('boss', st('litrpg'), 200)) {
      expect(r.items).toHaveLength(3);
      expect(Math.max(...r.items.map((i) => rank(i.rarity)))).toBeGreaterThanOrEqual(2);
    }
    for (const r of many('boss', st('litrpg'), 200, { firstKill: true })) {
      expect(Math.max(...r.items.map((i) => rank(i.rarity)))).toBeGreaterThanOrEqual(3);
    }
    for (const r of many('miniBoss', st('litrpg'), 200)) {
      expect(Math.max(...r.items.map((i) => rank(i.rarity)))).toBeGreaterThanOrEqual(1);
    }
    for (const r of many('rareEncounter', st('litrpg', { lootPity: { byTier: { 1: 12 } } }), 100)) {
      expect(rank(r.items[0]!.rarity)).toBeGreaterThanOrEqual(3);
      expect(r.nextPity).toBe(0);
    }
  });

  it('no duplicate Legendary: an owned pool salvages to Epic', () => {
    const inventory: Item[] = LEGENDARY_POOL.map((l, i) => ({ id: `L${i}`, name: l.name, rarity: 'Legendary', quantity: 1 }));
    const s = st('litrpg', { inventory } as Partial<GameState>);
    const items = many('boss', s, 300, { tier: 4 }).flatMap((r) => r.items);
    expect(items.some((i) => i.rarity === 'Legendary')).toBe(false);
    const fresh = many('boss', st('litrpg'), 300, { tier: 4 }).flatMap((r) => r.items);
    const legends = fresh.filter((i) => i.rarity === 'Legendary');
    expect(legends.length).toBeGreaterThan(0);
    for (const r of many('boss', st('litrpg'), 300, { tier: 4 })) {
      const names = r.items.filter((i) => i.rarity === 'Legendary').map((i) => i.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('about 80% of drops fit the build', () => {
    const base = st('litrpg');
    const s = { ...base, character: { ...base.character, weaponProficiencies: ['bow'] } } as GameState;
    expect(classFitCategories(s)).toEqual(['bow', 'armour']);
    const rs = many('boss', s, 400);
    const cats = rs.flatMap((r) => r.categories);
    const share = cats.filter((c) => c === 'bow' || c === 'armour').length / cats.length;
    expect(share).toBeGreaterThan(0.72);
    expect(share).toBeLessThan(0.9);
  });

  it('D&D: 5e individual treasure and hoard with every die shown', () => {
    const mob = rollLoot({ profile: 'mob', state: st('dnd'), seed: 'x', cr: '1/4' });
    expect(mob.gold).toBeGreaterThanOrEqual(3);
    expect(mob.gold).toBeLessThanOrEqual(18);
    expect(mob.displayLines[0]).toMatch(/^Individual treasure CR 0–4: 3d6 \(\d\+\d\+\d\) = \d+ gp$/);
    const mini = rollLoot({ profile: 'miniBoss', state: st('dnd'), seed: 'x', cr: 7 });
    expect(mini.dice).toHaveLength(2);
    expect(mini.dice[0]).toMatch(/2d8 \(\d\+\d\)×10 = \d+ gp/);
    const boss = many('boss', st('dnd'), 40, {});
    for (const r of boss) {
      expect(r.dice[0]).toMatch(/^Hoard CR 0–4: 2d4 \(\d\+\d\)×100 = \d+ gp$/);
      expect(r.gold % 100).toBe(0);
      expect(r.items.length).toBeLessThanOrEqual(3);
      expect(r.items.every((i) => ['Common', 'Uncommon', 'Rare'].includes(i.rarity))).toBe(true);
    }
    expect(boss.some((r) => r.dice.some((l) => /^d100 = \d+ → (Common|Uncommon|Rare): /.test(l)))).toBe(true);
  });

  it('difficulty table: Hard adds a boss roll and ×1.25 XP; Easy pity kicks in at 40 on T1', () => {
    const hard = rollLoot({ profile: 'boss', state: st('litrpg', { gmStrictness: 'hardcore' }), seed: 'h' });
    expect(hard.items).toHaveLength(4);
    const rng = () => 0.01;
    expect(rollLootRarityWithPity(1, rng, 40, 0.8).pityTriggered).toBe(true);
    expect(rollLootRarityWithPity(1, rng, 40, 1).pityTriggered).toBe(false);
    const base = LITRPG_MILESTONE_XP.significantPlace;
    expect(milestoneXp('litrpg', 'significantPlace', { strictness: 'hardcore' }).amount).toBe(Math.round(base * 1.25));
    expect(milestoneXp('litrpg', 'significantPlace', { strictness: 'forgiving' }).amount).toBe(base);
    const dnd = milestoneXp('dnd', 'significantPlace', { level: 1, strictness: 'hardcore' });
    expect(dnd.detail).toMatch(/× 1\.25 \(Hard\) = \d+/);
  });

  it('auto-fight victory rolls engine loot: D&D coins with dice, LitRPG keeps goldReward', () => {
    const enemy = { name: 'Rat', level: 1, hp: 1, maxHp: 1, attack: 1, defense: 0, armorClass: 1, xpReward: 10, goldReward: 7, cr: '1/8' };
    const d = simulateCombat(st('dnd'), enemy);
    if (d.victory) {
      expect(d.lootLines?.[0]).toMatch(/^Individual treasure CR 0–4: 3d6/);
      expect(d.goldGained).toBeGreaterThanOrEqual(3);
    }
    const l = simulateCombat(st('litrpg'), enemy);
    if (l.victory) {
      expect(l.goldGained).toBe(7);
      expect(l.lootLines).toEqual([]);
    }
  });
});
