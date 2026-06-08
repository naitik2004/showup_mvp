'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GameGroup } from '@/types';

export function useGroups(
  lat: number,
  lng: number,
  radiusMeters: number = 50000
) {
  const supabase = createClient();

  const [groups, setGroups] = useState<GameGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try { 

      // Auto-start games whose scheduled time has arrived
      await supabase
        .from('game_groups')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('status', 'open')
        .lte('scheduled_at', new Date().toISOString());


      // Auto-expire games 1 hour after they started
      await supabase
        .from('game_groups')
        .update({
          status: 'expired',
        })
        .eq('status', 'in_progress')
        .lte(
          'started_at',
          new Date(
            Date.now() - 60 * 60 * 1000
          ).toISOString()
        );
        
      const { data, error: fetchError } = await supabase.rpc(
        'find_groups_near',
        {
          lat,
          lng,
          radius_meters: radiusMeters,
        }
      );

      if (fetchError) {
        throw fetchError;
      }

      const mapped: GameGroup[] = (data || []).map((item: any) => ({
        ...item,
        location: {
          lat: Number(item.lat_out),
          lng: Number(item.lng_out),
        },
      }));

      setGroups(mapped);
    } catch (err: any) {
      console.error('Error fetching nearby groups:', err);
      setError(err.message || 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, lat, lng, radiusMeters]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    setGroups,
    loading,
    error,
    refetch: fetchGroups,
  };
}