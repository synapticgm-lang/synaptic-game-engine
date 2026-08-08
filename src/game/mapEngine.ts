import type { Location3D, MapTier } from './types';

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
  tier: MapTier;
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
        tags: ['spoke'],
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

      nodes.push({
        id,
        name: `${name} - Hex ${i + 1}`,
        description: `Navigable hex sector ${i + 1} of ${name}.`,
        connections,
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
    parentCoordinates: parentCoords,
    currentZLevel: initialZ,
    currentNodeId: startNodeId,
    visitedNodeIds: [startNodeId],
    clearedNodeIds: [],
    nodes: blueprint.nodes,
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