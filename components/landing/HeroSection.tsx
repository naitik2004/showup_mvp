'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, ArrowRight, Zap, Shield, Users, Compass, Flame } from 'lucide-react';
import LiveRadarPreview from './LiveRadarPreview';
import { SPORTS } from '@/types';

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      {/* Background radial spotlights & subtle grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(232,255,71,0.08)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] blur-[90px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.04)_0%,transparent_70%)] blur-[90px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 240, 232, 0.4) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Tagline, CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Live Ticker Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1A1D] border border-primary/30 text-xs text-cream font-medium shadow-md"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-semibold text-primary">Live Now:</span>
              <span className="text-muted-foreground">Matches filling across Delhi, Mumbai & Bengaluru</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading font-black text-4xl sm:text-5xl xl:text-6xl text-cream tracking-tight leading-[1.08]"
            >
              FIND PLAYERS. <br />
              DROP A PIN. <br />
              <span className="text-primary italic underline decoration-primary/40 decoration-wavy decoration-2">
                SHOW UP.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              No more endless WhatsApp groups begging for a 10th player. Discover active pickup games in real-time, jump into match chats, and play your favorite sport today.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <Link href="/map" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-black text-base rounded-2xl h-14 px-8 shadow-[0_0_30px_rgba(232,255,71,0.35)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Compass className="w-5 h-5 stroke-[2.5]" />
                  <span>Launch Live Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/groups/create" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-[#2A2A2E] bg-[#1A1A1D]/90 hover:bg-[#2A2A2E] text-cream hover:text-primary font-bold text-base rounded-2xl h-14 px-7 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Host A Game</span>
                </Button>
              </Link>
            </motion.div>

            {/* Quick Sport Jumping Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-4 flex items-center justify-center lg:justify-start gap-2 flex-wrap"
            >
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mr-1">
                Filter by sport:
              </span>
              {SPORTS.map((sport) => (
                <Link
                  key={sport.id}
                  href={`/map`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1A1A1D]/80 hover:bg-[#2A2A2E] border border-[#2A2A2E] hover:border-primary/50 text-xs font-medium text-cream transition-all hover:scale-105"
                >
                  <span>{sport.emoji}</span>
                  <span>{sport.name}</span>
                </Link>
              ))}
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="pt-6 grid grid-cols-3 gap-4 border-t border-[#2A2A2E]/70 max-w-lg mx-auto lg:mx-0"
            >
              <div>
                <p className="font-heading font-black text-2xl sm:text-3xl text-cream">6</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Indian Metros</p>
              </div>
              <div>
                <p className="font-heading font-black text-2xl sm:text-3xl text-primary">&lt; 2 min</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Find A Match</p>
              </div>
              <div>
                <p className="font-heading font-black text-2xl sm:text-3xl text-cream">100%</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Free Pickups</p>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Interactive Radar Map Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 w-full"
          >
            <LiveRadarPreview />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
