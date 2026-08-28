-- Play access role (tester window + Admin grant).
-- tester  = silent playtest (unlimited Free text, no art) — default for new Google users
-- player  = normal subscription caps
-- staff   = Admin console + founder play
-- admin   = staff + Admin (BYOK) plan intent

alter table public.profiles
  add column if not exists play_access text not null default 'tester';

alter table public.profiles
  drop constraint if exists profiles_play_access_check;

alter table public.profiles
  add constraint profiles_play_access_check
  check (play_access in ('tester', 'player', 'staff', 'admin'));

create index if not exists profiles_play_access_idx on public.profiles (play_access);

comment on column public.profiles.play_access is
  'Play/ops access: tester | player | staff | admin. Staff/admin also live in staff_members.';

-- Players must not self-promote by updating their own play_access.
create or replace function public.guard_play_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE'
     and NEW.play_access is distinct from OLD.play_access
     and not public.is_staff_email() then
    NEW.play_access := OLD.play_access;
  end if;
  return NEW;
end;
$$;

drop trigger if exists profiles_guard_play_access on public.profiles;
create trigger profiles_guard_play_access
  before update on public.profiles
  for each row
  execute function public.guard_play_access();

-- Staff may grant/revoke Admin console seats.
drop policy if exists "staff_members_insert_staff" on public.staff_members;
create policy "staff_members_insert_staff"
  on public.staff_members for insert to authenticated
  with check (public.is_staff_email());

drop policy if exists "staff_members_update_staff" on public.staff_members;
create policy "staff_members_update_staff"
  on public.staff_members for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

drop policy if exists "staff_members_delete_staff" on public.staff_members;
create policy "staff_members_delete_staff"
  on public.staff_members for delete to authenticated
  using (public.is_staff_email());
