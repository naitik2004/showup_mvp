'use client';

import { FormEvent, useEffect, useState } from 'react';
import LaunchCountdown from './LaunchCountdown';
import SectionLabel from './SectionLabel';
import LockedWaitlistButton, { WaitlistPhase } from './LockedWaitlistButton';

/** Do not claim a subscription was saved until a real waitlist endpoint exists. */
export default function WaitlistSection() {
  const [notice, setNotice] = useState('');
  const [phase, setPhase] = useState<WaitlistPhase>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (phase !== 'locking') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      setPhase('locked');
      setNotice('Waitlist registration is not open yet. Your email has not been saved. You can explore ShowUp using “Open the app”.');
    }, reducedMotion ? 0 : 1000);
    return () => window.clearTimeout(timer);
  }, [phase, attempt]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');
    setPhase('locking');
    setAttempt((count) => count + 1);
  };

  return (
    <section className="waitlist" id="join">
      <div className="container">
        <SectionLabel gate="04" title="Doors open soon" />
        <h2>Boarding<br />starts in</h2>
        <LaunchCountdown />
        <form className="waitlistForm" onSubmit={submit} noValidate>
          <input type="email" name="email" autoComplete="email" placeholder="you@email.com" aria-label="Email" aria-describedby="waitlist-status" />
          <LockedWaitlistButton phase={phase} attempt={attempt} />
        </form>
        <p id="waitlist-status" role="status" className="waitlistStatus">{notice}</p>
        <div className="waitlistNote">
          <div className="avatars" aria-hidden="true">
            {['A', 'R', 'K', 'M'].map((letter, index) => <i key={letter} style={{ background: ['#d8f03c', '#f3efe4', '#d9532b', '#ebe5d4'][index] }}>{letter}</i>)}
          </div>
          <span>Be among the first players to show up.</span>
        </div>
      </div>
    </section>
  );
}
