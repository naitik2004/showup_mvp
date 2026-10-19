export type FriendAction =
  | "request"
  | "accept"
  | "decline"
  | "cancel"
  | "remove";
export type FriendsSection = "search" | "network" | "requests" | "suggestions";
export interface Player {
  id: string;
  name: string;
  player_id: string;
  relationship: "friend" | "incoming" | "outgoing" | "none";
  mutual_count: number;
  shared_matches: number;
  preferred_sports?: string[];
}
export interface FriendsSnapshot {
  playerId: string;
  network: Player[];
  requests: Player[];
  suggestions: Player[];
}
