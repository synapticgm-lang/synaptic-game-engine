import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { pickStockItemGlyph, stockItemIconSrc, stockPortraitSrc } from './stockInventoryArt';
import type { Item } from './types';

function item(partial: Partial<Item> & Pick<Item, 'id' | 'name'>): Item {
  return {
    rarity: 'Common',
    quantity: 1,
    equipped: true,
    ...partial,
  };
}

describe('stock inventory glyphs', () => {
  it('maps weapons, armor, and street kit without an image API', () => {
    expect(pickStockItemGlyph(item({ id: '1', name: 'Iron shortsword', slot: 'Main Hand', itemType: 'weapon' }))).toBe('sword');
    expect(pickStockItemGlyph(item({ id: '2', name: 'Kitchen knife', slot: 'Main Hand' }))).toBe('dagger');
    expect(pickStockItemGlyph(item({ id: '3', name: 'Hat', slot: 'Head' }))).toBe('hat');
    expect(pickStockItemGlyph(item({ id: '4', name: 'Earth clothes', slot: 'Chest' }))).toBe('chest');
    expect(pickStockItemGlyph(item({ id: '5', name: 'Worn Satchel', slot: 'Container', itemType: 'container' }))).toBe('bag');
    expect(pickStockItemGlyph(item({ id: '6', name: 'Circle Blessing', slot: 'Off Hand' }))).toBe('quest');
    expect(stockItemIconSrc(item({ id: '1', name: 'Iron shortsword', slot: 'Main Hand' }))).toMatch(/^data:image\/svg\+xml/);
  });

  it('builds a paper-doll from worn kit', () => {
    const state = createInitialState('Jax', 'litrpg');
    state.inventory = [
      item({ id: 'w', name: 'Iron shortsword', slot: 'Main Hand', itemType: 'weapon' }),
      item({ id: 's', name: 'Buckler', slot: 'Off Hand' }),
    ];
    expect(stockPortraitSrc(state)).toMatch(/^data:image\/svg\+xml/);
  });
});
