import { Player } from "../types";
import PlayerCard, { PlayerActions } from "./PlayerCard";
import styles from "../friends.module.css";
interface SearchProps extends PlayerActions {
  query: string;
  onQueryChange: (value: string) => void;
  results: Player[];
  searching: boolean;
  error: string;
}
const normalizeId = (value: string) =>
  value.toUpperCase().replaceAll("-", "").trim();
export default function PlayerSearchSection({
  query,
  onQueryChange,
  results,
  searching,
  error,
  ...actions
}: SearchProps) {
  return (
    <section className={styles["fr-search"]} aria-labelledby="find-players">
      <label
        className={styles["fr-search__label"]}
        id="find-players"
        htmlFor="player-search"
      >
        Find a player
      </label>
      <div
        className={`${styles["fr-search__box"]} ${query ? styles["has-q"] : ""}`}
      >
        <svg
          className={styles["fr-search__icon"]}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <path
            d="M15.5 15.5L21 21"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <input
          id="player-search"
          className={styles["fr-search__input"]}
          type="search"
          placeholder="Name or player ID, e.g. SU-9RM3XA"
          autoComplete="off"
          spellCheck={false}
          value={query}
          maxLength={100}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-controls="player-results"
        />
        <button
          className={styles["fr-search__clear"]}
          type="button"
          aria-label="Clear search"
          onClick={() => onQueryChange("")}
        >
          ×
        </button>
      </div>
      <div
        className={styles["fr-results"]}
        id="player-results"
        aria-live="polite"
        aria-busy={searching}
      >
        {query.trim().length < 2 ? (
          <p className={styles["fr-tip"]}>
            Type at least 2 characters. Search by name or paste a player ID.
          </p>
        ) : searching ? (
          <p className={styles["fr-count"]}>Searching players…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !results.length ? (
          <div className={styles["fr-empty"]}>
            <h3>No player found</h3>
            <p>
              Nothing matches “{query.trim()}”. Check the ID for typos, or
              search by name instead.
            </p>
          </div>
        ) : (
          <>
            <p className={styles["fr-count"]}>
              {results.length} player{results.length === 1 ? "" : "s"} found
            </p>
            <ul className={styles["fr-list"]}>
              {results.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  exact={normalizeId(query) === normalizeId(player.player_id)}
                  {...actions}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
