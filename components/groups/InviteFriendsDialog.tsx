'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { notifyNavigationChanged } from '@/lib/navigation-events';

type FriendInvite = { id: string; name: string; invited: boolean };

export default function InviteFriendsDialog({ gameId, onCopyLink }: { gameId: string; onCopyLink: () => Promise<boolean> }) {
  const { sessionUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<FriendInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const loadFriends = async () => {
    if (!sessionUser) return;
    setLoading(true);
    setError('');
    const [{ data: profiles, error: profilesError }, { data: members, error: membersError }, { data: invites, error: invitesError }] = await Promise.all([
      supabase.from('profiles').select('id,name').neq('id', sessionUser.id).order('name').limit(100),
      supabase.from('game_members').select('user_id').eq('game_id', gameId),
      supabase.from('game_invites').select('to_user').eq('game_id', gameId).eq('from_user', sessionUser.id).eq('status', 'pending'),
    ]);
    const queryError = profilesError || membersError || invitesError;
    if (queryError) {
      setError(queryError.message);
      setFriends([]);
    } else {
      const memberIds = new Set((members || []).map((member) => member.user_id));
      const invitedIds = new Set((invites || []).map((invite) => invite.to_user));
      setFriends((profiles || []).filter((profile) => !memberIds.has(profile.id)).map((profile) => ({
        id: profile.id,
        name: profile.name || 'Player',
        invited: invitedIds.has(profile.id),
      })));
    }
    setLoading(false);
  };
  const show = () => { if (!sessionUser) return; setOpen(true); void loadFriends(); };
  const send = async (friend: FriendInvite) => {
    if (!sessionUser) return;
    setBusyId(friend.id);
    const { error: inviteError } = await supabase.rpc('send_game_invite', {
      p_game_id: gameId,
      p_recipient_id: friend.id,
    });
    if (inviteError) toast.error(inviteError.message);
    else {
      setFriends((current) => current.map((item) => item.id === friend.id ? { ...item, invited: true } : item));
      toast.success(`Invite sent to ${friend.name}.`);
      notifyNavigationChanged();
    }
    setBusyId('');
  };

  const copyLink = async () => {
    setCopyingLink(true);
    await onCopyLink();
    setCopyingLink(false);
  };

  return <>
    <button className="btn gh" type="button" onClick={show}>Invite friends</button>
    <dialog ref={dialog} onClose={() => setOpen(false)}>
      <h3 style={{ marginBottom: 14 }}>Invite friends</h3>
      {loading ? <p className="sy">Loading friends…</p> : error ? <div className="card emp" role="alert"><p>{error}</p><button className="btn sm gh" style={{ marginTop: 12 }} onClick={() => void loadFriends()}>Retry</button></div> : friends.length ? friends.map((friend) => <div className="mem" key={friend.id}><i className="av">{friend.name?.[0]?.toUpperCase() || 'P'}</i><div><b>{friend.name || 'Player'}</b></div><button className={`btn sm ${friend.invited ? 'gh' : 'hot'}`} disabled={friend.invited || busyId === friend.id} onClick={() => void send(friend)}>{busyId === friend.id ? 'Sending…' : friend.invited ? 'Invited' : 'Invite'}</button></div>) : <p>No other players are available to invite yet.</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button className="btn gh" type="button" onClick={() => setOpen(false)}>Close</button>
        <button className="btn gh sm" type="button" disabled={copyingLink} onClick={() => void copyLink()}>
          {copyingLink ? 'Copying…' : 'Copy invite link'}
        </button>
      </div>
    </dialog>
  </>;
}
