/**
 * q70-HPRECOVERY — LitRPG / Story RPG HP recovery from state + hpRecoveryConfig.
 * Rest / regen / potions / flee DC / low-HP warning. No prose word lists.
 * Tabletop stays on recoveryRules SRD 5.2.1 path (unchanged).
 */
import type { CampaignBible } from '@/data/campaigns/types';
import type { EngineMode, GameState, Item } from './types';
import { advanceClock } from './travelJourney';
import { hubsForBibleId, matchHub, type OutdoorHub } from './outdoorHubs';
import { resolvePlace } from './places';
import { addItem } from './inventory';
import {
  hpRecoveryConfig,
  type ModeHpRecoveryConfig,
  type RestPlaceKind,
} from './rules/hpRecoveryConfig';

export const HP_REST_CHIP = 'Rest';
export const HP_INN_REST_CHIP = 'Rest at the inn';

export type HpRestResult = {
  state: GameState;
  receipt: string | null;
  fact?: string;
  after?: string[];
};

export type HpTickResult = {
  state: GameState;
  receipts: string[];
};

/** Hub / place restKind from authored data (OutdoorHub.restKind or PlaceRecord.restKind). */
export function restKindHere(state: GameState): RestPlaceKind | null {
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter || state.activeDungeon) return null;
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation) as
    | (OutdoorHub & { restKind?: RestPlaceKind })
    | null;
  if (hub?.restKind) return hub.restKind;
  const place = resolvePlace(state.places, state.currentLocation ?? '');
  return place?.restKind ?? null;
}

export function isHpRecoveryMode(mode: EngineMode | undefined): boolean {
  return mode === 'litrpg' || mode === 'rpg';
}

/** Rest chip when hurt at a place with restKind and no live fight. */
export function hpRecoveryRestChip(state: GameState): string | null {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return null;
  const kind = restKindHere(state);
  if (!kind) return null;
  const ch = state.character;
  if (!ch) return null;
  const max = ch.maxHp || ch.hp;
  if (ch.hp >= max) return null;
  return kind === 'inn' ? HP_INN_REST_CHIP : HP_REST_CHIP;
}

function healShare(cfg: ModeHpRecoveryConfig, kind: RestPlaceKind): number {
  return kind === 'inn' ? cfg.restHealShareInn : cfg.restHealShareSafe;
}

function restHours(cfg: ModeHpRecoveryConfig, kind: RestPlaceKind): number {
  return kind === 'inn' ? cfg.restHoursInn : cfg.restHoursSafe;
}

/** Exact chip labels for mode rest (engine-backed, not prose regex). */
export function isHpRecoveryRestInput(input: string): boolean {
  const t = (input ?? '').trim();
  return t === HP_REST_CHIP || t === HP_INN_REST_CHIP;
}

/**
 * Rest at a data-marked safe place / inn. Heals a config share of max HP, advances
 * the world clock, and charges innPriceGp for inns through the gold ledger.
 */
export function applyHpRecoveryRest(state: GameState, input: string): HpRestResult {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg || !isHpRecoveryRestInput(input)) return { state, receipt: null };
  const kind = restKindHere(state);
  if (!kind) return { state, receipt: null };
  if (kind === 'inn' && input !== HP_INN_REST_CHIP) return { state, receipt: null };
  if (kind !== 'inn' && input !== HP_REST_CHIP) return { state, receipt: null };

  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  if (ch.hp >= max) return { state, receipt: null };

  let next = state;
  const after: string[] = [];
  if (kind === 'inn') {
    const price = cfg.innPriceGp;
    if ((next.gold ?? 0) < price) {
      return {
        state,
        receipt: `Rest: inn needs ${price}g (you have ${next.gold ?? 0}g)`,
        fact: `You could not afford a room at the inn (${price} gold).`,
      };
    }
    next = { ...next, gold: (next.gold ?? 0) - price };
    after.push(`Inn: −${price}g`);
  }

  const gain = Math.max(1, Math.floor(max * healShare(cfg, kind)));
  const hp = Math.min(max, ch.hp + gain);
  const hours = restHours(cfg, kind);
  const clock = advanceClock({ ...next, character: { ...ch, hp } }, hours);
  next = clock.state;

  const place = next.currentLocation || 'a safe place';
  return {
    state: next,
    receipt: `Rest: ${kind === 'inn' ? 'inn' : 'safe place'}, ${hours}h — HP ${ch.hp} → ${hp} (${clock.note})`,
    after: after.length ? after : undefined,
    fact:
      kind === 'inn'
        ? `You paid for a room at ${place}, rested about ${hours} hour${hours === 1 ? '' : 's'}, and woke stronger.`
        : `You rested at ${place} for about ${hours} hour${hours === 1 ? '' : 's'} and recovered.`,
  };
}

