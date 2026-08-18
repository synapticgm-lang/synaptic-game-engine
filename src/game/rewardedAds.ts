/**
 * Rewarded ads → extra text turns, and Free-tier +1 memorable after the weekly cap.
 *
 * Soft offer when out of turns; Shop → Earn turns anytime if eligible.
 * Memorable: Free only, schnell, +1/day and +3/week extra (does not dump weekly spend).
 * Kid Mode: unlimited completed ads for turns (family AdMob when live); memorable extras still capped.
 * Adult Free: hard daily ad cap; then packs / sub.
 * Providers: stub now; AppLixir (adult) + AdMob kids later.
 */

import {
  getActiveSubscriptionTier,
  getTierDefinition,
} from './subscriptionTiers';
import {
  grantAdBonusTurns,
  grantAdMemorableBonus,
  loadCapacityLedger,
  memorableAdExtrasRemaining,
  memorableWeeklySubRemaining,
  MAX_MEMORABLE_ADS_PER_DAY,
  MAX_MEMORABLE_ADS_PER_WEEK,
  type CapacityLedger,
} from './capacityLedger';
import { adsKilled } from './opsKillSwitches';

export type RewardedAdProfile = 'kid' | 'adult';

export type RewardedAdProviderId = 'stub' | 'applixir' | 'admob_kids';

const DEFAULT_KID_AD_TURNS = 3;

/** Adult Free only — Kid Mode has no hard cap. */
export const ADULT_MAX_REWARDED_ADS_PER_DAY = 8;

export function resolveRewardedAdProfile(contentMode: string | null | undefined): RewardedAdProfile {
  return contentMode === 'kid' ? 'kid' : 'adult';
}

export function preferredRewardedProvider(profile: RewardedAdProfile): RewardedAdProviderId {
  if (import.meta.env.VITE_REWARDED_ADS_LIVE === 'true') {
    return profile === 'kid' ? 'admob_kids' : 'applixir';
  }
  return 'stub';
}

/** Turns granted per completed ad for this tier / kid mode. */
export function rewardedTurnsPerAd(contentMode?: string | null): number {
  const def = getTierDefinition(getActiveSubscriptionTier());
  if (def.adTextTurns > 0) return def.adTextTurns;
  if (contentMode === 'kid') return DEFAULT_KID_AD_TURNS;
  return 0;
}

/**
 * Who may watch for turns at all (plan gate).
 * Kid Mode: always (family path). Adult: Free only (noAds tiers blocked).
 */
export function canOfferRewardedTurns(contentMode?: string | null): boolean {
  if (adsKilled()) return false;
  return rewardedTurnsPerAd(contentMode) > 0 && (
    contentMode === 'kid'
    || !getTierDefinition(getActiveSubscriptionTier()).noAds
  );
}

/** null = unlimited (Kid Mode). */
export function adultAdsRemainingToday(ledger = loadCapacityLedger()): number | null {
  return Math.max(0, ADULT_MAX_REWARDED_ADS_PER_DAY - (ledger.adsWatchedToday ?? 0));
}

export function rewardedAdsRemainingToday(
  contentMode?: string | null,
  ledger = loadCapacityLedger()
): number | null {
  if (!canOfferRewardedTurns(contentMode)) return 0;
  if (contentMode === 'kid') return null; // unlimited
  return adultAdsRemainingToday(ledger);
}

/** Ready to start another ad right now (plan + adult daily cap). */
export function canWatchRewardedAdNow(contentMode?: string | null): boolean {
  if (!canOfferRewardedTurns(contentMode)) return false;
  const left = rewardedAdsRemainingToday(contentMode);
  return left === null || left > 0;
}

export interface WatchRewardedResult {
  ok: boolean;
  ledger: CapacityLedger;
  turnsGranted: number;
  provider: RewardedAdProviderId;
  error?: string;
}

/**
 * Show rewarded ad; only grant after successful completion.
 */
