-- Account-level player prefs + lifetime achievement tally (not staff notes).
alter table public.profiles
  add column if not exists player_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.player_prefs is
  'Player-owned: preferred name/gender, plateEvents tally, meta badges. Survives New Game.';

notify pgrst, 'reload schema';
