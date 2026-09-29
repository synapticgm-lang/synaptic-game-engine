/**
 * 29z3 — floor-plan geometry for building interiors (RE-style house plans) and the plan check.
 * Rooms share walls, doors sit on shared walls, the entry has a door to the outside, floors join
 * by stairs. Layout coordinates come from the existing templates; this only closes the gaps
 * between them and reports plans that would draw as floating boxes or a blank rectangle.
 */

import type { ActiveDungeonState, MapNode } from './mapEngine';

export type PlanBox = { x: number; y: number; w: number; h: number };
export type PlanRoom = PlanBox & { id: string; z: number };
export type WallSide = 'top' | 'bottom' | 'left' | 'right';
export type WallSegment = { roomId: string; side: WallSide; x1: number; y1: number; x2: number; y2: number };

const EPS = 0.02;
/** Shortest run two rooms must share to count as one wall (a door fits). */
const MIN_SHARED = 0.2;
/** Gaps up to this wide between facing rooms are template slack, not a corridor. */
const MAX_PACK_GAP = 0.5;

function span(a0: number, a1: number, b0: number, b1: number): number {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

function boxesOverlap(a: PlanBox, b: PlanBox): boolean {
  return span(a.x, a.x + a.w, b.x, b.x + b.w) > EPS && span(a.y, a.y + a.h, b.y, b.y + b.h) > EPS;
}

/** Where two rooms meet on one wall, or null when they don't touch along a door-wide run. */
export function sharedWall(a: PlanBox, b: PlanBox, tol = EPS): WallSegment | null {
  const yRun = span(a.y, a.y + a.h, b.y, b.y + b.h);
  if (yRun >= MIN_SHARED) {
    const y1 = Math.max(a.y, b.y);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    if (Math.abs(a.x + a.w - b.x) <= tol) return { roomId: '', side: 'right', x1: a.x + a.w, y1, x2: a.x + a.w, y2 };
    if (Math.abs(b.x + b.w - a.x) <= tol) return { roomId: '', side: 'left', x1: a.x, y1, x2: a.x, y2 };
  }
  const xRun = span(a.x, a.x + a.w, b.x, b.x + b.w);
  if (xRun >= MIN_SHARED) {
    const x1 = Math.max(a.x, b.x);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    if (Math.abs(a.y + a.h - b.y) <= tol) return { roomId: '', side: 'bottom', x1, y1: a.y + a.h, x2, y2: a.y + a.h };
    if (Math.abs(b.y + b.h - a.y) <= tol) return { roomId: '', side: 'top', x1, y1: a.y, x2, y2: a.y };
  }
  return null;
}

/** True when the two rooms face each other across a small gap (or already touch). */
export function nearWall(a: PlanBox, b: PlanBox, maxGap = MAX_PACK_GAP): boolean {
  return !!facingGap(a, b, maxGap) || !!sharedWall(a, b);
}

type Facing = { axis: 'x' | 'y'; gap: number; aFirst: boolean };

function facingGap(a: PlanBox, b: PlanBox, maxGap = MAX_PACK_GAP): Facing | null {
  if (span(a.y, a.y + a.h, b.y, b.y + b.h) >= MIN_SHARED) {
    const ab = b.x - (a.x + a.w);
    const ba = a.x - (b.x + b.w);
    if (ab > EPS && ab <= maxGap) return { axis: 'x', gap: ab, aFirst: true };
    if (ba > EPS && ba <= maxGap) return { axis: 'x', gap: ba, aFirst: false };
  }
  if (span(a.x, a.x + a.w, b.x, b.x + b.w) >= MIN_SHARED) {
    const ab = b.y - (a.y + a.h);
    const ba = a.y - (b.y + b.h);
    if (ab > EPS && ab <= maxGap) return { axis: 'y', gap: ab, aFirst: true };
    if (ba > EPS && ba <= maxGap) return { axis: 'y', gap: ba, aFirst: false };
  }
  return null;
}

/** Grow `box` toward its neighbour by `by` along the facing axis. */
function grown(box: PlanBox, f: Facing, towardFar: boolean, by: number): PlanBox {
  if (f.axis === 'x') return towardFar ? { ...box, w: box.w + by } : { ...box, x: box.x - by, w: box.w + by };
  return towardFar ? { ...box, h: box.h + by } : { ...box, y: box.y - by, h: box.h + by };
}

/**
 * Close template slack between facing rooms on the same floor so they share one wall.
 * Linked rooms go first; a grow that would overlap a third room is skipped.
 */
export function packFloorRooms<T extends PlanRoom>(rooms: T[], links: Array<[string, string]> = []): T[] {
  const out = rooms.map((r) => ({ ...r }));
  const linked = new Set(links.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      if (out[i]!.z === out[j]!.z) pairs.push([i, j]);
    }
  }
  pairs.sort(([a1, b1], [a2, b2]) => {
    const l1 = linked.has(`${out[a1]!.id}|${out[b1]!.id}`) ? 0 : 1;
    const l2 = linked.has(`${out[a2]!.id}|${out[b2]!.id}`) ? 0 : 1;
    return l1 - l2;
  });
  const clear = (box: PlanBox, skip: number[], z: number) =>
    out.every((r, k) => skip.includes(k) || r.z !== z || !boxesOverlap(box, r));
  for (let pass = 0; pass < 3; pass++) {
    for (const [i, j] of pairs) {
      const a = out[i]!;
      const b = out[j]!;
      const f = facingGap(a, b);
      if (!f) continue;
      const half = f.gap / 2;
      const aHalf = grown(a, f, f.aFirst, half);
      const bHalf = grown(b, f, !f.aFirst, half);
      if (clear(aHalf, [i, j], a.z) && clear(bHalf, [i, j], a.z)) {
        Object.assign(a, aHalf);
        Object.assign(b, bHalf);
        continue;
      }
      const aFull = grown(a, f, f.aFirst, f.gap);
      if (clear(aFull, [i, j], a.z)) {
        Object.assign(a, aFull);
        continue;
      }
      const bFull = grown(b, f, !f.aFirst, f.gap);
      if (clear(bFull, [i, j], a.z)) Object.assign(b, bFull);
    }
  }
  return out.map((r) => ({ ...r, x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h) }));
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Put a new room against a free wall of `host` (never floating beside it). */
export function attachBeside(host: PlanRoom, size: { w: number; h: number }, others: PlanRoom[]): PlanBox {
  const tries: PlanBox[] = [
    { x: host.x + host.w, y: host.y, w: size.w, h: size.h },
    { x: host.x - size.w, y: host.y, w: size.w, h: size.h },
    { x: host.x, y: host.y + host.h, w: size.w, h: size.h },
    { x: host.x, y: host.y - size.h, w: size.w, h: size.h },
  ];
  const sameFloor = others.filter((o) => o.z === host.z && o.id !== host.id);
  return tries.find((t) => sameFloor.every((o) => !boxesOverlap(t, o))) ?? tries[0]!;
}

