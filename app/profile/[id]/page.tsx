'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { SPORTS } from '@/types';
import { toast } from 'sonner';

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessionUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<'none' | 'pending' | 'accept' | 'friends'>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const { data, error: profileError } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (!active) return;
      if (profileError) setError(profileError.message);
      setProfile(data);
      if (sessionUser?.id) {
        const { data: friendship } = await supabase.from('friendships').select('*').or(`and(user_a.eq.${sessionUser.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${sessionUser.id})`).maybeSingle();
        if (active && friendship) setFriendshipId(friendship.id);
        if (active && friendship?.status === 'accepted') setStatus('friends');
        else if (active && friendship?.status === 'pending') setStatus(friendship.user_a === sessionUser.id ? 'pending' : 'accept');
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [id, sessionUser?.id, supabase]);

  const addFriend = async () => {
    if (!sessionUser?.id) { router.push('/login'); return; }
    if (status === 'accept' && friendshipId) {
      const { error: acceptError } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      if (acceptError) { toast.error(acceptError.message); return; }
      setStatus('friends');
      toast.success('Friend request accepted.');
      return;
    }
    const { error: requestError } = await supabase.from('friendships').insert({ user_a: sessionUser.id, user_b: id, status: 'pending' });
    if (requestError) { toast.error(requestError.message); return; }
    setStatus('pending');
    toast.success('Friend request sent.');
  };

  if (loading) return <main className="wrap" id="app"><section className="card emp">Loading profile…</section></main>;
  if (error) return <main className="wrap" id="app"><section className="card emp" role="alert"><h3>Profile couldn&apos;t load</h3><p>{error}</p><button className="btn gh" style={{ marginTop: 14 }} onClick={() => location.reload()}>Retry</button></section></main>;
  if (!profile) return <main className="wrap" id="app"><section className="card emp"><h3>Player not found</h3><Link className="btn gh" style={{ marginTop: 14 }} href="/">Back to games</Link></section></main>;

  const name = profile.name || 'Player';
  const sports = profile.preferred_sports || profile.sports || [];
  return (
    <main className="wrap" id="app">
      <Link className="lb" href="/">← Games</Link>
      <section className="card id" style={{ margin: '14px 0 18px', flexWrap: 'wrap' }}>
        <i className="av">{name[0]?.toUpperCase() || 'P'}</i>
        <div style={{ flex: 1 }}><h2>{name}</h2><span className="mono">{profile.city || 'Nearby'}, {profile.skill_level || 'Player'}</span><br /><span className="mono">No reviews yet</span></div>
        {sessionUser?.id !== id && <div className="acts" style={{ margin: 0 }}>{status === 'friends' ? <span className="tag">Friends</span> : <button className="btn sm gh" onClick={() => void addFriend()} disabled={status === 'pending'}>{status === 'pending' ? 'Requested' : status === 'accept' ? 'Accept request' : 'Add friend'}</button>}<button className="btn sm gh" disabled>Block</button><button className="btn sm bad" disabled>Report</button></div>}
      </section>
      <div className="tiles"><div><b>{profile.games_joined ?? 0}</b><span>Games joined</span></div><div><b>{profile.games_hosted ?? 0}</b><span>Games hosted</span></div><div><b>—</b><span>Rating</span></div><div><b>{sports.length}</b><span>Favourite sports</span></div></div>
      <section className="card"><h3>Plays</h3><div className="chips">{sports.length ? sports.map((sport: string) => { const item = SPORTS.find((entry) => entry.id === sport); return <span className="chip" key={sport}>{item?.emoji || '🏅'} {item?.name || sport.replace('_', ' ')}</span>; }) : <p>No sports picked yet.</p>}</div></section>
      <section className="card" style={{ marginTop: 18 }}><h3>Reviews</h3><p>Reviews appear after a finished match.</p></section>
    </main>
  );
}
