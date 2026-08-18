/**
 * Stripe webhook → subscriptions / pack_balances / payment_events / cosmetic_entitlements.
 * Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent on payment_events.provider_event_id.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!stripeKey || !whSecret || !serviceKey || !supabaseUrl) {
    return new Response('Not configured', { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Idempotency
  const { data: existing } = await admin
    .from('payment_events')
    .select('id')
    .eq('provider', 'stripe')
    .eq('event_id', event.id)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await handleEvent(admin, stripe, event);
    await admin.from('payment_events').insert({
      provider: 'stripe',
      event_id: event.id,
      event_type: event.type,
      user_id: null,
      sku: null,
      payload: event.data.object as unknown as Record<string, unknown>,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-webhook', message);
    return new Response(message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function handleEvent(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
  event: Stripe.Event
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id || session.client_reference_id;
      const sku = session.metadata?.sku;
      if (!userId || !sku) return;
      await grantSku(admin, userId, sku, session);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) return;
      const planId =
        event.type === 'customer.subscription.deleted' || sub.status !== 'active'
          ? 'free'
          : sub.metadata?.sku === 'high'
            ? 'high'
            : sub.metadata?.sku === 'mid'
              ? 'mid'
              : 'free';
      await upsertSubscription(admin, userId, planId, sub);
      break;
    }
    case 'invoice.paid': {
      // renewals — subscription.updated usually covers plan; keep for audit only
      break;
    }
    default:
      break;
  }
  void stripe;
}

async function grantSku(
  admin: ReturnType<typeof createClient>,
  userId: string,
  sku: string,
  session: Stripe.Checkout.Session
) {
  if (sku === 'mid' || sku === 'high') {
    await upsertSubscription(admin, userId, sku, null, session);
    return;
  }
  const packMap: Record<string, { text?: number; illustrated?: number }> = {
    pack_spark: { text: 40 },
    pack_chapter: { text: 120 },
    pack_saga: { text: 400 },
  };
  const grant = packMap[sku];
  if (!grant) return;

  const { data: row } = await admin
    .from('pack_balances')
    .select('text_balance, illustrated_balance')
    .eq('user_id', userId)
    .maybeSingle();

  const text = Number(row?.text_balance ?? 0) + (grant.text ?? 0);
  const illustrated = Number(row?.illustrated_balance ?? 0) + (grant.illustrated ?? 0);

  await admin.from('pack_balances').upsert(
    {
      user_id: userId,
      text_balance: text,
      illustrated_balance: illustrated,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

async function upsertSubscription(
  admin: ReturnType<typeof createClient>,
  userId: string,
  planId: string,
  sub: Stripe.Subscription | null,
  session?: Stripe.Checkout.Session
) {
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: planId === 'free' ? 'canceled' : 'active',
      provider: 'stripe',
      provider_customer_id: (sub?.customer as string) || (session?.customer as string) || null,
      provider_subscription_id: sub?.id || (session?.subscription as string) || null,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}
