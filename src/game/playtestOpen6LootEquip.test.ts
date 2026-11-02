/**
 * XP-D1 OPEN6 — loot itemLevel = creatureLevel ±2 via real rollLoot; equip gate on every path;
 * matrix must produce above-line drops and refuse them.
 */
import { describe, it, expect } from 'vitest';
import { canEquipAtLevel, equipBlockReason, EQUIP_LEVEL_MARGIN } from './rules/equipLevel';
import { equipItem, equipFromInput, levelUpGearNotices } from './gearEquip';
import { addItem } from './inventory';
import { WORLD_MAX_CREATURE_LEVEL } from './rules/wildlifeConfig';
import { rollLoot } from './lootTableRegistry';
import { createHashRng } from './seededRng';
import type { GameState, Item } from './types';

function baseState(level: number, inventory: Item[] = []): GameState {
  return {
    engineMode: 'litrpg',
    seed: 'open6-loot',
    turn: 20,
    currentLocation: 'Kitchen Saint Alley',
    character: { name: 'Jax', level, xp: 0, xpToNext: 100, hp: 30, maxHp: 30 },
    inventory,
    materials: [],
    containers: [
      {
        id: 'bag',
        name: 'Bag',
        capacity: 20,
        used: 0,
        storageType: 'General',
        kind: 'physical',
        equipped: true,
      },
    ],
    openingEstablishment: { complete: true },
  } as unknown as GameState;
}

function gear(itemLevel: number, id = 'g1'): Item {
  return {
    id,
    name: `Warden Blade ${itemLevel}`,
    rarity: 'Uncommon',
    quantity: 1,
    itemType: 'weapon',
    itemLevel,
    slot: 'Main Hand',
  };
}

/** Roll one creature kill's drops; return itemLevels (may be empty on no-drop). */
function killDropLevels(creatureLevel: number, seed: string, killIndex: number): number[] {
  const state = baseState(Math.max(1, creatureLevel - 2));
  const rng = createHashRng(seed, 'open6-loot-kill', String(creatureLevel), String(killIndex));
  // Force a drop: retry with shifted seed until we get at least one item with itemLevel, up to 8 tries.
  for (let attempt = 0; attempt < 8; attempt++) {
    const roll = rollLoot({
      profile: 'mob',
      state,
      seed: `${seed}:${creatureLevel}:${killIndex}:${attempt}`,
      creatureLevel,
      rng: attempt === 0 ? rng : createHashRng(seed, 'retry', String(attempt), String(killIndex)),
    });
    const levels = (roll.items ?? [])
      .map((i) => i.itemLevel)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    if (levels.length) return levels;
  }
  return [];
}

describe('OPEN6 loot itemLevel matrix', () => {
  it('every drop itemLevel is within creatureLevel ±2 (and >= 1) across creature 1..30 × 200 kills', () => {
    let checked = 0;
    let emptyKills = 0;
    for (let c = 1; c <= WORLD_MAX_CREATURE_LEVEL; c++) {
      for (let k = 0; k < 200; k++) {
        const levels = killDropLevels(c, 'matrix', k);
        if (!levels.length) {
          emptyKills += 1;
          continue;
        }
        for (const il of levels) {
          expect(il).toBeGreaterThanOrEqual(1);
          expect(il).toBeGreaterThanOrEqual(c - 2);
          expect(il).toBeLessThanOrEqual(c + 2);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
    // noDropPct 35% — empties allowed but not the whole matrix
    expect(emptyKills).toBeLessThan(WORLD_MAX_CREATURE_LEVEL * 200);
  });

  it('P=5 vs creature 12–14 yields a large share of above P+2 drops; every such drop refuses all equip paths', () => {
    const P = 5;
    const line = P + EQUIP_LEVEL_MARGIN;
    let above = 0;
    let totalDrops = 0;
    for (const c of [12, 13, 14]) {
      for (let k = 0; k < 200; k++) {
        for (const il of killDropLevels(c, 'above-line', k)) {
          totalDrops += 1;
          if (il > line) {
            above += 1;
            const item = gear(il, `drop-${c}-${k}-${il}`);
            expect(canEquipAtLevel(item, P, 'litrpg')).toBe(false);
            const s = baseState(P, [item]);
            expect(equipItem(s, item.id).ok).toBe(false);
            expect(equipItem(s, item.id).blockedLine).toMatch(/Requires level/i);
            const typed = equipFromInput(s, `I put on the ${item.name}`);
            expect(typed?.ok).toBe(false);
            expect(s.inventory.some((i) => i.id === item.id && !i.equipped)).toBe(true);
            const added = addItem(baseState(P), { ...item, equipped: true });
            expect(added.ok).toBe(true);
            expect(added.state.inventory.find((i) => i.id === item.id)?.equipped).toBeFalsy();
          }
        }
      }
    }
    expect(totalDrops).toBeGreaterThan(0);
    expect(above).toBeGreaterThan(0);
    // Creatures 12–14 vs line 7: nearly all itemLevels are above the line.
    expect(above / Math.max(1, totalDrops)).toBeGreaterThan(0.5);
  });

  it('above-line item becomes wearable after level-up with exactly one notice', () => {
    const item = gear(9, 'soon');
    let s = baseState(5, [item]);
    expect(equipItem(s, item.id).ok).toBe(false);
    let n = levelUpGearNotices(s);
    s = n.state;
    expect(n.notices.length).toBe(0);
    s = { ...s, character: { ...s.character, level: 7 } };
    n = levelUpGearNotices(s);
    expect(n.notices.length).toBe(1);
    expect(n.notices[0]).toMatch(/you can now wear/i);
    expect(equipItem(n.state, item.id).ok).toBe(true);
    expect(levelUpGearNotices(n.state).notices.length).toBe(0);
  });

  it('equipBlockReason copy is Requires level N (you are level P)', () => {
    expect(equipBlockReason({ itemLevel: 12, name: 'Axe' }, 5, 'litrpg')).toBe(
      'Requires level 12 (you are level 5)'
    );
  });
});
