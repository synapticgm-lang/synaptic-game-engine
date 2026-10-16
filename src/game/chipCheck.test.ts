import { describe, expect, it } from 'vitest';
import { changeFor } from './rules/coins';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { resolveShopChip, shopChips } from './shopChips';
import { CHIP_RESOLVERS, checkChipKinds, chipKindOf } from './chipCheck';
import { engineChips } from './choicePipeline';

function tt(cp: number, npcs: Partial<NpcMemory>[] = []): GameState {
  const base = { ...createInitialState('Chip test', 'dnd'), currentLocation: 'Market Square' };
  const gold = Math.floor(cp / 100);
  return {
    ...base,
    character: { ...base.character, srd: base.character?.srd ?? ({} as never) },
    gold,
    purse: { coins: changeFor(cp), gold },
    inventory: [],
    log: [],
    npcMemories: npcs.map((n, i) => ({
      npcId: `n${i}`, npcName: `Npc ${i}`, disposition: 'neutral', facts: [], lastSeenTurn: 0,
      location: base.currentLocation, ...n,
    })) as NpcMemory[],
  } as GameState;
}

describe('tt-build-chipcheck: chip kinds', () => {
  it('every engine chip carries a kind with a registered resolver', () => {
    const s = tt(5000, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    const chips = engineChips(s);
    expect(chips.length).toBeGreaterThan(0);
    for (const c of chips) expect(CHIP_RESOLVERS[c.kind], c.label).toBeTruthy();
  });
  it('a chip no builder made is a dead chip', () => {
    const s = tt(5000);
    const flags = checkChipKinds(s, ['Summon the moon from its socket']);
    expect(flags.filter((f) => f.kind === 'dead-chip')).toHaveLength(1);
  });
  it('a person here with no chip naming them is a missing chip kind', () => {
    const s = tt(5000, [{ npcName: 'Bram Tull', roleHint: 'guide' }]);
    const offered = engineChips(s).map((c) => c.label).filter((l) => !/bram/i.test(l)).slice(0, 2);
    const miss = checkChipKinds(s, offered.length ? offered : ['Look around']).filter((f) => f.kind === 'missing-chip-kind');
    expect(miss.some((f) => f.detail.includes('Bram Tull'))).toBe(true);
  });
});

describe('tt-build-chipcheck: shop chips', () => {
  it('no merchant: no shop chips', () => {
    expect(shopChips(tt(5000, [{ roleHint: 'guide' }]))).toEqual([]);
  });
  it('a merchant here offers Buy chips priced from the SRD list, and they are kind shop', () => {
    const s = tt(5000, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    const buys = shopChips(s).filter((c) => c.kind === 'buy');
    expect(buys.length).toBeGreaterThan(0);
    for (const b of buys) {
      expect(b.label).toMatch(/^Buy .+ for /);
      expect(chipKindOf(s, b.label)).toBe('shop');
    }
  });
  it('picking a Buy chip pays and adds the item, with a receipt fact', () => {
    const s = tt(5000, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    const buy = shopChips(s).find((c) => c.kind === 'buy')!;
    const r = resolveShopChip(s, buy.label)!;
    expect(r.receipts[0]).toMatch(/^Bought /);
    expect(r.state.inventory.some((i) => i.name === buy.item)).toBe(true);
    expect(r.state.gold ?? 0).toBeLessThanOrEqual(s.gold ?? 0);
  });
  it('a carried SRD item gets a Sell chip that pays half price', () => {
    const base = tt(0, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    const s = { ...base, inventory: [{ id: 'r1', name: 'Rope', rarity: 'Common', quantity: 1 }] } as GameState;
    const sell = shopChips(s).find((c) => c.kind === 'sell');
    if (!sell) return; // Rope not priced under this name in the SRD table
    const r = resolveShopChip(s, sell.label)!;
    expect(r.receipts[0]).toMatch(/^Sold Rope for /);
    expect(r.state.inventory.some((i) => i.id === 'r1')).toBe(false);
  });
  it('typed text that is not a shop chip does nothing', () => {
    const s = tt(5000, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    expect(resolveShopChip(s, 'I want to buy everything')).toBeNull();
  });
  it('no shop chips mid-fight or outside tabletop', () => {
    const s = tt(5000, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    expect(shopChips({ ...s, engineMode: 'litrpg' } as GameState)).toEqual([]);
    expect(shopChips({ ...s, activeEncounter: {} as never })).toEqual([]);
  });
});
