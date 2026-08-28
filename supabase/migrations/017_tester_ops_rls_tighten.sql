-- Tester window: signed-in Google players must not read Ops streams.
-- SELECT/UPDATE on telemetry, AI traffic, moderation, feedback, and payments
-- is staff-only. INSERT policies stay open so the live game can still write.

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

-- ---- telemetry / AI traffic ----
drop policy if exists "telemetry_logs_select_authenticated" on public.telemetry_logs;
create policy "telemetry_logs_select_staff"
  on public.telemetry_logs for select to authenticated
  using (public.is_staff_email());

drop policy if exists "ai_traffic_select_authenticated" on public.ai_traffic;
create policy "ai_traffic_select_staff"
  on public.ai_traffic for select to authenticated
  using (public.is_staff_email());

-- ---- moderation ----
drop policy if exists "moderation_reports_select_authenticated" on public.moderation_reports;
create policy "moderation_reports_select_staff"
  on public.moderation_reports for select to authenticated
  using (public.is_staff_email());

drop policy if exists "moderation_reports_update_authenticated" on public.moderation_reports;
create policy "moderation_reports_update_staff"
  on public.moderation_reports for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

-- ---- player feedback inbox ----
drop policy if exists "player_feedback_select_authenticated" on public.player_feedback;
create policy "player_feedback_select_staff"
  on public.player_feedback for select to authenticated
  using (public.is_staff_email());

drop policy if exists "player_feedback_update_authenticated" on public.player_feedback;
create policy "player_feedback_update_staff"
  on public.player_feedback for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

-- Players may still read their own feedback rows.
drop policy if exists "player_feedback_select_own" on public.player_feedback;
create policy "player_feedback_select_own"
  on public.player_feedback for select to authenticated
  using (user_id = auth.uid());

-- ---- payments ----
drop policy if exists "payment_events_select_authenticated" on public.payment_events;
create policy "payment_events_select_staff"
  on public.payment_events for select to authenticated
  using (public.is_staff_email());

-- ---- account / entitlement tables (testers are authenticated) ----
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_own_or_staff"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff_email());

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_own_or_staff"
  on public.users for select to authenticated
  using (id = auth.uid() or public.is_staff_email());

drop policy if exists "subscriptions_select_authenticated" on public.subscriptions;
create policy "subscriptions_select_own_or_staff"
  on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_staff_email());

drop policy if exists "subscriptions_update_authenticated" on public.subscriptions;
create policy "subscriptions_update_staff"
  on public.subscriptions for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

drop policy if exists "subscriptions_insert_authenticated" on public.subscriptions;
create policy "subscriptions_insert_staff"
  on public.subscriptions for insert to authenticated
  with check (public.is_staff_email());

drop policy if exists "pack_balances_select_authenticated" on public.pack_balances;
create policy "pack_balances_select_own_or_staff"
  on public.pack_balances for select to authenticated
  using (user_id = auth.uid() or public.is_staff_email());

drop policy if exists "pack_balances_upsert_authenticated" on public.pack_balances;
create policy "pack_balances_insert_staff"
  on public.pack_balances for insert to authenticated
  with check (public.is_staff_email());

drop policy if exists "pack_balances_update_authenticated" on public.pack_balances;
create policy "pack_balances_update_staff"
  on public.pack_balances for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

drop policy if exists "cosmetic_entitlements_select_authenticated" on public.cosmetic_entitlements;
create policy "cosmetic_entitlements_select_own_or_staff"
  on public.cosmetic_entitlements for select to authenticated
  using (user_id = auth.uid() or public.is_staff_email());

drop policy if exists "cosmetic_entitlements_insert_authenticated" on public.cosmetic_entitlements;
create policy "cosmetic_entitlements_insert_staff"
  on public.cosmetic_entitlements for insert to authenticated
  with check (public.is_staff_email());

drop policy if exists "purchase_ledger_select_authenticated" on public.purchase_ledger;
create policy "purchase_ledger_select_staff"
  on public.purchase_ledger for select to authenticated
  using (public.is_staff_email());

drop policy if exists "purchase_ledger_insert_authenticated" on public.purchase_ledger;
create policy "purchase_ledger_insert_staff"
  on public.purchase_ledger for insert to authenticated
  with check (public.is_staff_email());

drop policy if exists "purchase_ledger_update_authenticated" on public.purchase_ledger;
create policy "purchase_ledger_update_staff"
  on public.purchase_ledger for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

drop policy if exists "profiles_update_authenticated_staff" on public.profiles;
create policy "profiles_update_staff"
  on public.profiles for update to authenticated
  using (public.is_staff_email()) with check (public.is_staff_email());

