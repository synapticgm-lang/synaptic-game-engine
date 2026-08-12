-- World State Ledger columns on game_saves for queryable anti-hallucination memory.
-- Full snapshot remains in game_state JSONB; these fields mirror key ledger slices.

alter table public.game_saves
  add column if not exists campaign_bible_id text,
  add column if not exists campaign_premise text,
  add column if not exists current_location text,
  add column if not exists timeline jsonb not null default '[]'::jsonb,
  add column if not exists npc_memories jsonb not null default '[]'::jsonb,
  add column if not exists location_sheet jsonb,
  add column if not exists ledger_version integer not null default 1;

create index if not exists game_saves_campaign_bible_id_idx
  on public.game_saves (campaign_bible_id);

create index if not exists game_saves_current_location_idx
  on public.game_saves (current_location);

comment on column public.game_saves.timeline is
  'Append-only factual timeline facts (no chat fluff). Mirrored from game_state.timeline.';
comment on column public.game_saves.npc_memories is
  'Per-NPC memory ledger mirrored from game_state.npcMemories.';
comment on column public.game_saves.campaign_premise is
  'Guide Book rails / campaign premise injected every turn.';
