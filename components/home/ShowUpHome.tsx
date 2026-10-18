'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GameGroup, SPORTS, Sport } from '@/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGroups } from '@/lib/hooks/useGroups';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const sportEmoji = (sport: Sport) => SPORTS.find((item) => item.id === sport)?.emoji || '🏃';
const sportName = (sport: Sport) => SPORTS.find((item) => item.id === sport)?.name || sport.replace('_', ' ');
const countIn = (group: GameGroup) => group.member_count || 0;
const statusFor = (group: GameGroup) => group.status === 'in_progress' ? 'live' : group.status === 'expired' ? 'done' : group.status;
const center = { lat: 28.6139, lng: 77.209 };
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const countdown = (value: string, now: number) => {
  const minutes = Math.round((new Date(value).getTime() - now) / 60000);
  return minutes <= 0 ? 'Now' : minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const formatWhen = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = sameDay(date, today) ? 'Today' : sameDay(date, tomorrow) ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};
const greeting = () => {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
};

function GameMap({ groups, center }: { groups: GameGroup[]; center: { lat: number; lng: number } }) {
  const positions = groups.map((group, index) => {
    const dx = (group.location.lng - center.lng) * Math.cos((center.lat * Math.PI) / 180);
    const dy = group.location.lat - center.lat;
    const x = Math.max(5, Math.min(95, 50 + dx * 111320 / 50000 * 45));
    const y = Math.max(5, Math.min(57, 31 - dy * 111132 / 50000 * 27));
    return { group, x: x + (index % 2) * 1.5, y };
  });

  return (
    <svg className="map" viewBox="0 0 100 62" role="img" aria-label="Map of nearby games">
      <g fill="none" stroke="#f3efe4" strokeOpacity=".16" strokeWidth=".4">
        <rect x="3" y="3" width="94" height="56" rx="2" />
        <path d="M50 3v56" /><circle cx="50" cy="31" r="9" />
        <rect x="3" y="19" width="14" height="24" /><rect x="83" y="19" width="14" height="24" />
      </g>
      <path d="M0 52C25 44 40 58 62 46S90 30 100 34M30 0C36 20 22 36 34 62" fill="none" stroke="#f3efe4" strokeOpacity=".28" strokeWidth="1.4" strokeDasharray="3 2" />
      <circle className="you" cx="50" cy="31" r="3" fill="#d9532b" /><circle cx="50" cy="31" r="1.5" fill="#fff" />
      <text x="50" y="38" fontSize="2.6" fill="#f3efe4" textAnchor="middle" fontFamily="DM Mono">you</text>
      {positions.map(({ group, x, y }) => {
        const status = statusFor(group);
        const pinColor = status === 'full' ? '#d9532b' : status === 'live' ? '#fff' : '#d8f03c';
        return (
          <Link key={group.id} className="pin" href={`/groups/${group.id}`} aria-label={`${sportName(group.sport)} at ${group.location_name}`}>
            <title>{`${sportName(group.sport)} at ${group.location_name}, ${Math.max(0, group.max_players - countIn(group))} spots left`}</title>
            <circle cx={x} cy={y} r="3.6" fill={pinColor} stroke="#15130f" strokeWidth=".5" />
            <text x={x} y={y + 1.3} fontSize="3.6" textAnchor="middle">{sportEmoji(group.sport)}</text>
            <text x={x + 3.4} y={y - 3} fontSize="2.6" fill="#f3efe4" fontFamily="DM Mono">{countIn(group)}/{group.max_players}</text>
          </Link>
        );
      })}
    </svg>
  );
}

function GameCard({ group }: { group: GameGroup }) {
  const status = statusFor(group);
  return (
    <Link className="gc" href={`/groups/${group.id}`}>
      <span className="em">{sportEmoji(group.sport)}</span>
      <div>
        <b>{sportName(group.sport)} at {group.location_name || 'Selected Map Point'}</b>
        <small>{formatWhen(group.scheduled_at)}, {group.skill_level}, hosted by {group.host_name || group.host?.name || 'Player'}</small>
      </div>
      <div className="r">
        <span className={`pl ${status}`}>{status === 'live' ? 'Live now' : status === 'full' ? 'Full' : 'Open'}</span>
        <span className="sd" title={`${countIn(group)} of ${group.max_players} players`}>
          {Array.from({ length: Math.min(group.max_players, 12) }, (_, index) => <i key={index} className={index < countIn(group) ? 'on' : ''} />)}
        </span>
      </div>
    </Link>
  );
}

