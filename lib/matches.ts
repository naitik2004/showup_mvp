import type { GameGroup, Sport, SkillLevel } from '@/types';
import type { Database } from '@/types/database.generated';
export type MatchStatus = 'open' | 'full' | 'live' | 'done' | 'cancelled';
export interface Match extends Omit<Database['public']['Tables']['games']['Row'], 'sport' | 'skill_level' | 'status'> {
 sport: Sport; skill_level: SkillLevel; status: MatchStatus;
 member_count: number; spots_left: number; host_name: string; host_avatar: string | null;
}
export function toGroup(game: Match): GameGroup {
 return { ...game, location_name: game.venue, scheduled_at: game.starts_at,
 location: { lat: game.lat ?? 28.6139, lng: game.lng ?? 77.209 }, expires_at: null, is_permanent: game.is_permanent };
}
