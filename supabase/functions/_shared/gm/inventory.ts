import type { Container, CraftingMaterial, GameState, Item, Rarity } from './types.ts';

const RARITY_VALUE: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 5,
  Rare: 20,
  Epic: 75,
  Legendary: 250,
};

export interface InventoryCapacity {
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  hasMagicalContainer: boolean;
  materialsSlots: number;
  materialsUsed: number;
  materialsAvailable: number;
  containerBreakdown: { name: string; capacity: number; used: number; storageType: string; kind: string }[];
}

export function getEquippedContainers(state: GameState): Container[] {
  return state.containers.filter((c) => c.equipped);
}

export function computeInventoryCapacity(state: GameState): InventoryCapacity {
  const containers = getEquippedContainers(state);
  const generalContainers = containers.filter((c) => (c.storageType ?? 'General') === 'General');
  const materialContainers = containers.filter((c) => c.storageType === 'Materials Only');

  const totalSlots = generalContainers.reduce((sum, c) => sum + c.capacity, 0);
  const usedSlots = state.inventory.filter((i) => !i.equipped).length;
  const hasMagicalContainer = containers.some((c) => c.kind === 'magical');

  const materialsSlots = materialContainers.reduce((sum, c) => sum + c.capacity, 0);
  const materialsUsed = state.materials.reduce((sum, m) => sum + m.quantity, 0);
  const materialsAvailable = Math.max(0, materialsSlots - materialsUsed);

  return {
    totalSlots: Math.max(0, totalSlots),
    usedSlots,
    availableSlots: Math.max(0, totalSlots - usedSlots),
    hasMagicalContainer,
    materialsSlots,
    materialsUsed,
    materialsAvailable,
    containerBreakdown: containers.map((c) => ({
      name: c.name,
      capacity: c.capacity,
      used: c.used,
      storageType: c.storageType ?? 'General',
      kind: c.kind ?? 'physical',
    })),
  };
}

export function canAddItem(state: GameState, item: Item): { ok: boolean; reason?: string } {
  const cap = computeInventoryCapacity(state);
  if (item.equipped) return { ok: true };
  if (cap.availableSlots > 0) return { ok: true };
  return {
    ok: false,
    reason: `Your ${cap.containerBreakdown.map((c) => c.name).join(' and ') || 'pack'} is too full to carry this.`,
  };
}

export function canAddMaterials(state: GameState, count: number): { ok: boolean; reason?: string } {
  const cap = computeInventoryCapacity(state);

  if (cap.hasMagicalContainer) {
    return { ok: true };
  }

  if (cap.materialsAvailable >= count) {
    return { ok: true };
  }

  const generalAvailable = cap.availableSlots;
  if (generalAvailable >= count) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: `Your ${cap.containerBreakdown.map((c) => c.name).join(' and ') || 'pack'} is too full to carry these materials.`,
  };
}

export function addMaterials(state: GameState, newMaterials: CraftingMaterial[]): GameState {
  const existing = [...state.materials];

  for (const mat of newMaterials) {
    const idx = existing.findIndex((m) => m.id === mat.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], quantity: existing[idx].quantity + mat.quantity };
    } else {
      existing.push({ ...mat });
    }
  }

  return { ...state, materials: existing };
}

export function removeItem(state: GameState, itemId: string): GameState {
  return {
    ...state,
    inventory: state.inventory.filter((i) => i.id !== itemId),
  };
}

export function addItem(state: GameState, item: Item): { state: GameState; ok: boolean; reason?: string } {
  const check = canAddItem(state, item);
  if (!check.ok) return { state, ok: false, reason: check.reason };
  return {
    state: { ...state, inventory: [...state.inventory, item] },
    ok: true,
  };
}

export function getItemValue(item: Item): number {
  if (item.baseValue != null) return item.baseValue;
  return RARITY_VALUE[item.rarity] * Math.max(1, item.itemLevel ?? 1);
}
