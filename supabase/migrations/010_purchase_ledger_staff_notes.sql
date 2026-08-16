-- Purchase ledger (tax / accountants / sales analytics / unlock disputes)
-- + staff notes on profiles. Shared Supabase — run after 009.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Staff notes on players (internal ops)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists staff_notes text not null default '';

comment on column public.profiles.staff_notes is
  'Internal ops notes about the player (comps, disputes, support). Not shown in-game.';

-- ---------------------------------------------------------------------------
-- Purchase ledger — every paid sale + every manual/comp grant
-- ---------------------------------------------------------------------------

create table if not exists public.purchase_ledger (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  user_id uuid references public.profiles (id) on delete set null,
  customer_email text,
  customer_name text,

  -- What they bought / were granted
  sku text not null,
  product_name text not null,
  product_kind text not null default 'other'
    check (product_kind in (
      'subscription', 'pack', 'cosmetic', 'bundle', 'trial', 'other'
    )),
  quantity integer not null default 1 check (quantity > 0),

  -- Money (store minor units — pence for GBP)
  currency text not null default 'gbp',
  amount_gross_minor integer not null default 0,
  amount_net_minor integer not null default 0,
  amount_tax_minor integer not null default 0,
  tax_rate_percent numeric(6, 3),

  -- paid = real money; comp = staff gift; refunded / void for corrections
  status text not null default 'paid'
    check (status in ('paid', 'comp', 'refunded', 'void', 'pending')),

  provider text not null default 'manual'
    check (provider in ('stripe', 'adult', 'manual', 'apple', 'google')),
  provider_payment_id text,
  provider_invoice_id text,
  provider_session_id text,
  provider_customer_id text,

  -- Subscription period if applicable
  period_start timestamptz,
  period_end timestamptz,

  -- What unlocks this row granted (for support disputes)
  unlocked jsonb not null default '{}'::jsonb,
  -- e.g. {"plan_id":"mid","pack":{"text":35},"cosmetics":["theme.neon-protocol"]}

  country text,
  staff_note text,
  granted_by_staff_id uuid,
  granted_by_staff_email text,

  payload jsonb not null default '{}'::jsonb
);

create index if not exists purchase_ledger_created_at_idx
  on public.purchase_ledger (created_at desc);
create index if not exists purchase_ledger_user_id_idx
  on public.purchase_ledger (user_id);
create index if not exists purchase_ledger_sku_idx
  on public.purchase_ledger (sku);
create index if not exists purchase_ledger_status_idx
  on public.purchase_ledger (status);
create index if not exists purchase_ledger_provider_payment_id_idx
  on public.purchase_ledger (provider_payment_id);

alter table public.purchase_ledger enable row level security;

drop policy if exists "purchase_ledger_select_authenticated" on public.purchase_ledger;
create policy "purchase_ledger_select_authenticated"
  on public.purchase_ledger for select to authenticated
  using (true);

drop policy if exists "purchase_ledger_insert_authenticated" on public.purchase_ledger;
create policy "purchase_ledger_insert_authenticated"
  on public.purchase_ledger for insert to authenticated
  with check (true);

drop policy if exists "purchase_ledger_update_authenticated" on public.purchase_ledger;
create policy "purchase_ledger_update_authenticated"
  on public.purchase_ledger for update to authenticated
  using (true) with check (true);

-- Players can read their own rows (support / “what did I buy”)
drop policy if exists "purchase_ledger_select_own" on public.purchase_ledger;
create policy "purchase_ledger_select_own"
  on public.purchase_ledger for select to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Allow staff to update pack_balances / cosmetic_entitlements for comps
-- (webhook path still uses service role; staff UI uses authenticated update)
-- ---------------------------------------------------------------------------

drop policy if exists "pack_balances_upsert_authenticated" on public.pack_balances;
create policy "pack_balances_upsert_authenticated"
  on public.pack_balances for insert to authenticated
  with check (true);

drop policy if exists "pack_balances_update_authenticated" on public.pack_balances;
create policy "pack_balances_update_authenticated"
  on public.pack_balances for update to authenticated
  using (true) with check (true);

drop policy if exists "cosmetic_entitlements_insert_authenticated" on public.cosmetic_entitlements;
create policy "cosmetic_entitlements_insert_authenticated"
  on public.cosmetic_entitlements for insert to authenticated
  with check (true);

-- Staff may update subscriptions (tier / plan_id comps)
drop policy if exists "subscriptions_update_authenticated" on public.subscriptions;
create policy "subscriptions_update_authenticated"
  on public.subscriptions for update to authenticated
  using (true) with check (true);

drop policy if exists "subscriptions_insert_authenticated" on public.subscriptions;
create policy "subscriptions_insert_authenticated"
  on public.subscriptions for insert to authenticated
  with check (true);

-- Staff notes on profiles
drop policy if exists "profiles_update_authenticated_staff" on public.profiles;
create policy "profiles_update_authenticated_staff"
  on public.profiles for update to authenticated
  using (true) with check (true);
