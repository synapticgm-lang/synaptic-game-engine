/**
 * XP-D1 OPEN5 — wilds creature stock per place.
 * Stock lives on state.wildsByPlace keyed by place id. This module never mints places:
 * an unregistered label is keyed by a slug of its own name. The engine picks every
 * species, level, and kill; the AI only narrates what the engine hands it.
 */
import type { GameState, PlaceRecord } from './types';
import {
  speciesForBiome,
  creatureLevel,
  type BehaviourTag,
  type CreatureKind,
  type CreatureSpeciesRow,
  type PrimaryDrop,
} from '../data/creatureTables';
import { biomeKey, HUB_TEXT_BIOMES } from '../data/dungeonBiomes';
import { ensureRegionBands, ensureRegionResources, resolvePlaceRegionId, regionBand } from './regionLevels';
import { isInteriorPlace, isExplorableDungeon } from './placeAuthority';
import { createHashRng } from './seededRng';
import {
  CLEAR_MINE_GRACE_HOURS,
  GUARD_AMBUSH_BASE,
  NODE_RESPAWN_HOURS,
  NODE_STOCK_BASE,
  WILDS_RESPAWN_HOURS,
  WILDS_STOCK_BASE,
  WILDS_STOCK_PER_TIER,
  WORLD_MAX_CREATURE_LEVEL,
  tierForLevel,
} from './rules/wildlifeConfig';

export interface WildsSlot {
  speciesId: string;
  name: string;
  level: number;
  kind: CreatureKind;
  behaviour: BehaviourTag;
  elite?: boolean;
  rare?: boolean;
  stock: number;
  maxStock: number;
  skinnable: boolean;
  primaryDrop: PrimaryDrop;
}

export interface WildsStock {
  placeId: string;
  regionId: string;
  slots: WildsSlot[];
  /** World-clock hour (day*24 + hour) the stock was last topped up. */
  lastRefillHour: number;
  /** Gathering stays safe until this world hour after the guards were cleared. */
  guardClearedUntilHour?: number;
  /** The "area is quiet" notice was shown for this grace window (guardClearedUntilHour value). */
  quietShownFor?: number;
}

const MAX_SLOTS = 5;
/** Rare slots come back one unit per this many ordinary refill units. */
const RARE_REFILL_EVERY = 4;

const GUARD_BEHAVIOURS: ReadonlySet<BehaviourTag> = new Set<BehaviourTag>(['aggressive', 'pack', 'territorial']);

export function isGuardBehaviour(b: BehaviourTag): boolean {
  return GUARD_BEHAVIOURS.has(b);
}

// ---------------------------------------------------------------------------
// clock + place helpers
// ---------------------------------------------------------------------------

/** One clock in whole world hours: day*24 + hour when the world clock exists, else the turn counter. */
export function wildsNowHour(state: GameState): number {
  if (typeof state.worldDay === 'number' || typeof state.worldHour === 'number') {
    return Math.floor((state.worldDay ?? 0) * 24 + (state.worldHour ?? 0));
  }
  return Math.max(0, Math.floor(state.turn ?? 0));
}

function slugOf(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'here';
}

function findPlace(state: GameState, placeName?: string): PlaceRecord | undefined {
  const name = (placeName ?? state.currentLocation ?? '').trim().toLowerCase();
  if (!name) return undefined;
  const places = state.places ?? [];
  return (
    places.find((p) => p.name.toLowerCase() === name) ??
    places.find((p) => (p.aliases ?? []).some((a) => a.toLowerCase() === name)) ??
    places.find((p) => p.name.toLowerCase().includes(name))
  );
}

/** Place id for stock: the registered place id, else a slug of the label (never adds a place). */
export function wildsPlaceId(state: GameState, placeName?: string): string {
  const hit = findPlace(state, placeName);
  if (hit) return hit.id;
  return `loc:${slugOf(placeName ?? state.currentLocation ?? '')}`;
}

function biomeFor(state: GameState, place: PlaceRecord | undefined, regionId: string, label: string): string {
  const direct = biomeKey(place?.biome);
  if (direct) return direct;
  const settlement = (state.worldAtlas?.settlements ?? []).find(
    (s) => s.name.toLowerCase() === (place?.name ?? label).toLowerCase()
  );
  const fromSettlement = biomeKey(settlement?.biome);
  if (fromSettlement) return fromSettlement;
  for (const t of HUB_TEXT_BIOMES) if (t.match.test(label)) return t.biome;
  const region = state.worldAtlas?.regions?.find((r) => r.id === regionId);
  for (const tag of region?.tags ?? []) {
    const k = biomeKey(tag);
    if (k) return k;
  }
  return 'plains';
}

