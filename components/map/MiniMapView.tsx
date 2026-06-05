'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Help center mini map when location updates
function CenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useLeafletMap();
  useEffect(() => {
    if (center.lat && center.lng) {
      map.setView([center.lat, center.lng], 15);
    }
  }, [center, map]);
  return null;
}

interface MiniMapViewProps {
  initialCenter: { lat: number; lng: number };
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
}

export default function MiniMapView({ initialCenter, onCoordsChange }: MiniMapViewProps) {
  const [position, setPosition] = useState(initialCenter);
  useEffect(() => {
    setPosition(initialCenter);
  }, [initialCenter]);
  const markerRef = useRef<any>(null);

  const dragHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onCoordsChange({ lat: newPos.lat, lng: newPos.lng });
        }
      },
    }),
    [onCoordsChange]
  );

  const customPinIcon = L.divIcon({
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <!-- Floating Marker -->
        <span class="text-3xl filter drop-shadow-md select-none transform hover:scale-110 active:scale-95 transition-all">📍</span>
      </div>
    `,
    className: 'draggable-marker-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return (
    <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-muted relative z-0">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <CenterMap center={initialCenter} />
        <Marker
          draggable={true}
          eventHandlers={dragHandlers}
          position={[position.lat, position.lng]}
          icon={customPinIcon}
          ref={markerRef}
        />
      </MapContainer>
    </div>
  );
}
