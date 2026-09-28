/**
 * Loot Table Registry
 * 
 * Manages loot drop tables across all game modes (LitRPG, DnD, RPG, PYOA).
 * Integrates with encounter aftermath receipts for deterministic loot generation.
 * 
 * Features:
 * - Seeded selection for deterministic drops
 * - Biome-appropriate loot filtering
 * - Pity counters for rare drops
 * - Outcome multipliers (victory, negotiated, fled, defeat)
 * - Idempotent commit requirements
 * 
 * Related:
 * - encounterAftermath.ts - Receipt generation
 * - encounterBiomeMatrix.ts - Biome detection
 * - data/encounters/D9_loot_tables.json - Content catalog
 */

import type { GameState, Item, Rarity } from './types';
import { rollLootRarityWithPity } from './dungeonSeed';
import { difficultyRow } from './difficultyRules';
import { createHashRng } from './seededRng';
import { weaponCategory, type WeaponCategory } from './checkRules';
import lootTablesData from './data/encounters/D9_loot_tables.json';

export interface LootEntry {
  id: string;
  category: 'currency' | 'crafting' | 'consumable' | 'equipment' | 'weapon-component' | 'progression' | 'quest-item';
  weight: number;
  quantity: string; // e.g. "8-18", "1-3"
  tags: string[];
}

export interface LootTable {
  rolls: number;
  entries: LootEntry[];
  guarantees: string[];
}

export interface ModeLootTables {
  currency: string;
  tables: {
    trash: LootTable;
    elite: LootTable;
    boss: LootTable;
  };
}

export interface LootCatalog {
  schemaVersion: string;
  catalogId: string;
  globalRules: {
    seededSelection: boolean;
    previewCategoriesBeforeEncounter: boolean;
    applyOnlyAfterTerminal: boolean;
    idempotentCommitRequired: boolean;
    duplicateUniqueConvertsTo: string;
    pityCounters: {
      eliteRareAfterMisses: number;
      bossBuildItemGuaranteed: boolean;
    };
    outcomeMultipliers: {
      victory: number;
      negotiated: number;
      partial: number;
      fled: number;
      defeat: number;
    };
  };
  modes: {
    litrpg: ModeLootTables;
    dnd: ModeLootTables;
    rpg: ModeLootTables;
    pyoa: ModeLootTables;
  };
}

// Validated catalog at module load time
const LOOT_CATALOG: LootCatalog = lootTablesData as LootCatalog;

// Pity counter tracking per save
interface PityCounters {
  eliteMisses: number;
  lastRareEncounter: number | null;
}

/**
 * Seeded random number generator for deterministic loot
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const x = Math.sin(Math.abs(hash)) * 10000;
  return x - Math.floor(x);
}

/**
 * Parse quantity string (e.g. "8-18") into random value using seed
 */
function parseQuantity(quantityStr: string, seed: string): number {
  if (!quantityStr.includes('-')) {
    return parseInt(quantityStr, 10);
  }
  
  const [min, max] = quantityStr.split('-').map(s => parseInt(s, 10));
  const range = max - min;
  return min + Math.floor(seededRandom(seed + '-qty') * (range + 1));
}

/**
 * Select entries from loot table using weighted seeded random
 */
