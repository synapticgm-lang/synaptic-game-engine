/**
 * Engine-owned shop shelves. The same world seed, merchant, and world day
 * always roll the same goods. No model call. Every row is also earnable free.
 */
import type { GameState, Rarity, ShopStockRow } from './types';

export interface ShopProducers {
  smith: boolean;
  herbalist: boolean;
}

export interface ShelfInput {
  seed: string;
  merchantId: string;
  worldDay: number;
  band: { low: number; high: number };
  producers: ShopProducers;
  /** A higher-band city exists to import from. */
  higher: boolean;
  /** World day the previous import arrived. -1 if none yet. */
  lastImportDay: number;
}

const STAPLES: Array<{ name: string; maker: keyof ShopProducers; rate: number; cap: number; price: number }> = [
  { name: 'Iron Nail', maker: 'smith', rate: 2, cap: 6, price: 5 },
  { name: 'Reed Salve', maker: 'herbalist', rate: 1, cap: 4, price: 8 },
  { name: 'Health Tonic', maker: 'herbalist', rate: 1, cap: 4, price: 12 },
];

const ROTATE = ['Torch', 'Rope', 'Rations', 'Waterskin', 'Candle', 'Lantern'];
const IMPORTS = ['Sunsteel Ingot', 'Far-city Tonic'];

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** world xor merchant xor day, as specified. */
export function shelfSalt(seed: string, merchantId: string, worldDay: number): number {
  return hash32(seed) ^ hash32(merchantId) ^ hash32(String(worldDay));
}

export function stapleQty(rate: number, cap: number, daysMade: number, alive: boolean, carried = 0): number {
  if (!alive) return Math.max(0, carried);
  return Math.min(cap, Math.max(0, carried) + rate * Math.max(0, daysMade));
}

/** Days a merchant needs to fetch a good from a higher band and return. */
export function importWaitDays(localHigh: number, importHigh: number): number {
  return Math.max(2, importHigh - localHigh);
}

export interface Circuit {
  id: string;
  hubs: string[];
  daysPerHop: number;
}

export function offersRareSlot(merchantId: string): boolean {
  return hash32(merchantId) % 5 === 0;
}

export function circuitHub(circuit: Circuit, worldDay: number): string {
  const hops = Math.max(1, circuit.hubs.length);
  const span = hops * Math.max(1, circuit.daysPerHop);
  const t = ((worldDay % span) + span) % span;
  return circuit.hubs[Math.floor(t / circuit.daysPerHop) % hops]!;
}

export function merchantOnCircuit(circuit: Circuit, worldDay: number, hub: string): boolean {
  return circuitHub(circuit, worldDay).toLowerCase() === hub.trim().toLowerCase();
}

function rarityFor(level: number, salt: number): Rarity {
  if (level <= 3) return 'Common';
  if (level >= 16) return salt % 2 === 0 ? 'Rare' : 'Epic';
  return salt % 2 === 0 ? 'Uncommon' : 'Rare';
}

export function projectShelf(input: ShelfInput, carried: ShopStockRow[] = []): ShopStockRow[] {
  const salt = shelfSalt(input.seed, input.merchantId, input.worldDay);
  const level = input.band.low;
  const rows: ShopStockRow[] = [];
  for (const staple of STAPLES) {
    const prev = carried.find((r) => r.name === staple.name && r.source === 'staple');
    const qty = stapleQty(staple.rate, staple.cap, 1, input.producers[staple.maker], prev?.quantity ?? 0);
    if (qty <= 0 && !input.producers[staple.maker] && !(prev && prev.quantity > 0)) continue;
    rows.push({
      name: staple.name,
      quantity: qty,
      level,
      rarity: 'Common',
      price: staple.price,
      source: 'staple',
      earnFree: 'craft',
    });
  }
  const count = 2 + (salt % 2);
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const name = ROTATE[(salt + i * 3) % ROTATE.length]!;
    if (used.has(name)) continue;
    used.add(name);
    rows.push({
      name,
      quantity: 1,
      level,
      rarity: rarityFor(level, salt + i),
      price: 15 + (salt % 7),
      source: 'rotate',
      earnFree: 'dungeon',
    });
  }
  const wait = importWaitDays(input.band.high, input.band.high + 6);
  const due = input.lastImportDay < 0 ? wait : input.lastImportDay + wait;
  if (input.higher && offersRareSlot(input.merchantId) && input.worldDay >= due) {
    const name = IMPORTS[salt % IMPORTS.length]!;
    rows.push({
      name,
      quantity: 1,
      level: Math.max(level, input.band.high + 6),
      rarity: rarityFor(input.band.high + 6, salt),
      price: 80,
      source: 'import',
      earnFree: 'cart',
    });
  }
  return rows.filter((r) => r.quantity > 0);
}

