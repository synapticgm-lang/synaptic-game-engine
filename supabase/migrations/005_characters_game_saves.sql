-- Cloud SSOT for player characters and campaign saves.
-- IndexedDB remains a local cache; signed-in players sync here.

create extension if not exists "pgcrypto";

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  class_title text,
  appearance text,
  bio text,
  sheet jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_user_id_idx on public.characters (user_id);
create unique index if not exists characters_user_name_uidx on public.characters (user_id, name);

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  save_id text not null,
  story_name text,
  engine_mode text not null default 'litrpg',
  visual_mode text,
  art_style_preset text,
  character_id uuid references public.characters (id) on delete set null,
  game_state jsonb not null default '{}'::jsonb,
  turn integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, save_id)
);

create index if not exists game_saves_user_id_idx on public.game_saves (user_id);
create index if not exists game_saves_updated_at_idx on public.game_saves (updated_at desc);

alter table public.characters enable row level security;
alter table public.game_saves enable row level security;

drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own"
  on public.characters for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own"
  on public.characters for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "characters_update_own" on public.characters;
create policy "characters_update_own"
  on public.characters for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "characters_delete_own" on public.characters;
create policy "characters_delete_own"
  on public.characters for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "game_saves_select_own" on public.game_saves;
create policy "game_saves_select_own"
  on public.game_saves for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "game_saves_insert_own" on public.game_saves;
create policy "game_saves_insert_own"
  on public.game_saves for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own"
  on public.game_saves for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "game_saves_delete_own" on public.game_saves;
create policy "game_saves_delete_own"
  on public.game_saves for delete to authenticated
  using (auth.uid() = user_id);

-- Keep ops console game_sessions in sync-friendly shape for Admin GameOps.
-- Players upsert their live session row keyed by save_id when authenticated.
