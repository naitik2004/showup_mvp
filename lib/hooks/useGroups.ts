'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GameGroup } from '@/types';

export function useGroups(
  lat: number,
  lng: number,
  radiusMeters: number = 50000
) {
  const supabase = useMemo(() => createClient(), []);

  const [groups, setGroups] = useState<GameGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setLoading(true);
    setError(null);

    try { 
      // Auto-start games whose scheduled time has arrived (silent fail if table not yet created)
      try {
        await supabase
          .from('game_groups')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('status', 'open')
          .lte('scheduled_at', new Date().toISOString());

        await supabase
          .from('game_groups')
          .update({
            status: 'expired',
          })
          .eq('status', 'in_progress')
          .lte(
            'started_at',
            new Date(Date.now() - 60 * 60 * 1000).toISOString()
          );
      } catch (e) {
        // Ignore table updates if not initialized yet
      }
        
      const { data, error: fetchError } = await supabase.rpc(
        'find_groups_near',
        {
          lat,
          lng,
          radius_meters: radiusMeters,
        }
      );

      if (!fetchError && data && data.length > 0) {
        const mapped: GameGroup[] = data.map((item: any) => ({
          ...item,
          location: {
            lat: Number(item.lat_out || (item.location && item.location.coordinates ? item.location.coordinates[1] : lat)),
            lng: Number(item.lng_out || (item.location && item.location.coordinates ? item.location.coordinates[0] : lng)),
          },
        }));
        setGroups(mapped);
      } else {
        // The RPC may be unavailable in a fresh backend. Fall back to real rows
        // from the groups table, never to fabricated matches.
        const { data: directData, error: directError } = await supabase
          .from('game_groups')
          .select('*, host:users(name)')
          .limit(25);

        if (directError) {
          throw directError;
        }

        if (directData) {
          const mapped: GameGroup[] = directData.map((item: any) => {
            let coords = { lat, lng };
            if (item.location && item.location.coordinates) {
              coords = { lat: item.location.coordinates[1], lng: item.location.coordinates[0] };
            }
            return {
              ...item,
              location: coords,
              host_name: item.host?.name || 'Player',
              member_count: item.member_count || 1,
            };
          });
          const radians = (degrees: number) => (degrees * Math.PI) / 180;
          const nearby = mapped.filter((group) => {
            if (!['open', 'in_progress'].includes(group.status)) return false;
            const dLat = radians(group.location.lat - lat);
            const dLng = radians(group.location.lng - lng);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(group.location.lat)) * Math.sin(dLng / 2) ** 2;
            return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusMeters;
          });
          if (fetchError && nearby.length === 0) {
            setError(fetchError.message || 'Nearby games could not be loaded.');
          }
          setGroups(nearby);
        } else {
          setGroups([]);
          if (fetchError) setError(fetchError.message || 'Nearby games could not be loaded.');
        }
      }
    } catch (err: any) {
      console.warn('Error fetching groups:', err.message);
      setGroups([]);
      setError(err?.message || 'Nearby games could not be loaded.');
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
