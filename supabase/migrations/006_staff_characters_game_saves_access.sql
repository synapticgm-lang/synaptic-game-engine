-- Allow staff_members to read/update/delete all characters + game_saves for Ops Console.
-- Mirror of Admin migration 007_staff_characters_game_saves_access.sql

create or replace function public.is_staff_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members sm
    where lower(sm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_staff_email() from public;
grant execute on function public.is_staff_email() to authenticated;

drop policy if exists "characters_select_staff" on public.characters;
create policy "characters_select_staff"
  on public.characters for select to authenticated
  using (public.is_staff_email());

drop policy if exists "characters_update_staff" on public.characters;
create policy "characters_update_staff"
  on public.characters for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

drop policy if exists "characters_delete_staff" on public.characters;
create policy "characters_delete_staff"
  on public.characters for delete to authenticated
  using (public.is_staff_email());

drop policy if exists "game_saves_select_staff" on public.game_saves;
create policy "game_saves_select_staff"
  on public.game_saves for select to authenticated
  using (public.is_staff_email());

drop policy if exists "game_saves_update_staff" on public.game_saves;
create policy "game_saves_update_staff"
  on public.game_saves for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

drop policy if exists "game_saves_delete_staff" on public.game_saves;
create policy "game_saves_delete_staff"
  on public.game_saves for delete to authenticated
  using (public.is_staff_email());
