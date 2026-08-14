import type { ActiveDungeonState, MapNode, NodeHidden } from './mapEngine';
import type { LocationInteractable, LocationSheet, MapTier, Rarity } from './types';
import { createHashRng } from './seededRng';

export type { NodeHidden };
export type MobRole = 'trash' | 'elite' | 'miniBoss' | 'boss';

export interface HiddenLoot {
  /** Code-rolled before reveal — LLM must not change this. */
  rarity: Rarity;
  qty: number;
  gold?: number;
  /** Optional flavor hint; GM invents the final item name on open. */
  itemHint?: string;
  /** Key into GameState.lootPity for dry-streak tracking. */
  pityKey?: string;
}

const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

/** Pack 1 weight tables (cumulative %): Common → Legendary. T1 Legendary = 0%. */
const RARITY_CUMULATIVE: number[][] = [
  [70, 92, 99, 100, 100], // T1: 70/22/7/1/0
  [50, 80, 95, 99, 100], // T2: 50/30/15/4/1
  [30, 62, 87, 97, 100], // T3: 30/32/25/10/3
  [15, 40, 70, 90, 100], // T4: 15/25/30/20/10
];

export const PITY_THRESHOLDS: Record<1 | 2 | 3 | 4, number> = {
  1: 50,
  2: 30,
  3: 20,
  4: 10,
};

function isEpicPlus(r: Rarity): boolean {
  return r === 'Epic' || r === 'Legendary';
}

/** Tier-weighted rarity: Pack 1 curves. */
export function rollLootRarity(tier: MapTier | number, rng: () => number): Rarity {
  const t = Math.max(1, Math.min(4, Math.floor(Number(tier) || 1))) as 1 | 2 | 3 | 4;
  const cuts = RARITY_CUMULATIVE[t - 1]!;
  const roll = rng() * 100;
  for (let i = 0; i < cuts.length; i++) {
    if (roll < cuts[i]!) return RARITIES[i]!;
  }
  return 'Common';
}

/** Soft pity: from 80% of threshold, +5% Epic+ chance per extra dry chest. */
export function rollLootRarityWithPity(
  tier: MapTier | number,
  rng: () => number,
  pityCount: number
): { rarity: Rarity; pityTriggered: boolean; nextPity: number } {
  const t = Math.max(1, Math.min(4, Math.floor(Number(tier) || 1))) as 1 | 2 | 3 | 4;
  const threshold = PITY_THRESHOLDS[t];
  const softStart = Math.floor(threshold * 0.8);

  if (pityCount >= threshold) {
    // Force Epic+ using tier's Epic/Legendary relative weights
    const epicCut = t === 1 ? 100 : t === 2 ? 80 : t === 3 ? 77 : 67; // of Epic+ band
    const r = rng() * 100 < epicCut ? 'Epic' : t === 1 ? 'Epic' : 'Legendary';
    return { rarity: r, pityTriggered: true, nextPity: 0 };
  }

  let rarity = rollLootRarity(t, rng);
  if (pityCount >= softStart && !isEpicPlus(rarity)) {
    const boost = (pityCount - softStart + 1) * 5;
    if (rng() * 100 < boost) {
      rarity = rollLootRarity(t, rng);
      // Second chance only into Epic+
      if (!isEpicPlus(rarity)) {
        rarity = t >= 4 && rng() < 0.33 ? 'Legendary' : 'Epic';
      }
    }
  }

  return {
    rarity,
    pityTriggered: false,
    nextPity: isEpicPlus(rarity) ? 0 : pityCount + 1,
  };
}

function nodeTags(node: MapNode): string[] {
  return (node.tags ?? []).map((t) => t.toLowerCase());
}

function isBossNode(node: MapNode, dungeon: ActiveDungeonState): boolean {
  if (dungeon.dungeonRules?.bossNode === node.id) return true;
  return nodeTags(node).some((t) => t === 'boss' || t === 'boss_room');
}

