import { createClient } from "@/lib/supabase/server";

/** Only pending items addressed to the signed-in player need attention. */
export async function fetchNavigationSummary() {
  const client = createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (!user) {
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return { authenticated: false, friendRequests: 0, invites: 0, friends: 0 };
  }
  const [requests, invites, friends] = await Promise.all([
    client.from("friendships").select("id", { count: "exact", head: true })
      .eq("user_b", user.id).eq("status", "pending"),
    client.from("game_invites").select("id", { count: "exact", head: true })
      .eq("to_user", user.id).eq("status", "pending"),
    client.from("friendships").select("id", { count: "exact", head: true })
      .eq("status", "accepted").or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ]);
  if (requests.error || invites.error || friends.error) throw requests.error || invites.error || friends.error;
  return { authenticated: true, friendRequests: requests.count || 0, invites: invites.count || 0, friends: friends.count || 0 };
}
