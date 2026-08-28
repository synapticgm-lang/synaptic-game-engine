-- Allow service-role / SQL (no JWT) to set play_access.
-- Players still cannot self-promote: authenticated + not staff ⇒ revert.

create or replace function public.guard_play_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE'
     and NEW.play_access is distinct from OLD.play_access
     and auth.uid() is not null
     and not public.is_staff_email() then
    NEW.play_access := OLD.play_access;
  end if;
  return NEW;
end;
$$;
