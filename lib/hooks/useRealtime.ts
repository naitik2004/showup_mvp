'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GameGroup } from '@/types';

interface RealtimeParams {
  onInsert?: (newGroup: GameGroup) => void;
  onUpdate?: (updatedGroup: GameGroup) => void;
  onDelete?: (deletedGroupId: string) => void;

  onMemberChange?: () => void;
}

export function useRealtime({ onInsert, onUpdate, onDelete, onMemberChange}: RealtimeParams) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('game_groups_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_groups' },
        async (payload) => {
          console.log('Realtime INSERT payload received:', payload);
          if (onInsert) {
            // Retrieve additional host profile details
            const { data: user } = await supabase
              .from('users')
              .select('name')
              .eq('id', payload.new.host_id)
              .maybeSingle();

            // Extract lat/lng coordinates from geography point (Well-Known Text or GeoJSON Point format)
            let coords = { lat: 0, lng: 0 };
            if (payload.new.location) {
              if (typeof payload.new.location === 'object' && payload.new.location.coordinates) {
                coords = {
                  lat: payload.new.location.coordinates[1],
                  lng: payload.new.location.coordinates[0],
                };
              }
            }

            const newGroupItem: GameGroup = {
              ...payload.new,
              location: coords,
              host_name: user?.name || 'Player',
              member_count: 1,
            } as any;

            onInsert(newGroupItem);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_groups' },
        (payload) => {
          console.log('Realtime UPDATE payload received:', payload);
          if (onUpdate) {
            let coords = { lat: 0, lng: 0 };
            if (payload.new.location) {
              if (typeof payload.new.location === 'object' && payload.new.location.coordinates) {
                coords = {
                  lat: payload.new.location.coordinates[1],
                  lng: payload.new.location.coordinates[0],
                };
              }
            }

            onUpdate({
              ...payload.new,
              location: coords,
            } as any);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'game_groups' },
        (payload) => {
          console.log('Realtime DELETE payload received:', payload);
          if (onDelete) {
            onDelete(payload.old.id);
          }
        }
      )
      .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
          },
          (payload) => {
            console.log('GROUP MEMBER EVENT');
            console.log(payload);

            onMemberChange?.();
          }
        )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, onInsert, onUpdate, onDelete,onMemberChange]);
}
