import type { Location3D, MapTier } from './types.ts';
import {
  INTERIOR_MAP_BLUEPRINT,
  STREET_MAP_BLUEPRINT,
  isExplorableDungeon,
  isInteriorMap,
  isInteriorPlace,
  isStreetMap,
} from './placeAuthority.ts';
import { isDummyStreetNodeName, isGenericMapPlace, isInteriorRoomName } from './questPlay.ts';

export type MobRole = 'trash' | 'elite' | 'miniBoss' | 'boss';

export interface NodeHiddenLoot {
  rarity: import('./types').Rarity;
  qty: number;
  gold?: number;
  itemHint?: string;
  pityKey?: string;
}

export interface NodeHidden {
  traps: Array<{
    id: string;
    dc: number;
    skillHint: 'perception' | 'investigation' | 'thievery' | 'athletics';
    damage?: number;
    revealed: boolean;
    disarmed: boolean;
  }>;
  lootables: Array<{
    id: string;
    label: string;
    opened: boolean;
    loot: NodeHiddenLoot;
    trapId?: string;
  }>;
  secrets: Array<{
    id: string;
    clue?: string;
    revealed: boolean;
    unlocksNodeId?: string;
  }>;
  mobs: Array<{
    id: string;
    name: string;
    level: number;
    role: MobRole;
    spawned: boolean;
    defeated?: boolean;
    hpRemaining?: number | null;
  }>;
  looseItems?: Array<{
    id: string;
    label: string;
    inventoryItemId?: string;
  }>;
}

export interface MapNode {
  id: string;
  name: string;
  description: string;
  connections: string[];
  tags?: string[];
  isSecret?: boolean;
  coordinates?: { x: number; y: number };
  zLevel?: number;
  features?: {
    primary: string;
    secondary: string[];
  };
  subMapId?: string; // Link to nested tier map inside this node
  /** Engine-seeded traps/loot/secrets/mobs — set by dungeonSeed, not the LLM. */
  hidden?: NodeHidden;
}

export interface MapBlueprint {
  id: string;
  category: 'house' | 'cave' | 'dungeon' | 'spaceship' | 'ship' | 'custom';
  size: 'small' | 'medium' | 'massive' | 'custom';
  scaleKmPerHex?: number; // Distance represented per hex step
  tags: string[];
  nodes: MapNode[];
}

export interface ActiveDungeonState {
  blueprintId: string;
  dungeonName: string;
  /** Map SCALE (1 world … 4 tactical). For local-area street maps this is 3 — not danger. */
  tier: MapTier;
  /** Dungeon danger T1–T4 for loot/enemies. Omit on street maps. */
  dangerTier?: MapTier;
  parentCoordinates?: Location3D;
  currentZLevel: number;
  currentNodeId: string;
  visitedNodeIds: string[];
  clearedNodeIds: string[];
  nodes: MapNode[];
  dungeonRules?: {
    hazard?: string;
    bossNode?: string;
  };
  /** First clear of boss room still pending Epic+ guarantee. */
  bossFirstClearPending?: boolean;
  /** Guaranteed Rare+/Epic+ floor for this run (Pack 1). */
  runFloorMet?: boolean;
}

