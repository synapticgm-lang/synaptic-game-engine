-- 28w: provider-reported token use of the rated beat, summed over every model call of that turn
-- (re-asks included), for pricing the Free tier. Null = the provider sent no usage; never estimated.
alter table public.gm_response_feedback
  add column if not exists tokens_in integer,
  add column if not exists tokens_out integer,
  add column if not exists tokens_cached integer,
  add column if not exists model_calls integer,
  add column if not exists model_id text;
