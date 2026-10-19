'use client';

import { useId, useState } from 'react';
import styles from './PlayerName.module.css';

/** Phrasing markup works inside chat timestamps as well as lobby labels. */
export default function PlayerName({ name, code }: { name: string; code?: string }) {
  const [open, setOpen] = useState(false);
  const popupId = useId();
  if (!code) return <span>{name}</span>;

  return (
    <span
      className={styles.identity}
      data-open={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <button
        className={styles.name}
        type="button"
        aria-label={`${name}, show player ID`}
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => setOpen(true)}
      >
        {name}
      </button>
      <span id={popupId} className={`mono ${styles.code}`}>
        <a href={`/#/p/${encodeURIComponent(code)}`}>{code}</a>
      </span>
    </span>
  );
}
