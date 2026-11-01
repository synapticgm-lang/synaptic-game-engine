/**
 * T10LOOT — Story RPG loot sanity + quick tweaks (Bravo rename, receipt phrase, Search roll).
 * XP amounts untouched. LitRPG / tabletop loot fixtures stay as before except Bravo display names.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  formatLootDisplayLines,
  formatLootStatusLine,
  profileForEncounter,
  rollLoot,
  type LootProfile,
} from './lootTableRegistry';
import { fightLootClause } from './infoSheet';
import { catalogFoeNames } from './encounterBible';
import { openSeededLootable } from './looseItems';
import { roundCombatChips, stabiliseHelpers } from './tabletop/combatChips';
import { applyTabletopSheet, resolveSheet } from './tabletop/characterBuild';
import { startDying } from './rules/death';
import type { GameState, Rarity } from './types';
import { DEFAULT_HOUSE_RULES } from './rules/houseRules';

function rpg(patch: Partial<GameState> = {}): GameState {
  const s = createInitialState('Jax', 'rpg');
  return { ...s, gmStrictness: 'standard', lootPity: { byTier: {} }, ...patch } as GameState;
}

function lit(patch: Partial<GameState> = {}): GameState {
  const s = createInitialState('Jax', 'litrpg');
  return { ...s, gmStrictness: 'standard', lootPity: { byTier: {} }, ...patch } as GameState;
}

function dnd(patch: Partial<GameState> = {}): GameState {
  const s0 = createInitialState('Jax', 'dnd');
  const sheet = resolveSheet({
    classId: 'rogue',
    speciesId: 'halfling',
    backgroundId: 'criminal',
    method: 'point-buy',
    baseScores: { STR: 8, DEX: 15, CON: 14, INT: 10, WIS: 12, CHA: 10 },
    kitId: 'A',
    source: 'build',
  });
  return applyTabletopSheet(
    {
      ...s0,
      engineMode: 'dnd',
      houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 3 },
      ...patch,
    },
    sheet
  );
}

const RANK = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
const rank = (r: Rarity) => RANK.indexOf(r);

describe('T10LOOT Story RPG loot', () => {
  it('ordinary mob: Common/Uncommon only, one item when it drops', () => {
    const drops = Array.from({ length: 200 }, (_, i) =>
      rollLoot({ profile: 'mob', state: rpg(), seed: `rpg-mob-${i}`, tier: 4 })
    ).filter((r) => !r.noDrop);
    expect(drops.length).toBeGreaterThan(50);
    for (const r of drops) {
      expect(r.items).toHaveLength(1);
      expect(rank(r.items[0]!.rarity)).toBeLessThanOrEqual(1);
    }
  });

  it('named/elite: Rare max, one item', () => {
    for (const profile of ['miniBoss', 'rareEncounter'] as LootProfile[]) {
      for (const r of Array.from({ length: 100 }, (_, i) =>
        rollLoot({ profile, state: rpg(), seed: `rpg-${profile}-${i}`, tier: 4 })
      )) {
        expect(r.items).toHaveLength(1);
        expect(rank(r.items[0]!.rarity)).toBeLessThanOrEqual(2);
      }
    }
    expect(profileForEncounter({ encounterId: 'RPG-ELITE-008' })).toBe('miniBoss');
  });

  it('boss may still drop Epic/Legendary', () => {
    const items = Array.from({ length: 200 }, (_, i) =>
      rollLoot({ profile: 'boss', state: rpg(), seed: `rpg-boss-${i}`, tier: 4, firstKill: true })
    ).flatMap((r) => r.items);
    expect(items.some((i) => rank(i.rarity) >= 3)).toBe(true);
  });

  it('x2 collapse on loot display / STATUS line', () => {
    const items = [
      { name: 'Jerkin', rarity: 'Common' as const },
      { name: 'Jerkin', rarity: 'Common' as const },
      { name: 'Mace', rarity: 'Uncommon' as const },
    ];
    expect(formatLootDisplayLines(items)).toEqual(['[Common] Jerkin x2', '[Uncommon] Mace']);
    expect(formatLootStatusLine(items)).toBe('Loot: [Common] Jerkin x2, [Uncommon] Mace');
  });

  it('LitRPG mob profile still allows multi-roll rares (unchanged owner for non-rpg)', () => {
    const boss = rollLoot({ profile: 'boss', state: lit(), seed: 'lit-boss', tier: 2 });
    expect(boss.items.length).toBeGreaterThanOrEqual(3);
  });
});

describe('T10LOOT Bravo rename + receipt phrase + chips + Search', () => {
  it('catalog foe display names have no Bravo suffix', () => {
    for (const mode of ['rpg', 'litrpg', 'dnd'] as const) {
      expect(catalogFoeNames(mode).some((n) => /\bBravo\b/i.test(n))).toBe(false);
    }
    expect(catalogFoeNames('rpg')).toContain('Salt Clerk (2)');
    expect(catalogFoeNames('rpg')).toContain('Road Claim Guard');
  });

  it('fightLootClause exists for checkers but is not player STATUS wording', () => {
    expect(fightLootClause('bare hands')).toMatch(/not the weapon that won/);
    expect(formatLootStatusLine([{ name: 'Hand Axe', rarity: 'Common' }])).toBe('Loot: [Common] Hand Axe');
    expect(formatLootStatusLine([{ name: 'Hand Axe', rarity: 'Common' }])).not.toMatch(/found after the blow/);
  });

  it('T10TABFIGHT stabiliseHelpers still blocks lastKill foe (tabletop owner; rpg/litrpg have no Ask-stabilise pad)', () => {
    const dying = startDying(
      dnd({
        sceneFacts: {
          crowd: 'none',
          noise: 'quiet',
          present: ['Wilds Stalker'],
          props: [],
          lastBeat: '',
          updatedTurn: 20,
          lastKill: { name: 'Wilds Stalker', outcome: 'victory', turn: 19, remains: true },
        },
        companions: [],
      }),
      20
    );
    expect(stabiliseHelpers(dying)).not.toContain('Wilds Stalker');
    expect(roundCombatChips(dying)?.some((c) => /Ask Wilds Stalker to stabilise/i.test(c))).toBeFalsy();
  });

  it('tabletop Search the area: engine Investigation roll, clue only (no loot/coin/XP)', () => {
    const base = dnd();
    const before: GameState = {
      ...base,
      currentLocation: 'Gatehouse',
      turn: 5,
      inventory: [],
      gold: 0,
      sceneFacts: {
        ...(base.sceneFacts ?? {
          crowd: 'none',
          noise: 'quiet',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: 5,
        }),
        props: ['a chalk mark on the lintel'],
        present: [],
        updatedTurn: 5,
      },
    };
    const xpBefore = before.character.xp;
    const goldBefore = before.gold ?? 0;
    const out = openSeededLootable(before, 'Search the area');
    expect(out.receipts.some((r) => /Investigation|d20|Search:/i.test(r))).toBe(true);
    expect(out.receipts.join('\n')).toMatch(/Search:/);
    expect(out.receipts.join('\n')).not.toMatch(/Loot:|Gold Gained:/i);
    expect(out.state.inventory ?? []).toEqual([]);
    expect(out.state.gold ?? 0).toBe(goldBefore);
    expect(out.state.character.xp).toBe(xpBefore);
    const again = openSeededLootable(out.state, 'Search the area');
    expect(again.receipts.join('\n')).toMatch(/nothing new/i);
  });
});
