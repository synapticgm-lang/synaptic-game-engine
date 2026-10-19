import type { GameState, Item, ItemType, NpcMemory, Rarity } from './types';
import srdShopGear from '../data/srd/srdShopGear.json';
import modeShopData from '../data/modeShopPrices.json';
import { presentNpcRecords } from './npcRecords';
import { addItem, getItemValue, removeItem } from './inventory';
import { changeFor, formatCp, formatPurse, gainCoins, payCoins, purseGold, purseOf, shopPriceCp, srdSaleCp, usesPurse } from './rules/coins';
import { hpRecoveryConfig } from './rules/hpRecoveryConfig';
import { stampHealingPotionFields } from './hpRecovery';

/** OPT-6: LitRPG/RPG list prices by itemType×rarity (gold). Tabletop keeps SRD 5.2.1 Equipment / Selling Treasure. */
export type ShopMode = 'litrpg' | 'rpg';
type PriceGrid = Record<ItemType, Record<Rarity, number>>;
export interface ModeStockRow { name: string; itemType: ItemType; rarity: Rarity }
const MODE_DATA = modeShopData as Record<ShopMode, { buyGp: PriceGrid; stock: ModeStockRow[] }>;
export const LITRPG_BUY_GP: PriceGrid = MODE_DATA.litrpg.buyGp;
export const RPG_BUY_GP: PriceGrid = MODE_DATA.rpg.buyGp;
export const MODE_SHOP_STOCK: Record<ShopMode, ModeStockRow[]> = { litrpg: MODE_DATA.litrpg.stock, rpg: MODE_DATA.rpg.stock };
export function modeBuyGp(mode: string | undefined, itemType: ItemType | undefined, rarity: Rarity): number | null {
  if ((mode !== 'litrpg' && mode !== 'rpg') || !itemType) return null;
  const gp = MODE_DATA[mode].buyGp[itemType]?.[rarity];
  return typeof gp === 'number' ? gp : null;
}

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

/**
 * The merchant at the player's place. Presence comes from the NPC records and the role `merchant`.
 * Null when nobody here trades.
 */
export function merchantHere(state: GameState): NpcMemory | null {
  return presentNpcRecords(state).find((m) => {
    const job = m.roleHint ?? m.sheet?.job;
    return job === 'merchant';
  }) ?? null;
}

export interface StockRow { name: string; cp: number; section: string }

/**
 * What a town merchant stocks: tools, adventuring gear and food. Mounts, ships and services stay off this list.
 * The copper price is shopPriceCp, the same lookup buyItem uses.
 */
export function merchantStock(): StockRow[] {
  const data = srdShopGear as unknown as Record<string, Array<{ name: string; cp: number }>>;
  const rows: StockRow[] = [];
  for (const section of Object.keys(data)) {
    if (section !== 'tools' && section !== 'adventuring_gear' && section !== 'food_drink_lodging') continue;
    for (const row of data[section] ?? []) {
      const cp = shopPriceCp(row.name);
      if (cp == null || typeof row.name !== 'string') continue;
      rows.push({ name: row.name, cp, section });
    }
  }
  return rows;
}

/** Whether the player can pay this copper price with the same coins buyItem would use. */
export function canAfford(state: GameState, cp: number): boolean {
  if (usesPurse(state)) return payCoins(purseOf(state) ?? {}, cp) != null;
  return (state.gold ?? 0) >= Math.ceil(cp / 100);
}

/** The Merchant window opens in tabletop only with a merchant here; other modes keep their open trading post. */
export function canOpenMerchant(state: GameState): boolean {
  return state.engineMode !== 'dnd' || merchantHere(state) != null;
}

export interface BuyResult {
  ok: boolean;
  reason?: string;
  receipt?: ShopReceipt;
  newState?: GameState;
}

/** The buy price label: SRD coins on a tabletop sheet; LitRPG/RPG use modeShopPrices gold. Null when unlisted. */
export function buyPriceLabel(state: GameState, name: string, quantity = 1): string | null {
  const qty = Math.max(1, quantity);
  if (state.engineMode === 'litrpg' || state.engineMode === 'rpg') {
    const key = name.trim().toLowerCase();
    let row: ModeStockRow | null = null;
    for (const r of MODE_SHOP_STOCK[state.engineMode]) {
      if (r.name.toLowerCase() === key) { row = r; break; }
    }
    if (!row) return null;
    const healCfg = hpRecoveryConfig(state.engineMode);
    const gp =
      healCfg && key === healCfg.potionName.toLowerCase()
        ? healCfg.potionPriceGp
        : modeBuyGp(state.engineMode, row.itemType, row.rarity);
    if (gp == null || gp <= 0) return null;
    return `${gp * qty}g`;
  }
  const cp = shopPriceCp(name);
  if (cp == null) return null;
  const total = cp * qty;
  return usesPurse(state) ? formatCp(total) : `${Math.ceil(total / 100)} gold`;
}

const priceKeyId = (name: string) => {
  const chars = [...name.toLowerCase()].map((ch) => ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') ? ch : '-'));
  return chars.join('').split('-').filter(Boolean).join('-');
};

/**
 * Buy at list price. Tabletop: SRD 5.2.1 Equipment cost from the purse (Making Change).
 * LitRPG / Story RPG: modeShopPrices gold by itemType × rarity. Fails without changing state when unlisted, unpaid, or no room.
 */
export function buyItem(state: GameState, name: string, quantity = 1): BuyResult {
  const qty = Math.max(1, Math.floor(quantity));
  if (state.engineMode === 'litrpg' || state.engineMode === 'rpg') {
    const key = name.trim().toLowerCase();
    let row: ModeStockRow | null = null;
    for (const r of MODE_SHOP_STOCK[state.engineMode]) {
      if (r.name.toLowerCase() === key) { row = r; break; }
    }
    if (!row) return { ok: false, reason: `${name} is not for sale here.` };
    const healCfg = hpRecoveryConfig(state.engineMode);
    const unit =
      healCfg && name.trim().toLowerCase() === healCfg.potionName.toLowerCase()
        ? healCfg.potionPriceGp
        : modeBuyGp(state.engineMode, row.itemType, row.rarity);
    if (unit == null || unit <= 0) return { ok: false, reason: `${name} is not for sale here.` };
    const gp = unit * qty;
    if ((state.gold ?? 0) < gp) return { ok: false, reason: `Not enough gold for ${name}.` };
    const paid = { ...state, gold: (state.gold ?? 0) - gp };
    const added = addItem(paid, stampHealingPotionFields(state.engineMode, {
      id: `buy-${priceKeyId(name)}-${state.log.length}`,
      name,
      rarity: row.rarity,
      quantity: qty,
      itemType: row.itemType,
      baseValue: unit,
      provenance: 'Bought from a merchant',
    }));
    if (!added.ok) return { ok: false, reason: added.reason ?? 'No room to carry it.' };
    const receipt: ShopReceipt = {
      kind: 'buy', item: name, quantity: qty, cp: gp * 100,
      text: `Bought ${qty > 1 ? `${qty} ` : ''}${name} for ${gp}g.`,
    };
    return { ok: true, receipt, newState: withShopReceipt(added.state, receipt) };
  }
  const cp = shopPriceCp(name);
  if (cp == null) return { ok: false, reason: `${name} is not for sale here.` };
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
