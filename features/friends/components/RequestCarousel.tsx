"use client";

import { Player } from "../types";
import { useRequestCarousel } from "../hooks/useRequestCarousel";
import { PlayerActions } from "./FriendActions";
import FriendRequestPass from "./FriendRequestPass";
import styles from "./RequestCarousel.module.css";

export default function RequestCarousel({
  kind,
  players,
  ...actions
}: { kind: "received" | "sent"; players: Player[] } & PlayerActions) {
  const carousel = useRequestCarousel(players, Boolean(actions.busy));
  const label = kind === "received" ? "Received" : "Sent";
  return (
    <section
      className={styles.carousel}
      aria-label={`${label} requests`}
      aria-roledescription="carousel"
    >
      <div className={styles.heading}>
        <h3>
          {label} <span>({players.length})</span>
        </h3>
        <div className={styles.controls}>
          <button
            type="button"
            aria-label={`Previous ${kind} request`}
            disabled={players.length < 2 || Boolean(actions.busy)}
            onClick={() => carousel.move(-1)}
          >
            ←
          </button>
          <span
            className={styles.counter}
            aria-live="polite"
            aria-atomic="true"
          >
            {players.length ? carousel.index + 1 : 0} / {players.length}
          </span>
          <button
            type="button"
            aria-label={`Next ${kind} request`}
            disabled={players.length < 2 || Boolean(actions.busy)}
            onClick={() => carousel.move(1)}
          >
            →
          </button>
        </div>
      </div>
      {carousel.player ? (
        <div
          className={styles.viewport}
          tabIndex={players.length > 1 ? 0 : -1}
          aria-label={`${label} request ${carousel.index + 1} of ${players.length}. Use left and right arrow keys to browse.`}
          {...carousel.handlers}
        >
          <ul
            className={`${styles.slide} ${styles[carousel.direction]}`}
            key={carousel.player.id}
          >
            <FriendRequestPass
              player={carousel.player}
              number={carousel.index + 1}
              {...actions}
            />
          </ul>
        </div>
      ) : (
        <div className={styles.empty}>
          <span aria-hidden="true">{kind === "received" ? "↙" : "↗"}</span>
          <h4>
            {kind === "received" ? "No received requests" : "No sent requests"}
          </h4>
          <p>
            {kind === "received"
              ? "When a player sends you a friend request, their ticket will appear here."
              : "Search for a player above to send your first request."}
          </p>
        </div>
      )}
      {players.length > 1 && (
        <p className={styles.hint}>
          Swipe sideways to browse · loops back to the first ticket
        </p>
      )}
    </section>
  );
}
