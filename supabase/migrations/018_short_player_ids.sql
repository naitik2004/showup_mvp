BEGIN;
-- Keep already-shared codes usable without displaying long authentication-like IDs.
CREATE TABLE public.player_id_aliases (
  player_id text PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.player_id_aliases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.player_id_aliases FROM PUBLIC, anon, authenticated;
INSERT INTO public.player_id_aliases(player_id, profile_id) SELECT player_id, id FROM public.profiles;

CREATE FUNCTION public.generate_short_player_id() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text; randomness bytea; position integer;
BEGIN
  -- Serialize allocation until transaction commit, so concurrent signups cannot
  -- claim the same code. Unique constraints provide an additional backstop.
  PERFORM pg_advisory_xact_lock(hashtextextended('showup:public-player-id', 0));
  LOOP
    candidate := 'SU-'; randomness := uuid_send(gen_random_uuid());
    FOR position IN 0..5 LOOP
      candidate := candidate || substr(alphabet, 1 + get_byte(randomness, position) % 32, 1);
    END LOOP;
    IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE player_id = candidate)
      AND NOT EXISTS(SELECT 1 FROM public.player_id_aliases WHERE player_id = candidate) THEN RETURN candidate; END IF;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.generate_short_player_id() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.assign_player_id() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.player_id IS NOT NULL THEN
    IF NEW.player_id IS DISTINCT FROM OLD.player_id THEN RAISE EXCEPTION 'Your player ID cannot be changed.'; END IF;
  ELSE NEW.player_id := public.generate_short_player_id(); END IF;
  RETURN NEW;
END $$;
-- Transactional lock prevents profile writes while existing IDs are shortened.
ALTER TABLE public.profiles DISABLE TRIGGER assign_player_id;
DO $$ DECLARE profile record; BEGIN
  FOR profile IN SELECT id FROM public.profiles ORDER BY id LOOP
    UPDATE public.profiles SET player_id = public.generate_short_player_id() WHERE id = profile.id;
  END LOOP;
END $$;
ALTER TABLE public.profiles ENABLE TRIGGER assign_player_id;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_short_player_id_format
  CHECK(player_id ~ '^SU-[A-HJ-NP-Z2-9]{6}$');

CREATE OR REPLACE FUNCTION public.friends_players(p_mode text, p_query text DEFAULT '')
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
      OR upper(replace(trim(p_query), '-', '')) = replace(x.player_id, '-', '')
      OR EXISTS(SELECT 1 FROM public.player_id_aliases alias WHERE alias.profile_id = x.id
        AND replace(alias.player_id, '-', '') = upper(replace(trim(p_query), '-', '')))))
  ORDER BY x.matches DESC, x.mutual DESC, lower(x.name), x.id
  LIMIT CASE WHEN p_mode IN ('network', 'requests') THEN NULL ELSE 30 END;
END $$;


NOTIFY pgrst, 'reload schema';
COMMIT;
