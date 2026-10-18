'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SPORTS } from '@/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

type InviteRow = {
  id: string;
  game_id: string;
  from_user: string;
  created_at: string;
};

type InviteCard = InviteRow & {
  game: { sport: string; venue: string; starts_at: string; skill_level: string; status: string } | null;
  sender: { name: string; city: string } | null;
};

export default function InvitesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { sessionUser, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<InviteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadInvites = useCallback(async () => {
    if (!sessionUser) return;
    setLoading(true);
    setError('');
    const { data: rows, error: inviteError } = await supabase
      .from('game_invites')
      .select('id, game_id, from_user, created_at')
      .eq('to_user', sessionUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (inviteError) {
      setError(inviteError.message);
      setInvites([]);
      setLoading(false);
      return;
    }
    const pending = (rows || []) as InviteRow[];
    const gameIds = Array.from(new Set(pending.map((invite) => invite.game_id)));
    const senderIds = Array.from(new Set(pending.map((invite) => invite.from_user)));
    const [{ data: games, error: gamesError }, { data: senders, error: sendersError }] = await Promise.all([
      gameIds.length ? supabase.from('games').select('id,sport,venue,starts_at,skill_level,status').in('id', gameIds) : Promise.resolve({ data: [], error: null }),
      senderIds.length ? supabase.from('profiles').select('id,name,city').in('id', senderIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (gamesError || sendersError) {
      setError((gamesError || sendersError)?.message || 'Could not load invitations.');
      setInvites([]);
    } else {
      const gamesById = new Map((games || []).map((game) => [game.id, game]));
      const sendersById = new Map((senders || []).map((sender) => [sender.id, sender]));
      setInvites(pending.map((invite) => ({
        ...invite,
        game: gamesById.get(invite.game_id) || null,
        sender: sendersById.get(invite.from_user) || null,
      })));
    }
    setLoading(false);
  }, [sessionUser, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!sessionUser) {
      router.replace(`/login?next=${encodeURIComponent('/invites')}`);
      return;
    }
    void loadInvites();
  }, [authLoading, loadInvites, router, sessionUser]);

  const respond = async (inviteId: string, action: 'accept' | 'decline') => {
    setBusyId(inviteId);
    const { data, error: responseError } = await supabase.rpc('respond_to_game_invite', {
      p_invite_id: inviteId,
      p_action: action,
    });
    setBusyId('');
    if (responseError) {
      toast.error(responseError.message);
      return;
    }
    setInvites((current) => current.filter((invite) => invite.id !== inviteId));
    if (action === 'accept') {
      const gameId = (data as { game_id?: string } | null)?.game_id;
      toast.success('Invite accepted.');
      if (gameId) router.push(`/groups/${gameId}`);
    } else {
      toast.success('Invite declined.');
    }
  };

  if (authLoading || loading) return <main className="wrap" id="app"><section className="card emp"><p>Loading invitations…</p></section></main>;

  return <main className="wrap" id="app">
    <section className="card" style={{ marginTop: 24 }}>
      <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)' }}>Invites</h1>
      <p className="sy">Match invitations sent to you.</p>
      {error ? <div className="card emp" role="alert" style={{ marginTop: 18 }}><p>{error}</p><button className="btn gh" style={{ marginTop: 12 }} onClick={() => void loadInvites()}>Retry</button></div>
        : invites.length ? <div style={{ marginTop: 18 }}>
          {invites.map((invite) => {
            const sport = SPORTS.find((item) => item.id === invite.game?.sport);
            return <article className="mem" key={invite.id} style={{ gap: 16 }}>
              <i className="av">{(invite.sender?.name || 'P').charAt(0).toUpperCase()}</i>
              <div>
                <b>{invite.sender?.name || 'A player'} invited you to {sport?.name || 'a match'}</b>
                <br /><small>{invite.game?.venue || invite.sender?.city || 'ShowUp'} · {invite.game ? new Date(invite.game.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Match details unavailable'}</small>
              </div>
              <div className="acts" style={{ margin: 0, marginLeft: 'auto' }}>
                <button className="btn hot" disabled={busyId === invite.id || !invite.game || invite.game.status !== 'open'} onClick={() => void respond(invite.id, 'accept')}>{busyId === invite.id ? 'Working…' : 'Accept'}</button>
                <button className="btn gh" disabled={busyId === invite.id} onClick={() => void respond(invite.id, 'decline')}>Decline</button>
              </div>
            </article>;
          })}
        </div> : <section className="card emp" style={{ marginTop: 18 }}><h3>No match invites yet</h3><p>When someone invites you to a match, it will appear here.</p><Link className="btn gh" href="/" style={{ marginTop: 14 }}>Browse matches</Link></section>}
    </section>
  </main>;
}
