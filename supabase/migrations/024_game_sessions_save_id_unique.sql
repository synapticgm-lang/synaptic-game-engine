-- SAVEFIX: stop duplicate game_sessions rows on concurrent/repeated sync.
-- cloudSync now upserts on save_id; without a unique key Postgres cannot enforce
-- onConflict and races still insert extras. Live index is applied by John's agent
-- separately — do not run this migration from a merge-order agent.
create unique index concurrently if not exists game_sessions_save_id_key on public.game_sessions (save_id);
