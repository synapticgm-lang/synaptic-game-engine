import type { GameState } from './types';
import type { ActiveDungeonState, MapNode } from './mapEngine';
import { initializeDungeon, moveToNode } from './mapEngine';
import { seedDungeonState } from './dungeonSeed';

const ENTER_ACTION =
  /\b(enter|go in|step in|head in|inside|forward|sneak(?:ing)? in|move (?:in|forward)|scout(?:ing)?(?:\s+the)?\s+entrance|through the (?:door|doors))\b/i;

const INTERIOR_CUE =
  /\b(store|shop|tesco|mart|micro[- ]?dungeon|dungeon|aisle|stockroom|convenience)\b/i;

export function playerEntersInterior(action: string, state: GameState): boolean {
  if (!ENTER_ACTION.test(action) && !INTERIOR_CUE.test(action)) return false;
  if (ENTER_ACTION.test(action)) return true;
  return /\b(go|walk|move|head|step|scout)\b/i.test(action) && INTERIOR_CUE.test(action);
}

export function alreadyInSeededDungeon(state: GameState): boolean {
  const d = state.activeDungeon;
  return !!(d && d.blueprintId !== 'local-area');
}

function storeNodes(): MapNode[] {
  const rooms: Array<{ id: string; name: string; tags: string[]; x: number; y: number }> = [
    { id: 'store_entrance', name: 'Store entrance', tags: ['entry'], x: 1, y: 2 },
    { id: 'store_aisle', name: 'Grocery aisle', tags: ['combat'], x: 2, y: 2 },
    { id: 'store_drinks', name: 'Drinks aisle', tags: ['combat'], x: 3, y: 2 },
    { id: 'store_checkout', name: 'Checkout', tags: ['combat'], x: 2, y: 1 },
    { id: 'store_stock', name: 'Stockroom', tags: ['elite', 'mini_boss'], x: 3, y: 1 },
    { id: 'store_office', name: 'Back office', tags: ['lootable', 'cache'], x: 3, y: 0 },
  ];
  const links: Record<string, string[]> = {
    store_entrance: ['store_aisle', 'store_checkout'],
    store_aisle: ['store_entrance', 'store_drinks', 'store_checkout'],
    store_drinks: ['store_aisle', 'store_stock'],
    store_checkout: ['store_entrance', 'store_aisle'],
    store_stock: ['store_drinks', 'store_office'],
    store_office: ['store_stock'],
  };
  return rooms.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.name,
    connections: links[r.id] ?? [],
    coordinates: { x: r.x, y: r.y },
    zLevel: 0,
    tags: r.tags,
  }));
}

/** Locked First Blood / convenience-store micro-dungeon — rooms, mobs, mini-boss, core. */
export function buildConvenienceStoreDungeon(seed: string, placeName: string): ActiveDungeonState {
  const base = initializeDungeon('grid', `${placeName} micro-dungeon`, true, 1, undefined, 6);
  const nodes = storeNodes();
  let dungeon: ActiveDungeonState = {
    ...base,
    blueprintId: 'first-blood-store',
    dungeonName: `${placeName} store`,
    tier: 1,
    dangerTier: 1,
    currentNodeId: 'store_entrance',
    visitedNodeIds: ['store_entrance'],
    nodes,
    dungeonRules: { bossNode: 'store_stock' },
  };
  dungeon = seedDungeonState(dungeon, seed);
  dungeon = {
    ...dungeon,
    nodes: dungeon.nodes.map((node) => {
      const hidden = node.hidden ?? { traps: [], lootables: [], secrets: [], mobs: [] };
      if (node.id === 'store_aisle') {
        hidden.mobs = [
          { id: 'aisle_pack', name: 'Verminkin Scavenger', level: 1, role: 'trash', spawned: false },
        ];
      } else if (node.id === 'store_drinks') {
        hidden.mobs = [
          { id: 'drinks_pack', name: 'Ravager Hatchling', level: 1, role: 'trash', spawned: false },
        ];
      } else if (node.id === 'store_checkout') {
        hidden.mobs = [
          { id: 'till_pack', name: 'Verminkin Scavenger', level: 1, role: 'trash', spawned: false },
        ];
      } else if (node.id === 'store_stock') {
        hidden.mobs = [
          { id: 'stock_boss', name: 'Corrupted Stockboy', level: 3, role: 'miniBoss', spawned: false },
        ];
      } else if (node.id === 'store_office') {
        hidden.mobs = [];
        hidden.lootables = [
          {
            id: 'office_core',
            label: 'Foundation Core cache',
            opened: false,
            loot: { rarity: 'Rare', qty: 1, itemHint: 'Foundation Core', pityKey: 'first-blood-core' },
          },
        ];
      } else {
        hidden.mobs = [];
      }
      return { ...node, hidden };
    }),
  };
  return dungeon;
}

export function maybeAdvanceDungeonRoom(state: GameState, action: string): GameState {
  if (!alreadyInSeededDungeon(state) || !state.activeDungeon) return state;
  if (!/\b(forward|deeper|next (?:aisle|room)|move (?:in|forward)|go (?:on|deeper|through)|aisle|stockroom|checkout)\b/i.test(action)) {
    return state;
  }
  const dungeon = state.activeDungeon;
  const here = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId);
  const nextId =
    here?.connections.find((id) => !dungeon.visitedNodeIds.includes(id))
    ?? here?.connections.find((id) => id !== dungeon.currentNodeId);
  if (!nextId) return state;
  const moved = moveToNode(dungeon, nextId);
  const room = moved.nodes.find((n) => n.id === moved.currentNodeId);
  return {
    ...state,
    activeDungeon: moved,
    currentLocation: room?.name ?? state.currentLocation,
    locationSheet: state.locationSheet
      ? { ...state.locationSheet, name: room?.name ?? state.locationSheet.name, mapScale: 'dungeon' }
      : state.locationSheet,
  };
}

export function maybeEnterInteriorDungeon(state: GameState, action: string): GameState {
  if (alreadyInSeededDungeon(state)) return maybeAdvanceDungeonRoom(state, action);
  if (!playerEntersInterior(action, state)) return state;
  const place =
    state.locationSheet?.name
    || state.currentLocation
    || 'Convenience store';
  const dungeon = buildConvenienceStoreDungeon(state.seed || 'seed', place.replace(/\s+uk$/i, '').trim());
  return {
    ...state,
    activeDungeon: dungeon,
    currentLocation: dungeon.dungeonName,
    locationSheet: {
      name: 'Store entrance',
      interactables: state.locationSheet?.interactables ?? [],
      exits: state.locationSheet?.exits ?? [],
      presentNpcIds: state.locationSheet?.presentNpcIds ?? [],
      mapScale: 'dungeon',
      dangerTier: 1,
    },
  };
}