function selectLootEntries(
  table: LootTable,
  seed: string,
  biome: string,
  pityCounters: PityCounters,
  turnIndex: number
): LootEntry[] {
  const selected: LootEntry[] = [];
  const totalWeight = table.entries.reduce((sum, e) => sum + e.weight, 0);
  
  for (let roll = 0; roll < table.rolls; roll++) {
    const rollSeed = `${seed}-roll${roll}`;
    const rand = seededRandom(rollSeed);
    let accumulated = 0;
    
    for (const entry of table.entries) {
      accumulated += entry.weight / totalWeight;
      
      if (rand <= accumulated) {
        // Apply biome filtering for biome-derived items
        if (entry.tags.includes('biome-derived')) {
          // Biome-specific filtering would go here
          // For now, accept all biome-derived items
        }
        
        selected.push(entry);
        break;
      }
    }
  }
  
  // Apply pity counter logic for rare equipment
  const hasRareEquipment = selected.some(e => 
    e.category === 'equipment' && e.tags.includes('rare')
  );
  
  if (!hasRareEquipment && table === LOOT_CATALOG.modes.litrpg.tables.elite) {
    pityCounters.eliteMisses++;
    
    if (pityCounters.eliteMisses >= LOOT_CATALOG.globalRules.pityCounters.eliteRareAfterMisses) {
      // Force add a rare equipment item
      const rareEntry = table.entries.find(e => 
        e.category === 'equipment' && e.tags.includes('rare')
      );
      if (rareEntry) {
        selected.push(rareEntry);
        pityCounters.eliteMisses = 0;
        pityCounters.lastRareEncounter = turnIndex;
      }
    }
  } else if (hasRareEquipment) {
    pityCounters.eliteMisses = 0;
    pityCounters.lastRareEncounter = turnIndex;
  }
  
  return selected;
}

/**
 * Generate loot for an encounter aftermath
 */
export interface LootReceipt {
  items: Array<{
    id: string;
    category: string;
    quantity: number;
    tags: string[];
  }>;
  currency: {
    type: string;
    amount: number;
  };
  appliedMultiplier: number;
  pityCounterUpdate?: Partial<PityCounters>;
  /** 28d — engine rarity roll for the source profile (rollLoot), when a profile is given. */
  rarityRoll?: LootRollResult;
}

export function generateLoot(
  mode: 'litrpg' | 'dnd' | 'rpg' | 'pyoa',
  role: 'trash' | 'elite' | 'boss',
  outcome: 'victory' | 'negotiated' | 'partial' | 'fled' | 'defeat',
  biome: string,
  seed: string,
  state: GameState,
  /** 28d — source profile; adds the engine rarity roll (rollLoot) to the receipt. */
  profile?: LootProfile
): LootReceipt {
  const modeTables = LOOT_CATALOG.modes[mode];
  const table = modeTables.tables[role];
  const multiplier = LOOT_CATALOG.globalRules.outcomeMultipliers[outcome];
  
  // Initialize or load pity counters
  const pityCounters: PityCounters = {
    eliteMisses: (state as any).lootPityCounters?.eliteMisses ?? 0,
    lastRareEncounter: (state as any).lootPityCounters?.lastRareEncounter ?? null
  };
  
  // Select entries
  const selectedEntries = selectLootEntries(
    table,
    seed,
    biome,
    pityCounters,
    state.turnIndex
  );
  
  // Calculate quantities and apply multiplier
  const items = selectedEntries.map(entry => ({
    id: entry.id,
    category: entry.category,
    quantity: Math.max(1, Math.floor(parseQuantity(entry.quantity, seed + entry.id) * multiplier)),
    tags: entry.tags
  }));
  
  // Calculate currency
  const currencyEntries = selectedEntries.filter(e => e.category === 'currency');
  const totalCurrency = currencyEntries.reduce((sum, entry) => 
    sum + parseQuantity(entry.quantity, seed + entry.id), 0
  );
  
  return {
    items: items.filter(i => i.category !== 'currency'),
    currency: {
      type: modeTables.currency,
      amount: Math.floor(totalCurrency * multiplier)
    },
    appliedMultiplier: multiplier,
    pityCounterUpdate: pityCounters,
    rarityRoll: profile ? rollLoot({ profile, state, seed }) : undefined
  };
}

/**
 * Get loot preview categories before encounter (telegraph support)
 */
export function getLootPreview(
  mode: 'litrpg' | 'dnd' | 'rpg' | 'pyoa',
  role: 'trash' | 'elite' | 'boss'
): string[] {
  if (!LOOT_CATALOG.globalRules.previewCategoriesBeforeEncounter) {
    return [];
  }
  
  const table = LOOT_CATALOG.modes[mode].tables[role];
  const categories = new Set(table.entries.map(e => e.category));
  return Array.from(categories);
}

/**
 * Check if loot commit is idempotent (no duplicate unique items)
 */
