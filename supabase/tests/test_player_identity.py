"""Self-contained rehearsal on a NEW isolated DB; never use a production DSN.
PGHOST=/private/tmp PGPORT=55441 python3 supabase/tests/test_player_identity.py
Requires bootstrap.sql, builds fixtures and migrations 015-019 in order.
"""
import concurrent.futures
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ['psql', '-h', os.environ.get('PGHOST', '/private/tmp'), '-p', os.environ.get('PGPORT', '55441'), '-d', os.environ.get('PGDATABASE', 'postgres'), '-X', '-tA', '-v', 'ON_ERROR_STOP=1']

def sql(query, user=None, role=None, ok=True):
    prefix = f"SET ROLE {role or 'authenticated'}; SET request.jwt.claim.sub='{user or ''}';" if user or role else ''
    result = subprocess.run(BASE + ['-c', prefix + query], capture_output=True, text=True)
    assert (result.returncode == 0) == ok, result.stderr or result.stdout
    return result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ''

def apply(path):
    result = subprocess.run(BASE + ['-f', str(ROOT / path)], capture_output=True, text=True)
    if result.returncode:
        raise AssertionError(f'STOP: {path}\n{result.stderr}')
    print('APPLIED:', path, flush=True)

def action(query, user, success=True):
    result = json.loads(sql(query, user))
    assert result['ok'] is success, result
    return result

def check(label): print('PASS:', label, flush=True)

