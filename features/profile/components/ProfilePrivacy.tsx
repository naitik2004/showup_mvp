'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { blockedPlayers, changePlayerBlock, playerError } from '@/features/players/data/playersRepository';

export default function ProfilePrivacy() {
  const [players, setPlayers] = useState<{name: string; player_id: string}[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try { setPlayers(await blockedPlayers()); }
    catch (cause) { toast.error(playerError(cause)); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const update = async (playerCode: string, block: boolean) => {
    setBusy(true);
    try {
      await changePlayerBlock(playerCode, block);
      toast.success(block ? 'Player blocked.' : 'Player unblocked.'); setCode('');
      window.dispatchEvent(new Event('showup:profiles-changed')); await refresh();
    } catch (cause) { toast.error(playerError(cause)); }
    finally { setBusy(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!busy) void update(code, true); };
  return <section className="card"><h3>Blocked players</h3>
    <form className="acts" onSubmit={submit}><label className="mono" htmlFor="block-code">Player ID</label><input id="block-code" className="srch" value={code} onChange={(event) => setCode(event.target.value)} placeholder="SU-7K3Q9X" maxLength={100} required /><button className="btn sm gh" disabled={busy || !code.trim()}>Block player</button></form>
    {players.length ? players.map((player) => <div className="mem" key={player.player_id}><div><b>{player.name}</b><p className="mono">{player.player_id}</p></div><button className="btn sm gh" disabled={busy} onClick={() => void update(player.player_id, false)}>Unblock</button></div>) : <p>No blocked players.</p>}
  </section>;
}
