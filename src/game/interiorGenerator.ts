/**
 * 28j — Generic interior generator (anything you can go in or get into: dungeons, buildings, vehicles).
 * Uses ONLY the game's map templates:
 *  - placeTemplates INSIDE_TEMPLATES / VEHICLE_TEMPLATES — house / shop / tavern / barn, carts, wagons, boats;
 *  - mapEngine SHED_LAYOUTS / RUIN_LAYOUTS / GRAND_LAYOUTS — whole-building plans with rooms, sizes,
 *    floors (B1 / 1F / 2F), stairs and secret rooms;
 *  - mapEngine CORE_BLUEPRINTS — small cave (dungeon) and spaceship (vehicle);
 *  - mapEngine generateProceduralBlueprint — the existing grid/chain and web shape generator.
 * The engine decides the size (how many floors / rooms it keeps or asks for), stacks floors joined by
 * stairs or ladders, adds seeded extra doors, may add one secret room, and assigns room roles
 * (entry / room / cache / boss / stair / secret). Secret rooms have no door until their secret is found
 * (the host room is reported so the caller can put an unlocksNodeId secret there). Deterministic from
 * seed + key; the caller caches the result (dungeon card on the place record) and reuses it on return.
 */
import type { InteriorEdgeKind, MapBlueprint, MapNode } from './mapEngine';
import {
  CORE_BLUEPRINTS,
  GRAND_LAYOUTS,
  RUIN_LAYOUTS,
  SHED_LAYOUTS,
  generateProceduralBlueprint,
  type InteriorRoomSpec,
} from './mapEngine';
import { createHashRng } from './seededRng';
import { INSIDE_TEMPLATES, VEHICLE_TEMPLATES } from './placeTemplates';

export type InteriorKind = 'dungeon' | 'building' | 'vehicle';
export type RoomRole = 'entry' | 'room' | 'cache' | 'boss' | 'stair' | 'secret';

interface TemplateRoom {
  id: string;
  role: RoomRole;
  label?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export interface InteriorTemplate {
  id: string;
  kinds: InteriorKind[];
  tags: string[];
  rooms: TemplateRoom[];
  links: Array<[string, string]>;
  source: string;
}

/** Site words that ask for more than one floor. */
export const MULTI_FLOOR_WORDS = /\b(floors|levels|storeys|stories|deep|depths|descent|tower|spire|delve)\b/i;

const CACHE_LABEL = /\b(store|storeroom|storage|vault|reliquary|archive|cellar|pantry|locker|hold)\b/i;

function fromBuildingLayout(id: string, layout: InteriorRoomSpec[], kinds: InteriorKind[], tags: string[]): InteriorTemplate {
  const rooms: TemplateRoom[] = layout.map((r) => ({
    id: r.id,
    role: r.entry ? 'entry' : r.isSecret ? 'secret' : /^stairs?$/i.test(r.label) ? 'stair' : 'room',
    label: r.label,
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
    z: r.z,
  }));
  const links: Array<[string, string]> = [];
  for (const r of layout) for (const t of r.links) if (r.id < t) links.push([r.id, t]);
  return { id, kinds, tags, rooms, links, source: 'mapEngine building layouts' };
}

function fromBlueprint(b: MapBlueprint, kinds: InteriorKind[], tags: string[]): InteriorTemplate {
  const rooms: TemplateRoom[] = b.nodes.map((n) => {
    const t = n.tags ?? [];
    return {
      id: n.id,
      role: t.includes('entry') ? 'entry' : t.includes('boss') ? 'boss' : 'room',
      label: n.name,
      x: (n.coordinates?.x ?? 0) * 1.3,
      y: (n.coordinates?.y ?? 0) * 1.2,
      w: 1.1,
      h: 1,
      z: 0,
    };
  });
  const links: Array<[string, string]> = [];
  for (const n of b.nodes) for (const t of n.connections) if (n.id < t) links.push([n.id, t]);
  return { id: b.id.startsWith('blueprint_proc_') ? `procedural-${b.tags[1] ?? 'grid'}-${b.nodes.length}` : b.id, kinds, tags, rooms, links, source: b.id.startsWith('blueprint_proc_') ? 'mapEngine generateProceduralBlueprint' : 'mapEngine CORE_BLUEPRINTS' };
}

/** The fixed (premade) templates the game ships with. Procedural shapes are added per generation. */
export function interiorTemplates(kind?: InteriorKind): InteriorTemplate[] {
  const all: InteriorTemplate[] = [
    ...SHED_LAYOUTS.map((l, i) => fromBuildingLayout(`building-shed-${i + 1}`, l, ['building'], ['shed', 'small'])),
    ...RUIN_LAYOUTS.map((l, i) => fromBuildingLayout(`building-ruin-${i + 1}`, l, ['building', 'dungeon'], ['ruin', 'crypt', 'keep', 'chapel'])),
    ...GRAND_LAYOUTS.map((l, i) => fromBuildingLayout(`building-grand-${i + 1}`, l, ['building'], ['grand', 'manor'])),
    ...INSIDE_TEMPLATES.map((t) => fromBuildingLayout(t.id, t.layout!, ['building'], t.reuse)),
    ...VEHICLE_TEMPLATES.map((t) => fromBuildingLayout(t.id, t.layout!, ['vehicle'], t.reuse)),
    ...CORE_BLUEPRINTS.map((b) =>
      fromBlueprint(b, b.category === 'spaceship' || b.category === 'ship' ? ['vehicle'] : b.category === 'house' ? ['building'] : ['dungeon'], [b.category, ...b.tags, ...(b.category === 'cave' ? ['mine'] : [])])
    ),
  ];
  return kind ? all.filter((t) => t.kinds.includes(kind)) : all;
}

export interface GeneratedRoom {
  id: string;
  role: RoomRole;
  label?: string;
  floor: number;
  landing?: boolean;
  via?: 'stairs' | 'ladder';
}

export interface GeneratedInterior {
  nodes: MapNode[];
  rooms: GeneratedRoom[];
  entryId: string;
  bossId?: string;
  /** Secret rooms and the room whose search reveals each. */
  secrets: Array<{ id: string; fromId: string }>;
  templateIds: string[];
  floors: number;
}

export interface GenerateInteriorOptions {
  seed: string;
  key: string;
  kind: InteriorKind;
  tags?: string[];
  /** Floors to stack (default 1). A multi-floor template counts for all its floors. */
  floors?: number;
  direction?: 'down' | 'up';
  secretChance?: number;
  needBoss?: boolean;
  needCache?: boolean;
}

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]!;
}

