-- Staff daily-limit refresh flag (shared Supabase).
-- Same statement as Admin project 012_staff_capacity_reset.sql — run once.

create table if not exists public.pack_balances (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  text_balance integer not null default 0 check (text_balance >= 0),
  illustrated_balance integer not null default 0 check (illustrated_balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.pack_balances
  add column if not exists capacity_reset_at timestamptz;

comment on column public.pack_balances.capacity_reset_at is
  'Staff refresh of daily turn/image caps. Client zeros local daily spend when this timestamp is newer than last applied; pack balances unchanged.';
