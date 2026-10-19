import { Player } from "../types";
import styles from "../friends.module.css";
export default function ConnectionReasons({ player }: { player: Player }) {
  if (!player.shared_matches && !player.mutual_count) return null;
  return (
    <div className={styles["fr-why"]}>
      {player.shared_matches > 0 && (
        <span
          className={`${styles["fr-why__chip"]} ${styles["fr-why__chip--played"]}`}
        >
          Played together ×{player.shared_matches}
        </span>
      )}
      {player.mutual_count > 0 && (
        <span
          className={`${styles["fr-why__chip"]} ${styles["fr-why__chip--mutual"]}`}
        >
          {player.mutual_count} mutual friend
          {player.mutual_count === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
