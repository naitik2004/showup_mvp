'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, Bell, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapHeaderProps {
  userId?: string;
}

export default function MapHeader({ userId }: MapHeaderProps) {
  return (
    <header className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
      {/* Left: Back to Home & Logo */}
      <div className="pointer-events-auto flex items-center gap-2">
        <Link href="/">
          <Button
            size="sm"
            variant="outline"
            className="h-10 px-3 bg-[#111114]/90 backdrop-blur-md border-[#2A2A2E] hover:border-primary/50 text-cream rounded-xl shadow-lg gap-1.5 font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>

        <Link
          href="/"
          className="h-10 px-3.5 bg-[#111114]/90 backdrop-blur-md border border-[#2A2A2E] rounded-xl flex items-center gap-2 shadow-lg hover:border-primary/50 transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <Zap className="w-3.5 h-3.5 fill-primary" />
          </div>
          <span className="font-heading font-black text-sm text-cream tracking-tight hidden sm:inline">
            ShowUp
          </span>
        </Link>
      </div>

      {/* Right: Quick App Links */}
      <div className="pointer-events-auto flex items-center gap-2">
        <Link href="/groups/create">
          <Button
            size="sm"
            className="h-10 px-3.5 bg-primary text-black hover:bg-primary/90 rounded-xl font-bold text-xs gap-1.5 shadow-[0_0_15px_rgba(232,255,71,0.25)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Host Game</span>
          </Button>
        </Link>

        <Link href="/notifications">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 bg-[#111114]/90 backdrop-blur-md border-[#2A2A2E] hover:border-primary/50 text-cream rounded-xl shadow-lg relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </Button>
        </Link>

        <Link href="/profile">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 bg-[#111114]/90 backdrop-blur-md border-[#2A2A2E] hover:border-primary/50 text-cream rounded-xl shadow-lg"
            aria-label="Profile"
          >
            <User className="w-4 h-4 text-primary" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
