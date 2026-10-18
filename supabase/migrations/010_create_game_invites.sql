-- Firebase identity links let server routes resolve Firebase Admin verified
-- users to the existing UUID based public.users rows without exposing the
-- Firebase UID through the public profile table.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.firebase_user_links (
  firebase_uid TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.firebase_user_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.firebase_user_links FROM anon, authenticated;
GRANT ALL ON TABLE public.firebase_user_links TO service_role;

-- The current schema has no block table. Keep a minimal block relationship so
-- invite creation can reject either direction consistently.
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view blocks involving themselves" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "Users can block other players" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock players they blocked" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.game_groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (from_user <> to_user)
);

CREATE OR REPLACE FUNCTION public.guard_game_invite_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.game_id <> OLD.game_id OR NEW.from_user <> OLD.from_user OR NEW.to_user <> OLD.to_user
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Invite details cannot be changed.' USING ERRCODE = '42501';
  END IF;
  IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'declined') OR NEW.responded_at IS NULL THEN
    RAISE EXCEPTION 'Only a pending invite can be answered.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER game_invites_response_guard
  BEFORE UPDATE ON public.game_invites
  FOR EACH ROW EXECUTE FUNCTION public.guard_game_invite_response();

CREATE UNIQUE INDEX IF NOT EXISTS game_invites_pending_game_recipient_uidx
  ON public.game_invites (game_id, to_user) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS game_invites_recipient_pending_idx
  ON public.game_invites (to_user, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS game_invites_sender_idx
  ON public.game_invites (from_user, created_at DESC);

ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients and senders can read game invites" ON public.game_invites
  FOR SELECT USING (auth.uid() = to_user OR auth.uid() = from_user);
CREATE POLICY "Friends in a game can invite unblocked players" ON public.game_invites
  FOR INSERT WITH CHECK (
    auth.uid() = from_user
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = game_id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
    )
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.user_a = from_user AND f.user_b = to_user) OR (f.user_b = from_user AND f.user_a = to_user))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = from_user AND b.blocked_id = to_user)
         OR (b.blocker_id = to_user AND b.blocked_id = from_user)
    )
  );
CREATE POLICY "Recipients can respond to game invites" ON public.game_invites
  FOR UPDATE USING (auth.uid() = to_user AND status = 'pending')
  WITH CHECK (auth.uid() = to_user AND status IN ('accepted', 'declined') AND responded_at IS NOT NULL);

-- Accepting an invite locks the game row while checking capacity and inserting
-- the membership, so two recipients cannot take the last place concurrently.
CREATE OR REPLACE FUNCTION public.accept_game_invite(p_invite_id UUID, p_actor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite public.game_invites%ROWTYPE;
  v_game public.game_groups%ROWTYPE;
  v_member_count INTEGER;
  v_status TEXT;
BEGIN
  SELECT * INTO v_invite
  FROM public.game_invites
  WHERE id = p_invite_id AND to_user = p_actor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invite has already been answered.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_game FROM public.game_groups WHERE id = v_invite.game_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = v_game.id AND gm.user_id = p_actor_id AND gm.status = 'accepted'
  ) THEN
    UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('game_id', v_game.id, 'already_member', true);
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM public.group_members gm
  WHERE gm.group_id = v_game.id AND gm.status = 'accepted';

  v_status := CASE v_game.status
    WHEN 'in_progress' THEN 'live'
    WHEN 'expired' THEN 'done'
    ELSE v_game.status
  END;

  IF v_game.status <> 'open' OR v_member_count >= v_game.max_players THEN
    IF v_game.status = 'open' AND v_member_count >= v_game.max_players THEN
      UPDATE public.game_groups SET status = 'full' WHERE id = v_game.id;
      v_status := 'full';
    END IF;
    RAISE EXCEPTION 'Too late. That match is %.', v_status USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, status)
  VALUES (v_game.id, p_actor_id, 'accepted')
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'accepted';

  UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
  SELECT COUNT(*) INTO v_member_count
  FROM public.group_members gm
  WHERE gm.group_id = v_game.id AND gm.status = 'accepted';
  IF v_member_count >= v_game.max_players THEN
    UPDATE public.game_groups SET status = 'full' WHERE id = v_game.id;
  END IF;

  RETURN jsonb_build_object('game_id', v_game.id, 'already_member', false);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_game_invite(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_game_invite(UUID, UUID) TO service_role;
