import { describe, expect, it } from 'vitest';
import { listInteriorZLevels, resolvePlayAreaMap, type ActiveDungeonState, type MapNode } from './mapEngine';
import { isInteriorMap, isStreetMap, placeScale } from './placeAuthority';
import { harvestCameraIntoSceneFacts } from './travelAuthority';
import { emptySceneFacts } from './sceneFacts';
import { fitViewport, panViewport, roomSymbols, zoomViewportAt } from './mapView';

const BATHHOUSE = 'a ruined bathhouse off the Valespire roads';
const ROAD = 'the Valespire road';

describe('29z9j map kind comes from the place, not the prose', () => {
  it('a bathhouse is indoor and draws its floor plan', () => {
    expect(placeScale(BATHHOUSE)).toBe('indoor');
    const m = resolvePlayAreaMap(null, BATHHOUSE, [], undefined, 's1')!;
    expect(isInteriorMap(m)).toBe(true);
    expect(isStreetMap(m)).toBe(false);
  });

  it('a road is outdoor and draws the local area map', () => {
    expect(placeScale(ROAD)).toBe('outdoor');
    const m = resolvePlayAreaMap(null, ROAD, [], undefined, 's1')!;
    expect(isStreetMap(m)).toBe(true);
  });

  it('indoor words in road prose do not move the camera inside', () => {
    const facts = harvestCameraIntoSceneFacts(emptySceneFacts(3), 'Rain drips through the hall of the old ceiling beams nearby.', 3, 'Look around', ROAD);
    expect(facts.cameraLock?.scale).toBe('outdoor');
  });

  it('outdoor words in bathhouse prose do not move the camera outside', () => {
    const facts = harvestCameraIntoSceneFacts(emptySceneFacts(3), 'A seam runs through the cracked street outside the window.', 3, 'Look around', BATHHOUSE);
    expect(facts.cameraLock?.scale).toBe('indoor');
  });

  it('a roofless ruin keeps one floor', () => {
    const m = resolvePlayAreaMap(null, 'a roofless ruined manor', [], undefined, 's1')!;
    expect(isInteriorMap(m)).toBe(true);
    expect(listInteriorZLevels(m)).toEqual([0]);
  });
});

function node(id: string, over: Partial<MapNode> = {}): MapNode {
  return { id, name: id, description: '', connections: [], ...over };
}

function dungeon(nodes: MapNode[], visited: string[]): ActiveDungeonState {
  return { nodes, visitedNodeIds: visited, currentNodeId: nodes[0]!.id, currentZLevel: 0, clearedNodeIds: [] } as unknown as ActiveDungeonState;
}

describe('29z9j map symbols are only what the engine tracks', () => {
  const hall = node('Hall', { connections: ['Loft'] });
  const loft = node('Loft', { zLevel: 1, connections: ['Hall'] });
  const cellar = node('Cellar', {
    hidden: { traps: [{ id: 't', dc: 12, skillHint: 'perception', revealed: true, disarmed: false }], lootables: [], secrets: [], mobs: [] },
  });
  const crypt = node('Crypt', {
    hidden: { traps: [{ id: 't', dc: 12, skillHint: 'perception', revealed: false, disarmed: false }], lootables: [], secrets: [], mobs: [] },
  });

  it('your room shows you, the people the ledger puts with you, and stairs', () => {
    const d = dungeon([hall, loft, cellar, crypt], ['Hall', 'Cellar', 'Crypt']);
    const s = roomSymbols(d, hall, { currentNodeId: 'Hall', peopleHereCount: 2 });
    expect(s).toEqual(expect.arrayContaining(['here', 'stairs', 'person']));
    expect(s).not.toContain('danger');
  });

  it('people are never drawn in rooms the ledger has no one in', () => {
    const d = dungeon([hall, loft, cellar], ['Hall', 'Cellar']);
    expect(roomSymbols(d, cellar, { currentNodeId: 'Hall', peopleHereCount: 2 })).not.toContain('person');
    expect(roomSymbols(d, hall, { currentNodeId: 'Hall', peopleHereCount: 0 })).not.toContain('person');
  });

  it('danger only for a known live trap or foe, never an unseen one', () => {
    const d = dungeon([hall, cellar, crypt], ['Hall', 'Cellar', 'Crypt']);
    expect(roomSymbols(d, cellar, { currentNodeId: 'Hall' })).toContain('danger');
    expect(roomSymbols(d, crypt, { currentNodeId: 'Hall' })).not.toContain('danger');
    const unvisited = dungeon([hall, cellar], ['Hall']);
    expect(roomSymbols(unvisited, cellar, { currentNodeId: 'Hall' })).not.toContain('danger');
    expect(roomSymbols(d, hall, { currentNodeId: 'Hall', liveFight: true })).toContain('danger');
  });

  it('quest symbol sits on the main pin place', () => {
    const tower = node('Collapsed Mage Tower');
    const d = dungeon([hall, tower], ['Hall']);
    expect(roomSymbols(d, tower, { currentNodeId: 'Hall', questPlace: 'Collapsed Mage Tower' })).toContain('quest');
    expect(roomSymbols(d, hall, { currentNodeId: 'Hall', questPlace: 'Collapsed Mage Tower' })).not.toContain('quest');
  });
});

describe('29z9j pan and zoom', () => {
  it('fit centres the floor inside the frame', () => {
    const v = fitViewport(800, 400, 600, 400);
    expect(v.scale).toBeCloseTo((600 - 32) / 800);
    expect(v.x + 800 * v.scale / 2).toBeCloseTo(300);
    expect(v.y + 400 * v.scale / 2).toBeCloseTo(200);
  });

  it('zoom keeps the point under the cursor still', () => {
    const v = { scale: 1, x: 10, y: 20 };
    const z = zoomViewportAt(v, 2, 110, 120);
    expect((110 - z.x) / z.scale).toBeCloseTo((110 - v.x) / v.scale);
    expect((120 - z.y) / z.scale).toBeCloseTo((120 - v.y) / v.scale);
  });

  it('zoom is clamped and drag moves the view', () => {
    expect(zoomViewportAt({ scale: 1, x: 0, y: 0 }, 100, 0, 0).scale).toBe(3);
    expect(panViewport({ scale: 1, x: 0, y: 0 }, 5, -7)).toEqual({ scale: 1, x: 5, y: -7 });
  });
});
