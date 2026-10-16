/**
 * Shared rules engine — achievements and reward boxes. Achievements are deeds the engine already records
 * (sandbox award keys, named-skill state, a boss won). Each pays once: in LitRPG a sealed reward box of its tier
 * (Bronze, Silver, Gold, Platinum, Legendary) and, for some, a title (rules/titles). A box opens outside a
 * fight and rolls the existing loot tables. XP for the four older achievements is unchanged (sandboxXp); the
 * new ones pay no XP. A housing that hides the level records deeds and titles in secret: no box, no notice.
 * Story RPG and tabletop: nothing here.
 */
import type { GameState, Item, Rarity } from '../types';
import { hidesPart } from '../systemHousing';
import { rollLoot, type LootProfile } from '../lootTableRegistry';
import { TITLES, TITLE_KEY, activeTitleOf, earnedTitles, titlePerkText, type TitleDef } from './titles';

export type BoxTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Legendary';
export const BOX_TIERS: readonly BoxTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Legendary'];

const BOX_RARITY: Record<BoxTier, Rarity> = {
  Bronze: 'Common',
  Silver: 'Uncommon',
  Gold: 'Rare',
  Platinum: 'Epic',
  Legendary: 'Legendary',
};

/** Each tier opens on an existing loot profile; higher tiers roll more or better. */
const BOX_LOOT: Record<BoxTier, { profile: LootProfile; firstKill?: boolean }> = {
  Bronze: { profile: 'chestBronze' },
  Silver: { profile: 'chestSilver' },
  Gold: { profile: 'chestGold' },
  Platinum: { profile: 'rareEncounter' },
  Legendary: { profile: 'boss', firstKill: true },
};

export interface DeedFacts {
  awardKeys: string[];
  /** A boss fight was won this turn. */
  bossWon?: boolean;
  /** A named skill has evolved into its technique. */
  skillEvolved?: boolean;
}

export interface AchievementDef {
  key: string;
  name: string;
  tier: BoxTier;
  earned: (d: DeedFacts) => boolean;
}

const has = (key: string) => (d: DeedFacts) => d.awardKeys.includes(key);
const count = (prefix: string, n: number) => (d: DeedFacts) => d.awardKeys.filter((k) => k.startsWith(prefix)).length >= n;

/** Book order: tier, then the order the deed usually comes. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { key: 'achv:first-steps', name: 'First Steps', tier: 'Bronze', earned: has('achv:first-steps') },
  { key: 'achv:first-kill', name: 'First Kill', tier: 'Bronze', earned: has('achv:first-kill') },
  { key: 'achv:fights-won-3', name: '3 Fights Won', tier: 'Silver', earned: has('achv:fights-won-3') },
  { key: 'achv:first-quest', name: 'First Quest Complete', tier: 'Silver', earned: count('quest-complete:', 1) },
  { key: 'achv:first-technique', name: 'First Technique', tier: 'Silver', earned: (d) => !!d.skillEvolved },
  { key: 'achv:fights-won-10', name: '10 Fights Won', tier: 'Gold', earned: has('achv:fights-won-10') },
  { key: 'achv:first-dungeon', name: 'First Dungeon Cleared', tier: 'Gold', earned: count('dungeon-clear:', 1) },
  { key: 'achv:boss-felled', name: 'Boss Felled', tier: 'Platinum', earned: (d) => !!d.bossWon || d.awardKeys.includes('achv:boss-felled') },
  { key: 'achv:three-dungeons', name: 'Three Dungeons Cleared', tier: 'Legendary', earned: count('dungeon-clear:', 3) },
];

const BOX_KEY = 'box:';
export const REWARD_BOX_ID = 'reward-box:';
/** L2 — once opened, the box id is recorded so it cannot be re-granted or re-looted. */
const OPENED_BOX_KEY = 'opened:';

export function boxName(tier: BoxTier): string {
  return `${tier} Reward Box`;
}

