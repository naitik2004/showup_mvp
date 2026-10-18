'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMockData } from '@/lib/mock-data';
import { GameGroup, SkillLevel, Sport, SPORTS } from '@/types';
import { toast } from 'sonner';

export default function CreateGroupFlow() {
  const router = useRouter();
  const { sessionUser, user } = useAuth();
  const { addGame } = useMockData();
  const [sport, setSport] = useState<Sport>('football');
  const [venue, setVenue] = useState('');
  const [day, setDay] = useState('0');
  const [time, setTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [skill, setSkill] = useState<SkillLevel>('beginner');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPermanent, setIsPermanent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUser?.id || !user) { router.push('/login'); return; }
    if (!venue.trim()) { toast.error('Please provide a venue name'); return; }
    if (maxPlayers < 2 || maxPlayers > 22) { toast.error('Capacity must be between 2 and 22 players'); return; }

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + Number(day));
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);
    if (scheduledAt.getTime() <= Date.now()) { toast.error('Scheduled time must be in the future'); return; }
    setSubmitting(true);
    try {
      // TODO: connect backend — hosted games reset when this tab is refreshed.
      const group: GameGroup = {
        id: `local-game-${Date.now()}`,
        host_id: sessionUser.id,
        sport,
        location: { lat: 28.6139, lng: 77.209 },
        location_name: venue.trim(),
        max_players: maxPlayers,
        skill_level: skill,
        scheduled_at: scheduledAt.toISOString(),
        expires_at: isPermanent ? null : new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        is_permanent: isPermanent,
        status: 'open',
        created_at: new Date().toISOString(),
        host: user,
        host_name: user.name,
        member_count: 1,
      };
      addGame(group, user);
      toast.success('Game group created successfully!');
      router.push(`/groups/${group.id}`);
    } catch (error: any) {
      toast.error(error?.message || 'An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="wrap" id="app">
      <h1 className="ph">Host a game</h1>
      {!sessionUser ? <div className="card emp"><h3>Sign in to host</h3><p>Sign in to post a match and invite players.</p><Link className="btn hot" style={{ marginTop: 14 }} href="/login">Sign in</Link></div> : (
        <form className="fm" onSubmit={submit}>
          <div className="fl"><label htmlFor="sport">SPORT</label><select id="sport" value={sport} onChange={(event) => setSport(event.target.value as Sport)}>{SPORTS.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.name}</option>)}</select></div>
          <div className="fl"><label htmlFor="venue">VENUE</label><input id="venue" name="venue" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="e.g. Sector 14 Park, Turf Ground" maxLength={120} /></div>
          <div className="r2"><div className="fl"><label htmlFor="day">DATE</label><select id="day" value={day} onChange={(event) => setDay(event.target.value)}><option value="0">Today</option><option value="1">Tomorrow</option><option value="2">In 2 days</option></select></div><div className="fl"><label htmlFor="time">START TIME</label><input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div></div>
          <div className="r2"><div className="fl"><label htmlFor="skill">SKILL LEVEL</label><select id="skill" value={skill} onChange={(event) => setSkill(event.target.value as SkillLevel)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="pro">Advanced</option></select></div><div className="fl"><label htmlFor="max">MAX PLAYERS</label><input id="max" type="number" min={2} max={22} value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} /></div></div>
          <div className="fl"><label>TYPE</label><div className="chips"><label className="chip"><input type="radio" name="type" checked={!isPermanent} onChange={() => setIsPermanent(false)} />One-off match</label><label className="chip"><input type="radio" name="type" checked={isPermanent} onChange={() => setIsPermanent(true)} />Permanent group</label></div></div>
          <div className="fl"><label htmlFor="note">NOTE (OPTIONAL)</label><input id="note" name="note" readOnly placeholder="Bring your own racket" title="Match notes are not saved by the current backend" /></div>
          <button className="btn hot" style={{ justifySelf: 'start' }} disabled={submitting}>{submitting ? 'Publishing…' : 'Publish match'}</button>
        </form>
      )}
    </main>
  );
}
