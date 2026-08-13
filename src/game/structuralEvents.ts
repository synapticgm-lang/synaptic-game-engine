import type { GameEvent } from './parser';
import type { GameState, Item, Rarity } from './types';
import { addItem, canAddItem } from './inventory';
import { initializeDungeon, moveToNode, exitDungeon } from './mapEngine';
import type { MapTier } from './types';

function uid(): string {
  return crypto.randomUUID();
}

/**
 * Apply previously-parsed but unwired structural tags:
 * item-gain / item-use, dungeon-load / move / exit, and opportunistic location hints.
 */
export function applyStructuralEvents(
  state: GameState,
  events: GameEvent[],
  options: { strictEncumbrance?: boolean } = {}
): {
  state: GameState;
  gainedItems: Item[];
  notes: string[];
} {
  let next = state;
  const gainedItems: Item[] = [];
  const notes: string[] = [];
  const strict = options.strictEncumbrance ?? false;

  for (const e of events) {
    if (e.type === 'item-gain' && e.name) {
      const qty = Math.max(1, e.qty ?? 1);
      const item: Item = {
        id: e.id || uid(),
        name: e.name,
        rarity: 'Common' as Rarity,
        quantity: qty,
        provenance: 'Found during adventure',
      };
      if (strict) {
        const check = canAddItem(next, item);
        if (!check.ok) {
          notes.push(check.reason ?? 'Inventory full — item-gain blocked');
          continue;
        }
      }
      const result = addItem(next, item);
      if (!result.ok) {
        // Soft-fail: still grant if not strict (keeps loot flowing) but note it.
        if (strict) {
          notes.push(result.reason ?? 'Could not add item');
          continue;
        }
        next = { ...next, inventory: [...next.inventory, item] };
      } else {
        next = result.state;
      }
      gainedItems.push(item);
    }

    if (e.type === 'item-use' && (e.name || e.id)) {
      const qty = Math.max(1, e.qty ?? 1);
      const idx = next.inventory.findIndex(
        (i) =>
          (e.id && i.id === e.id) ||
          (e.name && i.name.toLowerCase() === e.name.toLowerCase())
      );
      if (idx < 0) {
        notes.push(`item-use failed: ${e.name ?? e.id} not found`);
        continue;
      }
      const target = next.inventory[idx];
      const remaining = (target.quantity ?? 1) - qty;
      const inventory =
        remaining <= 0
          ? next.inventory.filter((_, i) => i !== idx)
          : next.inventory.map((it, i) =>
              i === idx ? { ...it, quantity: remaining } : it
            );
      next = { ...next, inventory };
    }

    if (e.type === 'dungeon-load' && e.dungeonName) {
      const blueprint = e.blueprintId || 'grid';
      const procedural = e.isProcedural ?? true;
      const tier = (e.tier ?? 4) as MapTier;
      const dungeon = initializeDungeon(
        blueprint,
        e.dungeonName,
        procedural,
        tier,
        next.currentCoordinates,
        e.nodeCount
      );
      next = {
        ...next,
        activeDungeon: dungeon,
        currentLocation: e.dungeonName,
      };
      notes.push(`Dungeon loaded: ${e.dungeonName}`);
    }

    if (e.type === 'dungeon-move' && e.nodeId && next.activeDungeon) {
      next = {
        ...next,
        activeDungeon: moveToNode(next.activeDungeon, e.nodeId),
      };
    }

    if (e.type === 'dungeon-exit') {
      next = {
        ...next,
        activeDungeon: exitDungeon(),
      };
      notes.push('Dungeon exited');
    }

    if (e.type === 'hex-move' && typeof e.q === 'number' && typeof e.r === 'number') {
      next = {
        ...next,
        currentCoordinates: {
          q: e.q,
          r: e.r,
          tier: (e.tier ?? next.currentCoordinates?.tier ?? 2) as MapTier,
          z: e.z ?? next.currentCoordinates?.z ?? 0,
        },
      };
    }
  }

  // Infer location from a newly revealed place — never from encyclopedia headings.
  if (!next.currentLocation) {
    const locCard = events.find((ev) => ev.type === 'lore-card' && ev.cardType === 'location' && ev.name);
    const name = locCard?.name?.trim() ?? '';
    if (name && !/&/.test(name) && !/\bzones?\b/i.test(name)) {
      next = { ...next, currentLocation: name };
    }
  }

  return { state: next, gainedItems, notes };
}
