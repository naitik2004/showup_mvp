'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Flame, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SportCardData {
  id: string;
  name: string;
  emoji: string;
  formats: string;
  intensity: 'High' | 'Medium-High' | 'Extreme';
  activeGames: number;
  description: string;
  color: string;
}

const SPORTS_DATA: SportCardData[] = [
  {
    id: 'football',
    name: 'Football',
    emoji: '⚽',
    formats: '5v5 / 7v7 Turf & 11v11 Grass',
    intensity: 'High',
    activeGames: 42,
    description: 'Fast-paced turf games, weekend leagues, and casual evening kickabouts.',
    color: 'from-emerald-500/20 to-transparent border-emerald-500/30',
  },
  {
    id: 'badminton',
    name: 'Badminton',
    emoji: '🏸',
    formats: 'Singles & Doubles / Synthetic Courts',
    intensity: 'Extreme',
    activeGames: 38,
    description: 'Indoor wooden & synthetic court duels for all skill levels from beginner to club pros.',
    color: 'from-amber-500/20 to-transparent border-amber-500/30',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    emoji: '🏀',
    formats: '3v3 Half-Court & 5v5 Full-Court Runs',
    intensity: 'High',
    activeGames: 19,
    description: 'Outdoor street runs and indoor court pickup games with local ballers.',
    color: 'from-orange-500/20 to-transparent border-orange-500/30',
  },
  {
    id: 'cricket',
    name: 'Cricket',
    emoji: '🏏',
    formats: 'Box Cricket, Turf & Net Practice',
    intensity: 'Medium-High',
    activeGames: 34,
    description: 'Floodlit box cricket matches, tennis ball brawls, and serious leather net sessions.',
    color: 'from-blue-500/20 to-transparent border-blue-500/30',
  },
  {
    id: 'table_tennis',
    name: 'Table Tennis',
    emoji: '🏓',
    formats: '1v1 Matchplay & Round Robin',
    intensity: 'Medium-High',
    activeGames: 15,
    description: 'Club tournaments and office recreation room matches without the hassle.',
    color: 'from-rose-500/20 to-transparent border-rose-500/30',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    emoji: '🎾',
    formats: 'Singles Sets & Doubles Rallies',
    intensity: 'High',
    activeGames: 12,
    description: 'Clay, grass, and hard court tennis matches with partner matching by rating.',
    color: 'from-lime-500/20 to-transparent border-lime-500/30',
  },
];

export default function SportsShowcase() {
  return (
    <section id="sports" className="py-20 relative bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              6 CORE DISCIPLINES
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
              WHATEVER YOU PLAY, WE GOT THE COURT
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              Tap any sport to immediately load live games, upcoming weekend slots, and player rosters nearby.
            </p>
          </div>

          <Link href="/groups/create" className="shrink-0">
            <Button
              variant="outline"
              className="border-[#2A2A2E] bg-[#141418] hover:border-primary/50 text-cream rounded-xl font-bold h-11 px-5"
            >
              Host A New Match
            </Button>
          </Link>
        </div>

        {/* Sports Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPORTS_DATA.map((sport, index) => (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl p-6 bg-gradient-to-b ${sport.color} bg-[#111114] border hover:border-primary/60 transition-all shadow-lg group flex flex-col justify-between`}
            >
              <div>
                {/* Header with Emoji & Active counter */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-black/50 border border-[#2A2A2E] flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    {sport.emoji}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {sport.activeGames} Matches Live
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl text-cream mb-1">
                  {sport.name}
                </h3>
                <p className="text-xs text-primary font-semibold tracking-wide uppercase mb-3">
                  {sport.formats}
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {sport.description}
                </p>
              </div>

              {/* Bottom CTA to View Map */}
              <div className="pt-4 border-t border-[#2A2A2E]/70 flex items-center justify-between">
                <span className="text-[11px] text-cream/70 font-medium">
                  Intensity: <strong className="text-cream">{sport.intensity}</strong>
                </span>

                <Link href="/map">
                  <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                    Find Matches
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
