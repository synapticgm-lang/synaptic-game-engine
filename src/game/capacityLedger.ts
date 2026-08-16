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
  /** Purchased memorable plates remaining — never expire. Schnell only. */
  memorablePackBalance: number;
  /** Sub illustrated images spent today (resets). */
  illustratedDailySpent: number;
  /** Purchased illustrated image slots remaining — never expire. */
  illustratedPackBalance: number;
  illustratedTrialRemaining: number;
  adsWatchedToday: number;
  /** Extra memorable splashes granted by ads this week (does not reset the weekly spend). */
  memorableAdBonusThisWeek: number;
  /** Memorable-for-ad grants today (Free +1/day extra cap). */
  memorableAdsGrantedToday: number;
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
    memorablePackBalance: 0,
    illustratedDailySpent: 0,
    illustratedPackBalance: 0,
    illustratedTrialRemaining: def.illustratedTrialImages,
    adsWatchedToday: 0,
    memorableAdBonusThisWeek: 0,
    memorableAdsGrantedToday: 0,
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
        memorableAdsGrantedToday: 0,
        // pack balances intentionally kept
      };
    }
    if (next.weekUtc !== weekUtc()) {
      next = {
        ...next,
        weekUtc: weekUtc(),
        memorableSpent: 0,
        memorableAdBonusThisWeek: 0,
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

function memorableSubRemaining(ledger: CapacityLedger): number {
  const def = getTierDefinition(ledger.tier);
  return Math.max(
    0,
    def.memorableImagesPerWeek + (ledger.memorableAdBonusThisWeek ?? 0) - ledger.memorableSpent
  );
}

export function memorableRemaining(ledger = loadCapacityLedger()): number {
  return memorableSubRemaining(ledger) + Math.max(0, ledger.memorablePackBalance ?? 0);
}

export function memorableWeeklyCapLabel(ledger = loadCapacityLedger()): string {
  const cap = getTierDefinition(ledger.tier).memorableImagesPerWeek;
  const pack = Math.max(0, ledger.memorablePackBalance ?? 0);
  const weekLeft = memorableSubRemaining(ledger);
  if (pack > 0) return `${memorableRemaining(ledger)} left · ${weekLeft} of ${cap} this week + pack`;
  return `${weekLeft} of ${cap} left this week`;
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
    let left = amount;
    const subLeft = memorableSubRemaining(next);
    const fromSub = Math.min(left, subLeft);
    next.memorableSpent += fromSub;
    left -= fromSub;
    if (left > 0) {
      next.memorablePackBalance = Math.max(0, (next.memorablePackBalance ?? 0) - left);
      fromPack = true;
    }
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

export const MAX_MEMORABLE_ADS_PER_DAY = 1;
export const MAX_MEMORABLE_ADS_PER_WEEK = 3;

export function memorableWeeklySubRemaining(ledger = loadCapacityLedger()): number {
  const def = getTierDefinition(ledger.tier);
  return Math.max(0, def.memorableImagesPerWeek - ledger.memorableSpent);
}

export function memorableAdExtrasRemaining(ledger = loadCapacityLedger()): {
  today: number;
  week: number;
} {
  const today = Math.max(0, MAX_MEMORABLE_ADS_PER_DAY - (ledger.memorableAdsGrantedToday ?? 0));
  const week = Math.max(0, MAX_MEMORABLE_ADS_PER_WEEK - (ledger.memorableAdBonusThisWeek ?? 0));
  return { today, week };
}

/**
 * Opt-in rewarded ad — +1 memorable splash on top of this week's cap (does not dump spend).
 * Cheap model only; caller must gate Free tier + extra caps.
 */
export function grantAdMemorableBonus(ledger = loadCapacityLedger()): CapacityLedger {
  const next = {
    ...ledger,
    memorableAdBonusThisWeek: (ledger.memorableAdBonusThisWeek ?? 0) + 1,
    memorableAdsGrantedToday: (ledger.memorableAdsGrantedToday ?? 0) + 1,
    adsWatchedToday: (ledger.adsWatchedToday ?? 0) + 1,
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
    memorablePackBalance: (ledger.memorablePackBalance ?? 0) + (pack.memorablePlates ?? 0),
  };
  saveCapacityLedger(next);
  return next;
}

export function capacityStatusMessage(kind: CapacitySpendKind): string {
  if (kind === 'text') {
    return 'You’re out of turns for today. Upgrade for a higher daily allowance, buy a turn pack (packs never expire), or watch an ad for a few more turns today.';
  }
  if (kind === 'memorable') {
    return 'You’ve hit this week’s memorable splash limit. Buy a picture pack (never expires), upgrade for a higher weekly cap, or watch an ad for +1 cheap splash if you’re on Free.';
  }
  return 'You’re out of illustrations for this graphic novel. Upgrade for more daily art, or buy an illustrated pack (packs never expire) — your place is saved.';
}
