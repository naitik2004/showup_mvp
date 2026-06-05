'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GameGroup, SPORTS } from '@/types';

// Simple helper component to reactively center map when coordinates change
function ChangeMapCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useLeafletMap();
  useEffect(() => {
    if (center.lat && center.lng) {
      map.setView([center.lat, center.lng], 14);
    }
  }, [center, map]);
  return null;
}

interface MapViewProps {
  center: { lat: number; lng: number };
  groups: GameGroup[];
  onPinClick: (group: GameGroup) => void;
  userCoords: { lat: number; lng: number } | null;
}

export default function MapView({ center, groups, onPinClick, userCoords }: MapViewProps) {
  
  
  // Custom Icon for Game Pins (Snapchat Bubble style)
  const createGamePinIcon = (group: GameGroup) => {
    const sportInfo = SPORTS.find((s) => s.id === group.sport);
    const emoji = sportInfo?.emoji || '⚽';
    const memberCount = group.member_count || 1;
    const slots = Math.max(0, group.max_players - memberCount);
    const locationName = group.location_name || 'Game';

    return L.divIcon({
      html: `
        <div class="relative flex items-center bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#E8FF47]/80 text-[#F5F0E8] px-2.5 py-1.5 rounded-2xl shadow-xl animate-float transition-all cursor-pointer pointer-events-auto select-none">
          <span class="text-xl mr-1.5">${emoji}</span>
          <div class="flex flex-col text-left justify-center min-w-0">
            <span class="text-[10px] font-bold text-[#F5F0E8] truncate w-[85px] leading-tight">${locationName}</span>
            <span class="text-[9px] font-extrabold text-[#E8FF47] uppercase tracking-wider mt-0.5 leading-none">${slots} spots open</span>
          </div>
          <!-- Little bubble tail -->
          <div class="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1A1A1D] border-r border-b border-[#2A2A2E] rotate-45 z-[-1]"></div>
        </div>
      `,
      className: 'custom-game-pin',
      iconSize: [125, 45],
      iconAnchor: [62, 45],
    });
  };

  // Pulse icon for User Location marker
  const createUserLocationIcon = () => {
    return L.divIcon({
      html: `
        <div class="relative w-6 h-6 flex items-center justify-center">
          <div class="absolute w-full h-full rounded-full bg-[#E8FF47] opacity-100 animate-pulse-ring"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-[#E8FF47] border-2 border-[#0A0A0B] shadow-lg animate-pulse-dot"></div>
        </div>
      `,
      className: 'user-location-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <ChangeMapCenter center={center} />

        {/* User Current Location pin */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={createUserLocationIcon()} />
        )}

        {/* Game groups markers */}
        
        {groups
          .filter(
            (group) =>
              group.location &&
              typeof group.location.lat === 'number' &&
              typeof group.location.lng === 'number'
          )
          .map((group) => (
            <Marker
              key={group.id}
              position={[group.location.lat, group.location.lng]}
              icon={createGamePinIcon(group)}
              eventHandlers={{
                click: () => onPinClick(group),
              }}
            />
        ))}
        
      </MapContainer>
      
    </div>
  );
}
