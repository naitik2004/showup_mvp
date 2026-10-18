'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

/** Fit the actual rendered lettering, including the ball, to the content width. */
export default function FullWidthHeading({ children, label }: { children: ReactNode; label: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number>();

  useEffect(() => {
    let frame = 0;
    let active = true;
    const fit = () => {
      if (!active || !heading.current || !content.current) return;
      const available = heading.current.clientWidth - 1;
      const actual = content.current.getBoundingClientRect().width;
      if (!actual || !available) return;
      const current = Number.parseFloat(getComputedStyle(heading.current).fontSize);
      const fitted = current * available / actual;
      if (Math.abs(fitted - current) > 0.15) setFontSize(fitted);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    const observer = new ResizeObserver(schedule);
    if (heading.current) observer.observe(heading.current);
    schedule();
    void document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', schedule);
    };
  }, []);

  return (
    <h1 ref={heading} aria-label={label} style={fontSize ? { fontSize } : undefined}>
      <span className="heroTitleContent" ref={content}>{children}</span>
    </h1>
  );
}
