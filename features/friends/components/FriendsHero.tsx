import Link from "next/link";
import { APP_ROUTES } from "@/lib/navigation";
import styles from "../friends.module.css";

export default function FriendsHero({
  friends,
  requests,
  suggestions,
  loading = false,
}: {
  friends: number;
  requests: number;
  suggestions: number;
  loading?: boolean;
}) {
  const stats = [
    [friends, "Friends"],
    [requests, "Requests"],
    [suggestions, "May know"],
  ] as const;
  return (
    <header className={styles["fr-hero"]}>
      <div>
        <span className="lb">Your network</span>
        <h1 className={`ph ${styles["fr-hero__title"]}`}>
          <Link href={APP_ROUTES.home}>Friends</Link>
        </h1>
        <p className={`ser ${styles["fr-hero__lede"]}`}>
          Find anyone by name or player ID, and meet the people you’ve already
          shared a court with.
        </p>
      </div>
      <div className={styles["fr-stats"]} aria-label="Your network totals">
        {stats.map(([count, label]) => (
          <div className={styles["fr-stat"]} key={label}>
            <span className={styles["fr-stat__n"]}>
              {loading ? (
                <span
                  className={styles["fr-stat__skeleton"]}
                  aria-label="Loading"
                />
              ) : (
                String(count).padStart(2, "0")
              )}
            </span>
            <span className={styles["fr-stat__l"]}>{label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
