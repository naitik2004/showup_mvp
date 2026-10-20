import { createClient } from '@/lib/supabase/client';
export async function updateHostedMatch(id: string, form: FormData) {
  const { error } = await createClient().rpc('update_hosted_game', {
    p_game_id: id, p_title: String(form.get('title')), p_venue: String(form.get('venue')),
    p_starts_at: new Date(String(form.get('starts_at'))).toISOString(),
    p_max_players: Number(form.get('max_players')), p_notes: String(form.get('notes')),
  });
  if (error) throw error;
}
export async function deleteHostedMatch(id: string) {
  const { error } = await createClient().rpc('delete_hosted_game', { p_game_id: id });
  if (error) throw error;
}
