'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  Trophy, 
  Users, 
  ArrowLeft, 
  LogOut, 
  Edit3, 
  ShieldCheck, 
  Plus, 
  Compass,
  Zap,
  Activity
} from 'lucide-react';
import { SPORTS, Sport } from '@/types';

export default function ProfileHomePage() {
  const router = useRouter();
  const { sessionUser, user, loading: authLoading, signOut } = useAuth();
  const supabase = createClient();

  const [stats, setStats] = useState({
    gamesHosted: 0,
    gamesJoined: 0,
    friendsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!sessionUser) return;

    const loadUserStats = async () => {
      setLoadingStats(true);
      try {
        // Count games hosted
        const { count: hostedCount } = await supabase
          .from('game_groups')
          .select('*', { count: 'exact', head: true })
          .eq('host_id', sessionUser.id);

        // Count games joined
        const { count: joinedCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', sessionUser.id);

        // Count friendships
        const { count: friendsCount } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .or(`user_a.eq.${sessionUser.id},user_b.eq.${sessionUser.id}`)
          .eq('status', 'accepted');

        setStats({
          gamesHosted: hostedCount || 0,
          gamesJoined: joinedCount || 0,
          friendsCount: friendsCount || 0,
        });
      } catch (err) {
        console.warn('Error fetching stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadUserStats();
  }, [sessionUser, supabase]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-cream space-y-4">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Loading Profile...
        </p>
      </div>
    );
  }

  // Guest View
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-cream flex flex-col">
        {/* Top Bar */}
        <header className="border-b border-[#2A2A2E] bg-[#111114]/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
          <Link href="/map" className="flex items-center gap-1.5 text-cream hover:text-primary font-semibold text-sm">
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span>Back to Map</span>
          </Link>
          <span className="font-heading font-black text-sm text-cream">Player Profile</span>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-cream text-xs">
              Home
            </Button>
          </Link>
        </header>

        <div className="max-w-md w-full mx-auto my-auto p-6 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 mx-auto flex items-center justify-center text-primary shadow-[0_0_25px_rgba(232,255,71,0.2)]">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-3xl text-cream">
              Guest Player
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are currently browsing ShowUp without an account. Sign in with Google or Phone to save your game history, rate players, and host matches.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Link href="/login" className="block w-full">
              <Button className="w-full h-12 bg-primary text-black hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_20px_rgba(232,255,71,0.3)]">
                Sign In / Register
              </Button>
            </Link>

            <Link href="/map" className="block w-full">
              <Button variant="outline" className="w-full h-12 border-[#2A2A2E] bg-[#141418] text-cream hover:border-primary/50 font-bold rounded-xl">
                Browse Live Map
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Profile View
  const displayName = user?.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Player';
  const displayCity = user?.city || 'India';
  const preferredSports = user?.preferred_sports || [];

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
          <span className="font-heading font-black text-base text-cream">My Profile</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile/edit">
            <Button size="sm" variant="outline" className="border-[#2A2A2E] bg-[#141418] hover:border-primary/50 text-cream gap-1.5 h-9 rounded-xl text-xs font-bold">
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span>Edit</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={signOut}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 rounded-xl text-xs font-bold gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Profile Hero Card */}
        <div className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-primary/40 bg-black flex items-center justify-center text-4xl sm:text-5xl font-black text-primary shadow-[0_0_20px_rgba(232,255,71,0.2)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-black" title="Online" />
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="font-heading font-black text-2xl sm:text-3xl text-cream">
                    {displayName}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {displayCity}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold mx-auto sm:mx-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Player
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-1">
                Account ID: <span className="font-mono text-cream/70">{sessionUser.id.slice(0, 12)}...</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 pt-6 border-t border-[#2A2A2E]">
            <div className="bg-[#1A1A1D]/80 rounded-2xl p-4 text-center border border-[#2A2A2E]/60">
              <p className="font-heading font-black text-2xl sm:text-3xl text-primary">
                {stats.gamesJoined}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Games Joined</p>
            </div>

            <div className="bg-[#1A1A1D]/80 rounded-2xl p-4 text-center border border-[#2A2A2E]/60">
              <p className="font-heading font-black text-2xl sm:text-3xl text-cream">
                {stats.gamesHosted}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Games Hosted</p>
            </div>

            <Link href="/profile/friends" className="block">
              <div className="bg-[#1A1A1D]/80 hover:bg-[#222227] rounded-2xl p-4 text-center border border-[#2A2A2E]/60 transition-colors">
                <p className="font-heading font-black text-2xl sm:text-3xl text-emerald-400">
                  {stats.friendsCount}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Friends List →</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Favorite Sports */}
        <div className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-cream flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Preferred Sports
            </h3>
            <Link href="/profile/edit">
              <span className="text-xs font-bold text-primary hover:underline">Update</span>
            </Link>
          </div>

          {preferredSports.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No sports selected yet. Pick your sports to get notified of matches nearby.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {preferredSports.map((sportId) => {
                const sport = SPORTS.find((s) => s.id === sportId);
                return (
                  <div
                    key={sportId}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E]"
                  >
                    <span className="text-2xl">{sport?.emoji || '⚽'}</span>
                    <div>
                      <p className="font-bold text-sm text-cream capitalize">
                        {sport?.name || sportId}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Active player</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Route Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/map" className="block">
            <Button className="w-full h-14 bg-primary text-black hover:bg-primary/90 font-bold rounded-2xl text-base gap-2 shadow-[0_0_20px_rgba(232,255,71,0.25)]">
              <Compass className="w-5 h-5 stroke-[2.5]" />
              <span>Explore Live Map</span>
            </Button>
          </Link>

          <Link href="/groups/create" className="block">
            <Button variant="outline" className="w-full h-14 border-[#2A2A2E] bg-[#141418] hover:bg-[#1A1A1D] text-cream hover:text-primary font-bold rounded-2xl text-base gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Host A Game</span>
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}