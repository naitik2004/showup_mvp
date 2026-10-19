import { Player } from "../types";
import { sportNames } from "../content";
import PlayerAvatar from "./PlayerAvatar";
import PlayerIdChip from "./PlayerIdChip";
import ConnectionReasons from "./ConnectionReasons";
import FriendActions, { PlayerActions } from "./FriendActions";
import styles from "../friends.module.css";
export type { PlayerActions } from "./FriendActions";
export default function PlayerCard({
  player,
  network = false,
  exact = false,
  ...actions
}: { player: Player; network?: boolean; exact?: boolean } & PlayerActions) {
  return (
    <li className={styles["fr-person"]}>
      <div className={styles["fr-person__av"]}>
        <PlayerAvatar name={player.name} />
      </div>
      <div className={styles["fr-person__main"]}>
        <h3 className={styles["fr-person__name"]}>{player.name}</h3>
        <div className={styles["fr-person__meta"]}>
          <PlayerIdChip playerId={player.player_id} />
          {player.preferred_sports?.length ? (
            <span>{sportNames(player.preferred_sports)}</span>
          ) : null}
        </div>
        {exact && (
          <span className={`${styles["fr-tag"]} ${styles["fr-tag--hit"]}`}>
            Exact ID match
          </span>
        )}
        <ConnectionReasons player={player} />
      </div>
      <div
        className={styles["fr-person__act"]}
        aria-label={`Actions for ${player.name}`}
      >
        <FriendActions player={player} network={network} {...actions} />
      </div>
    </li>
  );
}