function distances(start: string, links: Array<[string, string]>): Map<string, number> {
  const adj = new Map<string, string[]>();
  for (const [a, b] of links) {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const id = q.shift()!;
    for (const n of adj.get(id) ?? []) if (!dist.has(n)) { dist.set(n, dist.get(id)! + 1); q.push(n); }
  }
  return dist;
}

function farthest(start: string, ids: string[], links: Array<[string, string]>): string | undefined {
  const d = distances(start, links);
  return ids.filter((i) => i !== start && d.has(i)).sort((a, b) => d.get(b)! - d.get(a)!)[0];
}

/** Build an interior from existing templates. Deterministic from seed + key. */
export function generateInterior(opts: GenerateInteriorOptions): GeneratedInterior {
  const rng = createHashRng(opts.seed, opts.key, 'interior-gen');
  const want = (opts.tags ?? []).map((t) => t.toLowerCase());
  const down = (opts.direction ?? (opts.kind === 'dungeon' ? 'down' : 'up')) === 'down';
  const floorsWanted = Math.max(1, Math.min(4, opts.floors ?? 1));
  const baseZ = down ? -1 : 0;

  const poolFor = (): InteriorTemplate[] => {
    const fixed = interiorTemplates(opts.kind);
    if (opts.kind !== 'dungeon') return fixed;
    // Engine decides the size of each procedural floor (5–8 rooms) from the existing shape generator.
    const size = 5 + Math.floor(rng() * 4);
    const shape = rng() < 0.7 ? 'grid' : 'web';
    return [...fixed, fromBlueprint(generateProceduralBlueprint(shape, opts.key, size, 0), ['dungeon'], ['any', 'mine', 'sewer', 'engine', 'cave', shape])];
  };

  const rooms: GeneratedRoom[] = [];
  const spec: Array<{ id: string; x: number; y: number; w: number; h: number; z: number }> = [];
  const links: Array<[string, string]> = [];
  const edgeKinds = new Map<string, InteriorEdgeKind>();
  const templateIds: string[] = [];
  let counter = 0;
  let prevStair: string | null = null;
  let floorIndex = 0;

  while (floorIndex < floorsWanted) {
    const pool = poolFor();
    const tagged = pool.filter((t) => t.tags.some((g) => want.includes(g)));
    const fresh = (tagged.length ? tagged : pool).filter((t) => !templateIds.includes(t.id));
    const tpl = pick(fresh.length ? fresh : tagged.length ? tagged : pool, rng);
    templateIds.push(tpl.id);
    // Engine decides size: a dungeon keeps only a building template's ground + lower floors.
    let tRooms = opts.kind === 'dungeon' ? tpl.rooms.filter((r) => r.z <= 0) : tpl.rooms;
    // Deeper floors in a stack only need as many template floors as are still wanted.
    const zs = Array.from(new Set(tRooms.map((r) => r.z))).sort((a, b) => (down ? b - a : a - b));
    // Buildings / vehicles keep the whole template; dungeons keep as many floors as are still wanted.
    const keepZ = new Set(opts.kind === 'dungeon' ? zs.slice(0, floorsWanted - floorIndex) : zs);
    tRooms = tRooms.filter((r) => keepZ.has(r.z) || r.role === 'entry');
    const keepIds = new Set(tRooms.map((r) => r.id));
    const tLinks = tpl.links.filter(([a, b]) => keepIds.has(a) && keepIds.has(b));
    const tplFloors = keepZ.size || 1;
    // A stair room whose other floor was trimmed away is just a room now.
    const zOf = new Map(tRooms.map((r) => [r.id, r.z]));
    tRooms = tRooms.map((r) =>
      r.role === 'stair' && !tLinks.some(([x, y]) => (x === r.id || y === r.id) && zOf.get(x) !== zOf.get(y)) ? { ...r, role: 'room' as RoomRole } : r
    );
    const topZ = zs[0] ?? 0;

    const mirror = rng() < 0.5;
    const maxX = Math.max(...tRooms.map((r) => r.x + r.w));
    const idMap = new Map<string, string>();
    const ordered = [...tRooms].sort((a, b) => (a.role === 'entry' ? -1 : b.role === 'entry' ? 1 : 0));
    for (const r of ordered) {
      const id = `r${counter++}`;
      idMap.set(r.id, id);
      const depth = Math.abs(r.z - topZ);
      const z = opts.kind === 'dungeon' ? baseZ + (down ? -1 : 1) * (floorIndex + depth) : r.z + (down ? -1 : 1) * floorIndex;
      rooms.push({ id, role: r.role, label: r.label, floor: floorIndex + depth });
      spec.push({ id, x: mirror ? maxX - r.x - r.w : r.x, y: r.y, w: r.w, h: r.h, z });
    }
    const floorLinks: Array<[string, string]> = tLinks.map(([a, b]) => [idMap.get(a)!, idMap.get(b)!]);
    // Seeded extra door between two non-secret rooms on the same floor (a loop), half the time.
    const plain = rooms.filter((r) => [...idMap.values()].includes(r.id) && r.role !== 'secret');
    if (plain.length > 3 && rng() < 0.5) {
      const a = pick(plain, rng);
      const b = pick(plain.filter((r) => r.id !== a.id && r.floor === a.floor), rng);
      if (b && !floorLinks.some(([x, y]) => (x === a.id && y === b.id) || (x === b.id && y === a.id))) floorLinks.push([a.id, b.id]);
    }
    links.push(...floorLinks);
    for (const [a, b] of floorLinks) {
      const ra = rooms.find((r) => r.id === a)!;
      const rb = rooms.find((r) => r.id === b)!;
      if (ra.floor !== rb.floor) edgeKinds.set(`${a}>${b}`, 'stairs');
    }
    const entry = idMap.get(ordered[0]!.id)!;
    if (prevStair) {
      links.push([prevStair, entry]);
      edgeKinds.set(`${prevStair}>${entry}`, 'stairs');
      const landing = rooms.find((r) => r.id === entry)!;
      landing.role = 'room';
      landing.landing = true;
    }
    floorIndex += tplFloors;
    if (floorIndex < floorsWanted) {
      const deepest = Math.max(...rooms.filter((r) => [...idMap.values()].includes(r.id)).map((r) => r.floor));
      const candidates = rooms.filter((r) => [...idMap.values()].includes(r.id) && r.floor === deepest && (r.role === 'room' || r.role === 'boss'));
      const stairId = candidates.find((r) => r.role === 'boss')?.id ?? farthest(entry, candidates.map((r) => r.id), floorLinks) ?? candidates[0]?.id;
      if (!stairId) break;
      const stair = rooms.find((r) => r.id === stairId)!;
      stair.role = 'stair';
      stair.via = rng() < 0.3 ? 'ladder' : 'stairs';
      prevStair = stairId;
    }
  }

  const entryId = 'r0';
  const deepest = Math.max(...rooms.map((r) => r.floor));
  // Rooms reachable from the entry without passing a template secret room (boss / cache go there).
  const templateSecret = new Set(rooms.filter((r) => r.role === 'secret').map((r) => r.id));
  const mainReach = distances(entryId, links.filter(([a, b]) => !templateSecret.has(a) && !templateSecret.has(b)));
  let bossId = rooms.find((r) => r.role === 'boss')?.id;
  if (opts.needBoss && !bossId) {
    const reachFloor = Math.max(...rooms.filter((r) => mainReach.has(r.id)).map((r) => r.floor));
    const ids = rooms.filter((r) => r.floor === reachFloor && r.role === 'room' && !r.landing && mainReach.has(r.id)).map((r) => r.id);
    const start = rooms.find((r) => r.floor === reachFloor && (r.landing || r.id === entryId))?.id ?? entryId;
    bossId = farthest(start, ids, links) ?? ids[ids.length - 1];
    if (bossId) rooms.find((r) => r.id === bossId)!.role = 'boss';
  }
  if (opts.needCache && !rooms.some((r) => r.role === 'cache')) {
    const free = rooms.filter((r) => r.role === 'room' && !r.landing && mainReach.has(r.id));
    const byLabel = free.find((r) => r.label && CACHE_LABEL.test(r.label));
    const deg = (id: string) => links.filter(([a, b]) => a === id || b === id).length;
    const leaf = free.find((r) => deg(r.id) === 1);
    const cache = byLabel ?? leaf ?? (free.length ? pick(free, rng) : undefined);
    if (cache) cache.role = 'cache';
  }

  // Secret rooms: template ones and at most one engine-added one; no door until found.
  const secrets: Array<{ id: string; fromId: string }> = [];
  for (const r of rooms.filter((x) => x.role === 'secret')) {
    const near = links.filter(([a, b]) => a === r.id || b === r.id).map(([a, b]) => (a === r.id ? b : a));
    const host = near.find((i) => mainReach.has(i)) ?? near[0];
    if (host) secrets.push({ id: r.id, fromId: host });
  }
  if (!secrets.length && rng() < (opts.secretChance ?? 0.5)) {
    const hosts = rooms.filter((r) => r.role === 'room' && !r.landing && mainReach.has(r.id));
    if (hosts.length) {
      const host = pick(hosts, rng);
      const hs = spec.find((n) => n.id === host.id)!;
      const id = `r${counter++}`;
      rooms.push({ id, role: 'secret', floor: host.floor });
      spec.push({ id, x: hs.x + hs.w + 0.2, y: hs.y + 0.1, w: 0.9, h: 0.8, z: hs.z });
      secrets.push({ id, fromId: host.id });
    }
  }
  const secretIds = new Set(secrets.map((s) => s.id));
  for (const s of secrets) edgeKinds.set(`${s.fromId}>${s.id}`, 'secret');
  // Doors between the open map and a secret room stay shut until found; rooms behind a secret keep theirs.
  const openReach = distances(entryId, links.filter(([a, b]) => !secretIds.has(a) && !secretIds.has(b)));
  const shut = ([a, b]: [string, string]) =>
    (secretIds.has(a) && openReach.has(b) && !secretIds.has(b)) || (secretIds.has(b) && openReach.has(a) && !secretIds.has(a));

  const nodes: MapNode[] = spec.map((n) => {
    const room = rooms.find((r) => r.id === n.id)!;
    const connections = Array.from(
      new Set(
        links
          .filter((l) => (l[0] === n.id || l[1] === n.id) && !shut(l))
          .map(([a, b]) => (a === n.id ? b : a))
      )
    );
    const kinds: Record<string, InteriorEdgeKind> = {};
    for (const [k, v] of edgeKinds) {
      const [a, b] = k.split('>');
      if (a === n.id) kinds[b!] = v;
      if (b === n.id) kinds[a!] = v;
    }
    const tags = [`role:${room.role}`, `floor:${room.floor}`];
    if (room.landing) tags.push('landing');
    if (room.via) tags.push(`via:${room.via}`);
    return {
      id: n.id,
      name: room.label ?? '',
      description: '',
      connections,
      coordinates: { x: Math.round(n.x * 100) / 100, y: Math.round(n.y * 100) / 100 },
      footprint: { w: n.w, h: n.h },
      zLevel: n.z,
      tags,
      isSecret: room.role === 'secret',
      edgeKinds: Object.keys(kinds).length ? kinds : undefined,
    };
  });

  return { nodes, rooms, entryId, bossId, secrets, templateIds, floors: deepest + 1 };
}