function BentoCard({ color, label, value, title, detail, foot, icon, href }: { color: string; label: string; value: string; title: string; detail: string; foot: string; icon: string; href: string }) {
  return (
    <Link className={`bk hc ${color}`} href={href}>
      <div className="tp"><span>{label}</span><span>{value}</span></div>
      <div><h3>{title}</h3><p className="ser">{detail}</p></div>
      <div className="bt"><span className="mono">{foot}</span><i className="rb">{icon}</i></div>
    </Link>
  );
}

export default function ShowUpHome() {
  const router = useRouter();
  const { sessionUser, user, loading: authLoading } = useAuth();
  const { groups, myIds, loading: gamesLoading, error: gamesError } = useGroups();
  const invites: never[] = [];
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all');
  const [search, setSearch] = useState('');
  const [clock, setClock] = useState('--:--');
  const inviteCount = sessionUser ? invites.length : 0;
  const myNextMatch = sessionUser ? groups.find((group) => myIds.includes(group.id) && ['open','full','live'].includes(group.status) && new Date(group.scheduled_at).getTime() > Date.now()) || null : null;
  const [now, setNow] = useState(() => Date.now());
  const stats = { joined: myIds.length, hosted: groups.filter(g => g.host_id === sessionUser?.id).length, friends: 0 };
  const displayStats = sessionUser ? stats : { joined: 0, hosted: 0, friends: 0 };
  const isGuestPreview = !authLoading && !sessionUser;
  const streakRef = useRef<HTMLDivElement>(null);
  const ballPlaceholderRef = useRef<HTMLSpanElement>(null);
  const floatingBallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    updateClock();
    const timer = window.setInterval(updateClock, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const element = streakRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('in');
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [streakRef]);

  useEffect(() => {
    const ball = floatingBallRef.current;
    const placeholder = ballPlaceholderRef.current;
    if (!ball || !placeholder) return;
    let bouncing = false;
    let token = 0;
    let down = false;
    const position = (atBottom: boolean) => {
      const size = Number(ball.dataset.size || 0);
      const mobile = window.innerWidth < 760;
      if (!atBottom) {
        const rect = placeholder.getBoundingClientRect();
        ball.dataset.x = String(rect.left);
        ball.dataset.y = String(rect.top + window.scrollY);
      }
      ball.style.left = `${atBottom ? window.innerWidth - size - (mobile ? 16 : 26) : Number(ball.dataset.x)}px`;
      ball.style.transform = `translateY(${atBottom ? window.innerHeight - size - (mobile ? 90 : 16) : Number(ball.dataset.y)}px)`;
      const svg = ball.querySelector('svg');
      if (svg) (svg as SVGElement).style.rotate = atBottom ? '900deg' : '0deg';
    };
    const bounce = async (current: number) => {
      const inner = ball.querySelector('i');
      for (const height of [140, 80, 44, 22, 10]) {
        if (current !== token || !inner) return;
        await inner.animate([
          { transform: 'scale(1.22,.78)', easing: 'cubic-bezier(.2,.6,.4,1)' },
          { transform: `translateY(${-height}px)`, offset: 0.5, easing: 'cubic-bezier(.6,0,.9,.5)' },
          { transform: 'scale(1.22,.78)' },
        ], { duration: 320 + height * 4 }).finished.catch(() => undefined);
      }
    };
    const update = () => {
      const scrolled = window.scrollY > 12;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const atBottom = maxScroll > 40 && window.scrollY >= maxScroll - 8;
      if (scrolled !== down) { down = scrolled; position(down); }
      if (atBottom && !bouncing) { bouncing = true; void bounce(++token); }
      else if (!atBottom && bouncing) { bouncing = false; token++; }
    };
    const initialize = (show = true) => {
      const rect = placeholder.getBoundingClientRect();
      ball.dataset.x = String(rect.left);
      ball.dataset.y = String(rect.top + window.scrollY);
      ball.dataset.size = String(rect.width);
      ball.style.width = `${rect.width}px`;
      ball.style.height = `${rect.width}px`;
      down = false;
      position(false);
      if (show) ball.style.visibility = 'visible';
      update();
    };
    let initialized = false;
    const finishInitialization = () => {
      if (initialized) return;
      initialized = true;
      initialize(true);
    };
    initialize(false);
    const fallbackTimer = window.setTimeout(finishInitialization, 700);
    void document.fonts.ready.then(() => window.setTimeout(finishInitialization, 700));
    window.addEventListener('scroll', update, { passive: true });
    const onResize = () => initialize(true);
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      token++;
    };
  }, [ballPlaceholderRef, floatingBallRef]);

  const sourceGroups = groups;

  const visibleGroups = useMemo(() => sourceGroups.filter((group) => {
    const matchesSport = selectedSport === 'all' || group.sport === selectedSport;
    const query = search.trim().toLowerCase();
    const text = `${sportName(group.sport)} ${group.location_name} ${group.skill_level} ${group.status} ${group.host_name || group.host?.name || ''}`.toLowerCase();
    return !['done','cancelled'].includes(group.status) && matchesSport && (!query || text.includes(query));
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()), [sourceGroups, selectedSport, search]);

  const doJoin = async (group: GameGroup) => {
    if (!sessionUser?.id) { router.push('/login'); return; }
    if (statusFor(group) !== 'open') { toast.error(`This match is ${statusFor(group)} and cannot be joined.`); return; }
    if (!user) { toast.error('Your profile is still loading. Try again.'); return; }
    const { error } = await createClient().rpc('join_game', { p_game_id: group.id });
    if (error) { toast.error(error.message); return; }
    toast.success(`You’re in. ${sportName(group.sport)} at ${group.location_name}.`);
    router.push(`/groups/${group.id}`);
  };

  const openGroups = sourceGroups.filter((group) => statusFor(group) === 'open');
  const nextHref = !sessionUser ? '/login' : visibleGroups[0] ? `/groups/${visibleGroups[0].id}` : '/groups/create';
  const nextName = visibleGroups[0] ? `${sportName(visibleGroups[0].sport)} at ${visibleGroups[0].location_name}` : 'Your next match';

  return (
    <>
    <main className="wrap" id="app">
      <section className="hi">
        <div>
          <span className="lb">{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1 aria-label={`${greeting()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}>
            <span className="good-word"><span>G</span><svg className="word-ball" aria-hidden="true"><use href="#showup-basketball" /></svg><span className="bl" ref={ballPlaceholderRef} aria-hidden="true"><svg><use href="#showup-ball" /></svg></span><span>D</span></span>
            <br /><span>{greeting().replace(/^Good\s+/, '')}</span>{user?.name ? <>,<br />{user.name.split(' ')[0]}</> : null}
          </h1>
        </div>
        <div>
          <div className="ser sub">{openGroups.length} games still have room near you. {sessionUser && inviteCount ? `${inviteCount} friends want you in.` : 'Pick one and show up.'}</div>
          {sessionUser && <div className="kp"><div><b>{stats.joined}</b><span>Your matches</span></div><div><b>{inviteCount}</b><span>Invites</span></div><div><b>{stats.friends}</b><span>Friends</span></div></div>}
        </div>
      </section>

      <section className="sec" style={{ marginTop: 50 }}>
        <div className="sh"><h2>Live <span className="ser">board</span></h2><p>Your area&apos;s games, flipping in as spots fill. Tap Join to take a seat.</p></div>
        <div className="board" id="board" role="region" aria-label="Live games board">
          <div className="bh"><span><b>Games near you</b></span><span>{clock}</span></div>
          {gamesLoading ? <div className="sy">Loading nearby games…</div> : gamesError ? <div className="sy" role="alert">Nearby games couldn&apos;t load.</div> : visibleGroups.length ? <>{isGuestPreview && <div className="sy preview-note">Sample games · sign in to join a match</div>}{visibleGroups.slice(0, 6).map((group) => {
            const status = statusFor(group);
            return <div className={`rw ${status === 'full' ? 'x' : ''}`} key={group.id}>
              <span className={`g ${status === 'open' ? 'o' : status === 'live' ? 'l' : 'x'}`}>{sportName(group.sport).toUpperCase()}</span>
              <span className="g sp">{group.location_name?.toUpperCase() || 'VENUE TBD'}</span>
              <span className="g pn">{formatTime(group.scheduled_at)}</span>
              <span className="g sc">{status === 'open' ? `${group.max_players - countIn(group)} LEFT` : 'FULL'}</span>
              <span className={`g st ${status === 'open' ? 'o' : status === 'live' ? 'l' : 'x'}`}>{status === 'live' ? 'LIVE' : status === 'full' ? 'FULL' : 'OPEN'}</span>
              <button className="jb" onClick={() => void doJoin(group)} disabled={status !== 'open'}>{status === 'open' ? 'JOIN →' : status === 'live' ? 'LIVE' : 'FULL'}</button>
            </div>;
          })}</> : !gamesError && <div className="sy">No games near you yet.</div>}
        </div>
      </section>

      <section className="sec">
        <div className="sh"><h2>Show up. <span className="ser">Stay in.</span></h2><p>Your streak, the games you host and the crew you build, all in one place.</p></div>
        <div className="bn">
          <div className="bk sx" ref={streakRef}>
            <div className="tp"><span>Show-up streak</span><span>12 weeks, sample</span></div>
            <div className="gr" aria-hidden="true">{Array.from({ length: 84 }, (_, index) => {
              let seed = 7;
              for (let step = 0; step <= index; step++) seed = seed * 16807 % 2147483647;
              const value = seed / 2147483647;
              return <i key={index} className={value < 0.42 ? '' : value < 0.78 ? 'p' : 'm'} style={{ '--n': index } as React.CSSProperties} />;
            })}</div>
            <div className="sn"><div><b>{String(displayStats.joined).padStart(2, '0')}</b><span>Joined</span></div><div><b>{String(displayStats.hosted).padStart(2, '0')}</b><span>Hosted</span></div><div><b>{String(displayStats.friends).padStart(2, '0')}</b><span>Friends</span></div><div><b>{sessionUser ? '—' : '96%'}</b><span>{sessionUser ? 'Rating' : 'Showed up'}</span></div></div>
          </div>
          <BentoCard color="c1" label="Organize" value="1 minute" title="Host a game" detail="Pick a sport, a place, a time. Players find you." foot={`${stats.hosted} games hosted`} icon="+" href={sessionUser ? '/groups/create' : '/login'} />
          <BentoCard color="c2" label="Discover" value="1 tap" title="Find a match" detail="Open seats near you. The last seat goes to exactly one player." foot={`${openGroups.length} open near you`} icon="→" href={nextHref} />
        </div>
        <div className="bn2">
          <BentoCard color="c3" label="Connect" value="Members only" title="Talk it out" detail="Every match gets its own group chat." foot="Online status" icon="→" href={nextHref} />
          <BentoCard color="c4" label="Community" value="After each game" title="Earn your rep" detail="Rate who you played with. Ratings stay on their profile." foot="Player profiles" icon="→" href={!sessionUser ? '/login' : visibleGroups[0] ? `/profile/${visibleGroups[0].host_id}` : '/profile'} />
        </div>
      </section>

      {myNextMatch && <section className="sec"><div className="pass"><div className="pm"><span className="lb" style={{ color: '#f3efe4aa' }}>Your next match <span className="pl open">Open</span></span><h2>{sportEmoji(myNextMatch.sport)} {sportName(myNextMatch.sport)}</h2><p>{myNextMatch.location_name}, {formatWhen(myNextMatch.scheduled_at)}</p></div><div className="ps"><div><span className="mono">starts in</span><br /><b>{countdown(myNextMatch.scheduled_at, now)}</b></div><Link className="btn hot" href={`/groups/${myNextMatch.id}`}>Open match</Link></div></div></section>}

      <section className="sec">
        <div className="sh"><h2>On the <span className="ser">map</span></h2><p>Pins show who is in. Lime means open, clay means full, white means live.</p></div>
        <div className="tools">
          {(['all', 'badminton', 'football', 'basketball', 'cricket', 'tennis'] as const).map((sport) => <button key={sport} className={`chip ${selectedSport === sport ? 'on' : ''}`} onClick={() => setSelectedSport(sport)}>{sport === 'all' ? 'All sports' : `${sportEmoji(sport)} ${sportName(sport)}`}</button>)}
          <label className="srch"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sport, place, skill" aria-label="Search games" /></label>
        </div>
        <div className="hm">
          <div className="card mapc">{!gamesLoading && !gamesError && <GameMap groups={visibleGroups} center={center} />}{gamesLoading && <div className="emp">Loading map…</div>}{gamesError && <div className="emp" role="alert">Games couldn&apos;t load.</div>}</div>
          <div className="lst">{gamesLoading ? <div className="card emp"><p>Loading nearby games…</p></div> : gamesError ? <div className="card emp" role="alert"><h3>Games couldn&apos;t load</h3><p>{gamesError}</p></div> : visibleGroups.length ? <>{isGuestPreview && <p className="mono preview-note">Sample preview games</p>}{visibleGroups.map((group) => <GameCard key={group.id} group={group} />)}</> : <div className="card emp"><h3>No games near you yet</h3><p>No open games match that search. Try another sport, or host the first one.</p><Link className="btn hot" style={{ marginTop: 14 }} href={sessionUser ? '/groups/create' : '/login'}>Host a game</Link></div>}</div>
        </div>
      </section>

      <section className="sec"><div className="sh"><h2>Everything <span className="ser">inside</span></h2><p>ShowUp is one place to find a game, fill it, talk about it, and remember who was great to play with.</p></div><div className="fx"><Link href="/"><h3>Discover</h3><p>Every game near you on a live board and a map. Filter by sport, skill or place.</p><i>→</i></Link><Link href={sessionUser ? '/groups/create' : '/login'}><h3>Host</h3><p>Post a match in a minute: sport, venue, time, skill level and how many players.</p><i>→</i></Link><Link href={nextHref}><h3>Join</h3><p>One tap takes a spot. Capacity is enforced, so the last seat goes to exactly one player.</p><i>→</i></Link><Link href={nextHref}><h3>Chat</h3><p>A private group chat for every match. Members only, with online and typing status.</p><i>→</i></Link><Link href="/profile/friends"><h3>Friends</h3><p>Add players you meet, accept requests, and invite friends straight into a game.</p><i>→</i></Link><Link href="/profile"><h3>Reviews</h3><p>Rate players after a finished match. Ratings and comments build a reputation you can see.</p><i>→</i></Link><Link href="/profile"><h3>Safety</h3><p>Block anyone, report problems, and let hosts decide who stays in their match.</p><i>→</i></Link><Link href="/profile"><h3>Profile</h3><p>Skill level, favourite sports, games played and hosted, all in one place.</p><i>→</i></Link></div></section>
      <section className="sec"><div className="band"><div><span className="lb" style={{ color: '#f3efe4aa' }}>Built for trust</span><h2>Play with people you can <span className="ser">rely on</span></h2></div><ul><li><b>Members-only chat</b>Only players in a match can read or write in its chat.</li><li><b>Block and report</b>Blocked players vanish from your chat, requests and invites.</li><li><b>Reviews after every game</b>Stars and notes from the people who actually played with them.</li><li><b>Hosts stay in charge</b>Start, end or cancel a match and remove players who do not fit.</li></ul></div></section>
      <section className="sec"><div className="cta"><h2>{sessionUser ? 'Your next game is one tap away' : 'Find your next game tonight'}</h2><div className="acts">{sessionUser ? <><Link className="btn" href="/groups/create">Host a game</Link><Link className="btn gh" href="/profile/friends">Invite friends</Link></> : <Link className="btn" href="/login">Create free account</Link>}</div></div></section>
      <footer className="ft"><span className="mono">© 2026 ShowUp. Find players. Join matches. Build your sports network.</span><span><Link href="/">Games</Link><Link href="/profile/friends">Friends</Link><Link href="/profile">Profile</Link></span></footer>
    </main>
    <div id="fb" ref={floatingBallRef} aria-hidden="true"><i><svg><use href="#showup-ball" /></svg></i></div>
    </>
  );
}
