import { describe, expect, it } from 'vitest';
import {
  buildInteriorFloorPlan,
  formatInteriorExitAuthority,
  interiorBuildingScale,
  interiorDoorAnchor,
  interiorExitNoun,
  interiorFloorLabel,
  interiorFootprintsAreVaried,
  interiorRoomFillKind,
  isInteriorSecretUnlocked,
  listInteriorZLevels,
  moveToNode,
  nodesOnInteriorFloor,
  resolveInteriorEdgeKind,
  resolvePlayAreaMap,
  revealInteriorSecret,
  roomHasVerticalLink,
  shortBuildingTitle,
  shortRoomLabel,
} from './mapEngine';
import { INTERIOR_MAP_BLUEPRINT } from './placeAuthority';

const ALONE_RUIN =
  'alone in a building with serious damage somewhere off the Valespire roads';

describe('interior floor plan (20q doors + varied footprints)', () => {
  it('uses short room labels — never the full location essay', () => {
    expect(shortRoomLabel(ALONE_RUIN)).toBe('Entry');
    expect(shortRoomLabel('Second Chamber of a half-collapsed ruin')).toMatch(/Second Chamber/i);
    expect(shortRoomLabel('Ruined hall')).toBe('Ruined hall');
    expect(shortBuildingTitle(ALONE_RUIN)).toMatch(/Valespire/i);
    expect(shortBuildingTitle(ALONE_RUIN).length).toBeLessThanOrEqual(44);
    expect(shortBuildingTitle(ALONE_RUIN)).not.toMatch(/alone in/i);
  });

  it('authors a multi-room building plan for alone-ruin places', () => {
    const map = resolvePlayAreaMap(null, ALONE_RUIN, [], undefined, 'test-seed-20n');
    expect(map?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    expect(map!.nodes.length).toBeGreaterThan(2);
    expect(map!.nodes.filter((n) => !n.isSecret).length).toBeGreaterThanOrEqual(5);
    expect(map!.dungeonName).not.toMatch(/alone in a building/i);
    expect(map!.nodes.every((n) => n.name.length <= 28)).toBe(true);
    expect(map!.nodes.some((n) => (n.tags ?? []).includes('authored'))).toBe(true);
  });

  it('authors multi-z floors for ruins; sheds stay single-floor', () => {
    expect(interiorBuildingScale(ALONE_RUIN)).toBe('ruin');
    expect(interiorBuildingScale('a weathered shed by the gate')).toBe('shed');
    expect(interiorBuildingScale('Sevenfold Circle cathedral')).toBe('grand');

    const ruin = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'multi-z-ruin');
    const zs = listInteriorZLevels(ruin);
    expect(zs.length).toBeGreaterThanOrEqual(2);
    expect(zs).toContain(0);
    expect(interiorFloorLabel(-1)).toBe('B1');
    expect(interiorFloorLabel(0)).toBe('1F');
    expect(interiorFloorLabel(1)).toBe('2F');

    const stair = ruin.nodes.find((n) => roomHasVerticalLink(ruin, n));
    expect(stair).toBeTruthy();
    expect(stair!.connections.some((id) => {
      const t = ruin.nodes.find((n) => n.id === id);
      return t && (t.zLevel ?? 0) !== (stair!.zLevel ?? 0);
    })).toBe(true);

    const shed = buildInteriorFloorPlan('a weathered shed by the gate', [], undefined, 'shed-seed');
    expect(listInteriorZLevels(shed)).toEqual([0]);
    expect(shed.nodes.every((n) => (n.zLevel ?? 0) === 0)).toBe(true);
  });

  it('filters rooms by floor and preserves visited fog per floor', () => {
    const map = buildInteriorFloorPlan(ALONE_RUIN, ['Second Chamber'], undefined, 'floor-filter');
    const zs = listInteriorZLevels(map);
    expect(zs.length).toBeGreaterThanOrEqual(2);

    for (const z of zs) {
      const onFloor = nodesOnInteriorFloor(map, z);
      expect(onFloor.length).toBeGreaterThan(0);
      expect(onFloor.every((n) => (n.zLevel ?? 0) === z)).toBe(true);
    }

    const ground = nodesOnInteriorFloor(map, 0);
    const entry = ground.find((n) => (n.tags ?? []).includes('entry'))!;
    expect(interiorRoomFillKind(map, entry)).toBe('visited');
    const otherGround = ground.find((n) => n.id !== entry.id && !n.isSecret);
    if (otherGround) {
      expect(interiorRoomFillKind(map, otherGround)).toBe('unvisited');
    }

    const upperZ = zs.find((z) => z > 0);
    if (upperZ != null) {
      const upper = nodesOnInteriorFloor(map, upperZ);
      expect(upper.every((n) => interiorRoomFillKind(map, n) !== 'visited' || n.id === entry.id)).toBe(
        true
      );
    }
  });

  it('distinguishes visited vs unvisited fill; secrets stay locked until revealed', () => {
    const map = buildInteriorFloorPlan(ALONE_RUIN, ['Second Chamber'], undefined, 'fill-seed');
    const entry = map.nodes.find((n) => (n.tags ?? []).includes('entry'))!;
    const other = map.nodes.find((n) => n.id !== entry.id && !n.isSecret)!;
    expect(interiorRoomFillKind(map, entry)).toBe('visited');
    expect(interiorRoomFillKind(map, other)).toBe('unvisited');

    const secret = map.nodes.find((n) => n.isSecret);
    expect(secret).toBeTruthy();
    expect(interiorRoomFillKind(map, secret!)).toBe('secret');
    expect(isInteriorSecretUnlocked(map, secret!.id)).toBe(false);

    const from = map.nodes.find((n) => n.connections.includes(secret!.id));
    expect(from).toBeTruthy();
    const blocked = moveToNode({ ...map, currentNodeId: from!.id }, secret!.id);
    expect(blocked.currentNodeId).toBe(from!.id);

    const opened = revealInteriorSecret(map, secret!.id);
    expect(isInteriorSecretUnlocked(opened, secret!.id)).toBe(true);
    expect(interiorRoomFillKind(opened, secret!)).toBe('unvisited');
    const entered = moveToNode({ ...opened, currentNodeId: from!.id }, secret!.id);
    expect(entered.currentNodeId).toBe(secret!.id);
    expect(entered.currentZLevel).toBe(secret!.zLevel ?? 0);
    expect(interiorRoomFillKind(entered, entered.nodes.find((n) => n.id === secret!.id)!)).toBe(
      'visited'
    );
  });

  it('moves across floors via stairs and updates currentZLevel', () => {
    const map = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'stair-seed');
    const stair = map.nodes.find((n) => /stairs/i.test(n.name) && roomHasVerticalLink(map, n));
    expect(stair).toBeTruthy();
    const otherFloor = stair!.connections
      .map((id) => map.nodes.find((n) => n.id === id))
      .find((n) => n && (n.zLevel ?? 0) !== (stair!.zLevel ?? 0) && !n.isSecret);
    expect(otherFloor).toBeTruthy();

    let at = { ...map, currentNodeId: stair!.id, currentZLevel: stair!.zLevel ?? 0 };
    at = {
      ...at,
      visitedNodeIds: Array.from(new Set([...at.visitedNodeIds, stair!.id])),
    };
    const moved = moveToNode(at, otherFloor!.id);
    expect(moved.currentNodeId).toBe(otherFloor!.id);
    expect(moved.currentZLevel).toBe(otherFloor!.zLevel ?? 0);
  });

  it('harvests story room names onto the authored graph without collapsing to 2 nodes', () => {
    const map = resolvePlayAreaMap(null, ALONE_RUIN, ['Second Chamber'], undefined, 'harvest-seed');
    expect(map!.nodes.length).toBeGreaterThan(2);
    expect(map!.nodes.some((n) => /Second Chamber/i.test(n.name))).toBe(true);
  });

  it('marks normal links as doors; secret/damaged edges stay distinct', () => {
    const map = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'door-edge-seed');
    const entry = map.nodes.find((n) => (n.tags ?? []).includes('entry'))!;
    const first = entry.connections
      .map((id) => map.nodes.find((n) => n.id === id)!)
      .find((n) => (n.zLevel ?? 0) === (entry.zLevel ?? 0) && !n.isSecret)!;
    expect(resolveInteriorEdgeKind(entry, first)).toBe('door');
    expect(interiorExitNoun('door')).toBe('doorway');
    expect(interiorExitNoun('damaged')).toMatch(/gap/i);
    expect(interiorExitNoun('secret')).toMatch(/sealed/i);

    const secret = map.nodes.find((n) => n.isSecret)!;
    const from = map.nodes.find((n) => n.connections.includes(secret.id))!;
    expect(resolveInteriorEdgeKind(from, secret)).toBe('secret');

    const auth = formatInteriorExitAuthority(map);
    expect(auth).toMatch(/doorway→/i);
    const exitList = auth.split('.')[0] ?? '';
    expect(exitList).not.toMatch(/crack|broken gap/i);
    expect(auth).toMatch(/Prefer door/i);

    const a = { x: 0, y: 0, w: 100, h: 80 };
    const b = { x: 110, y: 10, w: 90, h: 70 };
    const anchor = interiorDoorAnchor(a, b);
    expect(anchor.orient).toBe('v');
    expect(anchor.x).toBeGreaterThan(90);
    expect(anchor.x).toBeLessThan(120);
  });

  it('authors non-uniform room footprints (not equal stamp squares)', () => {
    const map = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'footprint-seed');
    expect(interiorFootprintsAreVaried(map.nodes)).toBe(true);
    const sizes = map.nodes.map((n) => `${n.footprint!.w}x${n.footprint!.h}`);
    expect(new Set(sizes).size).toBeGreaterThan(1);
    const corridor = map.nodes.find((n) => /corridor|passage|aisle/i.test(n.name));
    if (corridor?.footprint) {
      expect(Math.min(corridor.footprint.w, corridor.footprint.h)).toBeLessThan(0.8);
    }
    const hall = map.nodes.find((n) => /hall|nave|foyer|chamber/i.test(n.name) && !/side/i.test(n.name));
    if (hall?.footprint && corridor?.footprint) {
      expect(hall.footprint.w * hall.footprint.h).toBeGreaterThan(
        corridor.footprint.w * corridor.footprint.h
      );
    }
  });
});
