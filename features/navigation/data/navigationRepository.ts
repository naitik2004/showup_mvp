import type { NavigationSummary } from "../types";
import { createClient } from "@/lib/supabase/server";

/** Only pending items addressed to the signed-in player need attention. */
export async function fetchNavigationSummary(): Promise<NavigationSummary> {
  const client = createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (!user) {
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return { authenticated: false, friendRequests: 0, invites: 0, friends: 0, greetingName: null };
  }
  const [requests, invites, friends, profile] = await Promise.all([
    client.from("friendships").select("id", { count: "exact", head: true })
      .eq("user_b", user.id).eq("status", "pending"),
    client.from("game_invites").select("id", { count: "exact", head: true })
      .eq("to_user", user.id).eq("status", "pending"),
    client.from("friendships").select("id", { count: "exact", head: true })
      .eq("status", "accepted").or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    client.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);
  if (requests.error || invites.error || friends.error || profile.error) throw requests.error || invites.error || friends.error || profile.error;
  const greetingName = profile.data?.name?.trim().split(/\s+/)[0] || null;
  return { authenticated: true, greetingName, friendRequests: requests.count || 0, invites: invites.count || 0, friends: friends.count || 0 };
}
