/**
 * q70-HPRECOVERY — LitRPG / Story RPG HP recovery numbers (proposals for John).
 * Code reads these values only from here. Tabletop stays SRD 5.2.1 rest / Hit Dice / potions (unchanged).
 */
import type { EngineMode } from '../types.ts';

export type RestPlaceKind = 'safe' | 'inn' | 'campfire' | 'home';

export interface ModeHpRecoveryConfig {
  /** Share of max HP restored at a safe / campfire / home rest (floor of 1 when hurt). */
  restHealShareSafe: number;
  /** Share of max HP restored at an inn rest (floor of 1 when hurt). */
  restHealShareInn: number;
  /** Gold charged for an inn rest (existing gold ledger). */
  innPriceGp: number;
  /** World-clock hours advanced via advanceClock on a safe / campfire / home rest. */
  restHoursSafe: number;
  /** World-clock hours advanced via advanceClock on an inn rest. */
  restHoursInn: number;
  /** Out-of-combat regen: HP gained every N non-combat turns (never during an active encounter). */
  regenEveryNonCombatTurns: number;
  /** HP restored on each regen tick. */
  regenHpPerTick: number;
  /** Merchant list price (gold) for the mode healing potion. */
  potionPriceGp: number;
  /** Flat HP restored when the healing potion is used. */
  potionHealHp: number;
  /** Inventory / shop display name for the healing potion (ledger identity, not a prose word list). */
  potionName: string;
  /** Chance (0–1) a Common loot roll becomes this potion instead of gear. */
  potionLootChance: number;
  /** Low-HP warning when current/max is strictly below this fraction. */
  lowHpThreshold: number;
  /** Flee check DC on fight / ambush start (success leaves; failure keeps the fight). */
  fleeDifficulty: number;
  /** How many potions the optional bible starter kit grants when marked. */
  starterKitPotionCount: number;
}

/** LitRPG proposals — System-tone inn / tonic loop. */
const LITRPG: ModeHpRecoveryConfig = {
  // Half max HP at a safe place / campfire / home.
  restHealShareSafe: 0.5,
  // Full max HP at an inn.
  restHealShareInn: 1,
  // Ten gold for a room and care.
  innPriceGp: 10,
  // One hour of clock for a short safe rest.
  restHoursSafe: 1,
  // Eight hours overnight at an inn.
  restHoursInn: 8,
  // One HP every five non-combat turns (50 turns → +10).
  regenEveryNonCombatTurns: 5,
  regenHpPerTick: 1,
  // Matches modeShopPrices consumable Common floor; stamped healHp on buy.
  potionPriceGp: 5,
  // Flat 12 HP per Health tonic.
  potionHealHp: 12,
  potionName: 'Health tonic',
  // Common loot sometimes is a tonic (existing trash table already lists health-tonic).
  potionLootChance: 0.35,
  // Warn under 30% HP (bar + System line). Ambushes are NOT suppressed.
  lowHpThreshold: 0.3,
  // Flee is a check vs DC 12 (can fail).
  fleeDifficulty: 12,
  // Two tonics when the bible marks hpRecoveryStarterKit.
  starterKitPotionCount: 2,
};

/** Story RPG proposals — same loop, salve name. */
const RPG: ModeHpRecoveryConfig = {
  restHealShareSafe: 0.5,
  restHealShareInn: 1,
  innPriceGp: 8,
  restHoursSafe: 1,
  restHoursInn: 8,
  regenEveryNonCombatTurns: 5,
  regenHpPerTick: 1,
  potionPriceGp: 4,
  potionHealHp: 10,
  potionName: 'Healing salve',
  potionLootChance: 0.35,
  lowHpThreshold: 0.3,
  fleeDifficulty: 12,
  starterKitPotionCount: 2,
};

const BY_MODE: Partial<Record<EngineMode, ModeHpRecoveryConfig>> = {
  litrpg: LITRPG,
  rpg: RPG,
};

export function hpRecoveryConfig(mode: EngineMode | undefined): ModeHpRecoveryConfig | null {
  if (mode !== 'litrpg' && mode !== 'rpg') return null;
  return BY_MODE[mode] ?? null;
}
