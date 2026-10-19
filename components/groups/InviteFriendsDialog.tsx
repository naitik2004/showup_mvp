'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { notifyNavigationChanged } from '@/lib/navigation-events';
import { fetchPlayers } from '@/features/friends/data/friendsRepository';
import { findPlayer } from '@/features/players/data/playersRepository';

type FriendInvite = { id: string; player_id: string; name: string; invited: boolean };

export default function InviteFriendsDialog({ gameId, onCopyLink }: { gameId: string; onCopyLink: () => Promise<boolean> }) {
  const { sessionUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<FriendInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [code, setCode] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const loadFriends = async () => {
    if (!sessionUser) return;
    setLoading(true); setError('');
    try {
      const [network, members, invites] = await Promise.all([
        fetchPlayers('network'),
        supabase.from('game_members').select('user_id').eq('game_id', gameId),
        supabase.from('game_invites').select('to_user').eq('game_id', gameId).eq('from_user', sessionUser.id).eq('status', 'pending'),
      ]);
      if (members.error || invites.error) throw members.error || invites.error;
      const memberIds = new Set((members.data || []).map((member) => member.user_id));
      const invitedIds = new Set((invites.data || []).map((invite) => invite.to_user));
      setFriends(network.filter((profile) => !memberIds.has(profile.id)).map((profile) => ({
        id: profile.id, player_id: profile.player_id, name: profile.name || 'Player', invited: invitedIds.has(profile.id),
      })));
    } catch (cause) { setError((cause as Error).message); setFriends([]); }
    finally { setLoading(false); }
  };
  const show = () => { if (sessionUser) { setOpen(true); void loadFriends(); } };
  const send = async (playerCode: string, name: string) => {
    const { data, error: inviteError } = await supabase.rpc('invite_player_by_code', { p_game_id: gameId, p_player_code: playerCode });
    if (inviteError) throw inviteError;
    if (!data?.ok) throw new Error(data?.message || 'Could not send invite.');
    setFriends((current) => current.map((item) => item.player_id === playerCode ? { ...item, invited: true } : item));
    toast.success(`Invite sent to ${name}.`); notifyNavigationChanged();
  };
  const inviteFriend = async (friend: FriendInvite) => {
    if (busyId) return; setBusyId(friend.player_id);
    try { await send(friend.player_id, friend.name); }
    catch (cause) { toast.error((cause as Error).message); }
    finally { setBusyId(''); }
  };
  const inviteById = async (event: FormEvent) => {
    event.preventDefault(); if (busyId) return; setBusyId('lookup');
    try {
      const player = await findPlayer(code);
      if (!player) { toast.error('Player not found or unavailable. Check the ID and try again.'); return; }
      await send(player.player_id, player.name); setCode('');
    } catch (cause) { toast.error((cause as Error).message); }
    finally { setBusyId(''); }
  };
  const copyLink = async () => {
    setCopyingLink(true);
    try { await onCopyLink(); } finally { setCopyingLink(false); }
  };

  return <>
    <button className="btn gh" type="button" onClick={show}>Invite friends</button>
    <dialog ref={dialog} onClose={() => setOpen(false)}>
      <h3 style={{ marginBottom: 14 }}>Invite players</h3>
      <form className="fm" style={{ marginBottom: 18 }} onSubmit={(event) => void inviteById(event)}>
        <label className="mono" htmlFor="invite-player-code">Invite by player ID</label>
        <input className="srch" id="invite-player-code" placeholder="SU-7K3Q9X" value={code} onChange={(event) => setCode(event.target.value)} maxLength={100} autoComplete="off" spellCheck={false} required />
        <button className="btn hot" disabled={!!busyId || !code.trim()}>{busyId === 'lookup' ? 'Sending…' : 'Send invite'}</button>
      </form>
      <h3>From your friends</h3>
      {loading ? <p className="sy">Loading friends…</p> : error ? <div className="card emp" role="alert"><p>{error}</p><button className="btn sm gh" onClick={() => void loadFriends()}>Retry</button></div> : friends.length ? friends.map((friend) => <div className="mem" key={friend.id}><i className="av">{friend.name[0]?.toUpperCase() || 'P'}</i><div><b>{friend.name}</b><p className="mono">{friend.player_id}</p></div><button className={`btn sm ${friend.invited ? 'gh' : 'hot'}`} disabled={friend.invited || !!busyId} onClick={() => void inviteFriend(friend)}>{busyId === friend.player_id ? 'Sending…' : friend.invited ? 'Invited' : 'Invite'}</button></div>) : <p>No friends available. You can invite a player by ID above.</p>}
      <div className="acts" style={{ marginTop: 16 }}>
        <button className="btn gh" type="button" onClick={() => setOpen(false)}>Close</button>
        <button className="btn gh sm" type="button" disabled={copyingLink} onClick={() => void copyLink()}>{copyingLink ? 'Copying…' : 'Copy invite link'}</button>
      </div>
    </dialog>
  </>;
}
