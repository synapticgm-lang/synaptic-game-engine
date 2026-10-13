/**
 * Shared rules engine — weapons and armor.
 * The Weapons and Armor tables (damage, properties, mastery, cost) come from the System Reference Document 5.2.1
 * ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd, licensed under CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/legalcode).
 * One table: the sheet's weapon dice, the armor AC, the mastery a fight uses and the price a seller pays all read it.
 */

export type WeaponMastery = 'Cleave' | 'Graze' | 'Nick' | 'Push' | 'Sap' | 'Slow' | 'Topple' | 'Vex';

export interface SrdWeapon {
  dice: string;
  type: 'bludgeoning' | 'piercing' | 'slashing';
  martial: boolean;
  ranged: boolean;
  finesse?: boolean;
  light?: boolean;
  heavy?: boolean;
  twoHanded?: boolean;
  thrown?: boolean;
  mastery: WeaponMastery;
  /** Cost in copper. */
  cp: number;
}

const w = (dice: string, type: SrdWeapon['type'], mastery: WeaponMastery, cp: number, tags = ''): Omit<SrdWeapon, 'martial' | 'ranged'> => ({
  dice,
  type,
  mastery,
  cp,
  ...(tags.includes('F') ? { finesse: true } : {}),
  ...(tags.includes('L') ? { light: true } : {}),
  ...(tags.includes('H') ? { heavy: true } : {}),
  ...(tags.includes('2') ? { twoHanded: true } : {}),
  ...(tags.includes('T') ? { thrown: true } : {}),
});

const SIMPLE_MELEE = {
  Club: w('1d4', 'bludgeoning', 'Slow', 10, 'L'),
  Dagger: w('1d4', 'piercing', 'Nick', 200, 'FLT'),
  Greatclub: w('1d8', 'bludgeoning', 'Push', 20, '2'),
  Handaxe: w('1d6', 'slashing', 'Vex', 500, 'LT'),
  Javelin: w('1d6', 'piercing', 'Slow', 50, 'T'),
  'Light Hammer': w('1d4', 'bludgeoning', 'Nick', 200, 'LT'),
  Mace: w('1d6', 'bludgeoning', 'Sap', 500),
  Quarterstaff: w('1d6', 'bludgeoning', 'Topple', 20),
  Sickle: w('1d4', 'slashing', 'Nick', 100, 'L'),
  Spear: w('1d6', 'piercing', 'Sap', 100, 'T'),
};
const SIMPLE_RANGED = {
  Dart: w('1d4', 'piercing', 'Vex', 5, 'FT'),
  'Light Crossbow': w('1d8', 'piercing', 'Slow', 2500, '2'),
  Shortbow: w('1d6', 'piercing', 'Vex', 2500, '2'),
  Sling: w('1d4', 'bludgeoning', 'Slow', 10),
};
const MARTIAL_MELEE = {
  Battleaxe: w('1d8', 'slashing', 'Topple', 1000),
  Flail: w('1d8', 'bludgeoning', 'Sap', 1000),
  Glaive: w('1d10', 'slashing', 'Graze', 2000, 'H2'),
  Greataxe: w('1d12', 'slashing', 'Cleave', 3000, 'H2'),
  Greatsword: w('2d6', 'slashing', 'Graze', 5000, 'H2'),
  Halberd: w('1d10', 'slashing', 'Cleave', 2000, 'H2'),
  Lance: w('1d10', 'piercing', 'Topple', 1000, 'H2'),
  Longsword: w('1d8', 'slashing', 'Sap', 1500),
  Maul: w('2d6', 'bludgeoning', 'Topple', 1000, 'H2'),
  Morningstar: w('1d8', 'piercing', 'Sap', 1500),
  Pike: w('1d10', 'piercing', 'Push', 500, 'H2'),
  Rapier: w('1d8', 'piercing', 'Vex', 2500, 'F'),
  Scimitar: w('1d6', 'slashing', 'Nick', 2500, 'FL'),
  Shortsword: w('1d6', 'piercing', 'Vex', 1000, 'FL'),
  Trident: w('1d8', 'piercing', 'Topple', 500, 'T'),
  Warhammer: w('1d8', 'bludgeoning', 'Push', 1500),
  'War Pick': w('1d8', 'piercing', 'Sap', 500),
  Whip: w('1d4', 'slashing', 'Slow', 200, 'F'),
};
const MARTIAL_RANGED = {
  Blowgun: w('1d1', 'piercing', 'Vex', 1000),
  'Hand Crossbow': w('1d6', 'piercing', 'Vex', 7500, 'L'),
  'Heavy Crossbow': w('1d10', 'piercing', 'Push', 5000, 'H2'),
  Longbow: w('1d8', 'piercing', 'Slow', 5000, 'H2'),
};

