/**
 * Held items come from inventory, equipped gear, a loot or "On the body" list, and the player's
 * own "with your" or "your … lights the fight" token. A denial stays in that token's clause.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Flag = { kind: string; missing: string };

const check = async (gmText: string, engineFact = '', packet = '') => {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
    checkTurn: (row: unknown, packet: string, page?: string) => Flag[];
  };
  return mod.checkTurn({ turn: 2, gmText, engineFact, playerInput: 'Look' }, packet, '');
};

const item = (flags: Flag[], word: string) => flags.filter((f) => f.kind === 'item' && f.missing.includes(`"${word}"`));

describe('factCheck held items', () => {
  it('an inventory greataxe still covers axe', async () => {
    expect(item(await check('Jax swung their axe.', '', 'Inventory: Greataxe'), 'axe')).toEqual([]);
  });

  it('an equipped Worn Hand Axe still covers axe', async () => {
    expect(item(await check('Jax swung their axe.', '', 'Equipped Gear: Worn Hand Axe'), 'axe')).toEqual([]);
  });

  it('the player weapon slot "with your greataxe" covers axe', async () => {
    expect(item(await check('Jax swung their axe.', 'You attack the foe with your greataxe and miss.'), 'axe')).toEqual([]);
  });

  it('a foe longsword does not cover a sword', async () => {
    expect(item(await check('Jax drew their sword.', 'The wraith hits you with a longsword.'), 'sword')).toHaveLength(1);
  });

  it('a negated greataxe does not cover axe', async () => {
    expect(item(await check('Jax swung their axe.', 'You have no greataxe.'), 'axe')).toHaveLength(1);
    expect(item(await check('Jax swung their axe.', 'You do not fight with your greataxe.'), 'axe')).toHaveLength(1);
  });

  it('a negation after the weapon slot leaves the weapon held', async () => {
    expect(item(await check('Jax swung their axe.', 'You attack the foe with your greataxe and do not miss.'), 'axe')).toEqual([]);
  });

  it('a greataxe named on a sign does not cover axe', async () => {
    expect(item(await check('Jax swung their axe.', 'The sign names a greataxe.'), 'axe')).toHaveLength(1);
  });

  it('writer prose that names a greataxe does not cover axe', async () => {
    expect(item(await check('Jax swung their axe.', '', 'The sign names a greataxe.'), 'axe')).toHaveLength(1);
  });

  it('a held greataxe does not cover an invented sword', async () => {
    expect(item(await check('Jax drew their sword.', 'You attack the foe with your greataxe and miss.'), 'sword')).toHaveLength(1);
  });

  it('a sword the records do not hold is still rejected', async () => {
    expect(item(await check('Jax drew their sword.'), 'sword')).toHaveLength(1);
  });

  it('a loot grant of a hand axe still covers axe', async () => {
    expect(item(await check('Jax swung their axe.', 'Loot: [Common] Hand Axe.'), 'axe')).toEqual([]);
  });

  it('an explicit denial is not evidence the sword is held', async () => {
    expect(item(await check('Jax drew their sword.', 'You have no sword.'), 'sword')).toHaveLength(1);
    expect(item(await check('Jax drew their sword.', 'You are without a sword.'), 'sword')).toHaveLength(1);
    expect(item(await check('Jax drew their sword.', 'This is not a sword.'), 'sword')).toHaveLength(1);
    expect(item(await check('Jax drew their sword.', 'You do not hold a sword.'), 'sword')).toHaveLength(1);
    expect(item(await check('Jax drew their sword.', 'You do not currently hold a sword.'), 'sword')).toHaveLength(1);
    expect(item(await check('Jax drew their sword.', 'You do not currently fight with your sword.'), 'sword')).toHaveLength(1);
  });

  it('a foe weapon and a sign do not cover a sword', async () => {
    expect(item(await check('Jax drew their sword.', 'The wraith hits you with a sword.'), 'sword')).toHaveLength(1);
    expect(item(await check('Jax drew their sword.', 'The sign names a sword.'), 'sword')).toHaveLength(1);
  });

  it('a loot greataxe covers axe, and the player light token covers torch', async () => {
    expect(item(await check('Jax swung their axe.', 'Loot: [Common] Greataxe.'), 'axe')).toEqual([]);
    expect(item(await check('Jax raised their torch.', 'Light: darkness in the hall — your torch lights the fight.'), 'torch')).toEqual([]);
    expect(item(await check('Jax swung their axe.', 'The foe went down. On the body: Worn Hand Axe.'), 'axe')).toEqual([]);
  });

  it('inventory still covers a sword the engine fact denies', async () => {
    expect(item(await check('Jax drew their sword.', 'You do not currently hold a sword.', 'Inventory: Sword'), 'sword')).toEqual([]);
    expect(item(await check('Jax drew their sword.', 'You have no sword.', 'Inventory: Sword'), 'sword')).toEqual([]);
  });

  it('a denial and a later affirmative weapon slot both stand', async () => {
    expect(item(await check('Jax drew their sword.', 'You have no sword. You attack the foe with your sword and miss.'), 'sword')).toEqual([]);
    expect(item(await check('Jax drew their sword.', 'You have no sword, but you attack the foe with your sword and miss.'), 'sword')).toEqual([]);
  });

  it('a foe sword beside a real grant does not erase the grant or become one', async () => {
    const flags = await check(
      'Jax drew their sword. Jax swung their axe. Jax raised their torch.',
      'The wraith hits you with a sword. Loot: [Common] Greataxe. Light: darkness in the hall — your torch lights the fight.',
    );
    expect(item(flags, 'sword')).toHaveLength(1);
    expect(item(flags, 'axe')).toEqual([]);
    expect(item(flags, 'torch')).toEqual([]);
  });

  it('a denial of a sword leaves a hand-axe grant intact', async () => {
    const flags = await check('Jax drew their sword. Jax swung their axe.', 'You have no sword. Loot: [Common] Hand Axe.');
    expect(item(flags, 'sword')).toHaveLength(1);
    expect(item(flags, 'axe')).toEqual([]);
  });
});
