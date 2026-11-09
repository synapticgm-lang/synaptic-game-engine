/**
 * Shop shelves. Offline. No model call.
 */
import { describe, expect, it } from 'vitest';
import { applyFactGate } from './factGate';
import { buildFactSheet } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  buyFromShelf,
  circuitHub,
  importWaitDays,
  merchantOnCircuit,
  offersRareSlot,
  projectShelf,
  sellToShelf,
  stapleQty,
  type ShelfInput,
} from './shopStock';
import type { FactSheet } from './factSheet';
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
      present: [{ name: 'Mira', role: 'merchant', stock }],
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
    expect(row?.stock).toEqual(projectShelf({ ...base(2), merchantId: 'mira' }).map((r) => r.name));

    const circuit = { id: 'tinker', hubs: ['Lowmarket', 'Highcity'], daysPerHop: 4 };
    expect(merchantOnCircuit(circuit, 0, 'Lowmarket')).toBe(true);
    expect(merchantOnCircuit(circuit, 0, 'Highcity')).toBe(false);
    expect(circuitHub(circuit, 4)).toBe('Highcity');
    expect(merchantOnCircuit(circuit, 8, 'Lowmarket')).toBe(true);
  });
});
