import { describe, expect, it } from 'vitest';
import { changeFor, purseCp, purseOf, shopPriceCp, srdSaleCp, ITEM_COST_CP } from './rules/coins';
import { srdGearCostCp } from './rules/srdGear';
import { buyItem, sellItem } from './merchant';
import { createInitialState } from './defaults';
import type { GameState } from './types';

/** A tabletop sheet character with a purse of `cp` copper held as the fewest coins. */
function ttState(cp: number): GameState {
  const base = createInitialState('Shop test', 'dnd');
  const coins = changeFor(cp);
  const gold = Math.floor(cp / 100);
  return {
    ...base,
    engineMode: 'dnd',
    character: { ...base.character, srd: base.character?.srd ?? ({} as never) },
    gold,
    purse: { coins, gold },
    inventory: [],
    log: [],
  } as GameState;
}

describe('shop-a: SRD 5.2.1 prices (one lookup)', () => {
  it.each([
    ['Rope', 100],
    ['Rations', 50],
    ['Longsword', 1500],
    ['Torch', 1],
    ['Potion of Healing', 5000],
    ["Thieves' Tools", 2500],
    ['Thieves’ Tools', 2500],
    ['Crowbar', 200],
    ['Lamp', 50],
    ['Camel', 5000],
  ])('%s costs %i cp', (name, cp) => {
    expect(shopPriceCp(name)).toBe(cp);
  });
  it('weapons and armour still come from srdGear (no duplicate rows win)', () => {
    for (const [name, cp] of Object.entries(srdGearCostCp())) expect(ITEM_COST_CP[name]).toBe(cp);
  });
  it('unlisted items have no price', () => {
    expect(shopPriceCp('Moonfish Lure of Zorb')).toBeNull();
  });
});

describe('shop-a: selling pays exactly half in smaller coins (John 16 Oct 07:32)', () => {
  const cases: Array<[number, number]> = [[500, 250], [10, 5], [3, 1], [1, 0]];
  it.each(cases)('list %i cp sells for %i cp', (list, half) => {
    const name = `Test item ${list}`;
    (ITEM_COST_CP as Record<string, number>)[name] = list;
    expect(srdSaleCp(name)).toBe(half);
    expect(half * 2).toBeLessThanOrEqual(list);
    expect(list - half * 2).toBeLessThan(2);
  });
  it('5 GP sells for 2 GP 5 SP in coins', () => {
    expect(changeFor(250)).toMatchObject({ gp: 2, sp: 5, cp: 0 });
    expect(changeFor(5)).toMatchObject({ gp: 0, sp: 0, cp: 5 });
  });
  it('a real sale adds exactly half to the purse and logs one receipt', () => {
    let s = ttState(0);
    s = { ...s, inventory: [{ id: 'r1', name: 'Crowbar', rarity: 'Common', quantity: 1 }] } as GameState;
    const r = sellItem(s, 'r1');
    expect(r.ok).toBe(true);
    expect(purseCp(purseOf(r.newState!)!)).toBe(100);
    expect(r.newState!.inventory.find((i) => i.id === 'r1')).toBeUndefined();
    expect(r.newState!.log.filter((e) => e.role === 'system' && /Sold Crowbar/.test(e.content))).toHaveLength(1);
  });
});

describe('shop-a: buying', () => {
  it('buy deducts the list price, making change, and adds the item', () => {
    const r = buyItem(ttState(500), 'Rations');
    expect(r.ok).toBe(true);
    expect(purseCp(purseOf(r.newState!)!)).toBe(450);
    expect(r.newState!.inventory.some((i) => i.name === 'Rations')).toBe(true);
    expect(r.receipt?.text).toBe('Bought Rations for 5 SP.');
  });
  it('cannot buy without enough coin; nothing changes', () => {
    const s = ttState(40);
    const r = buyItem(s, 'Rations');
    expect(r.ok).toBe(false);
    expect(r.newState).toBeUndefined();
  });
  it('unlisted goods are not for sale', () => {
    expect(buyItem(ttState(10000), 'Moonfish Lure of Zorb').ok).toBe(false);
  });
});
