/**
 * Coins (SRD 5.2.1, CC-BY-4.0: Coins and Equipment). Five denominations: 1 PP = 10 GP, 1 GP = 2 EP = 10 SP = 100 CP.
 * Fifty coins weigh 1 lb. A seller pays half an item's cost (Selling Treasure / equipment at half price).
 *
 * One source: `state.gold` stays the whole-GP ledger every mode writes to. On a tabletop sheet character the purse
 * holds how those coins are carried; `purseOf` folds any gold change since the last settle into the purse (a gain
 * arrives as GP, a cost is paid making change), so the sheet, the carry weight and the HUD all read the same coins.
 */
import type { CoinPurse, GameState } from '../types';
import { srdGearCostCp } from './srdGear';
import srdShopGear from '../../data/srd/srdShopGear.json';

/** "Thieve’s Tools" and "thieves' tools" are the same row. */
export const priceKey = (name: string) => String(name ?? '').replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();

/** SRD 5.2.1 pp. 89-102 shop rows (adventuring gear, tools, mounts, tack, ships, food, services) in copper. */
const SHOP_GEAR_CP: Record<string, number> = Object.fromEntries(
  Object.values(srdShopGear as Record<string, unknown>)
    .filter((v): v is Array<{ name: string; cp: number }> => Array.isArray(v))
    .flat()
    .map((r) => [String(r.name).replace(/[\u2018\u2019]/g, "'"), r.cp]),
);

export type Coin = keyof CoinPurse;
export const COIN_ORDER: Coin[] = ['pp', 'gp', 'ep', 'sp', 'cp'];
export const COIN_CP: Record<Coin, number> = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
export const COINS_PER_LB = 50;
const LABEL: Record<Coin, string> = { pp: 'PP', gp: 'GP', ep: 'EP', sp: 'SP', cp: 'CP' };

export const EMPTY_PURSE: CoinPurse = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

const whole = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
const clean = (p: Partial<CoinPurse> | null | undefined): CoinPurse => ({
  pp: whole(p?.pp), gp: whole(p?.gp), ep: whole(p?.ep), sp: whole(p?.sp), cp: whole(p?.cp),
});

export function purseCp(p: Partial<CoinPurse>): number {
  const c = clean(p);
  return COIN_ORDER.reduce((s, k) => s + c[k] * COIN_CP[k], 0);
}

/** Whole GP the purse is worth (the `gold` ledger value). */
export const purseGold = (p: Partial<CoinPurse>) => Math.floor(purseCp(p) / 100);

export function coinCount(p: Partial<CoinPurse>): number {
  const c = clean(p);
  return COIN_ORDER.reduce((s, k) => s + c[k], 0);
}

export function coinWeightLb(p: Partial<CoinPurse> | null | undefined): number {
  return p ? Math.round((coinCount(p) / COINS_PER_LB) * 100) / 100 : 0;
}

export function addCoins(p: Partial<CoinPurse>, add: Partial<CoinPurse>): CoinPurse {
  const a = clean(p);
  const b = clean(add);
  return { pp: a.pp + b.pp, gp: a.gp + b.gp, ep: a.ep + b.ep, sp: a.sp + b.sp, cp: a.cp + b.cp };
}

/** A copper amount as the fewest coins (GP and smaller; PP and EP come only from treasure). */
export function changeFor(cp: number): CoinPurse {
  let left = Math.max(0, Math.floor(cp));
  const gp = Math.floor(left / 100);
  left -= gp * 100;
  const sp = Math.floor(left / 10);
  return { ...EMPTY_PURSE, gp, sp, cp: left - sp * 10 };
}

/**
 * Pay `cp` from the purse: smallest coins first, then one larger coin broken with the change given back in
 * smaller coins. Returns null when the purse cannot cover it.
 */
export function payCoins(p: Partial<CoinPurse>, cp: number): CoinPurse | null {
  const owed = Math.max(0, Math.floor(cp));
  if (purseCp(p) < owed) return null;
  const out = clean(p);
  let left = owed;
  for (const k of [...COIN_ORDER].reverse()) {
    const take = Math.min(out[k], Math.floor(left / COIN_CP[k]));
    out[k] -= take;
    left -= take * COIN_CP[k];
  }
  if (left > 0) {
    const coin = [...COIN_ORDER].reverse().find((k) => out[k] > 0 && COIN_CP[k] >= left)!;
    out[coin] -= 1;
    return addCoins(out, changeFor(COIN_CP[coin] - left));
  }
  return out;
}

export function formatPurse(p: Partial<CoinPurse>): string {
  const c = clean(p);
  const parts = COIN_ORDER.filter((k) => c[k] > 0).map((k) => `${c[k]} ${LABEL[k]}`);
  return parts.length ? parts.join(', ') : 'no coins';
}

/** A copper amount in words for a receipt: "1 GP 5 SP". */
export function formatCp(cp: number): string {
  return formatPurse(changeFor(cp));
}

/** The purse is kept for tabletop characters with an SRD sheet; other modes show plain gold. */
export function usesPurse(state: Pick<GameState, 'engineMode' | 'character'>): boolean {
  return state.engineMode === 'dnd' && !!state.character?.srd;
}

