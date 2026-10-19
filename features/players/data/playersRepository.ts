import { createClient } from '@/lib/supabase/client';
import { PublicPlayer, RelatedPlayer } from '../types';

export function playerError(cause: unknown): string {
  const error = cause as { code?: string; message?: string };
  if (['PGRST202','42883','42703'].includes(error?.code || '')) return 'Player profiles are waiting for the database update. Please try again later.';
  return error?.message || 'Could not load this player. Please try again.';
}

export async function findPlayer(code: string): Promise<PublicPlayer | null> {
  const { data, error } = await createClient().rpc('find_player', { player_id: code.trim().toUpperCase() });
  if (error) throw error;
  return data?.[0] || null;
}

/** Each request reauthorizes the batch. The room owns its viewer-scoped cache. */
export async function relatedProfiles(ids: string[]): Promise<Map<string, RelatedPlayer>> {
  if (!ids.length) return new Map();
  const { data, error } = await createClient().rpc('related_player_profiles', { p_ids: Array.from(new Set(ids)) });
  if (error) throw error;
  return new Map((data || []).map((player: RelatedPlayer) => [player.id, player]));
}

export async function matchProfiles(gameId: string): Promise<Map<string, RelatedPlayer>> {
  const { data, error } = await createClient().rpc('match_player_profiles', { p_game_id: gameId });
  if (error) throw error;
  return new Map((data || []).map((player: RelatedPlayer) => [player.id, player]));
}

export async function playerReviews(code: string) {
  const { data, error } = await createClient().rpc('player_reviews', { p_player_code: code });
  if (error) throw error;
  return (data || []) as import('../types').PlayerReview[];
}

export async function blockedPlayers(): Promise<{ name: string; player_id: string }[]> {
  const { data, error } = await createClient().rpc('my_blocked_players');
  if (error) throw error;
  return data || [];
}

export async function changePlayerBlock(code: string, block: boolean) {
  const { data, error } = await createClient().rpc('block_player_by_code', { p_player_code: code, p_block: block });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || 'Could not update block.');
}