export function validateLootCommit(
  receipt: LootReceipt,
  existingInventory: string[]
): { valid: boolean; conflicts: string[] } {
  if (!LOOT_CATALOG.globalRules.idempotentCommitRequired) {
    return { valid: true, conflicts: [] };
  }
  
  const uniqueItems = receipt.items.filter(i => i.tags.includes('unique'));
  const conflicts = uniqueItems
    .filter(item => existingInventory.includes(item.id))
    .map(item => item.id);
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
}

/**
 * Convert duplicate unique items to mode-specific currency
 */
export function convertDuplicateUniques(
  receipt: LootReceipt,
  mode: 'litrpg' | 'dnd' | 'rpg' | 'pyoa',
  existingInventory: string[]
): LootReceipt {
  const validation = validateLootCommit(receipt, existingInventory);
  
  if (validation.valid) {
    return receipt;
  }
  
  // Convert conflicting uniques to currency
  const currencyPerUnique = 100; // Base value, could be item-specific
  const additionalCurrency = validation.conflicts.length * currencyPerUnique;
  
  return {
    ...receipt,
    items: receipt.items.filter(item => !validation.conflicts.includes(item.id)),
    currency: {
      ...receipt.currency,
      amount: receipt.currency.amount + additionalCurrency
    }
  };
}

/**
 * Apply boss build item guarantee
 */
export function applyBossBuildGuarantee(
  receipt: LootReceipt,
  role: 'trash' | 'elite' | 'boss',
  buildTags: string[]
): LootReceipt {
  if (role !== 'boss' || !LOOT_CATALOG.globalRules.pityCounters.bossBuildItemGuaranteed) {
    return receipt;
  }
  
  const hasBuildItem = receipt.items.some(item => 
    buildTags.some(tag => item.tags.includes(tag))
  );
  
  if (hasBuildItem) {
    return receipt;
  }
  
  // Force add a build-relevant item
  // This would typically look at the player's active build and add a relevant drop
  // For now, return as-is (requires build system integration)
  return receipt;
}

// ─────────────────────────────────────────────────────────────────────────────
// 28d — LOOT-RESEARCH.md §4: one engine loot roll. Source profiles, 5e treasure for D&D (dice shown),
// no duplicate Legendary, 80% class fit, shared difficulty table. The AI never rolls loot.
// Rarity curves + pity are the existing dungeonSeed rollLootRarityWithPity (no parallel system).
//
// D&D treasure: the Individual Treasure / Treasure Hoard / magic-item-rarity-by-level tables are from the
// 2024 Dungeon Master's Guide (Roll20 compendium transcription, see LOOT-RESEARCH.md). They are NOT part of
// SRD 5.2.1; only the numbers (dice + bands) are used here, no rules text.
// ─────────────────────────────────────────────────────────────────────────────

export type LootProfile = 'mob' | 'miniBoss' | 'boss' | 'chestBronze' | 'chestSilver' | 'chestGold' | 'rareEncounter';

export interface LootProfileRow {
  label: string;
  /** Rarity rolls before difficulty (Hard adds lootExtraBossRolls to boss). */
  rolls: number;
  /** Rarity tier step. Mini-boss / boss use the difficulty table's bossRarityTierBonus instead. */
  tierBonus: number;
  /** Chance (%) the whole drop is nothing (Diablo 2 NoDrop). */
  noDropPct: number;
  /** At least one item of this rarity or better. */
  floor: Rarity | null;
  /** Boss first kill: at least one item of this rarity or better. */
  firstKillFloor: Rarity | null;
  /** A rare encounter resets the dry-streak pity. */
  resetsPity: boolean;
  /** Maps onto the D9 catalog role (trash / elite / boss). */
  tableRole: 'trash' | 'elite' | 'boss';
  /** D&D: which 5e table. */
  dndTable: 'individual' | 'hoard';
  /** DCC-style chest / box label (LitRPG shows it). */
  boxLabel?: 'Bronze' | 'Silver' | 'Gold';
}