/**
 * The coins carried now: the stored purse with every gold change since the last settle folded in. A first read
 * on an older save holds the gold as GP. Null where the mode has no purse.
 */
export function purseOf(state: Pick<GameState, 'engineMode' | 'character' | 'gold' | 'purse'>): CoinPurse | null {
  if (!usesPurse(state)) return null;
  const gold = whole(state.gold);
  const stored = state.purse;
  if (!stored) return { ...EMPTY_PURSE, gp: gold };
  const base = clean(stored.coins);
  const delta = gold - whole(stored.gold);
  if (delta > 0) return addCoins(base, { gp: delta });
  if (delta < 0) return payCoins(base, -delta * 100) ?? { ...EMPTY_PURSE };
  return base;
}

/** Write the folded purse back so the next change starts from it (once per turn, and on load). */
export function settlePurse<T extends GameState>(state: T): T {
  const coins = purseOf(state);
  if (!coins) return state;
  const gold = purseGold(coins);
  const same = state.purse && state.purse.gold === gold && purseCp(state.purse.coins) === purseCp(coins)
    && COIN_ORDER.every((k) => clean(state.purse!.coins)[k] === coins[k]);
  return same && state.gold === gold ? state : { ...state, gold, purse: { coins, gold } };
}

/** Coins straight into the purse (exact denominations), with the gold ledger moved to match. */
export function gainCoins<T extends GameState>(state: T, coins: Partial<CoinPurse>): T {
  const now = purseOf(state);
  if (!now) return { ...state, gold: whole(state.gold) + purseGold(coins) };
  const next = addCoins(now, coins);
  const gold = purseGold(next);
  return { ...state, gold, purse: { coins: next, gold } };
}

/** Loot money into the ledger: rolled coins go in as those coins, otherwise the whole GP the roll paid. */
export function gainLootMoney<T extends GameState>(state: T, gold: number, coins?: Partial<CoinPurse>): T {
  return coins && purseCp(coins) > 0 ? gainCoins(state, coins) : { ...state, gold: whole(state.gold) + whole(gold) };
}

/** Loot money as receipt text ("3 GP, 7 SP" for rolled coins, "12" for plain gold); null when there is none. */
export function lootMoneyText(gold: number, coins?: Partial<CoinPurse>): string | null {
  if (coins && purseCp(coins) > 0) return formatPurse(coins);
  return whole(gold) > 0 ? String(whole(gold)) : null;
}

/** Loot money as a found-list entry ("3 GP, 7 SP" or "12 gold"); null when there is none. */
export function lootMoneyFound(gold: number, coins?: Partial<CoinPurse>): string | null {
  const text = lootMoneyText(gold, coins);
  return text && !(coins && purseCp(coins) > 0) ? `${text} gold` : text;
}

/** Pounds of coin a sheet character carries (0 without a purse). */
export function carriedCoinLb(state: Pick<GameState, 'engineMode' | 'character'> & Partial<Pick<GameState, 'gold' | 'purse'>>): number {
  return coinWeightLb(purseOf({ ...state, gold: state.gold ?? 0 }));
}

/** Coins the player carries, as one line for the sheet and the HUD ("12 GP, 5 SP"); plain gold elsewhere. */
export function wealthLine(state: Pick<GameState, 'engineMode' | 'character' | 'gold' | 'purse'>): string {
  const p = purseOf(state);
  return p ? formatPurse(p) : `${whole(state.gold)} GP`;
}

/**
 * SRD 5.2.1 equipment costs in copper for the gear the tabletop engine hands out (Weapons, Armor, Adventuring Gear,
 * Tools tables). An item with no listed cost has none here and sells by the shared salvage price.
 */
export const ITEM_COST_CP: Record<string, number> = {
  ...SHOP_GEAR_CP,
  ...srdGearCostCp(),
  Arrows: 5,
  Bolts: 5,
  'Holy Symbol': 500,
  Spellbook: 5000,
  "Traveler's Clothes": 200,
  'Gaming Set': 10,
  'Book (prayers)': 2500,
  'Book (history)': 2500,
  Lantern: 500,
  'Druidic Focus': 100,
  'Arcane Focus': 1000,
  'Book (occult lore)': 2500,



};

/** What a buyer pays a tabletop seller: half the SRD cost, per piece × quantity (null when the cost is not listed). */
const PRICE_BY_KEY: Map<string, number> = new Map(Object.entries(ITEM_COST_CP).map(([k, v]) => [priceKey(k), v]));

/** One price lookup for buying and selling: SRD list cost in copper, or null when the SRD lists none. */
export function shopPriceCp(name: string): number | null {
  return ITEM_COST_CP[name] ?? PRICE_BY_KEY.get(priceKey(name)) ?? null;
}

/**
 * What a buyer pays a tabletop seller (SRD 5.2.1 p.89: equipment fetches half its cost): exactly half in copper,
 * paid in smaller coins by changeFor (5 GP -> 2 GP 5 SP; 1 SP -> 5 CP). Only a sub-copper remainder is lost
 * (3 CP -> 1 CP, 1 CP -> 0). Null when the cost is not listed.
 */
export function srdSaleCp(name: string, quantity = 1): number | null {
  const cost = shopPriceCp(name);
  return cost == null ? null : Math.floor((cost * Math.max(1, quantity)) / 2);
}
