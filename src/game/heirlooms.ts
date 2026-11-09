/**
 * One heirloom roll when a durable NPC's sheet is first saved.
 * Speech does not create one. Roster people do not roll.
 */
import type { GameState, HeirloomReason, NpcHeirloom, NpcMemory, Rarity } from './types';
import { ensureRegionBands, regionBand } from './regionLevels';
import { WORLD_MAX_CREATURE_LEVEL } from './rules/wildlifeConfig';

const REASONS: HeirloomReason[] = ['retired-higher-band', 'family-relic', 'war-trophy', 'temple-charge'];

const DURABLE = /\b(sheriff|priest|cleric|veteran|retired|keeper|innkeeper|jailer|artisan|quartermaster|ruler|mentor|gatekeeper)\b/i;
const PASSER = /\b(courier|refugee|herald|bandit|outlaw|prisoner)\b/i;

const LABELS: Record<HeirloomReason, string> = {
  'retired-higher-band': 'old campaign blade',
  'family-relic': 'family blade',
  'war-trophy': 'war trophy blade',
  'temple-charge': 'temple blade',
};

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function heirloomDraw(seed: string, npcId: string): { hit: boolean; reason: HeirloomReason } {
  const n = hash32(`${seed}|${npcId}`);
  return { hit: n % 12 === 0, reason: REASONS[Math.floor(n / 12) % REASONS.length]! };
}

export function isDurableRole(job: string, hint?: string, place?: string): boolean {
  const hay = `${job} ${hint ?? ''}`;
  if (PASSER.test(job) && !DURABLE.test(hint ?? '')) return false;
  if (place === 'road' && !DURABLE.test(hay)) return false;
  return DURABLE.test(hay);
}

export function settlementId(state: GameState, location?: string | null): string {
  const here = (location ?? state.currentLocation ?? '').trim().toLowerCase();
  const place = (state.places ?? []).find((p) => p.name?.toLowerCase() === here || p.id?.toLowerCase() === here);
  if (place?.parentHub) return place.parentHub;
  return place?.id || here || 'wild';
}

function localBand(state: GameState, location?: string | null): { low: number; high: number } {
  const here = (location ?? state.currentLocation ?? '').trim().toLowerCase();
  const place = (state.places ?? []).find((p) => p.name?.toLowerCase() === here || p.id?.toLowerCase() === here);
  const regionId = place?.regionId
    ?? state.worldAtlas?.settlements?.find((s) => s.name?.toLowerCase() === here)?.regionId;
  if (!regionId) return { low: 1, high: 3 };
  const band = regionBand(state, regionId);
  return { low: band.low, high: band.high };
}

function farBand(state: GameState): { low: number; high: number } {
  const bands = ensureRegionBands(state).regionLevelBands ?? {};
  let best: { low: number; high: number } | null = null;
  for (const band of Object.values(bands)) {
    if (!best || band.high > best.high) best = { low: band.low, high: band.high };
  }
  return best ?? { low: 12, high: WORLD_MAX_CREATURE_LEVEL };
}

function rarityFor(level: number, salt: number): Rarity {
  if (level <= 3) return 'Common';
  if (level >= 16) return salt % 2 === 0 ? 'Rare' : 'Epic';
  return salt % 2 === 0 ? 'Uncommon' : 'Rare';
}

function levelFor(reason: HeirloomReason, state: GameState, location: string | null | undefined, salt: number): number {
  const local = localBand(state, location);
  if (reason === 'retired-higher-band') return farBand(state).high;
  if (reason === 'temple-charge') {
    const width = Math.max(1, local.high - local.low + 1);
    return Math.min(WORLD_MAX_CREATURE_LEVEL, local.high + width);
  }
  const span = Math.max(0, local.high - local.low);
  return local.low + (span ? salt % (span + 1) : 0);
}

function settlementTaken(state: GameState, settlement: string, exceptId?: string): boolean {
  return (state.npcMemories ?? []).some((m) => m.npcId !== exceptId && m.heirloom?.settlementId === settlement);
}

