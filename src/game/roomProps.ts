/**
 * Room objects filed from the fact check the turn already ran.
 * No second model call and no noun list. Dungeon rooms keep their own list.
 */
import type { GameState, PlaceProp, Rarity, RoomPropKind } from './types';
import { regionBand } from './regionLevels';
import { tierToAreaLevel } from './placeAuthority';
import type { MapNode } from './mapEngine';
import { SRD_ARMOR, SRD_WEAPONS } from './rules/srdGear';
import { ITEM_COST_CP } from './rules/coins';
import { MAGIC_ITEMS } from './rules/magicItems';

/** Same words the warden already blocks on an item-gain. Not a new list. */
export const HIGH_TIER_ITEM_WORDS = /\b(legendary|mythic|artifact|relic|unique|god(?:like)?|excalibur|vorpal|holy avenger)\b/i;

const KINDS = new Set<RoomPropKind>(['furniture', 'armour', 'weapon', 'tool', 'coin', 'object', 'other']);
const MOUNTS = new Set(['fixed', 'hung', 'loose']);
const CAP = 24;

export interface FactObjectTag {
  label: string;
  kind: RoomPropKind;
  mount: 'fixed' | 'hung' | 'loose';
  owner: string;
}

export interface FactObjectNote {
  text: string;
  speech?: boolean;
  writing?: boolean;
  kept: boolean;
  objects: FactObjectTag[];
}

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isHighTierItemName(name: string): boolean {
  return new RegExp(HIGH_TIER_ITEM_WORDS.source, 'i').test(name);
}

