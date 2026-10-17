import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { changeFor } from './rules/coins';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { resolveShopChip, shopChips } from './shopChips';
import { chipKindOf } from './chipCheck';
import { rollLoot } from './lootTableRegistry';
import { buyPriceLabel, LITRPG_BUY_GP, RPG_BUY_GP, modeBuyGp } from './merchant';

function withMerchant(mode: 'dnd' | 'litrpg' | 'rpg', gold = 200): GameState {
  const base = createInitialState('OPT6', mode);
  const loc = 'Market Square';
  const srd = mode === 'dnd' ? (base.character?.srd ?? ({} as never)) : undefined;
  const goldAmt = mode === 'dnd' ? Math.floor(gold) : gold;
  return {
    ...base,
    engineMode: mode,
    currentLocation: loc,
    character: { ...base.character, srd },
    gold: goldAmt,
    purse: mode === 'dnd' ? { coins: changeFor(goldAmt * 100), gold: goldAmt } : null,
    inventory: [],
    log: [],
    activeEncounter: undefined,
    npcMemories: [{
      npcId: 'm1', npcName: 'Hale', disposition: 'neutral', facts: [], lastSeenTurn: 0,
      location: loc, roleHint: 'merchant',
    }] as NpcMemory[],
  } as GameState;
}

describe('OPT-6 shops in every mode', () => {
  it('OPT6-1: LitRPG and RPG with a merchant offer Buy and Sell; prices from mode tables; tabletop SRD unchanged', () => {
    expect(Object.keys(LITRPG_BUY_GP).length).toBe(7);
    expect(Object.keys(RPG_BUY_GP).length).toBe(7);
    expect(modeBuyGp('litrpg', 'weapon', 'Common')).toBe(LITRPG_BUY_GP.weapon.Common);
    expect(modeBuyGp('rpg', 'consumable', 'Common')).toBe(RPG_BUY_GP.consumable.Common);

    const lit = withMerchant('litrpg', 200);
    const litBuys = shopChips(lit).filter((c) => c.kind === 'buy');
    expect(litBuys.length).toBeGreaterThan(0);
    for (const b of litBuys) {
      expect(b.label).toMatch(/^Buy .+ for \d+g$/);
      expect(chipKindOf(lit, b.label)).toBe('shop');
      const price = buyPriceLabel(lit, b.item);
      expect(price).toMatch(/^\d+g$/);
    }
    const litBag = {
      ...lit,
      inventory: [{
        id: 'w1', name: 'Worn Longsword', rarity: 'Common' as const, quantity: 1,
        itemType: 'weapon' as const, baseValue: LITRPG_BUY_GP.weapon.Common,
      }],
    };
    expect(shopChips(litBag).some((c) => c.kind === 'sell' && c.item === 'Worn Longsword')).toBe(true);

    const rpg = withMerchant('rpg', 200);
    expect(shopChips(rpg).some((c) => c.kind === 'buy')).toBe(true);
    const rpgBag = {
      ...rpg,
      inventory: [{
        id: 'k1', name: 'Belt knife', rarity: 'Common' as const, quantity: 1,
        itemType: 'weapon' as const, baseValue: RPG_BUY_GP.weapon.Common,
      }],
    };
    expect(shopChips(rpgBag).some((c) => c.kind === 'sell')).toBe(true);

    const tt = withMerchant('dnd', 50);
    const ttBuy = shopChips(tt).find((c) => c.kind === 'buy');
    expect(ttBuy).toBeTruthy();
    expect(ttBuy!.label).toMatch(/^Buy .+ for /);
    expect(ttBuy!.label).not.toMatch(/ for \d+g$/);
  });

  it('OPT6-2: every item from the loot builder has itemType and baseValue', () => {
    for (const mode of ['litrpg', 'rpg'] as const) {
      let found = 0;
      for (let i = 0; i < 20 && found === 0; i++) {
        const state = withMerchant(mode, 0);
        const roll = rollLoot({ profile: 'mob', state, seed: `opt6-${mode}-${i}`, tier: 2 });
        for (const item of roll.items) {
          expect(item.itemType, `${mode}:${item.name}`).toBeTruthy();
          expect(item.baseValue, `${mode}:${item.name}`).toBeTypeOf('number');
          expect(Number.isFinite(item.baseValue)).toBe(true);
          found += 1;
        }
      }
      expect(found, mode).toBeGreaterThan(0);
    }
    const dnd = withMerchant('dnd', 0);
    const chest = rollLoot({ profile: 'chestBronze', state: dnd, seed: 'opt6-dnd-chest', tier: 1 });
    expect(chest.items.length).toBeGreaterThan(0);
    for (const item of chest.items) {
      expect(item.itemType).toBeTruthy();
    }
  });

  it('OPT6-3: resolveShopChip changes gold and inventory; headless runner calls it', () => {
    const lit = withMerchant('litrpg', 200);
    const buy = shopChips(lit).find((c) => c.kind === 'buy')!;
    const beforeGold = lit.gold ?? 0;
    const bought = resolveShopChip(lit, buy.label)!;
    expect(bought.receipts[0]).toMatch(/^Bought /);
    expect(bought.state.inventory.some((i) => i.name === buy.item && i.itemType && i.baseValue != null)).toBe(true);
    expect(bought.state.gold ?? 0).toBeLessThan(beforeGold);

    const sellChip = shopChips(bought.state).find((c) => c.kind === 'sell');
    expect(sellChip).toBeTruthy();
    const sold = resolveShopChip(bought.state, sellChip!.label)!;
    expect(sold.receipts[0]).toMatch(/^Sold /);
    expect(sold.state.gold ?? 0).toBeGreaterThan(bought.state.gold ?? 0);

    const fate = readFileSync(resolve(__dirname, 'fateAutoplay.ts'), 'utf8');
    expect(fate).toMatch(/import \{ resolveShopChip \} from '\.\/shopChips'/);
    expect(fate).toMatch(/resolveShopChip\(arcState, playerInput\)/);
  });
});
