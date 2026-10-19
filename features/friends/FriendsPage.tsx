"use client";
import AddFriendById from './components/AddFriendById';
import { useState } from "react";
import { useFriends } from "./hooks/useFriends";
import FriendsHero from "./components/FriendsHero";
import PlayerIdCard from "./components/PlayerIdCard";
import PlayerSearchSection from "./components/PlayerSearchSection";
import FriendRequestsSection from "./components/FriendRequestsSection";
import FriendsSkeleton from "./components/FriendsSkeleton";
import FriendsNetworkSection from "./components/FriendsNetworkSection";
import PlayerSuggestionsSection from "./components/PlayerSuggestionsSection";
import styles from "./friends.module.css";
export default function FriendsPage() {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>(
    [],
  );
  const friends = useFriends(),
    data = friends.snapshot,
    actions = { busy: friends.busy, onAction: friends.act };
  const visibleSuggestions = (data?.suggestions || []).filter(
    (player) => !dismissedSuggestions.includes(player.id),
  );
  return (
    <main className="wrap">
      <div className={styles.fr}>
        <FriendsHero
          loading={friends.loading}
          friends={data?.network.length || 0}
          requests={
            data?.requests.filter(
              (player) => player.relationship === "incoming",
            ).length || 0
          }
          suggestions={visibleSuggestions.length}
        />
        {friends.loading && <FriendsSkeleton />}
        {friends.error && (
          <div className={styles["fr-error"]} role="alert">
            <p>{friends.error}</p>
            <button
              className="btn sm gh"
              onClick={() => void friends.refresh()}
            >
              Retry
            </button>
          </div>
        )}
        {!friends.loading && (
          <div className={styles["fr-top"]}>
            <div style={{ display: "grid", gap: 16 }}>
            <AddFriendById onAdded={friends.refresh} />
            <PlayerSearchSection
              query={friends.query}
              onQueryChange={friends.setQuery}
              results={friends.results}
              searching={friends.searching}
              error={friends.searchError}
              {...actions}
            />
            </div>
            {data && <PlayerIdCard playerId={data.playerId} />}
          </div>
        )}
        {data && (
          <>
            <FriendRequestsSection players={data.requests} {...actions} />
            <PlayerSuggestionsSection
              players={visibleSuggestions}
              onDismiss={(id) =>
                setDismissedSuggestions((current) => [...current, id])
              }
              {...actions}
            />
            <FriendsNetworkSection players={data.network} {...actions} />
          </>
        )}
      </div>
    </main>
  );
}
