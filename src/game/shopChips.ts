import type { GameState } from './types';
import {
  buyItem,
  buyPriceLabel,
  canAfford,
  getSellPrice,
  merchantHere,
  merchantStock,
  modeBuyGp,
  MODE_SHOP_STOCK,
  sellItem,
  sellPriceLabel,
  type StockRow,
} from './merchant';
import { srdSaleCp, usesPurse } from './rules/coins';
import { hashSeed } from './seededRng';

/**
 * OPT-6 / tt-build-chipcheck: shop chips in every mode when a merchant is here.
 * Tabletop: SRD 5.2.1 Equipment list + Selling Treasure (half cost) via merchant/coins.
 * LitRPG / Story RPG: mode shop prices by itemType × rarity. Label stays the plain Buy/Sell action (chip contract).
 */
export interface ShopChip {
  label: string;
  kind: 'buy' | 'sell';
  item: string;
  itemId?: string;
}

const BUY_ROWS = 2;
const SELL_ROWS = 2;

export function shopChips(state: GameState): ShopChip[] {
  if (state.activeEncounter) return [];
  const merchant = merchantHere(state);
  if (!merchant) return [];
  const out: ShopChip[] = [];
  const mode = state.engineMode === 'litrpg' || state.engineMode === 'rpg' ? state.engineMode : null;
  const raw: StockRow[] = mode ? [] : merchantStock();
  if (mode) {
    for (const r of MODE_SHOP_STOCK[mode]) {
      const gp = modeBuyGp(mode, r.itemType, r.rarity) ?? 0;
      if (gp > 0) raw.push({ name: r.name, cp: gp * 100, section: 'mode' });
    }
  }
  const stock: StockRow[] = [];
  for (const r of raw) {
    if (r.cp > 0 && canAfford(state, r.cp)) stock.push(r);
  }
  if (stock.length) {
    const start = hashSeed(`${merchant.npcName}|${state.currentLocation ?? ''}`) % stock.length;
    for (let i = 0; i < Math.min(BUY_ROWS, stock.length); i++) {
      const row = stock[(start + i * 7) % stock.length]!;
      const price = buyPriceLabel(state, row.name);
      let dup = false;
      for (const c of out) if (c.item === row.name) dup = true;
      if (price && !dup) out.push({ label: `Buy ${row.name} for ${price}`, kind: 'buy', item: row.name });
    }
  }
  let sells = 0;
  if (usesPurse(state)) {
    for (const item of state.inventory ?? []) {
      if (sells >= SELL_ROWS) break;
      if (item.equipped) continue;
      if ((srdSaleCp(item.name, item.quantity ?? 1) ?? 0) <= 0) continue;
      out.push({ label: `Sell ${item.name} for ${sellPriceLabel(state, item)}`, kind: 'sell', item: item.name, itemId: item.id });
      sells += 1;
    }
  } else if (mode) {
    for (const item of state.inventory ?? []) {
      if (sells >= SELL_ROWS) break;
      if (item.equipped || item.itemType === 'quest') continue;
      if (getSellPrice(item) <= 0) continue;
      out.push({ label: `Sell ${item.name} for ${sellPriceLabel(state, item)}`, kind: 'sell', item: item.name, itemId: item.id });
      sells += 1;
    }
  }
  return out;
}

/** The shop chip the player picked, from this state's own shop chips (null when the pick was not one). */
export function pickedShopChip(state: GameState, input: string): ShopChip | null {
  const k = (input ?? '').trim();
  if (!k) return null;
  const want = k.toLowerCase();
  for (const c of shopChips(state)) {
    if (c.label.trim().toLowerCase() === want) return c;
  }
  return null;
}

/** Run a picked shop chip through buyItem/sellItem; the receipt is the engine fact the writer narrates. */
export function resolveShopChip(state: GameState, input: string): { state: GameState; receipts: string[]; facts: string[] } | null {
  const chip = pickedShopChip(state, input);
  if (!chip) return null;
  if (chip.kind === 'buy') {
    const r = buyItem(state, chip.item);
    if (!r.ok || !r.newState) return { state, receipts: [], facts: [r.reason ?? `${chip.item} could not be bought.`] };
    return { state: r.newState, receipts: [r.receipt!.text], facts: [r.receipt!.text] };
  }
  const r = sellItem(state, chip.itemId ?? '');
  if (!r.ok || !r.newState) return { state, receipts: [], facts: [r.reason ?? `${chip.item} could not be sold.`] };
  const text = `Sold ${chip.item} for ${r.soldFor}.`;
  return { state: r.newState, receipts: [text], facts: [text] };
}
