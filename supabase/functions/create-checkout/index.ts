/**
 * Create Stripe Checkout session for Mid/High/packs.
 * Secrets: STRIPE_SECRET_KEY, SITE_URL
 * Price ids: STRIPE_PRICE_MID, STRIPE_PRICE_HIGH, STRIPE_PRICE_PACK_SPARK, etc.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SKU_ENV: Record<string, string> = {
  mid: 'STRIPE_PRICE_MID',
  high: 'STRIPE_PRICE_HIGH',
  pack_spark: 'STRIPE_PRICE_PACK_SPARK',
  pack_chapter: 'STRIPE_PRICE_PACK_CHAPTER',
  pack_saga: 'STRIPE_PRICE_PACK_SAGA',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');
    if (!stripeKey || !siteUrl) {
      return json({ error: 'Stripe or SITE_URL not configured' }, 503);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Sign in required' }, 401);

    const body = await req.json().catch(() => ({}));
    const sku = String(body.sku || '').toLowerCase();
    const priceEnv = SKU_ENV[sku];
    if (!priceEnv) return json({ error: `Unknown sku: ${sku}` }, 400);
    const priceId = Deno.env.get(priceEnv);
    if (!priceId) return json({ error: `Price not configured for ${sku}` }, 503);

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const mode = sku === 'mid' || sku === 'high' ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
      client_reference_id: userData.user.id,
      metadata: { user_id: userData.user.id, sku },
      ...(userData.user.email ? { customer_email: userData.user.email } : {}),
    });

    return json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
