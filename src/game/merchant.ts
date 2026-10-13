import type { GameState, Item, Rarity } from './types';
import { getItemValue, removeItem } from './inventory';
import { changeFor, formatPurse, gainCoins, srdSaleCp, usesPurse } from './rules/coins';

const RARITY_SELL_MULTIPLIER: Record<Rarity, number> = {
  Common: 0.25,
  Uncommon: 0.30,
  Rare: 0.35,
  Epic: 0.40,
  Legendary: 0.50,
};

export function getSellPrice(item: Item): number {
  const base = getItemValue(item);
  const multiplier = RARITY_SELL_MULTIPLIER[item.rarity] ?? 0.25;
  return Math.max(1, Math.round(base * multiplier));
}

export function getMaterialSellPrice(material: { rarity: Rarity; quantity: number }): number {
  const RARITY_MAT_VALUE: Record<Rarity, number> = {
    Common: 1,
    Uncommon: 3,
    Rare: 8,
    Epic: 25,
    Legendary: 80,
  };
  return (RARITY_MAT_VALUE[material.rarity] ?? 1) * material.quantity;
}

export interface SellResult {
  ok: boolean;
  reason?: string;
  goldGained?: number;
  /** What the player got, in words ("7 GP 5 SP"); the toast reads this. */
  soldFor?: string;
  newState?: GameState;
}

/** A tabletop sheet sells SRD gear for half its cost in exact coins; null where the salvage price applies. */
function srdSaleCoins(state: GameState, item: Item) {
  const cp = usesPurse(state) ? srdSaleCp(item.name, item.quantity ?? 1) : null;
  return cp == null ? null : changeFor(cp);
}

/** The price the Sell list shows; the same source sellItem pays from. */
export function sellPriceLabel(state: GameState, item: Item): string {
  const coins = srdSaleCoins(state, item);
  return coins ? formatPurse(coins) : `${getSellPrice(item)}g`;
}

export function sellItem(state: GameState, itemId: string): SellResult {
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item) return { ok: false, reason: 'Item not found.' };
  if (item.equipped) return { ok: false, reason: 'Cannot sell equipped items. Unequip first.' };

  const coins = srdSaleCoins(state, item);
  if (coins) {
    const next = gainCoins(removeItem(state, itemId), coins);
    return { ok: true, goldGained: (next.gold ?? 0) - (state.gold ?? 0), soldFor: formatPurse(coins), newState: next };
  }

  const price = getSellPrice(item);

  const next = removeItem(state, itemId);
  return {
    ok: true,
    goldGained: price,
    soldFor: `${price} gold`,
    newState: {
      ...next,
      gold: (next.gold ?? 0) + price,
    },
  };
}

export function sellMaterial(state: GameState, materialId: string, quantity: number): SellResult {
  const mat = state.materials.find((m) => m.id === materialId);
  if (!mat) return { ok: false, reason: 'Material not found.' };
  if (quantity <= 0 || quantity > mat.quantity) return { ok: false, reason: 'Invalid quantity.' };

  const price = getMaterialSellPrice({ rarity: mat.rarity, quantity });
  const remaining = mat.quantity - quantity;

  const newMaterials = remaining > 0
    ? state.materials.map((m) => m.id === materialId ? { ...m, quantity: remaining } : m)
    : state.materials.filter((m) => m.id !== materialId);

  return {
    ok: true,
    goldGained: price,
    newState: {
      ...state,
      materials: newMaterials,
      gold: (state.gold ?? 0) + price,
    },
  };
}
