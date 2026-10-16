/**
 * q31-ECR1 — SRD 5.2.1 crafting: recipe by item name (intent Craft), magic-item table,
 * consumable halving, spell prepared, Material component, journey/hostile refuse.
 */
import { describe, expect, it, vi } from 'vitest';
import { craftItemFromInput, craftRecipe } from './rules/downtime';
import { craftCost } from './rules/srdGear';
import { resolveDowntimeTurn } from './tabletop/downtimeTurn';
import * as characterBuild from './tabletop/characterBuild';
import { parsePlayerIntent } from './intentParser';
import { MAGIC_ITEMS } from './rules/magicItems';
import type { GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  return {
    engineMode: 'dnd',
    turn: 3,
    gold: 10_000,
    purse: undefined,
    inventory: [
      { id: 't1', name: "Smith's Tools", quantity: 1, rarity: 'Common', itemType: 'material' },
      { id: 't2', name: "Tinker's Tools", quantity: 1, rarity: 'Common', itemType: 'material' },
      { id: 't3', name: "Alchemist's Supplies", quantity: 1, rarity: 'Common', itemType: 'material' },
      { id: 't4', name: 'Herbalism Kit', quantity: 1, rarity: 'Common', itemType: 'material' },
      { id: 't5', name: "Calligrapher's Supplies", quantity: 1, rarity: 'Common', itemType: 'material' },
    ],
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 10,
      attributes: { STR: 10, DEX: 10, CON: 10, INT: 14, WIS: 12, CHA: 10 },
      srd: {
        classId: 'wizard',
        speciesId: 'human',
        backgroundId: 'sage',
        method: 'standard',
        baseScores: { STR: 10, DEX: 10, CON: 10, INT: 14, WIS: 12, CHA: 10 },
        bonus: {},
        skillProfs: ['Arcana', 'History'],
        expertise: [],
        languages: ['Common'],
        originFeats: [],
        kitId: 'A',
        source: 'build',
        spells: { cantrips: ['Fire Bolt', 'Light'], prepared: ['Magic Missile', 'Mage Armor'] },
      },
    },
    ...over,
  } as GameState;
}

