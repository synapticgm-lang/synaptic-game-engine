-- Repair existing telemetry / ai_traffic / profiles (safe to re-run).
-- Fixes: tables existed without created_at (and possibly other columns).

create extension if not exists "pgcrypto";

-- ---- telemetry_logs ----
create table if not exists public.telemetry_logs (
  id uuid primary key default gen_random_uuid()
);

alter table public.telemetry_logs add column if not exists created_at timestamptz not null default now();
alter table public.telemetry_logs add column if not exists player_id text not null default 'guest';
alter table public.telemetry_logs add column if not exists event_type text not null default 'unknown';
alter table public.telemetry_logs add column if not exists component text;
alter table public.telemetry_logs add column if not exists action_target text;
alter table public.telemetry_logs add column if not exists latency integer;
alter table public.telemetry_logs add column if not exists message text;
alter table public.telemetry_logs add column if not exists stack text;
alter table public.telemetry_logs add column if not exists session_id text;
alter table public.telemetry_logs add column if not exists device_id text;
alter table public.telemetry_logs add column if not exists payload jsonb;

-- ---- ai_traffic ----
create table if not exists public.ai_traffic (
  id uuid primary key default gen_random_uuid()
);

alter table public.ai_traffic add column if not exists created_at timestamptz not null default now();
alter table public.ai_traffic add column if not exists player_id text not null default 'guest';
alter table public.ai_traffic add column if not exists engine_mode text;
alter table public.ai_traffic add column if not exists provider text;
alter table public.ai_traffic add column if not exists latency integer;
alter table public.ai_traffic add column if not exists token_count integer;
alter table public.ai_traffic add column if not exists status text;
alter table public.ai_traffic add column if not exists system_prompt text;
alter table public.ai_traffic add column if not exists player_input text;
alter table public.ai_traffic add column if not exists ai_response text;
alter table public.ai_traffic add column if not exists error_stack text;
alter table public.ai_traffic add column if not exists save_id text;
alter table public.ai_traffic add column if not exists payload jsonb;

-- ---- profiles playtime ----
alter table public.profiles
  add column if not exists total_playtime_minutes integer not null default 0;

create index if not exists telemetry_logs_created_at_idx on public.telemetry_logs (created_at desc);
create index if not exists telemetry_logs_player_id_idx on public.telemetry_logs (player_id);
create index if not exists telemetry_logs_event_type_idx on public.telemetry_logs (event_type);
create index if not exists ai_traffic_created_at_idx on public.ai_traffic (created_at desc);
create index if not exists ai_traffic_player_id_idx on public.ai_traffic (player_id);
create index if not exists ai_traffic_status_idx on public.ai_traffic (status);

alter table public.telemetry_logs enable row level security;
alter table public.ai_traffic enable row level security;

drop policy if exists "telemetry_logs_insert_anon" on public.telemetry_logs;
create policy "telemetry_logs_insert_anon"
  on public.telemetry_logs for insert
  to anon, authenticated
  with check (true);

drop policy if exists "ai_traffic_insert_anon" on public.ai_traffic;
create policy "ai_traffic_insert_anon"
  on public.ai_traffic for insert
  to anon, authenticated
  with check (true);

drop policy if exists "telemetry_logs_select_authenticated" on public.telemetry_logs;
create policy "telemetry_logs_select_authenticated"
  on public.telemetry_logs for select
  to authenticated
  using (true);

drop policy if exists "ai_traffic_select_authenticated" on public.ai_traffic;
create policy "ai_traffic_select_authenticated"
  on public.ai_traffic for select
  to authenticated
  using (true);
