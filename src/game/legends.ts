/**
 * Capped legend registry. The engine places every row. Speech does not.
 * Each live legend points at an item, place, NPC, or dungeon the engine already has.
 */
import type { GameState, LegendAccuracy, LegendArchiveLine, LegendRecord, NpcMemory } from './types';

export const REGION_CAP = 12;
export const WORLD_CAP = 48;
export const SHEET_CAP = 3;
const QUIET_DAYS = 12;

export interface DungeonLegendSite {
  dungeonName: string;
  areaLevel?: number;
  nodes: Array<{ hidden?: { lootables?: Array<{ id: string; label: string }> } }>;
}

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function live(list: LegendRecord[]): LegendRecord[] {
  return list.filter((row) => !row.quiet);
}

function canAdd(list: LegendRecord[], regionId: string): boolean {
  const open = live(list);
  if (open.length >= WORLD_CAP) return false;
  return open.filter((row) => row.regionId === regionId).length < REGION_CAP;
}

function accuracyOf(n: number): LegendAccuracy {
  return (['truth', 'half', 'false'] as const)[n % 3]!;
}

function rumourFor(label: string, accuracy: LegendAccuracy): string {
  if (accuracy === 'false') return `People talk about ${label}, but the trail is a story.`;
  if (accuracy === 'half') return `A story says ${label} is not what the name claims.`;
  return `${label} is where the story says it is.`;
}

function makeRow(args: {
  id: string;
  regionId: string;
  label: string;
  targetId: string;
  kind: LegendRecord['target']['kind'];
  level?: number;
  turn: number;
  day: number;
  origin: LegendRecord['origin'];
  salt: number;
}): LegendRecord {
  const accuracy = accuracyOf(args.salt);
  return {
    id: args.id,
    regionId: args.regionId,
    publicRumour: rumourFor(args.label, accuracy),
    accuracy,
    hiddenTruth: `${args.label} was placed by the engine.`,
    target: { kind: args.kind, id: args.targetId, label: args.label, ...(args.level != null ? { level: args.level } : {}) },
    status: 'rumour',
    links: [],
    createdTurn: args.turn,
    lastToldDay: args.day,
    origin: args.origin,
  };
}

/** A handful of legends at world generation, each aimed at a real settlement. */
export function seedWorldLegends(state: GameState): GameState {
  if ((state.legends ?? []).some((row) => row.origin === 'world')) return state;
  const settlements = state.worldAtlas?.settlements ?? [];
  const list = [...(state.legends ?? [])];
  const seen = new Set<string>();
  let added = 0;
  for (const place of settlements) {
    if (added >= 3) break;
    if (!place?.name || !place.regionId || seen.has(place.regionId)) continue;
    if (!canAdd(list, place.regionId)) continue;
    seen.add(place.regionId);
    const salt = hash32(`${state.seed ?? 'seed'}|world|${place.id}`);
    list.push(makeRow({
      id: `legend-world-${place.id}`.slice(0, 48),
      regionId: place.regionId,
      label: place.name,
      targetId: place.id,
      kind: 'place',
      turn: state.turn ?? 0,
      day: state.worldDay ?? 0,
      origin: 'world',
      salt,
    }));
    added += 1;
  }
  return added ? { ...state, legends: list } : state;
}

