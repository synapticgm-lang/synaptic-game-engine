/**
 * Capacity ledger — subscription vs packs.
 *
 * Subscription (Free/Mid/High): use-it-or-lose-it. Daily text / illustrated
 * allotments and weekly memorable caps reset; unused do not roll over.
 *
 * Purchased packs: never expire. Balances only go down when spent.
 * Spend order: burn today's sub (+ ad) allowance first, then pack balance.
 *
 * Local until server TurnLedger ships.
 */

import {
  getActiveSubscriptionTier,
  getTierDefinition,
  type SubscriptionTierId,
  type TurnPackId,
  TURN_PACKS,
} from './subscriptionTiers';

const LEDGER_KEY = 'synapticgm-capacity-ledger';

export interface CapacityLedger {
  dayUtc: string;
  weekUtc: string;
  tier: SubscriptionTierId;
  /** Sub daily text turns spent today (resets). */
  textDailySpent: number;
  /** Opt-in ad text turns granted today (resets unused). */
  textAdBonusToday: number;
  /** Purchased text turns remaining — never expire. */
  textPackBalance: number;
  memorableSpent: number;
  /** Sub illustrated images spent today (resets). */
  illustratedDailySpent: number;
  /** Purchased illustrated image slots remaining — never expire. */
  illustratedPackBalance: number;
  illustratedTrialRemaining: number;
  adsWatchedToday: number;
}

function dayUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function weekUtc(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function emptyCapacityLedger(tier: SubscriptionTierId = getActiveSubscriptionTier()): CapacityLedger {
  const def = getTierDefinition(tier);
  return {
    dayUtc: dayUtc(),
    weekUtc: weekUtc(),
    tier,
    textDailySpent: 0,
    textAdBonusToday: 0,
    textPackBalance: 0,
    memorableSpent: 0,
    illustratedDailySpent: 0,
    illustratedPackBalance: 0,
    illustratedTrialRemaining: def.illustratedTrialImages,
    adsWatchedToday: 0,
  };
}

/** Migrate older ledger shapes that mixed bonus into a single spent counter. */
function migrateLedger(raw: Record<string, unknown>, tier: SubscriptionTierId): CapacityLedger {
  const base = emptyCapacityLedger(tier);
  if (typeof raw.textPackBalance === 'number') {
    return { ...base, ...raw, tier } as CapacityLedger;
  }
  // Legacy: textTurnsBonus was pack+ad mush; treat remaining bonus as non-expiring pack.
  const legacyBonus = Number(raw.textTurnsBonus ?? 0);
  const legacyIllusBonus = Number(raw.illustratedBonus ?? 0);
  return {
    ...base,
    textPackBalance: Math.max(0, legacyBonus),
    illustratedPackBalance: Math.max(0, legacyIllusBonus),
    memorableSpent: Number(raw.memorableSpent ?? 0),
    illustratedTrialRemaining: Number(
      raw.illustratedTrialRemaining ?? getTierDefinition(tier).illustratedTrialImages
    ),
  };
}

export function loadCapacityLedger(): CapacityLedger {
  const tier = getActiveSubscriptionTier();
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return emptyCapacityLedger(tier);
    let next = migrateLedger(JSON.parse(raw) as Record<string, unknown>, tier);
    if (next.dayUtc !== dayUtc()) {
      next = {
        ...next,
        dayUtc: dayUtc(),
        textDailySpent: 0,
        textAdBonusToday: 0,
        illustratedDailySpent: 0,
        adsWatchedToday: 0,
        // textPackBalance + illustratedPackBalance intentionally kept
      };
    }
    if (next.weekUtc !== weekUtc()) {
      next = {
        ...next,
        weekUtc: weekUtc(),
        memorableSpent: 0,
      };
    }
    return next;
  } catch {
    return emptyCapacityLedger(tier);
  }
}

export function saveCapacityLedger(ledger: CapacityLedger): void {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}

function textSubRemainingToday(ledger: CapacityLedger): number {
  const def = getTierDefinition(ledger.tier);
  return Math.max(0, def.textTurnsPerDay + ledger.textAdBonusToday - ledger.textDailySpent);
}

function illustratedSubRemainingToday(ledger: CapacityLedger): number {
  const def = getTierDefinition(ledger.tier);
  if (def.illustratedImagesPerDay <= 0) {
    return Math.max(0, ledger.illustratedTrialRemaining);
  }
  return Math.max(0, def.illustratedImagesPerDay - ledger.illustratedDailySpent);
}

export function textTurnsRemaining(ledger = loadCapacityLedger()): number {
  return textSubRemainingToday(ledger) + ledger.textPackBalance;
}

