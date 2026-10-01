/**
 * 29r — code place templates beside the shed / ruin / grand layouts, the cave and sewer
 * themes, and the spaceship blueprint (those stay where they are).
 * Insides: house / shop / tavern / barn floor plans (a house is not the ruin layout).
 * Shapes: how a settlement sits, picked from settlement kind + biome. Not pictures, not quest cards.
 * Vehicles: carts, wagons and boats you can get into (interior kind `vehicle`).
 * Code owns the id, label, interior names and reuse list. Who and where stay empty for the writer.
 */
import type { InteriorRoomSpec } from './mapEngine';

export type PlaceTemplateKind = 'inside' | 'shape' | 'vehicle';

export interface PlaceTemplate {
  id: string;
  kind: PlaceTemplateKind;
  label: string;
  /** Up to four interior names (room / part labels). */
  interiorNames: string[];
  /** Place words this template can be reused for. */
  reuse: string[];
  who: '';
  where: '';
  /** Floor plan for insides and vehicles (one room per interior name). */
  layout?: InteriorRoomSpec[];
  /** Rooms name what the building was for (bath, cells, lookout), so a ruin of it keeps them. */
  keepsRoomsWhenRuined?: boolean;
}

type Box = [x: number, y: number, w: number, h: number];

/** One floor, entry first, rooms linked in a chain plus any extra links. */
function plan(names: string[], boxes: Box[], extra: Array<[number, number]> = []): InteriorRoomSpec[] {
  const ids = names.map((_, i) => (i === 0 ? 'entry' : `room${i}`));
  const links = new Map<string, Set<string>>(ids.map((id) => [id, new Set<string>()]));
  const join = (a: number, b: number) => {
    links.get(ids[a]!)!.add(ids[b]!);
    links.get(ids[b]!)!.add(ids[a]!);
  };
  for (let i = 1; i < ids.length; i++) join(i - 1, i);
  for (const [a, b] of extra) join(a, b);
  return names.map((label, i) => {
    const [x, y, w, h] = boxes[i]!;
    return { id: ids[i]!, label, x, y, z: 0, w, h, links: [...links.get(ids[i]!)!], ...(i === 0 ? { entry: true } : {}) };
  });
}

type FloorRoom = [id: string, label: string, z: number, ...box: Box];

/** Rooms on other floors, joined to the ground plan by a stair / ladder room (`[groundId, otherId]`). */
function withFloors(base: InteriorRoomSpec[], rooms: FloorRoom[], links: Array<[string, string]>): InteriorRoomSpec[] {
  const all: InteriorRoomSpec[] = [
    ...base.map((r) => ({ ...r, links: [...r.links] })),
    ...rooms.map(([id, label, z, x, y, w, h]) => ({ id, label, x, y, z, w, h, links: [] as string[] })),
  ];
  for (const [a, b] of links) {
    all.find((r) => r.id === a)!.links.push(b);
    all.find((r) => r.id === b)!.links.push(a);
  }
  return all;
}

function template(
  id: string,
  kind: PlaceTemplateKind,
  label: string,
  interiorNames: string[],
  reuse: string[],
  boxes?: Box[] | InteriorRoomSpec[],
  extra?: Array<[number, number]>
): PlaceTemplate {
  const layout = !boxes
    ? undefined
    : Array.isArray(boxes[0])
      ? plan(interiorNames.slice(0, 4), boxes as Box[], extra)
      : (boxes as InteriorRoomSpec[]);
  return {
    id,
    kind,
    label,
    interiorNames: interiorNames.slice(0, 4),
    reuse,
    who: '',
    where: '',
    ...(layout ? { layout } : {}),
  };
}

/** A whole plan from rooms on any floor; the room with id `entry` is the way in. */
function layoutOf(rooms: FloorRoom[], links: Array<[string, string]>): InteriorRoomSpec[] {
  return withFloors([], rooms, links).map((r) => (r.id === 'entry' ? { ...r, entry: true } : r));
}

/** Two-storey house: front room off a hall, kitchen + pantry, stairs to a landing and two rooms above. */
const HOUSE_LAYOUT = layoutOf(
  [
    ['entry', 'Front room', 0, 0, 1.4, 1.6, 1.0],
    ['hall', 'Hall', 0, 1.6, 0, 0.5, 2.4],
    ['room1', 'Kitchen', 0, 0.6, 0, 1.0, 1.4],
    ['room3', 'Pantry', 0, 0, 0, 0.6, 1.4],
    ['stairs', 'Stairs', 0, 2.1, 0, 0.7, 1.4],
    ['room2', 'Bedroom', 0, 2.1, 1.4, 1.3, 1.0],
    ['landing', 'Landing', 1, 2.1, 0, 0.7, 1.4],
    ['upper', 'Upper bedroom', 1, 0, 0, 2.1, 1.4],
    ['box', 'Box room', 1, 2.1, 1.4, 1.3, 1.0],
  ],
  [
    ['entry', 'hall'],
    ['hall', 'room1'],
    ['room1', 'room3'],
    ['hall', 'stairs'],
    ['hall', 'room2'],
    ['stairs', 'landing'],
    ['landing', 'upper'],
    ['landing', 'box'],
  ]
);

