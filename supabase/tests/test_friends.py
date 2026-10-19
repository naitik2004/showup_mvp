"""Against bootstrap.sql + friends_fixture.sql + migration 017, in isolation only."""
import concurrent.futures
import subprocess

BASE = ['psql', '-h', '/tmp', '-p', '55440', '-d', 'postgres', '-X', '-tA', '-v', 'ON_ERROR_STOP=1']
USERS = [f'00000000-0000-0000-0000-{i:012d}' for i in range(1, 8)]
A, B, C, D, E, F, G = USERS

def sql(query, user=None, role='authenticated', ok=True):
    prefix = f"SET ROLE {role}; SET request.jwt.claim.sub='{user or ''}';" if user or role == 'anon' else ''
    result = subprocess.run(BASE + ['-c', prefix + query], capture_output=True, text=True)
    assert (result.returncode == 0) == ok, result.stderr or result.stdout
    return result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ''

def action(user, peer, operation, ok=True):
    return sql(f"SELECT friend_action('{peer}','{operation}')", user, ok=ok)

def check(message):
    print('PASS:', message, flush=True)

sql('INSERT INTO profiles(id,name) VALUES ' + ','.join(f"('{u}','Player {i}')" for i, u in enumerate(USERS)))
assert sql('SELECT count(DISTINCT player_id) FROM profiles') == '7'
code = sql(f"SELECT player_id FROM profiles WHERE id='{B}'")
assert code.startswith('SU-') and len(code) == 35
sql(f"UPDATE profiles SET player_id='SU-FORGE' WHERE id='{A}'", A, ok=False)
assert sql(f"SELECT count(*) FROM friends_players('search','{code.lower()}')", A) == '1'
assert sql("SELECT count(*) FROM friends_players('search','player')", A) == '6'
assert sql("SELECT count(*) FROM friends_players('search','%')", A) == '0'
assert sql("SELECT count(*) FROM friends_players('search','_x')", A) == '0'
check('random unique IDs, immutability, exact ID and partial name search; literal wildcards')
action(A, B, 'request')
action(A, B, 'accept', ok=False)
action(C, B, 'accept', ok=False)
action(B, A, 'cancel', ok=False)
assert sql("SELECT relationship FROM friends_players('requests')", B) == 'incoming'
action(B, A, 'accept')
assert sql("SELECT count(*) FROM friends_players('network')", A) == '1'
assert sql("SELECT count(*) FROM friends_players('network')", B) == '1'
assert sql('SELECT count(*) FROM friendships', C) == '0'
sql(f"INSERT INTO friendships(user_a,user_b,status) VALUES('{A}','{C}','accepted')", C, ok=False)
check('recipient-only acceptance, sender-only cancellation, both networks, graph isolation, direct writes denied')
action(B, C, 'request'); action(C, B, 'accept')
sql(f"INSERT INTO games VALUES('10000000-0000-0000-0000-000000000001','done',now()-interval '1 day'),('10000000-0000-0000-0000-000000000002','open',now()+interval '1 day')")
sql(f"INSERT INTO game_members VALUES('10000000-0000-0000-0000-000000000001','{A}'),('10000000-0000-0000-0000-000000000001','{D}'),('10000000-0000-0000-0000-000000000002','{A}'),('10000000-0000-0000-0000-000000000002','{E}')")
assert sql("SELECT string_agg(name,',' ORDER BY name) FROM friends_players('suggestions')", A) == 'Player 2,Player 3'
assert sql(f"SELECT mutual_count FROM friends_players('suggestions') WHERE id='{C}'", A) == '1'
assert sql(f"SELECT shared_matches FROM friends_players('suggestions') WHERE id='{D}'", A) == '1'
action(A, D, 'request')
assert sql("SELECT count(*) FROM friends_players('suggestions')", A) == '1'
sql(f"INSERT INTO user_blocks VALUES('{C}','{A}')")
assert sql("SELECT count(*) FROM friends_players('suggestions')", A) == '0'
assert sql(f"SELECT count(*) FROM friends_players('search','Player 2')", A) == '0'
action(A, C, 'request', ok=False)
check('completed matches and mutual friends only; pending/current friends and blocked players excluded')
action(D, A, 'decline'); action(A, D, 'request'); action(A, D, 'cancel')
action(A, B, 'remove')
assert sql("SELECT count(*) FROM friends_players('network')", A) == '0'
action(A, A, 'request', ok=False)
sql("SELECT * FROM friends_players('search','Player')", role='anon', ok=False)
sql(f"SELECT friend_action('{B}','request')", role='anon', ok=False)
sql("SELECT * FROM friends_players('search','Player')", '00000000-0000-0000-0000-000000000000', role='authenticated')
check('decline/re-request/cancel/remove lifecycle, self-request and anonymous access rejected')
def concurrent_request(pair):
    user, peer = pair
    result = subprocess.run(BASE + ['-c', f"SET ROLE authenticated; SET request.jwt.claim.sub='{user}'; SELECT friend_action('{peer}','request')"], capture_output=True, text=True)
    return result.returncode == 0
with concurrent.futures.ThreadPoolExecutor() as pool:
    results = list(pool.map(concurrent_request, [(F, G), (G, F)]))
assert sorted(results) == [False, True]
assert sql(f"SELECT count(*) FROM friendships WHERE user_a IN ('{F}','{G}')") == '1'
check('simultaneous crossed requests produce one relationship only')
