BEGIN;
-- Forward-only repair: preserve UUIDs, valid shared codes and historical aliases.
LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id WHERE u.id IS NULL) THEN
 RAISE EXCEPTION 'Profiles without matching auth users require a verified legacy identity mapping before migration.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.profiles'::regclass AND confrelid='auth.users'::regclass AND contype='f') THEN
 ALTER TABLE public.profiles ADD CONSTRAINT profiles_auth_user_identity FOREIGN KEY(id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
END $$;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legacy_id text;
UPDATE public.profiles p SET legacy_id = coalesce(p.legacy_id,
  (SELECT a.player_id FROM public.player_id_aliases a WHERE a.profile_id=p.id ORDER BY a.player_id LIMIT 1), p.player_id);
CREATE OR REPLACE FUNCTION public.generate_short_player_id() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text; randomness bytea; position integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('showup:public-player-id',0));
  LOOP
    candidate := 'SU-'; randomness := uuid_send(gen_random_uuid());
    FOR position IN 0..5 LOOP
      candidate := candidate || substr(alphabet,1+get_byte(randomness,position)%length(alphabet),1);
    END LOOP;
    IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE player_id=candidate)
      AND NOT EXISTS(SELECT 1 FROM public.player_id_aliases WHERE player_id=candidate) THEN RETURN candidate; END IF;
  END LOOP;
END $$;
ALTER TABLE public.profiles DISABLE TRIGGER assign_player_id;
INSERT INTO public.player_id_aliases(player_id,profile_id)
  SELECT player_id,id FROM public.profiles WHERE player_id IS NOT NULL ON CONFLICT DO NOTHING;
DO $$ DECLARE profile record; BEGIN
  FOR profile IN SELECT id FROM public.profiles WHERE player_id IS NULL OR player_id !~ '^SU-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$' LOOP
    UPDATE public.profiles SET player_id=public.generate_short_player_id() WHERE id=profile.id;
  END LOOP;
END $$;
ALTER TABLE public.profiles ENABLE TRIGGER assign_player_id;
ALTER TABLE public.profiles DROP CONSTRAINT profiles_short_player_id_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_short_player_id_format
 CHECK(player_id ~ '^SU-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$');
ALTER TABLE public.profiles ALTER COLUMN player_id SET NOT NULL;
-- Existing BEFORE INSERT allocator participates in the auth profile creation
-- transaction. Lock both public and historical identities on every later update.
CREATE OR REPLACE FUNCTION public.assign_player_id() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
   IF NEW.player_id IS DISTINCT FROM OLD.player_id OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.legacy_id IS DISTINCT FROM OLD.legacy_id THEN RAISE EXCEPTION 'Your player ID cannot be changed.'; END IF;
 ELSE
   NEW.player_id:=public.generate_short_player_id(); NEW.legacy_id:=NULL;
 END IF;
 RETURN NEW;
END $$;

-- Every caller, including misses, consumes an atomic server-side lookup budget.
-- Anonymous traffic shares a global budget: no spoofable client IP headers.
CREATE TABLE public.player_lookup_limits (
 subject text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL
);
ALTER TABLE public.player_lookup_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.player_lookup_limits FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.consume_player_lookup() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE used integer; BEGIN
 INSERT INTO public.player_lookup_limits AS limits VALUES(coalesce(auth.uid()::text,'anonymous'),date_trunc('minute',clock_timestamp()),1)
 ON CONFLICT(subject) DO UPDATE SET
 attempts=CASE WHEN limits.window_start=excluded.window_start THEN limits.attempts+1 ELSE 1 END,
 window_start=excluded.window_start RETURNING attempts INTO used;
 IF used>60 THEN RAISE EXCEPTION 'Too many player lookups. Try again in a minute.' USING ERRCODE='P0429'; END IF;
