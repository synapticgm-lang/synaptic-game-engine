/**
 * Shared rules engine — downtime crafting (SRD 5.2.1 CC-BY-4.0).
 * Nonmagical (half cost, days = GP/10); Potion of Healing; Spell Scrolls; Magic Items (p.206–207;
 * consumables other than scrolls halved). No mode; tabletop glue spends coin and days.
 */
import { ITEM_COST_CP } from './coins';
import { craftCost, SRD_ARMOR, SRD_WEAPONS } from './srdGear';
import { MAGIC_ITEMS, type SrdRarity } from './magicItems';
import { SPELLS } from './spells';

export interface CraftRecipe {
  item: string;
  tools: string[];
  requireArcana?: boolean;
  costCp: number;
  days: number;
  quantity: number;
  spell?: string;
  material?: { name: string; consumed?: boolean };
  magic?: boolean;
}

const SMITH = "Smith's Tools";
const LEATHER = "Leatherworker's Tools";
const WOOD = "Woodcarver's Tools";
const WEAVER = "Weaver's Tools";
const HERB = 'Herbalism Kit';
const CALLIGRAPHY = "Calligrapher's Supplies";
const ALCHEMY = "Alchemist's Supplies";
const JEWELER = "Jeweler's Tools";
const TINKER = "Tinker's Tools";

const MAGIC_CRAFT_TABLE: Record<SrdRarity, { days: number; costCp: number }> = {
  Common: { days: 5, costCp: 5000 },
  Uncommon: { days: 10, costCp: 20000 },
  Rare: { days: 50, costCp: 200000 },
  'Very Rare': { days: 125, costCp: 2_000_000 },
};

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

/** Recipe for an item name, or null when the engine has no craft rule. */
export function craftRecipe(name: string): CraftRecipe | null {
  const trimmed = name.trim();
  const scroll = SCROLL.exec(trimmed);
  if (scroll) {
    const def = SPELLS[Object.keys(SPELLS).find((n) => n.toLowerCase() === scroll[1]!.trim().toLowerCase()) ?? ''];
    if (!def) return null;
    return {
      item: `Spell Scroll (${def.name})`,
      tools: ['Arcana', CALLIGRAPHY],
      costCp: def.level === 0 ? 1500 : 2500,
      days: 1,
      quantity: 1,
      spell: def.name,
      magic: true,
      ...(def.material ? { material: { name: def.material, consumed: def.materialConsumed === true } } : {}),
    };
  }
  if (trimmed.toLowerCase() === 'potion of healing') {
    return { item: 'Potion of Healing', tools: [HERB], costCp: 2500, days: 1, quantity: 1, magic: true };
  }
  const magicKey = Object.keys(MAGIC_ITEMS).find((n) => n.toLowerCase() === trimmed.toLowerCase());
  if (magicKey && magicKey !== 'Potion of Healing') {
    const d = MAGIC_ITEMS[magicKey]!;
    const base = MAGIC_CRAFT_TABLE[d.srdRarity];
    if (!base) return null;
    const cost = d.itemType === 'consumable'
      ? { days: base.days / 2, costCp: Math.floor(base.costCp / 2) }
      : base;
    const low = magicKey.toLowerCase();
    const tool = !d ? TINKER
      : d.itemType === 'consumable' || low.startsWith('potion of ') ? ALCHEMY
      : d.slot === 'Finger' || low.startsWith('ring of ') ? JEWELER
      : d.itemType === 'weapon' || d.itemType === 'armor' || low.includes('armor') || low.includes('shield') ? SMITH
      : TINKER;
    return { item: magicKey, tools: [tool], requireArcana: true, costCp: cost.costCp, days: cost.days, quantity: 1, magic: true };
  }
  const key = Object.keys(ITEM_COST_CP).find((n) => n.toLowerCase() === trimmed.toLowerCase());
  if (!key) return null;
  const w = SRD_WEAPONS[key];
  const a = SRD_ARMOR[key];
  const tool = w
    ? (key === 'Sling' || key === 'Whip' ? LEATHER : w.ranged || key === 'Club' || key === 'Greatclub' || key === 'Quarterstaff' ? WOOD : SMITH)
    : a
      ? (key === 'Padded Armor' ? WEAVER : a.category === 'Light' || key === 'Hide Armor' ? LEATHER : SMITH)
      : GEAR_TOOLS[key]?.tool ?? null;
  if (!tool) return null;
  const quantity = GEAR_TOOLS[key]?.quantity ?? 1;
  const cost = craftCost(ITEM_COST_CP[key]! * quantity);
  return { item: key, tools: [tool], costCp: cost.materialsCp, days: cost.days, quantity };
}

/** Item named in a craft line — the item is the key, not the verb (E-CR1). */
export function craftItemFromInput(input: string): string | null {
  let line = (input ?? '').trim();
  while (line.endsWith('.') || line.endsWith('!')) line = line.slice(0, -1).trim();
  {
    const low = line.toLowerCase();
    if (low.startsWith('craft ')) line = line.slice(6).trim();
    else if (low.startsWith('forge ')) line = line.slice(6).trim();
    else if (low.startsWith('brew ')) line = line.slice(5).trim();
    else if (low.startsWith('scribe ')) line = line.slice(7).trim();
    else if (low.startsWith('fletch ')) line = line.slice(7).trim();
    else if (low.startsWith('carve ')) line = line.slice(6).trim();
    else if (low.startsWith('sew ')) line = line.slice(4).trim();
    else if (low.startsWith('weave ')) line = line.slice(6).trim();
    else if (low.startsWith('make ')) line = line.slice(5).trim();
  }
  {
    const low = line.toLowerCase();
    if (low.startsWith('myself an ')) line = line.slice(10).trim();
    else if (low.startsWith('myself a ')) line = line.slice(9).trim();
    else if (low.startsWith('me an ')) line = line.slice(6).trim();
    else if (low.startsWith('me a ')) line = line.slice(5).trim();
    else if (low.startsWith('some ')) line = line.slice(5).trim();
    else if (low.startsWith('the ')) line = line.slice(4).trim();
    else if (low.startsWith('an ')) line = line.slice(3).trim();
    else if (low.startsWith('a ')) line = line.slice(2).trim();
  }
  const direct = craftRecipe(line);
  if (direct) return direct.item;
  const low = line.toLowerCase();
  const ofAt = low.indexOf('spell scroll of ');
  if (ofAt >= 0) {
    let spell = line.slice(ofAt + 16).trim();
    if (spell.endsWith(')')) spell = spell.slice(0, -1).trim();
    const r = craftRecipe(`Spell Scroll (${spell})`);
    if (r) return r.item;
  }
  const parenAt = low.indexOf('spell scroll (');
  if (parenAt >= 0) {
    let spell = line.slice(parenAt + 14).trim();
    if (spell.endsWith(')')) spell = spell.slice(0, -1).trim();
    const r = craftRecipe(`Spell Scroll (${spell})`);
    if (r) return r.item;
  }
  let best: string | null = null;
  const names = [
    ...Object.keys(ITEM_COST_CP).filter((n) => !!craftRecipe(n) && !MAGIC_ITEMS[n]),
    ...Object.keys(MAGIC_ITEMS),
    'Potion of Healing',
  ];
  for (const n of names) {
    if (low.includes(n.toLowerCase()) && (!best || n.length > best.length)) best = n;
  }
  return best;
}
