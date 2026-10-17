'use client';

import { motion } from 'framer-motion';
import { MapPin, MessageSquare, Trophy, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    step: '01',
    title: 'Drop A Pin Or Scan Nearby',
    description:
      'Search your neighborhood turf or let our PostGIS geo-engine detect matches within 5km–50km. Need to host? Drop a pin in under 30 seconds.',
    icon: MapPin,
    accent: 'border-primary/40 bg-primary/10 text-primary',
    badge: 'Hyperlocal Radar',
    details: ['Interactive Leaflet map', 'Instant Nominatim address lookup', 'Filter by 6 core sports'],
  },
  {
    step: '02',
    title: 'Lock In Squad & Live Chat',
    description:
      'Players join with a single tap. Coordinate bibs, balls, and exact turf coordinates in real-time group chat with live presence and typing indicators.',
    icon: MessageSquare,
    accent: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    badge: 'Supabase Realtime',
    details: ['Live online member indicator', 'Instant messaging channel', 'Host controls & player kicking'],
  },
  {
    step: '03',
    title: 'Show Up & Build Your Rep',
    description:
      'Turn up on court, play competitive or casual games, and rate opponents and teammates on skill, reliability, and sportsmanship.',
    icon: Trophy,
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    badge: 'Vetted Community',
    details: ['3-way rating (Skill, Fair Play, Reliability)', 'Reliability scores filter no-shows', 'Add friends & track match history'],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 relative bg-[#0D0D10] border-y border-[#2A2A2E]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            Zero Friction
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
            HOW SHOWUP WORKS
          </h2>
          <p className="text-muted-foreground text-base">
            From discovering a turf to scoring the winner in three simple steps.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((stepItem, index) => {
            const Icon = stepItem.icon;
            return (
              <motion.div
                key={stepItem.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative flex flex-col justify-between bg-[#141418] border border-[#2A2A2E] hover:border-primary/50 rounded-3xl p-6 sm:p-8 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group"
              >
                <div>
                  {/* Top Bar with Step number & icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-heading font-black text-3xl text-primary/40 group-hover:text-primary transition-colors">
                      {stepItem.step}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${stepItem.accent} shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-[#1A1A1D] px-2.5 py-1 rounded-full border border-[#2A2A2E] mb-3">
                    {stepItem.badge}
                  </span>

                  <h3 className="font-heading font-bold text-xl text-cream mb-3">
                    {stepItem.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {stepItem.description}
                  </p>
                </div>

                {/* Bullet details */}
                <div className="pt-4 border-t border-[#2A2A2E]/60 space-y-2">
                  {stepItem.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2 text-xs text-cream/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Callout */}
        <div className="mt-12 text-center">
          <Link href="/map">
            <Button className="bg-primary text-black hover:bg-primary/90 font-bold rounded-2xl h-12 px-6 shadow-[0_0_20px_rgba(232,255,71,0.25)] gap-2">
              <span>Ready To Play? Browse Matches Near You</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
