'use client';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { findPlayer } from '@/features/players/data/playersRepository';
import { changeFriendship, friendsError } from '../data/friendsRepository';
import { notifyNavigationChanged } from '@/lib/navigation-events';

export default function AddFriendById({ onAdded }: { onAdded: () => Promise<void> }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true);
    try {
      const player = await findPlayer(code);
      if (!player) { toast.error('Player not found or unavailable. Check the ID and try again.'); return; }
      await changeFriendship(player.player_id, 'request');
      toast.success(`Friend request sent to ${player.name}.`); setCode('');
      notifyNavigationChanged(); await onAdded();
    } catch (cause) { toast.error(friendsError(cause)); }
    finally { setBusy(false); }
  };
  return <form className="card fm" onSubmit={(event) => void submit(event)}>
    <label className="mono" htmlFor="add-friend-code">Add friend by ID</label>
    <input id="add-friend-code" className="srch" value={code} maxLength={100} autoComplete="off" spellCheck={false} placeholder="SU-7K3Q9X" onChange={(event) => setCode(event.target.value)} required />
    <button type="submit" className="btn hot" disabled={busy || !code.trim()}>{busy ? 'Sending…' : 'Send friend request'}</button>
  </form>;
}