export function stripGloryWords(label: string): string {
  return label
    .replace(new RegExp(HIGH_TIER_ITEM_WORDS.source, 'gi'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Same placing verbs as the opening card. A new regex each call, so lastIndex cannot stick. */
const PLACED_VERBS = 'sits|sat|hangs|hung|lies|lay|rests|rested|waits|waited|stands|stood|leans|leaned';

export function placedPropLabels(page: string): string[] {
  const out: string[] = [];
  const re = new RegExp(
    `\\b(?:a|an)\\s+((?:[a-z][a-z'’-]+\\s+){0,2}?[a-z][a-z'’-]{2,}(?:\\s+of\\s+[a-z][a-z'’-]{2,})?)\\s+(?:${PLACED_VERBS})\\b`,
    'gi',
  );
  let match: RegExpExecArray | null;
  while ((match = re.exec(page))) {
    const label = (match[1] ?? '').toLowerCase().trim();
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

function catalogueHead(name: string): string {
  const beforeComma = name.toLowerCase().replace(/armour/g, 'armor').replace(/[’‘]/g, "'").split(',')[0]!.trim();
  const beforeOf = beforeComma.split(/\s+of\s+/)[0]!.trim();
  return beforeOf.split(/[^a-z0-9']+/).filter((w) => w.length >= 3).at(-1) ?? '';
}

function headMatches(head: string, name: string): boolean {
  const cat = catalogueHead(name);
  if (!cat || !head) return false;
  if (cat === head) return true;
  return cat.endsWith(head) && cat.length > head.length && head.length >= 4;
}

/** Kind of a placed noun's head, or null when no weapon, armour, or equipment table names it. */
export function placedNounKind(label: string): RoomPropKind | null {
  const head = catalogueHead(label);
  if (!head) return null;
  if (Object.keys(SRD_WEAPONS).some((name) => headMatches(head, name))) return 'weapon';
  if (Object.keys(SRD_ARMOR).some((name) => headMatches(head, name))) return 'armour';
  const gear = [...Object.keys(ITEM_COST_CP), ...Object.keys(MAGIC_ITEMS)];
  if (gear.some((name) => headMatches(head, name))) return 'tool';
  return null;
}

export function tagsFromPlacedSpan(text: string): FactObjectTag[] {
  const re = new RegExp(
    `\\b(?:a|an)\\s+((?:[a-z][a-z'’-]+\\s+){0,2}?[a-z][a-z'’-]{2,}(?:\\s+of\\s+[a-z][a-z'’-]{2,})?)\\s+(${PLACED_VERBS})\\b`,
    'gi',
  );
  const out: FactObjectTag[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const label = (match[1] ?? '').toLowerCase().trim();
    const verb = (match[2] ?? '').toLowerCase();
    const kind = placedNounKind(label);
    if (!kind || out.some((tag) => tag.label === label)) continue;
    const hung = verb === 'hangs' || verb === 'hung';
    const carried = kind === 'weapon' || kind === 'tool' || kind === 'coin';
    const mount: FactObjectTag['mount'] = carried ? (hung ? 'hung' : 'loose') : 'fixed';
    out.push({ label, kind, mount, owner: 'place' });
  }
  return out;
}

function flagsFor(kind: RoomPropKind, mount: 'fixed' | 'hung' | 'loose'): { fixed: boolean; takeable: boolean } {
  if (kind === 'furniture') return { fixed: true, takeable: false };
  if (kind === 'armour') return mount === 'loose' ? { fixed: false, takeable: true } : { fixed: true, takeable: false };
  if (kind === 'weapon') return mount === 'fixed' ? { fixed: true, takeable: false } : { fixed: false, takeable: true };
  if (kind === 'tool' || kind === 'coin') return mount === 'fixed' ? { fixed: true, takeable: false } : { fixed: false, takeable: true };
  return { fixed: true, takeable: false };
}

function labelInSpan(label: string, span: string): boolean {
  const hay = span.toLowerCase();
  const words = label.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length >= 3);
  return words.length > 0 && words.every((w) => hay.includes(w));
}

function bandOf(state: GameState): { low: number; high: number } {
  const dungeon = state.activeDungeon;
  if (dungeon) {
    const level = dungeon.areaLevel ?? (dungeon.dangerTier ? tierToAreaLevel(dungeon.dangerTier) : null);
    if (typeof level === 'number' && Number.isFinite(level)) {
      const n = Math.max(1, Math.round(level));
      return { low: n, high: n };
    }
  }
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  const place = (state.places ?? []).find((p) => p.name?.toLowerCase() === here || p.id?.toLowerCase() === here);
  const regionId = place?.regionId
    ?? state.worldAtlas?.settlements?.find((s) => s.name?.toLowerCase() === here)?.regionId;
  if (regionId) {
    const band = regionBand(state, regionId);
    return { low: band.low, high: band.high };
  }
  return { low: 1, high: 3 };
}

function rarityFor(low: number, high: number, salt: number): Rarity {
  const mid = (low + high) / 2;
  if (high <= 3 || mid <= 3) return 'Common';
  if (mid >= 16 || high >= 20) return salt % 2 === 0 ? 'Rare' : 'Epic';
  return salt % 2 === 0 ? 'Uncommon' : 'Rare';
}

export function propStats(state: GameState, placeKey: string, label: string): { level: number; rarity: Rarity } {
  const band = bandOf(state);
  const span = Math.max(0, band.high - band.low);
  const salt = hash32(`${state.seed ?? 'seed'}|${placeKey}|${label}`);
  const level = band.low + (span ? salt % (span + 1) : 0);
  return { level, rarity: rarityFor(band.low, band.high, salt) };
}

function currentNode(state: GameState): MapNode | undefined {
  const d = state.activeDungeon;
  if (!d) return undefined;
  return d.nodes.find((n) => n.id === d.currentNodeId);
}

function seededLootLabel(node: MapNode | undefined, label: string): boolean {
  const key = label.trim().toLowerCase();
  if (!key || !node?.hidden) return false;
  const loot = (node.hidden.lootables ?? []).some((l) => l.label.trim().toLowerCase() === key);
  const loose = (node.hidden.looseItems ?? []).some((l) => l.label.trim().toLowerCase() === key);
  return loot || loose;
}

export function sheetPropLabels(props: PlaceProp[]): string[] {
  const takeable = props.filter((p) => p.takeable && !p.summary);
  const fixed = props.filter((p) => !p.takeable && !p.summary);
  const ordered = [...takeable].sort((a, b) => b.turn - a.turn);
  return [...ordered, ...fixed].slice(0, 6).map((p) => p.label);
}

function foldToCap(props: PlaceProp[]): PlaceProp[] {
  const fixed = props.filter((p) => p.fixed && !p.summary);
  const loose = props.filter((p) => !p.fixed && !p.summary);
  const prior = props.find((p) => p.summary);
  const overflow = Math.max(0, fixed.length + loose.length - CAP);
  const folded = loose.slice(0, overflow);
  const kept = loose.slice(overflow);
  const names = [...(prior?.folded ?? []), ...folded.map((p) => p.label)];
  const out = [...fixed, ...kept];
  if (names.length) {
    out.push({
      label: 'other small things along the wall',
      owner: 'place',
      fixed: true,
      takeable: false,
      level: 1,
      rarity: 'Common',
      turn: folded.at(-1)?.turn ?? prior?.turn ?? 0,
      kind: 'other',
      summary: true,
      folded: names,
    });
  }
  return out;
}

function ownerId(state: GameState, owner: string): string {
  const name = owner.trim();
  if (!name || name.toLowerCase() === 'place') return 'place';
  const mem = (state.npcMemories ?? []).find((m) => (m.npcName ?? '').toLowerCase() === name.toLowerCase());
  return mem?.npcId || name;
}

function placeKey(state: GameState): string {
  const node = currentNode(state);
  if (state.activeDungeon && node) return `${state.activeDungeon.dungeonName}|${node.id}`;
  return state.currentLocation ?? 'place';
}

export function readObjectTag(raw: unknown): FactObjectTag | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as { label?: unknown; kind?: unknown; mount?: unknown; owner?: unknown };
  const label = typeof row.label === 'string' ? row.label.replace(/\s+/g, ' ').trim() : '';
  const kind = String(row.kind ?? '') as RoomPropKind;
  const mount = String(row.mount ?? '') as FactObjectTag['mount'];
  const owner = typeof row.owner === 'string' && row.owner.trim() ? row.owner.trim() : 'place';
  if (!label || !KINDS.has(kind) || !MOUNTS.has(mount)) return null;
  return { label, kind, mount, owner };
}

function writeProps(state: GameState, props: PlaceProp[]): GameState {
  const facts = state.sceneFacts;
  let next: GameState = facts ? { ...state, sceneFacts: { ...facts, roomProps: props } } : state;
  const dungeon = state.activeDungeon;
  const node = currentNode(state);
  if (dungeon && node) {
    next = {
      ...next,
      activeDungeon: {
        ...dungeon,
        nodes: dungeon.nodes.map((n) => (n.id === node.id ? { ...n, roomProps: props } : n)),
      },
    };
  }
  return next;
}

export function currentRoomProps(state: GameState): PlaceProp[] {
  const node = currentNode(state);
  if (state.activeDungeon && node) return [...(node.roomProps ?? state.sceneFacts?.roomProps ?? [])];
  return [...(state.sceneFacts?.roomProps ?? [])];
}

/** Show another dungeon room's filed props. The previous room keeps what it had. */
export function focusDungeonRoom(state: GameState, nodeId: string): GameState {
  const dungeon = state.activeDungeon;
  if (!dungeon) return state;
  const node = dungeon.nodes.find((n) => n.id === nodeId);
  if (!node) return state;
  const next = {
    ...dungeon,
    currentNodeId: nodeId,
    visitedNodeIds: Array.from(new Set([...dungeon.visitedNodeIds, nodeId])),
  };
  return {
    ...state,
    activeDungeon: next,
    sceneFacts: state.sceneFacts ? { ...state.sceneFacts, roomProps: [...(node.roomProps ?? [])] } : state.sceneFacts,
  };
}

export function fileKeptRoomProps(state: GameState, notes: FactObjectNote[]): GameState {
  let props = currentRoomProps(state);
  const node = currentNode(state);
  const turn = state.turn ?? 0;
  for (const note of notes) {
    if (!note.kept || note.speech || note.writing) continue;
    for (const tag of note.objects) {
      const label = stripGloryWords(tag.label);
      if (!label || !labelInSpan(label, note.text) || seededLootLabel(node, label)) continue;
      if (props.some((p) => !p.summary && p.label.toLowerCase() === label.toLowerCase())) continue;
      const flag = flagsFor(tag.kind, tag.mount);
      const stats = propStats(state, placeKey(state), label);
      props.push({
        label,
        owner: ownerId(state, tag.owner),
        fixed: flag.fixed,
        takeable: flag.takeable,
        level: stats.level,
        rarity: stats.rarity,
        turn,
        kind: tag.kind,
      });
    }
  }
  props = foldToCap(props);
  let next = writeProps(state, props);
  if (!state.activeDungeon && next.sceneFacts) {
    const labels = props.filter((p) => !p.summary).map((p) => p.label);
    const have = new Set((next.sceneFacts.props ?? []).map((p) => p.toLowerCase()));
    const added = labels.filter((l) => !have.has(l.toLowerCase()));
    if (added.length) next = { ...next, sceneFacts: { ...next.sceneFacts, props: [...next.sceneFacts.props, ...added] } };
  }
  return next;
}

function namesMatch(label: string, needle: string): boolean {
  if (label === needle) return true;
  return ` ${label} `.includes(` ${needle} `) || ` ${needle} `.includes(` ${label} `);
}

export function sealedLootName(state: GameState, item: string): boolean {
  const needle = item.trim().toLowerCase();
  const node = currentNode(state);
  if (!needle || !node?.hidden) return false;
  return (node.hidden.lootables ?? []).some((l) => namesMatch(l.label.trim().toLowerCase(), needle));
}

export function matchRoomProp(state: GameState, item: string): PlaceProp | undefined {
  const needle = item.trim().toLowerCase();
  if (!needle) return undefined;
  const props = currentRoomProps(state).filter((p) => !p.summary);
  return props.find((p) => p.label.toLowerCase() === needle)
    ?? props.find((p) => namesMatch(p.label.toLowerCase(), needle));
}

export function removeRoomProp(state: GameState, label: string): GameState {
  const key = label.trim().toLowerCase();
  const props = currentRoomProps(state).filter((p) => p.label.toLowerCase() !== key);
  let next = writeProps(state, props);
  if (next.sceneFacts) {
    next = {
      ...next,
      sceneFacts: {
        ...next.sceneFacts,
        props: (next.sceneFacts.props ?? []).filter((p) => p.toLowerCase() !== key),
      },
    };
    const placeId = next.sceneFacts.propsPlace || next.currentLocation;
    if (placeId && next.places) {
      next = {
        ...next,
        places: next.places.map((p) => {
          const here = p.name?.toLowerCase() === placeId.toLowerCase() || p.id?.toLowerCase() === placeId.toLowerCase();
          if (!here || !p.roomProps) return p;
          return { ...p, roomProps: p.roomProps.filter((prop) => prop.label.toLowerCase() !== key), props: (p.props ?? []).filter((n) => n.toLowerCase() !== key) };
        }),
      };
    }
  }
  return next;
}
