'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Star, Quote, ChevronDown, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TESTIMONIALS = [
  {
    quote:
      'I moved to Bengaluru for work and had zero friends to play football with. In my first week on ShowUp, I joined a Tuesday night 7v7 in HSR and now play three times every single week.',
    author: 'Raghav Verma',
    role: 'Footballer & Tech Lead',
    city: 'Bengaluru',
    sport: '⚽ Football',
    rating: 5,
  },
  {
    quote:
      'Finding 4 decent players for badminton doubles used to take 2 days of spamming WhatsApp groups. Now I just drop a pin at Play Arena with 2 spots open, and it fills up in 15 minutes.',
    author: 'Neha Sundaram',
    role: 'Badminton Enthusiast',
    city: 'Hyderabad',
    sport: '🏸 Badminton',
    rating: 5,
  },
  {
    quote:
      'The reliability rating is a game-changer. People actually show up on time because they know bad ratings will lock them out of competitive weekend runs.',
    author: 'Kabir Malhotra',
    role: 'Club Basketballer',
    city: 'Mumbai',
    sport: '🏀 Basketball',
    rating: 5,
  },
];

const FAQS = [
  {
    q: 'Is ShowUp free to use?',
    a: 'Yes, completely free. You can browse nearby matches, host pickup games, and join player rosters without paying any subscription or platform fee. If a match is hosted at a private turf or paid court, the group coordinates splitting the turf fee equally via the lobby chat.',
  },
  {
    q: 'How does the live map work?',
    a: 'ShowUp utilizes HTML5 Geolocation and PostGIS spatial indexing. It detects active matches within a customizable radius (5km to 50km) and plots them with sports icons, open player slots, and live game badges.',
  },
  {
    q: 'What happens if a player signs up but fails to show up?',
    a: 'ShowUp features post-game peer ratings covering Skill, Sportsmanship, and Reliability. Hosts and fellow players can report no-shows, which reduces their reliability score. Players with low reliability scores are filtered out from competitive matches.',
  },
  {
    q: 'Can I host private games or invite only specific friends?',
    a: 'You can host open public matches or permanent recurring practice groups. When hosting, you can set the target skill level (Beginner, Intermediate, Pro) so only players matching the desired intensity show up.',
  },
  {
    q: 'Do I need to create an account just to look around?',
    a: 'No! You can open the live map and inspect all games in your city immediately as a guest. You will only be prompted to sign in when you decide to claim a player slot or host your own game.',
  },
];

export default function TestimonialsFAQ() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="py-20 relative bg-[#0D0D10] border-t border-[#2A2A2E]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Testimonials Section */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              PLAYER STORIES
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
              PLAYERS WHO STOPPED WAITING AND SHOWED UP
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Real athletes sharing how ShowUp transformed their weekly pickup routines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-primary/40 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center gap-1 text-primary mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{t.sport}</span>
                  </div>

                  <p className="text-sm text-cream/90 leading-relaxed italic mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#2A2A2E]/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-cream text-sm">
                      {t.author}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t.role}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    📍 {t.city}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              GOT QUESTIONS?
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-[#141418] border border-[#2A2A2E] rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-heading font-bold text-cream text-base hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-primary shrink-0">
                      {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-[#2A2A2E]/50 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA Banner */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-primary/15 via-[#1A1A1D] to-primary/10 border border-primary/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="font-heading font-black text-3xl sm:text-4xl text-cream tracking-tight">
              YOUR NEXT GAME STARTS RIGHT NOW.
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Don't spend another evening on the couch because your squad couldn't coordinate. Open the live map and play.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link href="/map" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-black text-base rounded-2xl h-14 px-8 shadow-[0_0_30px_rgba(232,255,71,0.35)] gap-2"
                >
                  <span>Explore Live Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/groups/create" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-[#2A2A2E] bg-[#141418] hover:bg-[#2A2A2E] text-cream font-bold text-base rounded-2xl h-14 px-7"
                >
                  Host A Match
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
