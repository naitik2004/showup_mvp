import { relatedProfiles } from '@/features/players/data/playersRepository';
import { createClient } from "@/lib/supabase/client";
import { InviteRow, MatchInvite } from "../types";
export async function fetchInvites(userId: string): Promise<MatchInvite[]> {
  const client = createClient();
  const { data, error } = await client
    .from("game_invites")
    .select("id,game_id,from_user,created_at")
    .eq("to_user", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const invites: InviteRow[] = data || [];
  if (!invites.length) return [];
  const gameIds = Array.from(new Set(invites.map((invite) => invite.game_id)));
  const senderIds = Array.from(
    new Set(invites.map((invite) => invite.from_user)),
  );
  const [games, senders] = await Promise.all([
    client
      .from("games")
      .select("id,sport,venue,starts_at,skill_level,status")
      .in("id", gameIds),
    relatedProfiles(senderIds),
  ]);
  if (games.error) throw games.error;
  const gamesById = new Map((games.data || []).map((game) => [game.id, game]));
  const sendersById = senders;
  return invites.map((invite) => ({
    ...invite,
    game: gamesById.get(invite.game_id) || null,
    sender: sendersById.get(invite.from_user) || null,
  }));
}
export async function respondToInvite(
  inviteId: string,
  action: "accept" | "decline",
) {
  const { data, error } = await createClient().rpc("respond_to_game_invite", {
    p_invite_id: inviteId,
    p_action: action,
  });
  if (error) throw error;
  return data as { game_id?: string } | null;
}