function buildHiddenForNode(
  node: MapNode,
  dungeon: ActiveDungeonState,
  seed: string,
  index: number,
  total: number
): NodeHidden {
  const rng = createHashRng(seed, dungeon.blueprintId, dungeon.dungeonName, node.id, 'hidden');
  const tags = nodeTags(node);
  const traps: NodeHidden['traps'] = [];
  const lootables: NodeHidden['lootables'] = [];
  const secrets: NodeHidden['secrets'] = [];
  const mobs: NodeHidden['mobs'] = [];
  const tier = dungeon.tier;
  const level = Math.max(1, Math.round(tier * 2 + (index / Math.max(1, total)) * 2));

  const lootable =
    tags.includes('lootable') ||
    tags.includes('treasure') ||
    tags.includes('cache') ||
    (tags.includes('control') && rng() < 0.55) ||
    (index === total - 1 && rng() < 0.7);

  const hazardous =
    tags.includes('hazard') || tags.includes('trap') || (lootable && rng() < 0.35);

  if (hazardous) {
    traps.push({
      id: `${node.id}_trap`,
      dc: 10 + tier + Math.floor(rng() * 4),
      skillHint: rng() < 0.5 ? 'perception' : 'thievery',
      damage: 2 + tier + Math.floor(rng() * 4),
      revealed: false,
      disarmed: false,
    });
  }

  if (lootable) {
    const pityKey = `${dungeon.blueprintId}:${node.id}`;
    // Seed-time roll uses base table; pity applies at open time via rollLootRarityWithPity.
    const rarity = rollLootRarity(tier, rng);
    const trapId = traps[0]?.id;
    lootables.push({
      id: `${node.id}_chest`,
      label: tags.includes('control') ? 'Locked Console Cache' : 'Stash Cache',
      opened: false,
      loot: {
        rarity,
        qty: 1,
        gold: rarity === 'Common' ? Math.floor(rng() * 8) : Math.floor(5 + rng() * tier * 12),
        itemHint:
          rarity === 'Legendary'
            ? 'signature gear for this site'
            : rarity === 'Epic' || rarity === 'Rare'
              ? 'notable equipment'
              : 'salvageable gear or supplies',
        pityKey,
      },
      trapId,
    });
  }

  if (tags.includes('secret') || node.isSecret || (index > 0 && rng() < 0.18)) {
    secrets.push({
      id: `${node.id}_secret`,
      clue: 'A seam in the wall / false panel / side crawl',
      revealed: false,
    });
  }

  if (isBossNode(node, dungeon) || index === total - 1) {
    mobs.push({
      id: `${node.id}_boss`,
      name: `${dungeon.dungeonName} Guardian`,
      level: level + 2,
      role: 'boss',
      spawned: false,
    });
  } else if (tags.includes('elite') || (index > 1 && rng() < 0.22)) {
    mobs.push({
      id: `${node.id}_elite`,
      name: 'Elite Defender',
      level: level + 1,
      role: 'elite',
      spawned: false,
    });
  } else if (!tags.includes('entry') && rng() < 0.45) {
    mobs.push({
      id: `${node.id}_pack`,
      name: 'Site Hostiles',
      level,
      role: index > total / 2 && rng() < 0.3 ? 'miniBoss' : 'trash',
      spawned: false,
    });
  }

  return { traps, lootables, secrets, mobs };
}

/** Ensure every node has engine-side hidden truth (idempotent if already seeded). */
export function seedDungeonState(
  dungeon: ActiveDungeonState,
  seed: string
): ActiveDungeonState {
  const total = dungeon.nodes.length;
  const nodes = dungeon.nodes.map((node, index) => {
    if (node.hidden) return node;
    return {
      ...node,
      hidden: buildHiddenForNode(node, dungeon, seed, index, total),
    };
  });

  let bossNode = dungeon.dungeonRules?.bossNode;
  if (!bossNode && nodes.length) {
    bossNode = nodes[nodes.length - 1].id;
  }

  return {
    ...dungeon,
    nodes,
    dungeonRules: {
      ...dungeon.dungeonRules,
      bossNode,
      hazard: dungeon.dungeonRules?.hazard,
    },
  };
}

export function currentDungeonNode(dungeon: ActiveDungeonState | null | undefined): MapNode | null {
  if (!dungeon) return null;
  return dungeon.nodes.find((n) => n.id === dungeon.currentNodeId) ?? null;
}

/** Player-visible interactables from seeded hidden (no rarity/trap truth). */
export function interactablesFromNode(node: MapNode | null): LocationInteractable[] {
  if (!node?.hidden) return [];
  const out: LocationInteractable[] = [];
  for (const loot of node.hidden.lootables) {
    out.push({
      id: loot.id,
      name: loot.label,
      state: loot.opened ? 'opened' : 'closed',
      kind: 'chest',
      revealed: true,
      lootableId: loot.id,
    });
  }
  for (const secret of node.hidden.secrets) {
    if (!secret.revealed) continue;
    out.push({
      id: secret.id,
      name: secret.clue || 'Secret passage',
      state: 'revealed',
      kind: 'secret',
      revealed: true,
    });
  }
  return out;
}

export function mergeSheetWithNode(
  sheet: LocationSheet,
  node: MapNode | null
): LocationSheet {
  const fromNode = interactablesFromNode(node);
  if (!fromNode.length) return sheet;
  const byId = new Map(sheet.interactables.map((i) => [i.id, i]));
  for (const it of fromNode) byId.set(it.id, it);
  return { ...sheet, interactables: Array.from(byId.values()) };
}

/**
 * GM-only ledger for the current room. Rarity is authoritative — narrate on open,
 * never invent a different tier.
 */
