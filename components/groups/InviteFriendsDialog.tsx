'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMockData } from '@/lib/mock-data';

type FriendInvite = { id: string; name: string; invited: boolean };

export default function InviteFriendsDialog({ gameId }: { gameId: string }) {
  const { sessionUser } = useAuth();
  const { friends, members, sendInvite, isInvited } = useMockData();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const currentFriends = friends
    .filter((friend) => !(members[gameId] || []).some((member) => member.user_id === friend.id))
    .map((friend) => ({ id: friend.id, name: friend.name, invited: isInvited(gameId, friend.id) }));
  const show = () => { if (!sessionUser) return; setOpen(true); };
  const send = (friend: FriendInvite) => {
    if (!sessionUser) return;
    setBusyId(friend.id);
    // TODO: connect backend — invites are temporary local state.
    sendInvite(gameId, friend.id);
    setBusyId('');
  };

  return <>
    <button className="btn gh" type="button" onClick={show}>Invite friends</button>
    <dialog ref={dialog} onClose={() => setOpen(false)}>
      <h3 style={{ marginBottom: 14 }}>Invite friends</h3>
      {currentFriends.length ? currentFriends.map((friend) => <div className="mem" key={friend.id}><i className="av">{friend.name?.[0]?.toUpperCase() || 'P'}</i><div><b>{friend.name || 'Player'}</b></div><button className={`btn sm ${friend.invited ? 'gh' : 'hot'}`} disabled={friend.invited || busyId === friend.id} onClick={() => send(friend)}>{busyId === friend.id ? 'Sending…' : friend.invited ? 'Invited' : 'Invite'}</button></div>) : <p>All your friends are already in this match.</p>}
      <button className="btn gh" style={{ marginTop: 16 }} onClick={() => setOpen(false)}>Close</button>
    </dialog>
  </>;
}
