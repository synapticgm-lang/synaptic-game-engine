import type { GameState, Item, Rarity } from './types';
import { addItem, getItemValue, removeItem } from './inventory';
import { changeFor, formatCp, formatPurse, gainCoins, payCoins, purseGold, purseOf, shopPriceCp, srdSaleCp, usesPurse } from './rules/coins';

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

/** One shop transaction, written to the system log by the engine. */
export interface ShopReceipt {
  kind: 'buy' | 'sell';
  item: string;
  quantity: number;
  /** Copper paid (buy) or received (sell). */
  cp: number;
  text: string;
}

export function withShopReceipt(state: GameState, receipt: ShopReceipt): GameState {
  const entry = {
    id: `shop-${receipt.kind}-${state.log.length}-${state.turn ?? 0}`,
    turn: state.turn ?? 0,
    role: 'system' as const,
    content: receipt.text,
    timestamp: Date.now(),
    systemLog: [receipt.text],
  };
  return { ...state, log: [...state.log, entry] };
}

export interface BuyResult {
  ok: boolean;
  reason?: string;
  receipt?: ShopReceipt;
  newState?: GameState;
}

/** The buy price label: SRD coins on a tabletop sheet, whole gold elsewhere. Null when unlisted. */
export function buyPriceLabel(state: GameState, name: string, quantity = 1): string | null {
  const cp = shopPriceCp(name);
  if (cp == null) return null;
  const total = cp * Math.max(1, quantity);
  return usesPurse(state) ? formatCp(total) : `${Math.ceil(total / 100)} gold`;
}

const priceKeyId = (name: string) => {
  const chars = [...name.toLowerCase()].map((ch) => ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') ? ch : '-'));
  return chars.join('').split('-').filter(Boolean).join('-');
};

/**
 * Buy at the SRD list price (gold only). Tabletop pays from the purse, making change.
 * Other modes pay whole gold. Fails, changing nothing, when the price is unlisted, the buyer cannot pay, or the pack has no room.
 */
export function buyItem(state: GameState, name: string, quantity = 1): BuyResult {
  const cp = shopPriceCp(name);
  if (cp == null) return { ok: false, reason: `${name} is not for sale here.` };
  const qty = Math.max(1, Math.floor(quantity));
  const total = cp * qty;
  let paid: GameState;
  if (usesPurse(state)) {
    const left = payCoins(purseOf(state) ?? {}, total);
    if (!left) return { ok: false, reason: `Not enough coin for ${name}.` };
    const gold = purseGold(left);
    paid = { ...state, gold, purse: { coins: left, gold } };
  } else {
    const gp = Math.ceil(total / 100);
    if ((state.gold ?? 0) < gp) return { ok: false, reason: `Not enough gold for ${name}.` };
    paid = { ...state, gold: (state.gold ?? 0) - gp };
  }
  const added = addItem(paid, {
    id: `buy-${priceKeyId(name)}-${state.log.length}`,
    name,
    rarity: 'Common',
    quantity: qty,
    provenance: 'Bought from a merchant',
  });
  if (!added.ok) return { ok: false, reason: added.reason ?? 'No room to carry it.' };
  const priceText = usesPurse(state) ? formatCp(total) : `${Math.ceil(total / 100)} gold`;
  const receipt: ShopReceipt = {
    kind: 'buy',
    item: name,
    quantity: qty,
    cp: total,
    text: `Bought ${qty > 1 ? `${qty} ` : ''}${name} for ${priceText}.`,
  };
  return { ok: true, receipt, newState: withShopReceipt(added.state, receipt) };
}

export function sellItem(state: GameState, itemId: string): SellResult {
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item) return { ok: false, reason: 'Item not found.' };
  if (item.equipped) return { ok: false, reason: 'Cannot sell equipped items. Unequip first.' };

  const coins = srdSaleCoins(state, item);
  if (coins) {
    const cp = srdSaleCp(item.name, item.quantity ?? 1) ?? 0;
    const soldFor = cp > 0 ? formatPurse(coins) : 'nothing';
    const receipt: ShopReceipt = {
      kind: 'sell',
      item: item.name,
      quantity: item.quantity ?? 1,
      cp,
      text: `Sold ${item.name} for ${soldFor}.`,
    };
    const next = withShopReceipt(gainCoins(removeItem(state, itemId), coins), receipt);
    return { ok: true, goldGained: (next.gold ?? 0) - (state.gold ?? 0), soldFor, newState: next };
  }

  const price = getSellPrice(item);
  const next = removeItem(state, itemId);
  const paid = { ...next, gold: (next.gold ?? 0) + price };
  const receipt: ShopReceipt = {
    kind: 'sell',
    item: item.name,
    quantity: item.quantity ?? 1,
    cp: price * 100,
    text: `Sold ${item.name} for ${price} gold.`,
  };
  return {
    ok: true,
    goldGained: price,
    soldFor: `${price} gold`,
    newState: withShopReceipt(paid, receipt),
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
