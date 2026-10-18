-- Let any accepted match member invite a friend from the Invite Friends dialog.
-- Reuse the active room link so links already shared with other friends remain valid.
BEGIN;
SET LOCAL search_path = public, extensions, pg_temp;

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
    SELECT 1 FROM public.group_members
    WHERE group_id = p_game_id AND user_id = v_user AND status = 'accepted'
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

COMMIT;
