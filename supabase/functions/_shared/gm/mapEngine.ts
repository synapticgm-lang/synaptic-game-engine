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
import { createHashRng } from './seededRng.ts';

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
    kind?: string;
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
    /** True kill — ledger combat or legacy inferred on repair. */
    defeated?: boolean;
    /** Wounded parked blob; > 0 means the mob waits on this node (flee batch). */
    hpRemaining?: number | null;
  }>;
  /** Real inventory projectiles on the floor — separate from lootables (post-playtest batch). */
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

/** True when a secret room/passage is open for travel (skill/story reveal, or already entered). */
export function isInteriorSecretUnlocked(
  dungeon: ActiveDungeonState,
  nodeId: string
): boolean {
  const node = dungeon.nodes.find((n) => n.id === nodeId);
  if (!node?.isSecret) return true;
  if (dungeon.visitedNodeIds.includes(nodeId)) return true;
  if ((node.tags ?? []).includes('secret-unlocked')) return true;
  return dungeon.nodes.some((n) =>
    (n.hidden?.secrets ?? []).some((s) => s.unlocksNodeId === nodeId && s.revealed)
  );
}

export function moveToNode(currentState: ActiveDungeonState, targetNodeId: string): ActiveDungeonState {
  const currentNode = currentState.nodes.find((n) => n.id === currentState.currentNodeId);
  const targetNode = currentState.nodes.find((n) => n.id === targetNodeId);

  if (!currentNode || !targetNode || !currentNode.connections.includes(targetNodeId)) {
    return currentState;
  }
  if (isInteriorMap(currentState) && !isInteriorSecretUnlocked(currentState, targetNodeId)) {
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

const MAX_ROOM_LABEL = 28;
const MAX_BUILDING_TITLE = 44;

const ROOM_PHRASE =
  /\b((?:First|Second|Third|Upper|Lower|East|West|North|South)\s+)?(?:Chamber|Hall|Room|Vestry|Nave|Crypt|Cellar|Attic|Corridor|Passage|Stairs|Stairwell|Landing|Antechamber|Narthex|Choir|Cloister|Sanctum|Kitchen|Storeroom|Storage|Entry|Entrance)\b(?:\s+of\s+[A-Za-z][\w' -]{0,24})?/i;

const GENERIC_ROOM_LABELS = new Set(
  [
    'entry',
    'first chamber',
    'chamber',
    'corridor',
    'ruined hall',
    'hall',
    'side room',
    'side chamber',
    'stairs',
    'stairwell',
    'cellar',
    'attic',
    'upper landing',
    'upper hall',
    'storeroom',
    'storage',
    'back room',
    'antechamber',
    'collapse',
    'collapsed wing',
    'wall shell',
    'main room',
    'vault',
    'crypt',
    'ossuary',
    'loft',
    'gallery',
    'narthex',
    'nave',
    'aisle',
    'vestry',
    'choir',
    'sanctum',
    'reliquary',
    'belfry',
    'foyer',
    'salon',
    'dining hall',
    'study',
    'wine cellar',
    'bedroom',
    'library',
    'passage',
  ].map((s) => s.toLowerCase())
);

/** Short room pin — never the full currentLocation essay. */
export function shortRoomLabel(raw: string, fallback = 'Chamber'): string {
  const n = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!n) return fallback;
  if (
    n.length <= MAX_ROOM_LABEL &&
    !/[—,]/.test(n) &&
    !/\boff the\b|\bsomewhere\b|\balone in\b/i.test(n)
  ) {
    return n;
  }
  const phrase = n.match(ROOM_PHRASE);
  if (phrase?.[0]) return phrase[0].replace(/\s+/g, ' ').trim().slice(0, MAX_ROOM_LABEL);
  if (/\bbuilding\b|\bruin/i.test(n)) return 'Entry';
  return fallback;
}

/** Building title for the map header — truncated place, not a room essay. */
export function shortBuildingTitle(raw: string): string {
  const n = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!n) return 'Interior';
  const essay =
    /\balone in\b|\bsomewhere\b|\bserious damage\b/i.test(n) ||
    (/\boff the\b/i.test(n) && /\b(?:roads?|building|ruin)/i.test(n)) ||
    n.length > 56;
  if (!essay && n.length <= MAX_BUILDING_TITLE) return n;
  if (!essay) {
    const compact = n.replace(/\s+under\s+/i, ' · ').replace(/\s+of\s+/i, ' · ');
    if (compact.length <= MAX_BUILDING_TITLE) return compact;
    return `${compact.slice(0, MAX_BUILDING_TITLE - 1).trimEnd()}…`;
  }
  const place = n.match(/\b(?:off|near|along|by|under)\s+the\s+([^,—.]+)/i);
  const placeBit = (place?.[1] ?? '').replace(/\s+/g, ' ').trim().slice(0, 22);
  let kind = 'Building';
  if (/\bcathedral\b/i.test(n)) kind = 'Cathedral';
  else if (/\bcircle\b/i.test(n)) kind = 'Circle';
  else if (/\bmanor\b|\bhall\b/i.test(n)) kind = 'Hall';
  else if (/\bruin/i.test(n)) kind = 'Ruin';
  else if (/\bcourt\b/i.test(n)) kind = 'Court';
  else if (/\btemple\b|\bchapel\b/i.test(n)) kind = 'Temple';
  const damaged =
    /\b(?:damaged|half-collapsed|collapsed|burnt|shabby|wall-shell|foundation|serious damage)\b/i.test(n);
  const title = damaged ? `Damaged ${kind.toLowerCase()}` : kind;
  const headed = title.charAt(0).toUpperCase() + title.slice(1);
  if (placeBit) return `${headed} · ${placeBit}`.slice(0, MAX_BUILDING_TITLE);
  return headed.slice(0, MAX_BUILDING_TITLE);
}

/** Visited = explored fill; unvisited = mapped fog; secret = locked passage. */
export type InteriorFillKind = 'visited' | 'unvisited' | 'secret';

export function interiorRoomFillKind(
  dungeon: ActiveDungeonState,
  node: MapNode
): InteriorFillKind {
  if (node.isSecret && !isInteriorSecretUnlocked(dungeon, node.id)) return 'secret';
  if (dungeon.visitedNodeIds.includes(node.id)) return 'visited';
  return 'unvisited';
}

function isAuthoredInterior(dungeon: ActiveDungeonState): boolean {
  return dungeon.nodes.some((n) => (n.tags ?? []).includes('authored'));
}

/** Tiny sheds stay one floor; ruined halls / mansions / cathedrals get 2–3. */
export type InteriorBuildingScale = 'shed' | 'ruin' | 'grand';

export function interiorBuildingScale(place: string): InteriorBuildingScale {
  const n = (place ?? '').replace(/\s+/g, ' ').trim();
  if (/\b(?:shed|shack|hut|hovel|booth|closet|lean-?to)\b/i.test(n)) return 'shed';
  if (
    /\b(?:cathedral|manor|mansion|palace|castle|keep|temple|guildhall|abbey|sanctum|circle)\b/i.test(n)
  ) {
    return 'grand';
  }
  return 'ruin';
}

/** RE-style floor tab label: B1 / 1F / 2F (original chrome — not licensed assets). */
export function interiorFloorLabel(z: number): string {
  if (z < 0) return `B${Math.abs(z)}`;
  return `${z + 1}F`;
}

export function listInteriorZLevels(dungeon: ActiveDungeonState): number[] {
  const zs = new Set(dungeon.nodes.map((n) => n.zLevel ?? 0));
  return Array.from(zs).sort((a, b) => a - b);
}

export function nodesOnInteriorFloor(dungeon: ActiveDungeonState, z: number): MapNode[] {
  return dungeon.nodes.filter((n) => (n.zLevel ?? 0) === z);
}

export function roomHasVerticalLink(dungeon: ActiveDungeonState, node: MapNode): boolean {
  const z = node.zLevel ?? 0;
  return node.connections.some((id) => {
    const t = dungeon.nodes.find((n) => n.id === id);
    return !!t && (t.zLevel ?? 0) !== z;
  });
}

function needsAuthoredInteriorRebuild(dungeon: ActiveDungeonState, placeHint?: string): boolean {
  if (!isInteriorMap(dungeon)) return true;
  if (!isAuthoredInterior(dungeon)) return true;
  const place = placeHint || dungeon.dungeonName || '';
  const scale = interiorBuildingScale(place);
  const openRooms = dungeon.nodes.filter((n) => !n.isSecret).length;
  if (scale === 'shed') return openRooms < 2;
  if (openRooms < 5) return true;
  // Legacy 20n single-floor graphs: rebuild when the building wants multi-z.
  const zs = listInteriorZLevels(dungeon);
  if (zs.length < 2) return true;
  return false;
}

/** Adjacent room slots for rare harvest add-ons — not a city block grid. */
const INTERIOR_SLOTS: Array<{ x: number; y: number }> = [
  { x: 1, y: 1 },
  { x: 1, y: 0 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: 1 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: 0, y: 0 },
  { x: 3, y: 1 },
  { x: 2, y: 2 },
];

function nextInteriorSlot(dungeon: ActiveDungeonState, z = 0): { x: number; y: number } {
  const used = new Set(
    dungeon.nodes
      .filter((n) => (n.zLevel ?? 0) === z)
      .map((n) => `${n.coordinates?.x ?? 0},${n.coordinates?.y ?? 0}`)
  );
  return INTERIOR_SLOTS.find((slot) => !used.has(`${slot.x},${slot.y}`)) ?? { x: 3, y: 2 };
}

type InteriorRoomSpec = {
  id: string;
  label: string;
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  links: string[];
  isSecret?: boolean;
  entry?: boolean;
};

/** Single-floor sheds / booths — not every dump needs a cellar. */
const SHED_LAYOUTS: InteriorRoomSpec[][] = [
  [
    { id: 'entry', label: 'Entry', x: 1, y: 1, z: 0, links: ['main'], entry: true },
    { id: 'main', label: 'Main room', x: 1, y: 0, z: 0, links: ['entry', 'back'] },
    { id: 'back', label: 'Back room', x: 2, y: 0, z: 0, links: ['main'] },
  ],
  [
    { id: 'entry', label: 'Entry', x: 0, y: 1, z: 0, links: ['hall'], entry: true },
    { id: 'hall', label: 'Hall', x: 1, y: 1, z: 0, links: ['entry', 'side', 'store'] },
    { id: 'side', label: 'Side room', x: 1, y: 0, z: 0, links: ['hall'] },
    { id: 'store', label: 'Storeroom', x: 2, y: 1, z: 0, links: ['hall'] },
  ],
];

/**
 * Seeded multi-floor footprints (original layouts — not licensed mansion geometry).
 * Stairs link z-levels; secret cellars stay locked until revealed.
 */
const RUIN_LAYOUTS: InteriorRoomSpec[][] = [
  [
    { id: 'entry', label: 'Entry', x: 1, y: 2, z: 0, links: ['corridor'], entry: true },
    { id: 'corridor', label: 'Corridor', x: 1, y: 1, z: 0, links: ['entry', 'hall', 'side'] },
    { id: 'hall', label: 'Ruined hall', x: 1, y: 0, z: 0, links: ['corridor', 'chamber', 'stairs'] },
    { id: 'side', label: 'Side room', x: 0, y: 1, z: 0, links: ['corridor', 'store'] },
    { id: 'chamber', label: 'Chamber', x: 2, y: 0, z: 0, links: ['hall'] },
    { id: 'stairs', label: 'Stairs', x: 0, y: 0, z: 0, links: ['hall', 'cellar', 'landing'] },
    { id: 'store', label: 'Storeroom', x: 0, y: 2, z: 0, links: ['side'] },
    { id: 'cellar', label: 'Cellar', x: 0, y: 0, z: -1, links: ['stairs', 'vault'], isSecret: true },
    { id: 'vault', label: 'Vault', x: 1, y: 0, z: -1, links: ['cellar'], isSecret: true },
    { id: 'landing', label: 'Upper landing', x: 0, y: 0, z: 1, links: ['stairs', 'attic'] },
    { id: 'attic', label: 'Attic', x: 1, y: 0, z: 1, links: ['landing'] },
  ],
  [
    { id: 'entry', label: 'Entry', x: 0, y: 1, z: 0, links: ['ante', 'yard'], entry: true },
    { id: 'ante', label: 'Antechamber', x: 1, y: 1, z: 0, links: ['entry', 'hall', 'passage'] },
    { id: 'hall', label: 'Ruined hall', x: 2, y: 1, z: 0, links: ['ante', 'east', 'stairs'] },
    { id: 'passage', label: 'Passage', x: 1, y: 2, z: 0, links: ['ante', 'store'] },
    { id: 'east', label: 'Side chamber', x: 3, y: 1, z: 0, links: ['hall'] },
    { id: 'store', label: 'Storeroom', x: 1, y: 3, z: 0, links: ['passage'] },
    { id: 'stairs', label: 'Stairs', x: 2, y: 0, z: 0, links: ['hall', 'crypt', 'upper'] },
    { id: 'yard', label: 'Collapsed wing', x: 0, y: 0, z: 0, links: ['entry'], isSecret: true },
    { id: 'crypt', label: 'Crypt', x: 2, y: 0, z: -1, links: ['stairs', 'ossuary'] },
    { id: 'ossuary', label: 'Ossuary', x: 1, y: 0, z: -1, links: ['crypt'], isSecret: true },
    { id: 'upper', label: 'Upper hall', x: 2, y: 0, z: 1, links: ['stairs', 'gallery'] },
    { id: 'gallery', label: 'Gallery', x: 3, y: 0, z: 1, links: ['upper'] },
  ],
  [
    { id: 'entry', label: 'First chamber', x: 1, y: 1, z: 0, links: ['west', 'east', 'south'], entry: true },
    { id: 'west', label: 'Corridor', x: 0, y: 1, z: 0, links: ['entry', 'hall'] },
    { id: 'east', label: 'Side room', x: 2, y: 1, z: 0, links: ['entry', 'store'] },
    { id: 'south', label: 'Passage', x: 1, y: 2, z: 0, links: ['entry', 'stairs'] },
    { id: 'hall', label: 'Ruined hall', x: 0, y: 0, z: 0, links: ['west', 'chamber'] },
    { id: 'chamber', label: 'Chamber', x: 1, y: 0, z: 0, links: ['hall'] },
    { id: 'store', label: 'Storeroom', x: 3, y: 1, z: 0, links: ['east'] },
    { id: 'stairs', label: 'Stairs', x: 1, y: 3, z: 0, links: ['south', 'cellar', 'landing'] },
    { id: 'cellar', label: 'Cellar', x: 1, y: 1, z: -1, links: ['stairs'], isSecret: true },
    { id: 'landing', label: 'Upper landing', x: 1, y: 1, z: 1, links: ['stairs', 'loft'] },
    { id: 'loft', label: 'Loft', x: 2, y: 1, z: 1, links: ['landing'] },
  ],
];

/** Larger footprints for cathedrals / manors / circles — still original geometry. */
const GRAND_LAYOUTS: InteriorRoomSpec[][] = [
  [
    { id: 'entry', label: 'Narthex', x: 1, y: 2, z: 0, links: ['nave'], entry: true },
    { id: 'nave', label: 'Nave', x: 1, y: 1, z: 0, links: ['entry', 'aisle', 'choir', 'stairs'] },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1, z: 0, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1, y: 0, z: 0, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2, y: 0, z: 0, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2, y: 1, z: 0, links: ['nave', 'crypt', 'gallery'] },
    { id: 'crypt', label: 'Crypt', x: 2, y: 1, z: -1, links: ['stairs', 'reliquary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1, y: 1, z: -1, links: ['crypt'], isSecret: true },
    { id: 'gallery', label: 'Gallery', x: 2, y: 1, z: 1, links: ['stairs', 'belfry'] },
    { id: 'belfry', label: 'Belfry', x: 3, y: 1, z: 1, links: ['gallery'] },
  ],
  [
    { id: 'entry', label: 'Entry', x: 1, y: 2, z: 0, links: ['foyer'], entry: true },
    { id: 'foyer', label: 'Foyer', x: 1, y: 1, z: 0, links: ['entry', 'salon', 'stairs', 'study'] },
    { id: 'salon', label: 'Salon', x: 0, y: 1, z: 0, links: ['foyer', 'dining'] },
    { id: 'dining', label: 'Dining hall', x: 0, y: 0, z: 0, links: ['salon'] },
    { id: 'study', label: 'Study', x: 2, y: 1, z: 0, links: ['foyer'] },
    { id: 'stairs', label: 'Stairs', x: 1, y: 0, z: 0, links: ['foyer', 'cellar', 'landing'] },
    { id: 'cellar', label: 'Cellar', x: 1, y: 0, z: -1, links: ['stairs', 'wine'], isSecret: true },
    { id: 'wine', label: 'Wine cellar', x: 0, y: 0, z: -1, links: ['cellar'] },
    { id: 'landing', label: 'Upper landing', x: 1, y: 0, z: 1, links: ['stairs', 'bedroom', 'library'] },
    { id: 'bedroom', label: 'Bedroom', x: 0, y: 0, z: 1, links: ['landing'] },
    { id: 'library', label: 'Library', x: 2, y: 0, z: 1, links: ['landing'] },
  ],
];

function pickInteriorLayout(seed: string, place: string): InteriorRoomSpec[] {
  const rng = createHashRng(seed || 'interior', place || 'place', 'floor-plan');
  const scale = interiorBuildingScale(place);
  const pool =
    scale === 'shed' ? SHED_LAYOUTS : scale === 'grand' ? GRAND_LAYOUTS : RUIN_LAYOUTS;
  const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[idx]!.map((r) => ({ ...r, links: [...r.links], z: r.z }));
}

function applyHarvestedRoomNames(nodes: MapNode[], rooms: string[], building: string): MapNode[] {
  const extras = uniqueNames(
    rooms.map((r) => shortRoomLabel(r)).filter((r) => r.length > 0),
    (n) => usableInteriorRoom(n) || ROOM_PHRASE.test(n)
  );
  let next = nodes.map((n) => ({ ...n }));
  for (const label of extras) {
    if (next.some((n) => n.name.toLowerCase() === label.toLowerCase())) continue;
    const target =
      next.find(
        (n) =>
          !n.isSecret &&
          GENERIC_ROOM_LABELS.has(n.name.toLowerCase()) &&
          !(n.tags ?? []).includes('here') &&
          !(n.tags ?? []).includes('renamed')
      ) ??
      next.find((n) => !n.isSecret && GENERIC_ROOM_LABELS.has(n.name.toLowerCase()) && !(n.tags ?? []).includes('renamed'));
    if (target) {
      next = next.map((n) =>
        n.id === target.id
          ? {
              ...n,
              name: label,
              description: `${label}, inside ${building}.`,
              tags: Array.from(new Set([...(n.tags ?? []), 'renamed'])),
            }
          : n
      );
      continue;
    }
    // Unlock a secret room when story names it.
    const secret = next.find(
      (n) => n.isSecret && GENERIC_ROOM_LABELS.has(n.name.toLowerCase()) && !(n.tags ?? []).includes('renamed')
    );
    if (secret && label.toLowerCase().includes(secret.name.toLowerCase().slice(0, 4))) {
      next = unlockInteriorSecretOnNodes(next, secret.id).map((n) =>
        n.id === secret.id
          ? {
              ...n,
              name: label,
              description: `${label}, inside ${building}.`,
              tags: Array.from(new Set([...(n.tags ?? []), 'renamed', 'secret-unlocked'])),
            }
          : n
      );
    }
  }
  return next;
}

function unlockInteriorSecretOnNodes(nodes: MapNode[], secretId: string): MapNode[] {
  return nodes.map((n) => {
    let next = n;
    if (n.id === secretId) {
      next = {
        ...n,
        tags: Array.from(new Set([...(n.tags ?? []), 'secret-unlocked'])),
      };
    }
    const secrets = next.hidden?.secrets;
    if (!secrets?.length) return next;
    let changed = false;
    const updated = secrets.map((s) => {
      if (s.unlocksNodeId === secretId && !s.revealed) {
        changed = true;
        return { ...s, revealed: true };
      }
      return s;
    });
    if (!changed) return next;
    return {
      ...next,
      hidden: {
        traps: next.hidden?.traps ?? [],
        lootables: next.hidden?.lootables ?? [],
        secrets: updated,
        mobs: next.hidden?.mobs ?? [],
        looseItems: next.hidden?.looseItems,
      },
    };
  });
}

/** Mark a secret passage open (skill / story discovery). */
export function revealInteriorSecret(
  dungeon: ActiveDungeonState,
  secretNodeId: string
): ActiveDungeonState {
  if (!isInteriorMap(dungeon)) return dungeon;
  if (!dungeon.nodes.some((n) => n.id === secretNodeId && n.isSecret)) return dungeon;
  return {
    ...dungeon,
    nodes: unlockInteriorSecretOnNodes(dungeon.nodes, secretNodeId),
  };
}

/**
 * Code-authored indoor floor plan (full building outline).
 * Seeded multi-room graph — not hub-and-spoke harvest-only.
 */
export function buildInteriorFloorPlan(
  place: string,
  rooms: string[] = [],
  parentCoords?: Location3D,
  seed = 'interior'
): ActiveDungeonState {
  const rawHere = place.replace(/\s+/g, ' ').trim();
  const building = shortBuildingTitle(usableInteriorHere(rawHere) ? rawHere : 'Interior');
  const layout = pickInteriorLayout(seed, rawHere || building);
  const entry = layout.find((r) => r.entry) ?? layout[0]!;

  let nodes: MapNode[] = layout.map((spec) => {
    const tags = ['interior', 'authored'];
    if (spec.entry) tags.push('here', 'entry');
    if (spec.isSecret) tags.push('secret');
    const hidden = spec.isSecret
      ? undefined
      : {
          traps: [] as NodeHidden['traps'],
          lootables: [] as NodeHidden['lootables'],
          secrets: layout
            .filter((s) => s.isSecret && spec.links.includes(s.id))
            .map((s) => ({
              id: `${spec.id}_to_${s.id}`,
              clue: 'A sealed passage — find the catch or force it with the right skill.',
              revealed: false,
              unlocksNodeId: s.id,
            })),
          mobs: [] as NodeHidden['mobs'],
        };
    return {
      id: spec.id,
      name: spec.label,
      description: spec.entry
        ? `You are here: ${spec.label}.`
        : `${spec.label}, inside ${building}.`,
      connections: [...spec.links],
      coordinates: { x: spec.x, y: spec.y },
      zLevel: spec.z,
      tags,
      isSecret: !!spec.isSecret,
      hidden,
    };
  });

  nodes = applyHarvestedRoomNames(nodes, rooms, building);

  return {
    blueprintId: INTERIOR_MAP_BLUEPRINT,
    dungeonName: building,
    tier: 4,
    dangerTier: undefined,
    parentCoordinates: parentCoords,
    currentZLevel: entry.z,
    currentNodeId: entry.id,
    visitedNodeIds: [entry.id],
    clearedNodeIds: [],
    nodes,
  };
}

export function presentInteriorMap(
  dungeon: ActiveDungeonState,
  fallbackPlace?: string,
  seed = 'interior'
): ActiveDungeonState {
  if (!isInteriorMap(dungeon)) return dungeon;
  const fallbackRaw = (fallbackPlace ?? '').replace(/\s+/g, ' ').trim();
  const titleSource = usableInteriorHere(dungeon.dungeonName)
    ? dungeon.dungeonName
    : usableInteriorHere(fallbackRaw)
      ? fallbackRaw
      : 'Interior';
  const title = shortBuildingTitle(titleSource);

  if (needsAuthoredInteriorRebuild(dungeon, fallbackRaw || title)) {
    const harvested = dungeon.nodes
      .filter((n) => !GENERIC_ROOM_LABELS.has(n.name.toLowerCase()))
      .map((n) => n.name);
    const rebuilt = buildInteriorFloorPlan(fallbackRaw || title, harvested, dungeon.parentCoordinates, seed);
    const keepCurrent = rebuilt.nodes.some((n) => n.id === dungeon.currentNodeId)
      ? dungeon.currentNodeId
      : rebuilt.currentNodeId;
    const keepNode = rebuilt.nodes.find((n) => n.id === keepCurrent);
    return {
      ...rebuilt,
      visitedNodeIds: Array.from(
        new Set([rebuilt.currentNodeId, ...dungeon.visitedNodeIds.filter((id) => rebuilt.nodes.some((n) => n.id === id))])
      ),
      currentNodeId: keepCurrent,
      currentZLevel: keepNode?.zLevel ?? rebuilt.currentZLevel,
    };
  }

  const keep: MapNode[] = [];
  for (const n of dungeon.nodes) {
    const isHere = n.id === dungeon.currentNodeId || (n.tags ?? []).includes('entry');
    const label = shortRoomLabel(n.name, isHere ? 'Entry' : 'Chamber');
    const junk = isHere ? !usableInteriorHere(n.name) && label === 'Chamber' && n.name.length > MAX_ROOM_LABEL : false;
    if (junk && !isHere) continue;
    const essay = n.name.length > MAX_ROOM_LABEL || /\balone in\b|\boff the\b|\bsomewhere\b/i.test(n.name);
    keep.push({
      ...n,
      name: essay || (isHere && n.name === dungeon.dungeonName) ? label : shortRoomLabel(n.name, n.name),
      description: isHere ? `You are here: ${label}.` : n.description,
    });
  }
  if (keep.length === 0) {
    return buildInteriorFloorPlan(title, [], dungeon.parentCoordinates, seed);
  }
  const ids = new Set(keep.map((n) => n.id));
  const entryId = keep.find((n) => (n.tags ?? []).includes('entry'))?.id ?? keep[0]!.id;
  const currentId = ids.has(dungeon.currentNodeId) ? dungeon.currentNodeId : entryId;
  const currentKeep = keep.find((n) => n.id === currentId);
  return {
    ...dungeon,
    dungeonName: title,
    nodes: keep.map((n) => ({ ...n, connections: n.connections.filter((c) => ids.has(c)) })),
    visitedNodeIds: Array.from(
      new Set([...dungeon.visitedNodeIds.filter((id) => ids.has(id)), entryId])
    ),
    currentNodeId: currentId,
    currentZLevel: currentKeep?.zLevel ?? dungeon.currentZLevel,
  };
}

export function addRoomToInteriorMap(dungeon: ActiveDungeonState, room: string): ActiveDungeonState {
  dungeon = presentInteriorMap(dungeon);
  const name = shortRoomLabel(room.replace(/\s+/g, ' ').trim());
  if (!name || (!usableInteriorRoom(name) && !ROOM_PHRASE.test(name))) return dungeon;
  if (dungeon.nodes.some((n) => n.name.toLowerCase() === name.toLowerCase())) return dungeon;

  if (isAuthoredInterior(dungeon)) {
    const renamed = applyHarvestedRoomNames(dungeon.nodes, [name], dungeon.dungeonName);
    if (renamed.some((n, i) => n.name !== dungeon.nodes[i]?.name || n.tags?.join() !== dungeon.nodes[i]?.tags?.join())) {
      // Also unlock secrets when the harvested name matches a secret room label.
      let nodes = renamed;
      for (const n of nodes) {
        if (
          n.isSecret &&
          !isInteriorSecretUnlocked({ ...dungeon, nodes }, n.id) &&
          name.toLowerCase() === n.name.toLowerCase()
        ) {
          nodes = unlockInteriorSecretOnNodes(nodes, n.id);
        }
      }
      return { ...dungeon, nodes };
    }
  }

  if (dungeon.nodes.length >= 16) return dungeon;
  const id = `room_${dungeon.nodes.length}`;
  const here = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId) ?? dungeon.nodes[0];
  const z = here?.zLevel ?? dungeon.currentZLevel ?? 0;
  const slot = nextInteriorSlot(dungeon, z);
  const node: MapNode = {
    id,
    name,
    description: `${name}, inside ${dungeon.dungeonName}.`,
    connections: here ? [here.id] : [],
    coordinates: slot,
    zLevel: z,
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
    return (
      !!o &&
      n.id === o.id &&
      n.name === o.name &&
      !!n.isSecret === !!o.isSecret &&
      (n.zLevel ?? 0) === (o.zLevel ?? 0) &&
      (n.tags ?? []).join() === (o.tags ?? []).join()
    );
  });
}

/**
 * Street grid outdoors; full building outline indoors (RE-like fog of exploration).
 * Replaces a wrongly built local-area cathedral map on the next Map open.
 */
export function resolvePlayAreaMap(
  existing: ActiveDungeonState | null | undefined,
  place: string,
  landmarks: string[] = [],
  parentCoords?: Location3D,
  seed = 'interior'
): ActiveDungeonState | null {
  if (isExplorableDungeon(existing ?? null)) return existing ?? null;
  const here = (place ?? '').replace(/\s+/g, ' ').trim();
  let next: ActiveDungeonState | null = null;
  if (isInteriorPlace(here)) {
    const rooms = landmarks.filter((n) => n.toLowerCase() !== here.toLowerCase());
    if (existing && isInteriorMap(existing) && !needsAuthoredInteriorRebuild(existing, here)) {
      next = presentInteriorMap(existing, here, seed);
      for (const room of rooms) next = addRoomToInteriorMap(next, room);
    } else {
      next = buildInteriorFloorPlan(here, rooms, parentCoords ?? existing?.parentCoordinates, seed);
      if (existing && isInteriorMap(existing)) {
        const keepVisited = existing.visitedNodeIds.filter((id) => next!.nodes.some((n) => n.id === id));
        const keepCurrent = next.nodes.some((n) => n.id === existing.currentNodeId)
          ? existing.currentNodeId
          : next.currentNodeId;
        const keepNode = next.nodes.find((n) => n.id === keepCurrent);
        next = {
          ...next,
          currentNodeId: keepCurrent,
          currentZLevel: keepNode?.zLevel ?? next.currentZLevel,
          visitedNodeIds: Array.from(new Set([next.currentNodeId, ...keepVisited])),
        };
      }
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