/** One-floor bathhouse: changing room, cold plunge, warm and hot rooms, the furnace behind. */
const BATHHOUSE_LAYOUT = layoutOf(
  [
    ['entry', 'Changing room', 0, 0, 1.3, 1.3, 1.1],
    ['cold', 'Cold plunge', 0, 0, 0, 1.3, 1.3],
    ['warm', 'Warm room', 0, 1.3, 0, 1.4, 1.3],
    ['hot', 'Hot room', 0, 2.7, 0, 1.1, 1.3],
    ['attendant', "Attendant's room", 0, 1.3, 1.3, 1.4, 1.1],
    ['furnace', 'Furnace room', 0, 2.7, 1.3, 1.1, 1.1],
  ],
  [
    ['entry', 'cold'],
    ['entry', 'attendant'],
    ['attendant', 'warm'],
    ['cold', 'warm'],
    ['warm', 'hot'],
    ['hot', 'furnace'],
  ]
);

/** Guardhouse: guard room, armory, cells and office below; barracks and the captain above. */
const GUARDHOUSE_LAYOUT = layoutOf(
  [
    ['entry', 'Guard room', 0, 0, 1.2, 1.8, 1.2],
    ['armory', 'Armory', 0, 0, 0, 1.0, 1.2],
    ['stairs', 'Stairs', 0, 1.0, 0, 0.7, 1.2],
    ['office', 'Watch office', 0, 1.7, 0, 1.5, 1.2],
    ['cells', 'Cells', 0, 1.8, 1.2, 1.4, 1.2],
    ['landing', 'Landing', 1, 1.0, 0, 0.7, 1.2],
    ['kit', 'Kit store', 1, 0, 0, 1.0, 1.2],
    ['captain', "Captain's room", 1, 1.7, 0, 1.5, 1.2],
    ['barracks', 'Barracks', 1, 0, 1.2, 3.2, 1.2],
  ],
  [
    ['entry', 'armory'],
    ['entry', 'stairs'],
    ['entry', 'cells'],
    ['cells', 'office'],
    ['stairs', 'landing'],
    ['landing', 'captain'],
    ['landing', 'barracks'],
    ['barracks', 'kit'],
  ]
);

/** Narrow watchtower: guard post, watch room, lookout on top; no cellar. */
const WATCHTOWER_LAYOUT = layoutOf(
  [
    ['entry', 'Guard post', 0, 0, 0, 1.3, 1.2],
    ['stairs', 'Stairs', 0, 1.3, 0, 0.6, 1.2],
    ['store', 'Store', 0, 0, 1.2, 1.9, 0.7],
    ['stairs2', 'Stairs', 1, 1.3, 0, 0.6, 1.2],
    ['watch', 'Watch room', 1, 0, 0, 1.3, 1.2],
    ['bunks', 'Bunk room', 1, 0, 1.2, 1.9, 0.7],
    ['lookout', 'Lookout', 2, 0, 0, 1.9, 1.2],
  ],
  [
    ['entry', 'stairs'],
    ['entry', 'store'],
    ['stairs', 'stairs2'],
    ['stairs2', 'watch'],
    ['watch', 'bunks'],
    ['stairs2', 'lookout'],
  ]
);

function keepsRoomsWhenRuined(t: PlaceTemplate): PlaceTemplate {
  return { ...t, keepsRoomsWhenRuined: true };
}

