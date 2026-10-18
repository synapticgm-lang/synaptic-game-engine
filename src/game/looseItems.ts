import type { GameState, Item } from './types';
import { currentDungeonNode, lootableLockedFor, openLootableInDungeon } from './dungeonSeed';
import { skillRanksOf } from './skillRanks';
import { recordGateTry, skillGateBlockedLine, skillLabel } from './skillGates';
import { isExplorableDungeon } from './placeAuthority';
import type { LooseNodeItem } from './dungeonMobLedger';
import { chestProfileForGrade, rollLoot } from './lootTableRegistry';
import { isOpenContainerAction, isSearchTargetEmpty, normalizeSearchTarget, recordEmptySearch } from './searchContinuity';
import { matchesLastKillName } from './combatAuthority';
import { exitPlaceNames } from './placeNames';
import { addCoins, gainLootMoney, lootMoneyFound, lootMoneyText } from './rules/coins';
import { isRewardBoxOpenLine } from './rules/achievements';

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
  const corpse = lootLastKillBody(state, playerInput);
  if (corpse) return corpse;
  const receipts: string[] = [];
  const dungeon = state.activeDungeon;
  if (!isExplorableDungeon(dungeon)) return searchOutsideDungeon(state, playerInput);
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
  const cardGold = Math.max(0, opened.loot.gold ?? 0);
  const gold = loot.gold + cardGold;
  const coins = loot.coins ? addCoins(loot.coins, { gp: cardGold }) : undefined;
  let next: GameState = gainLootMoney({
    ...state,
    activeDungeon: opened.dungeon,
    lootPity: loot.nextPity != null
      ? { byTier: { ...(state.lootPity?.byTier ?? {}), [loot.pityTier]: loot.nextPity } }
      : state.lootPity,
  }, gold, coins);
  const money = lootMoneyText(gold, coins);
  next = updateNodeLooseItems(next, (items) => [
    ...items,
    ...loot.items.map((item) => ({ id: newId(), label: item.name, item })),
  ]);
  receipts.push(`Dungeon: you opened the ${opened.label ?? target.label}.`);
  if (loot.items.length) {
    receipts.push(`Loot: ${loot.items.map((i) => `[${i.rarity}] ${i.name}`).join(', ')} (on the floor; pick up to take)`);
  }
  if (money) receipts.push(`Gold Gained: ${money}`);
  if (state.engineMode === 'dnd') receipts.push(...loot.displayLines);
  if (!loot.items.length && !money) receipts.push(`Dungeon: the ${opened.label ?? target.label} was empty.`);
  return { state: next, receipts };
}

const BODY_LOOT_VERB = /\b(loot|search|rummage|strip|pat down|go through|check)\b/i;
const BODY_NOUN = /\b(body|corpse|remains)\b/i;

/**
 * s82 Root B — looting the body of this scene's kill. The fight already paid its drop
 * (`simulateCombat`), so the engine commits "nothing more" and marks the body looted.
 */
function lootLastKillBody(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[] } | null {
  const kill = state.sceneFacts?.lastKill;
  const text = (playerInput ?? '').trim();
  if (!kill?.name || kill.outcome !== 'victory' || !kill.remains || state.activeEncounter) return null;
  if (!BODY_LOOT_VERB.test(text)) return null;
  const target = text.replace(BODY_LOOT_VERB, '').replace(/\b(?:the|body|corpse|remains|of)\b/gi, ' ');
  if (!BODY_NOUN.test(text) && !matchesLastKillName(target, kill)) return null;
  return {
    state: { ...state, sceneFacts: { ...state.sceneFacts!, lastKill: { ...kill, looted: true } } },
    receipts: [`Search: you searched the body of ${kill.name} and found nothing more; what it carried came off it after the fight.`],
  };
}

const SEARCH_VERB = /\b(search|searches|searching|rummage|rummaging|scavenge|scavenging|sift|sifting|dig|digging)\b/i;
const CONTAINER_KEY = /^(crate|chest|barrel|box)$/;
const EXITS_LOOK = /^(?:check|scout|look for|find)\s+(?:the\s+)?(?:exits?|ways? out)\b/i;

/** Outside a dungeon: checking the exits commits HERE's exits, the same ones the writer's PLACES line names. */
function checkExits(state: GameState, text: string): { state: GameState; receipts: string[] } | null {
  if (!EXITS_LOOK.test(text)) return null;
  const here = state.currentLocation?.trim() || 'here';
  const ways = exitPlaceNames(state).map((w) => w.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 4);
  return {
    state,
    receipts: [
      ways.length
        ? `Exits: the ways out of ${here} lead to ${ways.join(', ')}.`
        : `Exits: no way out of ${here} leads to a mapped place.`,
    ],
  };
}

/**
 * Outside a dungeon: the engine decides a search or an opened container before the writer, as the
 * dungeon search does. A first search rolls loot it grants (a container always holds a roll; ground
 * may hold nothing). A searched target stays empty. The receipt is the ENGINE RESULT.
 */
function searchOutsideDungeon(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[] } {
  const text = (playerInput ?? '').trim();
  // L2 — System reward-box opens are settleRewardBox only; never a world "box" search.
  if (isRewardBoxOpenLine(text)) return { state, receipts: [] };
  const exits = state.activeEncounter ? null : checkExits(state, text);
  if (exits) return exits;
  const opensContainer = isOpenContainerAction(text);
  if (state.activeEncounter || (!opensContainer && !SEARCH_VERB.test(text))) {
    return { state, receipts: [] };
  }
  const target = normalizeSearchTarget(text, state.currentLocation);
  if (target === 'bag') return { state, receipts: [] };
  const container = CONTAINER_KEY.test(target);
  const what = container
    ? `the ${target}`
    : target === 'here' || target.startsWith('loc:')
      ? state.currentLocation?.trim() || 'the area'
      : `the ${target}`;
  const facts = recordEmptySearch(state.sceneFacts, target, state.turn ?? 0);
  if (isSearchTargetEmpty(state.sceneFacts, target)) {
    return { state: { ...state, sceneFacts: facts }, receipts: [`Search: you searched ${what} again and found nothing new.`] };
  }
  const loot = rollLoot({
    profile: container ? 'chestBronze' : 'mob',
    state,
    seed: `${state.seed ?? 'seed'}:search:${(state.currentLocation ?? '').toLowerCase()}:${target}`,
  });
  const next: GameState = gainLootMoney({
    ...state,
    sceneFacts: facts,
    inventory: [...(state.inventory ?? []), ...loot.items],
    lootPity: loot.nextPity != null
      ? { byTier: { ...(state.lootPity?.byTier ?? {}), [loot.pityTier]: loot.nextPity } }
      : state.lootPity,
  }, loot.gold, loot.coins);
  const names = loot.items.map((i) => i.name);
  const money = lootMoneyText(loot.gold, loot.coins);
  const found = [...names, ...(money ? [lootMoneyFound(loot.gold, loot.coins)!] : [])];
  const verb = container ? `opened ${what}` : `searched ${what}`;
  const receipts = [`Search: you ${verb} and found ${found.length ? found.join(', ') : 'nothing'}.`];
  if (loot.items.length) receipts.push(`Loot: ${loot.items.map((i) => `[${i.rarity}] ${i.name}`).join(', ')}`);
  if (money) receipts.push(`Gold Gained: ${money}`);
  if (next.engineMode === 'dnd') receipts.push(...loot.displayLines);
  return { state: next, receipts };
}
