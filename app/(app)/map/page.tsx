'use client';

import { useState, useMemo } from 'react';
import { useGroups } from '@/lib/hooks/useGroups';
import { useAuth } from '@/lib/hooks/useAuth';
import FilterBar from '@/components/map/FilterBar';
import CreateGroupFAB from '@/components/map/CreateGroupFAB';
import MapView from '@/components/map/MapView';
import GroupBottomSheet from '@/components/groups/GroupBottomSheet';
import MapHeader from '@/components/map/MapHeader';
import { Sport, GameGroup } from '@/types';

const center = { lat: 28.6139, lng: 77.209 };

export default function MapPage() {
  const { sessionUser } = useAuth();
  const { groups } = useGroups();
  
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all');
  const [activeGroup, setActiveGroup] = useState<GameGroup | null>(null);

  const filteredGroups = useMemo(() => {
    if (selectedSport === 'all') return groups;
    return groups.filter((g) => g.sport === selectedSport);
  }, [groups, selectedSport]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0A0A0B]">
      <MapHeader userId={sessionUser?.id} />

      <MapView
        center={center}
        groups={filteredGroups}
        onPinClick={(group) => setActiveGroup(group)}
        userCoords={center}
      />

      <FilterBar selectedSport={selectedSport} onChange={setSelectedSport} />
      <CreateGroupFAB />

      {activeGroup && (
        <GroupBottomSheet
          group={activeGroup}
          onClose={() => setActiveGroup(null)}
          userId={sessionUser?.id}
          onJoinSuccess={() => undefined}
        />
      )}
    </main>
  );
}
