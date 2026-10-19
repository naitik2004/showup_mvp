"use client";

import { toast } from "sonner";
import { notifyNavigationChanged } from "@/lib/navigation-events";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  changeFriendship,
  fetchFriendsSnapshot,
  fetchPlayers,
  friendsError,
} from "../data/friendsRepository";
import { FriendAction, FriendsSnapshot, Player } from "../types";

const actionMessages: Record<FriendAction, string> = {
  request: "Friend request sent.",
  accept: "You are now friends.",
  decline: "Request declined.",
  cancel: "Request cancelled.",
  remove: "Friend removed.",
};

export function useFriends() {
  const [snapshot, setSnapshot] = useState<FriendsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [revision, setRevision] = useState(0);
  const operation = useRef(false);
  const refreshGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    try {
      const next = await fetchFriendsSnapshot();
      if (generation === refreshGeneration.current) {
        setSnapshot(next);
        setError("");
      }
    } catch (cause) {
      if (generation === refreshGeneration.current)
        setError(friendsError(cause));
    } finally {
      if (generation === refreshGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const update = () => {
      void refresh();
      setRevision((value) => value + 1);
    };
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      refreshGeneration.current++;
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [refresh]);

  useEffect(() => {
    let active = true;
    setResults([]);
    setSearchError("");
    if (query.trim().length < 2) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const players = await fetchPlayers("search", query.trim());
        if (active) setResults(players);
      } catch (cause) {
        if (active) setSearchError(friendsError(cause));
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, revision]);

  const act = async (
    player: Player,
    action: FriendAction,
    afterSave?: () => Promise<void>,
  ) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(player.id);
    setError("");
    try {
      await changeFriendship(player.player_id, action);
      notifyNavigationChanged();
      if (afterSave) await afterSave();
      toast.success(actionMessages[action]);
      await refresh();
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(friendsError(cause));
      toast.error(friendsError(cause));
    } finally {
      operation.current = false;
      setBusy("");
    }
  };

  return {
    snapshot,
    loading,
    error,
    busy,
    query,
    setQuery,
    results,
    searching,
    searchError,
    refresh,
    act,
  };
}
