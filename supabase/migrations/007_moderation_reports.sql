-- Mirror of Admin 008_moderation_reports.sql (shared Supabase project).

create extension if not exists "pgcrypto";

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'Pending'
    check (status in ('Pending', 'Dismissed', 'Flagged', 'Resolved')),
  source text not null default 'manual'
    check (source in ('manual', 'ai_traffic', 'player', 'auto_error')),
  reason text not null,
  excerpt text,
  reporter text,
  player_id text,
  campaign text,
  engine_mode text,
  ai_traffic_id text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists moderation_reports_status_idx
  on public.moderation_reports (status);
create index if not exists moderation_reports_created_at_idx
  on public.moderation_reports (created_at desc);
create index if not exists moderation_reports_ai_traffic_id_idx
  on public.moderation_reports (ai_traffic_id);

alter table public.moderation_reports enable row level security;

drop policy if exists "moderation_reports_insert_authenticated" on public.moderation_reports;
create policy "moderation_reports_insert_authenticated"
  on public.moderation_reports for insert to authenticated
  with check (true);

drop policy if exists "moderation_reports_select_authenticated" on public.moderation_reports;
create policy "moderation_reports_select_authenticated"
  on public.moderation_reports for select to authenticated
  using (true);

drop policy if exists "moderation_reports_update_authenticated" on public.moderation_reports;
create policy "moderation_reports_update_authenticated"
  on public.moderation_reports for update to authenticated
  using (true) with check (true);
