'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMockData } from '@/lib/mock-data';

export default function FriendsPage() {
  const { sessionUser, loading: authLoading } = useAuth();
  // TODO: connect backend — the friends list is local placeholder state.
  const { friends } = useMockData();
  const loading = authLoading;

  return (
    <main className="wrap" id="app">
      <h1 className="ph">Friends</h1>
      <div className="stack">
        {!sessionUser && !authLoading ? <section className="card emp"><h3>Sign in to connect</h3><p>Add players you meet in a match to your friends list.</p><Link className="btn hot" style={{ marginTop: 14 }} href="/login">Sign in</Link></section> : loading ? <section className="card emp"><p>Loading friends…</p></section> : <>
          <section className="card">
            <h3>Your network ({friends.length})</h3>
            {friends.length ? friends.map((friend) => <div className="mem" key={friend.id}>
              <i className="av">{friend.name?.[0]?.toUpperCase() || 'P'}</i>
              <div><Link href={`/profile/${friend.id}`}><b>{friend.name || 'Player'}</b></Link><br /><small>{friend.city || 'Nearby'}</small></div>
              {(friend.preferred_sports || []).slice(0, 3).map((sport) => <span className="tag" key={sport}>{sport.replace('_', ' ')}</span>)}
            </div>) : <div className="emp"><h3>Your network is empty</h3><p>When you add players you meet in a match, they appear here.</p><Link className="btn hot" style={{ marginTop: 14 }} href="/">Find a game</Link></div>}
          </section>
          <section className="card"><h3>Players you may know</h3><p>Meet players in a match, then open their profile to send a friend request.</p><Link className="btn gh" style={{ marginTop: 14 }} href="/">Find players</Link></section>
        </>}
      </div>
    </main>
  );
}
