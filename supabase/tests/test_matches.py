"""Run against bootstrap.sql + migrations 015/016 in an isolated database only."""
import concurrent.futures
import subprocess
BASE = ['psql','-h','/tmp','-p','55439','-d','postgres','-X','-tA','-v','ON_ERROR_STOP=1']
A='00000000-0000-0000-0000-000000000001'
B='00000000-0000-0000-0000-000000000002'
C='00000000-0000-0000-0000-000000000003'
def sql(query, user=None, role='authenticated', ok=True):
    prefix = f"SET ROLE {role}; SET request.jwt.claim.sub='{user or ''}';" if user or role=='anon' else ''
    result=subprocess.run(BASE+['-c', prefix+query],capture_output=True,text=True)
    assert (result.returncode==0)==ok, result.stderr or result.stdout
    return result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ''
def check(name): print('PASS:',name,flush=True)
sql(f"INSERT INTO profiles VALUES ('{A}','A',null),('{B}','B',null),('{C}','C',null)")
gid=sql("SELECT create_game('football','Test court',now()+interval '1 day',2,'beginner')",A)
assert sql('SELECT count(*) FROM my_hosted_games',A)=='1'
assert sql(f"SELECT role FROM game_members WHERE game_id='{gid}'",A)=='host'
check('host creation and Hosting view')
with concurrent.futures.ThreadPoolExecutor() as pool:
    def join(user):
        result=subprocess.run(BASE+['-c', f"SET ROLE authenticated; SET request.jwt.claim.sub='{user}'; SELECT join_game('{gid}')"],capture_output=True,text=True)
        return user,result.returncode
    results=list(pool.map(join,[B,C]))
assert sorted(code==0 for _,code in results)==[False,True],results
winner=next(user for user,code in results if code==0)
loser=next(user for user,code in results if code!=0)
assert sql(f"SELECT count(*) FROM game_members WHERE game_id='{gid}'",A)=='2'
assert sql(f"SELECT status FROM games WHERE id='{gid}'",A)=='full'
assert sql('SELECT count(*) FROM my_joined_games',winner)=='1'
check('concurrent last spot: exactly one succeeds; counts and Joined view')
sql(f"INSERT INTO messages(game_id,sender_id,body) VALUES('{gid}','{A}','hello')",A)
assert sql('SELECT count(*) FROM messages',winner)=='1'
assert sql('SELECT count(*) FROM messages',loser)=='0'
sql(f"INSERT INTO messages(game_id,sender_id,body) VALUES('{gid}','{loser}','intrusion')",loser,ok=False)
sql(f"INSERT INTO messages(game_id,sender_id,body) VALUES('{gid}','{A}','spoof')",winner,ok=False)
sql(f"INSERT INTO messages(game_id,sender_id,body) VALUES('{gid}','{winner}',repeat('x',1001))",winner,ok=False)
check('member chat read/send, nonmember isolation, spoofing and length RLS')
sql(f"SELECT leave_game('{gid}')",A,ok=False)
sql(f"SELECT leave_game('{gid}')",winner)
assert sql(f"SELECT status FROM games WHERE id='{gid}'",A)=='open'
sql(f"SELECT join_game('{gid}')",winner)
sql(f"SELECT start_game('{gid}')",winner,ok=False)
sql(f"SELECT cancel_game('{gid}')",A)
assert sql(f"SELECT status FROM games WHERE id='{gid}'",winner)=='cancelled'
assert sql(f"SELECT count(*) FROM games WHERE id='{gid}'",loser)=='0'
sql(f"SELECT join_game('{gid}')",loser,ok=False)
check('leave reopens capacity; host-only cancellation; cancelled match hidden and join blocked')
sql(f"DELETE FROM game_members WHERE game_id='{gid}'",winner,ok=False)
sql(f"UPDATE games SET status='open' WHERE id='{gid}'",A,ok=False)
sql('SELECT * FROM games',role='anon',ok=False)
sql("SELECT create_game('football','X',now()+interval '1 day',2,'beginner')",role='anon',ok=False)
sql("SELECT create_game('football','X',now()-interval '1 day',2,'beginner')",A,ok=False)
sql("SELECT create_game('football','X',now()+interval '1 day',1,'beginner')",A,ok=False)
check('direct writes/anon rejected and server input validation')
g2=sql("SELECT create_game('tennis','Court 2',now()+interval '1 day',4,'pro')",A)
sql(f"SELECT start_game('{g2}')",A)
sql(f"SELECT finish_game('{g2}')",A)
assert sql(f"SELECT status FROM my_hosted_games WHERE id='{g2}'",A)=='done'
check('start/finish lifecycle and dashboard status')
assert sql("SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename IN ('games','game_members','messages')")=='3'
check('all three realtime publication entries')
