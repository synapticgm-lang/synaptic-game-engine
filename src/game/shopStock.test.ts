/**
 * Shop shelves. Offline. No model call.
 */
import { describe, expect, it } from 'vitest';
import { applyFactGate } from './factGate';
import { buildFactSheet } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import { buyItem, merchantHere, sellItem } from './merchant';
import {
  buyFromShelf,
  circuitHub,
  ensureMerchantShelf,
  importWaitDays,
  merchantOnCircuit,
  offersRareSlot,
  projectShelf,
  sellToShelf,
  shelfSalt,
  stapleQty,
  stockForMerchant,
  type ShelfInput,
} from './shopStock';
import type { FactSheet } from './factSheet';
import { createInitialState } from './defaults';
import type { GameState } from './types';

const base = (day: number, lastImportDay = -1): ShelfInput => ({
  seed: 'world-seed',
  merchantId: 'mira',
  worldDay: day,
  band: { low: 1, high: 3 },
  producers: { smith: true, herbalist: true },
  higher: true,
  lastImportDay,
});

describe('shop stock', () => {
  it('keeps an unsigned salt and distinct rotating picks across seeds and days', () => {
    const seeds = ['world-seed', 'a', 'shop', 'zzz'];
    const merchants = ['mira', 'town-merchant', 'hale'];
    for (const seed of seeds) {
      for (const merchantId of merchants) {
        for (let day = 0; day < 40; day++) {
          const salt = shelfSalt(seed, merchantId, day);
          expect(salt).toBeGreaterThanOrEqual(0);
          expect(salt).toBeLessThan(2 ** 32);
          const rows = projectShelf({ ...base(day), seed, merchantId });
          expect(rows.every((r) => r.name.trim().length > 0)).toBe(true);
          const picks = rows.filter((r) => r.source === 'rotate').map((r) => r.name);
          expect(new Set(picks).size).toBe(picks.length);
          expect(picks.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('replays the same shelf for the same world, merchant, and day', () => {
    const a = projectShelf(base(4));
    const b = projectShelf(base(4));
    expect(a).toEqual(b);
    const next = projectShelf(base(5));
    const staple = (rows: typeof a) => rows.filter((r) => r.source === 'staple').map((r) => r.name).sort();
    const rotate = (rows: typeof a) => rows.filter((r) => r.source === 'rotate').map((r) => r.name).sort();
    expect(staple(a)).toEqual(staple(next));
    expect(rotate(a)).not.toEqual(rotate(next));
    expect(a.filter((r) => r.source === 'rotate').length).toBeGreaterThanOrEqual(2);
    expect(a.filter((r) => r.source === 'rotate').length).toBeLessThanOrEqual(3);
    const day21 = projectShelf(base(21));
    expect(day21.every((r) => typeof r.name === 'string' && r.name.trim().length > 0)).toBe(true);
    const picks = day21.filter((r) => r.source === 'rotate').map((r) => r.name);
    expect(new Set(picks).size).toBe(picks.length);
    expect(a.every((r) => r.earnFree === 'craft' || r.earnFree === 'dungeon' || r.earnFree === 'cart')).toBe(true);
  });

  it('restocks staples at the producer rate and holds imports for the trip', () => {
    expect(stapleQty(2, 6, 1, true, 0)).toBe(2);
    expect(stapleQty(2, 6, 1, true, 2)).toBe(4);
    expect(stapleQty(2, 6, 1, true, 6)).toBe(6);
    expect(stapleQty(2, 6, 1, false, 2)).toBe(2);
    let rows = projectShelf(base(1));
    expect(rows.find((r) => r.name === 'Iron Nail')?.quantity).toBe(2);
    rows = projectShelf({ ...base(2), producers: { smith: false, herbalist: true } }, rows);
    expect(rows.find((r) => r.name === 'Iron Nail')?.quantity).toBe(2);
    rows = projectShelf(base(2), projectShelf(base(1)));
    expect(rows.find((r) => r.name === 'Iron Nail')?.quantity).toBe(4);
    const jumped = projectShelf({ ...base(4), daysMade: 3 }, projectShelf(base(1)));
    expect(jumped.find((r) => r.name === 'Iron Nail')?.quantity).toBe(6);

    const wait = importWaitDays(3, 9);
    expect(wait).toBe(6);
    let id = 'cart-0';
    for (let i = 0; i < 40; i++) if (offersRareSlot(`cart-${i}`)) { id = `cart-${i}`; break; }
    const early = projectShelf({ ...base(0, 0), merchantId: id, higher: true });
    expect(early.some((r) => r.source === 'import')).toBe(false);
    const due = projectShelf({ ...base(wait, 0), merchantId: id, higher: true });
    expect(due.filter((r) => r.source === 'import')).toHaveLength(1);
    expect(due.find((r) => r.source === 'import')!.level).toBeGreaterThan(3);
  });

  it('buying removes a row and selling adds an area-band good, not a legendary', () => {
    const shelf = projectShelf(base(1));
    const bought = buyFromShelf(shelf, 'Iron Nail', 2);
    expect(bought.ok).toBe(true);
    expect(bought.rows.some((r) => r.name === 'Iron Nail')).toBe(false);
    const sold = sellToShelf(bought.rows, { name: 'Copper Ring', rarity: 'Common', level: 1 });
    expect(sold.ok).toBe(true);
    expect(sold.rows.find((r) => r.name === 'Copper Ring')?.quantity).toBe(1);
    expect(sellToShelf(sold.rows, { name: 'Vorpal Blade', rarity: 'Legendary', level: 20 }).ok).toBe(false);
  });

  it('drops a ware the writer names that is not on today\'s shelf', async () => {
    const stock = projectShelf(base(1)).map((r) => r.name);
    const sheet: FactSheet = {
      turn: 2,
      place: { name: 'Lowmarket', exits: [], features: [] },
      present: [{ name: 'Mira', role: 'merchant', stock: stock.map((name) => ({ name, quantity: 1, price: 5 })) }],
      openLedger: [],
      gear: { worn: [], carrying: [], inHand: 'nothing' },
      beat: { verb: 'looked', outcome: 'looked', steps: [] },
      player: { typed: 'look', claimsNotTrue: [] },
      quests: [],
      recent: [],
      settingsSlot: null,
    };
    const bad = await applyFactGate({
      prose: 'Mira offered a sunblade for sale.',
      sheet,
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(bad.prose).not.toMatch(/sunblade/i);
    const good = await applyFactGate({
      prose: 'Mira offered a reed salve for sale. The forge smelled of hot iron.',
      sheet,
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(good.prose).toMatch(/Reed Salve/i);
    expect(good.prose).toMatch(/forge/i);
    const mixed = await applyFactGate({
      prose: 'Mira offered a reed salve and a sunblade for sale. The forge smelled of hot iron.',
      sheet,
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(mixed.prose).toMatch(/reed salve/i);
    expect(mixed.prose).not.toMatch(/sunblade/i);
    expect(mixed.prose).toMatch(/forge/i);
    const blank = await applyFactGate({
      prose: 'Mira offered a reed salve for sale.',
      sheet: { ...sheet, present: [{ name: 'Mira', role: 'merchant', stock: [null as never, { name: 'Reed Salve', quantity: 1, price: 8 }] }] },
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(blank.prose).toMatch(/reed salve/i);
  });

  it('puts today\'s stock on the merchant row and walks a travelling cart by its circuit', () => {
    const s = {
      turn: 3,
      seed: 'world-seed',
      worldDay: 2,
      currentLocation: 'Lowmarket',
      engineMode: 'dnd',
      character: { name: 'Jax', level: 1 },
      npcMemories: [
        { npcId: 'mira', npcName: 'Mira', roleHint: 'merchant', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Lowmarket', sheet: { job: 'merchant', motive: '', fear: '', speech: '', secret: '', place: 'town' } },
        { npcId: 'smith', npcName: 'Holt', roleHint: 'smith', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Lowmarket' },
        { npcId: 'herb', npcName: 'Nia', roleHint: 'herbalist', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Lowmarket' },
      ],
      sceneFacts: { present: ['Mira'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 3 },
      places: [{ id: 'lowmarket', name: 'Lowmarket' }],
    } as GameState;
    const row = buildFactSheet(s, buildCompletedEventPacket(s, 'look'), 'look').present.find((p) => p.name === 'Mira');
    const listed = stockForMerchant(s, 'mira', 'Lowmarket');
    expect(row?.stock).toEqual(listed);
    expect(listed.every((item) => item.quantity > 0 && item.price > 0 && item.name.trim())).toBe(true);

    const circuit = { id: 'tinker', hubs: ['Lowmarket', 'Highcity'], daysPerHop: 4 };
    expect(merchantOnCircuit(circuit, 0, 'Lowmarket')).toBe(true);
    expect(merchantOnCircuit(circuit, 0, 'Highcity')).toBe(false);
    expect(circuitHub(circuit, 4)).toBe('Highcity');
    expect(merchantOnCircuit(circuit, 8, 'Lowmarket')).toBe(true);

    const away = {
      ...s,
      worldDay: 0,
      currentLocation: 'Highcity',
      places: [{ id: 'lowmarket', name: 'Lowmarket' }, { id: 'highcity', name: 'Highcity' }],
      sceneFacts: { ...s.sceneFacts!, present: ['Mira'] },
      npcMemories: (s.npcMemories ?? []).map((m) => m.npcId === 'mira'
        ? { ...m, roleHint: 'travelling merchant', location: 'Highcity' }
        : m),
    } as GameState;
    expect(merchantHere(away)).toBeNull();
    expect(stockForMerchant(away, 'mira', 'Highcity')).toEqual([]);
    expect(ensureMerchantShelf(away, 'mira', 'Highcity').shopShelves?.mira).toBeUndefined();
    const home = {
      ...createInitialState('Shop test', 'dnd'),
      worldDay: 0,
      seed: 'world-seed',
      currentLocation: 'Lowmarket',
      gold: 10,
      places: [{ id: 'lowmarket', name: 'Lowmarket' }, { id: 'highcity', name: 'Highcity' }],
      sceneFacts: { present: ['Mira'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 0 },
      npcMemories: [
        { npcId: 'mira', npcName: 'Mira', roleHint: 'merchant', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Lowmarket' },
        { npcId: 'smith', npcName: 'Holt', roleHint: 'smith', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Lowmarket' },
        { npcId: 'herb', npcName: 'Nia', roleHint: 'herbalist', disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Lowmarket' },
      ],
    } as GameState;
    const bought = buyItem(home, 'Iron Nail');
    expect(bought.ok, bought.reason).toBe(true);
    expect(bought.receipt?.cp).toBe(5);
    const left = bought.newState?.shopShelves?.mira?.rows.find((r) => r.name === 'Iron Nail');
    expect(left?.quantity).toBe(1);
    expect(buyItem(bought.newState!, 'Sunblade').ok).toBe(false);
    const sold = sellItem({
      ...bought.newState!,
      inventory: [{ id: 'ring', name: 'Copper Ring', rarity: 'Common', quantity: 1, itemLevel: 1 }],
    }, 'ring');
    expect(sold.ok).toBe(true);
    expect(sold.newState?.shopShelves?.mira?.rows.some((r) => r.name === 'Copper Ring')).toBe(true);
  });
});
