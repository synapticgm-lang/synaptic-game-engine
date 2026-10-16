import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buyItem, canAfford, canOpenMerchant, merchantHere, merchantStock } from './merchant';
import { changeFor } from './rules/coins';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';

function tt(cp: number, npcs: Partial<NpcMemory>[] = []): GameState {
  const base = createInitialState('Shop test', 'dnd');
  const gold = Math.floor(cp / 100);
  return {
    ...base,
    character: { ...base.character, srd: base.character?.srd ?? ({} as never) },
    currentLocation: 'Market Square',
    gold,
    purse: { coins: changeFor(cp), gold },
    inventory: [],
    log: [],
    npcMemories: npcs.map((n, i) => ({
      npcId: `n${i}`, npcName: `Npc ${i}`, disposition: 'neutral', facts: [], lastSeenTurn: 0,
      location: 'Market Square', ...n,
    })) as NpcMemory[],
  } as GameState;
}

describe('shop-b: merchant present gates trading (records + role, not prose)', () => {
  it('no merchant here: tabletop cannot open the shop', () => {
    const s = tt(1000, [{ roleHint: 'guide' }]);
    expect(merchantHere(s)).toBeNull();
    expect(canOpenMerchant(s)).toBe(false);
  });
  it('a merchant at this place opens it', () => {
    const s = tt(1000, [{ roleHint: 'merchant', npcName: 'Hale' }]);
    expect(merchantHere(s)?.npcName).toBe('Hale');
    expect(canOpenMerchant(s)).toBe(true);
  });
  it('a merchant somewhere else does not count', () => {
    const s = tt(1000, [{ roleHint: 'merchant', location: 'Far Away Keep' }]);
    expect(merchantHere(s)).toBeNull();
  });
  it('non-tabletop modes keep their trading post', () => {
    const s = { ...tt(0), engineMode: 'litrpg' } as GameState;
    expect(canOpenMerchant(s)).toBe(true);
  });
});

describe('shop-b: stock and affordability', () => {
  it('town stock is tools, gear and food from the SRD list; no mounts or ships', () => {
    const st = merchantStock();
    const names = st.map((r) => r.name);
    expect(names).toContain('Rope');
    expect(names).toContain('Rations');
    expect(st.every((r) => ['tools', 'adventuring_gear', 'food_drink_lodging'].includes(r.section))).toBe(true);
    expect(names).not.toContain('Camel');
  });
  it('affordability matches what buying does', () => {
    const poor = tt(40);
    expect(canAfford(poor, 50)).toBe(false);
    expect(buyItem(poor, 'Rations').ok).toBe(false);
    const ok = tt(60);
    expect(canAfford(ok, 50)).toBe(true);
    expect(buyItem(ok, 'Rations').ok).toBe(true);
  });
  it('the Merchant window has a Buy tab wired to buyItem', () => {
    const w = readFileSync(resolve(__dirname, '../components/MerchantWindow.tsx'), 'utf8');
    expect(w).toMatch(/setTab\('buy'\)/);
    expect(w).toMatch(/buyItem\(state, name\)/);
    const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    expect(app).not.toMatch(/if \(state\.engineMode === 'dnd'\) return;/);
  });
});