/**
 * Slow out-of-combat regen: every N non-combat turns, restore regenHpPerTick.
 * Never ticks during an active encounter.
 */
export function applyOutOfCombatRegen(state: GameState): HpTickResult {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return { state, receipts: [] };
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) {
    return { state: { ...state, hpRegenNonCombatStreak: 0 }, receipts: [] };
  }
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  if (ch.hp >= max) return { state: { ...state, hpRegenNonCombatStreak: 0 }, receipts: [] };

  const streak = (state.hpRegenNonCombatStreak ?? 0) + 1;
  if (streak < cfg.regenEveryNonCombatTurns) {
    return { state: { ...state, hpRegenNonCombatStreak: streak }, receipts: [] };
  }
  const hp = Math.min(max, ch.hp + cfg.regenHpPerTick);
  if (hp === ch.hp) return { state: { ...state, hpRegenNonCombatStreak: 0 }, receipts: [] };
  return {
    state: {
      ...state,
      hpRegenNonCombatStreak: 0,
      character: { ...ch, hp },
    },
    receipts: [`Regen: HP ${ch.hp} → ${hp}`],
  };
}

/** Build a healing potion Item from config (buy / loot / starter kit). */
export function healingPotionItem(
  mode: EngineMode | undefined,
  id: string,
  qty = 1
): Item | null {
  const cfg = hpRecoveryConfig(mode);
  if (!cfg) return null;
  return {
    id,
    name: cfg.potionName,
    rarity: 'Common',
    quantity: Math.max(1, qty),
    itemType: 'consumable',
    healHp: cfg.potionHealHp,
    baseValue: cfg.potionPriceGp,
    provenance: 'Healing supply',
  };
}

/** True when this inventory row is the mode healing potion (config name or healHp stamp). */
export function isHealingPotionItem(state: GameState, item: Item): boolean {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return false;
  if (typeof item.healHp === 'number' && item.healHp > 0 && item.itemType === 'consumable') return true;
  return item.itemType === 'consumable' && item.name === cfg.potionName;
}

function potionHealAmount(state: GameState, item: Item): number {
  if (typeof item.healHp === 'number' && item.healHp > 0) return item.healHp;
  return hpRecoveryConfig(state.engineMode)?.potionHealHp ?? 0;
}

/** Use a healing potion: heal by strength, consume one. Matches `Use {potionName}`. */
export function applyHealingPotionUse(state: GameState, input: string): HpTickResult {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return { state, receipts: [] };
  const t = (input ?? '').trim();
  const prefix = 'Use ';
  if (!t.startsWith(prefix)) return { state, receipts: [] };
  const name = t.slice(prefix.length).trim();
  if (!name) return { state, receipts: [] };

  const idx = (state.inventory ?? []).findIndex(
    (i) => i.name === name && isHealingPotionItem(state, i)
  );
  if (idx < 0) return { state, receipts: [] };

  const item = state.inventory[idx]!;
  const ch = state.character;
  const max = ch.maxHp || ch.hp;
  if (ch.hp >= max) {
    return { state, receipts: [`${item.name}: already at full HP`] };
  }
  const gain = potionHealAmount(state, item);
  const hp = Math.min(max, ch.hp + gain);
  const qty = item.quantity ?? 1;
  const inventory =
    qty > 1
      ? state.inventory.map((i, iIdx) => (iIdx === idx ? { ...i, quantity: qty - 1 } : i))
      : state.inventory.filter((_, iIdx) => iIdx !== idx);
  return {
    state: { ...state, character: { ...ch, hp }, inventory },
    receipts: [`Potion: ${item.name} — HP ${ch.hp} → ${hp}`],
  };
}

