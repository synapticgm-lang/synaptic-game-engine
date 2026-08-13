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
  return (state.containers ?? []).filter((c) => c.equipped);
}

export function getPrimaryGeneralContainer(state: GameState): Container | undefined {
  const equipped = getEquippedContainers(state);
  const generalEquipped = equipped.filter((c) => (c.storageType ?? 'General') === 'General');
  if (generalEquipped[0]) return generalEquipped[0];
  if (equipped[0]) return equipped[0];
  const all = state.containers ?? [];
  return all.find((c) => (c.storageType ?? 'General') === 'General') ?? all[0];
}

function isGeneralStorage(container: Container): boolean {
  return (container.storageType ?? 'General') === 'General';
}

/**
 * Resolve which inventory items occupy a container.
 * Equipped items still count — they are worn but stored.
 * Unassigned items (legacy saves with empty itemIds) fall through to the primary general bag.
 */
export function getItemsInContainer(state: GameState, containerId: string): Item[] {
  const containers = state.containers ?? [];
  const container = containers.find((c) => c.id === containerId);
  if (!container) return [];

  const byId = new Map((state.inventory ?? []).map((item) => [item.id, item]));
  const seen = new Set<string>();
  const result: Item[] = [];

  const push = (item: Item | undefined) => {
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    result.push(item);
  };

  for (const item of state.inventory ?? []) {
    if (item.containerId === containerId) push(item);
  }
  for (const id of container.itemIds ?? []) {
    push(byId.get(id));
  }

  const primary = getPrimaryGeneralContainer(state);
  if (primary?.id === containerId && isGeneralStorage(container)) {
    const claimedElsewhere = new Set<string>();
    for (const other of containers) {
      if (other.id === containerId) continue;
      for (const id of other.itemIds ?? []) claimedElsewhere.add(id);
    }
    for (const item of state.inventory ?? []) {
      if (item.containerId && item.containerId !== containerId) {
        claimedElsewhere.add(item.id);
      }
    }
    for (const item of state.inventory ?? []) {
      if (!item.containerId && !claimedElsewhere.has(item.id)) push(item);
    }
  }

  return result;
}

export function getContainerUsed(state: GameState, container: Container): number {
  return getItemsInContainer(state, container.id).length;
}

function findContainerWithSpace(state: GameState, item: Item): Container | undefined {
  if (item.containerId) {
    const named = (state.containers ?? []).find((c) => c.id === item.containerId);
    if (named) return named;
  }
  const equippedGeneral = getEquippedContainers(state).filter(isGeneralStorage);
  for (const container of equippedGeneral) {
    if (getItemsInContainer(state, container.id).length < container.capacity) {
      return container;
    }
  }
  return getPrimaryGeneralContainer(state);
}

/** Rebuild container.itemIds / used from live inventory. Equipped items occupy slots. */
export function syncContainerOccupancy(state: GameState): GameState {
  const containers = (state.containers ?? []).map((container) => {
    const items = getItemsInContainer(state, container.id);
    return {
      ...container,
      itemIds: items.map((item) => item.id),
      used: items.length,
    };
  });

  const ownerByItemId = new Map<string, string>();
  for (const container of containers) {
    for (const id of container.itemIds) {
      ownerByItemId.set(id, container.id);
    }
  }

  const inventory = (state.inventory ?? []).map((item) => {
    const ownerId = ownerByItemId.get(item.id);
    if (!ownerId || item.containerId === ownerId) return item;
    return { ...item, containerId: ownerId };
  });

  return { ...state, containers, inventory };
}

export function computeInventoryCapacity(state: GameState): InventoryCapacity {
  const containers = getEquippedContainers(state);
  const generalContainers = containers.filter(isGeneralStorage);
  const materialContainers = containers.filter((c) => c.storageType === 'Materials Only');

  const totalSlots = generalContainers.reduce((sum, c) => sum + c.capacity, 0);
  const usedSlots = generalContainers.reduce((sum, c) => sum + getContainerUsed(state, c), 0);
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
      used: getContainerUsed(state, c),
      storageType: c.storageType ?? 'General',
      kind: c.kind ?? 'physical',
    })),
  };
}

export function canAddItem(state: GameState, item: Item): { ok: boolean; reason?: string } {
  const cap = computeInventoryCapacity(state);
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
  return syncContainerOccupancy({
    ...state,
    inventory: state.inventory.filter((i) => i.id !== itemId),
  });
}

export function addItem(state: GameState, item: Item): { state: GameState; ok: boolean; reason?: string } {
  const check = canAddItem(state, item);
  if (!check.ok) return { state, ok: false, reason: check.reason };
  const bag = findContainerWithSpace(state, item);
  const nextItem = bag && !item.containerId ? { ...item, containerId: bag.id } : item;
  return {
    state: syncContainerOccupancy({ ...state, inventory: [...state.inventory, nextItem] }),
    ok: true,
  };
}

export function getItemValue(item: Item): number {
  if (item.baseValue != null) return item.baseValue;
  return RARITY_VALUE[item.rarity] * Math.max(1, item.itemLevel ?? 1);
}