export function formatHiddenRoomLedger(
  dungeon: ActiveDungeonState | null | undefined
): string {
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return '';
  const h = node.hidden;
  const lines: string[] = [
    `HIDDEN ROOM LEDGER @ ${node.name} (ENGINE AUTHORITY — narrate when revealed; do not invent alternate loot tiers, traps, or bosses):`,
  ];
  for (const loot of h.lootables) {
    lines.push(
      loot.opened
        ? `- Lootable "${loot.label}" (${loot.id}): already opened`
        : `- Lootable "${loot.label}" (${loot.id}): CLOSED. On open emit <item-gain name="FittingName" rarity="${loot.loot.rarity}" qty="${loot.loot.qty}" /> — rarity MUST be ${loot.loot.rarity} (code-rolled). Hint: ${loot.loot.itemHint ?? 'site-appropriate gear'}.${loot.loot.gold ? ` Optional gold ~${loot.loot.gold}.` : ''}${loot.trapId ? ` May be trapped (${loot.trapId}).` : ''}`
    );
  }
  for (const trap of h.traps) {
    lines.push(
      `- Trap ${trap.id}: DC ${trap.dc} (${trap.skillHint})${trap.damage ? ` dmg~${trap.damage}` : ''} — revealed=${trap.revealed} disarmed=${trap.disarmed}`
    );
  }
  for (const secret of h.secrets) {
    lines.push(
      `- Secret ${secret.id}: revealed=${secret.revealed}${secret.clue ? ` clue="${secret.clue}"` : ''}`
    );
  }
  for (const mob of h.mobs) {
    lines.push(
      `- Mob ${mob.name} (${mob.role} L${mob.level}) id=${mob.id} spawned=${mob.spawned}`
    );
  }
  if (lines.length === 1) return '';
  return lines.join('\n');
}

/** Mark matching lootable opened; return the code-rolled loot if found. */
export function openLootableInDungeon(
  dungeon: ActiveDungeonState,
  lootableIdOrLabel: string
): { dungeon: ActiveDungeonState; loot: HiddenLoot | null; label: string | null } {
  const key = lootableIdOrLabel.trim().toLowerCase();
  let found: HiddenLoot | null = null;
  let label: string | null = null;
  const nodes = dungeon.nodes.map((node) => {
    if (!node.hidden) return node;
    const lootables = node.hidden.lootables.map((loot) => {
      if (loot.opened) return loot;
      if (loot.id.toLowerCase() === key || loot.label.toLowerCase() === key) {
        found = loot.loot;
        label = loot.label;
        return { ...loot, opened: true };
      }
      return loot;
    });
    return { ...node, hidden: { ...node.hidden, lootables } };
  });
  return { dungeon: { ...dungeon, nodes }, loot: found, label };
}

function rarityRank(r: Rarity): number {
  return RARITIES.indexOf(r);
}

function maxRarity(a: Rarity, b: Rarity): Rarity {
  return rarityRank(a) >= rarityRank(b) ? a : b;
}

function bumpBand(r: Rarity, bands = 1): Rarity {
  const i = Math.min(RARITIES.length - 1, rarityRank(r) + bands);
  return RARITIES[i]!;
}

function runFloorRarity(tier: 1 | 2 | 3 | 4): Rarity {
  return tier >= 4 ? 'Epic' : 'Rare';
}

export type LootSource = 'random' | 'quest' | 'story' | 'key' | 'boss';

export interface ResolveLootOptions {
  pity?: { byTier?: Partial<Record<1 | 2 | 3 | 4, number>> } | null;
  seed?: string;
  /** Quest/key/story — bypass RNG; use claim or Rare floor. */
  source?: LootSource | string | null;
  claimedRarity?: string | null;
  /** Tutorial first chest: floor Uncommon. */
  firstChestUncommonBias?: boolean;
}

