import { useState } from "react";
import { FriendAction, Player } from "../types";
import { sportNames } from "../content";
import PlayerAvatar from "./PlayerAvatar";
import FriendActions, { PlayerActions } from "./FriendActions";
import styles from "../friends.module.css";
function PlayerBarcode({ playerId }: { playerId: string }) {
  let x = 0;
  const bars = Array.from(`${playerId}SHOWUP`).flatMap((character, index) =>
    [0, 1, 2].map((bit) => {
      const code = character.charCodeAt(0),
        width = 1 + (((code >> (bit * 2)) & 3) % 3),
        left = x;
      x += width + 1 + ((code >> bit) & 1);
      return (
        <rect key={`${index}-${bit}`} x={left} width={width} height={40} />
      );
    }),
  );
  return (
    <svg
      className={styles["fr-pass__bars"]}
      viewBox={`0 0 ${x} 40`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars}
    </svg>
  );
}
export default function FriendRequestPass({
  player,
  number,
  ...actions
}: { player: Player; number: number } & PlayerActions) {
  const [transition, setTransition] = useState("");
  const runAction = async (target: Player, action: FriendAction) => {
    await actions.onAction(target, action, async () => {
      if (action !== "accept" && action !== "decline") return;
      setTransition(
        action === "accept" ? "fr-pass--accepted" : "fr-pass--gone",
      );
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await new Promise<void>((resolve) =>
          window.setTimeout(resolve, action === "accept" ? 850 : 350),
        );
      }
    });
  };
  const incoming = player.relationship === "incoming",
    [firstName, ...lastName] = player.name.split(" ");
  const connection = player.mutual_count
    ? `${player.mutual_count} mutual`
    : player.shared_matches
      ? `Played ×${player.shared_matches}`
      : "New to you";
  return (
    <li
      className={`${styles["fr-pass"]} ${styles[incoming ? "fr-pass--incoming" : "fr-pass--sent"]} ${transition ? styles[transition] : ""}`}
    >
      <div className={styles["fr-pass__main"]}>
        <div className={styles["fr-pass__top"]}>
          <span>Crew pass · ShowUp</span>
          <span>No. {String(number).padStart(2, "0")}</span>
        </div>
        <h3 className={styles["fr-pass__name"]}>
          {firstName}
          {lastName.length > 0 && (
            <>
              <br />
              {lastName.join(" ")}
            </>
          )}
        </h3>
        <dl className={styles["fr-pass__fields"]}>
          <div>
            <dt>Player ID</dt>
            <dd
              className={
                player.player_id.length > 12 ? styles["fr-id--legacy"] : ""
              }
            >
              {player.player_id}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{incoming ? "Wants to connect" : "Awaiting reply"}</dd>
          </div>
          <div>
            <dt>Plays</dt>
            <dd>{sportNames(player.preferred_sports) || "Not set"}</dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd>{connection}</dd>
          </div>
        </dl>
        {!incoming && (
          <span
            className={`${styles["fr-pass__stamp"]} ${styles["fr-pass__stamp--wait"]}`}
          >
            Pending
          </span>
        )}
      </div>
      <div className={styles["fr-pass__stub"]}>
        <span className={styles["fr-pass__label"]}>
          {incoming ? "Wants in" : "Sent by you"}
        </span>
        <PlayerAvatar name={player.name} />
        <PlayerBarcode playerId={player.player_id} />
        <div className={styles["fr-pass__act"]}>
          <FriendActions
            player={player}
            network
            {...actions}
            onAction={runAction}
          />
        </div>
      </div>
      {transition === "fr-pass--accepted" && (
        <span
          className={`${styles["fr-pass__stamp"]} ${styles["fr-pass__stamp--ok"]}`}
        >
          Friends
        </span>
      )}
    </li>
  );
}