# Obey inspect-before-write; this runner refuses existing public data/schema.
existing = sql("select table_name from information_schema.tables where table_schema = 'public';")
assert not existing, 'Use a NEW isolated database; existing tables: ' + existing
apply('supabase/tests/bootstrap.sql')
apply('supabase/migrations/015_matches_backend.sql')
apply('supabase/migrations/016_match_invite_compatibility.sql')
apply('supabase/tests/player_identity_fixture.sql')
# Use the real auth->profiles trigger from migration 011, without unrelated legacy changes.
source = (ROOT / 'supabase/migrations/011_migrate_firebase_profiles_to_supabase_auth.sql').read_text()
start = source.index('CREATE OR REPLACE FUNCTION public.handle_new_auth_user()')
end = source.index('-- Recreate the nearby-games RPC', start)
sql(source[start:end])
apply('supabase/migrations/017_friends_and_player_ids.sql')
apply('supabase/migrations/018_short_player_ids.sql')
A, B, C = [f'00000000-0000-0000-0000-{i:012d}' for i in range(1, 4)]
sql(f"INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES('{A}','private-a@example.test','{{\"name\":\"Player A\"}}'),('{B}','private-b@example.test','{{\"name\":\"Player B\"}}'),('{C}','private-c@example.test','{{\"name\":\"Player C\"}}')")
# Force one historical L code prior to repair; preserve valid codes unchanged.
sql(f"ALTER TABLE profiles DISABLE TRIGGER assign_player_id; UPDATE profiles SET player_id='SU-LLLLLL' WHERE id='{B}'; ALTER TABLE profiles ENABLE TRIGGER assign_player_id")
old_a = sql(f"SELECT player_id FROM profiles WHERE id='{A}'")
game = sql("SELECT create_game('football','Test court',now()+interval '1 day',6,'beginner')", A)
sql(f"SELECT join_game('{game}')", B)
sql(f"SELECT friend_action('{B}','request')", A)
sql(f"SELECT friend_action('{A}','accept')", B)
sql(f"INSERT INTO messages(game_id,sender_id,body) VALUES('{game}','{B}','Before migration')")
sql(f"INSERT INTO sport_ratings(game_id,ratee_id,rater_id,sport,skill_score,sportsmanship_score,reliability_score) VALUES('{game}','{A}','{B}','football',4,5,4)")
relationships = sql("SELECT md5((SELECT string_agg(row_to_json(m)::text,',' ORDER BY game_id,user_id) FROM game_members m) || (SELECT string_agg(row_to_json(m)::text,',' ORDER BY id) FROM messages m) || (SELECT string_agg(row_to_json(f)::text,',' ORDER BY id) FROM friendships f))")
apply('supabase/migrations/019_player_identity_contract.sql')
apply('supabase/migrations/020_public_city_aliases.sql')
assert sql("SELECT md5((SELECT string_agg(row_to_json(m)::text,',' ORDER BY game_id,user_id) FROM game_members m) || (SELECT string_agg(row_to_json(m)::text,',' ORDER BY id) FROM messages m) || (SELECT string_agg(row_to_json(f)::text,',' ORDER BY id) FROM friendships f))") == relationships
assert sql("SELECT count(*)=count(DISTINCT player_id) AND bool_and(player_id ~ '^SU-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$') FROM profiles") == 't'
code_a = sql(f"SELECT player_id FROM profiles WHERE id='{A}'")
code_b = sql(f"SELECT player_id FROM profiles WHERE id='{B}'")
code_c = sql(f"SELECT player_id FROM profiles WHERE id='{C}'")
if 'L' not in old_a: assert code_a == old_a
assert sql("SELECT count(*) FROM player_id_aliases WHERE player_id='SU-LLLLLL'") == '1'
assert sql("SELECT count(*) FROM profiles WHERE legacy_id IS NOT NULL") == '3'
check('backfill, legacy aliases, valid ID preservation, UUID relationships unchanged')
# Genuine auth-trigger signup, not direct profile insertion.
D, E = [f'00000000-0000-0000-0000-{i:012d}' for i in (4,5)]
sql(f"INSERT INTO auth.users(id,email) VALUES('{D}','d@example.test'),('{E}','e@example.test')")
assert sql(f"SELECT count(DISTINCT player_id) FROM profiles WHERE id IN ('{D}','{E}')") == '2'
sql(f"UPDATE profiles SET player_id='SU-ABCDEF' WHERE id='{A}'", A, ok=False)
sql(f"UPDATE profiles SET player_id=NULL WHERE id='{A}'", A, ok=False)
sql(f"UPDATE profiles SET player_id='SU-ABCDEF' WHERE id='{A}'", ok=False)
sql(f"UPDATE profiles SET player_id=NULL WHERE id='{A}'", ok=False)
sql(f"UPDATE profiles SET name='Updated A' WHERE id='{A}'", A)
assert sql(f"SELECT player_id FROM profiles WHERE id='{A}'") == code_a
check('auth-trigger signups, immutable public IDs, editable names')
# Force exactly one collision inside a rollback-only deterministic fixture.
sql("""BEGIN;
CREATE SEQUENCE public.player_collision_seq;
CREATE FUNCTION public.player_test_uuid() RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN IF nextval('public.player_collision_seq')=1 THEN RETURN '00000000-0000-0000-0000-000000000000'::uuid; ELSE RETURN '11111111-1111-1111-1111-111111111111'::uuid; END IF; END $$;
INSERT INTO player_id_aliases VALUES('SU-AAAAAA',(SELECT id FROM profiles LIMIT 1));
DO $$ BEGIN EXECUTE replace(pg_get_functiondef('public.generate_short_player_id()'::regprocedure),'gen_random_uuid()','public.player_test_uuid()'); END $$;
DO $$ BEGIN IF generate_short_player_id()='SU-AAAAAA' OR currval('public.player_collision_seq')<>2 THEN RAISE EXCEPTION 'Collision not retried'; END IF; END $$;
ROLLBACK;""")
def signup(i):
    return sql(f"WITH u AS (INSERT INTO auth.users(id,email) VALUES(gen_random_uuid(),'test{i}@example.test') RETURNING id) SELECT count(*) FROM u")
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: list(pool.map(signup, range(24)))
assert sql('SELECT count(*)=count(DISTINCT player_id) FROM profiles') == 't'
check('forced collision retry and concurrent authenticated signup allocation')
assert json.loads(sql(f"SELECT * FROM find_player('{code_b.lower()}')", A))['player_id'] == code_b
assert json.loads(sql("SELECT * FROM find_player('su-llllll')", A))['player_id'] == code_b
assert sql("SELECT count(*) FROM find_player('SU-ZZZZZZ')", A) == '0'
action(f"SELECT friend_action_by_code('{code_c.lower()}','request')", A)
assert sql(f"SELECT count(*) FROM friendships WHERE user_a='{A}' AND user_b='{C}'") == '1'
action(f"SELECT friend_action_by_code('{code_a}','request')", A, success=False)
action("SELECT friend_action_by_code('SU-ZZZZZZ','request')", A, success=False)
action(f"SELECT block_player_by_code('{code_c}',true)", A)
assert sql(f"SELECT count(*) FROM find_player('{code_c}')", A) == '0'
assert sql(f"SELECT count(*) FROM find_player('{code_a}')", C) == '0'
action(f"SELECT friend_action_by_code('{code_c}','request')", A, success=False)
check('case-insensitive exact lookup, unknown/self/blocked actions, bidirectional blocks')
public = json.loads(sql(f"SELECT * FROM find_player('{code_a}')", B))
assert set(public) == {'player_id','name','avatar_url','city','skill','preferred_sports','stats'}
assert public['stats'] == json.loads(sql('SELECT my_player_stats()', A))
sql(f"UPDATE profiles SET city='DELHI/NCR' WHERE id='{A}'", A)
assert json.loads(sql(f"SELECT * FROM find_player('{code_a}')", B))['city'] == 'Delhi NCR'
sql(f"UPDATE profiles SET city='Private lane 123' WHERE id='{A}'", A)
assert json.loads(sql(f"SELECT * FROM find_player('{code_a}')", B))['city'] is None
sql(f"UPDATE profiles SET city='Delhi NCR' WHERE id='{A}'", A)
assert sql('SELECT count(id) FROM profiles', B) == '1'
sql('SELECT email FROM profiles', B, ok=False)
sql('SELECT * FROM profiles', B, ok=False)
sql("SELECT * FROM friends_players_internal('search','Player')", A, ok=False)
sql('SELECT generate_short_player_id()', A, ok=False)
assert json.loads(sql(f"SELECT * FROM player_reviews('{code_a}')", B))['player_id'] == code_b
check('public stats match owner; private columns, raw helper/directory bypasses denied; review IDs')
invite = action(f"SELECT invite_player_by_code('{game}','{code_c}')", B)["invite_id"]
assert sql(f"SELECT to_user FROM game_invites WHERE id='{invite}'") == C
action(f"SELECT block_player_by_code('{code_b}',true)", C)
sql(f"SELECT respond_to_game_invite('{invite}','accept')", C, ok=False)
action(f"SELECT block_player_by_code('{code_b}',false)", C)
action(f"SELECT invite_player_by_code('{game}','{code_c}')", A, success=False)
sql(f"SELECT send_match_message('{game}','After migration',gen_random_uuid())", A)
assert sql("SELECT sender_id FROM messages WHERE body='After migration'") == A
sql(f"INSERT INTO messages(game_id,sender_id,body) VALUES('{game}','{B}','spoof')", A, ok=False)
assert sql(f"SELECT count(*) FROM related_player_profiles(ARRAY['{A}','{B}']::uuid[])", B) == '2'
assert sql(f"SELECT count(*) FROM related_player_profiles(ARRAY['{C}']::uuid[])", A) == '0'
assert sql('SELECT count(*) FROM games_with_counts', C) == '1'
assert sql(f"SELECT count(*) FROM match_player_profiles('{game}')", C) == '1'
action(f"SELECT kick_player_by_code('{game}','{code_a}')", B, success=False)
action(f"SELECT kick_player_by_code('{game}','{code_b}')", A)
assert sql(f"SELECT count(*) FROM match_player_profiles('{game}')", A) == '2'
action(f"SELECT block_player_by_code('{code_b}',true)", A)
assert sql("SELECT count(*) FROM messages WHERE body='Before migration'", A) == '0'
assert sql(f"SELECT count(*) FROM player_reviews('{code_a}')", A) == '0'
action(f"SELECT block_player_by_code('{code_b}',false)", A)
check('invite target resolution, server message identity, scoped batch lookup, host-only removal, blocked messages/reviews, discovery preserved')
# Freeze only the isolated test DB clock to avoid a minute-boundary race.
# Calls still use separate transactions so quota persistence is exercised.
sql("""CREATE TABLE public.lookup_test_clock(moment timestamptz);
INSERT INTO public.lookup_test_clock VALUES('2026-10-19 00:00:00+00');
CREATE FUNCTION public.lookup_test_now() RETURNS timestamptz LANGUAGE sql AS $$ SELECT moment FROM public.lookup_test_clock $$;
DO $$ BEGIN EXECUTE replace(pg_get_functiondef('public.consume_player_lookup()'::regprocedure),'clock_timestamp()', 'public.lookup_test_now()'); END $$;""")
sql('TRUNCATE player_lookup_limits')
for _ in range(60): assert sql("SELECT count(*) FROM find_player('SU-ZZZZZZ')", D) == '0'
sql("SELECT * FROM find_player('SU-ZZZZZZ')", D, ok=False)
assert sql(f"SELECT attempts FROM player_lookup_limits WHERE subject='{D}'") == '60'
for _ in range(60): sql("SELECT count(*) FROM find_player('SU-ZZZZZZ')", role='anon')
sql("SELECT * FROM find_player('SU-ZZZZZZ')", role='anon', ok=False)
sql('SELECT * FROM player_lookup_limits', A, ok=False)
sql('TRUNCATE player_lookup_limits')
for _ in range(60): action("SELECT friend_action_by_code('SU-ZZZZZZ','request')", D, success=False)
sql("SELECT friend_action_by_code('SU-ZZZZZZ','request')", D, ok=False)
assert sql(f"SELECT attempts FROM player_lookup_limits WHERE subject='{D}'") == '60'
sql("UPDATE lookup_test_clock SET moment=moment+interval '1 minute'")
assert sql("SELECT count(*) FROM find_player('SU-ZZZZZZ')", D) == '0'
assert sql(f"SELECT attempts FROM player_lookup_limits WHERE subject='{D}'") == '1'
sql("DO $$ BEGIN EXECUTE replace(pg_get_functiondef('public.consume_player_lookup()'::regprocedure),'public.lookup_test_now()', 'clock_timestamp()'); END $$;")
assert sql('SELECT count(*) FROM player_visibility_events', A) == '1'
sql('SELECT * FROM user_blocks', role='anon', ok=False)
check('durable authenticated and anonymous miss throttling; failed actions cannot roll back quota; viewer-owned invalidation events')
print('ALL PLAYER IDENTITY ACCEPTANCE CHECKS PASSED', flush=True)
