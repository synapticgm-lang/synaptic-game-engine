import { describe, expect, it } from 'vitest';
import { buildInteriorFloorPlan, interiorFloorName, listInteriorZLevels, type MapNode } from './mapEngine';
import { floorPlanIssues } from './floorPlan';
import { generateInterior } from './interiorGenerator';
import { isInteriorPlace } from './placeAuthority';
import { vesselTemplateFor } from './placeTemplates';

type Box = { x: number; y: number; w: number; h: number };
const r2 = (n: number) => Math.round(n * 100) / 100;
const boxOf = (n: MapNode): Box => ({ x: n.coordinates!.x, y: n.coordinates!.y, w: n.footprint!.w, h: n.footprint!.h });
/** Outline: which cells of a shared 0.05-unit grid have a room over their centre. */
function outline(nodes: MapNode[], all: MapNode[]): string {
  const bs = all.map(boxOf);
  const x1 = Math.max(...bs.map((b) => b.x + b.w));
  const y1 = Math.max(...bs.map((b) => b.y + b.h));
  const own = nodes.map(boxOf);
  let s = '';
  for (let y = 0.025; y < y1; y += 0.05) {
    for (let x = 0.025; x < x1; x += 0.05) s += own.some((b) => x > b.x - 0.01 && x < b.x + b.w + 0.01 && y > b.y - 0.01 && y < b.y + b.h + 0.01) ? '#' : '.';
    s += '\n';
  }
  return s;
}
const same = (a: Box, b: Box) => [a.x - b.x, a.y - b.y, a.w - b.w, a.h - b.h].every((d) => Math.abs(d) < 0.03);

function checkStack(nodes: MapNode[], label: string) {
  const zs = [...new Set(nodes.map((n) => n.zLevel ?? 0))];
  const ref = outline(nodes.filter((n) => (n.zLevel ?? 0) === zs[0]), nodes);
  for (const z of zs) expect(outline(nodes.filter((n) => (n.zLevel ?? 0) === z), nodes) === ref, `${label} footprint z=${z}`).toBe(true);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let climbs = 0;
  for (const n of nodes) {
    for (const id of n.connections) {
      const t = byId.get(id);
      if (!t || (t.zLevel ?? 0) === (n.zLevel ?? 0)) continue;
      climbs++;
      expect(same(boxOf(n), boxOf(t)), `${label} stair ${n.name}→${t.name}`).toBe(true);
    }
  }
  if (zs.length > 1) expect(climbs, `${label} has stairs`).toBeGreaterThan(0);
}

describe('one footprint per building, stairs line up', () => {
  it('multi-floor buildings: identical outline on every floor and aligned stairs, across seeds', () => {
    for (const place of ['the cathedral nave', 'an old manor house', 'Yarrowholt Circle', 'a farmhouse', 'a narrow shop', 'the watchtower']) {
      for (let i = 0; i < 10; i++) {
        const plan = buildInteriorFloorPlan(place, [], undefined, `align-${place}-${i}`);
        checkStack(plan.nodes, `${place} #${i}`);
        expect(floorPlanIssues(plan, { building: true, minRooms: 1 }), `${place} #${i}`).toEqual([]);
      }
    }
  });

  it('a 3-floor grand building (B1 / 1F / 2F) shares one outline', () => {
    const plan = buildInteriorFloorPlan('Yarrowholt Circle', [], undefined, 'seed-yarrow');
    expect(listInteriorZLevels(plan)).toEqual([-1, 0, 1]);
    checkStack(plan.nodes, 'yarrow');
  });

  it('deterministic per seed', () => {
    const a = buildInteriorFloorPlan('the cathedral nave', [], undefined, 's1');
    const b = buildInteriorFloorPlan('the cathedral nave', [], undefined, 's1');
    expect(JSON.stringify(a.nodes)).toBe(JSON.stringify(b.nodes));
  });

  it('generated building / vehicle stacks reuse one template per floor', () => {
    for (let i = 0; i < 8; i++) {
      const g = generateInterior({ seed: `g${i}`, key: 'a house', kind: 'building', floors: 3 });
      expect(new Set(g.templateIds).size, `#${i}`).toBe(1);
      checkStack(g.nodes, `gen #${i}`);
    }
  });
});

describe('ships: hull footprint with named decks joined by aligned ladders', () => {
  it('detects ships from the vehicle templates and treats them as interiors', () => {
    expect(vesselTemplateFor('the Valespire grain-ship')?.id).toBe('veh-boat-cargo');
    expect(vesselTemplateFor('a navy frigate')?.id).toBe('veh-ship-warship');
    expect(vesselTemplateFor('the galleon Saint Ysolde')?.id).toBe('veh-ship-galleon');
    expect(vesselTemplateFor('a sloop')?.id).toBe('veh-ship-sloop');
    expect(vesselTemplateFor('a covered wagon')).toBeNull();
    expect(isInteriorPlace('aboard the Valespire grain-ship')).toBe(true);
  });

  it.each([
    ['a sloop', ['Hold', 'Main deck']],
    ['the merchant ship Valespire', ['Hold', 'Lower deck', 'Main deck']],
    ['a navy frigate', ['Hold', 'Gun deck', 'Main deck']],
    ['the galleon Saint Ysolde', ['Hold', 'Lower gun deck', 'Upper gun deck', 'Main deck']],
  ])('%s: deck names, one hull, aligned hatches, a clean plan', (place, decks) => {
    for (let i = 0; i < 6; i++) {
      const plan = buildInteriorFloorPlan(place, [], undefined, `ship-${i}`);
      const zs = listInteriorZLevels(plan);
      expect(zs.map((z) => interiorFloorName(plan, z))).toEqual(decks);
      expect(plan.nodes.find((n) => n.id === plan.currentNodeId)?.name).toBe('Main deck');
      checkStack(plan.nodes, `${place} #${i}`);
      expect(floorPlanIssues(plan, { building: true, minRooms: 1 })).toEqual([]);
    }
  });
});