export function rewardBoxItem(a: AchievementDef): Item {
  return {
    id: `${REWARD_BOX_ID}${a.key}`,
    name: boxName(a.tier),
    rarity: BOX_RARITY[a.tier],
    quantity: 1,
    itemType: 'consumable',
    description: `Sealed System reward (Achievement: ${a.name}). Opens outside a fight.`,
    provenance: 'System reward',
  };
}

export function isRewardBox(item: Item | null | undefined): boolean {
  return !!item?.id?.startsWith(REWARD_BOX_ID);
}

/** True when the typed line is opening a System reward box (not a world crate/chest). */
export function isRewardBoxOpenLine(input: string): boolean {
  const t = (input ?? '').trim().toLowerCase();
  return t.includes('open') && t.includes('reward') && t.includes('box');
}

function boxOpenedKey(boxId: string): string {
  return `${OPENED_BOX_KEY}${boxId}`;
}

function boxTierOf(item: Item): BoxTier | null {
  return BOX_TIERS.find((t) => item.name === boxName(t)) ?? null;
}

export interface DeedSettle {
  awardKeys: string[];
  items: Item[];
  /** System notices for STATUS: "Achievement: …", "Title earned: …". */
  notes: string[];
}

/**
 * Settle achievements and titles once per turn, after the turn's milestones are paid. Idempotent on the award
 * keys. LitRPG only.
 */
export function settleDeeds(state: GameState, facts: DeedFacts): DeedSettle {
  const awardKeys = [...facts.awardKeys];
  const out: DeedSettle = { awardKeys, items: [], notes: [] };
  if (state.engineMode !== 'litrpg') return out;
  const hidden = hidesPart(state.systemHousing, 'level');
  const d: DeedFacts = { ...facts, awardKeys };
  const titledBefore = earnedTitles({ engineMode: state.engineMode, sandboxAwardKeys: awardKeys });
  const worn = activeTitleOf({ ...state, sandboxAwardKeys: awardKeys })?.name;
  for (const a of ACHIEVEMENTS) {
    if (!a.earned(d)) continue;
    if (!awardKeys.includes(a.key)) awardKeys.push(a.key);
    const boxKey = `${BOX_KEY}${a.key}`;
    const boxId = `${REWARD_BOX_ID}${a.key}`;
    // L2 — grant once: box: key or opened: key (loot-once) blocks a second box.
    if (!awardKeys.includes(boxKey) && !awardKeys.includes(`${OPENED_BOX_KEY}${boxId}`)) {
      awardKeys.push(boxKey);
      if (!hidden) {
        out.items.push(rewardBoxItem(a));
        out.notes.push(`Achievement: ${a.name} — ${boxName(a.tier)}.`);
      }
    } else if (!awardKeys.includes(boxKey)) {
      awardKeys.push(boxKey);
    }
    const title = TITLES.find((t) => t.deed === a.key);
    if (title && !awardKeys.includes(`${TITLE_KEY}${title.id}`)) {
      awardKeys.push(`${TITLE_KEY}${title.id}`);
      if (!hidden) out.notes.push(titleEarnedLine(title, titledBefore.length ? worn : undefined));
    }
  }
  return out;
}

function titleEarnedLine(t: TitleDef, worn: string | undefined): string {
  const tail = worn && worn !== t.name ? ` Worn title stays ${worn}.` : '';
  return `Title earned: ${t.name} (${titlePerkText(t)}).${tail}`;
}

export interface SystemSettle {
  state: GameState;
  receipts: string[];
  fact?: string;
  /** The line was this System action, not talk to anyone in the scene. */
  settled: boolean;
}

const fighting = (s: GameState) => !!s.activeEncounter || !!s.roundCombat;

const TITLE_LINE = /^(?:set|wear|use|equip|choose|take|switch to)\s+(?:the\s+|my\s+)?title(?:\s*:\s*|\s+to\s+|\s+)(?:the\s+)?(.+?)[.!]?$/i;