export async function watchRewardedAdForTurns(args: {
  contentMode?: string | null;
}): Promise<WatchRewardedResult> {
  const profile = resolveRewardedAdProfile(args.contentMode);
  const provider = preferredRewardedProvider(profile);
  const turns = rewardedTurnsPerAd(args.contentMode);
  const ledgerNow = loadCapacityLedger();

  if (!canOfferRewardedTurns(args.contentMode) || turns <= 0) {
    return {
      ok: false,
      ledger: ledgerNow,
      turnsGranted: 0,
      provider,
      error: 'Ads are not available on this plan.',
    };
  }

  if (!canWatchRewardedAdNow(args.contentMode)) {
    return {
      ok: false,
      ledger: ledgerNow,
      turnsGranted: 0,
      provider,
      error: `Daily ad limit reached (${ADULT_MAX_REWARDED_ADS_PER_DAY}). Buy a turn pack or upgrade — or try again tomorrow.`,
    };
  }

  const completed = await playRewardedProvider(provider, profile);
  if (!completed.ok) {
    return {
      ok: false,
      ledger: loadCapacityLedger(),
      turnsGranted: 0,
      provider,
      error: completed.error ?? 'Ad did not complete — no turns granted.',
    };
  }

  const ledger = grantAdBonusTurns(turns);
  return { ok: true, ledger, turnsGranted: turns, provider };
}

export interface WatchMemorableAdResult {
  ok: boolean;
  ledger: CapacityLedger;
  granted: number;
  provider: RewardedAdProviderId;
  error?: string;
}

/**
 * Free only, after the weekly memorable cap: +1 schnell splash that does not dump the week.
 * Extra cap: +1/day and +3/week. Kid Mode uses the family ad rail when live.
 */
export function canOfferRewardedMemorable(contentMode?: string | null): boolean {
  const tier = getActiveSubscriptionTier();
  if (tier !== 'free') return false;
  if (memorableWeeklySubRemaining() > 0) return false;
  const extras = memorableAdExtrasRemaining();
  if (extras.today <= 0 || extras.week <= 0) return false;
  return canWatchRewardedAdNow(contentMode);
}

export async function watchRewardedAdForMemorable(args: {
  contentMode?: string | null;
}): Promise<WatchMemorableAdResult> {
  const profile = resolveRewardedAdProfile(args.contentMode);
  const provider = preferredRewardedProvider(profile);
  const ledgerNow = loadCapacityLedger();

  if (getActiveSubscriptionTier() !== 'free') {
    return { ok: false, ledger: ledgerNow, granted: 0, provider, error: 'Extra memorable ads are Free-tier only.' };
  }
  if (memorableWeeklySubRemaining() > 0) {
    return { ok: false, ledger: ledgerNow, granted: 0, provider, error: 'Weekly memorable pictures are still available.' };
  }
  const extras = memorableAdExtrasRemaining();
  if (extras.today <= 0) {
    return {
      ok: false,
      ledger: ledgerNow,
      granted: 0,
      provider,
      error: `Extra memorable pictures are +${MAX_MEMORABLE_ADS_PER_DAY}/day. Try again tomorrow.`,
    };
  }
  if (extras.week <= 0) {
    return {
      ok: false,
      ledger: ledgerNow,
      granted: 0,
      provider,
      error: `Extra memorable pictures are +${MAX_MEMORABLE_ADS_PER_WEEK}/week from ads.`,
    };
  }
  if (!canWatchRewardedAdNow(args.contentMode)) {
    return {
      ok: false,
      ledger: ledgerNow,
      granted: 0,
      provider,
      error: `Daily ad limit reached (${ADULT_MAX_REWARDED_ADS_PER_DAY}). Try again tomorrow.`,
    };
  }

  const completed = await playRewardedProvider(provider, profile);
  if (!completed.ok) {
    return {
      ok: false,
      ledger: loadCapacityLedger(),
      granted: 0,
      provider,
      error: completed.error ?? 'Ad did not complete — no picture granted.',
    };
  }

  const ledger = grantAdMemorableBonus();
  return { ok: true, ledger, granted: 1, provider };
}

async function playRewardedProvider(
  provider: RewardedAdProviderId,
  profile: RewardedAdProfile
): Promise<{ ok: boolean; error?: string }> {
  if (provider === 'stub') {
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true };
  }

  void profile;
  return {
    ok: false,
    error: `${provider} is not configured yet. Set VITE_REWARDED_ADS_LIVE only after SDK keys are live.`,
  };
}
