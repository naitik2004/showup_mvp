export type Sport = 'football' | 'badminton' | 'basketball' | 'table_tennis' | 'cricket' | 'tennis';

export type SkillLevel = 'beginner' | 'intermediate' | 'pro';

export type GroupStatus = 'open' | 'full' | 'in_progress' | 'expired';

export type MemberStatus = 'pending' | 'accepted' | 'declined';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface SportInfo {
  id: Sport;
  name: string;
  emoji: string;
}

export const SPORTS: SportInfo[] = [
  { id: 'football', name: 'Football', emoji: '⚽' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀' },
  { id: 'table_tennis', name: 'Table Tennis', emoji: '🏓' },
  { id: 'cricket', name: 'Cricket', emoji: '🏏' },
  { id: 'tennis', name: 'Tennis', emoji: '🎾' },
];

export const CITIES = [
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
] as const;

export type City = typeof CITIES[number];

export interface User {
  id: string;
  name: string;
  city: City | string;
  avatar_url: string | null;
  location: { lat: number; lng: number } | null;
  location_visible: boolean;
  preferred_sports: Sport[];
  created_at: string;
}

export interface GameGroup {
  id: string;
  host_id: string;
  sport: Sport;
  location: { lat: number; lng: number };
  location_name: string;
  max_players: number;
  skill_level: SkillLevel;
  scheduled_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  status: GroupStatus;
  created_at: string;
  // Joined fields
  host?: User;
  host_name?: string;
  member_count?: number;
  distance?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  status: MemberStatus;
  joined_at: string;
  // Joined
  user?: User;
}

export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  // Joined
  sender?: User;
}

export interface SportRating {
  id: string;
  ratee_id: string;
  rater_id: string;
  game_id: string;
  sport: Sport;
  skill_score: number;
  sportsmanship_score: number;
  reliability_score: number;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_a: string;
  user_b: string;
  status: FriendshipStatus;
  created_at: string;
}

// Create game form types
export interface CreateGameFormData {
  sport: Sport | null;
  location: { lat: number; lng: number } | null;
  location_name: string;
  max_players: number;
  skill_level: SkillLevel;
  scheduled_at: string;
  scheduled_time: string;
  is_permanent: boolean;
}
