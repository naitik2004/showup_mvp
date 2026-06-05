'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useMap } from '@/lib/hooks/useMap';
import { useGroups } from '@/lib/hooks/useGroups';
import { useRealtime } from '@/lib/hooks/useRealtime';
import { useAuth } from '@/lib/hooks/useAuth';
import FilterBar from '@/components/map/FilterBar';
import CreateGroupFAB from '@/components/map/CreateGroupFAB';
import LocationPermissionPrompt from '@/components/map/LocationPermissionPrompt';
import GroupBottomSheet from '@/components/groups/GroupBottomSheet';
import { Sport, GameGroup } from '@/types';

// Dynamically import MapView to prevent SSR failures (Leaflet relies on global window)
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0B] space-y-4">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Loading Map...</p>
    </div>
  ),
});

const refreshGroups = async () => {
  window.location.reload();
};

export default function MapPage() {
  const { sessionUser } = useAuth();
  const { coords, permissionDenied, requestLocation } = useMap();
  const { groups, setGroups } = useGroups(coords.lat, coords.lng);
  
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all');
  const [activeGroup, setActiveGroup] = useState<GameGroup | null>(null);

  // Initialize Supabase Realtime subscriptions
  useRealtime({
    onMemberChange: refreshGroups,
    onInsert: (newGroup) => {
      setGroups((prev) => {
        // Prevent duplicate pins
        if (prev.some((g) => g.id === newGroup.id)) return prev;
        return [newGroup, ...prev];
      });
    },
    onUpdate: (updatedGroup) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g))
      );
      setActiveGroup((prev) => {
        if (prev && prev.id === updatedGroup.id) {
          return { ...prev, ...updatedGroup };
        }
        return prev;
      });
    },
    onDelete: (deletedGroupId) => {
      setGroups((prev) => prev.filter((g) => g.id !== deletedGroupId));
      setActiveGroup((prev) => (prev && prev.id === deletedGroupId ? null : prev));
    },
  });

  const filteredGroups = useMemo(() => {
    if (selectedSport === 'all') return groups;
    return groups.filter((g) => g.sport === selectedSport);
  }, [groups, selectedSport]);

  const handleJoinSuccess = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, member_count: (g.member_count || 1) + 1 }
          : g
      )
    );
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0A0A0B]">
      {permissionDenied && (
        <LocationPermissionPrompt onRequest={requestLocation} />
      )}

      <MapView
        center={coords}
        groups={filteredGroups}
        onPinClick={(group) => setActiveGroup(group)}
        userCoords={permissionDenied ? null : coords}
      />

      <FilterBar selectedSport={selectedSport} onChange={setSelectedSport} />
      <CreateGroupFAB />

      {activeGroup && (
        <GroupBottomSheet
          group={activeGroup}
          onClose={() => setActiveGroup(null)}
          userId={sessionUser?.id}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </main>
  );
}
