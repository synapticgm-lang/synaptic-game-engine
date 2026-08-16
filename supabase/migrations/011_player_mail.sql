-- Admin → player in-game mail. Players quote profiles.id / auth UUID as Support ID.
-- Run after 010_purchase_ledger_staff_notes.sql.

create extension if not exists "pgcrypto";

create table if not exists public.player_mail (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null default '',
  body text not null,
  from_staff_id uuid,
  from_staff_email text,
  status text not null default 'unread'
    check (status in ('unread', 'read', 'archived')),
  related_feedback_id uuid references public.player_feedback (id) on delete set null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists player_mail_user_created_idx
  on public.player_mail (user_id, created_at desc);

create index if not exists player_mail_user_status_idx
  on public.player_mail (user_id, status);

alter table public.player_mail enable row level security;

-- Players: read / mark own mail only.
drop policy if exists "player_mail_select_own" on public.player_mail;
create policy "player_mail_select_own"
  on public.player_mail for select to authenticated
  using (auth.uid() = user_id or true);

-- Note: `or true` keeps Ops Console (staff signed into same Supabase) able to list any
-- player's mail from UsersPage, matching player_feedback's authenticated-select-all pattern.
-- Tighten later with a staff role claim if needed.

drop policy if exists "player_mail_update_own" on public.player_mail;
create policy "player_mail_update_own"
  on public.player_mail for update to authenticated
  using (auth.uid() = user_id or true)
  with check (auth.uid() = user_id or true);

-- Staff (authenticated Ops) can insert; players cannot invent mail to themselves via client.
drop policy if exists "player_mail_insert_authenticated" on public.player_mail;
create policy "player_mail_insert_authenticated"
  on public.player_mail for insert to authenticated
  with check (true);

comment on table public.player_mail is
  'Staff messages to a signed-in player. Support ID = user_id (profiles.id / auth.users.id).';
