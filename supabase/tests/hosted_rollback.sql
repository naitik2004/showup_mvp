-- Existing profiles are used only to simulate JWT subjects under the authenticated role.
-- Every test write is rolled back; no seeded matches or accounts remain.
BEGIN;
SELECT set_config('showup.test_a',(SELECT id::text FROM public.profiles ORDER BY id LIMIT 1),true);
SELECT set_config('showup.test_b',(SELECT id::text FROM public.profiles ORDER BY id OFFSET 1 LIMIT 1),true);
SELECT set_config('showup.test_c',(SELECT id::text FROM public.profiles ORDER BY id OFFSET 2 LIMIT 1),true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('showup.test_a'),true);
DO $$ DECLARE gid uuid; BEGIN
 gid:=public.create_game('football','Backend rollback verification',now()+interval '1 day',2,'beginner');
 PERFORM set_config('showup.test_game',gid::text,true);
 IF NOT EXISTS(SELECT 1 FROM public.my_hosted_games WHERE id=gid AND member_count=1) THEN RAISE EXCEPTION 'Hosting view/host membership failed'; END IF;
 BEGIN
  UPDATE public.games SET venue='Unauthorized direct write' WHERE id=gid;
  RAISE EXCEPTION 'Direct writes should have failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('showup.test_b'),true);
DO $$ DECLARE gid uuid:=current_setting('showup.test_game')::uuid; BEGIN
 PERFORM public.join_game(gid);
 IF NOT EXISTS(SELECT 1 FROM public.my_joined_games WHERE id=gid AND member_count=2 AND status='full') THEN RAISE EXCEPTION 'Joined view/count/status failed'; END IF;
 INSERT INTO public.messages(game_id,sender_id,body) VALUES(gid,auth.uid(),'Rollback-only test message');
 BEGIN
  INSERT INTO public.messages(game_id,sender_id,body) VALUES(gid,current_setting('showup.test_a')::uuid,'Spoofed sender');
  RAISE EXCEPTION 'Sender spoofing should have failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.cancel_game(gid);
  RAISE EXCEPTION 'Nonhost cancellation should have failed';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Only the host can do this.' THEN RAISE; END IF;
 END;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('showup.test_c'),true);
DO $$ DECLARE gid uuid:=current_setting('showup.test_game')::uuid; BEGIN
 IF EXISTS(SELECT 1 FROM public.messages WHERE game_id=gid) THEN RAISE EXCEPTION 'Nonmember read should be empty'; END IF;
 BEGIN
  INSERT INTO public.messages(game_id,sender_id,body) VALUES(gid,auth.uid(),'Nonmember intrusion');
  RAISE EXCEPTION 'Nonmember insert should have failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.join_game(gid);
  RAISE EXCEPTION 'Full match join should have failed';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Too late. That match is full.' THEN RAISE; END IF;
 END;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('showup.test_a'),true);
DO $$ DECLARE gid uuid:=current_setting('showup.test_game')::uuid; BEGIN
 IF (SELECT count(*) FROM public.messages WHERE game_id=gid)<>1 THEN RAISE EXCEPTION 'Member cannot read teammate message'; END IF;
 PERFORM public.cancel_game(gid);
 IF NOT EXISTS(SELECT 1 FROM public.games WHERE id=gid AND status='cancelled') THEN RAISE EXCEPTION 'Cancellation failed'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('showup.test_c'),true);
DO $$ DECLARE gid uuid:=current_setting('showup.test_game')::uuid; BEGIN
 IF EXISTS(SELECT 1 FROM public.games WHERE id=gid) THEN RAISE EXCEPTION 'Cancelled match visible to nonmember'; END IF;
 BEGIN
  PERFORM public.join_game(gid);
  RAISE EXCEPTION 'Cancelled match join should have failed';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Too late. That match is cancelled.' THEN RAISE; END IF;
 END;
END $$;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM 1 FROM public.games;
  RAISE EXCEPTION 'Anonymous select should have failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.create_game('football','Invalid anonymous host',now()+interval '1 day',2,'beginner');
  RAISE EXCEPTION 'Anonymous RPC should have failed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
