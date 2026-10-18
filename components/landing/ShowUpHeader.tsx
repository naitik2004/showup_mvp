'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function ShowUpHeader() {
  const pathname = usePathname();
  const { sessionUser, firebaseUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [requestCount, setRequestCount] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    if (!sessionUser?.id || !firebaseUser) {
      setRequestCount(0);
      setInviteCount(0);
      return;
    }
    let active = true;
    void (async () => {
      const token = await firebaseUser.getIdToken();
      const [friendships, invites] = await Promise.all([
        supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('user_b', sessionUser.id).eq('status', 'pending'),
        fetch('/api/invites', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : { count: 0 }),
      ]);
      if (!active) return;
      setRequestCount(friendships.count || 0);
      setInviteCount(invites.count || 0);
    })().catch(() => {
      if (!active) return;
      setRequestCount(0);
      setInviteCount(0);
    });
    return () => { active = false; };
  }, [sessionUser?.id, firebaseUser, supabase]);

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const hostHref = '/groups/create';

  return (
    <>
      <svg width="0" height="0" aria-hidden="true" className="su-symbol">
        <symbol id="showup-ball" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="47" fill="#d8f03c" stroke="#15130f" strokeWidth="4" />
          <path d="M13 22C35 40 35 60 13 78M87 22C65 40 65 60 87 78" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        </symbol>
        <symbol id="showup-basketball" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="47" fill="#db762e" stroke="#15130f" strokeWidth="4" />
          <path d="M50 4C33 20 33 80 50 96M50 4C67 20 67 80 50 96M5 34C28 47 72 47 95 34M5 66C28 53 72 53 95 66" fill="none" stroke="#15130f" strokeWidth="4" />
        </symbol>
      </svg>
      <header className="bar">
        <div className="wrap">
          <Link className="logo" href="/" aria-label="ShowUp home">
            SH<span className="ow"><svg><use href="#showup-ball" /></svg></span>W&nbsp;UP<sup>BETA</sup>
          </Link>
          <nav id="nv" aria-label="Main navigation">
            <Link className={active('/') ? 'on' : ''} href="/">Home</Link>
            <Link className={active('/profile/friends') ? 'on' : ''} href="/profile/friends">
              Friends{sessionUser && requestCount > 0 && <b>{requestCount}</b>}
            </Link>
            <Link className={active('/invites') ? 'on' : ''} href="/invites">Invites{sessionUser && inviteCount > 0 && <b>{inviteCount}</b>}</Link>
            <Link className={active('/profile') && !active('/profile/friends') ? 'on' : ''} href="/profile">Profile</Link>
          </nav>
          <Link className="btn" href={hostHref}>+ Host a game</Link>
        </div>
      </header>
    </>
  );
}