export function planRoomOf(node: MapNode): PlanRoom {
  return {
    id: node.id,
    z: node.zLevel ?? 0,
    x: node.coordinates?.x ?? 0,
    y: node.coordinates?.y ?? 0,
    w: node.footprint?.w ?? 1,
    h: node.footprint?.h ?? 1,
  };
}

function sideRun(r: PlanBox, side: WallSide): { fixed: number; from: number; to: number; vertical: boolean } {
  if (side === 'left') return { fixed: r.x, from: r.y, to: r.y + r.h, vertical: true };
  if (side === 'right') return { fixed: r.x + r.w, from: r.y, to: r.y + r.h, vertical: true };
  if (side === 'top') return { fixed: r.y, from: r.x, to: r.x + r.w, vertical: false };
  return { fixed: r.y + r.h, from: r.x, to: r.x + r.w, vertical: false };
}

/** Wall runs of each room that face outside (not shared with another room on the floor). */
export function exteriorWalls(rooms: PlanRoom[]): WallSegment[] {
  const out: WallSegment[] = [];
  const sides: WallSide[] = ['top', 'bottom', 'left', 'right'];
  for (const r of rooms) {
    for (const side of sides) {
      const run = sideRun(r, side);
      let free: Array<[number, number]> = [[run.from, run.to]];
      for (const o of rooms) {
        if (o.id === r.id) continue;
        const wall = sharedWall(r, o);
        if (!wall || wall.side !== side) continue;
        const cut: [number, number] = run.vertical ? [wall.y1, wall.y2] : [wall.x1, wall.x2];
        free = free.flatMap(([s, e]) => {
          const parts: Array<[number, number]> = [];
          if (cut[0] > s + EPS) parts.push([s, Math.min(e, cut[0])]);
          if (cut[1] < e - EPS) parts.push([Math.max(s, cut[1]), e]);
          return cut[1] <= s || cut[0] >= e ? [[s, e] as [number, number]] : parts;
        });
      }
      for (const [s, e] of free) {
        if (e - s < MIN_SHARED) continue;
        out.push(
          run.vertical
            ? { roomId: r.id, side, x1: run.fixed, y1: s, x2: run.fixed, y2: e }
            : { roomId: r.id, side, x1: s, y1: run.fixed, x2: e, y2: run.fixed }
        );
      }
    }
  }
  return out;
}

