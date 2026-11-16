-- Training capture for gm-turn (16 Nov 2026). Server-side only: gm-turn inserts with the service role.
-- Rows are CANDIDATES; quality approval and training admission happen later, elsewhere.
-- Rights come from the host that actually served the call (src/game/trainingRights.ts), never the request.
-- Every CHECK list below mirrors src/game/trainingCaptureVocab.ts (one source; trainingCaptureVocab.test.ts enforces it).

create extension if not exists "pgcrypto";

create table if not exists public.gm_turn_captures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  schema_version integer not null,

  -- identity
  call_id uuid not null unique,
  call_kind text not null check (call_kind in ('writer', 'rewrite', 'repair', 'check')),
  parent_call_id uuid,
  root_turn_id text not null,
  attempt_count integer not null default 1,

  -- who / where (user id only; no email or names stored here)
  user_id uuid,
  capture_basis text not null check (capture_basis in ('founder', 'staff', 'test', 'opt_in')),
  session_id text,
  save_id text,
  campaign_id text,
  world_id text,
  engine_mode text,
  turn_no integer,

  -- build provenance (client build + edge capture code)
  build_stamp text,
  git_sha text,

  -- exactly what was sent (ordered messages of every attempt) and how
  request_messages jsonb not null,
  inference_settings jsonb not null,
  key_source text not null check (key_source in ('server', 'player')),

  -- what really served it (from the OpenRouter completion, not the request)
  requested_model text,
  served_provider text,
  served_model text,
  generation_ids text[] not null default '{}',
  route_fallback boolean not null,
  rights text not null check (rights in ('allowed', 'conditional', 'excluded', 'unknown')),

  -- completion
  finish_reason text,
  completion_status text not null check (completion_status in ('ok', 'empty', 'error', 'rate_limited')),
  usage jsonb,

  -- outputs: first attempt, re-ask (if any), and what gm-turn returned
  output_initial text,
  output_reask text,
  output_final text,

  -- player input and engine context
  player_input jsonb,
  resolved_action text,
  engine_facts jsonb,

  status text not null default 'candidate' check (status in ('candidate', 'accepted', 'rejected', 'quarantined'))
);

create index if not exists gm_turn_captures_root_idx on public.gm_turn_captures (root_turn_id);
create index if not exists gm_turn_captures_parent_idx on public.gm_turn_captures (parent_call_id);
create index if not exists gm_turn_captures_created_idx on public.gm_turn_captures (created_at);
create index if not exists gm_turn_captures_user_idx on public.gm_turn_captures (user_id);

comment on table public.gm_turn_captures is
  'gm-turn training capture: one row per model call (writer = the gameplay turn; rewrite/repair/check link to it via parent_call_id). Candidates only. Service role inserts; no client access.';

-- Locked down: RLS on, no policies, no grants to client roles. Only the service role (bypasses RLS) writes.
alter table public.gm_turn_captures enable row level security;
revoke all on table public.gm_turn_captures from anon, authenticated;
revoke all on table public.gm_turn_captures from public;

-- New rows are always candidates (the service role may later change status during review).
create or replace function public.gm_turn_captures_force_candidate()
returns trigger
language plpgsql
as $$
begin
  new.status := 'candidate';
  return new;
end;
$$;
drop trigger if exists gm_turn_captures_candidate on public.gm_turn_captures;
create trigger gm_turn_captures_candidate
  before insert on public.gm_turn_captures
  for each row execute function public.gm_turn_captures_force_candidate();

-- Player opt-in for training capture: OFF by default. Only the player themself can turn it on or off.
alter table public.profiles
  add column if not exists training_capture_opt_in boolean not null default false,
  add column if not exists training_capture_opt_in_at timestamptz;

comment on column public.profiles.training_capture_opt_in is
  'Explicit player opt-in to gm-turn training capture. Default false. Set only by the player (guarded).';

create or replace function public.guard_training_capture_opt_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.training_capture_opt_in is distinct from old.training_capture_opt_in then
    -- Staff edits and other users never change someone else's consent; service-role/SQL sessions (no JWT) may.
    if auth.uid() is not null and auth.uid() <> old.id then
      new.training_capture_opt_in := old.training_capture_opt_in;
      new.training_capture_opt_in_at := old.training_capture_opt_in_at;
    else
      new.training_capture_opt_in_at := now();
    end if;
  elsif new.training_capture_opt_in_at is distinct from old.training_capture_opt_in_at then
    new.training_capture_opt_in_at := old.training_capture_opt_in_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_training_capture_opt_in on public.profiles;
create trigger profiles_guard_training_capture_opt_in
  before update on public.profiles
  for each row execute function public.guard_training_capture_opt_in();