describe('q31-ECR1 crafting (SRD 5.2.1)', () => {
  it('make-action + item name keys the recipe; Make camp stays Rest', () => {
    expect(parsePlayerIntent('Make camp by the fire').kind).toBe('rest');
    expect(craftItemFromInput('Fletch some arrows')).toBe('Arrows');
    expect(craftItemFromInput('Scribe a spell scroll of Cure Wounds')).toBe('Spell Scroll (Cure Wounds)');
    expect(craftItemFromInput('Craft Plate Armor')).toBe('Plate Armor');
  });

  it('Plate Armor: half cost materials, cost/10 days', () => {
    const r = craftRecipe('Plate Armor')!;
    expect(r).toMatchObject({ item: 'Plate Armor', tools: ["Smith's Tools"], costCp: 75000, days: 150, quantity: 1 });
    expect(r.costCp).toBe(craftCost(150000).materialsCp);
    expect(r.days).toBe(craftCost(150000).days);
  });

  it('Potion of Healing (brew rule), level-1 scroll, Common table and consumable half', () => {
    expect(craftRecipe('Potion of Healing')).toMatchObject({ costCp: 2500, days: 1, tools: ['Herbalism Kit'] });
    expect(craftRecipe('Spell Scroll (Magic Missile)')).toMatchObject({
      item: 'Spell Scroll (Magic Missile)',
      costCp: 2500,
      days: 1,
      spell: 'Magic Missile',
      tools: ['Arcana', "Calligrapher's Supplies"],
    });
    // Common table 5 days / 50 GP; consumable half → 2.5 / 25 (Potion of Climbing).
    expect(craftRecipe('Potion of Climbing')).toMatchObject({
      item: 'Potion of Climbing',
      requireArcana: true,
      costCp: 2500,
      days: 2.5,
      tools: ["Alchemist's Supplies"],
    });
    expect(craftRecipe('Potion of Climbing')!.days * 2).toBe(5);
    expect(craftRecipe('Potion of Climbing')!.costCp * 2).toBe(5000);
    expect(craftRecipe('Cloak of Protection')).toMatchObject({
      item: 'Cloak of Protection',
      requireArcana: true,
      costCp: 20000,
      days: 10,
      tools: ["Tinker's Tools"],
    });
  });

  it('resolve: Plate, potion, scroll, Common consumable, Cloak; refusals spend nothing', () => {
    const tools = vi.spyOn(characterBuild, 'toolProficiencies').mockReturnValue([
      "Smith's Tools",
      "Tinker's Tools",
      "Alchemist's Supplies",
      'Herbalism Kit',
      "Calligrapher's Supplies",
    ]);
    try {
      const plate = resolveDowntimeTurn(base({ gold: 800 }), 'Craft Plate Armor')!;
      expect(plate.receipts[0]).toMatch(/^Crafting: Plate Armor — 150 days of work, 750 GP in materials \(Smith's Tools\);/);
      expect(plate.state.gold).toBe(50);
      expect(plate.state.inventory!.some((i) => i.name === 'Plate Armor' && i.provenance === 'Crafted')).toBe(true);

      const brew = resolveDowntimeTurn(base({ gold: 30 }), 'Brew a potion of healing')!;
      expect(brew.receipts[0]).toMatch(/^Crafting: Potion of Healing — 1 day of work, 25 GP in materials \(Herbalism Kit\);/);

      const scroll = resolveDowntimeTurn(base({ gold: 30 }), 'Scribe a Spell Scroll (Magic Missile)')!;
      expect(scroll.receipts[0]).toMatch(/^Crafting: Spell Scroll \(Magic Missile\) — 1 day of work, 25 GP/);
      expect(scroll.state.worldHour).not.toBeUndefined();

      const climb = resolveDowntimeTurn(base({ gold: 30 }), 'Craft a Potion of Climbing')!;
      expect(climb.receipts[0]).toMatch(
        /^Crafting: Potion of Climbing — 2\.5 days of work, 25 GP in materials \(Arcana, Alchemist's Supplies\); \+60h/
      );
      expect(climb.state.inventory!.some((i) => i.name === 'Potion of Climbing')).toBe(true);
      expect(MAGIC_ITEMS['Potion of Climbing'].srdRarity).toBe('Common');

      const cloak = resolveDowntimeTurn(base({ gold: 250 }), 'Craft a Cloak of Protection')!;
      expect(cloak.receipts[0]).toMatch(
        /^Crafting: Cloak of Protection — 10 days of work, 200 GP in materials \(Arcana, Tinker's Tools\);/
      );

      const noArcana = resolveDowntimeTurn(
        base({
          gold: 250,
          character: {
            ...base().character,
            srd: { ...base().character.srd!, skillProfs: ['History'] },
          },
        }),
        'Craft a Cloak of Protection'
      )!;
      expect(noArcana.receipts[0]).toBe(
        'Crafting: Cloak of Protection — not done (you need Arcana proficiency); nothing spent'
      );
      expect(noArcana.state.gold).toBe(250);

      const noPrep = resolveDowntimeTurn(base({ gold: 30 }), 'Scribe a spell scroll of Cure Wounds')!;
      expect(noPrep.receipts[0]).toBe(
        'Crafting: Spell Scroll (Cure Wounds) — not done (you do not have Cure Wounds prepared); nothing spent'
      );

      const orbSheet = {
        ...base().character.srd!,
        spells: {
          cantrips: ['Fire Bolt'],
          prepared: ['Chromatic Orb'],
          spellbook: ['Chromatic Orb', 'Magic Missile', 'Mage Armor'],
        },
      };
      const needMat = resolveDowntimeTurn(
        { ...base({ gold: 30 }), character: { ...base().character, srd: orbSheet } },
        'Scribe a Spell Scroll (Chromatic Orb)'
      )!;
      expect(needMat.receipts[0]).toBe(
        'Crafting: Spell Scroll (Chromatic Orb) — not done (you do not have Diamond (50 GP) at hand); nothing spent'
      );
      const withMat = resolveDowntimeTurn(
        {
          ...base({ gold: 30 }),
          character: { ...base().character, srd: orbSheet },
          inventory: [
            ...base().inventory!,
            { id: 'd1', name: 'Diamond (50 GP)', quantity: 1, rarity: 'Common', itemType: 'material' },
          ],
        },
        'Scribe a Spell Scroll (Chromatic Orb)'
      )!;
      expect(withMat.receipts[0]).toMatch(/^Crafting: Spell Scroll \(Chromatic Orb\) — 1 day of work, 25 GP/);
      expect(withMat.state.inventory!.some((i) => i.name === 'Diamond (50 GP)')).toBe(false);

      const onRoad = resolveDowntimeTurn(
        { ...base(), journey: { from: 'A', to: 'B', legsDone: 0, legsTotal: 2, ground: 'road' } as GameState['journey'] },
        'Craft a longsword'
      )!;
      expect(onRoad.receipts[0]).toMatch(/not done \(you can't work here\)/);
      expect(onRoad.state.gold).toBe(10_000);

      expect(resolveDowntimeTurn(base(), 'Make camp by the fire')).toBeNull();
    } finally {
      tools.mockRestore();
    }
  });
});
