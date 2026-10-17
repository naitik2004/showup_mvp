-- ========================================================
-- SHOWUP COMPLETE DATABASE SCHEMA FOR SUPABASE
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hmeomzpdwowwagaadkjw/sql/new
-- ========================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Delhi NCR',
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  location_visible BOOLEAN DEFAULT false,
  preferred_sports TEXT[] DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Game Groups Table
CREATE TABLE IF NOT EXISTS public.game_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  location_name TEXT NOT NULL DEFAULT '',
  max_players INTEGER NOT NULL DEFAULT 10,
  skill_level TEXT NOT NULL DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'pro')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_groups_location ON public.game_groups USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_game_groups_status_scheduled ON public.game_groups (status, scheduled_at);

ALTER TABLE public.game_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open groups" ON public.game_groups;
CREATE POLICY "Anyone can view open groups" ON public.game_groups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.game_groups;
CREATE POLICY "Authenticated users can create groups" ON public.game_groups
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their own groups" ON public.game_groups;
CREATE POLICY "Hosts can update their own groups" ON public.game_groups
  FOR UPDATE USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their own groups" ON public.game_groups;
CREATE POLICY "Hosts can delete their own groups" ON public.game_groups
  FOR DELETE USING (auth.uid() = host_id);

-- 4. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view group members" ON public.group_members;
CREATE POLICY "Anyone can view group members" ON public.group_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own membership" ON public.group_members;
CREATE POLICY "Users can update their own membership" ON public.group_members
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages (group_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can view messages" ON public.messages;
CREATE POLICY "Group members can view messages" ON public.messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
CREATE POLICY "Group members can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 6. Sport Ratings Table
CREATE TABLE IF NOT EXISTS public.sport_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ratee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  skill_score INTEGER NOT NULL CHECK (skill_score >= 1 AND skill_score <= 5),
  sportsmanship_score INTEGER NOT NULL CHECK (sportsmanship_score >= 1 AND sportsmanship_score <= 5),
  reliability_score INTEGER NOT NULL CHECK (reliability_score >= 1 AND reliability_score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rater_id, ratee_id, game_id)
);

ALTER TABLE public.sport_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.sport_ratings;
CREATE POLICY "Anyone can view ratings" ON public.sport_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can rate others" ON public.sport_ratings;
CREATE POLICY "Users can rate others" ON public.sport_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id AND auth.uid() != ratee_id);

-- 7. Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a != user_b)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_a);

DROP POLICY IF EXISTS "Users can update friendships they're part of" ON public.friendships;
CREATE POLICY "Users can update friendships they're part of" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Users can delete friendships they're part of" ON public.friendships;
CREATE POLICY "Users can delete friendships they're part of" ON public.friendships
  FOR DELETE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 8. Spatial Proximity Function find_groups_near
CREATE OR REPLACE FUNCTION find_groups_near(
  lat FLOAT,
  lng FLOAT,
  radius_meters FLOAT DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  host_id UUID,
  sport TEXT,
  location GEOGRAPHY,
  location_name TEXT,
  max_players INTEGER,
  skill_level TEXT,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN,
  status TEXT,
  created_at TIMESTAMPTZ,
  host_name TEXT,
  member_count BIGINT,
  distance FLOAT,
  lat_out FLOAT,
  lng_out FLOAT
) AS $$
  SELECT
    g.id,
    g.host_id,
    g.sport,
    g.location,
    g.location_name,
    g.max_players,
    g.skill_level,
    g.scheduled_at,
    g.expires_at,
    g.is_permanent,
    g.status,
    g.created_at,
    u.name AS host_name,
    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.group_id = g.id AND gm.status = 'accepted') AS member_count,
    ST_Distance(
      g.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance,
    ST_Y(g.location::geometry) AS lat_out,
    ST_X(g.location::geometry) AS lng_out
  FROM public.game_groups g
  LEFT JOIN public.users u ON g.host_id = u.id
  WHERE g.status IN ('open', 'in_progress')
    AND ST_DWithin(
      g.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 9. Enable Realtime Publications (idempotent - safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='game_groups') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_groups;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='group_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 10. Automatically Create User Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, city, avatar_url, preferred_sports)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Player'),
    'Delhi NCR',
    new.raw_user_meta_data->>'avatar_url',
    '{}'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
