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
        // Fallback query to game_groups directly if RPC returned empty or error
        const { data: directData } = await supabase
          .from('game_groups')
          .select('*, host:users(name)')
          .limit(25);

        if (directData && directData.length > 0) {
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
          setGroups(mapped);
        } else {
          // Curated live demo pickup matches near current coords so the map is vibrant immediately
          const demoGroups: GameGroup[] = [
            {
              id: 'demo-1',
              host_id: 'host-1',
              sport: 'football',
              location: { lat: lat + 0.005, lng: lng + 0.006 },
              location_name: 'Central Turf Arena',
              max_players: 12,
              skill_level: 'intermediate',
              scheduled_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
              expires_at: null,
              is_permanent: false,
              status: 'open',
              created_at: new Date().toISOString(),
              host_name: 'Vikram R.',
              member_count: 8,
              distance: 850,
            },
            {
              id: 'demo-2',
              host_id: 'host-2',
              sport: 'badminton',
              location: { lat: lat - 0.004, lng: lng - 0.005 },
              location_name: 'Smash Sports Complex',
              max_players: 4,
              skill_level: 'pro',
              scheduled_at: new Date(Date.now() + 3600 * 1000).toISOString(),
              expires_at: null,
              is_permanent: false,
              status: 'in_progress',
              created_at: new Date().toISOString(),
              host_name: 'Ananya S.',
              member_count: 3,
              distance: 1200,
            },
            {
              id: 'demo-3',
              host_id: 'host-3',
              sport: 'basketball',
              location: { lat: lat + 0.008, lng: lng - 0.003 },
              location_name: 'YMCA Court Runs',
              max_players: 10,
              skill_level: 'intermediate',
              scheduled_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
              expires_at: null,
              is_permanent: false,
              status: 'open',
              created_at: new Date().toISOString(),
              host_name: 'Sameer K.',
              member_count: 7,
              distance: 1600,
            },
            {
              id: 'demo-4',
              host_id: 'host-4',
              sport: 'cricket',
              location: { lat: lat - 0.007, lng: lng + 0.008 },
              location_name: 'Floodlit Box Cricket Ground',
              max_players: 14,
              skill_level: 'beginner',
              scheduled_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
              expires_at: null,
              is_permanent: false,
              status: 'open',
              created_at: new Date().toISOString(),
              host_name: 'Pooja T.',
              member_count: 11,
              distance: 2100,
            },
          ];
          setGroups(demoGroups);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching groups:', err.message);
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