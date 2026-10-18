'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Match, toGroup } from '@/lib/matches';
import { useAuth } from './useAuth';
export function useGroups(_lat?: number, _lng?: number) {
 const client = useMemo(() => createClient(), []);
 const { sessionUser } = useAuth();
 const [matches, setMatches] = useState<Match[]>([]);
 const [myIds, setMyIds] = useState<string[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const refetch = useCallback(async () => {
  if (!sessionUser) { setMatches([]); setMyIds([]); setLoading(false); return; }
  const [games, memberships] = await Promise.all([
   client.from('games_with_counts').select('*').order('starts_at'),
   client.from('game_members').select('game_id').eq('user_id', sessionUser.id),
  ]);
  setError(games.error?.message || memberships.error?.message || null);
  if (games.data) setMatches(games.data as Match[]);
  if (memberships.data) setMyIds(memberships.data.map(row => row.game_id));
  setLoading(false);
 }, [client, sessionUser?.id]);
 useEffect(() => {
  let active = true;
  const refresh = () => { if (active) void refetch(); };
  refresh();
  const channel = client.channel(`board:${sessionUser?.id || 'guest'}`)
   .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, refresh)
   .on('postgres_changes', { event: '*', schema: 'public', table: 'game_members' }, refresh)
   .subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });
  window.addEventListener('online', refresh);
  window.addEventListener('focus', refresh);
  return () => { active = false; void client.removeChannel(channel); window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh); };
 }, [client, refetch]);
 return { matches, groups: matches.map(toGroup), myIds, loading, error, refetch };
}
