-- Sport Ratings table
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

-- Enable RLS
ALTER TABLE public.sport_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view ratings" ON public.sport_ratings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can rate others" ON public.sport_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id
    AND auth.uid() != ratee_id
  );
