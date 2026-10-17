'use client';

import Link from 'next/link';
import { Zap, Heart, MapPin, Compass, Plus, Users, Bell, User } from 'lucide-react';
import { SPORTS, CITIES } from '@/types';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0B] border-t border-[#2A2A2E] pt-16 pb-12 text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#2A2A2E]/60">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(232,255,71,0.2)]">
                <Zap className="w-5 h-5 fill-primary" />
              </div>
              <span className="font-heading font-black text-2xl text-cream tracking-tight">
                ShowUp
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The sports social network for urban India. Drop a pin on a live radar, assemble nearby players in real-time, and show up to play.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live in 6 Metros
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                v0.1.0 MVP
              </span>
            </div>
          </div>

          {/* Quick App Navigation */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-cream uppercase tracking-wider">
              Application
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/map" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-primary" />
                  Live Match Map
                </Link>
              </li>
              <li>
                <Link href="/groups/create" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Host A Match
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  Notifications
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Player Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-primary transition-colors">
                  Player Onboarding
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Sports */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-cream uppercase tracking-wider">
              Sports
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {SPORTS.map((sport) => (
                <li key={sport.id}>
                  <Link href="/map" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>{sport.emoji}</span>
                    <span>{sport.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Metros */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-cream uppercase tracking-wider">
              Active Cities
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link href="/map" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{city}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} ShowUp Social Sports. All rights reserved.</p>
          <p className="flex items-center gap-1 text-cream/70">
            Built with athletic precision for urban India.
          </p>
        </div>
      </div>
    </footer>
  );
}
