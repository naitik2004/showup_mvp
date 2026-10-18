import { useId } from 'react';
import styles from './LockedWaitlistButton.module.css';

export type WaitlistPhase = 'idle' | 'locking' | 'locked';

function MetalChains() {
  const gradientId = useId();
  return (
    <svg className={styles.chains} viewBox="0 0 240 64" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9fbff" /><stop offset=".24" stopColor="#b9c2ca" />
          <stop offset=".49" stopColor="#65727e" /><stop offset=".65" stopColor="#e2e9ef" /><stop offset="1" stopColor="#7d8994" />
        </linearGradient>
      </defs>
      {[12, -12].map((angle, chain) => (
        <g key={angle} className={chain ? styles.chainRight : styles.chainLeft}>
          <g transform={`rotate(${angle} 120 32)`}>
            {Array.from({ length: 15 }, (_, index) => (
              <g key={index} transform={`translate(${index * 18 - 18} 32) rotate(${index % 2 ? -25 : 25})`}>
                <rect x="-12" y="-6" width="25" height="12" rx="6" fill="none" stroke="#303a43" strokeWidth="7" />
                <rect x="-12" y="-6" width="25" height="12" rx="6" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4.5" />
              </g>
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Decorative local feedback; the form still reports that registration is closed. */
export default function LockedWaitlistButton({ phase, attempt }: { phase: WaitlistPhase; attempt: number }) {
  return (
    <button className={`button ${styles.button}`} type="submit" disabled={phase === 'locking'} aria-label={phase === 'locked' ? 'Waitlist locked — registration opens soon' : 'Reserve my spot'} aria-describedby="waitlist-status">
      <span className={phase === 'idle' ? styles.label : styles.hiddenLabel}>Reserve my spot</span>
      {phase !== 'idle' && (
        <span key={attempt} className={styles.overlay} aria-hidden="true">
          <MetalChains />
          <span className={styles.padlock}>
            <span className={styles.shackle} />
            <span className={styles.lockBody}><span className={styles.keyhole} /></span>
          </span>
        </span>
      )}
    </button>
  );
}
