import BallIcon from '@/components/prelaunch/BallIcon';
import styles from './RequestLoader.module.css';

export default function LoadingScreen() {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="Loading, please wait">
      <div className={styles.box}>
        <div className={styles.tbl} aria-hidden="true">
          {['a', 'b', 'c'].map((slot) => (
            <span key={slot} className={`${styles.bl} ${styles[slot]}`}><b /><BallIcon /></span>
          ))}
        </div>
        <div className={styles.lt}>Shuffling <i>the lineup</i></div>
        <div className={styles.ls}>Getting things ready</div>
      </div>
    </div>
  );
}
