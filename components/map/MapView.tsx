'use client';

import type { GameGroup } from '@/types';
import { SPORTS } from '@/types';

interface MapViewProps {
  center: { lat: number; lng: number };
  groups: GameGroup[];
  onPinClick: (group: GameGroup) => void;
  userCoords: { lat: number; lng: number } | null;
}

export default function MapView({ groups, onPinClick }: MapViewProps) {
  return (
    <div className="w-full h-full relative z-0 overflow-hidden bg-[#183d32]" aria-label="Static map preview">
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(29deg, transparent 47%, #f3efe4 48%, #f3efe4 49%, transparent 50%),linear-gradient(145deg, transparent 43%, #f3efe4 44%, #f3efe4 45%, transparent 46%),linear-gradient(90deg, transparent 64%, #d8f03c 65%, #d8f03c 66%, transparent 67%),linear-gradient(0deg, transparent 28%, #f3efe4 29%, #f3efe4 30%, transparent 31%)', backgroundSize: '430px 300px, 520px 360px, 390px 440px, 480px 340px' }} />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 28%, #9bba78 0 12%, transparent 12.5%),radial-gradient(ellipse at 76% 68%, #9bba78 0 15%, transparent 15.5%),radial-gradient(ellipse at 52% 16%, #9bba78 0 8%, transparent 8.5%)' }} />
      <div className="absolute inset-0">
        {groups.map((group, index) => {
          const sport = SPORTS.find((item) => item.id === group.sport);
          const x = 18 + (index * 17 % 68);
          const y = 22 + (index * 23 % 58);
          const spots = Math.max(0, group.max_players - (group.member_count || 0));
          return <button key={group.id} onClick={() => onPinClick(group)} className="absolute rounded-2xl border border-[#2A2A2E] bg-[#1A1A1D] text-cream px-3 py-2 shadow-xl hover:border-primary/80" style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${sport?.name || group.sport}, ${group.location_name}`}>
            <span className="flex items-center gap-2"><span className="text-xl">{sport?.emoji || '⚽'}</span><span className="text-left"><b className="block text-[10px] truncate max-w-24">{group.location_name}</b><small className="text-primary text-[9px] font-bold uppercase">{spots} spots open</small></span></span>
          </button>;
        })}
      </div>
      <div className="absolute bottom-4 left-4 rounded-xl bg-[#111114]/90 px-3 py-2 text-xs text-cream border border-[#2A2A2E]">Sample map · Delhi NCR</div>
    </div>
  );
}
