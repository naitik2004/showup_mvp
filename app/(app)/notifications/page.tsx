'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Calendar, UserPlus, Zap, Check, Compass } from 'lucide-react';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'matches' | 'requests'>('all');

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-cream flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[#2A2A2E] bg-[#111114]/80 backdrop-blur-md px-4 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Link href="/map">
            <Button variant="ghost" size="icon" className="text-cream hover:bg-[#1A1A1D]">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Button>
          </Link>
          <span className="font-heading font-black text-base text-cream">Activity & Alerts</span>
        </div>

        <Link href="/map">
          <Button size="sm" className="bg-primary text-black font-bold rounded-xl text-xs h-9 gap-1 shadow-md">
            <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Live Map</span>
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* Filter Pills */}
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'all'
                ? 'bg-primary text-black shadow-md'
                : 'bg-[#141418] border border-[#2A2A2E] text-muted-foreground hover:text-cream'
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setFilter('matches')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'matches'
                ? 'bg-primary text-black shadow-md'
                : 'bg-[#141418] border border-[#2A2A2E] text-muted-foreground hover:text-cream'
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setFilter('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'requests'
                ? 'bg-primary text-black shadow-md'
                : 'bg-[#141418] border border-[#2A2A2E] text-muted-foreground hover:text-cream'
            }`}
          >
            Requests
          </button>
        </div>

        {/* Empty State / Feed */}
        <div className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-inner">
            <Bell className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-cream">
              You're All Caught Up
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Match updates, join notifications, and player friend requests will notify you right here.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/map">
              <Button className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl px-5 h-11 shadow-[0_0_20px_rgba(232,255,71,0.25)] gap-2">
                <Compass className="w-4 h-4 stroke-[2.5]" />
                <span>Find Matches Nearby</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
