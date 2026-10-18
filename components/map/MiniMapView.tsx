'use client';

import { useState } from 'react';

interface MiniMapViewProps {
  initialCenter: { lat: number; lng: number };
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
}

export default function MiniMapView({ initialCenter, onCoordsChange }: MiniMapViewProps) {
  const [position, setPosition] = useState(initialCenter);
  const [pin, setPin] = useState({ x: 50, y: 50 });
  const placePin = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(8, Math.min(92, ((event.clientY - bounds.top) / bounds.height) * 100));
    const coords = { lat: initialCenter.lat + (50 - y) * 0.0008, lng: initialCenter.lng + (x - 50) * 0.0008 };
    setPin({ x, y });
    setPosition(coords);
    onCoordsChange(coords);
  };

  return <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-muted relative z-0 cursor-crosshair bg-[#183d32]" onPointerDown={placePin} role="application" aria-label="Choose a sample map location">
    <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'linear-gradient(35deg, transparent 45%, #f3efe4 46%, #f3efe4 47%, transparent 48%),linear-gradient(145deg, transparent 40%, #f3efe4 41%, #f3efe4 42%, transparent 43%),linear-gradient(90deg, transparent 70%, #d8f03c 71%, #d8f03c 72%, transparent 73%),linear-gradient(0deg, transparent 25%, #f3efe4 26%, #f3efe4 27%, transparent 28%)', backgroundSize: '300px 200px, 360px 240px, 280px 280px, 320px 250px' }} />
    <span className="absolute -translate-x-1/2 -translate-y-full text-3xl drop-shadow-md" style={{ left: `${pin.x}%`, top: `${pin.y}%` }} aria-label="Selected location">📍</span>
    <span className="absolute bottom-2 left-2 rounded-lg bg-[#111114]/90 px-2 py-1 text-[10px] text-cream">Tap map to place pin · {position.lat.toFixed(3)}, {position.lng.toFixed(3)}</span>
  </div>;
}
