/**
 * tt-coin-credits — tabletop coins come from the in-house CR coin tables (SRD 5.2.1 has no treasure-by-CR
 * table), land in the purse as the coins rolled, and the Credits page carries the SRD 5.2.1 CC BY 4.0 notice.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { rollLoot } from './lootTableRegistry';
import { HOARD_COINS, INDIVIDUAL_COINS, coinBandFor, crNumber, rollCoinTable } from './rules/coinTables';
import { gainLootMoney, lootMoneyFound, lootMoneyText, purseCp, purseOf } from './rules/coins';
import { CREDIT_SECTIONS, SRD_5_2_1_NOTICE } from '@/legal/credits';
import type { GameState } from './types';

function st(mode: 'dnd' | 'litrpg', sheet = false): GameState {
  const s = createInitialState('Ria', mode);
  const character = sheet ? { ...s.character, srd: {} } : s.character;
  return { ...s, character, gmStrictness: 'standard', lootPity: { byTier: {} }, gold: 10 } as GameState;
}

describe('tt coin tables (in-house, CR-scaled)', () => {
  it('both tables are marked in-house and every band covers the whole d8', () => {
    for (const table of [INDIVIDUAL_COINS, HOARD_COINS]) {
      expect(table.source).toBe('in-house');
      for (const band of table.bands) {
        const covered = new Set(band.rows.flatMap((r) => Array.from({ length: r.to - r.from + 1 }, (_, i) => r.from + i)));
        expect([...covered].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      }
    }
  });

  it('CR picks the band and fractions read as numbers', () => {
    expect(crNumber('1/4')).toBe(0.25);
    expect(crNumber(7)).toBe(7);
    expect(crNumber('junk')).toBe(0);
    expect(coinBandFor(INDIVIDUAL_COINS, 0.25).minCr).toBe(0);
    expect(coinBandFor(INDIVIDUAL_COINS, 12).minCr).toBe(11);
    expect(coinBandFor(HOARD_COINS, 30).minCr).toBe(17);
  });

  it('a roll is seeded, shows every die, and the gold is the whole GP the coins are worth', () => {
    let i = 0;
    const seq = [0.99, 0.5, 0.5];
    const rng = () => seq[i++ % seq.length]!;
    const r = rollCoinTable(INDIVIDUAL_COINS, 0, rng);
    expect(r.lines[0]).toMatch(/^Coins \(SynapticGM individual table, CR 0.4\): d8 = 8; 2d4 = \d+ GP \[\d, \d\]$/);
    expect(r.gold).toBe(Math.floor(purseCp(r.coins) / 100));
  });

  it('higher CR pays more on average (hoard > individual)', () => {
    const avg = (table: typeof HOARD_COINS, cr: number) => {
      let sum = 0;
      for (let k = 0; k < 400; k++) {
        let s = k * 7919 + cr;
        const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
        sum += purseCp(rollCoinTable(table, cr, rng).coins);
      }
      return sum / 400;
    };
    expect(avg(INDIVIDUAL_COINS, 5)).toBeGreaterThan(avg(INDIVIDUAL_COINS, 0));
    expect(avg(INDIVIDUAL_COINS, 17)).toBeGreaterThan(avg(INDIVIDUAL_COINS, 11));
    expect(avg(HOARD_COINS, 0)).toBeGreaterThan(avg(INDIVIDUAL_COINS, 0));
  });
});

describe('tt coins reach the purse', () => {
  it('a humanoid foe drops coins; a beast drops none; a bronze chest holds coin with no owner', () => {
    const bandit = rollLoot({ profile: 'mob', state: st('dnd'), seed: 'b1', cr: '1/8', foeName: 'Bandit' });
    expect(bandit.coins).toBeDefined();
    const rat = rollLoot({ profile: 'mob', state: st('dnd'), seed: 'b1', foeName: 'Rat' });
    expect(rat.coins).toBeUndefined();
    expect(rat.gold).toBe(0);
    const chest = rollLoot({ profile: 'chestBronze', state: st('dnd'), seed: 'c1' });
    expect(chest.coins).toBeDefined();
    expect(chest.displayLines.join(' ')).toMatch(/Coins \(SynapticGM individual table/);
  });

  it('a sheet character banks the exact coins; plain gold elsewhere; LitRPG rolls no coins', () => {
    const loot = rollLoot({ profile: 'chestSilver', state: st('dnd', true), seed: 's1' });
    const after = gainLootMoney(st('dnd', true), loot.gold, loot.coins);
    expect(purseCp(purseOf(after)!)).toBe(10 * 100 + purseCp(loot.coins!));
    const plain = gainLootMoney(st('dnd'), loot.gold, loot.coins);
    expect(plain.gold).toBe(10 + loot.gold);
    const lit = rollLoot({ profile: 'chestSilver', state: st('litrpg'), seed: 's1' });
    expect(lit.coins).toBeUndefined();
    expect(lootMoneyText(7)).toBe('7');
    expect(lootMoneyFound(7)).toBe('7 gold');
    expect(lootMoneyText(0, { pp: 0, gp: 0, ep: 0, sp: 3, cp: 0 })).toBe('3 SP');
    expect(lootMoneyText(0)).toBeNull();
  });
});

describe('Credits', () => {
  const rows = CREDIT_SECTIONS.flatMap((s) => s.rows);

  it('carries the SRD 5.2.1 CC BY 4.0 notice word for word', () => {
    expect(SRD_5_2_1_NOTICE).toBe(
      'This work includes material from the System Reference Document 5.2.1 (SRD 5.2.1) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.'
    );
    expect(rows.find((r) => r.notice === SRD_5_2_1_NOTICE)?.license).toBe('CC BY 4.0');
    expect(rows.some((r) => /not a licensed rulebook/i.test(r.usedFor))).toBe(false);
  });

  it('lists the missing libraries and the in-house coin tables, and never brands with D&D', () => {
    expect(rows.find((r) => /@xenova\/transformers/.test(r.work))?.license).toBe('Apache-2.0');
    expect(rows.find((r) => r.work === 'languagetool-api')?.license).toBe('BSD-2-Clause');
    expect(rows.find((r) => /coin tables/i.test(r.work))?.license).toBe('Original');
    expect(rows.some((r) => /\bD&D\b|Dungeons & Dragons/.test(`${r.work} ${r.usedFor}`))).toBe(false);
  });
});
