/**
 * XP-D1 OPEN5 — tunables for wilds hunting, gathering, and creature loot.
 * Engine owns every number; AI never sets these.
 */

/** World creature level ceiling (farthest region band high). */
export const WORLD_MAX_CREATURE_LEVEL = 30;

/**
 * XP-D1 OPEN7 — hunt budgets REMOVED as payout limiters (John 2 Nov 2026).
 * Kept as report-only constants so old ledger fields / docs still name the historical shares.
 * A non-gray hunt always pays; gray is the only zero. Do not reintroduce a post-cap floor.
 */
export const WILDS_HUNT_BAR_SHARE = 0.3;
export const WILDS_CHALLENGE_BAR_SHARE = 0.15;

/**
 * OPEN7 — table-creature kill XP multiplier vs OPEN4 same-level encounter unit.
 * Tuned so quest share stays ~60–70% without a hunt cap (see OPEN7-report / sim).
 * Death cooldown cuts re-hunt farm; this mult keeps remaining kills from washing quests.
 */
export const WILDS_KILL_XP_MULT = 0.48;

/** Outdoor turns after a hunt/fight defeat during which Hunt pays 0 and is not pushed as a chip. */
export const HUNT_DEATH_COOLDOWN_TURNS = 3;

/**
 * OPEN7 addendum — outdoor short rest (LitRPG / Story RPG only; never tabletop).
 * Heals this fraction of max HP (at least 1), advances the world clock by OUTDOOR_SHORT_REST_HOURS,
 * pays 0 XP, and cannot be repeated until OUTDOOR_SHORT_REST_COOLDOWN_TURNS have passed.
 */
export const OUTDOOR_SHORT_REST_HEAL_FRACTION = 0.25;
export const OUTDOOR_SHORT_REST_HOURS = 1;
export const OUTDOOR_SHORT_REST_COOLDOWN_TURNS = 3;
/** Hurt threshold: at or below this share of max HP, Hunt/Seek are withheld and recovery chips are offered. */
export const HURT_HP_FRACTION = 0.5;

export const OUTDOOR_REST_CHIP = 'Rest and bind your wounds';
export const OUTDOOR_CAMP_CHIP = 'Make camp';
export const WALK_BACK_HUB_CHIP = 'Walk back to the hub';

export function isOutdoorRestPad(label: string): boolean {
  const t = (label ?? '').replace(/\s+/g, ' ').trim();
  return (
    /^rest and bind your wounds\b/i.test(t)
    || /^make camp\b/i.test(t)
    || /^walk back to the hub\b/i.test(t)
    || /^i bind my wounds\b/i.test(t)
  );
}

export function isHurtHp(hp: number, maxHp: number): boolean {
  const max = Math.max(1, Math.floor(maxHp || 1));
  const cur = Math.max(0, Math.floor(hp || 0));
  return cur * 2 <= max;
}

/** Ambush chance while aggressive/pack/territorial guards remain (× share still alive). */
export const GUARD_AMBUSH_BASE = 0.35;
/** World hours of safe gathering after guards clear (or until stock refills past half). */
export const CLEAR_MINE_GRACE_HOURS = 24;

/** Stock refill: one creature unit per this many world hours. */
export const WILDS_RESPAWN_HOURS = 6;
/** Resource node refill hours. */
export const NODE_RESPAWN_HOURS = 8;
/** Starting / max stock of one resource node (herb patch or ore seam) at a place. */
export const NODE_STOCK_BASE = 4;
/** Gather success chance when the trade rank is below the node's tier unlock (common yield only). */
export const GATHER_BELOW_UNLOCK_CHANCE = 0.5;

/** Base stock per species slot ≈ 4 + 2 × areaTier. */
export const WILDS_STOCK_BASE = 4;
export const WILDS_STOCK_PER_TIER = 2;

/** Gathering trade unlock ranks (WoW 1/65/125/175/230–250/300 ÷ 6 → 1–50 scale). */
export const GATHER_TIER_UNLOCK_RANKS = [1, 11, 21, 29, 38, 48] as const;

/** Creature / resource tier by level mid-point. */
export function tierForLevel(level: number): number {
  const L = Math.max(1, Math.floor(level || 1));
  if (L <= 3) return 1;
  if (L <= 8) return 2;
  if (L <= 12) return 3;
  if (L <= 17) return 4;
  if (L <= 22) return 5;
  return 6;
}

export function gatherUnlockRankForTier(tier: number): number {
  const t = Math.max(1, Math.min(6, Math.floor(tier || 1)));
  return GATHER_TIER_UNLOCK_RANKS[t - 1] ?? 48;
}

/** Generic hide names by tier (engine material ids — not story item names). */
export const HIDE_BY_TIER: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'scrap-leather', name: 'Scrap leather' },
  { id: 'light-leather', name: 'Light leather' },
  { id: 'medium-leather', name: 'Medium leather' },
  { id: 'heavy-leather', name: 'Heavy leather' },
  { id: 'thick-leather', name: 'Thick leather' },
  { id: 'rugged-leather', name: 'Rugged leather' },
];

export const ORE_BY_TIER: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'copper-ore', name: 'Copper ore' },
  { id: 'tin-ore', name: 'Tin ore' },
  { id: 'iron-ore', name: 'Iron ore' },
  { id: 'mithril-ore', name: 'Mithril ore' },
  { id: 'thorium-ore', name: 'Thorium ore' },
  { id: 'rich-thorium-ore', name: 'Rich thorium ore' },
];

export const HERB_BY_TIER: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'peacebloom', name: 'Peacebloom' },
  { id: 'silverleaf', name: 'Silverleaf' },
  { id: 'earthroot', name: 'Earthroot' },
  { id: 'mageroyal', name: 'Mageroyal' },
  { id: 'briarthorn', name: 'Briarthorn' },
  { id: 'kingsblood', name: 'Kingsblood' },
];

/** Item value from itemLevel: baseValue × (1 + 0.15 × (itemLevel − 1)), cap ×6. */
export function itemLevelValueMult(itemLevel: number): number {
  const L = Math.max(1, Math.floor(itemLevel || 1));
  return Math.min(6, 1 + 0.15 * (L - 1));
}

export const HUNT_PAD = 'Hunt the wildlife nearby';
export const HUNT_ANIMAL_PAD = 'Hunt the animal';
export const GATHER_PAD = 'Gather herbs and resources nearby';
export const CRAFT_PAD = 'Craft at a workshop';
export const BREW_PAD = 'Brew at camp or inn';
export const SEEK_FIGHT_CHIP = 'Look for a fight';

export function isHuntPad(label: string): boolean {
  const t = (label ?? '').replace(/\s+/g, ' ').trim();
  return /^hunt the (?:wildlife nearby|animal)\b/i.test(t) || /^i go hunting\b/i.test(t);
}

export function isGatherPad(label: string): boolean {
  const t = (label ?? '').replace(/\s+/g, ' ').trim();
  return /^gather (?:herbs and resources nearby|herbs|ore|resources)\b/i.test(t)
    || /^i look for (?:ore|herbs|resources)\b/i.test(t)
    || /^take up (?:mining|herbalism|skinning)\b/i.test(t);
}
