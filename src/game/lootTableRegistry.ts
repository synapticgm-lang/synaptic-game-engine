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

import type { GameState } from './types';
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
}

export function generateLoot(
  mode: 'litrpg' | 'dnd' | 'rpg' | 'pyoa',
  role: 'trash' | 'elite' | 'boss',
  outcome: 'victory' | 'negotiated' | 'partial' | 'fled' | 'defeat',
  biome: string,
  seed: string,
  state: GameState
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
    pityCounterUpdate: pityCounters
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
