-- Isolated local database fixture IDs only. All test data is rolled back.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
SELECT create_game('football','CRUD test',now()+interval '1 day',8,'beginner') AS test_id \gset
SELECT update_hosted_game(:'test_id','Updated','New court',now()+interval '2 days',2,'Updated notes');
SELECT 1 / (CASE WHEN title='Updated' AND venue='New court' AND max_players=2 THEN 1 ELSE 0 END) FROM games WHERE id=:'test_id';
SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
SELECT set_config('test.game_id', :'test_id', true);
DO $$ BEGIN
 BEGIN PERFORM update_hosted_game(current_setting('test.game_id')::uuid,'Bad','Bad',now()+interval '1 day',8,''); RAISE EXCEPTION 'Unauthorized update succeeded';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Only the host can edit this match.' THEN RAISE; END IF; END;
 BEGIN PERFORM delete_hosted_game(current_setting('test.game_id')::uuid); RAISE EXCEPTION 'Unauthorized delete succeeded';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Only the host can do this.' THEN RAISE; END IF; END;
END $$;
SET LOCAL request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
SELECT delete_hosted_game(:'test_id');
SELECT 1 / (CASE WHEN status='cancelled' THEN 1 ELSE 0 END) FROM games WHERE id=:'test_id';
SELECT 1 / count(*)::int FROM game_members WHERE game_id=:'test_id';
ROLLBACK;