function segLen(s: WallSegment): number {
  return Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
}

export function planEntryId(map: ActiveDungeonState): string | undefined {
  const tagged = map.nodes.find((n) => {
    const t = n.tags ?? [];
    return t.includes('entry') || t.includes('role:entry');
  });
  return tagged?.id ?? map.nodes.find((n) => n.id === 'r0')?.id ?? map.nodes[0]?.id;
}

/** The door from the entry room to the outside: front (bottom) wall first, else its longest outside wall. */
export function exteriorDoor(map: ActiveDungeonState): (WallSegment & { cx: number; cy: number }) | null {
  const entryId = planEntryId(map);
  const entry = map.nodes.find((n) => n.id === entryId);
  if (!entry) return null;
  const z = entry.zLevel ?? 0;
  const rooms = map.nodes.filter((n) => (n.zLevel ?? 0) === z).map(planRoomOf);
  const walls = exteriorWalls(rooms).filter((w) => w.roomId === entry.id);
  if (!walls.length) return null;
  const pick = walls.filter((w) => w.side === 'bottom').sort((a, b) => segLen(b) - segLen(a))[0]
    ?? [...walls].sort((a, b) => segLen(b) - segLen(a))[0]!;
  return { ...pick, cx: (pick.x1 + pick.x2) / 2, cy: (pick.y1 + pick.y2) / 2 };
}

/** One window per above-ground room on its longest outside wall (not the entry's door wall). */
export function windowMarks(map: ActiveDungeonState, z: number): Array<WallSegment & { cx: number; cy: number }> {
  if (z < 0) return [];
  const rooms = map.nodes.filter((n) => (n.zLevel ?? 0) === z && !n.isSecret).map(planRoomOf);
  const door = exteriorDoor(map);
  const out: Array<WallSegment & { cx: number; cy: number }> = [];
  for (const r of rooms) {
    const walls = exteriorWalls(rooms)
      .filter((w) => w.roomId === r.id && segLen(w) >= 0.6)
      .filter((w) => !(door && door.roomId === r.id && door.side === w.side && door.x1 === w.x1 && door.y1 === w.y1))
      .sort((a, b) => segLen(b) - segLen(a));
    const w = walls[0];
    if (w) out.push({ ...w, cx: (w.x1 + w.x2) / 2, cy: (w.y1 + w.y2) / 2 });
  }
  return out;
}

function levelLabel(z: number): string {
  return z < 0 ? `B${Math.abs(z)}` : `${z + 1}F`;
}