// ---------------------------------------------------------------------------
// seeding + refill
// ---------------------------------------------------------------------------

function slotMax(row: CreatureSpeciesRow, areaTier: number): number {
  const base = WILDS_STOCK_BASE + WILDS_STOCK_PER_TIER * areaTier;
  if (row.rare) return 1;
  if (row.elite) return Math.max(1, Math.floor(base / 3));
  return base;
}

function seedStock(state: GameState, placeId: string, regionId: string, biome: string, nowHour: number): WildsStock {
  const band = regionBand(state, regionId);
  const high = Math.min(WORLD_MAX_CREATURE_LEVEL, band.high);
  const eff = { low: Math.min(band.low, high), high };
  const areaTier = tierForLevel(Math.round((eff.low + eff.high) / 2));
  const rows = speciesForBiome(biome, eff);

  const pool = [...rows];
  const picked: CreatureSpeciesRow[] = [];
  // Slot 0 is always the gentlest, most common row so low-level players have a target.
  pool.sort((a, b) => creatureLevel(a, eff) - creatureLevel(b, eff) || b.weight - a.weight || a.id.localeCompare(b.id));
  const first = pool.find((r) => !r.elite && !r.rare) ?? pool[0];
  if (first) {
    picked.push(first);
    pool.splice(pool.indexOf(first), 1);
  }
  const want = Math.min(MAX_SLOTS, rows.length);
  for (let i = picked.length; i < want && pool.length; i++) {
    const roll = createHashRng(state.seed ?? 's', placeId, i)();
    const total = pool.reduce((n, r) => n + r.weight, 0);
    let t = roll * total;
    let idx = pool.length - 1;
    for (let k = 0; k < pool.length; k++) {
      t -= pool[k]!.weight;
      if (t < 0) {
        idx = k;
        break;
      }
    }
    picked.push(pool[idx]!);
    pool.splice(idx, 1);
  }

  const slots: WildsSlot[] = picked.map((r) => {
    const max = slotMax(r, areaTier);
    return {
      speciesId: r.id,
      name: r.name,
      level: Math.max(1, Math.min(WORLD_MAX_CREATURE_LEVEL, creatureLevel(r, eff))),
      kind: r.kind,
      behaviour: r.behaviour,
      elite: r.elite,
      rare: r.rare,
      stock: max,
      maxStock: max,
      skinnable: r.skinnable,
      primaryDrop: r.primaryDrop,
    };
  });
  return { placeId, regionId, slots, lastRefillHour: nowHour };
}

/** Top up one creature unit per WILDS_RESPAWN_HOURS (pure; returns the same object when nothing changes). */
function refillStock(w: WildsStock, nowHour: number): WildsStock {
  if (nowHour < w.lastRefillHour) return { ...w, lastRefillHour: nowHour };
  const units = Math.floor((nowHour - w.lastRefillHour) / WILDS_RESPAWN_HOURS);
  if (units <= 0) return w;
  const slots = w.slots.map((s) => ({ ...s }));
  let rareLeft = Math.floor(units / RARE_REFILL_EVERY);
  let left = units;
  let changed = false;
  while (left > 0) {
    const need = slots
      .filter((s) => !s.rare && s.stock < s.maxStock)
      .sort((a, b) => a.stock / a.maxStock - b.stock / b.maxStock);
    if (!need.length) break;
    need[0]!.stock += 1;
    changed = true;
    left -= 1;
  }
  for (const s of slots) {
    if (s.rare && s.stock < s.maxStock && rareLeft > 0) {
      s.stock += 1;
      rareLeft -= 1;
      changed = true;
    }
  }
  const allFull = slots.every((s) => s.stock >= s.maxStock);
  const lastRefillHour = allFull || left > 0 ? nowHour : w.lastRefillHour + units * WILDS_RESPAWN_HOURS;
  if (!changed && lastRefillHour === w.lastRefillHour) return w;
  return { ...w, slots, lastRefillHour };
}

/**
 * Stock for this place, created on first use and topped up from the world clock.
 * Pure: never mutates the input state. Does not add to state.places.
 */
