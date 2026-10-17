'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, ArrowRight, Users, Flame } from 'lucide-react';
import { CITIES } from '@/types';

const CITY_DETAILS = [
  {
    name: 'Delhi NCR',
    hotspots: 'Siri Fort, Gurgaon Sector 29, Noida Turfs',
    turfs: '68+ Verified Venues',
    popularSport: 'Football & Cricket ⚽🏏',
  },
  {
    name: 'Bengaluru',
    hotspots: 'Play Arena, HSR Layout, Koramangala 4th Block',
    turfs: '85+ Verified Venues',
    popularSport: 'Badminton & Football 🏸⚽',
  },
  {
    name: 'Mumbai',
    hotspots: 'St. Andrews Bandra, Shivaji Park, Andheri West',
    turfs: '72+ Verified Venues',
    popularSport: 'Football & Box Cricket ⚽🏏',
  },
  {
    name: 'Pune',
    hotspots: 'Viman Nagar, Koregaon Park, Balewadi Stadium',
    turfs: '38+ Verified Venues',
    popularSport: 'Basketball & Badminton 🏀🏸',
  },
  {
    name: 'Hyderabad',
    hotspots: 'Gachibowli, Jubilee Hills, Madhapur Courts',
    turfs: '44+ Verified Venues',
    popularSport: 'Badminton & Cricket 🏸🏏',
  },
  {
    name: 'Chennai',
    hotspots: 'Besant Nagar, OMR Turfs, Anna Nagar Sports Hub',
    turfs: '35+ Verified Venues',
    popularSport: 'Football & Tennis ⚽🎾',
  },
];

export default function CityCoverage() {
  return (
    <section id="cities" className="py-20 relative bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            METRO COMMUNITY HUBS
          </span>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
            ACTIVE IN 6 MAJOR INDIAN SPORTS HUBS
          </h2>
          <p className="text-muted-foreground text-base">
            Find games happening within minutes of your home or office across India's top sporting communities.
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CITY_DETAILS.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-[#141418] border border-[#2A2A2E] hover:border-primary/50 rounded-3xl p-6 transition-all hover:bg-[#18181D] group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-cream group-hover:text-primary transition-colors">
                    {city.name}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground mb-5">
                <p>
                  <strong className="text-cream/90">Popular Venues:</strong> {city.hotspots}
                </p>
                <p>
                  <strong className="text-cream/90">Top Picks:</strong> {city.popularSport}
                </p>
                <p className="text-primary font-semibold">
                  {city.turfs}
                </p>
              </div>

              <Link
                href="/map"
                className="flex items-center justify-between pt-3 border-t border-[#2A2A2E]/70 text-xs font-bold text-cream group-hover:text-primary transition-colors"
              >
                <span>View Live Matches In {city.name}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
