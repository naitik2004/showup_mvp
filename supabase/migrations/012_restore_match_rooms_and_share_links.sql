-- Restore persisted match rooms, member chat, and secure share links.
-- Apply this migration in the Supabase project before using /groups routes.
BEGIN;
SET LOCAL search_path = public, extensions, pg_temp;

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.game_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  location_name TEXT NOT NULL DEFAULT '',
  max_players INTEGER NOT NULL DEFAULT 10 CHECK (max_players BETWEEN 2 AND 22),
  skill_level TEXT NOT NULL DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'pro')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS game_groups_status_scheduled_idx ON public.game_groups(status, scheduled_at);
CREATE INDEX IF NOT EXISTS group_members_group_status_idx ON public.group_members(group_id, status);
CREATE INDEX IF NOT EXISTS messages_group_created_idx ON public.messages(group_id, created_at);

CREATE TABLE IF NOT EXISTS public.game_share_links (
  game_id UUID PRIMARY KEY REFERENCES public.game_groups(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.add_match_host_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.group_members(group_id, user_id, status)
  VALUES (NEW.id, NEW.host_id, 'accepted')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS add_match_host_as_member ON public.game_groups;
CREATE TRIGGER add_match_host_as_member
  AFTER INSERT ON public.game_groups
  FOR EACH ROW EXECUTE FUNCTION public.add_match_host_as_member();
INSERT INTO public.group_members(group_id, user_id, status)
SELECT id, host_id, 'accepted' FROM public.game_groups
ON CONFLICT (group_id, user_id) DO NOTHING;

ALTER TABLE public.game_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_share_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.game_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
REVOKE DELETE ON public.game_groups FROM authenticated;
REVOKE UPDATE ON public.group_members FROM authenticated;
REVOKE ALL ON public.game_share_links FROM anon, authenticated;

DROP POLICY IF EXISTS "Anyone authenticated can view open groups" ON public.game_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.game_groups;
DROP POLICY IF EXISTS "Hosts can update their own groups" ON public.game_groups;
DROP POLICY IF EXISTS "Hosts can delete their own groups" ON public.game_groups;
CREATE POLICY "Signed-in users can read match rooms" ON public.game_groups
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can host their own match rooms" ON public.game_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their own match rooms" ON public.game_groups
  FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Authenticated users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Signed-in users can read match members" ON public.group_members
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Hosts can add themselves as a member" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.game_groups g WHERE g.id = group_id AND g.host_id = auth.uid()
    )
  );
CREATE POLICY "Players and hosts can remove match members" ON public.group_members
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.game_groups g WHERE g.id = group_id AND g.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
CREATE POLICY "Match members can read chat" ON public.messages
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
  ));
CREATE POLICY "Match members can send chat messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
    )
  );

CREATE OR REPLACE FUNCTION public.join_game(p_game_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_game public.game_groups%ROWTYPE;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to join this match.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_game FROM public.game_groups WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_game_id AND user_id = v_user AND status = 'accepted') THEN
    RETURN p_game_id;
  END IF;
  SELECT count(*) INTO v_count FROM public.group_members WHERE group_id = p_game_id AND status = 'accepted';
  IF v_game.status <> 'open' OR v_count >= v_game.max_players THEN
    IF v_game.status = 'open' AND v_count >= v_game.max_players THEN
      UPDATE public.game_groups SET status = 'full' WHERE id = p_game_id;
    END IF;
    RAISE EXCEPTION 'This match is full or no longer open.' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.group_members(group_id, user_id, status) VALUES (p_game_id, v_user, 'accepted')
    ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'accepted';
  SELECT count(*) INTO v_count FROM public.group_members WHERE group_id = p_game_id AND status = 'accepted';
  IF v_count >= v_game.max_players THEN UPDATE public.game_groups SET status = 'full' WHERE id = p_game_id; END IF;
  RETURN p_game_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_game_share_link(p_game_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_token UUID := gen_random_uuid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to create an invite link.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_game_id AND user_id = v_user AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Join this match before inviting friends.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.game_share_links(game_id, token, created_by, created_at, revoked_at)
  VALUES (p_game_id, v_token, v_user, NOW(), NULL)
  ON CONFLICT (game_id) DO UPDATE SET created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at, revoked_at = NULL;
  RETURN v_token::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_game_with_share_link(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_game public.game_groups%ROWTYPE;
  v_game_id UUID;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to join this match.' USING ERRCODE = '42501'; END IF;
  SELECT game_id INTO v_game_id FROM public.game_share_links
    WHERE token::TEXT = p_token AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'This invite link is invalid or revoked.' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_game FROM public.game_groups WHERE id = v_game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_game_id AND user_id = v_user AND status = 'accepted') THEN
    RETURN v_game_id;
  END IF;
  SELECT count(*) INTO v_count FROM public.group_members WHERE group_id = v_game_id AND status = 'accepted';
  IF v_game.status <> 'open' OR v_count >= v_game.max_players THEN
    IF v_game.status = 'open' AND v_count >= v_game.max_players THEN
      UPDATE public.game_groups SET status = 'full' WHERE id = v_game_id;
    END IF;
    RAISE EXCEPTION 'This match is full or no longer open.' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.group_members(group_id, user_id, status) VALUES (v_game_id, v_user, 'accepted')
    ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'accepted';
  SELECT count(*) INTO v_count FROM public.group_members WHERE group_id = v_game_id AND status = 'accepted';
  IF v_count >= v_game.max_players THEN UPDATE public.game_groups SET status = 'full' WHERE id = v_game_id; END IF;
  RETURN v_game_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_game(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_game_share_link(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_game_with_share_link(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_game_share_link(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_game_with_share_link(TEXT) TO authenticated;

COMMIT;
