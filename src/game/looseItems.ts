import type { GameState, Item } from './types';
import { currentDungeonNode, lootableLockedFor, openLootableInDungeon } from './dungeonSeed';
import { skillRanksOf } from './skillRanks';
import { recordGateTry, skillGateBlockedLine, skillLabel } from './skillGates';
import { isExplorableDungeon } from './placeAuthority';
import type { LooseNodeItem } from './dungeonMobLedger';
import { chestProfileForGrade, rollLoot } from './lootTableRegistry';

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
  const key = labelOrId.trim().toLowerCase().replace(/^(?:the|a|an)\s+/, '').replace(/[.!?]+$/, '');
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return { state, item: null };
  const node = currentDungeonNode(dungeon);
  const loose = node?.hidden?.looseItems ?? [];
  const hit = loose.find(
    (l) => l.id === labelOrId || l.label.trim().toLowerCase() === key
  );
  if (!hit || !node) return { state, item: null };

  const restored: Item = hit.item
    ? { ...hit.item }
    : {
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

/** Chips for this room: the first closed lootable, then up to two floor items. */
export function seededLootChips(state: GameState): string[] {
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon) || state.activeEncounter) return [];
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return [];
  const chips: string[] = [];
  const closed = node.hidden.lootables.find((l) => !l.opened);
  if (closed) chips.push(`Open the ${closed.label}`);
  for (const l of (node.hidden.looseItems ?? []).slice(0, 2)) chips.push(`Pick up ${l.label}`);
  return chips;
}

const OPEN_LOOTABLE_RE = /\b(open|loot|pry|search|rummage|inspect|examine|check)\b/i;
const CONTAINER_RE = /\b(chest|cache|coffer|crate|stash|console|container|box|locker)\b/i;

/**
 * Seeded (non-card) dungeons: open a closed lootable in this room. Items are rolled
 * by code and parked on the floor as loose items; gold goes straight to the purse.
 * Also settles "Pick up X" for callers that have no pickup short-circuit.
 */
export function openSeededLootable(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[] } {
  const receipts: string[] = [];
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return { state, receipts };
  const text = (playerInput ?? '').trim();

  const pickup = parseLooseItemPickup(text);
  if (pickup) {
    const picked = pickUpLooseItem(state, pickup);
    if (picked.item) receipts.push(`Loot: picked up ${picked.item.name}`);
    return { state: picked.state, receipts };
  }

  if (!OPEN_LOOTABLE_RE.test(text)) return { state, receipts };
  const node = currentDungeonNode(dungeon);
  const closed = (node?.hidden?.lootables ?? []).filter((l) => !l.opened);
  if (!node || !closed.length) return { state, receipts };
  const low = text.toLowerCase();
  const named = closed.find((l) => low.includes(l.label.toLowerCase()));
  const target = named ?? (CONTAINER_RE.test(text) || /\b(search|rummage)\b/i.test(text) ? closed[0] : undefined);
  if (!target) return { state, receipts };
  if (state.activeEncounter) {
    receipts.push(`Dungeon: the fight comes first; the ${target.label} stays shut.`);
    return { state, receipts };
  }

  const ranks = skillRanksOf(state.character);
  if (target.lock && lootableLockedFor(target, ranks)) {
    receipts.push(`Dungeon: ${skillGateBlockedLine(`The ${target.label}`, target.lock, state)}`);
    return { state: recordGateTry(state, { id: target.id, label: target.label, lock: target.lock }), receipts };
  }
  const opened = openLootableInDungeon(dungeon, target.id, ranks);
  if (!opened.loot) return { state, receipts };
  if (target.lock) receipts.push(`Dungeon: your ${skillLabel(target.lock.skill)} ${ranks[target.lock.skill]} opened the lock.`);
  const loot = rollLoot({
    profile: chestProfileForGrade(opened.loot.grade ?? 1),
    state,
    seed: `${state.seed ?? 'seed'}:${dungeon.dungeonName ?? node.id}:${target.id}`,
  });
  const gold = loot.gold + Math.max(0, opened.loot.gold ?? 0);
  let next: GameState = {
    ...state,
    activeDungeon: opened.dungeon,
    gold: (state.gold ?? 0) + gold,
    lootPity: loot.nextPity != null
      ? { byTier: { ...(state.lootPity?.byTier ?? {}), [loot.pityTier]: loot.nextPity } }
      : state.lootPity,
  };
  next = updateNodeLooseItems(next, (items) => [
    ...items,
    ...loot.items.map((item) => ({ id: newId(), label: item.name, item })),
  ]);
  receipts.push(`Dungeon: you opened the ${opened.label ?? target.label}.`);
  if (loot.items.length) {
    receipts.push(`Loot: ${loot.items.map((i) => `[${i.rarity}] ${i.name}`).join(', ')} (on the floor; pick up to take)`);
  }
  if (gold > 0) receipts.push(`Gold Gained: ${gold}`);
  if (!loot.items.length && gold <= 0) receipts.push(`Dungeon: the ${opened.label ?? target.label} was empty.`);
  return { state: next, receipts };
}