/** At most one legend per dungeon card. The target is a chest on that card, or the dungeon itself. */
export function attachDungeonLegend(state: GameState, site: DungeonLegendSite): GameState {
  const name = site.dungeonName?.trim();
  if (!name) return state;
  const id = `legend-dungeon-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;
  if ((state.legends ?? []).some((row) => row.id === id || row.target.id === id)) return state;
  const regionId = state.worldAtlas?.currentRegionId || 'dungeon';
  const list = [...(state.legends ?? [])];
  if (!canAdd(list, regionId)) return state;
  const chest = site.nodes.flatMap((node) => node.hidden?.lootables ?? []).find((row) => row.label?.trim());
  const area = site.areaLevel ?? 1;
  const salt = hash32(`${state.seed ?? 'seed'}|dungeon|${name}`);
  const label = chest?.label?.trim() || name;
  list.push(makeRow({
    id,
    regionId,
    label,
    targetId: chest?.id || id,
    kind: chest ? 'item' : 'dungeon',
    level: chest ? area + 8 : undefined,
    turn: state.turn ?? 0,
    day: state.worldDay ?? 0,
    origin: 'dungeon',
    salt,
  }));
  return { ...state, legends: list };
}

function regionFor(state: GameState, memory: NpcMemory): string | undefined {
  const loc = (memory.location || state.currentLocation || '').trim().toLowerCase();
  const place = (state.worldAtlas?.settlements ?? []).find((s) => s.name.toLowerCase() === loc || s.id.toLowerCase() === loc);
  return place?.regionId || state.worldAtlas?.currentRegionId;
}

function poolFor(state: GameState, memory: NpcMemory): LegendRecord[] {
  const region = regionFor(state, memory);
  return live(state.legends ?? []).filter((row) => !region || row.regionId === region);
}

/**
 * Learn legends in this person's region. An empty list is not "already taught".
 * Ids they already have stay. A legend that appears later in the registry is added.
 */
export function knowLegends(state: GameState, memory: NpcMemory): NpcMemory {
  const pool = poolFor(state, memory);
  const known = memory.knownLegendIds ?? [];
  if (!pool.length) return memory;
  if (!known.length) {
    const start = hash32(`${state.seed ?? 'seed'}|${memory.npcId}`) % pool.length;
    const ids = [pool[start]!.id];
    if (pool.length > 1) ids.push(pool[(start + 1) % pool.length]!.id);
    return { ...memory, knownLegendIds: ids };
  }
  const order = state.legends ?? [];
  const indexOf = (id: string) => order.findIndex((row) => row.id === id);
  const taughtIndex = Math.max(-1, ...known.map(indexOf));
  const newcomers = pool.filter((row) => !known.includes(row.id) && indexOf(row.id) > taughtIndex);
  if (!newcomers.length) return memory;
  return { ...memory, knownLegendIds: [...known, ...newcomers.map((row) => row.id)] };
}

/** Rumours that would appear on the sheet were told today. World day, not the turn counter. */
export function noteLegendsTold(state: GameState, presentIds: string[]): GameState {
  const day = state.worldDay ?? 0;
  const shown = new Set<string>();
  const byId = new Map((state.legends ?? []).map((row) => [row.id, row]));
  for (const id of presentIds) {
    const memory = (state.npcMemories ?? []).find((m) => m.npcId === id);
    for (const legendId of memory?.knownLegendIds ?? []) {
      if (shown.size >= SHEET_CAP || shown.has(legendId)) continue;
      const row = byId.get(legendId);
      if (!row || row.quiet) continue;
      shown.add(legendId);
    }
  }
  if (!shown.size) return state;
  let changed = false;
  const legends = (state.legends ?? []).map((row) => {
    if (!shown.has(row.id) || row.lastToldDay === day) return row;
    changed = true;
    return { ...row, lastToldDay: day };
  });
  return changed ? { ...state, legends } : state;
}

/** A long-quiet place rumour leaves the live list. A dungeon or item legend only goes quiet. */
export function retireQuietLegends(state: GameState): GameState {
  const day = state.worldDay ?? 0;
  const list = state.legends ?? [];
  if (!list.length) return state;
  const archive = [...(state.legendArchive ?? [])];
  const next = list.flatMap((row) => {
    const idle = row.status === 'rumour' && day - (row.lastToldDay ?? 0) >= QUIET_DAYS;
    if (!idle || row.quiet) return [row];
    if (row.target.kind === 'dungeon' || row.target.kind === 'item') return [{ ...row, quiet: true }];
    archive.push({ id: row.id, regionId: row.regionId, publicRumour: row.publicRumour, targetLabel: row.target.label });
    return [];
  });
  return { ...state, legends: next, legendArchive: archive };
}

export function sheetRumours(state: GameState, presentIds: string[]): { lines: string[]; labels: string[]; truths: string[] } {
  const byId = new Map((state.legends ?? []).map((row) => [row.id, row]));
  const lines: string[] = [];
  const labels: string[] = [];
  const truths: string[] = [];
  const seen = new Set<string>();
  for (const id of presentIds) {
    const memory = (state.npcMemories ?? []).find((m) => m.npcId === id);
    for (const legendId of memory?.knownLegendIds ?? []) {
      if (lines.length >= SHEET_CAP || seen.has(legendId)) continue;
      const row = byId.get(legendId);
      if (!row || row.quiet) continue;
      seen.add(legendId);
      lines.push(row.publicRumour);
      labels.push(row.target.label);
      if (row.status === 'found' || row.status === 'resolved') truths.push(row.hiddenTruth);
    }
  }
  return { lines, labels, truths };
}
