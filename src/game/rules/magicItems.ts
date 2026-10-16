/**
 * Shared rules engine — magic items and attunement.
 * Attunement (at most three items, during a Short Rest, no two copies of one item, ends at death) and the items
 * below (Cloak of Protection, Ring of Protection, Bracers of Defense, Potions of Healing) come from the System
 * Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd,
 * licensed under CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/legalcode).
 * One table: the sheet's AC and saves, a potion's heal and the attunement list all read it.
 * Rarity and attunement are the bundled SRD data (src/data/srd/srd521.json) wherever it names the item.
 */
import SRD from '../../data/srd/srd521.json';
import type { Item, Rarity } from '../types';

export type SrdRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare';

export interface MagicItemDef {
  srdRarity: SrdRarity;
  /** The game's loot rarity this item drops at (Very Rare drops as Epic). */
  rarity: Rarity;
  attunement: boolean;
  /** Bonus to AC (and `armorless`: only with no armor and no Shield). */
  ac?: number;
  armorless?: boolean;
  /** Bonus to every saving throw. */
  saves?: number;
  /** Potions: the HP regained. */
  heal?: string;
  itemType: Item['itemType'];
  slot?: string;
  text: string;
}

type EngineItem = Omit<MagicItemDef, 'srdRarity' | 'attunement'> & Partial<Pick<MagicItemDef, 'srdRarity' | 'attunement'>>;
const SRD_ITEMS = SRD.magicItems as Record<string, { rarity: SrdRarity; attunement: boolean }>;

/** The SRD data's rarity and attunement where it names the item (its potions are one "Rarity Varies" entry). */
const ENGINE_ITEMS: Record<string, EngineItem> = {
  'Potion of Healing': { srdRarity: 'Common', rarity: 'Common', attunement: false, heal: '2d4+2', itemType: 'consumable',
    text: 'Potion, Common. Drink it to regain 2d4 + 2 Hit Points.' },
  'Potion of Climbing': { srdRarity: 'Common', rarity: 'Common', attunement: false, itemType: 'consumable',
    text: 'Potion, Common. Drink it to gain a climbing speed equal to your Speed for 1 hour.' },
  'Potion of Greater Healing': { srdRarity: 'Uncommon', rarity: 'Uncommon', attunement: false, heal: '4d4+4', itemType: 'consumable',
    text: 'Potion, Uncommon. Drink it to regain 4d4 + 4 Hit Points.' },
  'Potion of Superior Healing': { srdRarity: 'Rare', rarity: 'Rare', attunement: false, heal: '8d4+8', itemType: 'consumable',
    text: 'Potion, Rare. Drink it to regain 8d4 + 8 Hit Points.' },
  'Potion of Supreme Healing': { srdRarity: 'Very Rare', rarity: 'Epic', attunement: false, heal: '10d4+20', itemType: 'consumable',
    text: 'Potion, Very Rare. Drink it to regain 10d4 + 20 Hit Points.' },
  'Cloak of Protection': { rarity: 'Uncommon', ac: 1, saves: 1, itemType: 'accessory', slot: 'Back',
    text: 'Wondrous Item, Uncommon (requires attunement). +1 to AC and saving throws.' },
  'Ring of Protection': { rarity: 'Rare', ac: 1, saves: 1, itemType: 'accessory', slot: 'Finger',
    text: 'Ring, Rare (requires attunement). +1 to AC and saving throws.' },
  'Bracers of Defense': { rarity: 'Rare', ac: 2, armorless: true, itemType: 'accessory', slot: 'Wrists',
    text: 'Wondrous Item, Rare (requires attunement). +2 to AC while you wear no armor and use no Shield.' },
};

export const MAGIC_ITEMS: Readonly<Record<string, MagicItemDef>> = Object.fromEntries(
  Object.entries(ENGINE_ITEMS).map(([name, item]) => {
    const srd = SRD_ITEMS[name];
    return [name, { ...item, srdRarity: srd?.rarity ?? item.srdRarity!, attunement: srd?.attunement ?? item.attunement! }];
  })
);

/** SRD 5.2.1: a creature can be attuned to no more than three magic items at a time. */
export const MAX_ATTUNED = 3;

export function magicItemDef(name: string | undefined): MagicItemDef | undefined {
  return name ? MAGIC_ITEMS[name] : undefined;
}

export function attunedItems(inventory: readonly Item[] | null | undefined): Item[] {
  return (inventory ?? []).filter((i) => i.attuned && magicItemDef(i.name)?.attunement);
}

/** AC from attuned magic items. `armored`: wearing armor or a Shield (Bracers of Defense stop working). */
export function magicAcBonus(inventory: readonly Item[] | null | undefined, armored: boolean): { bonus: number; from: string[] } {
  let bonus = 0;
  const from: string[] = [];
  for (const i of attunedItems(inventory)) {
    const d = magicItemDef(i.name)!;
    if (!d.ac || (d.armorless && armored)) continue;
    bonus += d.ac;
    from.push(i.name);
  }
  return { bonus, from };
}

/** Bonus to every saving throw from attuned magic items. */
export function magicSaveBonus(inventory: readonly Item[] | null | undefined): number {
  return attunedItems(inventory).reduce((s, i) => s + (magicItemDef(i.name)?.saves ?? 0), 0);
}

/** The heal of the best potion carried (a plain "healing potion" counts as a Potion of Healing). */
export function potionHealDice(name: string): string {
  return magicItemDef(name)?.heal ?? MAGIC_ITEMS['Potion of Healing'].heal!;
}

/** A magic item as an inventory row. */
export function magicItem(name: string, id: string, provenance: string): Item {
  const d = MAGIC_ITEMS[name];
  return {
    id,
    name,
    rarity: d.rarity,
    quantity: 1,
    itemType: d.itemType,
    ...(d.slot ? { slot: d.slot } : {}),
    description: d.text,
    provenance,
  };
}

/** The SRD items that drop at a loot rarity (Common drops stay ordinary gear). */
export function magicItemsAtRarity(rarity: Rarity): string[] {
  if (rarity === 'Common' || rarity === 'Legendary') return [];
  return Object.entries(MAGIC_ITEMS).filter(([, d]) => d.rarity === rarity).map(([n]) => n);
}

/** Why `name` cannot be attuned now (null = it can). */
export function attunementProblem(inventory: readonly Item[] | null | undefined, name: string): string | null {
  const d = magicItemDef(name);
  if (!d) return `${name} is not a magic item`;
  if (!d.attunement) return `${name} does not need attunement`;
  const row = (inventory ?? []).find((i) => i.name === name);
  if (!row) return `you do not carry ${name}`;
  if ((inventory ?? []).some((i) => i.name === name && i.attuned)) return `you are already attuned to ${name}`;
  if (attunedItems(inventory).length >= MAX_ATTUNED) return `you are already attuned to ${MAX_ATTUNED} items`;
  return null;
}
