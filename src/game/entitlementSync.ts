/**
 * Server entitlement sync — subscriptions.plan_id, pack_balances, cosmetic_entitlements.
 * Webhooks (Stripe / adult) write those tables; client pulls on login.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  setActiveSubscriptionTier,
  type SubscriptionTierId,
} from '@/game/subscriptionTiers';
import { applyStaffDailyReset, loadCapacityLedger, saveCapacityLedger } from '@/game/capacityLedger';
import { loadSettings, saveSettings } from '@/game/db';
import { unlockCosmetic } from '@/game/cosmeticEntitlements';
import { isTesterCohort, parsePlayAccess, setServerPlayAccess } from '@/game/testLab';

/** Keep in sync with `SETTINGS_EVENT_NAME` in useGame (avoid circular import). */
const SETTINGS_EVENT_NAME = 'tactical-litrpg-settings-update';

export interface EntitlementSyncResult {
  ok: boolean;
  planId: SubscriptionTierId;
  textPackBalance: number | null;
  illustratedPackBalance: number | null;
  cosmeticsGranted: number;
  error?: string;
  skipped?: boolean;
}

function parsePlanId(raw: unknown): SubscriptionTierId {
  const v = String(raw ?? '').toLowerCase().trim();
  if (v === 'mid' || v === 'high' || v === 'admin' || v === 'free') return v;
  // Legacy Admin display labels
  if (v === 'hero') return 'mid';
  if (v === 'system master' || v === 'system_master') return 'high';
  return 'free';
}

/** Honor `current_period_end` so a 1-month complimentary Mid/High does not last forever. Null = lasting. */
function planIdFromSubscriptionRow(row: {
  plan_id?: string;
  tier?: string;
  current_period_end?: string | null;
} | null): SubscriptionTierId {
  const parsed = parsePlanId(row?.plan_id ?? row?.tier ?? 'free');
  const endRaw = row?.current_period_end;
  if (!endRaw) return parsed;
  const end = Date.parse(String(endRaw));
  if (!Number.isNaN(end) && end <= Date.now()) return 'free';
  return parsed;
}

function emitSettings(settings: ReturnType<typeof loadSettings>): void {
  try {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: settings }));
  } catch {
    /* ignore */
  }
}

/**
 * Pull server entitlements for the signed-in user and apply locally.
 * Pack balances: take max(local, server) so mid-session spends are not wiped before
 * server-side spend ships.
 */
export async function syncEntitlementsFromServer(): Promise<EntitlementSyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      skipped: true,
      planId: 'free',
      textPackBalance: null,
      illustratedPackBalance: null,
      cosmeticsGranted: 0,
      error: 'Supabase not configured',
    };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return {
      ok: false,
      skipped: true,
      planId: 'free',
      textPackBalance: null,
      illustratedPackBalance: null,
      cosmeticsGranted: 0,
      error: authError?.message ?? 'Not signed in',
    };
  }

  const userId = authData.user.id;

  const [subRes, packResRaw, cosRes, profileRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan_id, tier, status, current_period_end, provider')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('pack_balances')
      .select('text_balance, illustrated_balance, capacity_reset_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('cosmetic_entitlements')
      .select('item_id')
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('play_access')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  if (!profileRes.error) {
    setServerPlayAccess(parsePlayAccess((profileRes.data as { play_access?: string } | null)?.play_access));
  }

  let packRes = packResRaw;
  if (packRes.error && /capacity_reset_at|column/i.test(packRes.error.message)) {
    packRes = await supabase
      .from('pack_balances')
      .select('text_balance, illustrated_balance')
      .eq('user_id', userId)
      .maybeSingle();
  }

  if (subRes.error && !subRes.data) {
    // plan_id column may not exist until migration 009 is applied
    console.warn('[entitlements] subscriptions read failed', subRes.error.message);
  }

  const planId = planIdFromSubscriptionRow(
    (subRes.data as {
      plan_id?: string;
      tier?: string;
      current_period_end?: string | null;
    } | null) ?? null
  );

  const writerPlan = isTesterCohort() ? 'free' : planId;
  setActiveSubscriptionTier(writerPlan);
  const settings = loadSettings();
  const testerLock = isTesterCohort();
  const nextSettings = {
    ...settings,
    subscriptionTier: writerPlan,
    ...(testerLock
      ? {
          visualMode: 'classic' as const,
          artStylePreset: 'classic-book' as const,
          classicMemorableImages: false,
        }
      : {}),
  };
  if (
    settings.subscriptionTier !== nextSettings.subscriptionTier
    || settings.classicMemorableImages !== nextSettings.classicMemorableImages
    || settings.visualMode !== nextSettings.visualMode
  ) {
    saveSettings(nextSettings);
    emitSettings(nextSettings);
  } else {
    saveSettings(nextSettings);
  }

  let textPackBalance: number | null = null;
  let illustratedPackBalance: number | null = null;

  if (!packRes.error && packRes.data) {
    const serverText = Math.max(0, Number(packRes.data.text_balance ?? 0));
    const serverIllus = Math.max(0, Number(packRes.data.illustrated_balance ?? 0));
    const ledger = loadCapacityLedger();
    const next = {
      ...ledger,
      tier: planId,
      textPackBalance: Math.max(ledger.textPackBalance, serverText),
      illustratedPackBalance: Math.max(ledger.illustratedPackBalance, serverIllus),
    };
    saveCapacityLedger(next);
    const resetAt = (packRes.data as { capacity_reset_at?: string | null }).capacity_reset_at;
    const afterReset = resetAt ? applyStaffDailyReset(String(resetAt), next) : next;
    textPackBalance = afterReset.textPackBalance;
    illustratedPackBalance = afterReset.illustratedPackBalance;
  } else {
    const ledger = loadCapacityLedger();
    if (ledger.tier !== planId) {
      saveCapacityLedger({ ...ledger, tier: planId });
    }
  }

  let cosmeticsGranted = 0;
  if (!cosRes.error && cosRes.data?.length) {
    for (const row of cosRes.data) {
      const id = String((row as { item_id?: string }).item_id ?? '');
      if (!id) continue;
      unlockCosmetic(id);
      cosmeticsGranted += 1;
    }
  }

  return {
    ok: true,
    planId,
    textPackBalance,
    illustratedPackBalance,
    cosmeticsGranted,
    error: subRes.error?.message ?? packRes.error?.message ?? cosRes.error?.message,
  };
}
