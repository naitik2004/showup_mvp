"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGroups } from "@/lib/hooks/useGroups";
import { createClient } from '@/lib/supabase/client';
import { playerError } from '@/features/players/data/playersRepository';
import { PlayerStats } from '@/features/players/types';
export type ProfileTab = "Hosting" | "Joined" | "Past";
export function useProfileDashboard() {
  const auth = useAuth();
  const groups = useGroups();
  const [publicStats, setPublicStats] = useState<PlayerStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  useEffect(() => {
    let active = true; setPublicStats(null); setStatsError(null);
    if (!auth.user) return;
    void createClient().rpc('my_player_stats').then(({ data, error }) => {
      if (!active) return;
      if (error) setStatsError(playerError(error)); else setPublicStats(data as PlayerStats);
    });
    return () => { active = false; };
  }, [auth.user?.id, groups.matches]);
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
    error: groups.error || statsError,
    refresh: groups.refetch,
    tab,
    setTab,
    shown,
    stats: [
      ["Matches played", publicStats?.played ?? past.length],
      ["Hosted", publicStats?.hosted ?? hosted.length],
      ["Joined", publicStats?.joined ?? joined.length],
      ["Upcoming", publicStats?.upcoming ?? upcoming.length],
    ] as const,
  };
}
