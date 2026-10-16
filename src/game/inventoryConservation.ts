/**
 * Inventory conservation: ownership snapshot + legal change check (qualityGovernance commit path).
 */
import type { GameState, Item } from './types';

export interface ConservationViolation {
  kind: 'invented_item' | 'duplicate_item' | 'impossible_quantity' | 'lost_without_reason' | 'equipped_nonexistent';
  description: string;
  itemName?: string;
  itemId?: string;
}

export interface InventoryAuthority {
  items: Map<string, Item>;
  nameToCount: Map<string, number>;
  equippedBySlot: Map<string, Item>;
  loanedItems: Map<string, { item: Item; npcName: string; turn: number }>;
}

/** Build inventory authority from game state. */
export function buildInventoryAuthority(state: GameState): InventoryAuthority {
  const items = new Map<string, Item>();
  const nameToCount = new Map<string, number>();
  const equippedBySlot = new Map<string, Item>();
  for (const item of state.inventory ?? []) {
    items.set(item.id, item);
    nameToCount.set(item.name, (nameToCount.get(item.name) || 0) + item.quantity);
    if (item.equipped && item.slot) equippedBySlot.set(item.slot, item);
  }
  return { items, nameToCount, equippedBySlot, loanedItems: new Map() };
}

/** Validate that proposed inventory changes are legal (before accepting a new state). */
export function validateInventoryChanges(
  authority: InventoryAuthority,
  proposedItems: Item[],
  narrative: string,
): { valid: boolean; violations: ConservationViolation[] } {
  const violations: ConservationViolation[] = [];
  const proposedMap = new Map(proposedItems.map((i) => [i.id, i]));
  const hay = narrative.toLowerCase();
  for (const item of proposedItems) {
    if (!authority.items.get(item.id) && !hay.includes(item.name.toLowerCase()) && !item.provenance) {
      violations.push({
        kind: 'invented_item',
        description: `New item "${item.name}" not mentioned in narrative or provenance`,
        itemName: item.name,
        itemId: item.id,
      });
    }
  }
  const lostCue = /\b(drop|lose|discard|leave|give|hand|consume|use|break)\b/i.test(narrative);
  for (const [id, item] of authority.items) {
    if (!proposedMap.has(id) && !lostCue) {
      violations.push({
        kind: 'lost_without_reason',
        description: `Item "${item.name}" removed without narrative explanation`,
        itemName: item.name,
        itemId: id,
      });
    }
  }
  return { valid: violations.length === 0, violations };
}
