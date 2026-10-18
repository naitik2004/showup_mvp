'use client';

import { useEffect, useRef, useState } from 'react';
import { MATCH_STAGES } from '@/data/prelaunch';
import BallIcon from './BallIcon';
import SectionLabel from './SectionLabel';

export default function MatchLifecycle() {
  const timeline = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (!timeline.current || !rail.current || !ball.current) return;
      const top = timeline.current.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.8 - top) / (window.innerHeight * 0.55)));
      ball.current.style.transform = `translateX(${progress * rail.current.clientWidth}px) rotate(${progress * 900}deg)`;
      setStage(Math.min(3, Math.floor(progress * 3.999)));
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section className="section sectionFlush" id="life">
      <div className="container">
        <div className="sectionHeading reveal">
          <SectionLabel gate="03" title="Match lifecycle" />
          <h2>Every game<br />has a <span className="serif">timeline</span></h2>
        </div>
        <div ref={timeline}>
          <div className="timelineRail" ref={rail} aria-hidden="true">
            {MATCH_STAGES.map((item, index) => <span key={item.title} className={`timelineStop ${index <= stage ? 'active' : ''}`} style={{ left: `${index / 3 * 100}%` }} />)}
            <div className="timelineBall" ref={ball}><BallIcon /></div>
          </div>
          <div className="timelineGrid">
            {MATCH_STAGES.map((item, index) => (
              <div key={item.title} className={index <= stage ? 'active' : ''}>
                <span className="mono">{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
