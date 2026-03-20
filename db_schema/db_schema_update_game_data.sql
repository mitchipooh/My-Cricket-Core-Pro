-- --- MIGRATION: Game Issues and Match Reports ---

-- 0. Update fixtures table for archival support
alter table public.fixtures add column if not exists is_archived boolean default false;

-- 1. Game Issues
create table if not exists public.game_issues (
  id text primary key,
  match_id text references public.fixtures(id),
  lodged_by text references public.user_profiles(id),
  team_id text references public.teams(id),
  type text, -- 'PROTEST', 'GAME_ISSUE', 'FEEDBACK'
  title text,
  description text,
  status text, -- 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
  evidence_urls jsonb default '[]'::jsonb,
  admin_comments jsonb default '[]'::jsonb,
  resolution text, -- 'UPHELD', 'DISMISSED', 'ACKNOWLEDGED'
  admin_response text,
  resolved_at timestamptz,
  timestamp timestamptz default now()
);

-- 2. Match Reports (Captain Submissions)
create table if not exists public.match_reports (
  id text primary key,
  match_id text references public.fixtures(id),
  submitted_by text references public.user_profiles(id),
  status text, -- 'PENDING', 'VERIFIED', 'REJECTED'
  scorecard_photo_url text,
  team_a_performance jsonb,
  team_b_performance jsonb,
  player_performances jsonb default '[]'::jsonb,
  admin_feedback text,
  umpires jsonb default '[]'::jsonb,
  umpire_ratings jsonb default '{}'::jsonb,
  facility_rating jsonb default '{}'::jsonb,
  spirit_rating jsonb default '{}'::jsonb,
  timestamp timestamptz default now()
);

-- 3. Umpire Reports
create table if not exists public.umpire_reports (
  id text primary key,
  match_id text references public.fixtures(id),
  fixture_id text references public.fixtures(id),
  submitted_by text references public.user_profiles(id),
  umpire_name text,
  status text, -- 'PENDING', 'REVIEWED', 'ARCHIVED'
  match_outcome jsonb,
  conduct_notes text,
  rule_violations jsonb default '[]'::jsonb,
  player_behavior_ratings jsonb default '{}'::jsonb,
  facility_report jsonb default '{}'::jsonb,
  incident_reports jsonb default '[]'::jsonb,
  supporting_documents jsonb default '[]'::jsonb,
  organization_id text references public.organizations(id),
  reviewed_by text references public.user_profiles(id),
  review_notes text,
  timestamp timestamptz default now()
);

-- --- RLS ---

alter table public.game_issues enable row level security;
alter table public.match_reports enable row level security;
alter table public.umpire_reports enable row level security;

-- Policies (Development)
-- Policies (Development)
DROP POLICY IF EXISTS "Read Game Issues" ON public.game_issues;
CREATE POLICY "Read Game Issues" ON public.game_issues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Upsert Game Issues" ON public.game_issues;
CREATE POLICY "Upsert Game Issues" ON public.game_issues FOR ALL USING (true);

DROP POLICY IF EXISTS "Read Match Reports" ON public.match_reports;
CREATE POLICY "Read Match Reports" ON public.match_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Upsert Match Reports" ON public.match_reports;
CREATE POLICY "Upsert Match Reports" ON public.match_reports FOR ALL USING (true);


DROP POLICY IF EXISTS "Read Umpire Reports" ON public.umpire_reports;
CREATE POLICY "Read Umpire Reports" ON public.umpire_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Upsert Umpire Reports" ON public.umpire_reports;
CREATE POLICY "Upsert Umpire Reports" ON public.umpire_reports FOR ALL USING (true);



-- 4. Media Center Enhancements
alter table public.media_posts add column if not exists comments jsonb default '[]'::jsonb;

