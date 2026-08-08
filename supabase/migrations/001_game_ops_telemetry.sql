-- Game Ops Console telemetry tables (synaptic-gm.vercel.app)
-- Run in the Supabase SQL editor for the shared project used by the game + Admin console.

create extension if not exists "pgcrypto";

create table if not exists public.telemetry_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_id text not null default 'guest',
  event_type text not null,
  component text,
  action_target text,
  latency integer,
  message text,
  stack text,
  session_id text,
  device_id text,
  payload jsonb
);

create index if not exists telemetry_logs_created_at_idx on public.telemetry_logs (created_at desc);
create index if not exists telemetry_logs_player_id_idx on public.telemetry_logs (player_id);
create index if not exists telemetry_logs_event_type_idx on public.telemetry_logs (event_type);

create table if not exists public.ai_traffic (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_id text not null default 'guest',
  engine_mode text,
  provider text,
  latency integer,
  token_count integer,
  status text,
  system_prompt text,
  player_input text,
  ai_response text,
  error_stack text,
  save_id text,
  payload jsonb
);

create index if not exists ai_traffic_created_at_idx on public.ai_traffic (created_at desc);
create index if not exists ai_traffic_player_id_idx on public.ai_traffic (player_id);
create index if not exists ai_traffic_status_idx on public.ai_traffic (status);

alter table public.telemetry_logs enable row level security;
alter table public.ai_traffic enable row level security;

-- Clients (anon + signed-in players) may insert telemetry for the Ops Console.
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

-- Ops Console (authenticated staff) may read the streams.
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