const table = (rows: Record<string, Omit<SrdWeapon, 'martial' | 'ranged'>>, martial: boolean, ranged: boolean) =>
  Object.fromEntries(Object.entries(rows).map(([name, row]) => [name, { ...row, martial, ranged }])) as Record<string, SrdWeapon>;

/** SRD 5.2.1 Weapons table (firearms left out: this table's fantasy has none). */
export const SRD_WEAPONS: Record<string, SrdWeapon> = {
  ...table(SIMPLE_MELEE, false, false),
  ...table(SIMPLE_RANGED, false, true),
  ...table(MARTIAL_MELEE, true, false),
  ...table(MARTIAL_RANGED, true, true),
};

export interface SrdArmor {
  base: number;
  /** null = full DEX, 0 = none. */
  dexCap: number | null;
  category: 'Light' | 'Medium' | 'Heavy';
  /** Strength score needed, else Speed −10 ft. */
  strength?: number;
  stealthDisadvantage?: boolean;
  cp: number;
}

/** SRD 5.2.1 Armor table. */
export const SRD_ARMOR: Record<string, SrdArmor> = {
  'Padded Armor': { base: 11, dexCap: null, category: 'Light', stealthDisadvantage: true, cp: 500 },
  'Leather Armor': { base: 11, dexCap: null, category: 'Light', cp: 1000 },
  'Studded Leather Armor': { base: 12, dexCap: null, category: 'Light', cp: 4500 },
  'Hide Armor': { base: 12, dexCap: 2, category: 'Medium', cp: 1000 },
  'Chain Shirt': { base: 13, dexCap: 2, category: 'Medium', cp: 5000 },
  'Scale Mail': { base: 14, dexCap: 2, category: 'Medium', stealthDisadvantage: true, cp: 5000 },
  Breastplate: { base: 14, dexCap: 2, category: 'Medium', cp: 40000 },
  'Half Plate Armor': { base: 15, dexCap: 2, category: 'Medium', stealthDisadvantage: true, cp: 75000 },
  'Ring Mail': { base: 14, dexCap: 0, category: 'Heavy', stealthDisadvantage: true, cp: 3000 },
  'Chain Mail': { base: 16, dexCap: 0, category: 'Heavy', strength: 13, stealthDisadvantage: true, cp: 7500 },
  'Splint Armor': { base: 17, dexCap: 0, category: 'Heavy', strength: 15, stealthDisadvantage: true, cp: 20000 },
  'Plate Armor': { base: 18, dexCap: 0, category: 'Heavy', strength: 15, stealthDisadvantage: true, cp: 150000 },
};

export const SHIELD_AC = 2;
export const SHIELD_CP = 1000;

/** Cost in copper of every weapon and armor in the tables (and the Shield). */
export function srdGearCostCp(): Record<string, number> {
  return {
    ...Object.fromEntries(Object.entries(SRD_WEAPONS).map(([n, r]) => [n, r.cp])),
    ...Object.fromEntries(Object.entries(SRD_ARMOR).map(([n, r]) => [n, r.cp])),
    Shield: SHIELD_CP,
  };
}

/** Days of 8-hour work and the raw materials (copper) to craft an item (SRD 5.2.1 Crafting Nonmagical Items). */
export function craftCost(costCp: number): { days: number; materialsCp: number } {
  return { days: Math.max(1, Math.ceil(costCp / 1000)), materialsCp: Math.floor(costCp / 2) };
}
