'use client';

import { motion } from 'framer-motion';
import { 
  Navigation, 
  Zap, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Clock, 
  Flame,
  Check
} from 'lucide-react';

const FEATURES = [
  {
    icon: Navigation,
    title: 'PostGIS Spatial Engine',
    description:
      'Pinpoint games within your exact walking or driving radius. Zero irrelevant listings from across the city.',
    tag: 'Accurate to the meter',
  },
  {
    icon: Zap,
    title: 'Instant Supabase Realtime',
    description:
      'Map markers, member joins, and chat messages update in real time with zero screen refreshes required.',
    tag: 'Sub-second sync',
  },
  {
    icon: MessageSquare,
    title: 'Private Lobby Group Chat',
    description:
      'Coordinate jerseys, bibs, and split turf charges without exchanging personal phone numbers or joining messy WhatsApp groups.',
    tag: 'Live Presence & Typing',
  },
  {
    icon: ShieldCheck,
    title: '3-Way Player Ratings',
    description:
      'Peer-reviewed skill, sportsmanship, and reliability scores. Flakes and last-minute dropouts are transparently flagged.',
    tag: 'No-show protection',
  },
  {
    icon: Users,
    title: 'Host Powers & Roster Control',
    description:
      'Hosts can start games, end matches, cancel cleanly, and kick disruptive players with one tap.',
    tag: 'Host Authority',
  },
  {
    icon: Sparkles,
    title: 'Instant Guest Browsing',
    description:
      'Jump right onto the live map without forced account creation. Sign in only when you are ready to claim a slot or host.',
    tag: 'Frictionless Entry',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-20 relative bg-[#0D0D10] border-t border-[#2A2A2E]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            BUILT FOR REAL ATHLETES
          </span>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
            ENGINEERED TO GET YOU ON THE PITCH
          </h2>
          <p className="text-muted-foreground text-base">
            Every feature is designed to eliminate the friction between wanting to play and actually showing up.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-[#141418] border border-[#2A2A2E] hover:border-primary/40 rounded-3xl p-6 sm:p-7 transition-all hover:bg-[#18181D] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:scale-105 group-hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(232,255,71,0.15)]">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-cream mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
