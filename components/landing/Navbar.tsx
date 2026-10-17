'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Zap, Menu, X, MapPin, Plus, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-[#2A2A2E]/80 shadow-2xl py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(232,255,71,0.25)]">
              <Zap className="w-5 h-5 fill-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-xl text-cream tracking-tight flex items-center gap-1">
                ShowUp
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest -mt-1 font-semibold">
                Sports Social
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/map"
              className="text-cream/80 hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Compass className="w-4 h-4 text-primary" />
              Live Map
            </Link>
            <Link
              href="#how-it-works"
              className="text-cream/70 hover:text-cream transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#sports"
              className="text-cream/70 hover:text-cream transition-colors"
            >
              Sports
            </Link>
            <Link
              href="#features"
              className="text-cream/70 hover:text-cream transition-colors"
            >
              Features
            </Link>
            <Link
              href="#cities"
              className="text-cream/70 hover:text-cream transition-colors"
            >
              Cities
            </Link>
          </div>

          {/* Desktop CTA Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-cream hover:text-primary hover:bg-[#1A1A1D] rounded-xl font-semibold px-4 h-10 text-sm"
              >
                Sign In
              </Button>
            </Link>

            <Link href="/groups/create">
              <Button
                variant="outline"
                className="border-[#2A2A2E] bg-[#1A1A1D]/80 hover:border-primary/50 text-cream rounded-xl font-semibold gap-1.5 h-10 text-sm"
              >
                <Plus className="w-4 h-4 text-primary" />
                Host Game
              </Button>
            </Link>

            <Link href="/map">
              <Button
                className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl px-5 h-10 text-sm shadow-[0_0_20px_rgba(232,255,71,0.25)] transition-all hover:scale-[1.02]"
              >
                <MapPin className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Open Map
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/map">
              <Button
                size="sm"
                className="bg-primary text-black font-bold rounded-xl text-xs px-3 h-8 shadow-[0_0_12px_rgba(232,255,71,0.25)]"
              >
                Map
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-cream hover:text-primary focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0B]/98 backdrop-blur-2xl border-b border-[#2A2A2E] px-4 pt-4 pb-6 space-y-4"
          >
            <div className="flex flex-col space-y-3 font-medium text-base">
              <Link
                href="/map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-primary font-bold"
              >
                <Compass className="w-5 h-5 text-primary" />
                Live Pickup Map
              </Link>
              <Link
                href="/groups/create"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-cream hover:text-primary"
              >
                <Plus className="w-5 h-5 text-primary" />
                Host a Match
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-cream/80 hover:text-cream"
              >
                How It Works
              </Link>
              <Link
                href="#sports"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-cream/80 hover:text-cream"
              >
                Supported Sports
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-cream/80 hover:text-cream"
              >
                Features
              </Link>
              <Link
                href="#cities"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-cream/80 hover:text-cream"
              >
                Available Cities
              </Link>
              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-cream/80 hover:text-cream"
              >
                Notifications
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-cream/80 hover:text-cream"
              >
                Player Profile
              </Link>
            </div>

            <div className="pt-4 border-t border-[#2A2A2E] flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-[#2A2A2E] bg-[#1A1A1D] text-cream font-semibold rounded-xl h-11"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/map" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  className="w-full bg-primary text-black font-bold rounded-xl h-11 shadow-[0_0_20px_rgba(232,255,71,0.25)]"
                >
                  Launch Live Map
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