/** First save only. Returns the same memory when the roll misses, the role is not durable, or the settlement already has one. */
export function maybeGrantHeirloom(state: GameState, memory: NpcMemory, location?: string | null): NpcMemory {
  if (memory.heirloom || memory.listedSignature) return memory;
  const job = memory.sheet?.job ?? '';
  const place = memory.sheet?.place;
  if (!isDurableRole(job, memory.roleHint, place)) return memory;
  const draw = heirloomDraw(state.seed ?? 'seed', memory.npcId);
  if (!draw.hit) return memory;
  const settlement = settlementId(state, location ?? memory.location ?? state.currentLocation);
  if (settlementTaken(state, settlement, memory.npcId)) return memory;
  const salt = hash32(`${state.seed ?? 'seed'}|${memory.npcId}|level`);
  const level = levelFor(draw.reason, state, location ?? memory.location ?? state.currentLocation, salt);
  const heirloom: NpcHeirloom = {
    label: LABELS[draw.reason],
    reason: draw.reason,
    level,
    rarity: rarityFor(level, salt),
    holderId: memory.npcId,
    settlementId: settlement,
  };
  return { ...memory, heirloom };
}

function holdsNamedItem(memory: NpcMemory, needle: string): boolean {
  const held = memory.heirloom;
  if (!held || held.holderId !== memory.npcId) return false;
  const label = held.label.toLowerCase();
  return label === needle || ` ${label} `.includes(` ${needle} `) || ` ${needle} `.includes(` ${label} `);
}

function ownerIsPresent(state: GameState, memory: NpcMemory): boolean {
  return (state.sceneFacts?.present ?? []).some((name) => name.toLowerCase() === memory.npcName.toLowerCase());
}

export function heirloomOwnerPresent(state: GameState, item: string): NpcMemory | undefined {
  const needle = item.trim().toLowerCase();
  if (!needle) return undefined;
  return (state.npcMemories ?? []).find((m) => holdsNamedItem(m, needle) && ownerIsPresent(state, m));
}

/** The owner still has it, and they are not in the room. */
export function heirloomHeldAway(state: GameState, item: string): NpcMemory | undefined {
  const needle = item.trim().toLowerCase();
  if (!needle) return undefined;
  return (state.npcMemories ?? []).find((m) => holdsNamedItem(m, needle) && !ownerIsPresent(state, m));
}

export function lootHeirloomOf(state: GameState, deadName: string): GameState {
  const key = deadName.trim().toLowerCase();
  if (!key) return state;
  const memory = (state.npcMemories ?? []).find((m) => m.npcName.toLowerCase() === key && m.heirloom?.holderId === m.npcId);
  if (!memory) return state;
  return transferHeirloom(state, memory.npcId, 'loot');
}

export type HeirloomTransfer = 'steal' | 'gift' | 'trade' | 'loot';

/** Engine-recorded change of hands. Speech never calls this. */
export function transferHeirloom(state: GameState, npcId: string, how: HeirloomTransfer): GameState {
  const memory = (state.npcMemories ?? []).find((m) => m.npcId === npcId && m.heirloom?.holderId === m.npcId);
  if (!memory?.heirloom) return state;
  const item = memory.heirloom;
  const memories = (state.npcMemories ?? []).map((m) =>
    m.npcId === npcId ? { ...m, heirloom: { ...item, holderId: 'player' } } : m,
  );
  const id = `heirloom-${npcId}`.slice(0, 40);
  const inventory = [
    ...(state.inventory ?? []),
    { id, name: item.label, quantity: 1, equipped: false, rarity: item.rarity, itemLevel: item.level },
  ];
  const rev = Math.max(0, state.ledgerRevision ?? 0);
  const turn = state.turn ?? 0;
  const stateTxLog = [
    ...(state.stateTxLog ?? []),
    {
      id: `heirloom-${rev}-${turn}`,
      rev,
      turn,
      kind: 'other' as const,
      summary: `Heirloom ${how}: ${item.label}`.slice(0, 160),
      entity: item.label,
      why: `${memory.npcName} no longer holds it (${item.reason})`,
      createdAt: Date.now(),
    },
  ].slice(-80);
  return { ...state, npcMemories: memories, inventory, stateTxLog, ledgerRevision: rev + 1 };
}