/** "Set title: Pathfinder" / "Wear the title Delver": switch the worn title to an earned one. */
export function settleTitleChoice(state: GameState, input: string): SystemSettle {
  const none: SystemSettle = { state, receipts: [], settled: false };
  if (state.engineMode !== 'litrpg' || hidesPart(state.systemHousing, 'level')) return none;
  const m = (input ?? '').trim().match(TITLE_LINE);
  if (!m) return none;
  const want = m[1]!.trim().toLowerCase();
  const def = earnedTitles(state).find((t) => t.name.toLowerCase() === want);
  if (!def) return none;
  const next = { ...state, character: { ...state.character, activeTitle: def.name } };
  return {
    state: next,
    receipts: [`Title: ${def.name} is now the worn title (${titlePerkText(def)}).`],
    fact: `The player now wears the title ${def.name}.`,
    settled: true,
  };
}

export function openBoxChip(tier: BoxTier): string {
  return `Open the ${boxName(tier)}`;
}

/** Boxes waiting to be opened, one chip per tier. Opened / already-looted boxes are gone. */
export function rewardBoxesHeld(state: GameState): Item[] {
  const keys = state.sandboxAwardKeys ?? [];
  const out: Item[] = [];
  for (const i of state.inventory ?? []) {
    if (isRewardBox(i) && (i.quantity ?? 1) > 0 && !keys.includes(boxOpenedKey(i.id))) out.push(i);
  }
  return out;
}

/** The System prompt's box chips: one per tier held, outside a fight. */
export function rewardBoxPad(state: GameState): string[] | null {
  if (state.engineMode !== 'litrpg' || fighting(state)) return null;
  const tiers = BOX_TIERS.filter((t) => rewardBoxesHeld(state).some((i) => boxTierOf(i) === t));
  return tiers.length ? tiers.map(openBoxChip) : null;
}

/** The box this line opens: the chip, or "open the box" (a named tier picks that tier, else the first held). */
function boxForLine(state: GameState, input: string): Item | null {
  const t = (input ?? '').trim();
  if (!/\bopen\b/i.test(t) || !/\b(?:box|chest|reward|loot\s*box)\b/i.test(t)) return null;
  const held = rewardBoxesHeld(state);
  if (!held.length) return null;
  const tier = BOX_TIERS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(t));
  return (tier ? held.find((i) => boxTierOf(i) === tier) : held[0]) ?? null;
}

/** Open a reward box before the writer: roll its tier's loot, swap the box for the items. Fights wait. */
export function settleRewardBox(state: GameState, input: string): SystemSettle {
  const none: SystemSettle = { state, receipts: [], settled: false };
  if (state.engineMode !== 'litrpg' || fighting(state)) return none;
  const box = boxForLine(state, input);
  const tier = box ? boxTierOf(box) : null;
  if (!box || !tier) return none;
  if ((state.sandboxAwardKeys ?? []).includes(boxOpenedKey(box.id))) return none;
  const loot = rollLoot({ ...BOX_LOOT[tier], state, seed: `${state.seed ?? 'seed'}:${box.id}` });
  const inventory: Item[] = [];
  for (const i of state.inventory ?? []) {
    if (i.id !== box.id) inventory.push(i);
  }
  for (const i of loot.items) inventory.push(i);
  const sandboxAwardKeys = Array.from(
    new Set([...(state.sandboxAwardKeys ?? []), boxOpenedKey(box.id), `${BOX_KEY}${box.id.slice(REWARD_BOX_ID.length)}`])
  );
  const got = loot.items.map((i) => `[${i.rarity}] ${i.name}`);
  const plain = loot.items.map((i) => `${i.name} (${i.rarity})`);
  return {
    state: { ...state, inventory, sandboxAwardKeys },
    receipts: [got.length ? `Loot: ${got.join(', ')} (${box.name})` : `Loot: the ${box.name} was empty`],
    fact: got.length
      ? `The player opened the ${box.name}: ${plain.join(', ')}.`
      : `The player opened the ${box.name}; it was empty.`,
    settled: true,
  };
}
