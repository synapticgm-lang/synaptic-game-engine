import type { GameState, Item, Rarity, ProfessionType, SalvageRequirement, CraftingMaterial, ItemType, ProfessionSkill, Companion } from './types';
import { canAddMaterials, removeItem } from './inventory';

interface SalvageProfessionSource {
  type: ProfessionType;
  level: number;
  name: string;
}

export function inferItemType(item: Item): ItemType {
  if (item.itemType) return item.itemType;
  const slot = (item.slot ?? '').toLowerCase();
  const name = (item.name ?? '').toLowerCase();
  if (slot.includes('hand') || name.includes('sword') || name.includes('axe') || name.includes('bow') || name.includes('dagger') || name.includes('staff') || name.includes('mace')) return 'weapon';
  if (slot.includes('chest') || slot.includes('head') || slot.includes('shoulder') || slot.includes('legs') || slot.includes('feet') || name.includes('armor') || name.includes('plate') || name.includes('robe')) return 'armor';
  if (name.includes('ring') || name.includes('amulet') || name.includes('accessory')) return 'accessory';
  return 'armor';
}

export function getSalvageRequirement(item: Item): SalvageRequirement {
  const type = inferItemType(item);
  const isMagical = item.rarity === 'Rare' || item.rarity === 'Epic' || item.rarity === 'Legendary';
  const iLvl = item.itemLevel ?? 1;

  if (isMagical) {
    return {
      profession: 'Enchanting',
      minLevel: Math.max(1, Math.ceil(iLvl / 10)),
      reason: `Magical items require Enchanting to disenchant.`,
    };
  }

  const name = (item.name ?? '').toLowerCase();

  if (type === 'weapon') {
    return {
      profession: 'Blacksmithing',
      minLevel: Math.max(1, Math.ceil(iLvl / 10)),
      reason: `Metal weapons require Blacksmithing to salvage.`,
    };
  }

  if (name.includes('robe') || name.includes('cloth') || name.includes('silk')) {
    return {
      profession: 'Tailoring',
      minLevel: Math.max(1, Math.ceil(iLvl / 10)),
      reason: `Cloth items require Tailoring to salvage.`,
    };
  }

  if (name.includes('leather') || name.includes('hide')) {
    return {
      profession: 'Leatherworking',
      minLevel: Math.max(1, Math.ceil(iLvl / 10)),
      reason: `Leather items require Leatherworking to salvage.`,
    };
  }

  return {
    profession: 'Blacksmithing',
    minLevel: Math.max(1, Math.ceil(iLvl / 10)),
    reason: `Heavy armor requires Blacksmithing to salvage.`,
  };
}

export function getAvailableProfessions(state: GameState): SalvageProfessionSource[] {
  const sources: SalvageProfessionSource[] = [];

  const playerProfs = (state.character as unknown as { professions?: ProfessionSkill[] }).professions;
  if (playerProfs) {
    for (const p of playerProfs) {
      sources.push({ type: p.type, level: p.level, name: state.character.name });
    }
  }

  for (const comp of state.companions ?? []) {
    const compProfs = (comp as unknown as { professions?: ProfessionSkill[] }).professions;
    if (compProfs) {
      for (const p of compProfs) {
        sources.push({ type: p.type, level: p.level, name: comp.name });
      }
    }
  }

  const shopProfs = (state as unknown as { activeShop?: { professions?: ProfessionSkill[]; name?: string } }).activeShop;
  if (shopProfs?.professions) {
    for (const p of shopProfs.professions) {
      sources.push({ type: p.type, level: p.level, name: shopProfs.name ?? 'Shop' });
    }
  }

  return sources;
}

export function checkSalvageRequirement(item: Item, state: GameState): { ok: boolean; reason?: string; source?: SalvageProfessionSource } {
  const req = getSalvageRequirement(item);
  const sources = getAvailableProfessions(state);

  const matching = sources.filter((s) => s.type === req.profession && s.level >= req.minLevel);

  if (matching.length > 0) {
    return { ok: true, source: matching[0] };
  }

  const bestMatch = sources.find((s) => s.type === req.profession);
  if (bestMatch) {
    return {
      ok: false,
      reason: `Requires ${req.profession} Level ${req.minLevel} to salvage. ${bestMatch.name} only has Level ${bestMatch.level}.`,
    };
  }

  return {
    ok: false,
    reason: `Requires ${req.profession} Level ${req.minLevel} or a ${req.profession} NPC to salvage.`,
  };
}

const RARITY_SHARD: Record<Rarity, string> = {
  Common: 'Common Dust',
  Uncommon: 'Uncommon Essence',
  Rare: 'Rare Arcane Shard',
  Epic: 'Epic Arcane Crystal',
  Legendary: 'Legendary Arcane Core',
};

const TYPE_MATERIAL: Record<ItemType, string> = {
  weapon: 'Steel Ingot',
  armor: 'Armor Plate',
  consumable: 'Alchemical Residue',
  material: 'Raw Material',
  container: 'Hardware',
  accessory: 'Jeweler Scrap',
  quest: 'Quest Fragment',
};

export function generateSalvageYield(item: Item): CraftingMaterial[] {
  const type = inferItemType(item);
  const iLvl = item.itemLevel ?? 1;
  const rarity = item.rarity;
  const yieldCount = Math.max(1, Math.ceil(iLvl / 5));
  const baseMatName = TYPE_MATERIAL[type];
  const shardName = RARITY_SHARD[rarity];

  const materials: CraftingMaterial[] = [
    {
      id: `${baseMatName.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-')}`,
      name: baseMatName,
      rarity: rarity === 'Legendary' ? 'Epic' : rarity,
      quantity: yieldCount,
      sourceType: type,
    },
  ];

  if (rarity !== 'Common') {
    materials.push({
      id: `${shardName.toLowerCase().replace(/\s+/g, '-')}`,
      name: shardName,
      rarity: rarity,
      quantity: 1,
      sourceType: type,
    });
  }

  return materials;
}

export interface SalvageResult {
  ok: boolean;
  reason?: string;
  materials?: CraftingMaterial[];
  newState?: GameState;
}

export function salvageItem(state: GameState, itemId: string): SalvageResult {
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item) return { ok: false, reason: 'Item not found.' };
  if (item.equipped) return { ok: false, reason: 'Cannot salvage equipped items. Unequip first.' };

  const check = checkSalvageRequirement(item, state);
  if (!check.ok) return { ok: false, reason: check.reason };

  const materials = generateSalvageYield(item);
  const matCheck = canAddMaterials(state, materials.reduce((s, m) => s + m.quantity, 0));
  if (!matCheck.ok) return { ok: false, reason: matCheck.reason };

  let newState = removeItem(state, itemId);

  const existing = [...newState.materials];
  for (const mat of materials) {
    const idx = existing.findIndex((m) => m.id === mat.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], quantity: existing[idx].quantity + mat.quantity };
    } else {
      existing.push({ ...mat });
    }
  }
  newState = { ...newState, materials: existing };

  return { ok: true, materials, newState };
}