/** Prefer seeded rarity when an item-gain matches a closed/open lootable this turn. */
export function resolveSeededRarity(
  dungeon: ActiveDungeonState | null | undefined,
  _itemName: string,
  claimed?: string | null,
  pityOrOpts?: { byTier?: Partial<Record<1 | 2 | 3 | 4, number>> } | null | ResolveLootOptions,
  seedArg = 'seed'
): {
  rarity: Rarity | null;
  pityTriggered: boolean;
  nextPity?: number;
  tier?: 1 | 2 | 3 | 4;
  bossFirstClear?: boolean;
  runFloorApplied?: boolean;
  dungeonPatch?: Partial<ActiveDungeonState>;
} {
  const opts: ResolveLootOptions =
    pityOrOpts && typeof pityOrOpts === 'object' && ('source' in pityOrOpts || 'firstChestUncommonBias' in pityOrOpts || 'claimedRarity' in pityOrOpts || 'pity' in pityOrOpts)
      ? (pityOrOpts as ResolveLootOptions)
      : { pity: pityOrOpts as { byTier?: Partial<Record<1 | 2 | 3 | 4, number>> } | null, seed: seedArg, claimedRarity: claimed };

  const pity = opts.pity;
  const seed = opts.seed ?? seedArg;
  const source = (opts.source || '').toLowerCase();
  const claim = (opts.claimedRarity ?? claimed || '').trim();

  // Non-random paths bypass table rolls.
  if (source === 'quest' || source === 'story' || source === 'key') {
    const forced =
      claim && RARITIES.includes(claim as Rarity)
        ? (claim as Rarity)
        : source === 'key'
          ? 'Rare'
          : 'Uncommon';
    return { rarity: forced, pityTriggered: false };
  }

  const node = currentDungeonNode(dungeon);
  const tier = (dungeon?.dangerTier ?? dungeon?.tier ?? 1) as 1 | 2 | 3 | 4;
  const dungeonPatch: Partial<ActiveDungeonState> = {};

  if (node?.hidden?.lootables?.length) {
    const closed = node.hidden.lootables.find((l) => !l.opened);
    const target = closed ?? node.hidden.lootables[0];
    if (!target) return { rarity: null, pityTriggered: false };

    const onBoss = dungeon ? isBossNode(node, dungeon) : false;
    const bossFirst = !!(onBoss && dungeon?.bossFirstClearPending);
    const needRunFloor = !!(dungeon && !dungeon.runFloorMet);
    const closedLeft = node.hidden.lootables.filter((l) => !l.opened).length;
    const lateRun =
      needRunFloor &&
      ((dungeon!.visitedNodeIds.length >= Math.ceil(dungeon!.nodes.length * 0.5) && closedLeft <= 2) ||
        closedLeft <= 1);

    if (bossFirst) {
      const epicCut = tier === 1 ? 100 : 70;
      const rng = createHashRng(seed, dungeon!.blueprintId, target.id, 'boss_first');
      const rarity: Rarity = rng() * 100 < epicCut ? 'Epic' : tier === 1 ? 'Epic' : 'Legendary';
      dungeonPatch.bossFirstClearPending = false;
      dungeonPatch.runFloorMet = true;
      return {
        rarity,
        pityTriggered: false,
        nextPity: 0,
        tier,
        bossFirstClear: true,
        runFloorApplied: true,
        dungeonPatch,
      };
    }

    const count = pity?.byTier?.[tier] ?? 0;
    const rng = createHashRng(seed, dungeon!.blueprintId, target.id, 'open', count);
    let rolled = rollLootRarityWithPity(tier, rng, count);
    let rarity = rolled.rarity;
    let runFloorApplied = false;

    // Boss repeat: +1 band
    if (onBoss && !dungeon?.bossFirstClearPending) {
      rarity = bumpBand(rarity, 1);
    }

    if (lateRun) {
      const floor = runFloorRarity(tier);
      rarity = maxRarity(rarity, floor);
      runFloorApplied = true;
      dungeonPatch.runFloorMet = true;
    }

    if (opts.firstChestUncommonBias) {
      rarity = maxRarity(rarity, 'Uncommon');
    }

    // Recompute pity from final rarity
    const nextPity = isEpicPlus(rarity) ? 0 : rolled.nextPity;

    return {
      rarity,
      pityTriggered: rolled.pityTriggered,
      nextPity,
      tier,
      runFloorApplied,
      dungeonPatch: Object.keys(dungeonPatch).length ? dungeonPatch : undefined,
    };
  }

  if (claim && RARITIES.includes(claim as Rarity)) {
    let rarity = claim as Rarity;
    if (opts.firstChestUncommonBias) rarity = maxRarity(rarity, 'Uncommon');
    return { rarity, pityTriggered: false };
  }

  if (opts.firstChestUncommonBias) {
    return { rarity: 'Uncommon', pityTriggered: false };
  }

  return { rarity: null, pityTriggered: false };
}

export function markLootablesOpenedOnGain(
  dungeon: ActiveDungeonState | null | undefined,
  gainedNames: string[]
): ActiveDungeonState | null | undefined {
  if (!dungeon?.nodes?.length || !gainedNames.length) return dungeon;
  const node = currentDungeonNode(dungeon);
  if (!node?.hidden) return dungeon;
  const hasClosed = node.hidden.lootables.some((l) => !l.opened);
  if (!hasClosed) return dungeon;
  const nodes = dungeon.nodes.map((n) => {
    if (n.id !== node.id || !n.hidden) return n;
    let openedOne = false;
    const lootables = n.hidden.lootables.map((loot) => {
      if (loot.opened || openedOne) return loot;
      openedOne = true;
      return { ...loot, opened: true };
    });
    return { ...n, hidden: { ...n.hidden, lootables } };
  });
  return { ...dungeon, nodes };
}
