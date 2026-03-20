-- --- CRICKET CORE 2026 DATABASE SCHEMA ---

-- 1. User Profiles (Auth & Identity)
-- NOTE: We use text for id to support the app's handle-based system
create table if not exists public.user_profiles (
  id text primary key, 
  name text,
  handle text unique,
  password text,
  email text,
  role text,
  avatar_url text,
  settings jsonb default '{}'::jsonb,
  following jsonb default '{"teams": [], "players": [], "orgs": []}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Organizations
create table if not exists public.organizations (
  id text primary key,
  name text,
  type text, -- 'GOVERNING_BODY', 'CLUB'
  country text,
  logo_url text,
  is_public boolean default true,
  details jsonb default '{}'::jsonb, -- description, address, groundLocation
  created_at timestamptz default now()
);

-- 3. Teams
create table if not exists public.teams (
  id text primary key,
  org_id text references public.organizations(id),
  name text,
  logo_url text,
  location text,
  created_at timestamptz default now()
);

-- 4. Roster Players (For Team Squads)
-- Note: These are distinct from user_profiles. They belong to a team.
create table if not exists public.roster_players (
  id text primary key,
  team_id text references public.teams(id),
  name text,
  role text,
  photo_url text,
  stats jsonb default '{}'::jsonb,
  details jsonb default '{}'::jsonb -- battingStyle, bowlingStyle, etc.
);

-- 5. Tournaments
create table if not exists public.tournaments (
  id text primary key,
  org_id text references public.organizations(id),
  name text,
  format text,
  status text, -- 'Upcoming', 'Ongoing', 'Completed'
  config jsonb default '{}'::jsonb -- pointsConfig, overs
);

-- 6. Match Fixtures
create table if not exists public.fixtures (
  id text primary key,
  tournament_id text references public.tournaments(id),
  team_a_id text references public.teams(id),
  team_b_id text references public.teams(id),
  date timestamptz,
  venue text,
  status text, -- 'Scheduled', 'Live', 'Completed'
  result text,
  winner_id text,
  scores jsonb default '{}'::jsonb, -- teamAScore, teamBScore, inningsScores
  saved_state jsonb, -- The full MatchState object for the engine
  details jsonb default '{}'::jsonb -- umpires, toss, etc.
);

-- 7. Media Posts
create table if not exists public.media_posts (
  id text primary key,
  type text,
  title text,
  caption text,
  author_name text,
  content_url text,
  likes int default 0,
  timestamp timestamptz default now()
);

-- 8. Legacy App State (Fallback)
create table if not exists public.app_state (
  id text primary key,
  payload jsonb,
  updated_at timestamptz default now()
);

-- --- ROW LEVEL SECURITY (RLS) ---

-- Enable RLS on all tables
alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.roster_players enable row level security;
alter table public.tournaments enable row level security;
alter table public.fixtures enable row level security;
alter table public.media_posts enable row level security;
alter table public.app_state enable row level security;
-- alter table storage.objects enable row level security;


-- POLICIES (Simplified for Development: Public Read, Global Write)

-- User Profiles
drop policy if exists "Read Profiles" on public.user_profiles;
create policy "Read Profiles" on public.user_profiles for select using (true);
drop policy if exists "Upsert Profiles" on public.user_profiles;
create policy "Upsert Profiles" on public.user_profiles for all using (true);

-- Organizations
drop policy if exists "Read Orgs" on public.organizations;
create policy "Read Orgs" on public.organizations for select using (true);
drop policy if exists "Upsert Orgs" on public.organizations;
create policy "Upsert Orgs" on public.organizations for all using (true);

-- Teams
drop policy if exists "Read Teams" on public.teams;
create policy "Read Teams" on public.teams for select using (true);
drop policy if exists "Upsert Teams" on public.teams;
create policy "Upsert Teams" on public.teams for all using (true);

-- Players
drop policy if exists "Read Players" on public.roster_players;
create policy "Read Players" on public.roster_players for select using (true);
drop policy if exists "Upsert Players" on public.roster_players;
create policy "Upsert Players" on public.roster_players for all using (true);

-- Tournaments
drop policy if exists "Read Tournaments" on public.tournaments;
create policy "Read Tournaments" on public.tournaments for select using (true);
drop policy if exists "Upsert Tournaments" on public.tournaments;
create policy "Upsert Tournaments" on public.tournaments for all using (true);

-- Fixtures
drop policy if exists "Read Fixtures" on public.fixtures;
create policy "Read Fixtures" on public.fixtures for select using (true);
drop policy if exists "Upsert Fixtures" on public.fixtures;
create policy "Upsert Fixtures" on public.fixtures for all using (true);

-- Media
drop policy if exists "Read Media" on public.media_posts;
create policy "Read Media" on public.media_posts for select using (true);
drop policy if exists "Upsert Media" on public.media_posts;
create policy "Upsert Media" on public.media_posts for all using (true);

-- App State (Legacy)
drop policy if exists "Read App State" on public.app_state;
create policy "Read App State" on public.app_state for select using (true);
drop policy if exists "Upsert App State" on public.app_state;
create policy "Upsert App State" on public.app_state for all using (true);

-- Storage
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists "Read Avatars" on storage.objects;
create policy "Read Avatars" on storage.objects for select using ( bucket_id = 'avatars' );
drop policy if exists "Upload Avatars" on storage.objects;
create policy "Upload Avatars" on storage.objects for insert with check ( bucket_id = 'avatars' );
