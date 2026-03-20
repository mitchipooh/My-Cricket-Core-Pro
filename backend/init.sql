-- --- CRICKET CORE 2026 POSTGRESQL SCHEMA ---

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY, 
  name TEXT,
  handle TEXT UNIQUE,
  password TEXT,
  email TEXT,
  role TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonB,
  following JSONB DEFAULT '{"teams": [], "players": [], "orgs": []}'::jsonB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  country TEXT,
  logo_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES public.user_profiles(id),
  details JSONB DEFAULT '{}'::jsonB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT,
  logo_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Junction: Organization <-> Teams
CREATE TABLE IF NOT EXISTS public.organization_teams (
  organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, team_id)
);

-- 5. Roster Players
CREATE TABLE IF NOT EXISTS public.roster_players (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.user_profiles(id), -- For linked profiles
  name TEXT,
  role TEXT,
  photo_url TEXT,
  stats JSONB DEFAULT '{}'::jsonB,
  details JSONB DEFAULT '{}'::jsonB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT,
  format TEXT,
  status TEXT,
  config JSONB DEFAULT '{}'::jsonB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Junction: Tournament <-> Teams
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, team_id)
);

-- 8. Match Fixtures
CREATE TABLE IF NOT EXISTS public.fixtures (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE SET NULL,
  team_a_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  team_b_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  date TIMESTAMPTZ,
  venue TEXT,
  status TEXT,
  result TEXT,
  winner_id TEXT,
  scores JSONB DEFAULT '{}'::jsonB,
  saved_state JSONB,
  details JSONB DEFAULT '{}'::jsonB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Media Posts
CREATE TABLE IF NOT EXISTS public.media_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.user_profiles(id),
  type TEXT,
  title TEXT,
  caption TEXT,
  author_name TEXT,
  content_url TEXT,
  likes JSONB DEFAULT '[]'::jsonB,
  reactions JSONB DEFAULT '{}'::jsonB,
  comments JSONB DEFAULT '[]'::jsonB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Game Data (Issues, Reports)
CREATE TABLE IF NOT EXISTS public.game_issues (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES public.fixtures(id) ON DELETE CASCADE,
  lodged_by TEXT REFERENCES public.user_profiles(id),
  team_id TEXT REFERENCES public.teams(id),
  type TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  evidence_urls JSONB DEFAULT '[]'::jsonB,
  admin_comments JSONB DEFAULT '[]'::jsonB,
  resolution TEXT,
  admin_response TEXT,
  resolved_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.match_reports (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES public.fixtures(id) ON DELETE CASCADE,
  submitted_by TEXT REFERENCES public.user_profiles(id),
  status TEXT,
  scorecard_photo_url TEXT,
  admin_feedback TEXT,
  player_performances JSONB DEFAULT '[]'::jsonB,
  umpires JSONB DEFAULT '[]'::jsonB,
  umpire_ratings JSONB DEFAULT '{}'::jsonB,
  facility_rating JSONB DEFAULT '{}'::jsonB,
  spirit_rating JSONB DEFAULT '{}'::jsonB,
  team_a_performance JSONB DEFAULT '{}'::jsonB,
  team_b_performance JSONB DEFAULT '{}'::jsonB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umpire_reports (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES public.fixtures(id) ON DELETE CASCADE,
  fixture_id TEXT REFERENCES public.fixtures(id),
  submitted_by TEXT REFERENCES public.user_profiles(id),
  umpire_name TEXT,
  status TEXT,
  match_outcome JSONB DEFAULT '{}'::jsonB,
  conduct_notes TEXT,
  rule_violations JSONB DEFAULT '[]'::jsonB,
  player_behavior_ratings JSONB DEFAULT '{}'::jsonB,
  facility_report JSONB DEFAULT '{}'::jsonB,
  incident_reports JSONB DEFAULT '[]'::jsonB,
  supporting_documents JSONB DEFAULT '[]'::jsonB,
  organization_id TEXT REFERENCES public.organizations(id),
  reviewed_by TEXT REFERENCES public.user_profiles(id),
  review_notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Affiliations
CREATE TABLE IF NOT EXISTS public.organization_affiliations (
  parent_org_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
  child_org_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parent_org_id, child_org_id)
);
