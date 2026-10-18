'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

type Friend = { id: string; name: string; city?: string | null; preferred_sports?: string[] | null; };

export default function FriendsPage() {
  const { sessionUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFriends = useCallback(async () => {
    if (!sessionUser?.id) { setFriends([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    const { data: relationships, error: relationshipError } = await supabase
      .from('friendships').select('user_a,user_b').or(`user_a.eq.${sessionUser.id},user_b.eq.${sessionUser.id}`).eq('status', 'accepted');
    if (relationshipError) { setError(relationshipError.message); setLoading(false); return; }
    const ids = (relationships || []).map((item) => item.user_a === sessionUser.id ? item.user_b : item.user_a);
    if (!ids.length) { setFriends([]); setLoading(false); return; }
    const { data, error: profileError } = await supabase.from('users').select('id,name,city,preferred_sports').in('id', ids);
    if (profileError) setError(profileError.message);
    else setFriends((data || []) as Friend[]);
    setLoading(false);
  }, [sessionUser?.id, supabase]);

  useEffect(() => { void loadFriends(); }, [loadFriends]);

  return (
    <main className="wrap" id="app">
      <h1 className="ph">Friends</h1>
      <div className="stack">
        {!sessionUser && !authLoading ? <section className="card emp"><h3>Sign in to connect</h3><p>Add players you meet in a match to your friends list.</p><Link className="btn hot" style={{ marginTop: 14 }} href="/login">Sign in</Link></section> : loading || authLoading ? <section className="card emp"><p>Loading friends…</p></section> : error ? <section className="card emp" role="alert"><h3>Friends couldn&apos;t load</h3><p>{error}</p><button className="btn hot" style={{ marginTop: 14 }} onClick={() => void loadFriends()}>Retry</button></section> : <>
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
