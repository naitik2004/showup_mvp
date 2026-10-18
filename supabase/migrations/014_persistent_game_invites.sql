-- Persist in-app match invitations and let recipients accept or decline them.
-- No email/SMS provider is used; invitees see invitations in the app.
BEGIN;
SET LOCAL search_path = public, extensions, pg_temp;

CREATE TABLE IF NOT EXISTS public.game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (from_user <> to_user)
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS game_invites_pending_game_recipient_uidx
  ON public.game_invites (game_id, to_user) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS game_invites_recipient_pending_idx
  ON public.game_invites (to_user, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS game_invites_sender_idx
  ON public.game_invites (from_user, created_at DESC);

ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recipients and senders can read game invites" ON public.game_invites;
DROP POLICY IF EXISTS "Friends in a game can invite unblocked players" ON public.game_invites;
DROP POLICY IF EXISTS "Recipients can respond to game invites" ON public.game_invites;
CREATE POLICY "Users can read their own game invites" ON public.game_invites
  FOR SELECT TO authenticated USING (auth.uid() = from_user OR auth.uid() = to_user);

REVOKE ALL ON public.game_invites FROM anon, authenticated;
GRANT SELECT ON public.game_invites TO authenticated;

DROP POLICY IF EXISTS "Users can view blocks involving themselves" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can block other players" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can unblock players they blocked" ON public.user_blocks;
CREATE POLICY "Users can view blocks involving themselves" ON public.user_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "Users can block other players" ON public.user_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock players they blocked" ON public.user_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
REVOKE ALL ON public.user_blocks FROM anon;

CREATE OR REPLACE FUNCTION public.send_game_invite(p_game_id UUID, p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sender UUID := auth.uid();
  v_game public.game_groups%ROWTYPE;
  v_member_count INTEGER;
  v_invite_id UUID;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Sign in to invite a player.' USING ERRCODE = '42501';
  END IF;
  IF p_recipient_id = v_sender THEN
    RAISE EXCEPTION 'You cannot invite yourself.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_game FROM public.game_groups WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_game_id AND user_id = v_sender AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Join this match before inviting players.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id) THEN
    RAISE EXCEPTION 'Player not found.' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_game_id AND user_id = p_recipient_id AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'This player is already in the match.' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_sender AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = v_sender)
  ) THEN
    RAISE EXCEPTION 'This player cannot be invited.' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_member_count FROM public.group_members
  WHERE group_id = p_game_id AND status = 'accepted';
  IF v_game.status <> 'open' OR v_member_count >= v_game.max_players THEN
    RAISE EXCEPTION 'This match is full or no longer open.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.game_invites(game_id, from_user, to_user, status, created_at, responded_at)
  VALUES (p_game_id, v_sender, p_recipient_id, 'pending', NOW(), NULL)
  ON CONFLICT (game_id, to_user) WHERE status = 'pending'
  DO UPDATE SET from_user = EXCLUDED.from_user, created_at = EXCLUDED.created_at
  RETURNING id INTO v_invite_id;
  RETURN v_invite_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_game_invite(p_invite_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_invite public.game_invites%ROWTYPE;
  v_game public.game_groups%ROWTYPE;
  v_member_count INTEGER;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Sign in to respond.' USING ERRCODE = '42501'; END IF;
  IF p_action NOT IN ('accept', 'decline') THEN
    RAISE EXCEPTION 'Choose accept or decline.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_invite FROM public.game_invites
  WHERE id = p_invite_id AND to_user = v_actor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invite has already been answered.' USING ERRCODE = 'P0001';
  END IF;

  IF p_action = 'decline' THEN
    UPDATE public.game_invites SET status = 'declined', responded_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('game_id', v_invite.game_id, 'accepted', false);
  END IF;

  SELECT * INTO v_game FROM public.game_groups WHERE id = v_invite.game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_game.id AND user_id = v_actor AND status = 'accepted'
  ) THEN
    UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('game_id', v_game.id, 'accepted', true, 'already_member', true);
  END IF;

  SELECT count(*) INTO v_member_count FROM public.group_members
  WHERE group_id = v_game.id AND status = 'accepted';
  IF v_game.status <> 'open' OR v_member_count >= v_game.max_players THEN
    RAISE EXCEPTION 'This match is full or no longer open.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.group_members(group_id, user_id, status)
  VALUES (v_game.id, v_actor, 'accepted')
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'accepted';
  UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
  SELECT count(*) INTO v_member_count FROM public.group_members
  WHERE group_id = v_game.id AND status = 'accepted';
  IF v_member_count >= v_game.max_players THEN
    UPDATE public.game_groups SET status = 'full' WHERE id = v_game.id;
  END IF;
  RETURN jsonb_build_object('game_id', v_game.id, 'accepted', true, 'already_member', false);
END;
$$;

REVOKE ALL ON FUNCTION public.send_game_invite(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.respond_to_game_invite(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_game_invite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_game_invite(UUID, TEXT) TO authenticated;

COMMIT;
