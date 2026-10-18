BEGIN;
DO $$ DECLARE c record; t text; BEGIN
 FOREACH t IN ARRAY ARRAY['game_invites','game_share_links'] LOOP
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid=('public.'||t)::regclass AND confrelid='public.game_groups'::regclass LOOP
 EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I',t,c.conname); END LOOP;
 EXECUTE format('ALTER TABLE public.%I ADD FOREIGN KEY(game_id) REFERENCES public.games(id) ON DELETE CASCADE',t);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.send_game_invite(p_game_id UUID, p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sender UUID := auth.uid();
  v_game public.games%ROWTYPE;
  v_member_count INTEGER;
  v_invite_id UUID;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Sign in to invite a player.' USING ERRCODE = '42501';
  END IF;
  IF p_recipient_id = v_sender THEN
    RAISE EXCEPTION 'You cannot invite yourself.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.game_members
    WHERE game_id = p_game_id AND user_id = v_sender
  ) THEN
    RAISE EXCEPTION 'Join this match before inviting players.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id) THEN
    RAISE EXCEPTION 'Player not found.' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.game_members
    WHERE game_id = p_game_id AND user_id = p_recipient_id
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

  SELECT count(*) INTO v_member_count FROM public.game_members
  WHERE game_id = p_game_id;
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
  v_game public.games%ROWTYPE;
  v_member_count INTEGER;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Sign in to respond.' USING ERRCODE = '42501'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('accept', 'decline') THEN
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

  SELECT * INTO v_game FROM public.games WHERE id = v_invite.game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.game_members
    WHERE game_id = v_game.id AND user_id = v_actor
  ) THEN
    UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('game_id', v_game.id, 'accepted', true, 'already_member', true);
  END IF;

  SELECT count(*) INTO v_member_count FROM public.game_members
  WHERE game_id = v_game.id;
  IF v_game.status <> 'open' OR v_member_count >= v_game.max_players THEN
    RAISE EXCEPTION 'This match is full or no longer open.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM public.join_game(v_game.id);
  UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
  SELECT count(*) INTO v_member_count FROM public.game_members
  WHERE game_id = v_game.id;
  IF v_member_count >= v_game.max_players THEN
    UPDATE public.games SET status = 'full' WHERE id = v_game.id;
  END IF;
  RETURN jsonb_build_object('game_id', v_game.id, 'accepted', true, 'already_member', false);
END;
$$;

REVOKE ALL ON FUNCTION public.send_game_invite(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.respond_to_game_invite(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_game_invite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_game_invite(UUID, TEXT) TO authenticated;
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
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sign in to create an invite link.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.game_members
    WHERE game_id = p_game_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'Join this match before inviting friends.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.game_share_links(game_id, token, created_by, created_at, revoked_at)
  VALUES (p_game_id, v_token, v_user, NOW(), NULL)
  ON CONFLICT (game_id) DO UPDATE SET
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at,
    revoked_at = NULL
  RETURNING token INTO v_token;

  RETURN v_token::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_game_share_link(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_game_share_link(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_game_with_share_link(p_token text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE gid uuid; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 SELECT game_id INTO gid FROM public.game_share_links WHERE token::text=p_token AND revoked_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or revoked invite.'; END IF;
 RETURN public.join_game(gid); END $$;
-- Retain legacy data for rollback, but freeze the old write surface.
REVOKE INSERT,UPDATE,DELETE ON public.game_groups,public.group_members FROM anon,authenticated;
COMMIT;