export const LOOT_PROFILES: Readonly<Record<LootProfile, LootProfileRow>> = {
  mob: { label: 'Mob', rolls: 1, tierBonus: 0, noDropPct: 35, floor: null, firstKillFloor: null, resetsPity: false, tableRole: 'trash', dndTable: 'individual' },
  miniBoss: { label: 'Mini-boss', rolls: 2, tierBonus: 1, noDropPct: 0, floor: 'Uncommon', firstKillFloor: null, resetsPity: false, tableRole: 'elite', dndTable: 'individual' },
  boss: { label: 'Boss', rolls: 3, tierBonus: 1, noDropPct: 0, floor: 'Rare', firstKillFloor: 'Epic', resetsPity: false, tableRole: 'boss', dndTable: 'hoard' },
  chestBronze: { label: 'Bronze chest', rolls: 1, tierBonus: 0, noDropPct: 0, floor: null, firstKillFloor: null, resetsPity: false, tableRole: 'trash', dndTable: 'hoard', boxLabel: 'Bronze' },
  chestSilver: { label: 'Silver chest', rolls: 2, tierBonus: 0, noDropPct: 0, floor: null, firstKillFloor: null, resetsPity: false, tableRole: 'elite', dndTable: 'hoard', boxLabel: 'Silver' },
  chestGold: { label: 'Gold chest', rolls: 3, tierBonus: 0, noDropPct: 0, floor: null, firstKillFloor: null, resetsPity: false, tableRole: 'boss', dndTable: 'hoard', boxLabel: 'Gold' },
  rareEncounter: { label: 'Rare encounter', rolls: 1, tierBonus: 2, noDropPct: 0, floor: 'Epic', firstKillFloor: null, resetsPity: true, tableRole: 'elite', dndTable: 'hoard' },
};

/** Chest grade 1–3 (dungeonSeed HiddenLoot.grade) → profile. */
export function chestProfileForGrade(grade: number | undefined): LootProfile {
  return grade === 3 ? 'chestGold' : grade === 2 ? 'chestSilver' : 'chestBronze';
}

/** Encounter card → loot profile (boss / elite ids and sources; everything else is a mob). */
export function profileForEncounter(
  enc: { encounterId?: string; source?: string; forcedSpawnKey?: string; name?: string } | null | undefined
): LootProfile {
  const key = `${enc?.encounterId ?? ''} ${enc?.source ?? ''} ${enc?.forcedSpawnKey ?? ''}`;
  if (/boss/i.test(key)) return 'boss';
  if (/rare[-_ ]?encounter/i.test(key)) return 'rareEncounter';
  if (/elite|mini[-_ ]?boss/i.test(key)) return 'miniBoss';
  return 'mob';
}

const LOOT_RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const rarityIdx = (r: Rarity): number => LOOT_RARITIES.indexOf(r);

export type LootItemCategory = WeaponCategory | 'armour' | 'focus' | 'trinket';

const BASE_NAMES: Record<LootItemCategory, string> = {
  blade: 'Longsword',
  axe: 'Hand Axe',
  blunt: 'Mace',
  polearm: 'Spear',
  bow: 'Shortbow',
  firearm: 'Pistol',
  unarmed: 'Knuckle Wraps',
  armour: 'Jerkin',
  focus: 'Focus Charm',
  trinket: 'Pendant',
};

const RARITY_PREFIX: Record<Exclude<Rarity, 'Legendary'>, string> = {
  Common: 'Worn',
  Uncommon: 'Fine',
  Rare: 'Runed',
  Epic: 'Masterwork',
};

/** Named Legendaries — each drops once until the pool is exhausted (Hearthstone-style duplicate protection). */
export const LEGENDARY_POOL: ReadonlyArray<{ name: string; category: LootItemCategory }> = [
  { name: 'Dawnsplitter', category: 'blade' },
  { name: 'Oathkeeper Axe', category: 'axe' },
  { name: 'Stoneheart Maul', category: 'blunt' },
  { name: 'Windpiercer Spear', category: 'polearm' },
  { name: 'Hollowstring Bow', category: 'bow' },
  { name: 'The Last Word', category: 'firearm' },
  { name: 'Ironvow Wraps', category: 'unarmed' },
  { name: 'Aegis of Embers', category: 'armour' },
  { name: 'Starwell Focus', category: 'focus' },
  { name: 'Lodestar Pendant', category: 'trinket' },
];

