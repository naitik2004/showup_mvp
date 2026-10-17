'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Calendar, Clock, ArrowRight, ShieldCheck, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewGame {
  id: string;
  sport: string;
  name: string;
  emoji: string;
  locationName: string;
  city: string;
  time: string;
  date: string;
  host: string;
  joinedCount: number;
  maxPlayers: number;
  skill: 'Beginner' | 'Intermediate' | 'Pro';
  isLive: boolean;
  xPercent: number; // position on preview radar
  yPercent: number;
}

const SAMPLE_GAMES: PreviewGame[] = [
  {
    id: '1',
    sport: 'football',
    name: 'Evening 7v7 Turf Run',
    emoji: '⚽',
    locationName: 'Siri Fort Sports Complex',
    city: 'Delhi NCR',
    time: '8:00 PM Tonight',
    date: 'Today',
    host: 'Arjun M.',
    joinedCount: 12,
    maxPlayers: 14,
    skill: 'Intermediate',
    isLive: false,
    xPercent: 32,
    yPercent: 42,
  },
  {
    id: '2',
    sport: 'badminton',
    name: 'High Intensity Doubles',
    emoji: '🏸',
    locationName: 'Play Arena, Sarjapur',
    city: 'Bengaluru',
    time: 'LIVE MATCH',
    date: 'Right Now',
    host: 'Kavya S.',
    joinedCount: 3,
    maxPlayers: 4,
    skill: 'Pro',
    isLive: true,
    xPercent: 68,
    yPercent: 35,
  },
  {
    id: '3',
    sport: 'basketball',
    name: 'Full Court Pickup Run',
    emoji: '🏀',
    locationName: 'St. Andrews Court, Bandra',
    city: 'Mumbai',
    time: '7:30 PM Today',
    date: 'Today',
    host: 'Rohan D.',
    joinedCount: 8,
    maxPlayers: 10,
    skill: 'Intermediate',
    isLive: false,
    xPercent: 50,
    yPercent: 70,
  },
  {
    id: '4',
    sport: 'cricket',
    name: 'Weekend Leather Ball Nets',
    emoji: '🏏',
    locationName: 'Gymkhana Turf Grounds',
    city: 'Pune',
    time: '6:30 AM Tomorrow',
    date: 'Tomorrow',
    host: 'Dev K.',
    joinedCount: 10,
    maxPlayers: 12,
    skill: 'Beginner',
    isLive: false,
    xPercent: 78,
    yPercent: 65,
  },
];

export default function LiveRadarPreview() {
  const [selectedGame, setSelectedGame] = useState<PreviewGame>(SAMPLE_GAMES[1]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#2A2A2E] bg-[#111114]/90 backdrop-blur-xl shadow-2xl p-4 sm:p-6">
      {/* Top Header of radar mockup */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2E]/80 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-cream uppercase tracking-widest flex items-center gap-1.5">
            <span className="text-primary font-black">SHOWUP RADAR</span>
            <span className="text-muted-foreground">•</span>
            <span>HYPERLOCAL MATCH DISCOVERY</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
            📍 50km Live Radius
          </span>
          <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full hidden sm:inline-block">
            ⚡ Realtime Sync
          </span>
        </div>
      </div>

      {/* Main Interactive Radar Area */}
      <div className="relative h-[340px] sm:h-[400px] w-full mt-4 rounded-2xl overflow-hidden bg-[#0A0A0B] border border-[#2A2A2E]/60 flex items-center justify-center">
        {/* Radar concentric circular guides */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-full border border-primary/20 border-dashed animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full border border-[#2A2A2E]" />
          <div className="absolute w-[320px] h-[320px] sm:w-[410px] sm:h-[410px] rounded-full border border-primary/10" />
          {/* Radar axis lines */}
          <div className="absolute w-full h-[1px] bg-[#2A2A2E]/60" />
          <div className="absolute h-full w-[1px] bg-[#2A2A2E]/60" />
          {/* Subtle sweep gradient */}
          <div className="absolute w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(232,255,71,0.06)_60deg,transparent_90deg)] animate-[spin_8s_linear_infinite]" />
        </div>

        {/* User Centered Location Marker */}
        <div className="absolute z-20 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center shadow-[0_0_20px_#E8FF47]">
              <div className="w-2 h-2 rounded-full bg-black" />
            </div>
            <div className="absolute w-10 h-10 rounded-full border border-primary/40 animate-ping pointer-events-none" />
          </div>
          <span className="text-[10px] font-bold text-cream/90 bg-[#1A1A1D]/90 border border-[#2A2A2E] px-2 py-0.5 rounded-full mt-1.5 shadow-md">
            You Are Here
          </span>
        </div>

        {/* Interactive Game Pins */}
        {SAMPLE_GAMES.map((game) => {
          const isSelected = selectedGame.id === game.id;
          const slotsLeft = game.maxPlayers - game.joinedCount;

          return (
            <motion.button
              key={game.id}
              onClick={() => setSelectedGame(game)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                left: `${game.xPercent}%`,
                top: `${game.yPercent}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all cursor-pointer group`}
            >
              {game.isLive ? (
                <div className="relative">
                  <div className="absolute -top-3 -right-2 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse z-40">
                    LIVE
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all shadow-xl ${
                      isSelected
                        ? 'bg-[#1A1A1D] border-red-500 ring-4 ring-red-500/30'
                        : 'bg-[#1A1A1D]/95 border-red-500/80 hover:border-red-400'
                    }`}
                  >
                    <span className="text-lg">{game.emoji}</span>
                    <div className="text-left leading-tight hidden xs:block">
                      <span className="block text-[11px] font-bold text-cream truncate max-w-[80px]">
                        {game.locationName.split(',')[0]}
                      </span>
                      <span className="block text-[9px] text-red-400 font-extrabold uppercase">
                        1 slot left!
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shadow-lg ${
                    isSelected
                      ? 'bg-primary border-primary text-black font-bold ring-4 ring-primary/30'
                      : 'bg-[#1A1A1D]/90 border-[#2A2A2E] text-cream hover:border-primary/60'
                  }`}
                >
                  <span className="text-lg">{game.emoji}</span>
                  <div className="text-left leading-tight hidden xs:block">
                    <span
                      className={`block text-[11px] font-bold truncate max-w-[80px] ${
                        isSelected ? 'text-black' : 'text-cream'
                      }`}
                    >
                      {game.locationName.split(',')[0]}
                    </span>
                    <span
                      className={`block text-[9px] font-semibold ${
                        isSelected ? 'text-black/80' : 'text-primary'
                      }`}
                    >
                      {slotsLeft} spots left
                    </span>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Floating Selected Game Preview Card at Bottom */}
      <AnimatePresence mode="wait">
        {selectedGame && (
          <motion.div
            key={selectedGame.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-black/60 border border-[#2A2A2E] flex items-center justify-center text-2xl shrink-0 shadow-inner">
                {selectedGame.emoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-heading font-bold text-base text-cream truncate">
                    {selectedGame.name}
                  </h4>
                  {selectedGame.isLive ? (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      MATCH IN PROGRESS
                    </span>
                  ) : (
                    <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedGame.skill}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-cream/90 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {selectedGame.locationName} ({selectedGame.city})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cream/60" />
                    {selectedGame.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <strong className="text-primary">{selectedGame.joinedCount}/{selectedGame.maxPlayers}</strong> joined
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Link href="/map" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold rounded-xl h-10 px-4 text-xs gap-1.5 shadow-[0_0_15px_rgba(232,255,71,0.2)]">
                  <span>View On Live Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
