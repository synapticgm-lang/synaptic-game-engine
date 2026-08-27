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
 * Check for inventory conservation violations.
 * Items shouldn't appear/disappear without cause, quantities should make sense.
 */
export function checkInventoryConservation(
  previous: GameState,
  next: GameState,
  transitions: ItemStateTransition[]
): ConservationViolation[] {
  const violations: ConservationViolation[] = [];
  
  const prevInventory = new Map((previous.inventory ?? []).map(i => [i.id, i]));
  const nextInventory = new Map((next.inventory ?? []).map(i => [i.id, i]));
  
  // Check for duplicate items (same name, multiple IDs)
  const nameToIds = new Map<string, string[]>();
  for (const [id, item] of nextInventory) {
    const existing = nameToIds.get(item.name) || [];
    existing.push(id);
    nameToIds.set(item.name, existing);
  }
  
  for (const [name, ids] of nameToIds) {
    if (ids.length > 1) {
      // Check if these are actually different items (different descriptions or rarities)
      const items = ids.map(id => nextInventory.get(id)!);
      const descriptions = new Set(items.map(i => i.description || ''));
      const rarities = new Set(items.map(i => i.rarity));
      
      // If same description and rarity, probably a duplicate
      if (descriptions.size === 1 && rarities.size === 1) {
        violations.push({
          kind: 'duplicate_item',
          description: `Item "${name}" appears ${ids.length} times with identical properties`,
          itemName: name,
        });
      }
    }
  }
  
  // Check for items that appeared without provenance
  for (const [id, item] of nextInventory) {
    const prev = prevInventory.get(id);
    if (!prev && !item.provenance) {
      violations.push({
        kind: 'invented_item',
        description: `Item "${item.name}" appeared without provenance or source`,
        itemName: item.name,
        itemId: id,
      });
    }
  }
  
  // Check for impossible quantity changes
  for (const transition of transitions) {
    if (transition.transition === 'consumed') {
      // Can't consume more than you have
      if (transition.fromQuantity - transition.toQuantity > transition.fromQuantity) {
        violations.push({
          kind: 'impossible_quantity',
          description: `Item "${transition.itemName}" quantity decreased by more than available`,
          itemName: transition.itemName,
          itemId: transition.itemId,
        });
      }
    }
    
    if (transition.transition === 'gained' && transition.fromQuantity > 0) {
      // Quantity increases should have reason
      if (!transition.reason || transition.reason === 'Unknown source') {
        violations.push({
          kind: 'invented_item',
          description: `Item "${transition.itemName}" quantity increased without clear reason`,
          itemName: transition.itemName,
          itemId: transition.itemId,
        });
      }
    }
  }
  
  // Check for items that vanished without explanation
  for (const transition of transitions) {
    if (transition.transition === 'lost') {
      // Check if there's a narrative explanation in the last GM turn
      const lastGmEntry = (next.log ?? [])
        .filter(e => e?.role === 'gm')
        .slice(-1)[0];
      
      const narrativeMentionsLoss = lastGmEntry?.content
        ? /\b(drop|lose|discard|leave behind|give|hand over|consume|use|break|destroy)\b/i.test(lastGmEntry.content)
        : false;
      
      if (!narrativeMentionsLoss && !transition.reason.includes('consumed') && !transition.reason.includes('equipped')) {
        violations.push({
          kind: 'lost_without_reason',
          description: `Item "${transition.itemName}" vanished without narrative explanation`,
          itemName: transition.itemName,
          itemId: transition.itemId,
        });
      }
    }
  }
  
  // Check for equipped items that don't exist
  for (const item of next.inventory ?? []) {
    if (item.equipped) {
      const exists = nextInventory.has(item.id);
      if (!exists) {
        violations.push({
          kind: 'equipped_nonexistent',
          description: `Item "${item.name}" is marked equipped but doesn't exist in inventory`,
          itemName: item.name,
          itemId: item.id,
        });
      }
    }
  }
  
  return violations;
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
    .map(i => `${i.name} ×${i.quantity}${i.equipped ? ' (equipped)' : ''}`)
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

/**
 * Create a snapshot of inventory for comparison/rollback.
 */
export function snapshotInventory(inventory: Item[]): Map<string, Item> {
  return new Map(inventory.map(i => [i.id, { ...i }]));
}

/**
 * Restore inventory from snapshot (for rollback after violations).
 */
export function restoreInventoryFromSnapshot(
  snapshot: Map<string, Item>
): Item[] {
  return Array.from(snapshot.values()).map(i => ({ ...i }));
}

/**
 * Telemetry for inventory metrics.
 */
export interface InventoryTelemetry {
  turn: number;
  itemCount: number;
  uniqueItemNames: number;
  equippedCount: number;
  totalQuantity: number;
  transitions: number;
  violations: number;
  violationKinds: string[];
}

/**
 * Track inventory metrics for telemetry.
 */
export function trackInventoryMetrics(
  state: GameState,
  transitions: ItemStateTransition[],
  violations: ConservationViolation[]
): InventoryTelemetry {
  const inventory = state.inventory ?? [];
  const uniqueNames = new Set(inventory.map(i => i.name));
  const equippedCount = inventory.filter(i => i.equipped).length;
  const totalQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
  
  return {
    turn: state.turn,
    itemCount: inventory.length,
    uniqueItemNames: uniqueNames.size,
    equippedCount,
    totalQuantity,
    transitions: transitions.length,
    violations: violations.length,
    violationKinds: violations.map(v => v.kind),
  };
}

/**
 * Calculate bag stability score over a window of turns.
 * Returns percentage of turns where inventory remained stable.
 */
export function calculateBagStability(
  telemetry: InventoryTelemetry[],
  windowSize: number = 50
): {
  stabilityPercentage: number;
  averageViolationsPerTurn: number;
  analysis: string;
} {
  const recent = telemetry.slice(-windowSize);
  if (recent.length === 0) {
    return {
      stabilityPercentage: 100,
      averageViolationsPerTurn: 0,
      analysis: 'No inventory data to analyze',
    };
  }
  
  const stableTurns = recent.filter(t => t.violations === 0 && t.transitions <= 2).length;
  const stabilityPercentage = (stableTurns / recent.length) * 100;
  
  const totalViolations = recent.reduce((sum, t) => sum + t.violations, 0);
  const averageViolationsPerTurn = totalViolations / recent.length;
  
  return {
    stabilityPercentage,
    averageViolationsPerTurn,
    analysis: `Bag stable in ${stableTurns}/${recent.length} turns (${stabilityPercentage.toFixed(1)}%), avg ${averageViolationsPerTurn.toFixed(2)} violations/turn`,
  };
}