/** Share of drops that fit the player's build (Diablo 3 Smart Loot uses 85%). */
export const CLASS_FIT_SHARE = 0.8;

/** The player's build: weapon proficiencies, else the equipped weapon, else the highest attribute. */
export function classFitCategories(state: GameState): LootItemCategory[] {
  const profs = state.character?.weaponProficiencies ?? [];
  if (profs.length) return [...profs, 'armour'];
  const held = (state.inventory ?? []).find((i) => i.equipped && /hand|weapon|main/i.test(i.slot ?? ''));
  if (held?.name) {
    const cat = weaponCategory(held.name);
    if (cat !== 'unarmed') return [cat, 'armour'];
  }
  const a = state.character?.attributes;
  const str = a?.STR ?? state.character?.strength ?? 10;
  const dex = a?.DEX ?? 10;
  const mind = Math.max(a?.INT ?? 10, a?.WIS ?? 10, a?.CHA ?? 10);
  if (mind > str && mind > dex) return ['focus', 'trinket'];
  if (dex > str) return ['blade', 'bow', 'armour'];
  return ['blade', 'axe', 'blunt', 'armour'];
}

function pickFrom<T>(list: readonly T[], rng: () => number): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]!;
}

function rollDie(sides: number, rng: () => number): number {
  return 1 + Math.min(sides - 1, Math.floor(rng() * sides));
}

function rollDice(n: number, sides: number, rng: () => number): { rolls: number[]; sum: number } {
  const rolls: number[] = [];
  for (let i = 0; i < n; i++) rolls.push(rollDie(sides, rng));
  return { rolls, sum: rolls.reduce((s, r) => s + r, 0) };
}

function crNumber(cr: string | number | null | undefined, fallbackLevel: number): number {
  if (typeof cr === 'number' && Number.isFinite(cr)) return cr;
  if (typeof cr === 'string' && cr.trim()) {
    const m = cr.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return Number(m[1]) / Math.max(1, Number(m[2]));
    const n = Number(cr);
    if (Number.isFinite(n)) return n;
  }
  return Math.max(0, fallbackLevel);
}

function crBand(cr: number): { label: string; band: 0 | 1 | 2 | 3 } {
  if (cr <= 4) return { label: 'CR 0–4', band: 0 };
  if (cr <= 10) return { label: 'CR 5–10', band: 1 };
  if (cr <= 16) return { label: 'CR 11–16', band: 2 };
  return { label: 'CR 17+', band: 3 };
}

/** 2024 DMG Individual Treasure, one roll per creature: [dice, sides, multiplier, coin]. */
export const DND_INDIVIDUAL_TREASURE: ReadonlyArray<readonly [number, number, number, 'gp' | 'pp']> = [
  [3, 6, 1, 'gp'],
  [2, 8, 10, 'gp'],
  [2, 10, 10, 'pp'],
  [2, 8, 100, 'pp'],
];

/**
 * 2024 DMG Treasure Hoard: coins [dice, sides, multiplier] + magic items [dice, sides, minus].
 * CR 11–16 is printed as 8d8×10,000 but with an average of 36,000; we use ×1,000 (the likely misprint).
 */
export const DND_HOARD: ReadonlyArray<{ coins: readonly [number, number, number]; items: readonly [number, number, number] }> = [
  { coins: [2, 4, 100], items: [1, 4, 1] },
  { coins: [8, 10, 100], items: [1, 3, 0] },
  { coins: [8, 8, 1000], items: [1, 4, 0] },
  { coins: [6, 10, 10000], items: [1, 6, 0] },
];

/**
 * 2024 DMG magic item rarity by level, levels 1–4 row (01–54 Common, 55–91 Uncommon, 92–00 Rare).
 * Only this row was confirmed (LOOT-RESEARCH.md); higher levels use it too until the other rows are verified.
 * Very Rare maps to Epic.
 */
