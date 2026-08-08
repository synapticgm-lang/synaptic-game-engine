-- Ensure Google Auth sign-ups sync into public.profiles + default Free subscription.
-- Safe to re-run. Same shared Supabase project as Admin.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  status text not null default 'Active',
  total_playtime_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier text not null default 'Free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  tier text not null default 'Free',
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Player'
  );

  insert into public.profiles (id, email, created_at, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.created_at, now()),
    v_display_name,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  insert into public.users (id, email, name, created_at)
  values (
    new.id,
    new.email,
    v_display_name,
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.users.name, excluded.name);

  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'Free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

insert into public.profiles (id, email, created_at, display_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.created_at, now()),
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Player'
  ),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
on conflict (id) do nothing;

insert into public.users (id, email, name, created_at)
select p.id, p.email, p.display_name, p.created_at
from public.profiles p
on conflict (id) do nothing;

insert into public.subscriptions (user_id, tier, status)
select p.id, 'Free', 'active'
from public.profiles p
on conflict (user_id) do nothing;
