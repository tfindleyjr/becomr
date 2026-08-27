-- BECOMR Phase 15 starter schema
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "Users can read own BECOMR state"
on public.user_state for select
using (auth.uid() = user_id);

create policy "Users can insert own BECOMR state"
on public.user_state for insert
with check (auth.uid() = user_id);

create policy "Users can update own BECOMR state"
on public.user_state for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- v0.5 deliberately stores the complete AppState as JSONB so the UI can move quickly.
-- A later normalized schema can split paths, nodes, quests, proofs, marks, and archive entries
-- once the product model stabilizes.
