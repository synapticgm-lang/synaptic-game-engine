/**
 * Shared rules engine — downtime crafting.
 * Crafting Nonmagical Items (tool proficiency, raw materials at half the cost, a day of work per 10 GP of cost),
 * Brewing Potions of Healing (Herbalism Kit, 25 GP, 1 day) and Scribing Spell Scrolls (Arcana or Calligrapher's
 * Supplies, the spell prepared; cantrip 15 GP / 1 day, level 1 25 GP / 1 day) come from the System Reference
 * Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd, licensed
 * under CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/legalcode). SRD 5.2.1 has no other downtime
 * activities; crafting is the downtime this engine runs.
 * This module knows no mode; the tabletop glue spends the coin and the days.
 */
import { ITEM_COST_CP } from './coins';
import { craftCost, SRD_ARMOR, SRD_WEAPONS } from './srdGear';
import { SPELLS } from './spells';

export interface CraftRecipe {
  /** The item made (a spell scroll is "Spell Scroll (Name)"). */
  item: string;
  /** Any one of these tool proficiencies lets you make it ("Arcana" is the skill for scrolls). */
  tools: string[];
  /** Coin spent, in copper. */
  costCp: number;
  /** 8-hour days of work. */
  days: number;
  quantity: number;
  /** A spell scroll needs this spell prepared. */
  spell?: string;
  magic?: boolean;
}

const SMITH = "Smith's Tools";
const LEATHER = "Leatherworker's Tools";
const WOOD = "Woodcarver's Tools";
const WEAVER = "Weaver's Tools";
const HERB = 'Herbalism Kit';
const CALLIGRAPHY = "Calligrapher's Supplies";

/** SRD 5.2.1 Tools: which tool crafts each weapon and armor. */
function gearTool(name: string): string | null {
  const w = SRD_WEAPONS[name];
  if (w) {
    if (name === 'Sling' || name === 'Whip') return LEATHER;
    if (w.ranged || name === 'Club' || name === 'Greatclub' || name === 'Quarterstaff') return WOOD;
    return SMITH;
  }
  const a = SRD_ARMOR[name];
  if (a) {
    if (name === 'Padded Armor') return WEAVER;
    if (a.category === 'Light' || name === 'Hide Armor') return LEATHER;
    return SMITH;
  }
  return null;
}

/** Other gear the SRD tools list as craftable, with the batch a day's work makes. */
const GEAR_TOOLS: Record<string, { tool: string; quantity?: number }> = {
  Arrows: { tool: WOOD, quantity: 20 },
  Bolts: { tool: WOOD, quantity: 20 },
  'Arcane Focus': { tool: WOOD },
  'Druidic Focus': { tool: WOOD },
  Antitoxin: { tool: HERB },
  Candle: { tool: HERB },
  "Healer's Kit": { tool: HERB },
  Ink: { tool: CALLIGRAPHY },
};

const SCROLL = /^spell scroll(?: of| \()?\s*([^)]+?)\)?$/i;

/** The recipe for an item name, or null when the engine has no craft rule for it. */
export function craftRecipe(name: string): CraftRecipe | null {
  const scroll = SCROLL.exec(name.trim());
  if (scroll) {
    const def = SPELLS[Object.keys(SPELLS).find((n) => n.toLowerCase() === scroll[1]!.trim().toLowerCase()) ?? ''];
    if (!def) return null;
    return { item: `Spell Scroll (${def.name})`, tools: ['Arcana', CALLIGRAPHY], costCp: def.level === 0 ? 1500 : 2500, days: 1, quantity: 1, spell: def.name, magic: true };
  }
  if (/^potion of healing$/i.test(name.trim())) {
    return { item: 'Potion of Healing', tools: [HERB], costCp: 2500, days: 1, quantity: 1, magic: true };
  }
  const key = Object.keys(ITEM_COST_CP).find((n) => n.toLowerCase() === name.trim().toLowerCase());
  if (!key) return null;
  const tool = gearTool(key) ?? GEAR_TOOLS[key]?.tool;
  if (!tool) return null;
  const quantity = GEAR_TOOLS[key]?.quantity ?? 1;
  const cost = craftCost(ITEM_COST_CP[key]! * quantity);
  return { item: key, tools: [tool], costCp: cost.materialsCp, days: cost.days, quantity };
}

/** Every item name the crafting rules know (for matching a typed line). */
export function craftableNames(): string[] {
  const gear = Object.keys(ITEM_COST_CP).filter((n) => gearTool(n) || GEAR_TOOLS[n]);
  return [...gear, 'Potion of Healing'];
}
