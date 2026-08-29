-- Per-bubble GM feedback: opening / turn 0 / later same-turn GM lines
-- must rate separately. Any authenticated user still owns only their rows.

alter table public.gm_response_feedback
  add column if not exists log_entry_id text;

update public.gm_response_feedback
  set log_entry_id = 'turn-' || turn_number::text
  where log_entry_id is null or btrim(log_entry_id) = '';

alter table public.gm_response_feedback
  alter column log_entry_id set not null;

alter table public.gm_response_feedback
  drop constraint if exists gm_response_feedback_user_id_save_id_turn_number_key;

alter table public.gm_response_feedback
  drop constraint if exists gm_response_feedback_user_save_entry_key;

alter table public.gm_response_feedback
  add constraint gm_response_feedback_user_save_entry_key
  unique (user_id, save_id, log_entry_id);

create index if not exists idx_gm_feedback_log_entry
  on public.gm_response_feedback(save_id, log_entry_id);

-- RLS unchanged: users insert/update/select own rows (tester/player/staff/admin).
-- Staff SELECT-all stays in 020. Testers cannot read other people's feedback.
