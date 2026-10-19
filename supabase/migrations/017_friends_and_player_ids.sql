BEGIN;

-- A public player code is separate from the internal authentication UUID.
ALTER TABLE public.profiles ADD COLUMN player_id text;
CREATE FUNCTION public.assign_player_id() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.player_id IS NOT NULL THEN
    IF NEW.player_id IS DISTINCT FROM OLD.player_id THEN
      RAISE EXCEPTION 'Your player ID cannot be changed.';
    END IF;
  ELSE
    NEW.player_id := 'SU-' || upper(replace(gen_random_uuid()::text, '-', ''));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assign_player_id BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_player_id();
UPDATE public.profiles SET player_id = NULL WHERE player_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN player_id SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_player_id_key UNIQUE(player_id);

-- Preserve existing relationships. Duplicate pairs require explicit review;
-- do not silently delete either player's existing data.
CREATE UNIQUE INDEX friendships_unordered_pair ON public.friendships
  (least(user_a, user_b), greatest(user_a, user_b));
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE policy record; BEGIN
  FOR policy IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friendships'
  LOOP EXECUTE format('DROP POLICY %I ON public.friendships', policy.policyname); END LOOP;
END $$;
CREATE POLICY friendship_participants_read ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() IN (user_a, user_b));
REVOKE ALL ON public.friendships FROM anon, authenticated;
GRANT SELECT ON public.friendships TO authenticated;

CREATE FUNCTION public.friends_players(p_mode text, p_query text DEFAULT '')
RETURNS TABLE(id uuid, name text, player_id text, relationship text, mutual_count bigint, shared_matches bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to find friends.'; END IF;
  IF p_mode NOT IN ('search', 'network', 'requests', 'suggestions') OR p_mode IS NULL THEN
    RAISE EXCEPTION 'Unknown friends section.';
  END IF;
  IF p_mode = 'search' AND length(trim(p_query)) NOT BETWEEN 2 AND 100 THEN RETURN; END IF;
  RETURN QUERY
  WITH my_friends AS (
    SELECT CASE WHEN f.user_a = auth.uid() THEN f.user_b ELSE f.user_a END AS peer
    FROM public.friendships f WHERE auth.uid() IN (f.user_a, f.user_b) AND f.status = 'accepted'
  ), visible_friends AS (
    SELECT peer FROM my_friends WHERE NOT EXISTS (
      SELECT 1 FROM public.user_blocks b WHERE
      (b.blocker_id = auth.uid() AND b.blocked_id = peer) OR
      (b.blocked_id = auth.uid() AND b.blocker_id = peer)
    )
  ), mutuals AS (
    SELECT CASE WHEN f.user_a = m.peer THEN f.user_b ELSE f.user_a END AS peer,
      count(DISTINCT m.peer) AS total
    FROM visible_friends m JOIN public.friendships f ON m.peer IN (f.user_a, f.user_b)
    WHERE f.status = 'accepted' GROUP BY 1
  ), played AS (
    SELECT other.user_id AS peer, count(DISTINCT g.id) AS total
    FROM public.game_members mine JOIN public.games g ON g.id = mine.game_id
      JOIN public.game_members other ON other.game_id = mine.game_id
    WHERE mine.user_id = auth.uid() AND g.status = 'done' AND g.starts_at <= now()
      AND other.user_id <> auth.uid() GROUP BY other.user_id
  ), players AS (
    SELECT p.id, p.name, p.player_id,
      CASE WHEN f.status = 'accepted' THEN 'friend'
        WHEN f.status = 'pending' AND f.user_b = auth.uid() THEN 'incoming'
        WHEN f.status = 'pending' THEN 'outgoing' ELSE 'none' END AS relation,
      coalesce(m.total, 0) AS mutual, coalesce(h.total, 0) AS matches
    FROM public.profiles p
    LEFT JOIN public.friendships f ON least(f.user_a, f.user_b) = least(p.id, auth.uid())
      AND greatest(f.user_a, f.user_b) = greatest(p.id, auth.uid())
    LEFT JOIN mutuals m ON m.peer = p.id LEFT JOIN played h ON h.peer = p.id
    WHERE p.id <> auth.uid() AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b WHERE
        (b.blocker_id = auth.uid() AND b.blocked_id = p.id) OR
        (b.blocked_id = auth.uid() AND b.blocker_id = p.id)
    )
  )
  SELECT x.id, x.name, x.player_id, x.relation, x.mutual, x.matches FROM players x WHERE
    (p_mode = 'network' AND x.relation = 'friend') OR
    (p_mode = 'requests' AND x.relation IN ('incoming', 'outgoing')) OR
    (p_mode = 'suggestions' AND x.relation = 'none' AND (x.mutual > 0 OR x.matches > 0)) OR
    (p_mode = 'search' AND (strpos(lower(x.name), lower(trim(p_query))) > 0
      OR upper(replace(trim(p_query), '-', '')) = replace(x.player_id, '-', '')))
  ORDER BY x.matches DESC, x.mutual DESC, lower(x.name), x.id
  LIMIT CASE WHEN p_mode IN ('network', 'requests') THEN NULL ELSE 30 END;
END $$;

CREATE FUNCTION public.friend_action(p_player_id uuid, p_action text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE friendship public.friendships; BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to manage friends.'; END IF;
  IF p_player_id IS NULL OR p_player_id = auth.uid() THEN RAISE EXCEPTION 'Choose another player.'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('request', 'accept', 'decline', 'cancel', 'remove') THEN
    RAISE EXCEPTION 'Unknown friend action.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(least(auth.uid(), p_player_id)::text || greatest(auth.uid(), p_player_id)::text, 0));
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_player_id) THEN RAISE EXCEPTION 'Player not found.'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_blocks WHERE
    (blocker_id = auth.uid() AND blocked_id = p_player_id) OR
    (blocked_id = auth.uid() AND blocker_id = p_player_id)) THEN
    RAISE EXCEPTION 'This player is unavailable.';
  END IF;
  SELECT * INTO friendship FROM public.friendships WHERE
    least(user_a, user_b) = least(auth.uid(), p_player_id) AND
    greatest(user_a, user_b) = greatest(auth.uid(), p_player_id) FOR UPDATE;
  IF p_action = 'request' THEN
    IF friendship.status IN ('pending', 'accepted') THEN RAISE EXCEPTION 'A friendship or request already exists. Refresh your list.'; END IF;
    IF friendship.id IS NOT NULL THEN DELETE FROM public.friendships WHERE id = friendship.id; END IF;
    INSERT INTO public.friendships(user_a, user_b, status) VALUES(auth.uid(), p_player_id, 'pending');
  ELSIF p_action IN ('accept', 'decline') THEN
    IF friendship.status IS DISTINCT FROM 'pending' OR friendship.user_b <> auth.uid() THEN RAISE EXCEPTION 'Only the recipient can respond to this request.'; END IF;
    UPDATE public.friendships SET status = CASE WHEN p_action = 'accept' THEN 'accepted' ELSE 'declined' END WHERE id = friendship.id;
  ELSIF p_action = 'cancel' THEN
    IF friendship.status IS DISTINCT FROM 'pending' OR friendship.user_a <> auth.uid() THEN RAISE EXCEPTION 'Only the sender can cancel this request.'; END IF;
    DELETE FROM public.friendships WHERE id = friendship.id;
  ELSE
    IF friendship.status IS DISTINCT FROM 'accepted' THEN RAISE EXCEPTION 'You are not friends with this player.'; END IF;
    DELETE FROM public.friendships WHERE id = friendship.id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.friends_players(text, text), public.friend_action(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.friends_players(text, text), public.friend_action(uuid, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