export const CORE_BLUEPRINTS: MapBlueprint[] = [
  {
    id: 'blueprint_cave_small_01',
    category: 'cave',
    size: 'small',
    scaleKmPerHex: 0.005,
    tags: ['subterranean', 'dark', 'natural'],
    nodes: [
      { id: 'node_mouth', name: 'Cave Entrance', description: 'A damp threshold where sunlight fades into shadow.', connections: ['node_tunnel'], tags: ['entry'], coordinates: { x: 0, y: 0 }, zLevel: 0 },
      { id: 'node_tunnel', name: 'Echoing Tunnel', description: 'Water drips rhythmically from jagged stalactites overhead.', connections: ['node_mouth', 'node_chamber'], tags: ['damp'], coordinates: { x: 0, y: 1 }, zLevel: 0 },
      { id: 'node_chamber', name: 'Stagnant Pool Chamber', description: 'A dark underground pool reflecting pale mineral light.', connections: ['node_tunnel'], tags: ['hazard', 'lootable'], coordinates: { x: 0, y: 2 }, zLevel: -1 }
    ]
  },
  {
    id: 'blueprint_spaceship_medium_01',
    category: 'spaceship',
    size: 'medium',
    scaleKmPerHex: 0.01,
    tags: ['sci-fi', 'industrial', 'steel'],
    nodes: [
      { id: 'node_airlock', name: 'Cargo Airlock', description: 'Heavy blast doors seal this pressurized entry bay.', connections: ['node_hallway'], tags: ['entry'], coordinates: { x: 1, y: 0 }, zLevel: 0 },
      { id: 'node_hallway', name: 'Main Maintenance Corridor', description: 'Flickering overhead panels illuminate grated metal flooring.', connections: ['node_airlock', 'node_bridge', 'node_engine'], tags: ['industrial'], coordinates: { x: 1, y: 1 }, zLevel: 0 },
      { id: 'node_bridge', name: 'Command Bridge', description: 'Dead control consoles and shattered glass shroud the captain\'s deck.', connections: ['node_hallway'], tags: ['control', 'lootable'], coordinates: { x: 0, y: 2 }, zLevel: 1 },
      { id: 'node_engine', name: 'Reactor Access Bay', description: 'A low electromagnetic hum vibrates through the bulkheads here.', connections: ['node_hallway'], tags: ['power', 'hazard'], coordinates: { x: 2, y: 2 }, zLevel: 0 }
    ]
  }
];

/**
 * Dynamically builds a blueprint based on AI-specified shape, size, and node count[cite: 2].
 * Allows any object (e.g. rowboat, starship, megastructure) to scale anywhere from 1 node to 100+ hexes[cite: 1, 2].
 */
