import { describe, expect, it } from 'vitest';
import {
  buildInteriorFloorPlan,
  interiorRoomFillKind,
  isInteriorSecretUnlocked,
  moveToNode,
  resolvePlayAreaMap,
  revealInteriorSecret,
  shortBuildingTitle,
  shortRoomLabel,
} from './mapEngine';
import { INTERIOR_MAP_BLUEPRINT } from './placeAuthority';

const ALONE_RUIN =
  'alone in a building with serious damage somewhere off the Valespire roads';

describe('interior floor plan (20n RE-like)', () => {
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
    expect(interiorRoomFillKind(entered, entered.nodes.find((n) => n.id === secret!.id)!)).toBe(
      'visited'
    );
  });

  it('harvests story room names onto the authored graph without collapsing to 2 nodes', () => {
    const map = resolvePlayAreaMap(null, ALONE_RUIN, ['Second Chamber'], undefined, 'harvest-seed');
    expect(map!.nodes.length).toBeGreaterThan(2);
    expect(map!.nodes.some((n) => /Second Chamber/i.test(n.name))).toBe(true);
  });
});