export const INSIDE_TEMPLATES: PlaceTemplate[] = [
  template(
    'bld-inside-house',
    'inside',
    'A lived-in house',
    ['Front room', 'Kitchen', 'Bedroom', 'Pantry'],
    ['house', 'cottage', 'home', 'farmhouse', 'homestead', 'dwelling', 'croft'],
    HOUSE_LAYOUT
  ),
  template(
    'bld-inside-shop',
    'inside',
    'A shop with a counter',
    ['Shop floor', 'Counter', 'Workroom', 'Stockroom'],
    ['shop', 'store', 'smithy', 'forge', 'bakery', 'apothecary', 'chandlery', 'workshop'],
    [[0, 1.2, 1.9, 1.2], [0.4, 0.2, 1.55, 0.85], [2.05, 0.2, 1.1, 1.0], [2.05, 1.35, 1.0, 0.9]],
    [[0, 3]]
  ),
  template(
    'bld-inside-tavern',
    'inside',
    'A tavern with a common room',
    ['Common room', 'Bar', 'Kitchen', 'Cellar stair'],
    ['tavern', 'inn', 'alehouse', 'taproom', 'pub', 'roadhouse', 'waystation', 'way station', 'coaching inn', 'posthouse'],
    withFloors(
      plan(
        ['Common room', 'Bar', 'Kitchen', 'Cellar stair'],
        [[0.2, 1.1, 2.2, 1.4], [0.4, 0, 1.4, 0.95], [2.0, 0, 1.1, 0.95], [2.6, 1.3, 0.75, 0.8]],
        [[0, 3]]
      ),
      [
        ['cellar', 'Cellar', -1, 2.0, 0.9, 1.35, 1.2],
        ['barrels', 'Barrel store', -1, 0.6, 0.9, 1.4, 1.2],
      ],
      [['room3', 'cellar'], ['cellar', 'barrels']]
    )
  ),
  template(
    'bld-inside-barn',
    'inside',
    'A barn with stalls and a loft ladder',
    ['Barn floor', 'Stalls', 'Hayloft ladder', 'Tack room'],
    ['barn', 'stable', 'stables', 'granary', 'byre', 'cowshed'],
    withFloors(
      plan(
        ['Barn floor', 'Stalls', 'Hayloft ladder', 'Tack room'],
        [[0, 0.8, 2.4, 1.6], [2.55, 0.8, 0.9, 1.6], [2.55, 0, 0.9, 0.7], [1.45, 0, 1.0, 0.7]],
        [[0, 3]]
      ),
      [['loft', 'Hayloft', 1, 0.6, 0, 2.85, 2.4]],
      [['room2', 'loft']]
    )
  ),
  keepsRoomsWhenRuined(
    template(
      'bld-inside-bathhouse',
      'inside',
      'A bathhouse with warm and hot rooms',
      ['Changing room', 'Cold plunge', 'Warm room', 'Hot room'],
      ['bathhouse', 'bath house', 'bathhouses', 'baths', 'public baths', 'thermae', 'steam house'],
      BATHHOUSE_LAYOUT
    )
  ),
  keepsRoomsWhenRuined(
    template(
      'bld-inside-guardhouse',
      'inside',
      'A guardhouse with cells and a barracks',
      ['Guard room', 'Armory', 'Cells', 'Barracks'],
      ['guardhouse', 'guard house', 'guardpost', 'guard post', 'gatehouse', 'barracks', 'garrison', 'watch house', 'watchhouse'],
      GUARDHOUSE_LAYOUT
    )
  ),
  keepsRoomsWhenRuined(
    template(
      'bld-inside-watchtower',
      'inside',
      'A watchtower with a lookout on top',
      ['Guard post', 'Watch room', 'Bunk room', 'Lookout'],
      ['watchtower', 'watch tower', 'lookout tower', 'signal tower', 'beacon tower'],
      WATCHTOWER_LAYOUT
    )
  ),
];

export const SHAPE_TEMPLATES: PlaceTemplate[] = [
  template(
    'bld-shape-cliff-village',
    'shape',
    'Houses stepped up a cliff face',
    ['Cliff path', 'Terraces', 'Rope lift', 'Lookout'],
    ['cliff', 'crag', 'bluff', 'highland', 'mountain', 'escarpment']
  ),
  template(
    'bld-shape-cave-dwelling',
    'shape',
    'Homes cut into a rock wall',
    ['Cave mouth', 'Carved rooms', 'Smoke hole', 'Deep store'],
    ['cave', 'cavern', 'underground', 'rock', 'badlands', 'canyon']
  ),
  template(
    'bld-shape-sea-harbour',
    'shape',
    'A harbour open to the sea behind a breakwater',
    ['Breakwater', 'Quays', 'Fish market', 'Lighthouse'],
    ['sea', 'coast', 'coastal', 'shore', 'bay', 'ocean', 'port']
  ),
  template(
    'bld-shape-river-harbour',
    'shape',
    'A river landing with jetties and a ferry',
    ['Jetties', 'Ferry landing', 'Towpath', 'Warehouses'],
    ['river', 'ford', 'estuary', 'delta', 'lake', 'canal', 'wetland']
  ),
];

