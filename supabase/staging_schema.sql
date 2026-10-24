-- Staging-only schema for independent FantasyEAi backend.
-- DO NOT run on an unrelated Supabase project or on production.
-- Authentication IDs must be Supabase Auth UUIDs, not Base44 string IDs.
begin;
create schema if not exists fantasy_private;
revoke all on schema fantasy_private from public, anon, authenticated;

create table if not exists fantasy_private.identity_mapping (
  base44_user_id text primary key,
  supabase_user_id uuid not null unique references auth.users(id) on delete cascade,
  identity_verified_at timestamptz not null
);
alter table fantasy_private.identity_mapping enable row level security;
revoke all on fantasy_private.identity_mapping from public, anon, authenticated;

create table if not exists public.fantasy_team_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id text not null check (league_id ~ '^[0-9]{1,15}$'),
  team_id text not null check (team_id ~ '^[0-9]{1,15}$'),
  team_name text not null check (char_length(team_name) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, league_id)
);
-- ESPN email and date of birth are intentionally NOT imported or stored.
create table if not exists public.fantasy_espn_leagues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id text not null check (league_id ~ '^[0-9]{1,15}$'),
  league_name text not null,
  season integer not null check (season between 2000 and 2100),
  created_at timestamptz not null default now(),
  unique (user_id, league_id, season)
);
create table if not exists public.fantasy_player_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null check (char_length(player_id) between 1 and 128),
  player_name text not null,
  verdict text check (verdict in ('Start', 'Sit', 'Trade', 'Hold')),
  confidence text check (confidence in ('high', 'medium', 'low')),
  weighted_edge double precision,
  news_headline text,
  analysis text,
  factors jsonb not null default '[]'::jsonb check (jsonb_typeof(factors) = 'array'),
  analyzed_at timestamptz,
  input_signature text,
  created_at timestamptz not null default now(),
  unique (user_id, player_id)
);
create table if not exists public.fantasy_refresh_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id text not null check (league_id ~ '^[0-9]{1,15}$'),
  last_refresh timestamptz,
  signatures jsonb not null default '{}'::jsonb check (jsonb_typeof(signatures) = 'object'),
  pending jsonb not null default '[]'::jsonb check (jsonb_typeof(pending) = 'array'),
  waiver_cache jsonb not null default '{}'::jsonb,
  playoff_cache jsonb not null default '{}'::jsonb,
  unique (user_id, league_id)
);
create index if not exists fantasy_player_analyses_user_idx on public.fantasy_player_analyses (user_id);
create index if not exists fantasy_refresh_states_user_idx on public.fantasy_refresh_states (user_id);

alter table public.fantasy_team_locks enable row level security;
alter table public.fantasy_espn_leagues enable row level security;
alter table public.fantasy_player_analyses enable row level security;
alter table public.fantasy_refresh_states enable row level security;
-- No client-side writes. Only backend operations subject to explicit authorization.
revoke all on public.fantasy_team_locks, public.fantasy_espn_leagues,
  public.fantasy_player_analyses, public.fantasy_refresh_states from anon, authenticated;
grant select on public.fantasy_team_locks, public.fantasy_espn_leagues,
  public.fantasy_player_analyses, public.fantasy_refresh_states to authenticated;

drop policy if exists "read own team locks" on public.fantasy_team_locks;
create policy "read own team locks" on public.fantasy_team_locks
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "read own leagues" on public.fantasy_espn_leagues;
create policy "read own leagues" on public.fantasy_espn_leagues
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "read own analyses" on public.fantasy_player_analyses;
create policy "read own analyses" on public.fantasy_player_analyses
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "read own refresh state" on public.fantasy_refresh_states;
create policy "read own refresh state" on public.fantasy_refresh_states
  for select to authenticated using ((select auth.uid()) = user_id);
commit;