export function generateProceduralBlueprint(
  shape: string, 
  name: string, 
  nodeCount: number = 8,
  zLevel: number = 0
): MapBlueprint {
  const nodes: MapNode[] = [];
  const count = Math.max(1, nodeCount);

  if (shape.toLowerCase().includes('web') || shape.toLowerCase().includes('spider')) {
    const hubId = 'node_web_core';
    nodes.push({
      id: hubId,
      name: `${name} - Core Hub`,
      description: 'The thick, vibrating center of the structure.',
      connections: [],
      tags: ['hub', 'center'],
      coordinates: { x: 3, y: 3 },
      zLevel,
      features: { primary: 'Central Core', secondary: ['Silk Strands', 'Vibrating Webs'] }
    });

    const spokeCount = Math.min(count - 1, 12);
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * 2 * Math.PI) / spokeCount;
      const x = Math.round(3 + Math.cos(angle) * 2);
      const y = Math.round(3 + Math.sin(angle) * 2);
      const nodeId = `node_web_spoke_${i + 1}`;

      nodes.push({
        id: nodeId,
        name: `${name} - Sector ${i + 1}`,
        description: `Section ${i + 1} radiating from the core hub.`,
        connections: [hubId],
        tags: i === spokeCount - 1 ? ['spoke', 'boss', 'lootable'] : i % 3 === 0 ? ['spoke', 'lootable'] : i % 3 === 1 ? ['spoke', 'hazard'] : ['spoke'],
        coordinates: { x, y },
        zLevel,
      });

      nodes[0].connections.push(nodeId);
      if (i > 0) {
        const prevId = `node_web_spoke_${i}`;
        nodes[nodes.length - 1].connections.push(prevId);
      }
    }
  } else {
    // Flexible Grid/Chain Fallback capable of scaling up to 100+ hexes[cite: 1, 2]
    const cols = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      const id = `node_gen_${i + 1}`;
      const x = i % cols;
      const y = Math.floor(i / cols);
      const connections: string[] = [];

      if (i > 0) connections.push(`node_gen_${i}`);
      if (i < count - 1) connections.push(`node_gen_${i + 2}`);

      const tags: string[] =
        i === 0
          ? ['entry']
          : i === count - 1
            ? ['boss', 'lootable']
            : i % 3 === 1
              ? ['lootable']
              : i % 3 === 2
                ? ['hazard']
                : ['passage'];

      nodes.push({
        id,
        name: `${name} - Hex ${i + 1}`,
        description: `Navigable hex sector ${i + 1} of ${name}.`,
        connections,
        tags,
        coordinates: { x, y },
        zLevel,
        features: {
          primary: `Node ${i + 1} Interior`,
          secondary: ['Structural Wall', 'Access Access Point']
        }
      });
    }
  }

  return {
    id: `blueprint_proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: 'custom',
    size: count > 30 ? 'massive' : count > 8 ? 'medium' : 'small',
    tags: ['procedural', shape],
    nodes
  };
}

export function initializeDungeon(
  blueprintIdOrShape: string, 
  dungeonName: string, 
  isProcedural: boolean = false,
  tier: MapTier = 4,
  parentCoords?: Location3D,
  customNodeCount?: number
): ActiveDungeonState {
  let blueprint: MapBlueprint | undefined;

  if (isProcedural) {
    blueprint = generateProceduralBlueprint(blueprintIdOrShape, dungeonName, customNodeCount ?? 8);
  } else {
    blueprint = CORE_BLUEPRINTS.find((b) => b.id === blueprintIdOrShape);
    if (!blueprint) {
      blueprint = generateProceduralBlueprint('grid', dungeonName, customNodeCount ?? 6);
    }
  }

  const startNode = blueprint.nodes[0];
  const startNodeId = startNode ? startNode.id : 'node_start';
  const initialZ = startNode?.zLevel ?? 0;

  return {
    blueprintId: blueprint.id,
    dungeonName,
    tier,
    dangerTier: tier,
    parentCoordinates: parentCoords,
    currentZLevel: initialZ,
    currentNodeId: startNodeId,
    visitedNodeIds: [startNodeId],
    clearedNodeIds: [],
    nodes: blueprint.nodes,
    bossFirstClearPending: true,
    runFloorMet: false,
  };
}

export function moveToNode(currentState: ActiveDungeonState, targetNodeId: string): ActiveDungeonState {
  const currentNode = currentState.nodes.find((n) => n.id === currentState.currentNodeId);
  const targetNode = currentState.nodes.find((n) => n.id === targetNodeId);

  if (!currentNode || !targetNode || !currentNode.connections.includes(targetNodeId)) {
    return currentState;
  }

  const visitedSet = new Set(currentState.visitedNodeIds);
  visitedSet.add(targetNodeId);

  return {
    ...currentState,
    currentNodeId: targetNodeId,
    currentZLevel: targetNode.zLevel ?? currentState.currentZLevel,
    visitedNodeIds: Array.from(visitedSet),
  };
}

export function exitDungeon(): undefined {
  return undefined;
}

function uniqueNames(names: string[], usable: (name: string) => boolean = usableStreetLabel): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (!name || !usable(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name.slice(0, 64));
  }
  return out;
}

function usableStreetLabel(name: string): boolean {
  if (isDummyStreetNodeName(name)) return false;
  if (isGenericMapPlace(name)) return false;
  return true;
}

/** Intersection slots on a 3×3 block grid (center is "you are here"). */
const STREET_SLOTS: Array<{ x: number; y: number }> = [
  { x: 2, y: 2 },
  { x: 1, y: 2 },
  { x: 3, y: 2 },
  { x: 2, y: 1 },
  { x: 2, y: 3 },
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 1, y: 3 },
  { x: 3, y: 3 },
];

function nextStreetSlot(dungeon: ActiveDungeonState): { x: number; y: number } {
  const used = new Set(dungeon.nodes.map((n) => `${n.coordinates?.x ?? 0},${n.coordinates?.y ?? 0}`));
  return STREET_SLOTS.find((slot) => !used.has(`${slot.x},${slot.y}`)) ?? { x: 3, y: 3 };
}

/**
 * Street-scale map of wherever the player said they are — Tesco Extra, a Kyoto alley, anywhere.
 * `tier: 3` is map SCALE (local ~1 km), not dungeon danger.
 */
export function buildLocalAreaMap(
  place: string,
  landmarks: string[] = [],
  parentCoords?: Location3D
): ActiveDungeonState {
  const rawHere = place.replace(/\s+/g, ' ').trim();
  const extras = uniqueNames(landmarks.filter((n) => n.toLowerCase() !== rawHere.toLowerCase()));
  const here = usableStreetLabel(rawHere) ? rawHere : extras[0] || 'Local streets';
  const names = uniqueNames([here, ...extras.filter((n) => n.toLowerCase() !== here.toLowerCase())]).slice(0, 8);

  const nodes: MapNode[] = names.map((name, i) => {
    const neighbors: string[] = [];
    if (i > 0) neighbors.push('local_0');
    if (i === 0) {
      for (let j = 1; j < names.length; j++) neighbors.push(`local_${j}`);
    }
    const slot = STREET_SLOTS[i] ?? { x: (i % 3) + 1, y: Math.floor(i / 3) + 1 };
    return {
      id: `local_${i}`,
      name,
      description: i === 0 ? `You are here: ${name}.` : `${name}, near ${here}.`,
      connections: neighbors,
      coordinates: slot,
      zLevel: 0,
      tags: i === 0 ? ['here', 'entry'] : lookLikeEntrance(name) ? ['local', 'entrance', 'micro_dungeon'] : ['local'],
    };
  });

  return {
    blueprintId: STREET_MAP_BLUEPRINT,
    dungeonName: here,
    tier: 3,
    // Street map: scale only — no dungeon dangerTier
    dangerTier: undefined,
    parentCoordinates: parentCoords,
    currentZLevel: 0,
    currentNodeId: 'local_0',
    visitedNodeIds: names.map((_, i) => `local_${i}`),
    clearedNodeIds: [],
    nodes,
  };
}

/** Heuristic: named buildings that can open a seeded micro-dungeon. */
export function lookLikeEntrance(name: string): boolean {
  return /\b(store|shop|mart|tesco|ruins?|warehouse|bunker|basement|mall|station|garage|tower|facility|lab|clinic|hospital|school|church|temple|cave|dungeon|complex|depot|yard|factory|plant)\b/i.test(
    name
  );
}

/** Drop dummy Cover/Side street nodes and junk titles (Every Mind, First Blood) from a saved street map. */
export function presentLocalAreaMap(
  dungeon: ActiveDungeonState,
  fallbackPlace?: string
): ActiveDungeonState {
  if (!isStreetMap(dungeon)) return dungeon;
  const fallbackRaw = (fallbackPlace ?? '').replace(/\s+/g, ' ').trim();
  const fallback = usableStreetLabel(fallbackRaw)
    ? fallbackRaw
    : usableStreetLabel(dungeon.dungeonName)
      ? dungeon.dungeonName
      : 'Local streets';
  const title = usableStreetLabel(dungeon.dungeonName) ? dungeon.dungeonName : fallback;

  const keep: MapNode[] = [];
  for (const n of dungeon.nodes) {
    const junk = !usableStreetLabel(n.name);
    if (junk && n.id !== dungeon.currentNodeId && n.id !== 'local_0') continue;
    keep.push(junk ? { ...n, name: title, description: `You are here: ${title}.` } : n);
  }
  if (keep.length === 0) {
    return buildLocalAreaMap(title, [], dungeon.parentCoordinates);
  }
  const ids = new Set(keep.map((n) => n.id));
  return {
    ...dungeon,
    dungeonName: title,
    nodes: keep.map((n) => ({ ...n, connections: n.connections.filter((c) => ids.has(c)) })),
    visitedNodeIds: Array.from(new Set([...dungeon.visitedNodeIds.filter((id) => ids.has(id)), ...keep.map((n) => n.id)])),
    currentNodeId: ids.has(dungeon.currentNodeId) ? dungeon.currentNodeId : keep[0]!.id,
  };
}

export function addLandmarkToLocalMap(dungeon: ActiveDungeonState, landmark: string): ActiveDungeonState {
  dungeon = presentLocalAreaMap(dungeon);
  const name = landmark.replace(/\s+/g, ' ').trim();
  if (!usableStreetLabel(name)) return dungeon;
  if (dungeon.nodes.some((n) => n.name.toLowerCase() === name.toLowerCase())) return dungeon;
  if (dungeon.nodes.length >= 8) return dungeon;
  const id = `local_${dungeon.nodes.length}`;
  const here = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId) ?? dungeon.nodes[0];
  const slot = nextStreetSlot(dungeon);
  const node: MapNode = {
    id,
    name,
    description: `${name}, near ${dungeon.dungeonName}.`,
    connections: here ? [here.id] : [],
    coordinates: slot,
    zLevel: 0,
    tags: lookLikeEntrance(name) ? ['local', 'entrance', 'micro_dungeon'] : ['local'],
  };
  const nodes = dungeon.nodes.map((n) =>
    n.id === here?.id ? { ...n, connections: [...n.connections, id] } : n
  );
  return {
    ...dungeon,
    nodes: [...nodes, node],
    visitedNodeIds: Array.from(new Set([...dungeon.visitedNodeIds, id])),
  };
}

function usableInteriorHere(name: string): boolean {
  if (!name) return false;
  if (isDummyStreetNodeName(name)) return false;
  if (isGenericMapPlace(name)) return false;
  return true;
}

function usableInteriorRoom(name: string): boolean {
  return usableInteriorHere(name) && (isInteriorRoomName(name) || isInteriorPlace(name));
}

/** Adjacent room slots around a central hall — not a 3×3 city block grid. */
const INTERIOR_SLOTS: Array<{ x: number; y: number }> = [
  { x: 1, y: 1 },
  { x: 1, y: 0 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: 1 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: 0, y: 0 },
];

function nextInteriorSlot(dungeon: ActiveDungeonState): { x: number; y: number } {
  const used = new Set(dungeon.nodes.map((n) => `${n.coordinates?.x ?? 0},${n.coordinates?.y ?? 0}`));
  return INTERIOR_SLOTS.find((slot) => !used.has(`${slot.x},${slot.y}`)) ?? { x: 3, y: 1 };
}

/**
 * Indoor floor plan of the current hall / cathedral / circle.
 * Not a local-streets 1 km grid. Unnamed fog rooms stay off the pin list.
 */
export function buildInteriorFloorPlan(
  place: string,
  rooms: string[] = [],
  parentCoords?: Location3D
): ActiveDungeonState {
  const rawHere = place.replace(/\s+/g, ' ').trim();
  const extras = uniqueNames(
    rooms.filter((n) => n.toLowerCase() !== rawHere.toLowerCase()),
    usableInteriorRoom
  );
  const here = usableInteriorHere(rawHere) ? rawHere : extras[0] || 'Interior';
  const names = uniqueNames(
    [here, ...extras.filter((n) => n.toLowerCase() !== here.toLowerCase())],
    (n) => (n.toLowerCase() === here.toLowerCase() ? usableInteriorHere(n) : usableInteriorRoom(n))
  ).slice(0, 8);

  const nodes: MapNode[] = names.map((name, i) => {
    const neighbors: string[] = [];
    if (i > 0) neighbors.push('room_0');
    if (i === 0) {
      for (let j = 1; j < names.length; j++) neighbors.push(`room_${j}`);
    }
    const slot = INTERIOR_SLOTS[i] ?? { x: i % 3, y: Math.floor(i / 3) };
    return {
      id: `room_${i}`,
      name,
      description: i === 0 ? `You are here: ${name}.` : `${name}, inside ${here}.`,
      connections: neighbors,
      coordinates: slot,
      zLevel: 0,
      tags: i === 0 ? ['here', 'entry', 'interior'] : ['interior', 'room'],
    };
  });

  return {
    blueprintId: INTERIOR_MAP_BLUEPRINT,
    dungeonName: here,
    tier: 4,
    dangerTier: undefined,
    parentCoordinates: parentCoords,
    currentZLevel: 0,
    currentNodeId: 'room_0',
    visitedNodeIds: ['room_0'],
    clearedNodeIds: [],
    nodes,
  };
}

export function presentInteriorMap(
  dungeon: ActiveDungeonState,
  fallbackPlace?: string
): ActiveDungeonState {
  if (!isInteriorMap(dungeon)) return dungeon;
  const fallbackRaw = (fallbackPlace ?? '').replace(/\s+/g, ' ').trim();
  const fallback = usableInteriorHere(fallbackRaw)
    ? fallbackRaw
    : usableInteriorHere(dungeon.dungeonName)
      ? dungeon.dungeonName
      : 'Interior';
  const title = usableInteriorHere(dungeon.dungeonName) ? dungeon.dungeonName : fallback;

  const keep: MapNode[] = [];
  for (const n of dungeon.nodes) {
    const isHere = n.id === dungeon.currentNodeId || n.id === 'room_0';
    const junk = isHere ? !usableInteriorHere(n.name) : !usableInteriorRoom(n.name);
    if (junk && !isHere) continue;
    keep.push(junk ? { ...n, name: title, description: `You are here: ${title}.` } : n);
  }
  if (keep.length === 0) {
    return buildInteriorFloorPlan(title, [], dungeon.parentCoordinates);
  }
  const ids = new Set(keep.map((n) => n.id));
  return {
    ...dungeon,
    dungeonName: title,
    nodes: keep.map((n) => ({ ...n, connections: n.connections.filter((c) => ids.has(c)) })),
    visitedNodeIds: Array.from(new Set([...dungeon.visitedNodeIds.filter((id) => ids.has(id)), keep[0]!.id])),
    currentNodeId: ids.has(dungeon.currentNodeId) ? dungeon.currentNodeId : keep[0]!.id,
  };
}

export function addRoomToInteriorMap(dungeon: ActiveDungeonState, room: string): ActiveDungeonState {
  dungeon = presentInteriorMap(dungeon);
  const name = room.replace(/\s+/g, ' ').trim();
  if (!usableInteriorRoom(name)) return dungeon;
  if (dungeon.nodes.some((n) => n.name.toLowerCase() === name.toLowerCase())) return dungeon;
  if (dungeon.nodes.length >= 8) return dungeon;
  const id = `room_${dungeon.nodes.length}`;
  const here = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId) ?? dungeon.nodes[0];
  const slot = nextInteriorSlot(dungeon);
  const node: MapNode = {
    id,
    name,
    description: `${name}, inside ${dungeon.dungeonName}.`,
    connections: here ? [here.id] : [],
    coordinates: slot,
    zLevel: 0,
    tags: ['interior', 'room'],
  };
  const nodes = dungeon.nodes.map((n) =>
    n.id === here?.id ? { ...n, connections: [...n.connections, id] } : n
  );
  return {
    ...dungeon,
    nodes: [...nodes, node],
    visitedNodeIds: dungeon.visitedNodeIds,
  };
}

function sameAreaMap(a: ActiveDungeonState | null | undefined, b: ActiveDungeonState | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.blueprintId !== b.blueprintId || a.dungeonName !== b.dungeonName || a.currentNodeId !== b.currentNodeId) {
    return false;
  }
  if (a.nodes.length !== b.nodes.length) return false;
  return a.nodes.every((n, i) => {
    const o = b.nodes[i];
    return !!o && n.id === o.id && n.name === o.name;
  });
}

/**
 * Street grid outdoors; floor-plan silhouette indoors.
 * Replaces a wrongly built local-area cathedral map on the next Map open.
 */
export function resolvePlayAreaMap(
  existing: ActiveDungeonState | null | undefined,
  place: string,
  landmarks: string[] = [],
  parentCoords?: Location3D
): ActiveDungeonState | null {
  if (isExplorableDungeon(existing ?? null)) return existing ?? null;
  const here = (place ?? '').replace(/\s+/g, ' ').trim();
  let next: ActiveDungeonState | null = null;
  if (isInteriorPlace(here)) {
    const rooms = landmarks.filter((n) => n.toLowerCase() !== here.toLowerCase());
    if (existing && isInteriorMap(existing)) {
      next = presentInteriorMap(existing, here);
      for (const room of rooms) next = addRoomToInteriorMap(next, room);
    } else {
      next = buildInteriorFloorPlan(here, rooms, parentCoords ?? existing?.parentCoordinates);
    }
  } else if (existing && isStreetMap(existing)) {
    next = presentLocalAreaMap(existing, here || existing.dungeonName);
    for (const named of landmarks) next = addLandmarkToLocalMap(next, named);
  } else if (here || existing) {
    next = buildLocalAreaMap(
      here || existing?.dungeonName || 'Local streets',
      landmarks,
      parentCoords ?? existing?.parentCoordinates
    );
  }
  if (existing && sameAreaMap(next, existing)) return existing;
  return next;
}