export function dndItemRarity(d100: number): Rarity {
  if (d100 <= 54) return 'Common';
  if (d100 <= 91) return 'Uncommon';
  return 'Rare';
}

export interface LootRollResult {
  profile: LootProfile;
  items: Item[];
  /** Category of each item (same order) — class fit audit. */
  categories: LootItemCategory[];
  /** Engine gold from the roll (D&D 5e coins; 0 in other modes, where cards carry goldReward). */
  gold: number;
  coin: 'gp' | 'pp';
  noDrop: boolean;
  /** D&D: every die shown. Other modes: empty. */
  dice: string[];
  /** Player-facing lines: D&D the dice; LitRPG/RPG/PYOA items with rarity only. */
  displayLines: string[];
  pityTier: 1 | 2 | 3 | 4;
  /** New dry-streak count for pityTier (null = unchanged). */
  nextPity: number | null;
}

function makeItem(
  rarity: Rarity,
  state: GameState,
  owned: Set<string>,
  rng: () => number,
  fit: LootItemCategory[],
  dnd: boolean,
  id: string,
  profile: LootProfile
): { item: Item; category: LootItemCategory } {
  const all = (Object.keys(BASE_NAMES) as LootItemCategory[]).filter((c) => !(dnd && c === 'firearm'));
  const fitList = fit.filter((c) => all.includes(c));
  const offList = all.filter((c) => !fitList.includes(c));
  const wantFit = fitList.length > 0 && (offList.length === 0 || rng() < CLASS_FIT_SHARE);
  let category = pickFrom(wantFit ? fitList : offList, rng);
  let finalRarity = rarity;
  let name = '';
  if (rarity === 'Legendary') {
    const free = LEGENDARY_POOL.filter((l) => !owned.has(l.name.toLowerCase()) && !(dnd && l.category === 'firearm'));
    const pref = free.filter((l) => l.category === category);
    const pick = pref[0] ?? free[0];
    if (pick) {
      name = pick.name;
      category = pick.category;
      owned.add(pick.name.toLowerCase());
    } else {
      // Pool exhausted: no duplicate Legendary — salvage to Epic.
      finalRarity = 'Epic';
    }
  }
  if (!name) name = `${RARITY_PREFIX[finalRarity as Exclude<Rarity, 'Legendary'>]} ${BASE_NAMES[category]}`;
  void state;
  return {
    item: { id, name, rarity: finalRarity, quantity: 1, provenance: `Engine loot (${LOOT_PROFILES[profile].label})` },
    category,
  };
}

/**
 * The one engine loot roll. Seeded; runs when an encounter resolves (kills) or a chest is opened.
 * LitRPG / RPG / PYOA: profile rolls on the tier curves with pity. D&D: 5e Individual / Hoard with dice shown.
 */
