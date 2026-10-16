import type { GameState } from './types';
import { buyItem, buyPriceLabel, canAfford, merchantHere, merchantStock, sellItem, sellPriceLabel } from './merchant';
import { srdSaleCp, usesPurse } from './rules/coins';
import { hashSeed } from './seededRng';

/**
 * tt-build-chipcheck: shop chips. A merchant at the player's place (NPC records + role registry) offers
 * "Buy X for N" rows from the SRD stock the player can pay for, and "Sell X" for carried SRD gear worth coin.
 * The chip carries its own item, so the turn resolves it by kind, never by reading the words back.
 */
export interface ShopChip {
  label: string;
  kind: 'buy' | 'sell';
  item: string;
  itemId?: string;
}

const BUY_ROWS = 2;
const SELL_ROWS = 2;
const key = (s: string) => (s ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();

export function shopChips(state: GameState): ShopChip[] {
  if (state.engineMode !== 'dnd' || state.activeEncounter) return [];
  const merchant = merchantHere(state);
  if (!merchant) return [];
  const out: ShopChip[] = [];
  const stock = merchantStock().filter((r) => r.cp > 0 && canAfford(state, r.cp));
  if (stock.length) {
    // Stable for this merchant at this place; which rows are shown rotates by who and where, not by turn.
    const start = hashSeed(`${merchant.npcName}|${state.currentLocation ?? ''}`) % stock.length;
    for (let i = 0; i < Math.min(BUY_ROWS, stock.length); i++) {
      const row = stock[(start + i * 7) % stock.length]!;
      const price = buyPriceLabel(state, row.name);
      if (price && !out.some((c) => c.item === row.name)) out.push({ label: `Buy ${row.name} for ${price}`, kind: 'buy', item: row.name });
    }
  }
  if (usesPurse(state)) {
    for (const item of state.inventory ?? []) {
      if (out.filter((c) => c.kind === 'sell').length >= SELL_ROWS) break;
      if (item.equipped) continue;
      if ((srdSaleCp(item.name, item.quantity ?? 1) ?? 0) <= 0) continue;
      out.push({ label: `Sell ${item.name} for ${sellPriceLabel(state, item)}`, kind: 'sell', item: item.name, itemId: item.id });
    }
  }
  return out;
}

/** The shop chip the player picked, from this state's own shop chips (null when the pick was not one). */
export function pickedShopChip(state: GameState, input: string): ShopChip | null {
  const k = key(input);
  if (!k) return null;
  return shopChips(state).find((c) => key(c.label) === k) ?? null;
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
