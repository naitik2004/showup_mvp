'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { SPORTS } from '@/types';

type Invite = {
  id: string;
  game_id: string;
  created_at: string;
  member_count: number;
  game: { sport: string; location_name: string; scheduled_at: string; max_players: number; status: string } | null;
  sender: { name?: string } | null;
};

const when = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const day = date.toDateString() === today.toDateString() ? 'Today' : date.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

export default function InvitesPage() {
  const router = useRouter();
  const { sessionUser, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadInvites = useCallback(async () => {
    if (!sessionUser) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/invites');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invites could not be loaded.');
      setInvites(result.invites || []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Invites could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [sessionUser?.id]);

  useEffect(() => {
    if (!authLoading && !sessionUser) router.replace('/login');
  }, [authLoading, router, sessionUser]);
  useEffect(() => { if (sessionUser) void loadInvites(); }, [sessionUser, loadInvites]);

  const respond = async (invite: Invite, action: 'accept' | 'decline') => {
    if (!sessionUser) { router.push('/login'); return; }
    setBusyId(invite.id);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, inviteId: invite.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The invite response failed.');
      if (action === 'decline') {
        setInvites((previous) => previous.filter((item) => item.id !== invite.id));
        toast.success('Invite declined.');
      } else {
        toast.success('You are in.');
        router.push(`/groups/${result.game_id || invite.game_id}`);
      }
    } catch (responseError: any) {
      toast.error(responseError?.message || 'The invite response failed.');
      if (responseError?.message?.startsWith('Too late.')) void loadInvites();
    } finally {
      setBusyId('');
    }
  };

  if (authLoading || !sessionUser) return <main className="wrap" id="app"><section className="card emp">Loading invites…</section></main>;
  return (
    <main className="wrap" id="app">
      <h1 className="ph">Invites</h1>
      <div className="stack">
        {loading ? <section className="card emp">Loading invites…</section> : error ? <section className="card emp" role="alert"><h3>Invites couldn&apos;t load</h3><p>{error}</p><button className="btn hot" style={{ marginTop: 14 }} onClick={() => void loadInvites()}>Retry</button></section> : invites.length ? invites.map((invite) => {
          const game = invite.game;
          const sport = SPORTS.find((item) => item.id === game?.sport);
          const state = game?.status === 'in_progress' ? 'live' : game?.status === 'full' ? 'full' : game?.status === 'open' ? 'open' : game?.status || 'expired';
          const firstName = invite.sender?.name?.split(' ')[0] || 'A friend';
          return <section className="card" key={invite.id}>
            <span className="lb">{firstName} invited you</span>
            <h3 style={{ margin: '8px 0' }}>{sport?.emoji || '🏅'} {sport?.name || game?.sport || 'Match'} at {game?.location_name || 'Venue'}</h3>
            <p>{game ? `${when(game.scheduled_at)}, ${invite.member_count} of ${game.max_players} in` : 'Match details unavailable'} <span className={`pl ${state}`}>{state === 'live' ? 'Live now' : state === 'open' ? 'Open' : state === 'full' ? 'Full' : state}</span></p>
            <div className="acts" style={{ margin: '14px 0 0' }}>
              <button className="btn hot" disabled={!game || busyId === invite.id} onClick={() => void respond(invite, 'accept')}>{busyId === invite.id ? 'Working…' : 'Accept and join'}</button>
              <button className="btn gh" disabled={busyId === invite.id} onClick={() => void respond(invite, 'decline')}>Decline</button>
            </div>
          </section>;
        }) : <section className="card emp"><h3>All caught up</h3><p>When a friend invites you to a match it lands here.</p></section>}
      </div>
    </main>
  );
}