/** Enclosed empty area (units²) inside a floor: a hole the walls wrap around. */
function enclosedVoid(rooms: PlanRoom[]): number {
  if (rooms.length < 3) return 0;
  const step = 0.1;
  const x0 = Math.min(...rooms.map((r) => r.x));
  const y0 = Math.min(...rooms.map((r) => r.y));
  const cols = Math.ceil((Math.max(...rooms.map((r) => r.x + r.w)) - x0) / step);
  const rows = Math.ceil((Math.max(...rooms.map((r) => r.y + r.h)) - y0) / step);
  if (cols <= 0 || rows <= 0 || cols * rows > 40000) return 0;
  const filled = (c: number, r: number) => {
    const px = x0 + (c + 0.5) * step;
    const py = y0 + (r + 0.5) * step;
    return rooms.some((b) => px > b.x && px < b.x + b.w && py > b.y && py < b.y + b.h);
  };
  const outside = new Uint8Array(cols * rows);
  const queue: number[] = [];
  for (let c = 0; c < cols; c++) {
    for (const r of [0, rows - 1]) if (!filled(c, r)) queue.push(r * cols + c);
  }
  for (let r = 0; r < rows; r++) {
    for (const c of [0, cols - 1]) if (!filled(c, r)) queue.push(r * cols + c);
  }
  for (const i of queue) outside[i] = 1;
  while (queue.length) {
    const i = queue.pop()!;
    const c = i % cols;
    const r = Math.floor(i / cols);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const k = nr * cols + nc;
      if (outside[k] || filled(nc, nr)) continue;
      outside[k] = 1;
      queue.push(k);
    }
  }
  let holes = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) if (!outside[r * cols + c] && !filled(c, r)) holes++;
  }
  return holes * step * step;
}

/**
 * What is wrong with a drawn plan. Buildings must read as one packed footprint
 * (shared walls, doors on walls, a way out, windows, stairs between floors);
 * dungeons/caves only need rooms, a way in, and stairs between levels.
 */
export function floorPlanIssues(
  map: ActiveDungeonState | null | undefined,
  opts: { building: boolean; minRooms?: number }
): string[] {
  const issues: string[] = [];
  if (!map) return ['blank: no plan'];
  const open = map.nodes.filter((n) => !n.isSecret);
  const minRooms = opts.minRooms ?? 2;
  if (open.length < minRooms) issues.push(`blank: fewer than ${minRooms} rooms`);
  if (map.nodes.some((n) => !n.footprint || n.footprint.w <= 0 || n.footprint.h <= 0)) {
    issues.push('blank: a room has no size');
  }
  if (issues.length) return issues;

  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const zs = [...new Set(map.nodes.map((n) => n.zLevel ?? 0))].sort((a, b) => a - b);

  if (opts.building) {
    for (const z of zs) {
      const level = map.nodes.filter((n) => (n.zLevel ?? 0) === z);
      const rooms = level.map(planRoomOf);
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          if (boxesOverlap(rooms[i]!, rooms[j]!)) issues.push(`overlap: ${level[i]!.name} / ${level[j]!.name}`);
        }
      }
      if (rooms.length > 1) {
        for (const r of rooms) {
          if (!rooms.some((o) => o.id !== r.id && sharedWall(r, o))) {
            issues.push(`floating-room: ${byId.get(r.id)?.name || r.id} (${levelLabel(z)})`);
          }
        }
      }
      const hole = enclosedVoid(rooms);
      if (hole >= 0.3) issues.push(`room-sized-gap: ${hole.toFixed(2)} units inside ${levelLabel(z)}`);
    }
    for (const n of map.nodes) {
      for (const id of n.connections) {
        const t = byId.get(id);
        if (!t || n.id >= t.id || (n.zLevel ?? 0) !== (t.zLevel ?? 0)) continue;
        if (!sharedWall(planRoomOf(n), planRoomOf(t))) {
          issues.push(`door-off-wall: ${n.name || n.id} → ${t.name || t.id}`);
        }
      }
    }
    if (!zs.some((z) => z >= 0 && windowMarks(map, z).length)) issues.push('no-window');
  }

  if (!exteriorDoor(map)) issues.push('no-exit-door');

  const entryId = planEntryId(map);
  const reach = new Set<string>(entryId ? [entryId] : []);
  const queue = entryId ? [entryId] : [];
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of byId.get(id)?.connections ?? []) {
      if (reach.has(next) || !byId.has(next)) continue;
      reach.add(next);
      queue.push(next);
    }
  }
  for (const z of zs) {
    const level = map.nodes.filter((n) => (n.zLevel ?? 0) === z && !n.isSecret);
    if (level.length && !level.some((n) => reach.has(n.id))) {
      issues.push(`floor-without-stairs: ${levelLabel(z)}`);
    }
  }
  return issues;
}
