'use client';

import { useState, useEffect } from 'react';
import { GameGroup, SPORTS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Star, X } from 'lucide-react';
import Link from 'next/link';

interface GroupBottomSheetProps {
  group: GameGroup | null;
  onClose: () => void;
  userId: string | undefined;
  onJoinSuccess: (groupId: string) => void;
}

export default function GroupBottomSheet({ group, onClose, userId, onJoinSuccess }: GroupBottomSheetProps) {
  const supabase = createClient();
  const [isJoined, setIsJoined] = useState(false);
  const [checkingJoin, setCheckingJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (!group || !userId) return;

    setMemberCount(group.member_count || 1);
    setIsJoined(false);

    const checkMembership = async () => {
      setCheckingJoin(true);
      try {
        const { data, error } = await supabase
          .from('group_members')
          .select('status')
          .eq('group_id', group.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (data && data.status === 'accepted') {
          setIsJoined(true);
        }
      } catch (err) {
        console.error('Error checking membership:', err);
      } finally {
        setCheckingJoin(false);
      }
    };

    checkMembership();
  }, [group, userId, supabase]);

  if (!group) return null;

  const sportInfo = SPORTS.find((s) => s.id === group.sport);

  const handleJoin = async () => {
    if (!userId) {
      toast.error('You must be logged in to join a game');
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: userId,
        status: 'accepted',
      });

      if (error) {
        toast.error(error.message || 'Failed to join group');
      } else {
        toast.success(`Successfully joined the ${sportInfo?.name || 'game'}!`);
        setIsJoined(true);
        setMemberCount((prev) => prev + 1);
        onJoinSuccess(group.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setJoining(false);
    }
  };

  const formattedDate = new Date(group.scheduled_at).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = new Date(group.scheduled_at).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const openSlots = Math.max(0, group.max_players - memberCount);

  return (
    <AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 z-[1000] flex justify-center pointer-events-none p-4">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full max-w-lg bg-surface/95 backdrop-blur-xl border border-muted/80 rounded-3xl p-6 shadow-2xl pointer-events-auto relative overflow-hidden"
        >
          {/* Accent Line Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 pr-8">
            <div className="text-4xl p-3 bg-black/40 border border-muted rounded-2xl">
              {sportInfo?.emoji || '⚽'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-xl font-extrabold text-cream">
                  {sportInfo?.name || 'Sports Match'}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {group.skill_level}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">Hosted by</span>
                <span className="text-xs font-semibold text-cream">
                  {group.host_name || 'Player'}
                </span>
                <div className="flex items-center gap-0.5 ml-1 text-primary">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold">4.8</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-muted my-4" />

          {/* Details list */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/30 border border-muted text-muted-foreground">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm font-semibold text-cream">
                  {formattedDate}, {formattedTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/30 border border-muted text-muted-foreground">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spots open</p>
                <p className="text-sm font-semibold text-cream">
                  {openSlots} slots ({memberCount}/{group.max_players})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 col-span-2">
              <div className="p-2 rounded-xl bg-black/30 border border-muted text-muted-foreground shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-semibold text-cream truncate">
                  {group.location_name || 'Selected Map Point'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isJoined ? (
              <Link href={`/groups/${group.id}`} className="flex-1">
                <Button className="w-full h-12 bg-primary text-primary-foreground font-bold hover:bg-primary/95 rounded-xl">
                  Open Group Chat
                </Button>
              </Link>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining || checkingJoin || openSlots === 0}
                className="flex-1 h-12 bg-primary text-primary-foreground font-bold hover:bg-primary/95 rounded-xl disabled:opacity-50"
              >
                {joining ? 'Joining...' : openSlots === 0 ? 'Group is Full' : 'Join Game'}
              </Button>
            )}
            <Link href={`/groups/${group.id}`} className="shrink-0">
              <Button variant="outline" className="h-12 border-muted hover:bg-muted text-cream font-bold px-4 rounded-xl">
                Details
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
