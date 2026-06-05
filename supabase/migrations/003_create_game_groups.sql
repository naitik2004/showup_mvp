-- Game Groups table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX idx_game_groups_location ON public.game_groups USING GIST (location);

-- Index for filtering active groups
CREATE INDEX idx_game_groups_status_scheduled ON public.game_groups (status, scheduled_at);

-- Enable RLS
ALTER TABLE public.game_groups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view open groups" ON public.game_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create groups" ON public.game_groups
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own groups" ON public.game_groups
  FOR UPDATE USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own groups" ON public.game_groups
  FOR DELETE USING (auth.uid() = host_id);
