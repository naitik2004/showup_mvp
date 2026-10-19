import { Player } from "../types";
import { PlayerActions } from "./FriendActions";
import RequestCarousel from "./RequestCarousel";
import styles from "../friends.module.css";
export default function FriendRequestsSection({
  players,
  ...actions
}: { players: Player[] } & PlayerActions) {
  if (!players.length) return null;
  return (
    <section className={styles["fr-sec"]} aria-labelledby="friend-requests">
      <div className={styles["fr-sec__head"]}>
        <h2 className={styles["fr-sec__title"]} id="friend-requests">
          Requests <span className="ser">waiting</span>
        </h2>
        <p className={styles["fr-sec__sub"]}>
          Players who want to connect, and the passes you’ve sent out.
        </p>
      </div>
      <div className={styles["fr-request-stacks"]}>
        <RequestCarousel
          kind="received"
          players={players.filter(
            (player) => player.relationship === "incoming",
          )}
          {...actions}
        />
        <RequestCarousel
          kind="sent"
          players={players.filter(
            (player) => player.relationship === "outgoing",
          )}
          {...actions}
        />
      </div>
    </section>
  );
}
