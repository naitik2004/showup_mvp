'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGroups } from '@/lib/hooks/useGroups';
import { toast } from 'sonner';
import { SPORTS } from '@/types';
export default function ProfilePage() {
 const { sessionUser, user, signOut } = useAuth();
 const { matches, myIds, loading, error, refetch } = useGroups();
 const [tab, setTab] = useState('Hosting');
 const mine = matches.filter(g => myIds.includes(g.id));
 const hosted = mine.filter(g => g.host_id === sessionUser?.id);
 const joined = mine.filter(g => g.host_id !== sessionUser?.id);
 const upcoming = mine.filter(g => ['open','full','live'].includes(g.status) && new Date(g.starts_at).getTime() > Date.now());
 const past = mine.filter(g => g.status === 'done');
 const shown = tab === 'Past' ? past : (tab === 'Hosting' ? hosted : joined).filter(g => g.status !== 'done');
 return <main className="wrap" id="app"><h1 className="ph">Your profile</h1><div className="stack">
 <section className="card id"><i className="av">{(user?.name || 'P').charAt(0).toUpperCase()}</i><div><h2>{user?.name || 'Your profile'}</h2><span className="mono">{user?.city || 'ShowUp'}{user?.created_at ? `, member since ${new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` : ''}</span></div></section>
 <div className="tiles">{[['Matches played',past.length],['Hosted',hosted.length],['Joined',joined.length],['Upcoming',upcoming.length]].map(([label,value]) => <div key={label}><b>{loading ? '…' : error ? '—' : value}</b><span>{label}</span></div>)}</div>
 <div className="chips" role="tablist">{['Hosting','Joined','Past'].map(label => <button role="tab" aria-selected={tab===label} className={`chip ${tab===label?'on':''}`} key={label} onClick={() => setTab(label)}>{label}</button>)}</div>
 {loading ? <section className="card emp">Loading matches…</section> : error ? <section className="card emp"><p>{error}</p><button className="btn" onClick={() => void refetch()}>Try again</button></section> : shown.length ? <section className="lst">{shown.map(game => <Link href={`/groups/${game.id}`} key={game.id} className="card"><span className={`pl ${game.status}`}>{game.status}</span><h3>{SPORTS.find(s => s.id===game.sport)?.emoji} {game.title || SPORTS.find(s => s.id===game.sport)?.name}</h3><p>{game.venue}</p><p>{new Date(game.starts_at).toLocaleString()}</p><span className="mono">{game.member_count} of {game.max_players} players</span></Link>)}</section> : <section className="card emp"><h3>{tab==='Hosting' ? "You haven't hosted a match yet" : tab==='Joined' ? "You haven't joined a match yet" : 'No completed matches yet'}</h3><Link className="btn hot" href={tab==='Hosting'?'/new':'/'}>{tab==='Hosting'?'Host a game':'Find a match'}</Link></section>}
 <section className="card"><h3>Favourite sports</h3><div className="chips">{user?.preferred_sports?.length ? SPORTS.filter(sport => user.preferred_sports.includes(sport.id)).map(sport => <span className="chip on" key={sport.id}>{sport.emoji} {sport.name}</span>) : <p className="sy">No favourite sports selected yet.</p>}</div></section>
 <div className="acts"><button className="btn gh" onClick={() => { void signOut().catch(error => toast.error(error.message || 'Could not sign out.')); }}>Sign out</button></div>
 </div></main>;
}
