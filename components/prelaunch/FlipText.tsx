'use client';

import { useEffect, useState } from 'react';

const CHARACTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:';

function FlipCell({ value, delay }: { value: string; delay: number }) {
  const [display, setDisplay] = useState(value);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const timers = Array.from({ length: 5 }, (_, step) => window.setTimeout(() => {
      setDisplay(step === 4 ? value : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
      setFrame((current) => current + 1);
    }, delay + step * 58));
    return () => timers.forEach(window.clearTimeout);
  }, [value, delay]);

  return <span key={frame} className="flipCell flipping">{display}</span>;
}

/** Fixed-width text with a readable label instead of character-by-character speech. */
export default function FlipText({ text, width, delay = 0, className = '' }: {
  text: string; width: number; delay?: number; className?: string;
}) {
  const letters = text.toUpperCase().padEnd(width).slice(0, width).split('');
  return (
    <span className={`flipGroup ${className}`} aria-label={text}>
      <span className="flipCharacters" aria-hidden="true">
        {letters.map((letter, index) => <FlipCell key={index} value={letter} delay={delay + index * 26} />)}
      </span>
    </span>
  );
}
