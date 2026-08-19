import type { GameState, Item } from './types';
import { currentDungeonNode } from './dungeonSeed';
import { isExplorableDungeon } from './placeAuthority';
import type { LooseNodeItem } from './dungeonMobLedger';

function updateNodeLooseItems(
  state: GameState,
  updater: (items: LooseNodeItem[]) => LooseNodeItem[]
): GameState {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return state;
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return state;
  const looseItems = updater(node.hidden.looseItems ?? []);
  const nodes = dungeon.nodes.map((n) =>
    n.id === node.id ? { ...n, hidden: { ...n.hidden!, looseItems } } : n
  );
  return { ...state, activeDungeon: { ...dungeon, nodes } };
}

function newId(): string {
  return crypto.randomUUID();
}

/** Park a thrown inventory item on the current node floor. */
export function parkInventoryOnNode(state: GameState, itemId: string, label: string): GameState {
  const inv = state.inventory ?? [];
  const item = inv.find((i) => i.id === itemId);
  if (!item) return state;
  const nextInv = inv.filter((i) => i.id !== itemId);
  return updateNodeLooseItems(
    { ...state, inventory: nextInv },
    (items) => [...items, { id: newId(), label: label || item.name, inventoryItemId: item.id }]
  );
}

const PICKUP_RE = /^pick\s+up\s+(.+)$/i;

export function parseLooseItemPickup(actionText: string): string | null {
  const m = actionText.trim().match(PICKUP_RE);
  return m?.[1]?.trim() ?? null;
}

/** Ledger pickup — item returns to inventory; node entry removed. */
export function pickUpLooseItem(state: GameState, labelOrId: string): { state: GameState; item: Item | null } {
  const key = labelOrId.trim().toLowerCase();
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return { state, item: null };
  const node = currentDungeonNode(dungeon);
  const loose = node?.hidden?.looseItems ?? [];
  const hit = loose.find(
    (l) => l.id === labelOrId || l.label.trim().toLowerCase() === key
  );
  if (!hit || !node) return { state, item: null };

  const restored: Item = {
    id: hit.inventoryItemId ?? newId(),
    name: hit.label,
    rarity: 'Common',
    quantity: 1,
  };

  const next = updateNodeLooseItems(state, (items) => items.filter((l) => l.id !== hit.id));
  return {
    state: { ...next, inventory: [...(next.inventory ?? []), restored] },
    item: restored,
  };
}
