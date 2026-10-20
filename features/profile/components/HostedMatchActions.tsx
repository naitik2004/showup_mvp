'use client';
import { FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Match } from '@/lib/matches';
import { deleteHostedMatch, updateHostedMatch } from '../data/hostedMatchesRepository';
import styles from '../profile.module.css';
import OpenMatchLink from './OpenMatchLink';
export default function HostedMatchActions({ match, onSaved }: { match: Match; onSaved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'edit' | 'delete'>('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function open(next: 'edit' | 'delete') { setMode(next); setError(''); dialog.current?.showModal(); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'edit') await updateHostedMatch(match.id, form);
      else await deleteHostedMatch(match.id);
      dialog.current?.close(); toast.success(mode === 'edit' ? 'Match updated.' : 'Match cancelled and removed from Hosting.');
      await onSaved();
    } catch (cause) { setError((cause as { message?: string }).message || 'Could not save the match. Try again.'); }
    finally { setBusy(false); }
  }
  const date = new Date(match.starts_at);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return <>
    <div className={styles.matchActions}>
      <OpenMatchLink id={match.id} />
      {['open', 'full'].includes(match.status) && <button className={`btn ${styles.openMatch}`} onClick={() => open('edit')}>
        <span className={styles.openMatchLabel}>Edit match</span>
        <span className={styles.shuffleBalls} aria-hidden="true"><i /><i /><i /></span>
      </button>}
      {['open', 'full', 'live'].includes(match.status) && <button className={`btn gh ${styles.openMatch}`} onClick={() => open('delete')}>
        <span className={styles.openMatchLabel}>Delete match</span>
        <span className={styles.shuffleBalls} aria-hidden="true"><i /><i /><i /></span>
      </button>}
    </div>
    <dialog ref={dialog} className={styles.matchDialog} aria-labelledby={`manage-${match.id}`} onCancel={event => { if (busy) event.preventDefault(); }}>
      <form onSubmit={submit} className={styles.matchForm}>
        <h2 id={`manage-${match.id}`}>{mode === 'edit' ? 'Edit hosted match' : 'Delete hosted match?'}</h2>
        {mode === 'edit' ? <>
          <label>Title<input name="title" defaultValue={match.title} maxLength={120} /></label>
          <label>Venue<input name="venue" defaultValue={match.venue} required maxLength={120} /></label>
          <label>Start time<input name="starts_at" type="datetime-local" defaultValue={localDate} required /></label>
          <label>Players<input name="max_players" type="number" min={Math.max(2, match.member_count)} max={22} defaultValue={match.max_players} required /></label>
          <label>Notes<textarea name="notes" defaultValue={match.notes} maxLength={1000} /></label>
        </> : <p>This cancels the match and removes it from your Hosting list. Players will see it as cancelled. Chat and match history are kept.</p>}
        {error && <p role="alert">{error}</p>}
        <div className={styles.matchActions}>
          <button type="button" className="btn gh" disabled={busy} onClick={() => dialog.current?.close()}>{mode === 'edit' ? 'Cancel' : 'Keep match'}</button>
          <button className="btn hot" disabled={busy}>{busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Delete match'}</button>
        </div>
      </form>
    </dialog>
  </>;
}
