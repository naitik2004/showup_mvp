BEGIN;
SET LOCAL search_path = public, extensions, pg_temp;
CREATE TABLE public.games (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 sport text NOT NULL CHECK(sport IN ('football','badminton','basketball','table_tennis','cricket','tennis')),
 is_permanent boolean NOT NULL DEFAULT false, title text NOT NULL DEFAULT '' CHECK(length(title)<=120), venue text NOT NULL CHECK(length(trim(venue)) BETWEEN 1 AND 120),
 address text NOT NULL DEFAULT '' CHECK(length(address)<=500), lat double precision CHECK(lat BETWEEN -90 AND 90), lng double precision CHECK(lng BETWEEN -180 AND 180),
 starts_at timestamptz NOT NULL, max_players int NOT NULL CHECK(max_players BETWEEN 2 AND 22),
 skill_level text NOT NULL CHECK(skill_level IN ('beginner','intermediate','pro')), notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','full','live','done','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.games(status,starts_at);
CREATE INDEX ON public.games(host_id);
CREATE TABLE public.game_members (
 game_id uuid REFERENCES public.games(id) ON DELETE CASCADE, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'player' CHECK(role IN ('host','player')), joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(game_id,user_id)
);
CREATE INDEX ON public.game_members(user_id);
-- Preserve existing match IDs so saved URLs and invitations continue to resolve.
INSERT INTO public.games(id,host_id,sport,venue,starts_at,max_players,skill_level,status,created_at,is_permanent)
 SELECT id,host_id,sport,location_name,scheduled_at,max_players,skill_level,
 CASE status WHEN 'in_progress' THEN 'live' WHEN 'expired' THEN 'done' ELSE status END,created_at,is_permanent FROM public.game_groups;
-- Preserve legacy coordinates regardless of which schema owns PostGIS.
DO $$ DECLARE geo_schema text; BEGIN
 SELECT n.nspname INTO geo_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='postgis';
 IF geo_schema IS NOT NULL THEN
 EXECUTE format('UPDATE public.games g SET lat=%1$I.st_y(old.location::%1$I.geometry),lng=%1$I.st_x(old.location::%1$I.geometry) FROM public.game_groups old WHERE old.id=g.id',geo_schema);
 END IF;
END $$;
INSERT INTO public.game_members SELECT gm.group_id,gm.user_id,CASE WHEN g.host_id=gm.user_id THEN 'host' ELSE 'player' END,gm.joined_at
 FROM public.group_members gm JOIN public.games g ON g.id=gm.group_id WHERE gm.status='accepted';
INSERT INTO public.game_members(game_id,user_id,role) SELECT id,host_id,'host' FROM public.games ON CONFLICT DO NOTHING;
-- Migrate the existing chat table in place; do not discard chat history.
ALTER TABLE public.messages RENAME COLUMN group_id TO game_id;
ALTER TABLE public.messages RENAME COLUMN content TO body;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.messages'::regclass AND (contype='c' OR (contype='f' AND confrelid='public.game_groups'::regclass)) LOOP
 EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT %I',c.conname); END LOOP;
 FOR c IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='messages' LOOP
 EXECUTE format('DROP POLICY %I ON public.messages',c.policyname); END LOOP;
END $$;
ALTER TABLE public.messages ADD FOREIGN KEY(game_id) REFERENCES public.games(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CHECK(length(trim(body)) BETWEEN 1 AND 1000) NOT VALID;
CREATE INDEX ON public.messages(game_id,created_at);
CREATE FUNCTION public.is_game_member(p_game_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.game_members WHERE game_id=p_game_id AND user_id=auth.uid()) $$;
CREATE FUNCTION public.can_read_game(p_game_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.games WHERE id=p_game_id AND (status<>'cancelled' OR public.is_game_member(id))) $$;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY games_read ON public.games FOR SELECT TO authenticated USING(status<>'cancelled' OR public.is_game_member(id));
CREATE POLICY games_insert_host ON public.games FOR INSERT TO authenticated WITH CHECK(host_id=auth.uid());
CREATE POLICY games_update_host ON public.games FOR UPDATE TO authenticated USING(host_id=auth.uid()) WITH CHECK(host_id=auth.uid());
CREATE POLICY games_delete_host ON public.games FOR DELETE TO authenticated USING(host_id=auth.uid());
CREATE POLICY members_read ON public.game_members FOR SELECT TO authenticated USING(public.can_read_game(game_id));
CREATE POLICY messages_read ON public.messages FOR SELECT TO authenticated USING(public.is_game_member(game_id));
CREATE POLICY messages_send ON public.messages FOR INSERT TO authenticated WITH CHECK(sender_id=auth.uid() AND public.is_game_member(game_id));
REVOKE ALL ON public.games,public.game_members,public.messages FROM anon,authenticated;
GRANT SELECT ON public.games,public.game_members,public.messages TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
CREATE VIEW public.games_with_counts WITH(security_invoker=true) AS
 SELECT g.*, (SELECT count(*)::int FROM public.game_members m WHERE m.game_id=g.id) member_count,
 greatest(0,g.max_players-(SELECT count(*)::int FROM public.game_members m WHERE m.game_id=g.id)) spots_left,
 p.name host_name,p.avatar_url host_avatar FROM public.games g JOIN public.profiles p ON p.id=g.host_id;
CREATE VIEW public.my_hosted_games WITH(security_invoker=true) AS SELECT * FROM public.games_with_counts WHERE host_id=auth.uid();
CREATE VIEW public.my_joined_games WITH(security_invoker=true) AS SELECT * FROM public.games_with_counts g WHERE host_id<>auth.uid() AND public.is_game_member(g.id);
GRANT SELECT ON public.games_with_counts,public.my_hosted_games,public.my_joined_games TO authenticated;
CREATE FUNCTION public.touch_game() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER touch_game BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.touch_game();
CREATE FUNCTION public.sync_game_capacity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE gid uuid:=coalesce(NEW.game_id,OLD.game_id); BEGIN
 PERFORM 1 FROM public.games WHERE id=gid FOR UPDATE;
 UPDATE public.games SET status=CASE WHEN (SELECT count(*) FROM public.game_members WHERE game_id=gid)>=max_players THEN 'full' ELSE 'open' END WHERE id=gid AND status IN ('open','full'); RETURN NULL; END $$;
CREATE TRIGGER sync_game_capacity AFTER INSERT OR DELETE ON public.game_members FOR EACH ROW EXECUTE FUNCTION public.sync_game_capacity();
CREATE FUNCTION public.create_game(p_sport text,p_venue text,p_starts_at timestamptz,p_max_players int,p_skill_level text,p_notes text DEFAULT '',p_lat double precision DEFAULT NULL,p_lng double precision DEFAULT NULL,p_title text DEFAULT '',p_address text DEFAULT '',p_is_permanent boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE gid uuid; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to host a match.'; END IF;
 IF p_starts_at IS NULL OR NOT isfinite(p_starts_at) OR p_starts_at<=now() THEN RAISE EXCEPTION 'Start time must be in the future.'; END IF;
 IF p_max_players IS NULL OR p_max_players NOT BETWEEN 2 AND 22 THEN RAISE EXCEPTION 'Capacity must be between 2 and 22.'; END IF;
 INSERT INTO public.games(host_id,sport,venue,starts_at,max_players,skill_level,notes,lat,lng,title,address,is_permanent) VALUES(auth.uid(),p_sport,trim(p_venue),p_starts_at,p_max_players,p_skill_level,p_notes,p_lat,p_lng,p_title,p_address,p_is_permanent) RETURNING id INTO gid;
 INSERT INTO public.game_members VALUES(gid,auth.uid(),'host',now()); RETURN gid; END $$;
CREATE OR REPLACE FUNCTION public.join_game(p_game_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE g public.games; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to join this match.'; END IF;
 SELECT * INTO g FROM public.games WHERE id=p_game_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.'; END IF;
 IF EXISTS(SELECT 1 FROM public.game_members WHERE game_id=p_game_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'You already joined this match.'; END IF;
 IF g.status<>'open' THEN RAISE EXCEPTION 'Too late. That match is %.',g.status; END IF;
 IF g.starts_at<=now() THEN RAISE EXCEPTION 'Too late. That match has started.'; END IF;
 IF (SELECT count(*) FROM public.game_members WHERE game_id=p_game_id)>=g.max_players THEN RAISE EXCEPTION 'Too late. That match is full.'; END IF;
 INSERT INTO public.game_members(game_id,user_id) VALUES(p_game_id,auth.uid()); RETURN p_game_id; END $$;
CREATE FUNCTION public.leave_game(p_game_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE g public.games; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 SELECT * INTO g FROM public.games WHERE id=p_game_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.'; END IF;
 IF g.host_id=auth.uid() THEN RAISE EXCEPTION 'Hosts must cancel instead of leaving.'; END IF;
 IF g.status NOT IN ('open','full') THEN RAISE EXCEPTION 'This match is no longer open.'; END IF;
 DELETE FROM public.game_members WHERE game_id=p_game_id AND user_id=auth.uid(); END $$;
CREATE FUNCTION public.set_game_status(p_game_id uuid,p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE g public.games; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 SELECT * INTO g FROM public.games WHERE id=p_game_id FOR UPDATE;
 IF NOT FOUND OR g.host_id<>auth.uid() THEN RAISE EXCEPTION 'Only the host can do this.'; END IF;
 IF NOT ((p_status='live' AND g.status IN ('open','full')) OR (p_status='done' AND g.status='live') OR (p_status='cancelled' AND g.status IN ('open','full','live'))) THEN RAISE EXCEPTION 'Invalid match status transition.'; END IF;
 UPDATE public.games SET status=p_status WHERE id=p_game_id; END $$;
CREATE FUNCTION public.cancel_game(p_game_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT public.set_game_status(p_game_id,'cancelled') $$;
CREATE FUNCTION public.start_game(p_game_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT public.set_game_status(p_game_id,'live') $$;
CREATE FUNCTION public.finish_game(p_game_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT public.set_game_status(p_game_id,'done') $$;
DO $$ DECLARE f record; t text; BEGIN
 FOR f IN SELECT p.oid::regprocedure sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('create_game','join_game','leave_game','set_game_status','cancel_game','start_game','finish_game','is_game_member','can_read_game','touch_game','sync_game_capacity') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.sig);
 IF f.sig::text NOT LIKE '%touch_game%' AND f.sig::text NOT LIKE '%sync_game_capacity%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig); END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['games','game_members','messages'] LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',t); END IF;
 END LOOP; END $$;
-- Membership DELETE events are unfiltered; clients refetch visible state under RLS.
ALTER TABLE public.game_members REPLICA IDENTITY FULL;
COMMIT;