export function memorableRemaining(ledger = loadCapacityLedger()): number {
  const def = getTierDefinition(ledger.tier);
  return Math.max(0, def.memorableImagesPerWeek - ledger.memorableSpent);
}

export function illustratedRemaining(ledger = loadCapacityLedger()): number {
  return illustratedSubRemainingToday(ledger) + ledger.illustratedPackBalance;
}

export type CapacitySpendKind = 'text' | 'memorable' | 'illustrated';

export function canSpend(kind: CapacitySpendKind, amount = 1, ledger = loadCapacityLedger()): boolean {
  if (kind === 'text') return textTurnsRemaining(ledger) >= amount;
  if (kind === 'memorable') return memorableRemaining(ledger) >= amount;
  return illustratedRemaining(ledger) >= amount;
}

/**
 * Spend capacity. Sub/ad pool first (use-it-or-lose-it), then non-expiring packs.
 */
export function spendCapacity(
  kind: CapacitySpendKind,
  amount = 1,
  ledger = loadCapacityLedger()
): { ok: boolean; ledger: CapacityLedger; reason?: string; fromPack?: boolean } {
  if (!canSpend(kind, amount, ledger)) {
    return {
      ok: false,
      ledger,
      reason:
        kind === 'text'
          ? 'out_of_text_turns'
          : kind === 'memorable'
            ? 'out_of_memorable'
            : 'out_of_illustrated',
    };
  }

  const next = { ...ledger };
  let fromPack = false;

  if (kind === 'memorable') {
    next.memorableSpent += amount;
  } else if (kind === 'text') {
    let left = amount;
    const subLeft = textSubRemainingToday(next);
    const fromSub = Math.min(left, subLeft);
    next.textDailySpent += fromSub;
    left -= fromSub;
    if (left > 0) {
      next.textPackBalance -= left;
      fromPack = true;
    }
  } else {
    let left = amount;
    const def = getTierDefinition(next.tier);
    if (def.illustratedImagesPerDay <= 0) {
      const fromTrial = Math.min(left, next.illustratedTrialRemaining);
      next.illustratedTrialRemaining -= fromTrial;
      left -= fromTrial;
    } else {
      const subLeft = illustratedSubRemainingToday(next);
      const fromSub = Math.min(left, subLeft);
      next.illustratedDailySpent += fromSub;
      left -= fromSub;
    }
    if (left > 0) {
      next.illustratedPackBalance -= left;
      fromPack = true;
    }
  }

  saveCapacityLedger(next);
  return { ok: true, ledger: next, fromPack };
}

/** Opt-in rewarded ad — extra text turns for today only (use-it-or-lose-it with the day). */
export function grantAdReward(ledger = loadCapacityLedger()): CapacityLedger {
  const def = getTierDefinition(ledger.tier);
  if (def.noAds || def.adTextTurns <= 0) return ledger;
  return grantAdBonusTurns(def.adTextTurns, ledger);
}

/**
 * Grant a specific number of ad bonus turns (Kid Mode / soft shop path).
 * Does not check noAds — caller must gate eligibility.
 */
export function grantAdBonusTurns(
  turns: number,
  ledger = loadCapacityLedger()
): CapacityLedger {
  if (turns <= 0) return ledger;
  const next = {
    ...ledger,
    textAdBonusToday: ledger.textAdBonusToday + turns,
    adsWatchedToday: ledger.adsWatchedToday + 1,
  };
  saveCapacityLedger(next);
  return next;
}

/** Purchased packs — balances never expire. */
export function grantTurnPack(packId: TurnPackId, ledger = loadCapacityLedger()): CapacityLedger {
  const pack = TURN_PACKS[packId];
  const def = getTierDefinition(ledger.tier);
  const next = {
    ...ledger,
    textPackBalance: ledger.textPackBalance + pack.textTurns,
    illustratedPackBalance:
      ledger.illustratedPackBalance + pack.illustratedTurns * Math.max(1, def.maxPanelsPerTurn),
  };
  saveCapacityLedger(next);
  return next;
}

export function capacityStatusMessage(kind: CapacitySpendKind): string {
  if (kind === 'text') {
    return 'You’re out of turns for today. Upgrade for a higher daily allowance, buy a turn pack (packs never expire), or watch an ad for a few more turns today.';
  }
  if (kind === 'memorable') {
    return 'Memorable art is included when big moments hit — you’ve hit this week’s splash limit. The story continues; upgrade for more frequent memorable art.';
  }
  return 'You’re out of illustrations for this graphic novel. Upgrade for more daily art, or buy an illustrated pack (packs never expire) — your place is saved.';
}
