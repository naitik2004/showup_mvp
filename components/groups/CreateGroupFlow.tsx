'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMap } from '@/lib/hooks/useMap';
import { createClient } from '@/lib/supabase/client';
import { SkillLevel, Sport, SPORTS } from '@/types';
import { toast } from 'sonner';

export default function CreateGroupFlow() {
  const router = useRouter();
  const { sessionUser, user } = useAuth();
  const { coords } = useMap();
  const supabase = createClient();
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
      const { data: group, error } = await supabase.rpc('create_game', {
        p_is_permanent: isPermanent, p_sport: sport, p_venue: venue.trim(), p_max_players: maxPlayers,
        p_skill_level: skill, p_starts_at: scheduledAt.toISOString(),
        p_lat: coords.lat, p_lng: coords.lng,
        p_notes: String(new FormData(event.currentTarget).get('note') || ''),
      });
      if (error) throw error;
      if (!group) throw new Error('Could not create this match.');
      toast.success('Game group created successfully!');
      router.push(`/groups/${group}`);
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
        <form className="card fm" onSubmit={submit}>
          <div className="fl"><label>SPORT</label><div className="chips">{SPORTS.map(item => <label className="chip" key={item.id}><input type="radio" name="sport" value={item.id} checked={sport === item.id} onChange={() => setSport(item.id)} />{item.emoji} {item.name}</label>)}</div></div>
          <div className="fl"><label htmlFor="venue">VENUE</label><input id="venue" name="venue" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="e.g. Sector 14 Park, Turf Ground" maxLength={120} /></div>
          <div className="r2"><div className="fl"><label htmlFor="day">DAY</label><select id="day" value={day} onChange={(event) => setDay(event.target.value)}><option value="0">Today</option><option value="1">Tomorrow</option><option value="2">In 2 days</option></select></div><div className="fl"><label htmlFor="time">START TIME</label><input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div></div>
          <div className="r2"><div className="fl"><label htmlFor="skill">SKILL LEVEL</label><select id="skill" value={skill} onChange={(event) => setSkill(event.target.value as SkillLevel)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="pro">Advanced</option></select></div><div className="fl"><label htmlFor="max">MAX PLAYERS</label><input id="max" type="number" min={2} max={22} value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} /></div></div>
          <div className="fl"><label>TYPE</label><div className="chips"><label className="chip"><input type="radio" name="type" checked={!isPermanent} onChange={() => setIsPermanent(false)} />One-off match</label><label className="chip"><input type="radio" name="type" checked={isPermanent} onChange={() => setIsPermanent(true)} />Permanent group</label></div></div>
          <div className="fl"><label htmlFor="note">NOTE (OPTIONAL)</label><input id="note" name="note" maxLength={80} placeholder="Bring your own racket" /></div>
          <button className="btn hot" style={{ justifySelf: 'start' }} disabled={submitting}>{submitting ? 'Publishing…' : 'Publish match'}</button>
        </form>
      )}
    </main>
  );
}
