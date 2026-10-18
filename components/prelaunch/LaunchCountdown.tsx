'use client';

import { useEffect, useState } from 'react';
import { PREVIEW_LAUNCH_DATE } from '@/data/prelaunch';
import FlipText from './FlipText';

function remainingTime() {
  const remaining = Math.max(0, new Date(PREVIEW_LAUNCH_DATE).getTime() - Date.now());
  return [
    Math.floor(remaining / 86_400_000),
    Math.floor(remaining % 86_400_000 / 3_600_000),
    Math.floor(remaining % 3_600_000 / 60_000),
    Math.floor(remaining % 60_000 / 1_000),
  ];
}

export default function LaunchCountdown() {
  const [values, setValues] = useState<number[] | null>(null);
  useEffect(() => {
    const update = () => setValues(remainingTime());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="countdown" aria-label="Launch countdown">
      {['Days', 'Hours', 'Min', 'Sec'].map((label, index) => {
        const text = values ? String(values[index]).padStart(2, '0') : '--';
        return <div key={label}><FlipText text={text} width={Math.max(2, text.length)} /><small>{label}</small></div>;
      })}
    </div>
  );
}
