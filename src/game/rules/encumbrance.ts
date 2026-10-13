/**
 * Carrying capacity and ammunition (SRD 5.2.1, CC-BY-4.0: Carrying Capacity = Strength × 15 lb; ranged weapons
 * with the Ammunition property spend one piece per attack). Weights are the SRD equipment-table weights.
 */
import type { Item } from '../types';

/** Pounds per item; ammunition and parchment are per piece. */
export const ITEM_WEIGHT_LB: Record<string, number> = {
  'Chain Mail': 55,
  'Chain Shirt': 20,
  'Leather Armor': 10,
  'Studded Leather Armor': 13,
  Shield: 6,
  Greatsword: 6,
  Flail: 2,
  Javelin: 2,
  Scimitar: 3,
  Shortsword: 2,
  Longbow: 2,
  Shortbow: 2,
  Dagger: 1,
  Mace: 4,
  Quarterstaff: 4,
  Spear: 3,
  'Light Crossbow': 5,
  Arrows: 0.05,
  Bolts: 0.075,
  Quiver: 1,
  "Dungeoneer's Pack": 55,
  "Burglar's Pack": 42,
  "Priest's Pack": 29,
  "Scholar's Pack": 22,
  "Thieves' Tools": 1,
  "Healer's Kit": 3,
  'Holy Symbol': 1,
  Spellbook: 3,
  Robe: 4,
  "Traveler's Clothes": 4,
  Crowbar: 5,
  Pouch: 1,
  'Gaming Set': 0,
  "Calligrapher's Supplies": 5,
  'Book (prayers)': 5,
  'Book (history)': 5,
  Parchment: 0,
  'Potion of Healing': 0.5,
};

/** An item the table does not list (loot, story items) counts as 1 lb. */
export const UNLISTED_ITEM_LB = 1;

export function itemWeightLb(name: string): number {
  return ITEM_WEIGHT_LB[name] ?? UNLISTED_ITEM_LB;
}

export function carriedWeightLb(inventory: Item[] | null | undefined): number {
  const total = (inventory ?? []).reduce((sum, i) => sum + itemWeightLb(i.name) * Math.max(1, i.quantity ?? 1), 0);
  return Math.round(total * 10) / 10;
}

export function carryingCapacityLb(strength: number): number {
  return Math.max(0, strength) * 15;
}

/** The ammunition a ranged weapon spends; null for a weapon that needs none. */
export function ammoFor(weapon: string): string | null {
  if (/bow$/i.test(weapon) && !/crossbow/i.test(weapon)) return 'Arrows';
  if (/crossbow/i.test(weapon)) return 'Bolts';
  return null;
}

export function ammoLeft(inventory: Item[] | null | undefined, ammo: string): number {
  return (inventory ?? []).filter((i) => i.name === ammo).reduce((s, i) => s + Math.max(0, i.quantity ?? 1), 0);
}

/** Take `n` pieces of ammunition out of the inventory (empty stacks drop). */
export function spendAmmo(inventory: Item[], ammo: string, n: number): Item[] {
  let left = n;
  return inventory
    .map((i) => {
      if (left <= 0 || i.name !== ammo) return i;
      const q = Math.max(0, i.quantity ?? 1);
      const take = Math.min(q, left);
      left -= take;
      return { ...i, quantity: q - take };
    })
    .filter((i) => i.name !== ammo || (i.quantity ?? 1) > 0);
}

/** Under Strict Encumbrance: which new items still fit under Strength × 15 lb, in order; the rest stay behind. */
export function fitCarry<T extends Item>(inventory: Item[], incoming: T[], strength: number): { kept: T[]; left: T[] } {
  const cap = carryingCapacityLb(strength);
  let load = carriedWeightLb(inventory);
  const kept: T[] = [];
  const left: T[] = [];
  for (const it of incoming) {
    const w = itemWeightLb(it.name) * Math.max(1, it.quantity ?? 1);
    if (load + w <= cap) {
      kept.push(it);
      load += w;
    } else left.push(it);
  }
  return { kept, left };
}

export function carryLine(inventory: Item[] | null | undefined, strength: number, rule: 'off' | 'capacity' | 'variant' = 'capacity'): string {
  const base = `Carrying ${carriedWeightLb(inventory)} lb of ${carryingCapacityLb(strength)} lb`;
  if (rule !== 'variant') return base;
  const load = variantLoad(inventory, strength);
  return load.state === 'unburdened' ? base : `${base} — ${load.state} (Speed −${load.speedPenalty} ft${load.heavy ? ', Disadvantage on STR/DEX/CON attacks, checks and saves' : ''})`;
}

/**
 * Variant Encumbrance (SRD 5.1, CC-BY-4.0): over Strength × 5 lb you are encumbered (Speed −10 ft); over
 * Strength × 10 lb you are heavily encumbered (Speed −20 ft, Disadvantage on ability checks, attack rolls and
 * saving throws that use Strength, Dexterity or Constitution).
 */
export function variantLoad(inventory: Item[] | null | undefined, strength: number): { state: 'unburdened' | 'encumbered' | 'heavily encumbered'; speedPenalty: number; heavy: boolean } {
  const lb = carriedWeightLb(inventory);
  const s = Math.max(0, strength);
  if (lb > s * 10) return { state: 'heavily encumbered', speedPenalty: 20, heavy: true };
  if (lb > s * 5) return { state: 'encumbered', speedPenalty: 10, heavy: false };
  return { state: 'unburdened', speedPenalty: 0, heavy: false };
}
