/**
 * P0.4 - Inventory State Transitions (upgraded from name-list bag lock)
 * 
 * Track ownership, quantity, equipped/consumed/dropped/loaned state, provenance, and conservation.
 * Assert conservation across turns.
 * 
 * Not: Just maintain a list of item names.
 * 
 * Target:
 * - 0 `[Uncommon] them`
 * - Bag stable across 50 bag-check turns
 * - Consumed/dropped/equipped state transitions validated
 */

import type { GameState, Item } from './types';

export interface ItemStateTransition {
  itemId: string;
  itemName: string;
  turn: number;
  transition: TransitionKind;
  /** Previous quantity */
  fromQuantity: number;
  /** New quantity */
  toQuantity: number;
  /** Previous equipped state */
  fromEquipped: boolean;
  /** New equipped state */
  toEquipped: boolean;
  /** Provenance/reason for the transition */
  reason: string;
}

export type TransitionKind =
  | 'gained'        // Item added to inventory
  | 'lost'          // Item removed from inventory
  | 'consumed'      // Quantity decreased (potion, food, etc.)
  | 'equipped'      // Item equipped
  | 'unequipped'    // Item unequipped
  | 'loaned'        // Item given to NPC temporarily
  | 'returned'      // Loaned item returned
  | 'dropped';      // Item intentionally discarded

export interface ConservationViolation {
  kind: 'invented_item' | 'duplicate_item' | 'impossible_quantity' | 'lost_without_reason' | 'equipped_nonexistent';
  description: string;
  itemName?: string;
  itemId?: string;
}

export interface InventoryAuthority {
  /** Item ID -> full item state */
  items: Map<string, Item>;
  /** Item name -> count (for quick lookup) */
  nameToCount: Map<string, number>;
  /** Equipped items by slot */
  equippedBySlot: Map<string, Item>;
  /** Items loaned to NPCs */
  loanedItems: Map<string, { item: Item; npcName: string; turn: number }>;
}

/**
 * Build inventory authority from game state.
 */
export function buildInventoryAuthority(state: GameState): InventoryAuthority {
  const items = new Map<string, Item>();
  const nameToCount = new Map<string, number>();
  const equippedBySlot = new Map<string, Item>();
  const loanedItems = new Map<string, { item: Item; npcName: string; turn: number }>();
  
  for (const item of state.inventory ?? []) {
    items.set(item.id, item);
    
    // Count by name
    const existing = nameToCount.get(item.name) || 0;
    nameToCount.set(item.name, existing + item.quantity);
    
    // Track equipped items
    if (item.equipped && item.slot) {
      equippedBySlot.set(item.slot, item);
    }
  }
  
  // TODO: Track loaned items when that feature is added
  
  return {
    items,
    nameToCount,
    equippedBySlot,
    loanedItems,
  };
}

/**
 * Detect inventory state transitions between two game states.
 */
