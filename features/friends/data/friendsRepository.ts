import { createClient } from "@/lib/supabase/client";
import {
  FriendAction,
  FriendsSection,
  FriendsSnapshot,
  Player,
} from "../types";

const database = () => createClient();

export function friendsError(cause: unknown): string {
  const error = cause as { code?: string; message?: string };
  if (["PGRST202", "42703", "42883"].includes(error?.code || "")) {
    return "Friends is waiting for its database update. Apply migration 017, then retry.";
  }
  return error?.message || "Could not reach your network. Please try again.";
}

export async function fetchPlayers(
  section: FriendsSection,
  query = "",
): Promise<Player[]> {
  const { data, error } = await database().rpc("friends_players", {
    p_mode: section,
    p_query: query,
  });
  if (error) throw error;
  const players: Player[] = data || [];
  if (!players.length) return [];
  const { data: profiles, error: profileError } = await database()
    .from("profiles")
    .select("id,preferred_sports")
    .in(
      "id",
      players.map((player) => player.id),
    );
  if (profileError) throw profileError;
  const sports = new Map(
    (profiles || []).map((profile) => [
      profile.id,
      profile.preferred_sports || [],
    ]),
  );
  return players.map((player) => ({
    ...player,
    preferred_sports: sports.get(player.id) || [],
  }));
}

export async function fetchFriendsSnapshot(): Promise<FriendsSnapshot> {
  const client = database();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in to manage your friends.");
  const [profile, network, requests, suggestions] = await Promise.all([
    client.from("profiles").select("player_id").eq("id", user.id).single(),
    fetchPlayers("network"),
    fetchPlayers("requests"),
    fetchPlayers("suggestions"),
  ]);
  if (profile.error) throw profile.error;
  return { playerId: profile.data.player_id, network, requests, suggestions };
}

export async function changeFriendship(playerId: string, action: FriendAction) {
  const { error } = await database().rpc("friend_action", {
    p_player_id: playerId,
    p_action: action,
  });
  if (error) throw error;
}