/** Stamp healHp / price onto a bought or looted row when it is the mode potion. */
export function stampHealingPotionFields(mode: EngineMode | undefined, item: Item): Item {
  const cfg = hpRecoveryConfig(mode);
  if (!cfg || item.name !== cfg.potionName) return item;
  return {
    ...item,
    itemType: 'consumable',
    healHp: cfg.potionHealHp,
    baseValue: item.baseValue ?? cfg.potionPriceGp,
  };
}

export function isLowHp(state: GameState): boolean {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return false;
  const max = state.character.maxHp || state.character.hp;
  if (max <= 0) return false;
  return state.character.hp / max < cfg.lowHpThreshold;
}

/** System warning line when under the low-HP threshold (not a prose scrub). */
export function lowHpWarningLine(state: GameState): string | null {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg || !isLowHp(state)) return null;
  const pct = Math.round(cfg.lowHpThreshold * 100);
  return `System: HP critical — below ${pct}% (${state.character.hp}/${state.character.maxHp}). Rest, regenerate, or use a ${cfg.potionName}.`;
}

/**
 * Attach a low-HP System warning once per streak under the threshold.
 * Clears the stamp when HP recovers above the threshold.
 */
export function applyLowHpWarning(state: GameState): HpTickResult {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return { state, receipts: [] };
  if (!isLowHp(state)) {
    if (state.lowHpWarningActive) return { state: { ...state, lowHpWarningActive: false }, receipts: [] };
    return { state, receipts: [] };
  }
  if (state.lowHpWarningActive) return { state, receipts: [] };
  const line = lowHpWarningLine(state);
  return {
    state: { ...state, lowHpWarningActive: true },
    receipts: line ? [line] : [],
  };
}

/** Flee DC from config (LitRPG / RPG). Null → caller keeps existing ladder. */
export function fleeDifficultyFor(state: GameState): number | null {
  return hpRecoveryConfig(state.engineMode)?.fleeDifficulty ?? null;
}

/**
 * Starter heal kit only when the bible/start marks `hpRecoveryStarterKit`.
 * No word-list inference from premise copy.
 */
export function applyHpRecoveryStarterKit(
  state: GameState,
  bible: Pick<CampaignBible, 'hpRecoveryStarterKit'> | null | undefined
): GameState {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg || !bible?.hpRecoveryStarterKit) return state;
  const potion = healingPotionItem(state.engineMode, `starter-heal-${state.saveId ?? 'new'}`, cfg.starterKitPotionCount);
  if (!potion) return state;
  if ((state.inventory ?? []).some((i) => i.name === cfg.potionName && isHealingPotionItem(state, i))) {
    return state;
  }
  const added = addItem(state, potion);
  return added.ok && added.state ? added.state : state;
}

/** Recovery-route chip labels offered when HP is under half (rest / potion use). */
export function recoveryRouteChips(state: GameState): string[] {
  const cfg = hpRecoveryConfig(state.engineMode);
  if (!cfg) return [];
  const max = state.character.maxHp || state.character.hp;
  if (max <= 0 || state.character.hp * 2 >= max) return [];
  const out: string[] = [];
  const rest = hpRecoveryRestChip(state);
  if (rest) out.push(rest);
  for (const item of state.inventory ?? []) {
    if (isHealingPotionItem(state, item)) {
      out.push(`Use ${item.name}`);
      break;
    }
  }
  return out;
}
