'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { SPORTS } from '@/types';
import { useMockData } from '@/lib/mock-data';
import type { MockInvite } from '@/data/mock';

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
  const { sessionUser, user, loading: authLoading } = useAuth();
  const { invites, answerInvite } = useMockData();
  const [loading] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (!authLoading && !sessionUser) router.replace('/login');
  }, [authLoading, router, sessionUser]);
  const respond = (invite: MockInvite, action: 'accept' | 'decline') => {
    if (!sessionUser || !user) { router.push('/login'); return; }
    setBusyId(invite.id);
    // TODO: connect backend — invite responses are temporary local state.
    const result = answerInvite(invite.id, action, user);
    setBusyId('');
    if (result === null) { toast.error('This sample invite is unavailable.'); return; }
    if (action === 'decline') toast.success('Invite declined.');
    else if (result) { toast.success('You are in.'); router.push(`/groups/${result}`); }
  };

  if (authLoading || !sessionUser) return <main className="wrap" id="app"><section className="card emp">Loading invites…</section></main>;
  return (
    <main className="wrap" id="app">
      <h1 className="ph">Invites</h1>
      <div className="stack">
        {loading ? <section className="card emp">Loading invites…</section> : invites.length ? invites.map((invite) => {
          const game = invite.game;
          const sport = SPORTS.find((item) => item.id === game?.sport);
          const state = game?.status === 'in_progress' ? 'live' : game?.status === 'full' ? 'full' : game?.status === 'open' ? 'open' : game?.status || 'expired';
          const firstName = invite.sender?.name?.split(' ')[0] || 'A friend';
          return <section className="card" key={invite.id}>
            <span className="lb">{firstName} invited you</span>
            <h3 style={{ margin: '8px 0' }}>{sport?.emoji || '🏅'} {sport?.name || game?.sport || 'Match'} at {game?.location_name || 'Venue'}</h3>
            <p>{game ? `${when(game.scheduled_at)}, ${invite.member_count} of ${game.max_players} in` : 'Match details unavailable'} <span className={`pl ${state}`}>{state === 'live' ? 'Live now' : state === 'open' ? 'Open' : state === 'full' ? 'Full' : state}</span></p>
            <div className="acts" style={{ margin: '14px 0 0' }}>
              <button className="btn hot" disabled={!game || busyId === invite.id} onClick={() => respond(invite, 'accept')}>{busyId === invite.id ? 'Working…' : 'Accept and join'}</button>
              <button className="btn gh" disabled={busyId === invite.id} onClick={() => respond(invite, 'decline')}>Decline</button>
            </div>
          </section>;
        }) : <section className="card emp"><h3>All caught up</h3><p>When a friend invites you to a match it lands here.</p></section>}
      </div>
    </main>
  );
}
