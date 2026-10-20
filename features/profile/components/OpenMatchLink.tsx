import Link from 'next/link';
import styles from '../profile.module.css';

export default function OpenMatchLink({ id }: { id: string }) {
  return (
    <Link href={`/groups/${id}`} className={`btn ${styles.openMatch}`}>
      <span className={styles.openMatchLabel}>Open match</span>
      <span className={styles.shuffleBalls} aria-hidden="true">
        <i /><i /><i />
      </span>
    </Link>
  );
}
