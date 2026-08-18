/**
 * Stripe Checkout + webhook entitlement writers (foundation).
 * Deploy as Supabase Edge Functions; set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 * STRIPE_PRICE_MID, STRIPE_PRICE_HIGH, SITE_URL.
 *
 * Client: createCheckoutSession() → redirect; syncEntitlementsFromServer() on return.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type CheckoutSku = 'mid' | 'high' | 'pack_spark' | 'pack_chapter' | 'pack_saga';

export interface CheckoutSessionResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/** Ask edge function to create a Stripe Checkout session for the signed-in user. */
export async function createCheckoutSession(sku: CheckoutSku): Promise<CheckoutSessionResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false, error: 'Sign in required before checkout' };
  }

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { sku },
  });

  if (error) {
    return { ok: false, error: error.message || 'Checkout failed' };
  }
  const url = (data as { url?: string } | null)?.url;
  if (!url) {
    return { ok: false, error: (data as { error?: string } | null)?.error || 'No checkout URL' };
  }
  return { ok: true, url };
}

export function redirectToCheckout(url: string): void {
  window.location.assign(url);
}
