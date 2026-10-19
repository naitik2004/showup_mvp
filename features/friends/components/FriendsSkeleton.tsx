import styles from "./FriendsSkeleton.module.css";

export default function FriendsSkeleton() {
  return (
    <div className={styles.root} role="status" aria-label="Loading friends">
      <div aria-hidden="true">
        <div className={styles.top}>
          <div className={styles.card}>
            <div className={`${styles.block} ${styles.label}`} />
            <div className={`${styles.block} ${styles.input}`} />
            <div className={`${styles.block} ${styles.line}`} />
          </div>
          <div className={`${styles.card} ${styles.identity}`}>
            <div className={`${styles.block} ${styles.label}`} />
            <div className={`${styles.block} ${styles.code}`} />
            <div className={`${styles.block} ${styles.line}`} />
            <div className={`${styles.block} ${styles.button}`} />
          </div>
        </div>
        <div className={`${styles.block} ${styles.heading}`} />
        <div className={styles.requests}>
          {[0, 1].map((item) => (
            <div className={styles.ticket} key={item}>
              <div className={styles.ticketMain}>
                <div className={`${styles.block} ${styles.label}`} />
                <div className={`${styles.block} ${styles.name}`} />
                <div className={`${styles.block} ${styles.line}`} />
                <div className={`${styles.block} ${styles.line}`} />
              </div>
              <div className={styles.stub}>
                <div className={`${styles.block} ${styles.avatar}`} />
                <div className={`${styles.block} ${styles.button}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
