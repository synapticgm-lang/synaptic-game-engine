import type { GameState, Item, Rarity } from './types';
import { getItemValue, removeItem } from './inventory';

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
  newState?: GameState;
}

export function sellItem(state: GameState, itemId: string): SellResult {
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item) return { ok: false, reason: 'Item not found.' };
  if (item.equipped) return { ok: false, reason: 'Cannot sell equipped items. Unequip first.' };

  const price = getSellPrice(item);

  const next = removeItem(state, itemId);
  return {
    ok: true,
    goldGained: price,
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
