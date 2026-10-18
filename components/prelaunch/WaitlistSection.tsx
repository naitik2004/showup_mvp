'use client';

import { FormEvent, useState } from 'react';
import LaunchCountdown from './LaunchCountdown';
import SectionLabel from './SectionLabel';

/** Requested prelaunch confirmation preview; backend registration is still pending. */
export default function WaitlistSection() {
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="waitlist" id="join">
      <div className="container">
        <SectionLabel gate="04" title="Doors open soon" />
        <h2>Boarding<br />starts in</h2>
        <LaunchCountdown />
        {!submitted && <form className="waitlistForm" onSubmit={submit}>
          <input type="email" name="email" autoComplete="email" required placeholder="you@email.com" aria-label="Email" aria-describedby="waitlist-status" />
          <button className="button" type="submit">Reserve my spot</button>
        </form>}
        <div id="waitlist-status" role="status">
          {submitted && <h3 className="waitlistConfirmation">You’re on the list. See you on the court.</h3>}
        </div>
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