export function ensureWilds(state: GameState, placeName?: string): GameState {
  const label = (placeName ?? state.currentLocation ?? '').trim();
  const withBands = ensureRegionBands(state);
  const placeId = wildsPlaceId(withBands, label);
  const now = wildsNowHour(withBands);
  const existing = withBands.wildsByPlace?.[placeId] as WildsStock | undefined;
  if (existing) {
    const next = refillStock(existing, now);
    if (next === existing && withBands === state) return state;
    if (next === existing) return withBands;
    return { ...withBands, wildsByPlace: { ...(withBands.wildsByPlace ?? {}), [placeId]: next } };
  }
  const place = findPlace(withBands, label);
  const regionId = place?.regionId ?? resolvePlaceRegionId(withBands, label);
  const biome = biomeFor(withBands, place, regionId, label);
  const stock = seedStock(withBands, placeId, regionId, biome, now);
  return { ...withBands, wildsByPlace: { ...(withBands.wildsByPlace ?? {}), [placeId]: stock } };
}

function wildsOf(state: GameState, placeName?: string): WildsStock | undefined {
  return state.wildsByPlace?.[wildsPlaceId(state, placeName)] as WildsStock | undefined;
}

/** The creature stock record for this place (after the world-clock refill), or undefined when none was seeded. */
export function wildsStockHere(state: GameState, placeName?: string): WildsStock | undefined {
  return wildsOf(ensureWilds(state, placeName), placeName);
}

export function wildsHasStock(state: GameState, place?: string): boolean {
  const next = ensureWilds(state, place);
  const w = wildsOf(next, place);
  return !!w && w.slots.some((s) => s.stock > 0);
}

// ---------------------------------------------------------------------------
// hunting
// ---------------------------------------------------------------------------

/**
 * Engine picks the next hunt target from live stock. Does not spend stock — call
 * takeWildsKill when the kill lands. Hunting favours guards (aggressive/pack/territorial).
 */
export function pickHuntTarget(
  state: GameState,
  opts?: { strongest?: boolean; name?: string; guardOnly?: boolean }
): { state: GameState; target: WildsSlot } | null {
  const next = ensureWilds(state);
  const w = wildsOf(next);
  if (!w) return null;
  let pool = w.slots.filter((s) => s.stock > 0);
  // An ambush only ever comes from a guard (aggressive / pack / territorial); passive and skittish never do.
  if (opts?.guardOnly) pool = pool.filter((s) => isGuardBehaviour(s.behaviour));
  const wanted = (opts?.name ?? '').trim().toLowerCase();
  if (wanted) {
    pool = pool.filter((s) => s.name.toLowerCase().includes(wanted) || wanted.includes(s.name.toLowerCase()));
  }
  if (!pool.length) return null;

  if (opts?.strongest) {
    const best = [...pool].sort(
      (a, b) =>
        b.level - a.level ||
        Number(!!b.rare) - Number(!!a.rare) ||
        Number(!!b.elite) - Number(!!a.elite) ||
        a.speciesId.localeCompare(b.speciesId)
    )[0]!;
    return { state: next, target: best };
  }

  const weights = pool.map((s) => s.stock * (isGuardBehaviour(s.behaviour) ? 3 : 1) * (s.rare ? 0.5 : 1));
  const total = weights.reduce((n, x) => n + x, 0);
  let t = createHashRng(next.seed ?? 's', 'hunt', w.placeId, next.turn ?? 0, wildsNowHour(next))() * total;
  let idx = pool.length - 1;
  for (let i = 0; i < pool.length; i++) {
    t -= weights[i]!;
    if (t < 0) {
      idx = i;
      break;
    }
  }
  return { state: next, target: pool[idx]! };
}

/** Spend one unit of a species at this place; clears the guard grace when the last guard falls. */
export function takeWildsKill(state: GameState, speciesId: string, placeName?: string): GameState {
  const next = ensureWilds(state, placeName);
  const w = wildsOf(next, placeName);
  if (!w) return next;
  const slot = w.slots.find((s) => s.speciesId === speciesId && s.stock > 0);
  if (!slot) return next;
  const hadGuards = guardsAlive(w) > 0;
  const slots = w.slots.map((s) => (s === slot ? { ...s, stock: s.stock - 1 } : s));
  const updated: WildsStock = { ...w, slots };
  let out: GameState = { ...next, wildsByPlace: { ...(next.wildsByPlace ?? {}), [w.placeId]: updated } };
  if (hadGuards && guardsAlive(updated) === 0) out = markGuardsCleared(out, placeName);
  return out;
}

