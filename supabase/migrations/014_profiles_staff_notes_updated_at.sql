-- Staff notes save needs these columns. Live profiles often predate 002's
-- create-table-if-not-exists, so updated_at was never added. Safe to re-run.

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add column if not exists staff_notes text not null default '';

notify pgrst, 'reload schema';
