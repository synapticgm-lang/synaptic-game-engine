-- Player feedback inbox + payment entitlement foundation (shared Supabase / Admin Ops).
-- Run in the Supabase SQL editor after 007_moderation_reports / 008_world_state_ledger.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Player feedback (bug / request / message / praise) — separate from moderation
-- ---------------------------------------------------------------------------

create table if not exists public.player_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  feedback_type text not null
    check (feedback_type in ('bug', 'request', 'message', 'praise')),
  status text not null default 'Open'
    check (status in ('Open', 'Triaged', 'Done')),
  subject text not null default '',
  body text not null,
  player_id text,
  user_id uuid references auth.users (id) on delete set null,
  campaign text,
  engine_mode text,
  turn integer,
  distribution_channel text,
  ai_traffic_id text,
  staff_note text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists player_feedback_created_at_idx
  on public.player_feedback (created_at desc);
create index if not exists player_feedback_status_idx
  on public.player_feedback (status);
create index if not exists player_feedback_type_idx
  on public.player_feedback (feedback_type);
create index if not exists player_feedback_user_id_idx
  on public.player_feedback (user_id);

alter table public.player_feedback enable row level security;

-- Guests + signed-in players can submit.
drop policy if exists "player_feedback_insert_anon" on public.player_feedback;
create policy "player_feedback_insert_anon"
  on public.player_feedback for insert to anon
  with check (true);

drop policy if exists "player_feedback_insert_authenticated" on public.player_feedback;
create policy "player_feedback_insert_authenticated"
  on public.player_feedback for insert to authenticated
  with check (true);

-- Ops Console (staff signed in) reads/updates all rows.
drop policy if exists "player_feedback_select_authenticated" on public.player_feedback;
create policy "player_feedback_select_authenticated"
  on public.player_feedback for select to authenticated
  using (true);

drop policy if exists "player_feedback_update_authenticated" on public.player_feedback;
create policy "player_feedback_update_authenticated"
  on public.player_feedback for update to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Subscriptions: plan_id + payment provider fields (webhook-ready)
-- ---------------------------------------------------------------------------

alter table public.subscriptions
  add column if not exists plan_id text not null default 'free';

alter table public.subscriptions
  add column if not exists provider text not null default 'manual';

alter table public.subscriptions
  add column if not exists provider_customer_id text;

alter table public.subscriptions
  add column if not exists provider_subscription_id text;

-- Soft-check plan_id values (avoid hard CHECK so Admin can migrate gradually).
comment on column public.subscriptions.plan_id is
  'Game plan: free | mid | high | admin. Webhooks write this; client syncs from it.';

-- ---------------------------------------------------------------------------
-- Pack balances (never-expire purchased capacity) — webhook increments
-- ---------------------------------------------------------------------------

create table if not exists public.pack_balances (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  text_balance integer not null default 0 check (text_balance >= 0),
  illustrated_balance integer not null default 0 check (illustrated_balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.pack_balances enable row level security;

drop policy if exists "pack_balances_select_authenticated" on public.pack_balances;
create policy "pack_balances_select_authenticated"
  on public.pack_balances for select to authenticated
  using (true);

-- Writes only via service role / webhooks (no client insert/update policies).

-- ---------------------------------------------------------------------------
-- Cosmetic entitlements — owned forever
-- ---------------------------------------------------------------------------

create table if not exists public.cosmetic_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  granted_at timestamptz not null default now(),
  source_payment_id text,
  unique (user_id, item_id)
);

create index if not exists cosmetic_entitlements_user_id_idx
  on public.cosmetic_entitlements (user_id);

alter table public.cosmetic_entitlements enable row level security;

drop policy if exists "cosmetic_entitlements_select_authenticated" on public.cosmetic_entitlements;
create policy "cosmetic_entitlements_select_authenticated"
  on public.cosmetic_entitlements for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Payment event idempotency (Stripe / adult processor webhooks)
-- ---------------------------------------------------------------------------

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  provider text not null,
  event_id text not null,
  event_type text,
  user_id uuid references public.profiles (id) on delete set null,
  sku text,
  payload jsonb not null default '{}'::jsonb,
  unique (provider, event_id)
);

create index if not exists payment_events_user_id_idx
  on public.payment_events (user_id);

alter table public.payment_events enable row level security;

drop policy if exists "payment_events_select_authenticated" on public.payment_events;
create policy "payment_events_select_authenticated"
  on public.payment_events for select to authenticated
  using (true);

-- No client inserts — webhooks use service role.
