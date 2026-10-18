'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Compass, UserPlus, Calendar } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '@/data/mock';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'matches' | 'requests'>('all');
  // TODO: connect backend — this activity feed is reference-inspired static data.

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

        {/* Static sample activity feed */}
        {MOCK_NOTIFICATIONS.filter((item) => filter === 'all' || (filter === 'matches' ? item.kind === 'match' : item.kind === 'friend')).map((item) => (
          <article key={item.id} className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-5 flex items-start gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {item.kind === 'match' ? <Calendar className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div><h3 className="font-heading font-black text-lg text-cream">{item.title}</h3><p className="text-sm text-muted-foreground">{item.detail}</p><span className="text-[10px] uppercase tracking-widest text-primary">Sample notification</span></div>
          </article>
        ))}
      </main>
    </div>
  );
}
