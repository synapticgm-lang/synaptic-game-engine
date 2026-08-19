import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  equippedItemsNeedingIcons,
  needsPortraitRefresh,
  paperDollPrompt,
  portraitCacheKey,
} from './inventoryArt';
import type { Item } from './types';

function worn(partial: Partial<Item> & Pick<Item, 'id' | 'name'>): Item {
  return {
    rarity: 'Common',
    quantity: 1,
    equipped: true,
    ...partial,
  };
}

describe('inventory paper-doll seed', () => {
  it('refreshes from worn kit when appearance is still empty', () => {
    const state = createInitialState('Jax', 'litrpg');
    state.character.name = 'Jax';
    state.character.appearance = '';
    state.character.bio = '';
    state.character.portraitUrl = null;
    state.inventory = [
      worn({ id: 'earth-clothes', name: 'Earth clothes', slot: 'Chest' }),
      worn({ id: 'hat', name: 'Hat', slot: 'Head' }),
      worn({ id: 'circle-blessing', name: 'Circle Blessing', slot: 'Off Hand' }),
    ];

    expect(needsPortraitRefresh(state)).toBe(true);
    expect(equippedItemsNeedingIcons(state).map((i) => i.name)).toEqual([
      'Earth clothes',
      'Hat',
      'Circle Blessing',
    ]);
    const prompt = paperDollPrompt(state);
    expect(prompt).toMatch(/Hat/);
    expect(prompt).toMatch(/Earth clothes/);
    expect(prompt).toMatch(/Circle Blessing/);
  });

  it('does not retry the same look after a compact fail', () => {
    const state = createInitialState('Jax', 'litrpg');
    state.character.appearance = '';
    state.character.bio = '';
    state.inventory = [worn({ id: 'hat', name: 'Hat', slot: 'Head' })];
    state.character.portraitFailed = true;
    state.character.portraitKey = portraitCacheKey(state);

    expect(needsPortraitRefresh(state)).toBe(false);
  });

  it('skips equipped items that already have art or a compact fail', () => {
    const state = createInitialState('Jax', 'litrpg');
    state.inventory = [
      worn({ id: 'hat', name: 'Hat', slot: 'Head', iconUrl: 'https://img.test/hat.png' }),
      worn({ id: 'clothes', name: 'Earth clothes', slot: 'Chest', iconFailed: true }),
      worn({ id: 'blessing', name: 'Circle Blessing', slot: 'Off Hand' }),
    ];
    expect(equippedItemsNeedingIcons(state).map((i) => i.id)).toEqual(['blessing']);
  });
});