END $$;
CREATE FUNCTION public.players_blocked(a uuid,b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_blocks WHERE (blocker_id=a AND blocked_id=b) OR (blocker_id=b AND blocked_id=a))
$$;
CREATE FUNCTION public.resolve_player_code(code text) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT p.id FROM public.profiles p WHERE (p.player_id=upper(trim(code)) OR EXISTS(
 SELECT 1 FROM public.player_id_aliases a WHERE a.profile_id=p.id AND a.player_id=upper(trim(code))))
 AND NOT public.players_blocked(auth.uid(),p.id) LIMIT 1
$$;
CREATE FUNCTION public.player_stats_for(target uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object(
 'played',count(*) FILTER(WHERE g.status='done'),
 'hosted',count(*) FILTER(WHERE g.host_id=target),
 'joined',count(*) FILTER(WHERE g.host_id<>target),
 'upcoming',count(*) FILTER(WHERE g.status='live' OR (g.status IN ('open','full') AND g.starts_at>now())))
 FROM public.games g JOIN public.game_members m ON m.game_id=g.id WHERE m.user_id=target
$$;
CREATE FUNCTION public.public_player_fields(target uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('player_id',p.player_id,'name',p.name,'avatar_url',p.avatar_url,
 'city',CASE lower(trim(p.city)) WHEN 'delhi ncr' THEN 'Delhi NCR' WHEN 'mumbai' THEN 'Mumbai' WHEN 'bengaluru' THEN 'Bengaluru' WHEN 'pune' THEN 'Pune' WHEN 'hyderabad' THEN 'Hyderabad' WHEN 'chennai' THEN 'Chennai' ELSE NULL END,'skill',coalesce(to_jsonb(p)->>'skill_level',to_jsonb(p)->>'skill'),
 'preferred_sports',p.preferred_sports,'stats',public.player_stats_for(p.id)) FROM public.profiles p WHERE p.id=target
$$;
CREATE FUNCTION public.find_player(player_id text) RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; BEGIN
 PERFORM public.consume_player_lookup();
 IF length(player_id)>100 THEN RETURN; END IF;
 target:=public.resolve_player_code(player_id);
 IF target IS NOT NULL THEN RETURN NEXT public.public_player_fields(target); END IF;
END $$;
CREATE FUNCTION public.my_player_stats() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 RETURN public.player_stats_for(auth.uid());
END $$;

-- Keep the existing graph operations but remove their unrestricted API entry.
ALTER FUNCTION public.friends_players(text,text) RENAME TO friends_players_internal;
CREATE FUNCTION public.friends_players(p_mode text,p_query text DEFAULT '')
RETURNS TABLE(id uuid,name text,player_id text,relationship text,mutual_count bigint,shared_matches bigint,preferred_sports text[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.consume_player_lookup();
 RETURN QUERY SELECT f.*,p.preferred_sports FROM public.friends_players_internal(p_mode,p_query) f JOIN public.profiles p ON p.id=f.id;
END $$;
-- Return handled action failures rather than rolling back the quota update.
CREATE FUNCTION public.friend_action_by_code(p_player_code text,p_action text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; BEGIN
 PERFORM public.consume_player_lookup();
 BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to manage friends.'; END IF;
  target:=public.resolve_player_code(p_player_code);
  IF target IS NULL THEN RAISE EXCEPTION 'Player not found or unavailable. Check the ID and try again.'; END IF;
  PERFORM public.friend_action(target,p_action);
  RETURN jsonb_build_object('ok',true);
 EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'message',SQLERRM);
 END;
END $$;
CREATE FUNCTION public.invite_player_by_code(p_game_id uuid,p_player_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; invitation uuid; BEGIN
 PERFORM public.consume_player_lookup();
 BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to invite a player.'; END IF;
  target:=public.resolve_player_code(p_player_code);
  IF target IS NULL THEN RAISE EXCEPTION 'Player not found or unavailable. Check the ID and try again.'; END IF;
  invitation:=public.send_game_invite(p_game_id,target);
  RETURN jsonb_build_object('ok',true,'invite_id',invitation);
 EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'message',SQLERRM);
 END;
END $$;
ALTER FUNCTION public.respond_to_game_invite(uuid,text) RENAME TO respond_to_game_invite_internal;
CREATE FUNCTION public.respond_to_game_invite(p_invite_id uuid,p_action text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE invitation public.game_invites; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 SELECT * INTO invitation FROM public.game_invites WHERE id=p_invite_id AND to_user=auth.uid();
 IF NOT FOUND OR public.players_blocked(auth.uid(),invitation.from_user) THEN RAISE EXCEPTION 'Invite unavailable.'; END IF;
 RETURN public.respond_to_game_invite_internal(p_invite_id,p_action);
END $$;
-- Actor identity never comes from a message payload.
CREATE FUNCTION public.send_match_message(p_game_id uuid,p_body text,p_message_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_game_member(p_game_id) THEN RAISE EXCEPTION 'Join this match to send messages.'; END IF;
 IF p_body IS NULL OR length(trim(p_body)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Messages need 1 to 1000 characters.'; END IF;
 INSERT INTO public.messages(id,game_id,sender_id,body) VALUES(p_message_id,p_game_id,auth.uid(),trim(p_body));
END $$;
REVOKE INSERT ON public.messages FROM authenticated;

-- Public columns only; bulk UUID lookup is restricted to actual relationships,
-- including former members who authored messages in an authorized match.
CREATE FUNCTION public.related_player_profiles(p_ids uuid[]) RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 IF cardinality(p_ids)>150 THEN RAISE EXCEPTION 'Too many players.'; END IF;
 RETURN QUERY SELECT public.public_player_fields(p.id)||jsonb_build_object('id',p.id) FROM public.profiles p
 WHERE p.id=ANY(p_ids) AND NOT public.players_blocked(auth.uid(),p.id) AND (
 p.id=auth.uid() OR EXISTS(SELECT 1 FROM public.friendships f WHERE f.status='accepted' AND
 ((f.user_a=auth.uid() AND f.user_b=p.id) OR (f.user_b=auth.uid() AND f.user_a=p.id)))
 OR EXISTS(SELECT 1 FROM public.game_members mine JOIN public.game_members other ON other.game_id=mine.game_id WHERE mine.user_id=auth.uid() AND other.user_id=p.id)
 OR EXISTS(SELECT 1 FROM public.messages msg WHERE msg.sender_id=p.id AND public.is_game_member(msg.game_id))
 OR EXISTS(SELECT 1 FROM public.game_invites i WHERE (i.to_user=auth.uid() AND i.from_user=p.id) OR (i.from_user=auth.uid() AND i.to_user=p.id)));
END $$;
CREATE FUNCTION public.match_player_profiles(p_game_id uuid) RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_read_game(p_game_id) THEN RAISE EXCEPTION 'This match is unavailable.'; END IF;
 RETURN QUERY SELECT public.public_player_fields(p.id)||jsonb_build_object('id',p.id) FROM public.profiles p
 WHERE NOT public.players_blocked(auth.uid(),p.id) AND (
 EXISTS(SELECT 1 FROM public.games g WHERE g.id=p_game_id AND g.host_id=p.id)
 OR EXISTS(SELECT 1 FROM public.game_members m WHERE m.game_id=p_game_id AND m.user_id=p.id)
 OR (public.is_game_member(p_game_id) AND EXISTS(SELECT 1 FROM (SELECT sender_id FROM public.messages WHERE game_id=p_game_id AND NOT public.players_blocked(auth.uid(),sender_id) ORDER BY created_at DESC LIMIT 50) recent WHERE recent.sender_id=p.id)));
END $$;
-- Direct table reads are owner-only; public data goes through explicit DTOs.
DO $$ DECLARE policy record; BEGIN
 FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'  LOOP
 EXECUTE format('DROP POLICY %I ON public.profiles',policy.policyname); END LOOP;
END $$;
CREATE POLICY profiles_owner_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid());
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
REVOKE ALL ON public.profiles FROM anon;
-- Revoke old column-specific grants as well as table-level privileges.
DO $$ DECLARE col record; BEGIN
 FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attnum>0 AND NOT attisdropped LOOP
 EXECUTE format('REVOKE ALL (%I) ON public.profiles FROM anon,authenticated',col.attname); END LOOP;
END $$;
-- Avoid star projections accidentally exposing future auth/legacy columns.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT(id,name,avatar_url,city,preferred_sports,created_at,onboarded,player_id) ON public.profiles TO authenticated;
REVOKE INSERT,UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE(name,city,preferred_sports,onboarded,avatar_url) ON public.profiles TO authenticated;

-- Board host labels must not require directory-wide profiles SELECT privileges.
CREATE FUNCTION public.game_host_label(p_game_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('name',p.name,'avatar_url',p.avatar_url) FROM public.games g JOIN public.profiles p ON p.id=g.host_id
 WHERE g.id=p_game_id AND public.can_read_game(g.id) AND NOT public.players_blocked(auth.uid(),p.id)
$$;
CREATE OR REPLACE VIEW public.games_with_counts WITH(security_invoker=true) AS
 SELECT g.*,(SELECT count(*)::int FROM public.game_members m WHERE m.game_id=g.id) member_count,
 greatest(0,g.max_players-(SELECT count(*)::int FROM public.game_members m WHERE m.game_id=g.id)) spots_left,
 public.game_host_label(g.id)->>'name' host_name,public.game_host_label(g.id)->>'avatar_url' host_avatar FROM public.games g;

CREATE FUNCTION public.kick_player_by_code(p_game_id uuid,p_player_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; game public.games; BEGIN
 PERFORM public.consume_player_lookup();
 BEGIN
  SELECT * INTO game FROM public.games WHERE id=p_game_id FOR UPDATE;
  IF auth.uid() IS NULL OR game.host_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the host can manage players.'; END IF;
  IF game.status NOT IN ('open','full') THEN RAISE EXCEPTION 'This match is no longer open.'; END IF;
  SELECT p.id INTO target FROM public.profiles p JOIN public.game_members m ON m.user_id=p.id
  WHERE m.game_id=p_game_id AND p.player_id=upper(trim(p_player_code));
  IF target IS NULL OR target=auth.uid() THEN RAISE EXCEPTION 'Choose another player in this match.'; END IF;
  DELETE FROM public.game_members WHERE game_id=p_game_id AND user_id=target;
  RETURN jsonb_build_object('ok',true);
 EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'message',SQLERRM);
 END;
END $$;
CREATE FUNCTION public.my_blocked_players() RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
 RETURN QUERY SELECT jsonb_build_object('name',p.name,'player_id',p.player_id) FROM public.user_blocks b JOIN public.profiles p ON p.id=b.blocked_id WHERE b.blocker_id=auth.uid();
END $$;
CREATE FUNCTION public.block_player_by_code(p_player_code text,p_block boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; BEGIN
 PERFORM public.consume_player_lookup();
 BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  IF p_block IS NULL THEN RAISE EXCEPTION 'Choose block or unblock.'; END IF;
  SELECT id INTO target FROM public.profiles WHERE player_id=upper(trim(p_player_code));
  IF target IS NULL OR target=auth.uid() THEN RAISE EXCEPTION 'Choose another available player.'; END IF;
  IF p_block THEN
   -- Blocking a known UUID is allowed even if the peer has already blocked us.
   INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES(auth.uid(),target) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM public.user_blocks WHERE blocker_id=auth.uid() AND blocked_id=target; END IF;
  RETURN jsonb_build_object('ok',true);
 EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'message',SQLERRM);
 END;
END $$;
CREATE FUNCTION public.player_reviews(p_player_code text) RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; BEGIN
 PERFORM public.consume_player_lookup(); target:=public.resolve_player_code(p_player_code);
 IF target IS NULL THEN RETURN; END IF;
 RETURN QUERY SELECT jsonb_build_object('id',r.id,'name',p.name,'player_id',p.player_id,'sport',r.sport,
 'skill_score',r.skill_score,'sportsmanship_score',r.sportsmanship_score,'reliability_score',r.reliability_score)
 FROM public.sport_ratings r JOIN public.profiles p ON p.id=r.rater_id
 WHERE r.ratee_id=target AND NOT public.players_blocked(auth.uid(),p.id) ORDER BY r.created_at DESC LIMIT 50;
END $$;
CREATE FUNCTION public.viewer_can_see_player(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT auth.uid() IS NOT NULL AND NOT public.players_blocked(auth.uid(),target)
$$;
CREATE POLICY invites_unblocked_read ON public.game_invites AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.viewer_can_see_player(from_user) AND public.viewer_can_see_player(to_user));
CREATE POLICY messages_unblocked_read ON public.messages AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.viewer_can_see_player(sender_id));
-- Audit old functions separately; revoke all new privileged helpers explicitly.
DO $$ DECLARE routine record; BEGIN
 FOR routine IN SELECT oid::regprocedure signature,proname FROM pg_proc WHERE pronamespace='public'::regnamespace
 AND proname IN ('generate_short_player_id','assign_player_id','consume_player_lookup','players_blocked','resolve_player_code','player_stats_for','public_player_fields','find_player','my_player_stats','friends_players_internal','friends_players','friend_action','friend_action_by_code','send_game_invite','respond_to_game_invite_internal','respond_to_game_invite','invite_player_by_code','send_match_message','related_player_profiles','match_player_profiles','game_host_label','kick_player_by_code','my_blocked_players','block_player_by_code','player_reviews','viewer_can_see_player') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',routine.signature);
 IF routine.proname IN ('find_player','my_player_stats','friends_players','friend_action_by_code','respond_to_game_invite','invite_player_by_code','send_match_message','related_player_profiles','match_player_profiles','game_host_label','kick_player_by_code','my_blocked_players','block_player_by_code','player_reviews','viewer_can_see_player') THEN
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',routine.signature); END IF;
 IF routine.proname IN ('find_player','player_reviews') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon',routine.signature); END IF;
 END LOOP;
END $$;
-- Do not publish the private block graph. Realtime DELETE events cannot be
-- row-filtered safely; publish only viewer-owned invalidation version updates.
CREATE TABLE public.player_visibility_events (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 version bigint NOT NULL DEFAULT 1
);
ALTER TABLE public.player_visibility_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY visibility_owner_read ON public.player_visibility_events FOR SELECT TO authenticated USING(user_id=auth.uid());
REVOKE ALL ON public.player_visibility_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.player_visibility_events TO authenticated;
CREATE FUNCTION public.invalidate_block_profiles() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid; peer uuid; affected uuid; BEGIN
 actor:=coalesce(NEW.blocker_id,OLD.blocker_id); peer:=coalesce(NEW.blocked_id,OLD.blocked_id);
 FOREACH affected IN ARRAY ARRAY[least(actor,peer),greatest(actor,peer)] LOOP
  INSERT INTO public.player_visibility_events(user_id) SELECT affected WHERE EXISTS(SELECT 1 FROM public.profiles WHERE id=affected)
  ON CONFLICT(user_id) DO UPDATE SET version=player_visibility_events.version+1;
 END LOOP;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.invalidate_block_profiles() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER invalidate_block_profiles AFTER INSERT OR DELETE ON public.user_blocks FOR EACH ROW EXECUTE FUNCTION public.invalidate_block_profiles();
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='player_visibility_events') THEN
 ALTER PUBLICATION supabase_realtime ADD TABLE public.player_visibility_events; END IF;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
