'use client';

import { useState } from 'react';
import BallIcon from './BallIcon';
import styles from './PlayfulBall.module.css';

/** Remount only the artwork so every click or keyboard press restarts the squeeze. */
export default function SqueezableBall() {
  const [presses, setPresses] = useState(0);
  return (
    <button className={styles.heroBallButton} type="button" aria-label="Squeeze the ball" onClick={() => setPresses((count) => count + 1)}>
      <span key={presses} className={presses ? styles.squeezing : undefined}><BallIcon /></span>
    </button>
  );
}
