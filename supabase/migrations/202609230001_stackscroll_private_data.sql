begin;

create or replace function public.stackscroll_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif((select auth.jwt() ->> 'stackscroll_user_id'), '');
$$;

revoke all on function public.stackscroll_user_id() from public;
grant execute on function public.stackscroll_user_id() to authenticated;

create table if not exists public.profiles (
  user_id text primary key,
  display_name text not null default '' check (char_length(display_name) <= 80),
  headline text not null default '' check (char_length(headline) <= 120),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_state (
  user_id text primary key,
  learning_state jsonb not null default '{}'::jsonb,
  feed_memory jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  video_playlist jsonb not null default '{"name":"My tech playlist","ids":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_stacks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  payload jsonb not null default '{}'::jsonb,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create index if not exists personal_stacks_user_updated_idx
  on public.personal_stacks (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.personal_stacks enable row level security;

revoke all on public.profiles, public.user_state, public.personal_stacks from anon;
grant select, insert, update, delete on public.profiles, public.user_state, public.personal_stacks to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select public.stackscroll_user_id()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check ((select public.stackscroll_user_id()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select public.stackscroll_user_id()) = user_id)
  with check ((select public.stackscroll_user_id()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated
  using ((select public.stackscroll_user_id()) = user_id);

create policy "user_state_select_own" on public.user_state for select to authenticated
  using ((select public.stackscroll_user_id()) = user_id);
create policy "user_state_insert_own" on public.user_state for insert to authenticated
  with check ((select public.stackscroll_user_id()) = user_id);
create policy "user_state_update_own" on public.user_state for update to authenticated
  using ((select public.stackscroll_user_id()) = user_id)
  with check ((select public.stackscroll_user_id()) = user_id);
create policy "user_state_delete_own" on public.user_state for delete to authenticated
  using ((select public.stackscroll_user_id()) = user_id);

create policy "personal_stacks_select_own" on public.personal_stacks for select to authenticated
  using ((select public.stackscroll_user_id()) = user_id);
create policy "personal_stacks_insert_own" on public.personal_stacks for insert to authenticated
  with check ((select public.stackscroll_user_id()) = user_id);
create policy "personal_stacks_update_own" on public.personal_stacks for update to authenticated
  using ((select public.stackscroll_user_id()) = user_id)
  with check ((select public.stackscroll_user_id()) = user_id);
create policy "personal_stacks_delete_own" on public.personal_stacks for delete to authenticated
  using ((select public.stackscroll_user_id()) = user_id);

commit;
