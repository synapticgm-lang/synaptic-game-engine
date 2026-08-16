/**
 * Server entitlement sync — subscriptions.plan_id, pack_balances, cosmetic_entitlements.
 * Webhooks (Stripe / adult) write those tables; client pulls on login.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  setActiveSubscriptionTier,
  type SubscriptionTierId,
} from '@/game/subscriptionTiers';
import { loadCapacityLedger, saveCapacityLedger } from '@/game/capacityLedger';
import { loadSettings, saveSettings } from '@/game/db';
import { unlockCosmetic } from '@/game/cosmeticEntitlements';

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

  const [subRes, packRes, cosRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan_id, tier, status, current_period_end, provider')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('pack_balances')
      .select('text_balance, illustrated_balance')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('cosmetic_entitlements')
      .select('item_id')
      .eq('user_id', userId),
  ]);

  if (subRes.error && !subRes.data) {
    // plan_id column may not exist until migration 009 is applied
    console.warn('[entitlements] subscriptions read failed', subRes.error.message);
  }

  const planId = parsePlanId(
    (subRes.data as { plan_id?: string; tier?: string } | null)?.plan_id
      ?? (subRes.data as { tier?: string } | null)?.tier
      ?? 'free'
  );

  setActiveSubscriptionTier(planId);
  const settings = loadSettings();
  if (settings.subscriptionTier !== planId) {
    const next = { ...settings, subscriptionTier: planId };
    saveSettings(next);
    emitSettings(next);
  } else {
    saveSettings(settings);
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
    textPackBalance = next.textPackBalance;
    illustratedPackBalance = next.illustratedPackBalance;
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
