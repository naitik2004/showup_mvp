"use client";
import { Player } from "../types";
import { PlayerActions } from "./FriendActions";
import PlayerSuggestionCard from "./PlayerSuggestionCard";
import styles from "../friends.module.css";
export default function PlayerSuggestionsSection({
  players,
  onDismiss,
  ...actions
}: { players: Player[]; onDismiss: (id: string) => void } & PlayerActions) {
  return (
    <section className={styles["fr-sec"]} aria-labelledby="suggested-players">
      <div className={styles["fr-sec__head"]}>
        <h2 className={styles["fr-sec__title"]} id="suggested-players">
          People you may <span className="ser">know</span>
        </h2>
        <p className={styles["fr-sec__sub"]}>
          Players you’ve shared a court with, and friends of your friends.
        </p>
      </div>
      {players.length ? (
        <ul className={styles["fr-grid"]}>
          {players.map((player) => (
            <PlayerSuggestionCard
              key={player.id}
              player={player}
              onDismiss={onDismiss}
              {...actions}
            />
          ))}
        </ul>
      ) : (
        <div className={styles["fr-empty"]}>
          <h3>No suggestions yet</h3>
          <p>
            Join a match or add a friend and the people around them will show up
            here.
          </p>
        </div>
      )}
    </section>
  );
}
