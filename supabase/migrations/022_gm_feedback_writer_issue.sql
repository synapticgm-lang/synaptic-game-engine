-- 28l: raw writer problems the rated beat survived (comma list: empty, reasoning-only, cut-off, recycled,
-- unresolved). Training signal next to the thumbs; the client retries without it until this is applied.
alter table public.gm_response_feedback
  add column if not exists writer_issue text;
