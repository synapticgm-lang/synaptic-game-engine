/**
 * XP-D1 OPEN5 — tunables for wilds hunting, gathering, and creature loot.
 * Engine owns every number; AI never sets these.
 */

/** World creature level ceiling (farthest region band high). */
export const WORLD_MAX_CREATURE_LEVEL = 30;

/** Regular wilds kills share of the current level bar (across all regions). */
export const WILDS_HUNT_BAR_SHARE = 0.3;
/** Challenge kills (M >= P+3, elite, or rare) share of the bar. */
export const WILDS_CHALLENGE_BAR_SHARE = 0.15;

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
