import type { GameEvent } from './parser';
import type { GameState, Item, Rarity } from './types';
import { addItem, canAddItem } from './inventory';
import { initializeDungeon, moveToNode, exitDungeon } from './mapEngine';
import type { MapTier } from './types';
import {
  markLootablesOpenedOnGain,
  mergeSheetWithNode,
  resolveSeededRarity,
  seedDungeonState,
  currentDungeonNode,
} from './dungeonSeed';
import { advanceLocationMemory } from './locationMemory';
import { ensureLocationSheet } from './pendingTurn';
import { closePlaceArc, upsertPlaceFromSheet } from './places';
import { exhaustOpenedContainer, shouldBlockContainerItemGain } from './searchContinuity';

function uid(): string {
  return crypto.randomUUID();
}

function isLeaveOrTravelPad(input: string): boolean {
  return /\b(leave(?:\s+through)?|travel|walk away|go another direction|head (?:to|toward)|exit|return to)\b/i.test(
    input ?? ''
  );
}

/** Batch V — no free pocket loot when the player walked away / checked Status instead of taking the offer. */
function shouldBlockUnearnedOfferGain(playerInput: string, itemName: string): boolean {
  const t = (playerInput ?? '').trim();
  const name = (itemName ?? '').trim();
  if (!t || !name) return false;
  if (/\b(take|accept|buy|purchase|pocket|grab|claim|pick up|i'?ll take|hand it over)\b/i.test(t)) {
    return false;
  }
  const declined =
    /\b(check status|status|walk away|leave|travel|ignore|refuse|no thanks|not interested)\b/i.test(t)
    || /^(wait|ready yourself)/i.test(t);
  if (!declined) return false;
  return /\b(shard|token|scrap|trinket|coin|offer|metal)\b/i.test(name);
}

/**
 * Apply previously-parsed but unwired structural tags:
 * item-gain / item-use, dungeon-load / move / exit, and opportunistic location hints.
 */
export function applyStructuralEvents(
  state: GameState,
  events: GameEvent[],
  options: { strictEncumbrance?: boolean; playerInput?: string } = {}
): {
  state: GameState;
  gainedItems: Item[];
  notes: string[];
} {
  let next = state;
  const gainedItems: Item[] = [];
  const notes: string[] = [];
  const strict = options.strictEncumbrance ?? false;
  const playerInput = options.playerInput ?? '';

  for (const e of events) {
    if (e.type === 'item-gain' && e.name) {
      if (shouldBlockUnearnedOfferGain(playerInput, e.name)) {
        notes.push(`Blocked unearned offer loot (player did not take it): ${e.name}`);
        continue;
      }
      if (shouldBlockContainerItemGain(next, playerInput, e.name)) {
        notes.push(`Blocked duplicate/exhausted container loot: ${e.name}`);
        continue;
      }
      const qty = Math.max(1, e.qty ?? 1);
      const seeded = resolveSeededRarity(next.activeDungeon, e.name, e.rarity, {
        pity: next.lootPity,
        seed: next.seed || 'seed',
        source: e.lootSource,
        claimedRarity: e.rarity,
        firstChestUncommonBias: next.tutorialProgress?.firstChestUncommonBiasPending === true,
      });
      const rarity = (seeded.rarity || (e.rarity as Rarity) || 'Common') as Rarity;
      if (seeded.tier != null && seeded.nextPity != null) {
        next = {
          ...next,
          lootPity: {
            byTier: {
              ...(next.lootPity?.byTier ?? {}),
              [seeded.tier]: seeded.nextPity,
            },
          },
        };
      }
      if (next.activeDungeon && seeded.dungeonPatch) {
        next = {
          ...next,
          activeDungeon: { ...next.activeDungeon, ...seeded.dungeonPatch },
        };
      }
      const item: Item = {
        id: e.id || uid(),
        name: e.name,
        rarity,
        quantity: qty,
        provenance:
          e.lootSource === 'quest' || e.lootSource === 'story' || e.lootSource === 'key'
            ? `Quest/story grant (${e.lootSource})`
            : 'Found during adventure',
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
        if (strict) {
          notes.push(result.reason ?? 'Could not add item');
          continue;
        }
        next = { ...next, inventory: [...next.inventory, item] };
      } else {
        next = result.state;
      }
      gainedItems.push(item);
      if (next.activeDungeon) {
        next = {
          ...next,
          activeDungeon: markLootablesOpenedOnGain(next.activeDungeon, [item.name]) ?? next.activeDungeon,
        };
      }
      notes.push(`Loot granted: [${rarity}] ${item.name}`);
      if (seeded.pityTriggered) {
        notes.push('Pity Protocol engaged — Epic+ guarantee applied.');
      }
      if (seeded.bossFirstClear) {
        notes.push('Boss first-clear: Epic+ guarantee applied.');
      }
      if (seeded.runFloorApplied) {
        notes.push('Run floor guarantee applied.');
      }
    }

    if (e.type === 'item-use' && (e.name || e.id)) {
      // Batch V — Leave/travel pads must never surface "item not in inventory"
      if (isLeaveOrTravelPad(playerInput)) {
        notes.push(`Skipped item-use on leave/travel pad: ${e.name ?? e.id}`);
        continue;
      }
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
      let dungeon = initializeDungeon(
        blueprint,
        e.dungeonName,
        procedural,
        tier,
        next.currentCoordinates,
        e.nodeCount
      );
      dungeon = seedDungeonState(dungeon, next.seed || 'seed');
      const locMem = advanceLocationMemory(next, e.dungeonName);
      const sheet = mergeSheetWithNode(
        locMem.locationSheet ?? ensureLocationSheet({ ...next, ...locMem }),
        currentDungeonNode(dungeon)
      );
      next = {
        ...next,
        ...locMem,
        locationSheet: sheet,
        activeDungeon: dungeon,
        currentLocation: e.dungeonName,
      };
      notes.push(`Dungeon loaded: ${e.dungeonName} (seeded hidden loot/traps/mobs)`);
    }

    if (e.type === 'dungeon-move' && e.nodeId && next.activeDungeon) {
      let moved = moveToNode(next.activeDungeon, e.nodeId);
      // Run floor becomes eligible once half the site is visited.
      if (
        !moved.runFloorMet &&
        moved.visitedNodeIds.length >= Math.ceil(moved.nodes.length * 0.5)
      ) {
        // Flag stays false until a chest consumes the floor guarantee.
      }
      const node = currentDungeonNode(moved);
      const locMem = advanceLocationMemory(
        next,
        node ? `${moved.dungeonName} — ${node.name}` : next.currentLocation
      );
      next = {
        ...next,
        ...locMem,
        locationSheet: mergeSheetWithNode(
          locMem.locationSheet ?? ensureLocationSheet({ ...next, ...locMem }),
          node
        ),
        activeDungeon: moved,
      };
    }

    if (e.type === 'dungeon-exit') {
      const leftDungeon = next.activeDungeon;
      const parentName =
        leftDungeon?.parentCoordinates
          ? next.previousLocationSheet?.name || next.currentLocation
          : next.previousLocationSheet?.name || next.currentLocation;
      const locMem = advanceLocationMemory(next, parentName || 'Outside');
      const closedSummary = leftDungeon
        ? `Cleared/left ${leftDungeon.dungeonName} (T${leftDungeon.dangerTier ?? leftDungeon.tier}); visited ${leftDungeon.visitedNodeIds.length}/${leftDungeon.nodes.length} nodes.`
        : '';
      next = {
        ...next,
        ...locMem,
        activeDungeon: exitDungeon(),
        places: leftDungeon
          ? closePlaceArc(
              upsertPlaceFromSheet(next.places ?? [], next.previousLocationSheet, {
                dungeonRef: leftDungeon.blueprintId,
              }),
              leftDungeon.dungeonName,
              closedSummary,
              next.turn
            )
          : next.places,
      };
      notes.push('Dungeon exited');
      if (closedSummary) notes.push(closedSummary);
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

  // Batch G — open crate/chest once: exhaust container even if empty or after loot
  if (playerInput) {
    const before = next.sceneFacts?.emptyContainers?.length ?? 0;
    next = exhaustOpenedContainer(next, playerInput);
    if ((next.sceneFacts?.emptyContainers?.length ?? 0) > before) {
      notes.push('Container exhausted after open');
    }
  }

  return { state: next, gainedItems, notes };
}
