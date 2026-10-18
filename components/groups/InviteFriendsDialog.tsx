'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

type FriendInvite = { id: string; name: string; invited: boolean };

export default function InviteFriendsDialog({ gameId }: { gameId: string }) {
  const { firebaseUser } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<FriendInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const loadFriends = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError('');
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/invites?gameId=${encodeURIComponent(gameId)}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Friends could not be loaded.');
      setFriends(result.friends || []);
    } catch (cause: any) {
      setError(cause?.message || 'Friends could not be loaded.');
    } finally { setLoading(false); }
  };

  const show = () => { setOpen(true); void loadFriends(); };
  const send = async (friend: FriendInvite) => {
    if (!firebaseUser) return;
    setBusyId(friend.id);
    setError('');
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', gameId, friendId: friend.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invite could not be sent.');
      setFriends((previous) => previous.map((item) => item.id === friend.id ? { ...item, invited: true } : item));
    } catch (cause: any) {
      setError(cause?.message || 'Invite could not be sent.');
    } finally { setBusyId(''); }
  };

  return <>
    <button className="btn gh" type="button" onClick={show}>Invite friends</button>
    <dialog ref={dialog} onClose={() => setOpen(false)}>
      <h3 style={{ marginBottom: 14 }}>Invite friends</h3>
      {loading ? <p className="sy">Loading friends…</p> : error ? <div className="card emp" role="alert"><p>{error}</p><button className="btn sm gh" style={{ marginTop: 12 }} onClick={() => void loadFriends()}>Retry</button></div> : friends.length ? friends.map((friend) => <div className="mem" key={friend.id}><i className="av">{friend.name?.[0]?.toUpperCase() || 'P'}</i><div><b>{friend.name || 'Player'}</b></div><button className={`btn sm ${friend.invited ? 'gh' : 'hot'}`} disabled={friend.invited || busyId === friend.id} onClick={() => void send(friend)}>{busyId === friend.id ? 'Sending…' : friend.invited ? 'Invited' : 'Invite'}</button></div>) : <p>All your friends are already in this match.</p>}
      <button className="btn gh" style={{ marginTop: 16 }} onClick={() => setOpen(false)}>Close</button>
    </dialog>
  </>;
}
