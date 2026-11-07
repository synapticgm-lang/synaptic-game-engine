/**
 * The held-item word list. Inventory and Equipped Gear keep the tail rule (a greataxe covers "axe").
 * The engine fact contributes the player's own "with your <weapon>" token and nothing else.
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
});
