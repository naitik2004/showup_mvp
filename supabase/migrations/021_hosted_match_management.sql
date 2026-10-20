BEGIN;
CREATE FUNCTION public.update_hosted_game(p_game_id uuid, p_title text, p_venue text, p_starts_at timestamptz, p_max_players int, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE g public.games;
BEGIN
 SELECT * INTO g FROM public.games WHERE id=p_game_id FOR UPDATE;
 IF auth.uid() IS NULL OR NOT FOUND OR g.host_id<>auth.uid() THEN RAISE EXCEPTION 'Only the host can edit this match.'; END IF;
 IF g.status NOT IN ('open','full') THEN RAISE EXCEPTION 'Only open or full matches can be edited.'; END IF;
 IF p_starts_at IS NULL OR NOT isfinite(p_starts_at) OR p_starts_at<=now() THEN RAISE EXCEPTION 'Choose a future start time.'; END IF;
 IF p_max_players IS NULL OR p_max_players NOT BETWEEN 2 AND 22 OR p_max_players<(SELECT count(*) FROM public.game_members WHERE game_id=p_game_id) THEN RAISE EXCEPTION 'Capacity must be 2–22 and cannot be below the current player count.'; END IF;
 UPDATE public.games SET title=trim(p_title),venue=trim(p_venue),starts_at=p_starts_at,max_players=p_max_players,notes=p_notes,
 status=CASE WHEN p_max_players=(SELECT count(*) FROM public.game_members WHERE game_id=p_game_id) THEN 'full' ELSE 'open' END WHERE id=p_game_id;
END $$;
-- Deletion is recoverable cancellation: preserve memberships, messages and history.
CREATE FUNCTION public.delete_hosted_game(p_game_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT public.cancel_game(p_game_id) $$;
REVOKE ALL ON FUNCTION public.update_hosted_game(uuid,text,text,timestamptz,int,text),public.delete_hosted_game(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_hosted_game(uuid,text,text,timestamptz,int,text),public.delete_hosted_game(uuid) TO authenticated;
COMMIT;
