'use client';

import { useEffect, useState } from 'react';
import { APP_ENTRY_URL } from '@/data/prelaunch';
import BallIcon from './BallIcon';
import ballStyles from './PlayfulBall.module.css';

export default function PrelaunchNavigation() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''} aria-label="ShowUp navigation">
      <div className="container">
        <a className="logo" href="#top" aria-label="ShowUp home">
          SH<span className={ballStyles.logoBall}><BallIcon /></span>W&nbsp;UP
        </a>
        <a className="button" href={APP_ENTRY_URL}>Open the app</a>
      </div>
    </nav>
  );
}
