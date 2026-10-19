import { Player } from "../types";
import { sportNames } from "../content";
import PlayerAvatar from "./PlayerAvatar";
import PlayerIdChip from "./PlayerIdChip";
import ConnectionReasons from "./ConnectionReasons";
import FriendActions, { PlayerActions } from "./FriendActions";
import styles from "../friends.module.css";
export default function PlayerSuggestionCard({
  player,
  onDismiss,
  ...actions
}: { player: Player; onDismiss: (id: string) => void } & PlayerActions) {
  return (
    <li className={styles["fr-card"]}>
      <button
        className={styles["fr-card__x"]}
        onClick={() => onDismiss(player.id)}
        aria-label={`Hide suggestion for ${player.name}`}
      >
        ×
      </button>
      <PlayerAvatar name={player.name} />
      <h3 className={styles["fr-card__name"]}>{player.name}</h3>
      <PlayerIdChip playerId={player.player_id} />
      {player.preferred_sports?.length ? (
        <p className={styles["fr-card__sub"]}>
          {sportNames(player.preferred_sports)}
        </p>
      ) : null}
      <ConnectionReasons player={player} />
      <div className={styles["fr-card__act"]}>
        <FriendActions player={player} {...actions} />
      </div>
    </li>
  );
}
