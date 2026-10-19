import { FriendAction, Player } from "../types";
import styles from "../friends.module.css";
export interface PlayerActions {
  busy: string;
  onAction: (
    player: Player,
    action: FriendAction,
    afterSave?: () => Promise<void>,
  ) => Promise<void>;
}
export default function FriendActions({
  player,
  busy,
  onAction,
  network = false,
}: { player: Player; network?: boolean } & PlayerActions) {
  const disabled = Boolean(busy);
  const action = (value: FriendAction) => {
    void onAction(player, value);
  };
  if (busy === player.id) return <span role="status">Saving…</span>;
  if (player.relationship === "incoming")
    return (
      <>
        <button
          className="btn sm hot"
          disabled={disabled}
          onClick={() => action("accept")}
        >
          Accept
        </button>
        <button
          className="btn sm gh"
          disabled={disabled}
          onClick={() => action("decline")}
        >
          Decline
        </button>
      </>
    );
  if (player.relationship === "outgoing")
    return (
      <button
        className="btn sm gh"
        disabled={disabled}
        onClick={() => action("cancel")}
      >
        {network ? "Withdraw" : "Requested, undo"}
      </button>
    );
  if (player.relationship === "friend")
    return network ? (
      <button
        className="btn sm bad"
        disabled={disabled}
        onClick={() => action("remove")}
      >
        Remove
      </button>
    ) : (
      <span className={`${styles["fr-tag"]} ${styles["fr-tag--ok"]}`}>
        Friends
      </span>
    );
  return (
    <button
      className="btn sm hot"
      disabled={disabled}
      onClick={() => action("request")}
    >
      + Add friend
    </button>
  );
}
