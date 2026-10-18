'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMockData } from '@/lib/mock-data';

type FriendInvite = { id: string; name: string; invited: boolean };

export default function InviteFriendsDialog({ gameId, onCopyLink }: { gameId: string; onCopyLink: () => Promise<boolean> }) {
  const { sessionUser } = useAuth();
  const { friends, members, sendInvite, isInvited } = useMockData();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);

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
  const send = async (friend: FriendInvite) => {
    if (!sessionUser) return;
    setBusyId(friend.id);
    // TODO: connect backend — friend invitations stay in temporary local state.
    sendInvite(gameId, friend.id);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>Invite friends</h3>
        <button className="btn gh sm" type="button" disabled={copyingLink} onClick={() => void copyLink()}>
          {copyingLink ? 'Copying…' : 'Copy invite link'}
        </button>
      </div>
      {currentFriends.length ? currentFriends.map((friend) => <div className="mem" key={friend.id}><i className="av">{friend.name?.[0]?.toUpperCase() || 'P'}</i><div><b>{friend.name || 'Player'}</b></div><button className={`btn sm ${friend.invited ? 'gh' : 'hot'}`} disabled={friend.invited || busyId === friend.id} onClick={() => send(friend)}>{busyId === friend.id ? 'Sending…' : friend.invited ? 'Invited' : 'Invite'}</button></div>) : <p>All your friends are already in this match.</p>}
      <button className="btn gh" style={{ marginTop: 16 }} onClick={() => setOpen(false)}>Close</button>
    </dialog>
  </>;
}
