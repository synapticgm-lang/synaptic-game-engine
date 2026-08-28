-- GM Response Feedback: tester thumbs up/down with optional comments
-- Players can rate each GM turn; admin/staff can review all feedback.

create table public.gm_response_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  save_id text not null,
  turn_number integer not null,
  feedback_type text not null check (feedback_type in ('positive', 'negative')),
  comment text, -- optional, max 500 chars validated client-side
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Context for admin review
  gm_story text,
  player_action text,
  game_mode text,
  bible_id text,
  
  unique(user_id, save_id, turn_number)
);

create index idx_gm_feedback_user on public.gm_response_feedback(user_id);
create index idx_gm_feedback_save on public.gm_response_feedback(save_id);
create index idx_gm_feedback_created on public.gm_response_feedback(created_at desc);
create index idx_gm_feedback_type on public.gm_response_feedback(feedback_type);

-- RLS policies
alter table public.gm_response_feedback enable row level security;

-- Players can insert their own feedback
create policy "Users can insert their own feedback"
  on public.gm_response_feedback for insert
  with check (auth.uid() = user_id);

-- Players can update their own feedback (toggle vote, edit comment)
create policy "Users can update their own feedback"
  on public.gm_response_feedback for update
  using (auth.uid() = user_id);

-- Players can view their own feedback
create policy "Users can view their own feedback"
  on public.gm_response_feedback for select
  using (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on public.gm_response_feedback for select
  using (public.is_staff_email());

-- Update timestamp trigger
create or replace function public.update_gm_feedback_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_gm_feedback_updated_at
  before update on public.gm_response_feedback
  for each row
  execute function public.update_gm_feedback_timestamp();