// ---------------------------------------------------------------------------
// guards + clear-then-mine
// ---------------------------------------------------------------------------

function guardsAlive(w: WildsStock): number {
  return w.slots.filter((s) => isGuardBehaviour(s.behaviour)).reduce((n, s) => n + s.stock, 0);
}

function guardsMax(w: WildsStock): number {
  return w.slots.filter((s) => isGuardBehaviour(s.behaviour)).reduce((n, s) => n + s.maxStock, 0);
}

/** GUARD_AMBUSH_BASE × (alive aggressive|pack|territorial ÷ their max stock). 0 with no guards. */
export function guardAmbushChance(wilds: WildsStock | null | undefined): number {
  if (!wilds) return 0;
  const max = guardsMax(wilds);
  if (max <= 0) return 0;
  return GUARD_AMBUSH_BASE * (guardsAlive(wilds) / max);
}

/** Open the clear-then-mine grace window (CLEAR_MINE_GRACE_HOURS world hours). */
export function markGuardsCleared(state: GameState, placeName?: string): GameState {
  const next = ensureWilds(state, placeName);
  const w = wildsOf(next, placeName);
  if (!w) return next;
  const until = wildsNowHour(next) + CLEAR_MINE_GRACE_HOURS;
  return {
    ...next,
    wildsByPlace: { ...(next.wildsByPlace ?? {}), [w.placeId]: { ...w, guardClearedUntilHour: until } },
  };
}

/**
 * Gathering here is safe when no guard is alive, or the grace window is open and guard
 * stock has not refilled past half.
 */
export function gatheringIsSafe(state: GameState, placeName?: string): boolean {
  const next = ensureWilds(state, placeName);
  const w = wildsOf(next, placeName);
  if (!w) return true;
  const max = guardsMax(w);
  if (max <= 0) return true;
  const alive = guardsAlive(w);
  if (alive === 0) return true;
  const until = w.guardClearedUntilHour;
  return typeof until === 'number' && wildsNowHour(next) < until && alive / max <= 0.5;
}

/** Guards (aggressive / pack / territorial) still alive here, after the world clock refill. */
export function guardsRemainHere(state: GameState, placeName?: string): boolean {
  const w = wildsOf(ensureWilds(state, placeName), placeName);
  return !!w && guardsAlive(w) > 0;
}

/**
 * One "the area is quiet" notice per grace window: true the first time it is asked after the guards cleared
 * (or never had any guard to clear), with the state that remembers it was shown.
 */
export function takeQuietNotice(state: GameState, placeName?: string): { state: GameState; show: boolean } {
  const next = ensureWilds(state, placeName);
  const w = wildsOf(next, placeName);
  if (!w || typeof w.guardClearedUntilHour !== 'number') return { state: next, show: false };
  if (w.quietShownFor === w.guardClearedUntilHour) return { state: next, show: false };
  if (!gatheringIsSafe(next, placeName)) return { state: next, show: false };
  const updated: WildsStock = { ...w, quietShownFor: w.guardClearedUntilHour };
  return {
    state: { ...next, wildsByPlace: { ...(next.wildsByPlace ?? {}), [w.placeId]: updated } },
    show: true,
  };
}

// ---------------------------------------------------------------------------
// resource nodes (ore seams / herb patches) — one owner with the creature stock above
// ---------------------------------------------------------------------------

export type NodeStock = NonNullable<GameState['nodeStockByPlace']>[string];
export type ResourceNode = NodeStock['nodes'][number];

/** Region this place sits in (registered place first, else the label's resolved region). */
export function placeRegionId(state: GameState, placeName?: string): string {
  const label = (placeName ?? state.currentLocation ?? '').trim();
  return findPlace(state, label)?.regionId ?? resolvePlaceRegionId(state, label);
}

function refillNodes(n: NodeStock, nowHour: number): NodeStock {
  if (nowHour < n.lastRefillHour) return { ...n, lastRefillHour: nowHour };
  const units = Math.floor((nowHour - n.lastRefillHour) / NODE_RESPAWN_HOURS);
  if (units <= 0) return n;
  const nodes = n.nodes.map((x) => ({ ...x, stock: Math.min(x.maxStock, x.stock + units) }));
  const full = nodes.every((x) => x.stock >= x.maxStock);
  return { ...n, nodes, lastRefillHour: full ? nowHour : n.lastRefillHour + units * NODE_RESPAWN_HOURS };
}

