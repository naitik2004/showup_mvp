export interface PlayerStats { played: number; hosted: number; joined: number; upcoming: number }
export interface PublicPlayer {
  player_id: string; name: string; avatar_url: string | null; city: string | null;
  skill: string | null; preferred_sports: string[]; stats: PlayerStats;
}
export interface RelatedPlayer extends PublicPlayer { id: string }
export interface PlayerReview {
  id: string; name: string; player_id: string; sport: string;
  skill_score: number; sportsmanship_score: number; reliability_score: number;
}
