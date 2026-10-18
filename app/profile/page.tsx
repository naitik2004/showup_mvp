'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SPORTS } from '@/types';

export default function ProfileHomePage() {
  const { sessionUser, firebaseUser, user, loading: authLoading, signOut } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({ hosted: 0, joined: 0, friends: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionUser?.id) return;
    let active = true;
    const loadStats = async () => {
      const [hosted, joined, friends] = await Promise.all([
        supabase.from('game_groups').select('id', { count: 'exact', head: true }).eq('host_id', sessionUser.id),
        supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', sessionUser.id).eq('status', 'accepted'),
        supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`user_a.eq.${sessionUser.id},user_b.eq.${sessionUser.id}`).eq('status', 'accepted'),
      ]);
      if (!active) return;
      const err = hosted.error || joined.error || friends.error;
      if (err) setError(err.message);
      setStats({ hosted: hosted.count || 0, joined: joined.count || 0, friends: friends.count || 0 });
    };
    void loadStats();
    return () => { active = false; };
  }, [sessionUser?.id, supabase]);

  if (authLoading) return <main className="wrap" id="app"><section className="card emp">Loading profile…</section></main>;
  if (!sessionUser) return <main className="wrap" id="app"><h1 className="ph">Your profile</h1><section className="card emp"><h3>Sign in to see your profile</h3><p>Your games, friends, and favourite sports will appear here.</p><Link className="btn hot" style={{ marginTop: 14 }} href="/login">Sign in</Link></section></main>;

  const name = user?.name || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Player';
  const sports = user?.preferred_sports || [];
  return (
    <main className="wrap" id="app">
      <h1 className="ph">Your profile</h1>
      <div className="stack">
        <div className="card id"><i className="av">{name[0]?.toUpperCase() || 'P'}</i><div><h2>{name}</h2><span className="mono">{user?.city || 'India'}{user?.created_at ? `, member since ${new Date(user.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}` : ''}</span></div><Link className="btn sm gh" style={{ marginLeft: 'auto' }} href="/profile/edit">Edit profile</Link></div>
        <div className="tiles"><div><b>{stats.joined}</b><span>Games joined</span></div><div><b>{stats.hosted}</b><span>Games hosted</span></div><div><b>{stats.friends}</b><span>Friends</span></div><div><b>{sports.length}</b><span>Favourite sports</span></div></div>
        {error && <p className="er" role="alert">Profile statistics couldn&apos;t load: {error}</p>}
        <section className="card"><h3>Skill level</h3><p>{user?.onboarded ? 'Self-described. ShowUp does not verify ability.' : 'Complete your profile to add a skill level.'}</p><Link className="btn sm gh" style={{ marginTop: 12 }} href="/profile/edit">Update profile</Link></section>
        <section className="card"><h3>Favourite sports</h3>{sports.length ? <div className="chips">{sports.map((id) => { const item = SPORTS.find((sport) => sport.id === id); return <span className="chip" key={id}>{item?.emoji || '🏅'} {item?.name || id}</span>; })}</div> : <p>No sports selected yet.</p>}</section>
        <section className="card"><h3>Blocked players</h3><p>Block controls are not available in the existing app.</p></section>
        <div className="acts"><Link className="btn gh" href="/profile/friends">Friends</Link><Link className="btn gh" href="/groups/create">Host a game</Link><button className="btn gh" onClick={() => void signOut()}>Sign out</button></div>
      </div>
    </main>
  );
}
