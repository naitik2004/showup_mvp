-- Hosted verification only after backup and migrations 019/020.
-- All temporary name/block changes are rolled back; no requests are sent.
BEGIN;
DO $$
DECLARE owner public.profiles; peer public.profiles; result jsonb; stored_id text;
BEGIN
 SELECT * INTO owner FROM public.profiles ORDER BY id LIMIT 1;
 SELECT * INTO peer FROM public.profiles WHERE id<>owner.id AND NOT public.players_blocked(owner.id,id) ORDER BY id LIMIT 1;
 IF owner.id IS NULL OR peer.id IS NULL THEN RAISE EXCEPTION 'Two profiles required for verification'; END IF;
 PERFORM set_config('request.jwt.claim.sub',owner.id::text,true);
 SELECT value INTO result FROM public.find_player(lower(peer.player_id)) value;
 IF result->>'player_id' IS DISTINCT FROM peer.player_id THEN RAISE EXCEPTION 'Case-insensitive lookup failed'; END IF;
 IF result ? 'id' OR result ? 'email' OR result ? 'legacy_id' OR result ? 'location' THEN RAISE EXCEPTION 'Private field leaked'; END IF;
 SELECT value INTO result FROM public.find_player(owner.player_id) value;
 IF result->'stats' IS DISTINCT FROM public.my_player_stats() THEN RAISE EXCEPTION 'Public stats mismatch'; END IF;
 BEGIN
  UPDATE public.profiles SET player_id='SU-AAAAAA' WHERE id=owner.id;
  RAISE EXCEPTION 'Immutable ID trigger did not reject change';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'Your player ID cannot be changed.' THEN RAISE; END IF;
 END;
 UPDATE public.profiles SET name='Temporary rollback-only ID check' WHERE id=owner.id;
 SELECT player_id INTO stored_id FROM public.profiles WHERE id=owner.id;
 IF stored_id IS DISTINCT FROM owner.player_id THEN RAISE EXCEPTION 'Name edit changed ID'; END IF;
 result:=public.friend_action_by_code(owner.player_id,'request');
 IF result->>'ok'<>'false' THEN RAISE EXCEPTION 'Self request allowed'; END IF;
 result:=public.friend_action_by_code('SU-000000','request');
 IF result->>'ok'<>'false' THEN RAISE EXCEPTION 'Unknown ID allowed'; END IF;
 result:=public.block_player_by_code(peer.player_id,true);
 IF result->>'ok'<>'true' THEN RAISE EXCEPTION 'Block verification failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.find_player(peer.player_id)) THEN RAISE EXCEPTION 'Blocked lookup leaked'; END IF;
 result:=public.friend_action_by_code(peer.player_id,'request');
 IF result->>'ok'<>'false' THEN RAISE EXCEPTION 'Blocked request allowed'; END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF (SELECT count(id) FROM public.profiles)<>1 THEN RAISE EXCEPTION 'Owner row isolation failed'; END IF;
 IF has_column_privilege(current_user,'public.profiles','legacy_id','SELECT') THEN RAISE EXCEPTION 'Private legacy column exposed'; END IF;
 IF has_function_privilege(current_user,'public.friend_action(uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'Raw action bypass exposed'; END IF;
END $$;
ROLLBACK;
select 'PASS: case-insensitive lookup, immutable ID, editable name, public stats parity, private fields, self/unknown/blocked rejection, owner RLS. All test writes rolled back.' as hosted_acceptance;