export function buyFromShelf(rows: ShopStockRow[], name: string, qty = 1): { ok: boolean; rows: ShopStockRow[] } {
  const key = name.trim().toLowerCase();
  const row = rows.find((r) => r.name.toLowerCase() === key && r.quantity > 0);
  if (!row || row.quantity < qty) return { ok: false, rows };
  return {
    ok: true,
    rows: rows
      .map((r) => (r === row ? { ...r, quantity: r.quantity - qty } : r))
      .filter((r) => r.quantity > 0),
  };
}

export function sellToShelf(rows: ShopStockRow[], item: { name: string; rarity: Rarity; level: number }): { ok: boolean; rows: ShopStockRow[] } {
  if (item.rarity === 'Legendary' || item.rarity === 'Epic') return { ok: false, rows };
  const key = item.name.trim().toLowerCase();
  const existing = rows.find((r) => r.name.toLowerCase() === key);
  if (existing) {
    return { ok: true, rows: rows.map((r) => (r === existing ? { ...r, quantity: r.quantity + 1 } : r)) };
  }
  return {
    ok: true,
    rows: [...rows, {
      name: item.name.trim(),
      quantity: 1,
      level: item.level,
      rarity: item.rarity,
      price: 4,
      source: 'staple',
      earnFree: 'craft',
    }],
  };
}

export function stockForMerchant(state: GameState, merchantId: string, settlement: string): string[] {
  const day = state.worldDay ?? 0;
  const saved = state.shopShelves?.[merchantId];
  if (saved && saved.worldDay === day) return stockNames(saved.rows);
  const place = (state.places ?? []).find((p) => p.name?.toLowerCase() === settlement.toLowerCase() || p.id?.toLowerCase() === settlement.toLowerCase());
  const band = place?.regionId && state.regionLevelBands?.[place.regionId]
    ? state.regionLevelBands[place.regionId]!
    : { low: 1, high: 3 };
  const higher = Object.values(state.regionLevelBands ?? {}).some((b) => b.high > band.high) || band.high <= 3;
  return stockNames(projectShelf({
    seed: state.seed ?? 'seed',
    merchantId,
    worldDay: day,
    band: { low: band.low, high: band.high },
    producers: producersHere(state, settlement),
    higher,
    lastImportDay: saved?.importDueDay ?? -1,
  }, saved?.rows ?? []));
}

export function producersHere(state: GameState, settlement: string): ShopProducers {
  const people = state.npcMemories ?? [];
  const alive = (job: RegExp) => people.some((m) => {
    if (m.shouldExit) return false;
    const place = (m.location ?? '').toLowerCase();
    if (place && place !== settlement.toLowerCase()) return false;
    return job.test(`${m.roleHint ?? ''} ${m.sheet?.job ?? ''}`);
  });
  return { smith: alive(/\bsmith\b/i), herbalist: alive(/\bherbalist\b/i) };
}

export function ensureMerchantShelf(state: GameState, merchantId: string, settlement: string): GameState {
  const day = state.worldDay ?? 0;
  const saved = state.shopShelves?.[merchantId];
  if (saved && saved.worldDay === day) return state;
  const place = (state.places ?? []).find((p) => p.name?.toLowerCase() === settlement.toLowerCase() || p.id?.toLowerCase() === settlement.toLowerCase());
  const band = place?.regionId && state.regionLevelBands?.[place.regionId]
    ? state.regionLevelBands[place.regionId]!
    : { low: 1, high: 3 };
  const higher = Object.values(state.regionLevelBands ?? {}).some((b) => b.high > band.high);
  const rows = projectShelf({
    seed: state.seed ?? 'seed',
    merchantId,
    worldDay: day,
    band: { low: band.low, high: band.high },
    producers: producersHere(state, settlement),
    higher: higher || band.high <= 3,
    lastImportDay: saved?.importDueDay != null && saved.worldDay != null ? saved.worldDay : -1,
  }, saved?.rows ?? []);
  const importRow = rows.find((r) => r.source === 'import');
  return {
    ...state,
    shopShelves: {
      ...(state.shopShelves ?? {}),
      [merchantId]: {
        worldDay: day,
        rows,
        importDueDay: importRow ? day + importWaitDays(band.high, band.high + 6) : (saved?.importDueDay ?? day),
      },
    },
  };
}

export function stockNames(rows: ShopStockRow[]): string[] {
  return rows.filter((r) => r.quantity > 0).map((r) => r.name);
}
