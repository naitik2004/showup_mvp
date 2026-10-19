"use client";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGroups } from "@/lib/hooks/useGroups";
export type ProfileTab = "Hosting" | "Joined" | "Past";
export function useProfileDashboard() {
  const auth = useAuth();
  const groups = useGroups();
  const [tab, setTab] = useState<ProfileTab>("Hosting");
  const mine = groups.matches.filter((game) => groups.myIds.includes(game.id));
  const hosted = mine.filter((game) => game.host_id === auth.sessionUser?.id);
  const joined = mine.filter((game) => game.host_id !== auth.sessionUser?.id);
  const upcoming = mine.filter(
    (game) =>
      game.status === "live" ||
      (["open", "full"].includes(game.status) &&
        new Date(game.starts_at).getTime() > Date.now()),
  );
  const past = mine.filter((game) => game.status === "done");
  const shown =
    tab === "Past"
      ? past
      : (tab === "Hosting" ? hosted : joined).filter(
          (game) => game.status !== "done",
        );
  return {
    user: auth.user,
    signOut: auth.signOut,
    loading: auth.loading || groups.loading,
    error: groups.error,
    refresh: groups.refetch,
    tab,
    setTab,
    shown,
    stats: [
      ["Matches played", past.length],
      ["Hosted", hosted.length],
      ["Joined", joined.length],
      ["Upcoming", upcoming.length],
    ] as const,
  };
}
