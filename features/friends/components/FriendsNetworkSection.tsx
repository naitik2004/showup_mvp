"use client";
import { useState } from "react";
import { Player } from "../types";
import { SPORTS } from "../content";
import PlayerCard, { PlayerActions } from "./PlayerCard";
import styles from "../friends.module.css";
export default function FriendsNetworkSection({
  players,
  ...actions
}: { players: Player[] } & PlayerActions) {
  const [sport, setSport] = useState("all"),
    sports = Array.from(
      new Set(players.flatMap((player) => player.preferred_sports || [])),
    );
  const activeSport = sports.includes(sport) ? sport : "all",
    visible = players.filter(
      (player) =>
        activeSport === "all" || player.preferred_sports?.includes(activeSport),
    );
  return (
    <section className={styles["fr-sec"]} aria-labelledby="your-network">
      <div className={styles["fr-sec__head"]}>
        <h2 className={styles["fr-sec__title"]} id="your-network">
          Your <span className="ser">crew</span>
        </h2>
        {players.length > 0 && (
          <p className={styles["fr-sec__sub"]}>
            {players.length} friend{players.length === 1 ? "" : "s"}. Filter by
            the sport you play together.
          </p>
        )}
      </div>
      {players.length ? (
        <>
          <div
            className={styles["fr-filter"]}
            aria-label="Filter friends by sport"
          >
            {["all", ...sports].map((value) => (
              <button
                className={`chip ${activeSport === value ? "on" : ""}`}
                key={value}
                onClick={() => setSport(value)}
                aria-pressed={activeSport === value}
              >
                {value === "all"
                  ? "Everyone"
                  : SPORTS[value]
                    ? `${SPORTS[value].icon} ${SPORTS[value].name}`
                    : value}
              </button>
            ))}
          </div>
          <ul className={`${styles["fr-list"]} ${styles["fr-list--2"]}`}>
            {visible.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                network
                {...actions}
              />
            ))}
          </ul>
        </>
      ) : (
        <div className={styles["fr-empty"]}>
          <h3>Your crew starts here</h3>
          <p>Search above by name or player ID, or accept a suggestion.</p>
        </div>
      )}
    </section>
  );
}