export function detectInventoryTransitions(
  previous: GameState,
  next: GameState
): ItemStateTransition[] {
  const transitions: ItemStateTransition[] = [];
  const turn = next.turn;
  
  const prevInventory = new Map((previous.inventory ?? []).map(i => [i.id, i]));
  const nextInventory = new Map((next.inventory ?? []).map(i => [i.id, i]));
  
  // Check for new items (gained)
  for (const [id, item] of nextInventory) {
    const prev = prevInventory.get(id);
    if (!prev) {
      transitions.push({
        itemId: id,
        itemName: item.name,
        turn,
        transition: 'gained',
        fromQuantity: 0,
        toQuantity: item.quantity,
        fromEquipped: false,
        toEquipped: item.equipped ?? false,
        reason: item.provenance || 'Unknown source',
      });
      continue;
    }
    
    // Check for quantity changes
    if (prev.quantity !== item.quantity) {
      const transition: TransitionKind = item.quantity < prev.quantity ? 'consumed' : 'gained';
      transitions.push({
        itemId: id,
        itemName: item.name,
        turn,
        transition,
        fromQuantity: prev.quantity,
        toQuantity: item.quantity,
        fromEquipped: prev.equipped ?? false,
        toEquipped: item.equipped ?? false,
        reason: transition === 'consumed' ? 'Used or consumed' : 'Quantity increased',
      });
    }
    
    // Check for equipped state changes
    if ((prev.equipped ?? false) !== (item.equipped ?? false)) {
      const transition: TransitionKind = item.equipped ? 'equipped' : 'unequipped';
      transitions.push({
        itemId: id,
        itemName: item.name,
        turn,
        transition,
        fromQuantity: prev.quantity,
        toQuantity: item.quantity,
        fromEquipped: prev.equipped ?? false,
        toEquipped: item.equipped ?? false,
        reason: transition === 'equipped' ? 'Equipped to slot' : 'Unequipped from slot',
      });
    }
  }
  
  // Check for removed items (lost/dropped)
  for (const [id, item] of prevInventory) {
    if (!nextInventory.has(id)) {
      transitions.push({
        itemId: id,
        itemName: item.name,
        turn,
        transition: 'lost',
        fromQuantity: item.quantity,
        toQuantity: 0,
        fromEquipped: item.equipped ?? false,
        toEquipped: false,
        reason: 'Item removed from inventory',
      });
    }
  }
  
  return transitions;
}

/**
 * Validate that proposed inventory changes are legal.
 * This runs BEFORE accepting a new game state.
 */
export function validateInventoryChanges(
  authority: InventoryAuthority,
  proposedItems: Item[],
  narrative: string
): {
  valid: boolean;
  violations: ConservationViolation[];
} {
  const violations: ConservationViolation[] = [];
  const proposedMap = new Map(proposedItems.map(i => [i.id, i]));
  
  // Check for items appearing without mention in narrative
  for (const item of proposedItems) {
    const existing = authority.items.get(item.id);
    if (!existing) {
      // New item - check if mentioned in narrative
      const mentioned = narrative.toLowerCase().includes(item.name.toLowerCase());
      if (!mentioned && !item.provenance) {
        violations.push({
          kind: 'invented_item',
          description: `New item "${item.name}" not mentioned in narrative or provenance`,
          itemName: item.name,
          itemId: item.id,
        });
      }
    }
  }
  
  // Check for items vanishing
  for (const [id, item] of authority.items) {
    if (!proposedMap.has(id)) {
      const mentioned = /\b(drop|lose|discard|leave|give|hand|consume|use|break)\b/i.test(narrative);
      if (!mentioned) {
        violations.push({
          kind: 'lost_without_reason',
          description: `Item "${item.name}" removed without narrative explanation`,
          itemName: item.name,
          itemId: id,
        });
      }
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Build retry block for inventory conservation violations.
 */
export function buildInventoryConservationRetryBlock(
  violations: ConservationViolation[],
  authority: InventoryAuthority
): string {
  const issues = violations.map(v => `- ${v.kind}: ${v.description}`).join('\n');
  
  const currentInventory = Array.from(authority.items.values())
    .map(i => `${i.name} Ã—${i.quantity}${i.equipped ? ' (equipped)' : ''}`)
    .join(', ');
  
  return `=== INVENTORY CONSERVATION RETRY (BINDING) ===
Your prior reply violated inventory conservation laws.

Violations:
${issues}

AUTHORITY - Current inventory:
${currentInventory || 'Empty'}

CONSERVATION LAWS (BINDING):
1. Items cannot appear without narrative cause (found, given, purchased, looted)
2. Items cannot vanish without narrative explanation (dropped, consumed, given, broken)
3. Quantity cannot increase without clear source
4. Quantity cannot decrease below zero
5. Cannot equip items that don't exist in inventory
6. Cannot duplicate items with identical properties

When granting items:
- Include concrete in-fiction source (NPC gave it, found in chest, purchased from merchant)
- Use <item-gain> tag with provenance
- Mention the item BY NAME in the narrative

When removing items:
- Show the action in narrative (consumed potion, dropped weapon, gave to NPC)
- Use <item-lose> tag
- Explain why the item is gone

Do not invent items to solve problems. Work with what the player actually has.
================================================`;
}
