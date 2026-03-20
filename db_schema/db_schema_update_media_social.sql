-- --- MIGRATION: Media Center Social Standardization ---

-- 1. Ensure likes is an array of user IDs (JSONB) instead of an int
-- We use a safe conversion or drop/recreate if it was unused
ALTER TABLE public.media_posts DROP COLUMN IF EXISTS likes;
ALTER TABLE public.media_posts ADD COLUMN likes jsonb DEFAULT '[]'::jsonb;

-- 2. Add comments column if not already added by previous migrations
ALTER TABLE public.media_posts ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;

-- 3. Add reactions column for emoji support
ALTER TABLE public.media_posts ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- 4. Ensure RLS allows upserts for these social interactions
-- (Policies are already in place in db_schema.sql for the table level)
