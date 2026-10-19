"""Run after test_friends.py, before migration 018, in the isolated test DB only."""
import concurrent.futures
import re
import subprocess
from pathlib import Path
BASE = ['psql','-h','/tmp','-p','55440','-d','postgres','-X','-tA','-v','ON_ERROR_STOP=1']
def sql(query, user=None, ok=True):
    prefix = f"SET ROLE authenticated; SET request.jwt.claim.sub='{user}';" if user else ''
    result = subprocess.run(BASE+['-c',prefix+query],capture_output=True,text=True)
    assert (result.returncode == 0) == ok, result.stderr
    return result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ''
A='00000000-0000-0000-0000-000000000001'
B='00000000-0000-0000-0000-000000000002'
old=sql(f"SELECT player_id FROM profiles WHERE id='{B}'")
if sql("SELECT to_regclass('public.player_id_aliases') IS NOT NULL")=='t':
    old=sql(f"SELECT player_id FROM player_id_aliases WHERE profile_id='{B}'")
if not sql("SELECT to_regclass('public.player_id_aliases') IS NOT NULL")== 't':
    subprocess.run(BASE+['-f','supabase/migrations/018_short_player_ids.sql'],check=True,capture_output=True,text=True)
code=sql(f"SELECT player_id FROM profiles WHERE id='{B}'")
assert re.fullmatch(r'SU-[A-HJ-NP-Z2-9]{6}',code)
assert sql(f"SELECT count(*) FROM friends_players('search','{code.lower()}')",A)=='1'
assert sql(f"SELECT count(*) FROM friends_players('search','{old.lower()}')",A)=='1'
assert sql('SELECT count(*)=count(DISTINCT player_id) FROM profiles')=='t'
assert sql(f"SELECT count(*) FROM friends_players('search','{code.replace('-','')}')",A)=='1'
sql('SELECT * FROM player_id_aliases',A,ok=False)
sql('SELECT generate_short_player_id()',A,ok=False)
sql(f"UPDATE profiles SET player_id='SU-ABCDEF' WHERE id='{B}'",B,ok=False)
print('PASS: short format, exact lookup, legacy alias lookup, protected allocation, immutable IDs',flush=True)
# Force a repeatable first-candidate collision by replacing randomness only
# inside this rollback-only local test. The installed allocator stays unchanged.
sql("""BEGIN;
CREATE SEQUENCE public.short_id_test_sequence;
CREATE FUNCTION public.short_id_test_uuid() RETURNS uuid LANGUAGE plpgsql AS $$ BEGIN IF nextval('public.short_id_test_sequence')=1 THEN RETURN '00000000-0000-0000-0000-000000000000'::uuid; ELSE RETURN '11111111-1111-1111-1111-111111111111'::uuid; END IF; END $$;
INSERT INTO player_id_aliases VALUES('SU-AAAAAA',(SELECT id FROM profiles LIMIT 1));
DO $$ BEGIN EXECUTE replace(pg_get_functiondef('public.generate_short_player_id()'::regprocedure),'gen_random_uuid()', 'public.short_id_test_uuid()'); END $$;
DO $$ DECLARE code text; BEGIN code:=generate_short_player_id(); IF code='SU-AAAAAA' OR currval('public.short_id_test_sequence')<>2 THEN RAISE EXCEPTION 'Collision was not retried'; END IF; END $$;
ROLLBACK;""")
print('PASS: a forced random-code collision is retried',flush=True)
# Exercise new-profile trigger at useful volume without any hosted test users.
sql("INSERT INTO profiles(id,name) SELECT gen_random_uuid(),'Local stress player' FROM generate_series(1,2000)")
assert sql("SELECT count(*)=count(DISTINCT player_id) AND bool_and(player_id ~ '^SU-[A-HJ-NP-Z2-9]{6}$') FROM profiles")=='t'
print('PASS: 2,000 generated profile IDs are short and unique',flush=True)
def insert_profile(i):
    return sql(f"WITH inserted AS (INSERT INTO profiles(id,name) VALUES(gen_random_uuid(),'Concurrent local {i}') RETURNING player_id) SELECT player_id FROM inserted")
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    codes=list(pool.map(insert_profile,range(32)))
assert len(set(codes))==32
print('PASS: concurrent signup allocation remains unique',flush=True)