export const VEHICLE_TEMPLATES: PlaceTemplate[] = [
  template('veh-cart-hand', 'vehicle', 'A hand cart', ['Cart bed'], ['hand cart', 'handcart', 'barrow'], [[0, 0, 1.2, 0.8]]),
  template(
    'veh-wagon-covered',
    'vehicle',
    'A covered wagon',
    ['Driver bench', 'Covered bed'],
    ['covered wagon', 'caravan wagon', 'wagon'],
    [[0, 0.2, 0.8, 0.7], [0.9, 0, 1.8, 1.1]]
  ),
  template(
    'veh-wagon-merchant',
    'vehicle',
    'A merchant wagon with a fold-down stall',
    ['Driver bench', 'Stall side', 'Goods lockers'],
    ['merchant wagon', 'trader wagon', 'peddler wagon'],
    [[0, 0.2, 0.8, 0.7], [0.9, 0, 1.4, 1.1], [2.4, 0.1, 0.8, 0.9]]
  ),
  template(
    'veh-cart-farm',
    'vehicle',
    'A farm cart',
    ['Driver bench', 'Cart bed'],
    ['farm cart', 'ox cart', 'hay cart', 'cart'],
    [[0, 0.15, 0.7, 0.7], [0.8, 0, 1.5, 1.0]]
  ),
  template(
    'veh-boat-fishing',
    'vehicle',
    'A fishing boat',
    ['Deck', 'Wheelhouse', 'Fish hold'],
    ['fishing boat', 'trawler', 'smack'],
    [[0, 0.3, 1.8, 1.0], [1.9, 0.35, 0.8, 0.9], [1.3, 1.35, 1.4, 0.7]]
  ),
  template(
    'veh-boat-barge',
    'vehicle',
    'A river barge',
    ['Open deck', 'Cabin', 'Cargo well'],
    ['barge', 'keelboat', 'flatboat'],
    [[0, 0, 2.2, 1.0], [2.3, 0.1, 0.9, 0.8], [1.6, 1.1, 1.6, 0.8]]
  ),
  template(
    'veh-boat-cargo',
    'vehicle',
    'A cargo ship',
    ['Main deck', 'Captain cabin', 'Crew quarters', 'Cargo hold'],
    ['cargo ship', 'merchant ship', 'cog', 'freighter', 'ship'],
    [[0, 0.4, 2.2, 1.0], [2.35, 0.45, 0.9, 0.9], [2.0, 1.45, 1.25, 0.8], [0.1, 1.5, 1.8, 0.9]],
    [[0, 3]]
  ),
  template('veh-boat-rowboat', 'vehicle', 'A rowboat', ['Benches'], ['rowboat', 'dinghy', 'skiff', 'boat'], [[0, 0, 1.4, 0.7]]),
];

export const PLACE_TEMPLATES: PlaceTemplate[] = [...INSIDE_TEMPLATES, ...SHAPE_TEMPLATES, ...VEHICLE_TEMPLATES];

export function placeTemplateById(id: string): PlaceTemplate | undefined {
  return PLACE_TEMPLATES.find((t) => t.id === id);
}

function reuseMatch(list: PlaceTemplate[], text: string): PlaceTemplate | null {
  const n = (text ?? '').toLowerCase();
  if (!n.trim()) return null;
  let best: { t: PlaceTemplate; len: number } | null = null;
  for (const t of list) {
    for (const word of t.reuse) {
      if (!new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`).test(n)) continue;
      if (!best || word.length > best.len) best = { t, len: word.length };
    }
  }
  return best?.t ?? null;
}

/**
 * Damage words keep the ruin layout: a burnt-out house is a ruin, not a lived-in house.
 * A ruined bathhouse / guardhouse / watchtower keeps its own rooms (the floors still follow the damage).
 */
const RUINED = /\b(?:ruin|ruins|ruined|collapsed|half-collapsed|burnt|burned|charred|husk|shell|foundation|rubble|gutted)\b/i;

/** Inside template for a place label; null for anything else or a ruin of a lived-in building. */
export function insideTemplateFor(place: string): PlaceTemplate | null {
  const t = reuseMatch(INSIDE_TEMPLATES, place);
  if (t && RUINED.test(place ?? '') && !t.keepsRoomsWhenRuined) return null;
  return t;
}

export function vehicleTemplateFor(text: string): PlaceTemplate | null {
  return reuseMatch(VEHICLE_TEMPLATES, text);
}

/**
 * Settlement shape from kind + biome. Harbours split on sea vs river; a shore with no
 * river word is a sea harbour. Null when nothing fits (the plain town layout stays).
 */
export function settlementShapeTemplate(s: { kind?: string; biome?: string }): PlaceTemplate | null {
  const kind = (s.kind ?? '').toLowerCase();
  const biome = (s.biome ?? '').toLowerCase();
  const byId = (id: string) => SHAPE_TEMPLATES.find((t) => t.id === id)!;
  if (/\b(cave|cavern|underground|canyon|badlands)\b/.test(biome)) return byId('bld-shape-cave-dwelling');
  if (/\b(cliff|crag|bluff|escarpment|highland|mountain)/.test(biome)) return byId('bld-shape-cliff-village');
  const river = /\b(river|ford|estuary|delta|lake|canal|wetland)/.test(biome);
  const sea = /\b(sea|coast|shore|bay|ocean|port)/.test(biome);
  if (river && !sea) return byId('bld-shape-river-harbour');
  if (sea || kind === 'shore') return byId('bld-shape-sea-harbour');
  return null;
}