/**
 * Node stock for this place: created on first use from the region's resource profile (ensureRegionResources),
 * one unit back per NODE_RESPAWN_HOURS. Pure; never adds a place. A region with no ore or herbs has no nodes.
 */
export function ensureNodeStock(state: GameState, placeName?: string): GameState {
  const label = (placeName ?? state.currentLocation ?? '').trim();
  const withRes = ensureRegionResources(state);
  const placeId = wildsPlaceId(withRes, label);
  const now = wildsNowHour(withRes);
  const existing = withRes.nodeStockByPlace?.[placeId];
  if (existing) {
    const next = refillNodes(existing, now);
    if (next === existing) return withRes;
    return { ...withRes, nodeStockByPlace: { ...(withRes.nodeStockByPlace ?? {}), [placeId]: next } };
  }
  const profile = withRes.regionResourceProfiles?.[placeRegionId(withRes, label)];
  const nodes: ResourceNode[] = [];
  if (profile?.herbTier && profile.herbId) {
    nodes.push({ id: profile.herbId, kind: 'herb', tier: profile.herbTier, stock: NODE_STOCK_BASE, maxStock: NODE_STOCK_BASE });
  }
  if (profile?.oreTier && profile.oreId) {
    nodes.push({ id: profile.oreId, kind: 'ore', tier: profile.oreTier, stock: NODE_STOCK_BASE, maxStock: NODE_STOCK_BASE });
  }
  return {
    ...withRes,
    nodeStockByPlace: { ...(withRes.nodeStockByPlace ?? {}), [placeId]: { placeId, nodes, lastRefillHour: now } },
  };
}

/** Does this place have a resource node with stock left (herb / ore / either)? */
export function hasNodeStock(state: GameState, kind?: 'ore' | 'herb', placeName?: string): boolean {
  const next = ensureNodeStock(state, placeName);
  const n = next.nodeStockByPlace?.[wildsPlaceId(next, placeName)];
  return !!n && n.nodes.some((x) => x.stock > 0 && (!kind || x.kind === kind));
}

/** Spend one unit of a node. No-op when it is empty or absent. */
export function takeNodeUnit(state: GameState, nodeId: string, placeName?: string): GameState {
  const next = ensureNodeStock(state, placeName);
  const placeId = wildsPlaceId(next, placeName);
  const n = next.nodeStockByPlace?.[placeId];
  if (!n) return next;
  const hit = n.nodes.find((x) => x.id === nodeId && x.stock > 0);
  if (!hit) return next;
  const nodes = n.nodes.map((x) => (x === hit ? { ...x, stock: x.stock - 1 } : x));
  return { ...next, nodeStockByPlace: { ...(next.nodeStockByPlace ?? {}), [placeId]: { ...n, nodes } } };
}

// ---------------------------------------------------------------------------
// outdoors?
// ---------------------------------------------------------------------------

const OUTDOOR_CUES =
  /\b(?:street|streets|alley|alleys|lane|square|plaza|market|road|roads|path|trail|track|camp|campsite|clearing|meadow|field|fields|farm|orchard|forest|woods|grove|thicket|marsh|fen|moor|hill|hills|ridge|pass|shore|beach|coast|bank|ford|bridge|outskirts|edge|outside|outdoors|wilds|wilderness|countryside|gate|wall|docks?|harbou?r|quay|park|common|green|yard)\b/i;
const INDOOR_EXTRA =
  /\b(?:inn|tavern|taproom|shop|store|temple|chapel|church|house|home|keep|castle|tower|cellar|crypt|tomb|vault|cave|cavern|mine|barracks|guildhall|library|forge|smithy|workshop|manor|prison|cell|chamber|room|hall|sewer|undercroft|dungeon|bunker|basement|attic)\b/i;

/**
 * Wildlife roams here: streets, roads, camps, clearings, settlement edges, or a journey underway.
 * Not inside buildings / dungeons / a live fight.
 */
export function isOutdoorWildsPlace(state: GameState, place?: string): boolean {
  const enc = state.activeEncounter;
  if (enc && typeof enc.hp === 'number' && enc.hp > 0) return false;
  if (place === undefined && state.journey) return true;
  if (isExplorableDungeon(state.activeDungeon)) return false;
  const name = (place ?? state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  if (!name) return false;
  if (isInteriorPlace(name)) return false;
  const outdoor = OUTDOOR_CUES.test(name);
  if (INDOOR_EXTRA.test(name) && !outdoor) return false;
  return true;
}
