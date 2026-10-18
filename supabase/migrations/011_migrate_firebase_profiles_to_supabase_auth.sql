-- Preserve the existing profile and relationship data while making Supabase
-- Auth UUIDs the sole application identity.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL AND to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users RENAME TO profiles;
  ELSIF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Expected public.users or public.profiles to exist';
  END IF;
END;
$$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle TEXT;

-- Give existing profiles stable, unique handles without deleting or replacing
-- any profile rows.
UPDATE public.profiles
SET handle = COALESCE(
  NULLIF(handle, ''),
  COALESCE(NULLIF(trim('-' FROM regexp_replace(lower(COALESCE(name, 'player')), '[^a-z0-9]+', '-', 'g')), ''), 'player')
    || '-' || substr(replace(id::text, '-', ''), 1, 8)
);
ALTER TABLE public.profiles ALTER COLUMN handle SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_key ON public.profiles(handle);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Signed-in users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Signed-in users can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name TEXT;
  v_city TEXT;
  v_slug TEXT;
BEGIN
  v_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''), split_part(NEW.email, '@', 1), 'Player');
  v_city := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'city'), ''), 'Delhi NCR');
  v_slug := COALESCE(NULLIF(trim('-' FROM regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), ''), 'player');

  INSERT INTO public.profiles (id, name, handle, city, avatar_url)
  VALUES (
    NEW.id,
    v_name,
    v_slug || '-' || substr(replace(NEW.id::text, '-', ''), 1, 8),
    v_city,
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Recreate the nearby-games RPC against profiles. Drop/recreate permits the
-- return shape used by the app (including coordinates) to be consistent.
DROP FUNCTION IF EXISTS public.find_groups_near(FLOAT, FLOAT, FLOAT);
CREATE FUNCTION public.find_groups_near(
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
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT
    g.id, g.host_id, g.sport, g.location, g.location_name, g.max_players,
    g.skill_level, g.scheduled_at, g.expires_at, g.is_permanent, g.status,
    g.created_at, p.name AS host_name,
    (SELECT COUNT(*) FROM public.group_members gm
      WHERE gm.group_id = g.id AND gm.status = 'accepted') AS member_count,
    ST_Distance(g.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance,
    ST_Y(g.location::geometry) AS lat_out,
    ST_X(g.location::geometry) AS lng_out
  FROM public.game_groups g
  LEFT JOIN public.profiles p ON g.host_id = p.id
  WHERE g.status IN ('open', 'in_progress')
    AND ST_DWithin(g.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
  ORDER BY distance ASC;
$$;
REVOKE ALL ON FUNCTION public.find_groups_near(FLOAT, FLOAT, FLOAT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_groups_near(FLOAT, FLOAT, FLOAT) TO authenticated;

-- Rebind the transaction-safe invite accept RPC to the signed-in Supabase
-- identity. Existing foreign keys follow public.users when it is renamed.
CREATE OR REPLACE FUNCTION public.accept_game_invite(p_invite_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_invite public.game_invites%ROWTYPE;
  v_game public.game_groups%ROWTYPE;
  v_member_count INTEGER;
  v_status TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to accept this invite.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_invite FROM public.game_invites
  WHERE id = p_invite_id AND to_user = v_actor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invite has already been answered.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_game FROM public.game_groups WHERE id = v_invite.game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.' USING ERRCODE = 'P0002'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = v_game.id AND gm.user_id = v_actor_id AND gm.status = 'accepted'
  ) THEN
    UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('game_id', v_game.id, 'already_member', true);
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.group_members gm
  WHERE gm.group_id = v_game.id AND gm.status = 'accepted';
  v_status := CASE v_game.status WHEN 'in_progress' THEN 'live' WHEN 'expired' THEN 'done' ELSE v_game.status END;
  IF v_game.status <> 'open' OR v_member_count >= v_game.max_players THEN
    IF v_game.status = 'open' AND v_member_count >= v_game.max_players THEN
      UPDATE public.game_groups SET status = 'full' WHERE id = v_game.id;
      v_status := 'full';
    END IF;
    RAISE EXCEPTION 'Too late. That match is %.', v_status USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, status)
  VALUES (v_game.id, v_actor_id, 'accepted')
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'accepted';
  UPDATE public.game_invites SET status = 'accepted', responded_at = NOW() WHERE id = v_invite.id;

  SELECT COUNT(*) INTO v_member_count FROM public.group_members gm
  WHERE gm.group_id = v_game.id AND gm.status = 'accepted';
  IF v_member_count >= v_game.max_players THEN
    UPDATE public.game_groups SET status = 'full' WHERE id = v_game.id;
  END IF;
  RETURN jsonb_build_object('game_id', v_game.id, 'already_member', false);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_game_invite(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_game_invite(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_game_invite(UUID) TO authenticated;

-- All application tables retain their UUID rows and already have RLS enabled.
-- Keep the legacy Firebase link table/data in place, inaccessible to clients.
DO $$
BEGIN
  IF to_regclass('public.firebase_user_links') IS NOT NULL THEN
    ALTER TABLE public.firebase_user_links ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.firebase_user_links FROM anon, authenticated;
  END IF;
END;
$$;

COMMIT;