export function rollLoot(input: {
  profile: LootProfile;
  state: GameState;
  seed: string;
  /** Map tier 1–4 (defaults to the active dungeon, else from level). */
  tier?: number;
  cr?: string | number | null;
  firstKill?: boolean;
  rng?: () => number;
}): LootRollResult {
  const { profile, state } = input;
  const row = LOOT_PROFILES[profile];
  const diff = difficultyRow(state.gmStrictness);
  const rng = input.rng ?? createHashRng(input.seed, 'loot', profile);
  const dnd = state.engineMode === 'dnd';
  const level = state.character?.level ?? 1;
  const baseTier = Math.max(
    1,
    Math.min(4, Math.floor(Number(input.tier ?? state.activeDungeon?.dangerTier ?? state.activeDungeon?.tier ?? Math.ceil(level / 5)) || 1))
  ) as 1 | 2 | 3 | 4;
  const owned = new Set(
    (state.inventory ?? []).filter((i) => i.rarity === 'Legendary').map((i) => i.name.toLowerCase())
  );
  const fit = classFitCategories(state);
  const isBoss = profile === 'boss';
  const items: Item[] = [];
  const categories: LootItemCategory[] = [];
  const dice: string[] = [];
  const pityBefore = state.lootPity?.byTier?.[baseTier] ?? 0;
  const result = (extra: Partial<LootRollResult>): LootRollResult => ({
    profile,
    items,
    categories,
    gold: 0,
    coin: 'gp',
    noDrop: false,
    dice,
    displayLines: [],
    pityTier: baseTier,
    nextPity: null,
    ...extra,
  });
  const push = (rarity: Rarity) => {
    const made = makeItem(rarity, state, owned, rng, fit, dnd, `loot-${input.seed}-${items.length}`, profile);
    items.push(made.item);
    categories.push(made.category);
  };

  if (dnd) {
    const cr = crNumber(input.cr, level);
    const band = crBand(cr);
    if (row.dndTable === 'individual') {
      const [n, sides, mult, coin] = DND_INDIVIDUAL_TREASURE[band.band]!;
      const times = profile === 'miniBoss' ? 2 : 1;
      let gold = 0;
      for (let t = 0; t < times; t++) {
        const r = rollDice(n, sides, rng);
        const amount = r.sum * mult;
        gold += amount;
        dice.push(
          `Individual treasure ${band.label}: ${n}d${sides} (${r.rolls.join('+')})${mult > 1 ? `×${mult}` : ''} = ${amount} ${coin}`
        );
      }
      return result({ gold, coin, displayLines: [...dice] });
    }
    const h = DND_HOARD[band.band]!;
    const c = rollDice(h.coins[0], h.coins[1], rng);
    const gold = c.sum * h.coins[2];
    const ir = rollDice(h.items[0], h.items[1], rng);
    const extra = isBoss ? diff.lootExtraBossRolls : 0;
    const count = Math.max(0, ir.sum - h.items[2]) + extra;
    dice.push(`Hoard ${band.label}: ${h.coins[0]}d${h.coins[1]} (${c.rolls.join('+')})×${h.coins[2]} = ${gold} gp`);
    dice.push(
      `Magic items: 1d${h.items[1]}${h.items[2] ? `−${h.items[2]}` : ''} (${ir.rolls[0]}${h.items[2] ? `−${h.items[2]}` : ''})${extra ? ` +${extra} (${diff.label})` : ''} = ${count}`
    );
    for (let i = 0; i < count; i++) {
      const d = rollDie(100, rng);
      const rarity = dndItemRarity(d);
      push(rarity);
      dice.push(`d100 = ${d} → ${rarity}: ${items[items.length - 1]!.name}`);
    }
    return result({ gold, coin: 'gp', displayLines: [...dice] });
  }

  // LitRPG / RPG / PYOA — profile rolls on the existing tier curves with pity.
  if (row.noDropPct > 0 && rng() * 100 < row.noDropPct) {
    return result({ noDrop: true });
  }
  const bonus = profile === 'boss' || profile === 'miniBoss' ? diff.bossRarityTierBonus : row.tierBonus;
  const tier = Math.min(4, baseTier + bonus);
  const rolls = row.rolls + (isBoss ? diff.lootExtraBossRolls : 0);
  let pity = pityBefore;
  const rarities: Rarity[] = [];
  for (let i = 0; i < rolls; i++) {
    const r = rollLootRarityWithPity(tier, rng, pity, diff.pityThresholdScale);
    pity = r.nextPity;
    rarities.push(r.rarity);
  }
  const floor = isBoss && input.firstKill && row.firstKillFloor ? row.firstKillFloor : row.floor;
  if (floor && !rarities.some((r) => rarityIdx(r) >= rarityIdx(floor))) {
    rarities[0] = floor;
  }
  if (rarities.some((r) => r === 'Epic' || r === 'Legendary')) pity = 0;
  if (row.resetsPity) pity = 0;
  for (const r of rarities) push(r);
  return result({
    displayLines: items.map((i) => `${row.boxLabel ? `${row.boxLabel} chest: ` : ''}[${i.rarity}] ${i.name}`),
    nextPity: pity,
  });
}
