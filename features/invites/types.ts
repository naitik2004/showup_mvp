export interface InviteRow {
  id: string;
  game_id: string;
  from_user: string;
  created_at: string;
}
export interface MatchInvite extends InviteRow {
  game: {
    sport: string;
    venue: string;
    starts_at: string;
    skill_level: string;
    status: string;
  } | null;
  sender: { name: string; city: string | null; player_id: string } | null;
}
