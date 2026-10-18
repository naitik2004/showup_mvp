'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ShowUpHeader() {
  const pathname = usePathname();
  const { sessionUser } = useAuth();

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const hostHref = sessionUser ? '/groups/create' : '/login';
  const joinHref = sessionUser ? '/#board' : '/login';

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
          <div className="nav-actions">
            <Link className="btn gh" href={joinHref}>Join a game</Link>
            <Link className="btn" href={hostHref}>+ Host a game</Link>
          </div>
        </div>
      </header>
      <nav id="nv" aria-label="Main navigation">
        <Link className={active('/') ? 'on' : ''} href="/">Home</Link>
      </nav>
    </>
  );
}
